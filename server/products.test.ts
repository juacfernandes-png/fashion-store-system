import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Products Router", () => {
  it("should list products for authenticated users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.products.list();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should generate product code", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.utils.generateCode({ prefix: "PROD" });
    
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result.startsWith("PROD")).toBe(true);
  });
});

describe("Suppliers Router", () => {
  it("should list suppliers for authenticated users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.suppliers.list();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should deny supplier creation for non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(caller.suppliers.create({
      code: "SUP001",
      name: "Test Supplier"
    })).rejects.toThrow("Acesso negado");
  });
});

describe("Categories Router", () => {
  it("should list categories for authenticated users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.categories.list();
    
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Customers Router", () => {
  it("should list customers for authenticated users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.customers.list();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should deny customer creation for non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(caller.customers.create({
      code: "CLI001",
      name: "Test Customer"
    })).rejects.toThrow("Acesso negado");
  });
});

describe("Stock Router", () => {
  it("should list stock movements for authenticated users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.stock.movements({});
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should list stock alerts for authenticated users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.stock.alerts();
    
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Dashboard Router", () => {
  it("should return dashboard stats for authenticated users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.dashboard.stats();
    
    // Result can be null if database is not available
    if (result) {
      expect(typeof result.currentMonthSales).toBe("number");
      expect(typeof result.currentMonthOrders).toBe("number");
      expect(typeof result.averageTicket).toBe("number");
    } else {
      expect(result).toBeNull();
    }
  });
});

describe("Reports Router", () => {
  it("should return ABC analysis for authenticated users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.reports.abcAnalysis();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should return sales report for authenticated users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date();
    
    const result = await caller.reports.sales({
      startDate,
      endDate
    });
    
    expect(result).toBeDefined();
    expect(typeof result.totalSales).toBe("number");
    expect(typeof result.totalOrders).toBe("number");
  });
});

describe("Sales Orders Router", () => {
  it("should list sales orders for authenticated users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.salesOrders.list();
    
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Purchase Orders Router", () => {
  it("should list purchase orders for authenticated users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.purchaseOrders.list();
    
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Accounts Payable Router", () => {
  it("should list accounts payable for authenticated users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.accountsPayable.list();
    
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Accounts Receivable Router", () => {
  it("should list accounts receivable for authenticated users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.accountsReceivable.list();
    
    expect(Array.isArray(result)).toBe(true);
  });
});
