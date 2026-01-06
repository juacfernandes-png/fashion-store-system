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


// ==================== CENTROS DE CUSTO ====================
export const costCenters = mysqlTable("costCenters", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["OPERATION", "MARKETING", "ADMINISTRATIVE", "FINANCIAL", "OTHER"]).notNull(),
  description: text("description"),
  budget: decimal("budget", { precision: 12, scale: 2 }).default("0"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CostCenter = typeof costCenters.$inferSelect;
export type InsertCostCenter = typeof costCenters.$inferInsert;

// ==================== CONTAS A PAGAR AVANÇADAS ====================
export const accountsPayableAdvanced = mysqlTable("accountsPayableAdvanced", {
  id: int("id").autoincrement().primaryKey(),
  documentNumber: varchar("documentNumber", { length: 100 }),
  description: varchar("description", { length: 255 }).notNull(),
  supplierId: int("supplierId"),
  purchaseOrderId: int("purchaseOrderId"),
  unitId: int("unitId"),
  costCenterId: int("costCenterId"),
  category: mysqlEnum("category", ["SUPPLIER", "RENT", "UTILITIES", "SALARY", "TAX", "MARKETING", "FREIGHT", "SYSTEM", "INSURANCE", "MAINTENANCE", "OTHER"]).default("OTHER").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal("paidAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  paidDate: timestamp("paidDate"),
  status: mysqlEnum("status", ["PENDING", "APPROVED", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).default("PENDING").notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["PENDING", "APPROVED", "REJECTED"]).default("PENDING").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  paymentMethod: mysqlEnum("paymentMethod", ["CASH", "CREDIT", "DEBIT", "PIX", "TRANSFER", "CHECK", "BOLETO"]),
  bankAccount: varchar("bankAccount", { length: 100 }),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  recurringFrequency: mysqlEnum("recurringFrequency", ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  recurringEndDate: timestamp("recurringEndDate"),
  parentId: int("parentId"), // Para parcelas
  installmentNumber: int("installmentNumber"),
  totalInstallments: int("totalInstallments"),
  notes: text("notes"),
  attachments: json("attachments"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountPayableAdvanced = typeof accountsPayableAdvanced.$inferSelect;
export type InsertAccountPayableAdvanced = typeof accountsPayableAdvanced.$inferInsert;

// ==================== CONTAS A RECEBER AVANÇADAS ====================
export const accountsReceivableAdvanced = mysqlTable("accountsReceivableAdvanced", {
  id: int("id").autoincrement().primaryKey(),
  documentNumber: varchar("documentNumber", { length: 100 }),
  description: varchar("description", { length: 255 }).notNull(),
  customerId: int("customerId"),
  salesOrderId: int("salesOrderId"),
  unitId: int("unitId"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  receivedAmount: decimal("receivedAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  receivedDate: timestamp("receivedDate"),
  status: mysqlEnum("status", ["PENDING", "PARTIAL", "RECEIVED", "OVERDUE", "CANCELLED", "CHARGEBACK"]).default("PENDING").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["CASH", "CREDIT", "DEBIT", "PIX", "TRANSFER", "CHECK", "BOLETO"]),
  cardBrand: varchar("cardBrand", { length: 50 }),
  cardInstallments: int("cardInstallments").default(1),
  expectedReceiptDate: timestamp("expectedReceiptDate"), // D+1, D+30, etc
  acquirerFee: decimal("acquirerFee", { precision: 10, scale: 2 }).default("0"),
  netAmount: decimal("netAmount", { precision: 12, scale: 2 }),
  bankAccount: varchar("bankAccount", { length: 100 }),
  isReconciled: boolean("isReconciled").default(false).notNull(),
  reconciledAt: timestamp("reconciledAt"),
  reconciledBy: int("reconciledBy"),
  chargebackReason: text("chargebackReason"),
  notes: text("notes"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountReceivableAdvanced = typeof accountsReceivableAdvanced.$inferSelect;
export type InsertAccountReceivableAdvanced = typeof accountsReceivableAdvanced.$inferInsert;

// ==================== FLUXO DE CAIXA ====================
export const cashFlow = mysqlTable("cashFlow", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["INCOME", "EXPENSE"]).notNull(),
  category: mysqlEnum("category", ["SALES", "RECEIVABLES", "OTHER_INCOME", "SUPPLIERS", "FREIGHT", "SALARY", "RENT", "UTILITIES", "MARKETING", "TAX", "FEES", "OTHER_EXPENSE"]).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  transactionDate: timestamp("transactionDate").notNull(),
  unitId: int("unitId"),
  costCenterId: int("costCenterId"),
  referenceId: int("referenceId"),
  referenceType: varchar("referenceType", { length: 50 }),
  paymentMethod: mysqlEnum("paymentMethod", ["CASH", "CREDIT", "DEBIT", "PIX", "TRANSFER", "CHECK", "BOLETO"]),
  bankAccount: varchar("bankAccount", { length: 100 }),
  isProjected: boolean("isProjected").default(false).notNull(),
  isReconciled: boolean("isReconciled").default(false).notNull(),
  reconciledAt: timestamp("reconciledAt"),
  notes: text("notes"),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CashFlow = typeof cashFlow.$inferSelect;
export type InsertCashFlow = typeof cashFlow.$inferInsert;

// ==================== CONCILIAÇÃO BANCÁRIA ====================
export const bankReconciliation = mysqlTable("bankReconciliation", {
  id: int("id").autoincrement().primaryKey(),
  bankAccount: varchar("bankAccount", { length: 100 }).notNull(),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
  openingBalance: decimal("openingBalance", { precision: 12, scale: 2 }).notNull(),
  closingBalance: decimal("closingBalance", { precision: 12, scale: 2 }).notNull(),
  systemBalance: decimal("systemBalance", { precision: 12, scale: 2 }).notNull(),
  difference: decimal("difference", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["PENDING", "IN_PROGRESS", "RECONCILED", "DISCREPANCY"]).default("PENDING").notNull(),
  reconciledBy: int("reconciledBy"),
  reconciledAt: timestamp("reconciledAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BankReconciliation = typeof bankReconciliation.$inferSelect;
export type InsertBankReconciliation = typeof bankReconciliation.$inferInsert;

// ==================== ITENS DE CONCILIAÇÃO ====================
export const reconciliationItems = mysqlTable("reconciliationItems", {
  id: int("id").autoincrement().primaryKey(),
  reconciliationId: int("reconciliationId").notNull(),
  transactionDate: timestamp("transactionDate").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  bankAmount: decimal("bankAmount", { precision: 12, scale: 2 }).notNull(),
  systemAmount: decimal("systemAmount", { precision: 12, scale: 2 }),
  difference: decimal("difference", { precision: 12, scale: 2 }),
  status: mysqlEnum("status", ["MATCHED", "UNMATCHED", "PENDING"]).default("PENDING").notNull(),
  cashFlowId: int("cashFlowId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReconciliationItem = typeof reconciliationItems.$inferSelect;
export type InsertReconciliationItem = typeof reconciliationItems.$inferInsert;

// ==================== CUSTO MÉDIO DE PRODUTOS ====================
export const productCosts = mysqlTable("productCosts", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  unitId: int("unitId"),
  averageCost: decimal("averageCost", { precision: 10, scale: 4 }).notNull(),
  lastPurchaseCost: decimal("lastPurchaseCost", { precision: 10, scale: 2 }),
  totalQuantity: int("totalQuantity").default(0).notNull(),
  totalValue: decimal("totalValue", { precision: 12, scale: 2 }).default("0").notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductCost = typeof productCosts.$inferSelect;
export type InsertProductCost = typeof productCosts.$inferInsert;

// ==================== CMV (CUSTO DE MERCADORIA VENDIDA) ====================
export const cmvRecords = mysqlTable("cmvRecords", {
  id: int("id").autoincrement().primaryKey(),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
  unitId: int("unitId"),
  productId: int("productId"),
  categoryId: int("categoryId"),
  openingInventory: decimal("openingInventory", { precision: 12, scale: 2 }).default("0").notNull(),
  purchases: decimal("purchases", { precision: 12, scale: 2 }).default("0").notNull(),
  closingInventory: decimal("closingInventory", { precision: 12, scale: 2 }).default("0").notNull(),
  cmv: decimal("cmv", { precision: 12, scale: 2 }).default("0").notNull(),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  grossMargin: decimal("grossMargin", { precision: 12, scale: 2 }).default("0").notNull(),
  grossMarginPercent: decimal("grossMarginPercent", { precision: 5, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CMVRecord = typeof cmvRecords.$inferSelect;
export type InsertCMVRecord = typeof cmvRecords.$inferInsert;

// ==================== DRE (DEMONSTRAÇÃO DE RESULTADO) ====================
export const dreRecords = mysqlTable("dreRecords", {
  id: int("id").autoincrement().primaryKey(),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
  unitId: int("unitId"),
  // Receitas
  grossRevenue: decimal("grossRevenue", { precision: 14, scale: 2 }).default("0").notNull(),
  returns: decimal("returns", { precision: 12, scale: 2 }).default("0").notNull(),
  discounts: decimal("discounts", { precision: 12, scale: 2 }).default("0").notNull(),
  netRevenue: decimal("netRevenue", { precision: 14, scale: 2 }).default("0").notNull(),
  // CMV
  cmv: decimal("cmv", { precision: 14, scale: 2 }).default("0").notNull(),
  grossProfit: decimal("grossProfit", { precision: 14, scale: 2 }).default("0").notNull(),
  grossMarginPercent: decimal("grossMarginPercent", { precision: 5, scale: 2 }).default("0").notNull(),
  // Despesas Operacionais
  salaryExpenses: decimal("salaryExpenses", { precision: 12, scale: 2 }).default("0").notNull(),
  rentExpenses: decimal("rentExpenses", { precision: 12, scale: 2 }).default("0").notNull(),
  marketingExpenses: decimal("marketingExpenses", { precision: 12, scale: 2 }).default("0").notNull(),
  utilityExpenses: decimal("utilityExpenses", { precision: 12, scale: 2 }).default("0").notNull(),
  freightExpenses: decimal("freightExpenses", { precision: 12, scale: 2 }).default("0").notNull(),
  otherExpenses: decimal("otherExpenses", { precision: 12, scale: 2 }).default("0").notNull(),
  totalOperatingExpenses: decimal("totalOperatingExpenses", { precision: 14, scale: 2 }).default("0").notNull(),
  operatingProfit: decimal("operatingProfit", { precision: 14, scale: 2 }).default("0").notNull(),
  operatingMarginPercent: decimal("operatingMarginPercent", { precision: 5, scale: 2 }).default("0").notNull(),
  // Impostos e Taxas
  taxes: decimal("taxes", { precision: 12, scale: 2 }).default("0").notNull(),
  acquirerFees: decimal("acquirerFees", { precision: 12, scale: 2 }).default("0").notNull(),
  otherFees: decimal("otherFees", { precision: 12, scale: 2 }).default("0").notNull(),
  totalTaxesAndFees: decimal("totalTaxesAndFees", { precision: 12, scale: 2 }).default("0").notNull(),
  // Resultado Final
  netProfit: decimal("netProfit", { precision: 14, scale: 2 }).default("0").notNull(),
  netMarginPercent: decimal("netMarginPercent", { precision: 5, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DRERecord = typeof dreRecords.$inferSelect;
export type InsertDRERecord = typeof dreRecords.$inferInsert;

// ==================== LOGS DE AUDITORIA ====================
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  entityId: int("entityId").notNull(),
  action: mysqlEnum("action", ["CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT", "CANCEL", "ADJUST"]).notNull(),
  fieldChanged: varchar("fieldChanged", { length: 100 }),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  reason: text("reason"),
  userId: int("userId"),
  userName: varchar("userName", { length: 255 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ==================== PRECIFICAÇÃO ====================
export const pricingRules = mysqlTable("pricingRules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  productId: int("productId"),
  categoryId: int("categoryId"),
  unitId: int("unitId"),
  // Componentes de custo
  baseCost: decimal("baseCost", { precision: 10, scale: 2 }),
  taxRate: decimal("taxRate", { precision: 5, scale: 2 }).default("0").notNull(),
  freightRate: decimal("freightRate", { precision: 5, scale: 2 }).default("0").notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).default("0").notNull(),
  marketplaceFee: decimal("marketplaceFee", { precision: 5, scale: 2 }).default("0").notNull(),
  acquirerFee: decimal("acquirerFee", { precision: 5, scale: 2 }).default("0").notNull(),
  // Margem
  targetMargin: decimal("targetMargin", { precision: 5, scale: 2 }).notNull(),
  minMargin: decimal("minMargin", { precision: 5, scale: 2 }),
  maxMargin: decimal("maxMargin", { precision: 5, scale: 2 }),
  // Preço calculado
  suggestedPrice: decimal("suggestedPrice", { precision: 10, scale: 2 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PricingRule = typeof pricingRules.$inferSelect;
export type InsertPricingRule = typeof pricingRules.$inferInsert;

// ==================== PROMOÇÕES ====================
export const promotions = mysqlTable("promotions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["PERCENTAGE", "FIXED", "BOGO", "BUNDLE"]).notNull(),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
  minPurchase: decimal("minPurchase", { precision: 10, scale: 2 }),
  maxDiscount: decimal("maxDiscount", { precision: 10, scale: 2 }),
  productId: int("productId"),
  categoryId: int("categoryId"),
  unitId: int("unitId"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  usageLimit: int("usageLimit"),
  usageCount: int("usageCount").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  // ROI tracking
  totalSales: decimal("totalSales", { precision: 14, scale: 2 }).default("0").notNull(),
  totalDiscount: decimal("totalDiscount", { precision: 12, scale: 2 }).default("0").notNull(),
  totalCMV: decimal("totalCMV", { precision: 12, scale: 2 }).default("0").notNull(),
  netProfit: decimal("netProfit", { precision: 12, scale: 2 }).default("0").notNull(),
  roi: decimal("roi", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = typeof promotions.$inferInsert;

// ==================== HISTÓRICO DE FORNECEDOR ====================
export const supplierHistory = mysqlTable("supplierHistory", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  purchaseOrderId: int("purchaseOrderId"),
  productId: int("productId"),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").notNull(),
  totalValue: decimal("totalValue", { precision: 12, scale: 2 }).notNull(),
  paymentTerms: varchar("paymentTerms", { length: 100 }),
  deliveryDays: int("deliveryDays"),
  qualityRating: int("qualityRating"), // 1-5
  deliveryRating: int("deliveryRating"), // 1-5
  notes: text("notes"),
  purchaseDate: timestamp("purchaseDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupplierHistory = typeof supplierHistory.$inferSelect;
export type InsertSupplierHistory = typeof supplierHistory.$inferInsert;

// ==================== ANÁLISE DE ESTOQUE ====================
export const stockAnalysis = mysqlTable("stockAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
  unitId: int("unitId"),
  productId: int("productId").notNull(),
  categoryId: int("categoryId"),
  // Classificação ABC
  abcClassRevenue: mysqlEnum("abcClassRevenue", ["A", "B", "C"]),
  abcClassProfit: mysqlEnum("abcClassProfit", ["A", "B", "C"]),
  abcClassQuantity: mysqlEnum("abcClassQuantity", ["A", "B", "C"]),
  // Métricas
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  profit: decimal("profit", { precision: 12, scale: 2 }).default("0").notNull(),
  quantitySold: int("quantitySold").default(0).notNull(),
  averageStock: decimal("averageStock", { precision: 10, scale: 2 }).default("0").notNull(),
  stockValue: decimal("stockValue", { precision: 12, scale: 2 }).default("0").notNull(),
  // Cobertura e giro
  coverageDays: int("coverageDays").default(0).notNull(),
  turnoverRate: decimal("turnoverRate", { precision: 10, scale: 4 }).default("0").notNull(),
  // Ruptura
  stockoutDays: int("stockoutDays").default(0).notNull(),
  estimatedLostSales: decimal("estimatedLostSales", { precision: 12, scale: 2 }).default("0").notNull(),
  // Capital parado
  idleCapital: decimal("idleCapital", { precision: 12, scale: 2 }).default("0").notNull(),
  idleDays: int("idleDays").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StockAnalysis = typeof stockAnalysis.$inferSelect;
export type InsertStockAnalysis = typeof stockAnalysis.$inferInsert;

// ==================== RESULTADO POR UNIDADE ====================
export const unitPerformance = mysqlTable("unitPerformance", {
  id: int("id").autoincrement().primaryKey(),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
  unitId: int("unitId").notNull(),
  // Vendas
  grossRevenue: decimal("grossRevenue", { precision: 14, scale: 2 }).default("0").notNull(),
  netRevenue: decimal("netRevenue", { precision: 14, scale: 2 }).default("0").notNull(),
  orderCount: int("orderCount").default(0).notNull(),
  averageTicket: decimal("averageTicket", { precision: 10, scale: 2 }).default("0").notNull(),
  // Custos e Margem
  cmv: decimal("cmv", { precision: 14, scale: 2 }).default("0").notNull(),
  grossMargin: decimal("grossMargin", { precision: 14, scale: 2 }).default("0").notNull(),
  grossMarginPercent: decimal("grossMarginPercent", { precision: 5, scale: 2 }).default("0").notNull(),
  // Despesas
  totalExpenses: decimal("totalExpenses", { precision: 14, scale: 2 }).default("0").notNull(),
  // Resultado
  operatingProfit: decimal("operatingProfit", { precision: 14, scale: 2 }).default("0").notNull(),
  netProfit: decimal("netProfit", { precision: 14, scale: 2 }).default("0").notNull(),
  netMarginPercent: decimal("netMarginPercent", { precision: 5, scale: 2 }).default("0").notNull(),
  // Estoque
  stockValue: decimal("stockValue", { precision: 14, scale: 2 }).default("0").notNull(),
  stockTurnover: decimal("stockTurnover", { precision: 10, scale: 4 }).default("0").notNull(),
  // Ranking
  revenueRank: int("revenueRank"),
  profitRank: int("profitRank"),
  marginRank: int("marginRank"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UnitPerformance = typeof unitPerformance.$inferSelect;
export type InsertUnitPerformance = typeof unitPerformance.$inferInsert;
