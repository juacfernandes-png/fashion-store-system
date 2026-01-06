import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Store Units", () => {
  it("should list store units for authenticated users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.storeUnits.list({});
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow admin to create store unit", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // This will attempt to create but may fail due to DB constraints
    // The important thing is it doesn't throw FORBIDDEN
    try {
      await caller.storeUnits.create({
        code: "TEST001",
        name: "Test Store",
        type: "STORE",
      });
    } catch (error: any) {
      // Database errors are expected, but not FORBIDDEN
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });

  it("should deny non-admin from creating store unit", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.storeUnits.create({
        code: "TEST002",
        name: "Test Store 2",
        type: "STORE",
      })
    ).rejects.toThrow("Acesso negado");
  });
});

describe("Stock Transfers", () => {
  it("should list transfers for authenticated users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transfers.list({});
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should deny non-admin from creating transfer", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.transfers.create({
        fromUnitId: 1,
        toUnitId: 2,
        items: [{ productId: 1, requestedQuantity: 10 }],
      })
    ).rejects.toThrow("Acesso negado");
  });
});

describe("Returns", () => {
  it("should list returns for authenticated users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.returns.list({});
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should deny non-admin from creating return", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.returns.create({
        type: "RETURN",
        reason: "DEFECT",
        items: [{ productId: 1, quantity: 1, unitPrice: "100.00", condition: "USED" }],
      })
    ).rejects.toThrow("Acesso negado");
  });
});

describe("Barcode Lookup", () => {
  it("should return null for non-existent barcode", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.barcode.lookup({ barcode: "NONEXISTENT123" });
    
    expect(result).toBeNull();
  });
});

describe("Multi-Unit Dashboard", () => {
  it("should return dashboard stats for authenticated users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.multiUnit({});
    
    expect(result).toBeDefined();
    if (result) {
      expect(result).toHaveProperty("units");
      expect(result).toHaveProperty("totalStock");
      expect(result).toHaveProperty("totalValue");
      expect(result).toHaveProperty("pendingTransfersCount");
      expect(result).toHaveProperty("inTransitTransfersCount");
      expect(result).toHaveProperty("pendingReturnsCount");
    }
  });
});

describe("Unit Stock Movements", () => {
  it("should list movements for authenticated users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.unitMovements.list({});
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should deny non-admin from creating movement", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.unitMovements.create({
        unitId: 1,
        productId: 1,
        type: "IN",
        reason: "PURCHASE",
        quantity: 10,
      })
    ).rejects.toThrow("Acesso negado");
  });
});
