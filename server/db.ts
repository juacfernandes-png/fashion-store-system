import { eq, desc, asc, sql, and, gte, lte, like, or, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  suppliers, InsertSupplier, Supplier,
  categories, InsertCategory, Category,
  products, InsertProduct, Product,
  productVariants, InsertProductVariant, ProductVariant,
  productImages, InsertProductImage, ProductImage,
  customers, InsertCustomer, Customer,
  stockMovements, InsertStockMovement, StockMovement,
  purchaseOrders, InsertPurchaseOrder, PurchaseOrder,
  purchaseOrderItems, InsertPurchaseOrderItem, PurchaseOrderItem,
  salesOrders, InsertSalesOrder, SalesOrder,
  salesOrderItems, InsertSalesOrderItem, SalesOrderItem,
  accountsPayable, InsertAccountPayable, AccountPayable,
  accountsReceivable, InsertAccountReceivable, AccountReceivable,
  financialTransactions, InsertFinancialTransaction, FinancialTransaction,
  stockAlerts, InsertStockAlert, StockAlert,
  storeUnits, InsertStoreUnit, StoreUnit,
  unitStock, InsertUnitStock, UnitStock,
  stockTransfers, InsertStockTransfer, StockTransfer,
  stockTransferItems, InsertStockTransferItem, StockTransferItem,
  returns, InsertReturn, Return,
  returnItems, InsertReturnItem, ReturnItem,
  unitStockMovements, InsertUnitStockMovement, UnitStockMovement,
  stockTurnover, InsertStockTurnover, StockTurnover
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER FUNCTIONS ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== SUPPLIER FUNCTIONS ====================
export async function createSupplier(data: InsertSupplier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(suppliers).values(data);
  return getSupplierByCode(data.code);
}

export async function updateSupplier(id: number, data: Partial<InsertSupplier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(suppliers).set(data).where(eq(suppliers.id, id));
  return getSupplierById(id);
}

export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result[0];
}

export async function getSupplierByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(suppliers).where(eq(suppliers.code, code)).limit(1);
  return result[0];
}

export async function listSuppliers(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(asc(suppliers.name));
  }
  return db.select().from(suppliers).orderBy(asc(suppliers.name));
}

export async function deleteSupplier(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(suppliers).set({ isActive: false }).where(eq(suppliers.id, id));
}

// ==================== CATEGORY FUNCTIONS ====================
export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(categories).values(data);
  const result = await db.select().from(categories).where(eq(categories.name, data.name)).limit(1);
  return result[0];
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set(data).where(eq(categories.id, id));
  return getCategoryById(id);
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0];
}

export async function listCategories(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.name));
  }
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set({ isActive: false }).where(eq(categories.id, id));
}

// ==================== PRODUCT FUNCTIONS ====================
export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(products).values(data);
  return getProductByCode(data.code);
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(data).where(eq(products.id, id));
  return getProductById(id);
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function getProductByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.code, code)).limit(1);
  return result[0];
}

export async function listProducts(filters?: { categoryId?: number; supplierId?: number; activeOnly?: boolean; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters?.activeOnly !== false) {
    conditions.push(eq(products.isActive, true));
  }
  if (filters?.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }
  if (filters?.supplierId) {
    conditions.push(eq(products.supplierId, filters.supplierId));
  }
  if (filters?.search) {
    conditions.push(or(
      like(products.name, `%${filters.search}%`),
      like(products.code, `%${filters.search}%`)
    ));
  }
  
  if (conditions.length > 0) {
    return db.select().from(products).where(and(...conditions)).orderBy(asc(products.name));
  }
  return db.select().from(products).orderBy(asc(products.name));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set({ isActive: false }).where(eq(products.id, id));
}

export async function updateProductStock(id: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set({ currentStock: quantity }).where(eq(products.id, id));
}

// ==================== PRODUCT VARIANT FUNCTIONS ====================
export async function createProductVariant(data: InsertProductVariant) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(productVariants).values(data);
  const result = await db.select().from(productVariants).where(eq(productVariants.sku, data.sku)).limit(1);
  return result[0];
}

export async function updateProductVariant(id: number, data: Partial<InsertProductVariant>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(productVariants).set(data).where(eq(productVariants.id, id));
  return getProductVariantById(id);
}

export async function getProductVariantById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(productVariants).where(eq(productVariants.id, id)).limit(1);
  return result[0];
}

export async function listProductVariants(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productVariants)
    .where(and(eq(productVariants.productId, productId), eq(productVariants.isActive, true)))
    .orderBy(asc(productVariants.size), asc(productVariants.color));
}

export async function deleteProductVariant(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(productVariants).set({ isActive: false }).where(eq(productVariants.id, id));
}

// ==================== PRODUCT IMAGE FUNCTIONS ====================
export async function createProductImage(data: InsertProductImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(productImages).values(data);
  const result = await db.select().from(productImages).where(eq(productImages.fileKey, data.fileKey)).limit(1);
  return result[0];
}

export async function listProductImages(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder));
}

export async function deleteProductImage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productImages).where(eq(productImages.id, id));
}

export async function setPrimaryImage(productId: number, imageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(productImages).set({ isPrimary: false }).where(eq(productImages.productId, productId));
  await db.update(productImages).set({ isPrimary: true }).where(eq(productImages.id, imageId));
}

// ==================== CUSTOMER FUNCTIONS ====================
export async function createCustomer(data: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(customers).values(data);
  return getCustomerByCode(data.code);
}

export async function updateCustomer(id: number, data: Partial<InsertCustomer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customers).set(data).where(eq(customers.id, id));
  return getCustomerById(id);
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result[0];
}

export async function getCustomerByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.code, code)).limit(1);
  return result[0];
}

export async function listCustomers(filters?: { segment?: string; activeOnly?: boolean; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters?.activeOnly !== false) {
    conditions.push(eq(customers.isActive, true));
  }
  if (filters?.segment) {
    conditions.push(eq(customers.segment, filters.segment as any));
  }
  if (filters?.search) {
    conditions.push(or(
      like(customers.name, `%${filters.search}%`),
      like(customers.email, `%${filters.search}%`),
      like(customers.code, `%${filters.search}%`)
    ));
  }
  
  if (conditions.length > 0) {
    return db.select().from(customers).where(and(...conditions)).orderBy(asc(customers.name));
  }
  return db.select().from(customers).orderBy(asc(customers.name));
}

export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customers).set({ isActive: false }).where(eq(customers.id, id));
}

export async function updateCustomerPurchaseStats(customerId: number, orderTotal: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const customer = await getCustomerById(customerId);
  if (!customer) return;
  
  const newTotal = parseFloat(customer.totalPurchases) + orderTotal;
  const newCount = customer.purchaseCount + 1;
  
  let newSegment = customer.segment;
  if (newTotal >= 10000) newSegment = "VIP";
  else if (newCount >= 5) newSegment = "REGULAR";
  
  await db.update(customers).set({
    totalPurchases: newTotal.toFixed(2),
    purchaseCount: newCount,
    lastPurchaseAt: new Date(),
    segment: newSegment
  }).where(eq(customers.id, customerId));
}

// ==================== STOCK MOVEMENT FUNCTIONS ====================
export async function createStockMovement(data: InsertStockMovement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const product = await getProductById(data.productId);
  if (!product) throw new Error("Product not found");
  
  const previousStock = product.currentStock;
  let newStock = previousStock;
  
  if (data.type === "IN") {
    newStock = previousStock + data.quantity;
  } else if (data.type === "OUT") {
    newStock = previousStock - data.quantity;
  } else {
    newStock = data.newStock;
  }
  
  await db.insert(stockMovements).values({
    ...data,
    previousStock,
    newStock
  });
  
  await updateProductStock(data.productId, newStock);
  
  // Check for stock alerts
  await checkAndCreateStockAlert(data.productId, newStock);
  
  return { previousStock, newStock };
}

export async function listStockMovements(filters?: { productId?: number; type?: string; startDate?: Date; endDate?: Date }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters?.productId) {
    conditions.push(eq(stockMovements.productId, filters.productId));
  }
  if (filters?.type) {
    conditions.push(eq(stockMovements.type, filters.type as any));
  }
  if (filters?.startDate) {
    conditions.push(gte(stockMovements.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(stockMovements.createdAt, filters.endDate));
  }
  
  if (conditions.length > 0) {
    return db.select().from(stockMovements).where(and(...conditions)).orderBy(desc(stockMovements.createdAt));
  }
  return db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt)).limit(500);
}

// ==================== PURCHASE ORDER FUNCTIONS ====================
export async function createPurchaseOrder(data: InsertPurchaseOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(purchaseOrders).values(data);
  return getPurchaseOrderByNumber(data.orderNumber);
}

export async function updatePurchaseOrder(id: number, data: Partial<InsertPurchaseOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(purchaseOrders).set(data).where(eq(purchaseOrders.id, id));
  return getPurchaseOrderById(id);
}

export async function getPurchaseOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  return result[0];
}

export async function getPurchaseOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(purchaseOrders).where(eq(purchaseOrders.orderNumber, orderNumber)).limit(1);
  return result[0];
}

export async function listPurchaseOrders(filters?: { supplierId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters?.supplierId) {
    conditions.push(eq(purchaseOrders.supplierId, filters.supplierId));
  }
  if (filters?.status) {
    conditions.push(eq(purchaseOrders.status, filters.status as any));
  }
  
  if (conditions.length > 0) {
    return db.select().from(purchaseOrders).where(and(...conditions)).orderBy(desc(purchaseOrders.createdAt));
  }
  return db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
}

export async function createPurchaseOrderItem(data: InsertPurchaseOrderItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(purchaseOrderItems).values(data);
}

export async function listPurchaseOrderItems(purchaseOrderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
}

export async function receivePurchaseOrder(orderId: number, items: { itemId: number; receivedQuantity: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  for (const item of items) {
    const orderItem = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.id, item.itemId)).limit(1);
    if (orderItem[0]) {
      await db.update(purchaseOrderItems).set({ receivedQuantity: item.receivedQuantity }).where(eq(purchaseOrderItems.id, item.itemId));
      
      // Create stock movement
      await createStockMovement({
        productId: orderItem[0].productId,
        variantId: orderItem[0].variantId,
        type: "IN",
        reason: "PURCHASE",
        quantity: item.receivedQuantity,
        previousStock: 0,
        newStock: 0,
        unitCost: orderItem[0].unitCost,
        totalCost: (parseFloat(orderItem[0].unitCost) * item.receivedQuantity).toFixed(2),
        referenceId: orderId,
        referenceType: "PURCHASE_ORDER"
      });
    }
  }
  
  await db.update(purchaseOrders).set({ status: "RECEIVED", receivedDate: new Date() }).where(eq(purchaseOrders.id, orderId));
}

// ==================== SALES ORDER FUNCTIONS ====================
export async function createSalesOrder(data: InsertSalesOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(salesOrders).values(data);
  return getSalesOrderByNumber(data.orderNumber);
}

export async function updateSalesOrder(id: number, data: Partial<InsertSalesOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(salesOrders).set(data).where(eq(salesOrders.id, id));
  return getSalesOrderById(id);
}

export async function getSalesOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(salesOrders).where(eq(salesOrders.id, id)).limit(1);
  return result[0];
}

export async function getSalesOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(salesOrders).where(eq(salesOrders.orderNumber, orderNumber)).limit(1);
  return result[0];
}

export async function listSalesOrders(filters?: { customerId?: number; status?: string; startDate?: Date; endDate?: Date }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters?.customerId) {
    conditions.push(eq(salesOrders.customerId, filters.customerId));
  }
  if (filters?.status) {
    conditions.push(eq(salesOrders.status, filters.status as any));
  }
  if (filters?.startDate) {
    conditions.push(gte(salesOrders.orderDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(salesOrders.orderDate, filters.endDate));
  }
  
  if (conditions.length > 0) {
    return db.select().from(salesOrders).where(and(...conditions)).orderBy(desc(salesOrders.createdAt));
  }
  return db.select().from(salesOrders).orderBy(desc(salesOrders.createdAt));
}

export async function createSalesOrderItem(data: InsertSalesOrderItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(salesOrderItems).values(data);
}

export async function listSalesOrderItems(salesOrderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesOrderItems).where(eq(salesOrderItems.salesOrderId, salesOrderId));
}

export async function confirmSalesOrder(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const items = await listSalesOrderItems(orderId);
  const order = await getSalesOrderById(orderId);
  
  for (const item of items) {
    await createStockMovement({
      productId: item.productId,
      variantId: item.variantId,
      type: "OUT",
      reason: "SALE",
      quantity: item.quantity,
      previousStock: 0,
      newStock: 0,
      unitCost: item.unitPrice,
      totalCost: item.totalPrice,
      referenceId: orderId,
      referenceType: "SALES_ORDER"
    });
  }
  
  if (order?.customerId) {
    await updateCustomerPurchaseStats(order.customerId, parseFloat(order.total));
  }
  
  await db.update(salesOrders).set({ status: "CONFIRMED" }).where(eq(salesOrders.id, orderId));
}

// ==================== ACCOUNTS PAYABLE FUNCTIONS ====================
export async function createAccountPayable(data: InsertAccountPayable) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(accountsPayable).values(data);
  const result = await db.select().from(accountsPayable).orderBy(desc(accountsPayable.id)).limit(1);
  return result[0];
}

export async function updateAccountPayable(id: number, data: Partial<InsertAccountPayable>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(accountsPayable).set(data).where(eq(accountsPayable.id, id));
  return getAccountPayableById(id);
}

export async function getAccountPayableById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(accountsPayable).where(eq(accountsPayable.id, id)).limit(1);
  return result[0];
}

export async function listAccountsPayable(filters?: { status?: string; startDate?: Date; endDate?: Date }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(accountsPayable.status, filters.status as any));
  }
  if (filters?.startDate) {
    conditions.push(gte(accountsPayable.dueDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(accountsPayable.dueDate, filters.endDate));
  }
  
  if (conditions.length > 0) {
    return db.select().from(accountsPayable).where(and(...conditions)).orderBy(asc(accountsPayable.dueDate));
  }
  return db.select().from(accountsPayable).orderBy(asc(accountsPayable.dueDate));
}

export async function payAccountPayable(id: number, amount: number, paymentMethod: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const account = await getAccountPayableById(id);
  if (!account) throw new Error("Account not found");
  
  const newPaidAmount = parseFloat(account.paidAmount) + amount;
  const totalAmount = parseFloat(account.amount);
  
  let newStatus: "PENDING" | "PARTIAL" | "PAID" = "PARTIAL";
  if (newPaidAmount >= totalAmount) {
    newStatus = "PAID";
  }
  
  await db.update(accountsPayable).set({
    paidAmount: newPaidAmount.toFixed(2),
    status: newStatus,
    paidDate: newStatus === "PAID" ? new Date() : null,
    paymentMethod: paymentMethod as any
  }).where(eq(accountsPayable.id, id));
  
  // Create financial transaction
  await createFinancialTransaction({
    type: "EXPENSE",
    category: account.category,
    description: account.description,
    amount: amount.toFixed(2),
    transactionDate: new Date(),
    referenceId: id,
    referenceType: "ACCOUNT_PAYABLE"
  });
}

// ==================== ACCOUNTS RECEIVABLE FUNCTIONS ====================
export async function createAccountReceivable(data: InsertAccountReceivable) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(accountsReceivable).values(data);
  const result = await db.select().from(accountsReceivable).orderBy(desc(accountsReceivable.id)).limit(1);
  return result[0];
}

export async function updateAccountReceivable(id: number, data: Partial<InsertAccountReceivable>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(accountsReceivable).set(data).where(eq(accountsReceivable.id, id));
  return getAccountReceivableById(id);
}

export async function getAccountReceivableById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(accountsReceivable).where(eq(accountsReceivable.id, id)).limit(1);
  return result[0];
}

export async function listAccountsReceivable(filters?: { status?: string; startDate?: Date; endDate?: Date }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(accountsReceivable.status, filters.status as any));
  }
  if (filters?.startDate) {
    conditions.push(gte(accountsReceivable.dueDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(accountsReceivable.dueDate, filters.endDate));
  }
  
  if (conditions.length > 0) {
    return db.select().from(accountsReceivable).where(and(...conditions)).orderBy(asc(accountsReceivable.dueDate));
  }
  return db.select().from(accountsReceivable).orderBy(asc(accountsReceivable.dueDate));
}

export async function receiveAccountReceivable(id: number, amount: number, paymentMethod: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const account = await getAccountReceivableById(id);
  if (!account) throw new Error("Account not found");
  
  const newReceivedAmount = parseFloat(account.receivedAmount) + amount;
  const totalAmount = parseFloat(account.amount);
  
  let newStatus: "PENDING" | "PARTIAL" | "RECEIVED" = "PARTIAL";
  if (newReceivedAmount >= totalAmount) {
    newStatus = "RECEIVED";
  }
  
  await db.update(accountsReceivable).set({
    receivedAmount: newReceivedAmount.toFixed(2),
    status: newStatus,
    receivedDate: newStatus === "RECEIVED" ? new Date() : null,
    paymentMethod: paymentMethod as any
  }).where(eq(accountsReceivable.id, id));
  
  // Create financial transaction
  await createFinancialTransaction({
    type: "INCOME",
    category: "SALES",
    description: account.description,
    amount: amount.toFixed(2),
    transactionDate: new Date(),
    referenceId: id,
    referenceType: "ACCOUNT_RECEIVABLE"
  });
}

// ==================== FINANCIAL TRANSACTION FUNCTIONS ====================
export async function createFinancialTransaction(data: InsertFinancialTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(financialTransactions).values(data);
  const result = await db.select().from(financialTransactions).orderBy(desc(financialTransactions.id)).limit(1);
  return result[0];
}

export async function listFinancialTransactions(filters?: { type?: string; startDate?: Date; endDate?: Date; isReconciled?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters?.type) {
    conditions.push(eq(financialTransactions.type, filters.type as any));
  }
  if (filters?.startDate) {
    conditions.push(gte(financialTransactions.transactionDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(financialTransactions.transactionDate, filters.endDate));
  }
  if (filters?.isReconciled !== undefined) {
    conditions.push(eq(financialTransactions.isReconciled, filters.isReconciled));
  }
  
  if (conditions.length > 0) {
    return db.select().from(financialTransactions).where(and(...conditions)).orderBy(desc(financialTransactions.transactionDate));
  }
  return db.select().from(financialTransactions).orderBy(desc(financialTransactions.transactionDate));
}

export async function reconcileTransaction(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(financialTransactions).set({ isReconciled: true, reconciledAt: new Date() }).where(eq(financialTransactions.id, id));
}

// ==================== STOCK ALERT FUNCTIONS ====================
export async function checkAndCreateStockAlert(productId: number, currentStock: number) {
  const db = await getDb();
  if (!db) return;
  
  const product = await getProductById(productId);
  if (!product) return;
  
  let alertType: "LOW_STOCK" | "HIGH_STOCK" | "OUT_OF_STOCK" | null = null;
  let threshold = 0;
  
  if (currentStock === 0) {
    alertType = "OUT_OF_STOCK";
    threshold = 0;
  } else if (currentStock <= product.minStock) {
    alertType = "LOW_STOCK";
    threshold = product.minStock;
  } else if (currentStock >= product.maxStock) {
    alertType = "HIGH_STOCK";
    threshold = product.maxStock;
  }
  
  if (alertType) {
    // Check if there's already an unread alert for this product
    const existingAlert = await db.select().from(stockAlerts)
      .where(and(
        eq(stockAlerts.productId, productId),
        eq(stockAlerts.alertType, alertType),
        eq(stockAlerts.isRead, false)
      )).limit(1);
    
    if (existingAlert.length === 0) {
      await db.insert(stockAlerts).values({
        productId,
        alertType,
        currentStock,
        threshold
      });
    }
  }
}

export async function listStockAlerts(unreadOnly = true) {
  const db = await getDb();
  if (!db) return [];
  
  if (unreadOnly) {
    return db.select().from(stockAlerts).where(eq(stockAlerts.isRead, false)).orderBy(desc(stockAlerts.createdAt));
  }
  return db.select().from(stockAlerts).orderBy(desc(stockAlerts.createdAt));
}

export async function markAlertAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(stockAlerts).set({ isRead: true }).where(eq(stockAlerts.id, id));
}

export async function markAlertAsNotified(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(stockAlerts).set({ isNotified: true, notifiedAt: new Date() }).where(eq(stockAlerts.id, id));
}

// ==================== REPORT FUNCTIONS ====================
export async function getInventoryReport() {
  const db = await getDb();
  if (!db) return { products: [], totalValue: 0, totalItems: 0 };
  
  const allProducts = await db.select().from(products).where(eq(products.isActive, true));
  
  let totalValue = 0;
  let totalItems = 0;
  
  const productsWithValue = allProducts.map(p => {
    const stockValue = p.currentStock * parseFloat(p.costPrice);
    totalValue += stockValue;
    totalItems += p.currentStock;
    return {
      ...p,
      stockValue
    };
  });
  
  return {
    products: productsWithValue,
    totalValue,
    totalItems
  };
}

export async function getLowStockProducts() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(products)
    .where(and(
      eq(products.isActive, true),
      sql`${products.currentStock} <= ${products.minStock}`
    ))
    .orderBy(asc(products.currentStock));
}

export async function getHighStockProducts() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(products)
    .where(and(
      eq(products.isActive, true),
      sql`${products.currentStock} >= ${products.maxStock}`
    ))
    .orderBy(desc(products.currentStock));
}

export async function getSalesReport(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { orders: [], totalSales: 0, totalOrders: 0, averageTicket: 0 };
  
  const orders = await db.select().from(salesOrders)
    .where(and(
      gte(salesOrders.orderDate, startDate),
      lte(salesOrders.orderDate, endDate),
      inArray(salesOrders.status, ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"])
    ))
    .orderBy(desc(salesOrders.orderDate));
  
  const totalSales = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
  const totalOrders = orders.length;
  const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
  
  return {
    orders,
    totalSales,
    totalOrders,
    averageTicket
  };
}

export async function getTopSellingProducts(startDate: Date, endDate: Date, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    productId: salesOrderItems.productId,
    totalQuantity: sql<number>`SUM(${salesOrderItems.quantity})`.as('totalQuantity'),
    totalRevenue: sql<number>`SUM(${salesOrderItems.totalPrice})`.as('totalRevenue')
  })
  .from(salesOrderItems)
  .innerJoin(salesOrders, eq(salesOrderItems.salesOrderId, salesOrders.id))
  .where(and(
    gte(salesOrders.orderDate, startDate),
    lte(salesOrders.orderDate, endDate),
    inArray(salesOrders.status, ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"])
  ))
  .groupBy(salesOrderItems.productId)
  .orderBy(sql`totalQuantity DESC`)
  .limit(limit);
  
  // Get product details
  const productIds = result.map(r => r.productId);
  if (productIds.length === 0) return [];
  
  const productDetails = await db.select().from(products).where(inArray(products.id, productIds));
  
  return result.map(r => ({
    ...r,
    product: productDetails.find(p => p.id === r.productId)
  }));
}

export async function getABCAnalysis() {
  const db = await getDb();
  if (!db) return [];
  
  // Get sales data for last 12 months
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);
  
  const salesData = await db.select({
    productId: salesOrderItems.productId,
    totalRevenue: sql<number>`SUM(${salesOrderItems.totalPrice})`.as('totalRevenue'),
    totalQuantity: sql<number>`SUM(${salesOrderItems.quantity})`.as('totalQuantity')
  })
  .from(salesOrderItems)
  .innerJoin(salesOrders, eq(salesOrderItems.salesOrderId, salesOrders.id))
  .where(and(
    gte(salesOrders.orderDate, startDate),
    inArray(salesOrders.status, ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"])
  ))
  .groupBy(salesOrderItems.productId)
  .orderBy(sql`totalRevenue DESC`);
  
  const totalRevenue = salesData.reduce((sum, s) => sum + Number(s.totalRevenue), 0);
  if (totalRevenue === 0) return [];
  
  // Get product details
  const productIds = salesData.map(s => s.productId);
  if (productIds.length === 0) return [];
  
  const productDetails = await db.select().from(products).where(inArray(products.id, productIds));
  
  let cumulativePercentage = 0;
  const result = salesData.map(item => {
    const percentage = (Number(item.totalRevenue) / totalRevenue) * 100;
    cumulativePercentage += percentage;
    
    let classType: 'A' | 'B' | 'C' = 'C';
    if (cumulativePercentage <= 80) {
      classType = 'A';
    } else if (cumulativePercentage <= 95) {
      classType = 'B';
    }
    
    const product = productDetails.find(p => p.id === item.productId);
    
    return {
      productId: item.productId,
      productName: product?.name || 'Produto não encontrado',
      quantity: Number(item.totalQuantity),
      revenue: Number(item.totalRevenue),
      percentage,
      cumulativePercentage,
      class: classType
    };
  });
  
  return result;
}

export async function getCashFlowReport(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { transactions: [], totalIncome: 0, totalExpense: 0, balance: 0 };
  
  const transactions = await listFinancialTransactions({ startDate, endDate });
  
  const totalIncome = transactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const balance = totalIncome - totalExpense;
  
  return {
    transactions,
    totalIncome,
    totalExpense,
    balance
  };
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  
  // Current month sales
  const currentMonthSales = await getSalesReport(startOfMonth, now);
  
  // Last month sales for comparison
  const lastMonthSales = await getSalesReport(startOfLastMonth, endOfLastMonth);
  
  // Inventory stats
  const inventory = await getInventoryReport();
  const lowStock = await getLowStockProducts();
  const highStock = await getHighStockProducts();
  
  // Pending accounts
  const pendingPayables = await listAccountsPayable({ status: "PENDING" });
  const pendingReceivables = await listAccountsReceivable({ status: "PENDING" });
  
  // Alerts
  const alerts = await listStockAlerts(true);
  
  // Calculate growth
  const salesGrowth = lastMonthSales.totalSales > 0 
    ? ((currentMonthSales.totalSales - lastMonthSales.totalSales) / lastMonthSales.totalSales) * 100 
    : 0;
  
  // Calculate profit margin (simplified)
  const allProducts = await listProducts();
  const avgMargin = allProducts.length > 0
    ? allProducts.reduce((sum, p) => {
        const margin = ((parseFloat(p.salePrice) - parseFloat(p.costPrice)) / parseFloat(p.salePrice)) * 100;
        return sum + margin;
      }, 0) / allProducts.length
    : 0;
  
  return {
    currentMonthSales: currentMonthSales.totalSales,
    currentMonthOrders: currentMonthSales.totalOrders,
    averageTicket: currentMonthSales.averageTicket,
    salesGrowth,
    inventoryValue: inventory.totalValue,
    inventoryItems: inventory.totalItems,
    lowStockCount: lowStock.length,
    highStockCount: highStock.length,
    pendingPayablesTotal: pendingPayables.reduce((sum, p) => sum + parseFloat(p.amount) - parseFloat(p.paidAmount), 0),
    pendingReceivablesTotal: pendingReceivables.reduce((sum, r) => sum + parseFloat(r.amount) - parseFloat(r.receivedAmount), 0),
    alertsCount: alerts.length,
    avgProfitMargin: avgMargin
  };
}

// ==================== UTILITY FUNCTIONS ====================
export async function generateOrderNumber(prefix: string) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function generateCode(prefix: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}${timestamp}`;
}


// ==================== STORE UNIT FUNCTIONS ====================
export async function createStoreUnit(data: InsertStoreUnit) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(storeUnits).values(data);
  return { id: result[0].insertId };
}

export async function updateStoreUnit(id: number, data: Partial<InsertStoreUnit>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(storeUnits).set(data).where(eq(storeUnits.id, id));
}

export async function getStoreUnitById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(storeUnits).where(eq(storeUnits.id, id)).limit(1);
  return result[0];
}

export async function listStoreUnits(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(storeUnits).where(eq(storeUnits.isActive, true)).orderBy(asc(storeUnits.name));
  }
  return db.select().from(storeUnits).orderBy(asc(storeUnits.name));
}

export async function deleteStoreUnit(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(storeUnits).set({ isActive: false }).where(eq(storeUnits.id, id));
}

// ==================== UNIT STOCK FUNCTIONS ====================
export async function getUnitStock(unitId: number, productId: number, variantId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const conditions = [eq(unitStock.unitId, unitId), eq(unitStock.productId, productId)];
  if (variantId) {
    conditions.push(eq(unitStock.variantId, variantId));
  }
  
  const result = await db.select().from(unitStock).where(and(...conditions)).limit(1);
  return result[0];
}

export async function upsertUnitStock(data: InsertUnitStock) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getUnitStock(data.unitId, data.productId, data.variantId ?? undefined);
  
  if (existing) {
    await db.update(unitStock).set({
      quantity: data.quantity,
      minStock: data.minStock,
      maxStock: data.maxStock,
      reservedQuantity: data.reservedQuantity,
      availableQuantity: (data.quantity ?? 0) - (data.reservedQuantity ?? 0),
      lastMovementAt: new Date()
    }).where(eq(unitStock.id, existing.id));
    return { id: existing.id };
  } else {
    const result = await db.insert(unitStock).values({
      ...data,
      availableQuantity: (data.quantity ?? 0) - (data.reservedQuantity ?? 0)
    });
    return { id: result[0].insertId };
  }
}

export async function listUnitStockByUnit(unitId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(unitStock).where(eq(unitStock.unitId, unitId));
}

export async function listUnitStockByProduct(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(unitStock).where(eq(unitStock.productId, productId));
}

export async function getConsolidatedStock(productId: number, variantId?: number) {
  const db = await getDb();
  if (!db) return { total: 0, byUnit: [] };
  
  const conditions = [eq(unitStock.productId, productId)];
  if (variantId) {
    conditions.push(eq(unitStock.variantId, variantId));
  }
  
  const stocks = await db.select().from(unitStock).where(and(...conditions));
  const units = await listStoreUnits();
  
  const byUnit = stocks.map(s => {
    const unit = units.find(u => u.id === s.unitId);
    return {
      ...s,
      unitName: unit?.name || 'Desconhecido',
      unitType: unit?.type || 'STORE'
    };
  });
  
  const total = stocks.reduce((sum, s) => sum + s.quantity, 0);
  
  return { total, byUnit };
}

// ==================== UNIT STOCK MOVEMENT FUNCTIONS ====================
export async function createUnitStockMovement(data: InsertUnitStockMovement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get current stock
  let currentStock = await getUnitStock(data.unitId, data.productId, data.variantId ?? undefined);
  const previousStock = currentStock?.quantity ?? 0;
  
  let newQuantity = previousStock;
  if (data.type === "IN") {
    newQuantity = previousStock + data.quantity;
  } else if (data.type === "OUT") {
    newQuantity = previousStock - data.quantity;
  } else {
    newQuantity = data.newStock;
  }
  
  // Update unit stock
  await upsertUnitStock({
    unitId: data.unitId,
    productId: data.productId,
    variantId: data.variantId,
    quantity: newQuantity,
    minStock: currentStock?.minStock ?? 0,
    maxStock: currentStock?.maxStock ?? 1000,
    reservedQuantity: currentStock?.reservedQuantity ?? 0
  });
  
  // Create movement record
  const result = await db.insert(unitStockMovements).values({
    ...data,
    previousStock,
    newStock: newQuantity
  });
  
  return { id: result[0].insertId, previousStock, newStock: newQuantity };
}

export async function listUnitStockMovements(filters: {
  unitId?: number;
  productId?: number;
  variantId?: number;
  type?: string;
  reason?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters.unitId) conditions.push(eq(unitStockMovements.unitId, filters.unitId));
  if (filters.productId) conditions.push(eq(unitStockMovements.productId, filters.productId));
  if (filters.variantId) conditions.push(eq(unitStockMovements.variantId, filters.variantId));
  if (filters.startDate) conditions.push(gte(unitStockMovements.createdAt, filters.startDate));
  if (filters.endDate) conditions.push(lte(unitStockMovements.createdAt, filters.endDate));
  
  let query = db.select().from(unitStockMovements);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  
  return query.orderBy(desc(unitStockMovements.createdAt)).limit(filters.limit ?? 100);
}

// ==================== STOCK TRANSFER FUNCTIONS ====================
export async function createStockTransfer(data: Omit<InsertStockTransfer, 'transferNumber'>, items: Omit<InsertStockTransferItem, 'transferId'>[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const transferNumber = await generateOrderNumber("TRF");
  
  const result = await db.insert(stockTransfers).values({
    ...data,
    transferNumber
  });
  
  const transferId = result[0].insertId;
  
  // Insert items
  for (const item of items) {
    await db.insert(stockTransferItems).values({
      ...item,
      transferId
    });
  }
  
  return { id: transferId, transferNumber };
}

export async function updateStockTransfer(id: number, data: Partial<InsertStockTransfer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(stockTransfers).set(data).where(eq(stockTransfers.id, id));
}

export async function getStockTransferById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(stockTransfers).where(eq(stockTransfers.id, id)).limit(1);
  return result[0];
}

export async function getStockTransferWithItems(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const transfer = await getStockTransferById(id);
  if (!transfer) return undefined;
  
  const items = await db.select().from(stockTransferItems).where(eq(stockTransferItems.transferId, id));
  const fromUnit = await getStoreUnitById(transfer.fromUnitId);
  const toUnit = await getStoreUnitById(transfer.toUnitId);
  
  // Get product details for items
  const productIds = items.map(i => i.productId);
  const productDetails = productIds.length > 0 
    ? await db.select().from(products).where(inArray(products.id, productIds))
    : [];
  
  const itemsWithProducts = items.map(item => ({
    ...item,
    product: productDetails.find(p => p.id === item.productId)
  }));
  
  return {
    ...transfer,
    fromUnit,
    toUnit,
    items: itemsWithProducts
  };
}

export async function listStockTransfers(filters: {
  fromUnitId?: number;
  toUnitId?: number;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters.fromUnitId) conditions.push(eq(stockTransfers.fromUnitId, filters.fromUnitId));
  if (filters.toUnitId) conditions.push(eq(stockTransfers.toUnitId, filters.toUnitId));
  if (filters.startDate) conditions.push(gte(stockTransfers.requestedAt, filters.startDate));
  if (filters.endDate) conditions.push(lte(stockTransfers.requestedAt, filters.endDate));
  
  let query = db.select().from(stockTransfers);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  
  return query.orderBy(desc(stockTransfers.requestedAt));
}

export async function approveStockTransfer(id: number, approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(stockTransfers).set({
    status: "APPROVED",
    approvedAt: new Date(),
    approvedBy
  }).where(eq(stockTransfers.id, id));
}

export async function shipStockTransfer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const transfer = await getStockTransferWithItems(id);
  if (!transfer) throw new Error("Transfer not found");
  
  // Deduct stock from source unit
  for (const item of transfer.items) {
    await createUnitStockMovement({
      unitId: transfer.fromUnitId,
      productId: item.productId,
      variantId: item.variantId,
      type: "OUT",
      reason: "TRANSFER_OUT",
      quantity: item.requestedQuantity,
      previousStock: 0,
      newStock: 0,
      referenceId: id,
      referenceType: "TRANSFER"
    });
    
    // Update shipped quantity
    await db.update(stockTransferItems).set({
      shippedQuantity: item.requestedQuantity
    }).where(eq(stockTransferItems.id, item.id));
  }
  
  await db.update(stockTransfers).set({
    status: "IN_TRANSIT",
    shippedAt: new Date()
  }).where(eq(stockTransfers.id, id));
}

export async function receiveStockTransfer(id: number, receivedBy: number, receivedItems: { itemId: number; receivedQuantity: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const transfer = await getStockTransferWithItems(id);
  if (!transfer) throw new Error("Transfer not found");
  
  // Add stock to destination unit
  for (const received of receivedItems) {
    const item = transfer.items.find(i => i.id === received.itemId);
    if (!item) continue;
    
    await createUnitStockMovement({
      unitId: transfer.toUnitId,
      productId: item.productId,
      variantId: item.variantId,
      type: "IN",
      reason: "TRANSFER_IN",
      quantity: received.receivedQuantity,
      previousStock: 0,
      newStock: 0,
      referenceId: id,
      referenceType: "TRANSFER"
    });
    
    // Update received quantity
    await db.update(stockTransferItems).set({
      receivedQuantity: received.receivedQuantity
    }).where(eq(stockTransferItems.id, received.itemId));
  }
  
  await db.update(stockTransfers).set({
    status: "RECEIVED",
    receivedAt: new Date(),
    receivedBy
  }).where(eq(stockTransfers.id, id));
}

// ==================== RETURNS FUNCTIONS ====================
export async function createReturn(data: Omit<InsertReturn, 'returnNumber'>, items: Omit<InsertReturnItem, 'returnId'>[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const returnNumber = await generateOrderNumber("RET");
  
  const result = await db.insert(returns).values({
    ...data,
    returnNumber
  });
  
  const returnId = result[0].insertId;
  
  // Insert items
  for (const item of items) {
    await db.insert(returnItems).values({
      ...item,
      returnId
    });
  }
  
  return { id: returnId, returnNumber };
}

export async function updateReturn(id: number, data: Partial<InsertReturn>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(returns).set(data).where(eq(returns.id, id));
}

export async function getReturnById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(returns).where(eq(returns.id, id)).limit(1);
  return result[0];
}

export async function getReturnWithItems(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const returnData = await getReturnById(id);
  if (!returnData) return undefined;
  
  const items = await db.select().from(returnItems).where(eq(returnItems.returnId, id));
  
  // Get product details
  const productIds = items.map(i => i.productId);
  const productDetails = productIds.length > 0 
    ? await db.select().from(products).where(inArray(products.id, productIds))
    : [];
  
  const itemsWithProducts = items.map(item => ({
    ...item,
    product: productDetails.find(p => p.id === item.productId)
  }));
  
  // Get customer and unit details
  let customer = null;
  let unit = null;
  
  if (returnData.customerId) {
    customer = await getCustomerById(returnData.customerId);
  }
  if (returnData.unitId) {
    unit = await getStoreUnitById(returnData.unitId);
  }
  
  return {
    ...returnData,
    customer,
    unit,
    items: itemsWithProducts
  };
}

export async function listReturns(filters: {
  customerId?: number;
  unitId?: number;
  type?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters.customerId) conditions.push(eq(returns.customerId, filters.customerId));
  if (filters.unitId) conditions.push(eq(returns.unitId, filters.unitId));
  if (filters.startDate) conditions.push(gte(returns.createdAt, filters.startDate));
  if (filters.endDate) conditions.push(lte(returns.createdAt, filters.endDate));
  
  let query = db.select().from(returns);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  
  return query.orderBy(desc(returns.createdAt));
}

export async function processReturn(id: number, processedBy: number, returnToStock: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const returnData = await getReturnWithItems(id);
  if (!returnData) throw new Error("Return not found");
  
  if (returnToStock && returnData.unitId) {
    // Return items to stock
    for (const item of returnData.items) {
      if (item.condition !== "DEFECTIVE" && item.condition !== "DAMAGED") {
        await createUnitStockMovement({
          unitId: returnData.unitId,
          productId: item.productId,
          variantId: item.variantId,
          type: "IN",
          reason: returnData.type === "EXCHANGE" ? "EXCHANGE" : "RETURN",
          quantity: item.quantity,
          previousStock: 0,
          newStock: 0,
          referenceId: id,
          referenceType: "RETURN"
        });
        
        // Mark as returned to stock
        await db.update(returnItems).set({
          returnedToStock: true
        }).where(eq(returnItems.id, item.id));
      }
    }
  }
  
  await db.update(returns).set({
    status: "COMPLETED",
    processedAt: new Date(),
    processedBy
  }).where(eq(returns.id, id));
}

// ==================== STOCK TURNOVER FUNCTIONS ====================
export async function calculateStockTurnover(productId: number, unitId?: number, period?: string) {
  const db = await getDb();
  if (!db) return null;
  
  const currentPeriod = period || new Date().toISOString().substring(0, 7); // YYYY-MM
  const [year, month] = currentPeriod.split('-').map(Number);
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  // Get movements for the period
  const conditions = [
    eq(unitStockMovements.productId, productId),
    gte(unitStockMovements.createdAt, startDate),
    lte(unitStockMovements.createdAt, endDate)
  ];
  if (unitId) conditions.push(eq(unitStockMovements.unitId, unitId));
  
  const movements = await db.select().from(unitStockMovements).where(and(...conditions));
  
  // Calculate metrics
  const sales = movements.filter(m => m.reason === "SALE").reduce((sum, m) => sum + m.quantity, 0);
  const purchases = movements.filter(m => m.reason === "PURCHASE").reduce((sum, m) => sum + m.quantity, 0);
  
  // Get current stock
  let currentStock = 0;
  if (unitId) {
    const stock = await getUnitStock(unitId, productId);
    currentStock = stock?.quantity ?? 0;
  } else {
    const consolidated = await getConsolidatedStock(productId);
    currentStock = consolidated.total;
  }
  
  const openingStock = currentStock + sales - purchases;
  const averageStock = (openingStock + currentStock) / 2;
  const turnoverRate = averageStock > 0 ? sales / averageStock : 0;
  const daysInStock = turnoverRate > 0 ? Math.round(30 / turnoverRate) : 0;
  
  return {
    period: currentPeriod,
    openingStock,
    closingStock: currentStock,
    averageStock,
    totalSold: sales,
    totalPurchased: purchases,
    turnoverRate,
    daysInStock
  };
}

export async function getStockTurnoverReport(unitId?: number, startPeriod?: string, endPeriod?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (unitId) conditions.push(eq(stockTurnover.unitId, unitId));
  if (startPeriod) conditions.push(gte(stockTurnover.period, startPeriod));
  if (endPeriod) conditions.push(lte(stockTurnover.period, endPeriod));
  
  let query = db.select().from(stockTurnover);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  
  return query.orderBy(desc(stockTurnover.period));
}

// ==================== BARCODE FUNCTIONS ====================
export async function findProductByBarcode(barcode: string) {
  const db = await getDb();
  if (!db) return null;
  
  // First check in products table
  const product = await db.select().from(products).where(eq(products.barcode, barcode)).limit(1);
  if (product.length > 0) {
    return { type: 'product', data: product[0] };
  }
  
  // Then check in variants by SKU
  const variant = await db.select().from(productVariants).where(eq(productVariants.sku, barcode)).limit(1);
  if (variant.length > 0) {
    const parentProduct = await getProductById(variant[0].productId);
    return { type: 'variant', data: variant[0], product: parentProduct };
  }
  
  return null;
}

// ==================== MULTI-UNIT DASHBOARD FUNCTIONS ====================
export async function getMultiUnitDashboardStats(unitId?: number) {
  const db = await getDb();
  if (!db) return null;
  
  const units = await listStoreUnits();
  
  // Get stock by unit
  const stockByUnit = await Promise.all(units.map(async (unit) => {
    const stocks = await listUnitStockByUnit(unit.id);
    const totalItems = stocks.reduce((sum, s) => sum + s.quantity, 0);
    const totalValue = await Promise.all(stocks.map(async (s) => {
      const product = await getProductById(s.productId);
      return s.quantity * parseFloat(product?.costPrice || '0');
    }));
    
    return {
      unitId: unit.id,
      unitName: unit.name,
      unitType: unit.type,
      totalItems,
      totalValue: totalValue.reduce((sum, v) => sum + v, 0),
      stockCount: stocks.length
    };
  }));
  
  // Get pending transfers
  const pendingTransfers = await listStockTransfers({ status: "PENDING" });
  const inTransitTransfers = await listStockTransfers({ status: "IN_TRANSIT" });
  
  // Get pending returns
  const pendingReturns = await listReturns({ status: "PENDING" });
  
  // Calculate totals
  const totalStock = stockByUnit.reduce((sum, u) => sum + u.totalItems, 0);
  const totalValue = stockByUnit.reduce((sum, u) => sum + u.totalValue, 0);
  
  return {
    units: stockByUnit,
    totalStock,
    totalValue,
    pendingTransfersCount: pendingTransfers.length,
    inTransitTransfersCount: inTransitTransfers.length,
    pendingReturnsCount: pendingReturns.length
  };
}
