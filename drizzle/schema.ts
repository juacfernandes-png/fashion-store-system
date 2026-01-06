import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

// ==================== USERS ====================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== FORNECEDORES ====================
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  tradeName: varchar("tradeName", { length: 255 }),
  cnpj: varchar("cnpj", { length: 18 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  contactPerson: varchar("contactPerson", { length: 255 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// ==================== CATEGORIAS ====================
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  parentId: int("parentId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ==================== PRODUTOS ====================
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  barcode: varchar("barcode", { length: 50 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: int("categoryId"),
  supplierId: int("supplierId"),
  brand: varchar("brand", { length: 100 }),
  costPrice: decimal("costPrice", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("salePrice", { precision: 10, scale: 2 }).notNull(),
  minStock: int("minStock").default(0).notNull(),
  maxStock: int("maxStock").default(1000).notNull(),
  currentStock: int("currentStock").default(0).notNull(),
  unit: varchar("unit", { length: 20 }).default("UN").notNull(),
  weight: decimal("weight", { precision: 10, scale: 3 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ==================== VARIAÇÕES DE PRODUTO (Tamanho/Cor) ====================
export const productVariants = mysqlTable("productVariants", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  size: varchar("size", { length: 20 }),
  color: varchar("color", { length: 50 }),
  colorHex: varchar("colorHex", { length: 7 }),
  stock: int("stock").default(0).notNull(),
  additionalPrice: decimal("additionalPrice", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = typeof productVariants.$inferInsert;

// ==================== FOTOS DE PRODUTOS ====================
export const productImages = mysqlTable("productImages", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  isPrimary: boolean("isPrimary").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductImage = typeof productImages.$inferSelect;
export type InsertProductImage = typeof productImages.$inferInsert;

// ==================== CLIENTES ====================
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }),
  birthDate: timestamp("birthDate"),
  gender: mysqlEnum("gender", ["M", "F", "O"]),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  segment: mysqlEnum("segment", ["VIP", "REGULAR", "NEW", "INACTIVE"]).default("NEW").notNull(),
  preferences: text("preferences"),
  notes: text("notes"),
  totalPurchases: decimal("totalPurchases", { precision: 12, scale: 2 }).default("0").notNull(),
  purchaseCount: int("purchaseCount").default(0).notNull(),
  lastPurchaseAt: timestamp("lastPurchaseAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ==================== MOVIMENTAÇÕES DE ESTOQUE ====================
export const stockMovements = mysqlTable("stockMovements", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  type: mysqlEnum("type", ["IN", "OUT", "ADJUSTMENT"]).notNull(),
  reason: mysqlEnum("reason", ["PURCHASE", "SALE", "RETURN", "LOSS", "ADJUSTMENT", "TRANSFER"]).notNull(),
  quantity: int("quantity").notNull(),
  previousStock: int("previousStock").notNull(),
  newStock: int("newStock").notNull(),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }),
  totalCost: decimal("totalCost", { precision: 12, scale: 2 }),
  batch: varchar("batch", { length: 50 }),
  referenceId: int("referenceId"),
  referenceType: varchar("referenceType", { length: 50 }),
  notes: text("notes"),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = typeof stockMovements.$inferInsert;

// ==================== PEDIDOS DE COMPRA ====================
export const purchaseOrders = mysqlTable("purchaseOrders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  supplierId: int("supplierId").notNull(),
  status: mysqlEnum("status", ["DRAFT", "PENDING", "APPROVED", "ORDERED", "PARTIAL", "RECEIVED", "CANCELLED"]).default("DRAFT").notNull(),
  orderDate: timestamp("orderDate").defaultNow().notNull(),
  expectedDate: timestamp("expectedDate"),
  receivedDate: timestamp("receivedDate"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0").notNull(),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

// ==================== ITENS DO PEDIDO DE COMPRA ====================
export const purchaseOrderItems = mysqlTable("purchaseOrderItems", {
  id: int("id").autoincrement().primaryKey(),
  purchaseOrderId: int("purchaseOrderId").notNull(),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  quantity: int("quantity").notNull(),
  receivedQuantity: int("receivedQuantity").default(0).notNull(),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("totalCost", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

// ==================== PEDIDOS DE VENDA ====================
export const salesOrders = mysqlTable("salesOrders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  customerId: int("customerId"),
  status: mysqlEnum("status", ["DRAFT", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]).default("DRAFT").notNull(),
  orderDate: timestamp("orderDate").defaultNow().notNull(),
  deliveryDate: timestamp("deliveryDate"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0").notNull(),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).default("0").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["CASH", "CREDIT", "DEBIT", "PIX", "TRANSFER", "INSTALLMENT"]),
  paymentStatus: mysqlEnum("paymentStatus", ["PENDING", "PARTIAL", "PAID", "REFUNDED"]).default("PENDING").notNull(),
  notes: text("notes"),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SalesOrder = typeof salesOrders.$inferSelect;
export type InsertSalesOrder = typeof salesOrders.$inferInsert;

// ==================== ITENS DO PEDIDO DE VENDA ====================
export const salesOrderItems = mysqlTable("salesOrderItems", {
  id: int("id").autoincrement().primaryKey(),
  salesOrderId: int("salesOrderId").notNull(),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0").notNull(),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SalesOrderItem = typeof salesOrderItems.$inferSelect;
export type InsertSalesOrderItem = typeof salesOrderItems.$inferInsert;

// ==================== CONTAS A PAGAR ====================
export const accountsPayable = mysqlTable("accountsPayable", {
  id: int("id").autoincrement().primaryKey(),
  description: varchar("description", { length: 255 }).notNull(),
  supplierId: int("supplierId"),
  purchaseOrderId: int("purchaseOrderId"),
  category: mysqlEnum("category", ["SUPPLIER", "RENT", "UTILITIES", "SALARY", "TAX", "OTHER"]).default("OTHER").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal("paidAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  paidDate: timestamp("paidDate"),
  status: mysqlEnum("status", ["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).default("PENDING").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["CASH", "CREDIT", "DEBIT", "PIX", "TRANSFER", "CHECK"]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountPayable = typeof accountsPayable.$inferSelect;
export type InsertAccountPayable = typeof accountsPayable.$inferInsert;

// ==================== CONTAS A RECEBER ====================
export const accountsReceivable = mysqlTable("accountsReceivable", {
  id: int("id").autoincrement().primaryKey(),
  description: varchar("description", { length: 255 }).notNull(),
  customerId: int("customerId"),
  salesOrderId: int("salesOrderId"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  receivedAmount: decimal("receivedAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  receivedDate: timestamp("receivedDate"),
  status: mysqlEnum("status", ["PENDING", "PARTIAL", "RECEIVED", "OVERDUE", "CANCELLED"]).default("PENDING").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["CASH", "CREDIT", "DEBIT", "PIX", "TRANSFER", "CHECK"]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountReceivable = typeof accountsReceivable.$inferSelect;
export type InsertAccountReceivable = typeof accountsReceivable.$inferInsert;

// ==================== TRANSAÇÕES FINANCEIRAS (FLUXO DE CAIXA) ====================
export const financialTransactions = mysqlTable("financialTransactions", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["INCOME", "EXPENSE"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  transactionDate: timestamp("transactionDate").defaultNow().notNull(),
  referenceId: int("referenceId"),
  referenceType: varchar("referenceType", { length: 50 }),
  bankAccount: varchar("bankAccount", { length: 100 }),
  isReconciled: boolean("isReconciled").default(false).notNull(),
  reconciledAt: timestamp("reconciledAt"),
  notes: text("notes"),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type InsertFinancialTransaction = typeof financialTransactions.$inferInsert;

// ==================== ALERTAS DE ESTOQUE ====================
export const stockAlerts = mysqlTable("stockAlerts", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  alertType: mysqlEnum("alertType", ["LOW_STOCK", "HIGH_STOCK", "OUT_OF_STOCK"]).notNull(),
  currentStock: int("currentStock").notNull(),
  threshold: int("threshold").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  isNotified: boolean("isNotified").default(false).notNull(),
  notifiedAt: timestamp("notifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockAlert = typeof stockAlerts.$inferSelect;
export type InsertStockAlert = typeof stockAlerts.$inferInsert;


// ==================== UNIDADES (LOJAS, CD, E-COMMERCE) ====================
export const storeUnits = mysqlTable("storeUnits", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["STORE", "WAREHOUSE", "ECOMMERCE"]).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  manager: varchar("manager", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StoreUnit = typeof storeUnits.$inferSelect;
export type InsertStoreUnit = typeof storeUnits.$inferInsert;

// ==================== ESTOQUE POR UNIDADE ====================
export const unitStock = mysqlTable("unitStock", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  quantity: int("quantity").default(0).notNull(),
  minStock: int("minStock").default(0).notNull(),
  maxStock: int("maxStock").default(1000).notNull(),
  reservedQuantity: int("reservedQuantity").default(0).notNull(),
  availableQuantity: int("availableQuantity").default(0).notNull(),
  lastMovementAt: timestamp("lastMovementAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UnitStock = typeof unitStock.$inferSelect;
export type InsertUnitStock = typeof unitStock.$inferInsert;

// ==================== TRANSFERÊNCIAS ENTRE UNIDADES ====================
export const stockTransfers = mysqlTable("stockTransfers", {
  id: int("id").autoincrement().primaryKey(),
  transferNumber: varchar("transferNumber", { length: 50 }).notNull().unique(),
  fromUnitId: int("fromUnitId").notNull(),
  toUnitId: int("toUnitId").notNull(),
  status: mysqlEnum("status", ["DRAFT", "PENDING", "APPROVED", "IN_TRANSIT", "RECEIVED", "CANCELLED"]).default("DRAFT").notNull(),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy"),
  shippedAt: timestamp("shippedAt"),
  receivedAt: timestamp("receivedAt"),
  receivedBy: int("receivedBy"),
  notes: text("notes"),
  requestedBy: int("requestedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StockTransfer = typeof stockTransfers.$inferSelect;
export type InsertStockTransfer = typeof stockTransfers.$inferInsert;

// ==================== ITENS DA TRANSFERÊNCIA ====================
export const stockTransferItems = mysqlTable("stockTransferItems", {
  id: int("id").autoincrement().primaryKey(),
  transferId: int("transferId").notNull(),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  requestedQuantity: int("requestedQuantity").notNull(),
  shippedQuantity: int("shippedQuantity").default(0).notNull(),
  receivedQuantity: int("receivedQuantity").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockTransferItem = typeof stockTransferItems.$inferSelect;
export type InsertStockTransferItem = typeof stockTransferItems.$inferInsert;

// ==================== TROCAS E DEVOLUÇÕES ====================
export const returns = mysqlTable("returns", {
  id: int("id").autoincrement().primaryKey(),
  returnNumber: varchar("returnNumber", { length: 50 }).notNull().unique(),
  salesOrderId: int("salesOrderId"),
  customerId: int("customerId"),
  unitId: int("unitId"),
  type: mysqlEnum("type", ["RETURN", "EXCHANGE"]).notNull(),
  status: mysqlEnum("status", ["PENDING", "APPROVED", "PROCESSING", "COMPLETED", "REJECTED"]).default("PENDING").notNull(),
  reason: mysqlEnum("reason", ["DEFECT", "WRONG_SIZE", "WRONG_COLOR", "REGRET", "DAMAGED", "OTHER"]).notNull(),
  reasonDetails: text("reasonDetails"),
  refundAmount: decimal("refundAmount", { precision: 12, scale: 2 }).default("0"),
  refundMethod: mysqlEnum("refundMethod", ["CASH", "CREDIT", "STORE_CREDIT", "EXCHANGE"]),
  processedAt: timestamp("processedAt"),
  processedBy: int("processedBy"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Return = typeof returns.$inferSelect;
export type InsertReturn = typeof returns.$inferInsert;

// ==================== ITENS DA TROCA/DEVOLUÇÃO ====================
export const returnItems = mysqlTable("returnItems", {
  id: int("id").autoincrement().primaryKey(),
  returnId: int("returnId").notNull(),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  condition: mysqlEnum("condition", ["NEW", "USED", "DAMAGED", "DEFECTIVE"]).default("USED").notNull(),
  returnedToStock: boolean("returnedToStock").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReturnItem = typeof returnItems.$inferSelect;
export type InsertReturnItem = typeof returnItems.$inferInsert;

// ==================== MOVIMENTAÇÕES DE ESTOQUE POR UNIDADE ====================
export const unitStockMovements = mysqlTable("unitStockMovements", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  type: mysqlEnum("type", ["IN", "OUT", "ADJUSTMENT"]).notNull(),
  reason: mysqlEnum("reason", ["PURCHASE", "SALE", "RETURN", "EXCHANGE", "LOSS", "ADJUSTMENT", "TRANSFER_IN", "TRANSFER_OUT", "INVENTORY"]).notNull(),
  quantity: int("quantity").notNull(),
  previousStock: int("previousStock").notNull(),
  newStock: int("newStock").notNull(),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }),
  referenceId: int("referenceId"),
  referenceType: varchar("referenceType", { length: 50 }),
  batch: varchar("batch", { length: 50 }),
  barcode: varchar("barcode", { length: 100 }),
  notes: text("notes"),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UnitStockMovement = typeof unitStockMovements.$inferSelect;
export type InsertUnitStockMovement = typeof unitStockMovements.$inferInsert;

// ==================== GIRO DE ESTOQUE ====================
export const stockTurnover = mysqlTable("stockTurnover", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId"),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
  openingStock: int("openingStock").default(0).notNull(),
  closingStock: int("closingStock").default(0).notNull(),
  averageStock: decimal("averageStock", { precision: 10, scale: 2 }).default("0").notNull(),
  totalSold: int("totalSold").default(0).notNull(),
  totalPurchased: int("totalPurchased").default(0).notNull(),
  turnoverRate: decimal("turnoverRate", { precision: 10, scale: 4 }).default("0").notNull(),
  daysInStock: int("daysInStock").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StockTurnover = typeof stockTurnover.$inferSelect;
export type InsertStockTurnover = typeof stockTurnover.$inferInsert;
