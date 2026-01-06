CREATE TABLE `accountsPayable` (
	`id` int AUTO_INCREMENT NOT NULL,
	`description` varchar(255) NOT NULL,
	`supplierId` int,
	`purchaseOrderId` int,
	`category` enum('SUPPLIER','RENT','UTILITIES','SALARY','TAX','OTHER') NOT NULL DEFAULT 'OTHER',
	`amount` decimal(12,2) NOT NULL,
	`paidAmount` decimal(12,2) NOT NULL DEFAULT '0',
	`dueDate` timestamp NOT NULL,
	`paidDate` timestamp,
	`status` enum('PENDING','PARTIAL','PAID','OVERDUE','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`paymentMethod` enum('CASH','CREDIT','DEBIT','PIX','TRANSFER','CHECK'),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accountsPayable_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accountsReceivable` (
	`id` int AUTO_INCREMENT NOT NULL,
	`description` varchar(255) NOT NULL,
	`customerId` int,
	`salesOrderId` int,
	`amount` decimal(12,2) NOT NULL,
	`receivedAmount` decimal(12,2) NOT NULL DEFAULT '0',
	`dueDate` timestamp NOT NULL,
	`receivedDate` timestamp,
	`status` enum('PENDING','PARTIAL','RECEIVED','OVERDUE','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`paymentMethod` enum('CASH','CREDIT','DEBIT','PIX','TRANSFER','CHECK'),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accountsReceivable_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`parentId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`cpf` varchar(14),
	`birthDate` timestamp,
	`gender` enum('M','F','O'),
	`address` text,
	`city` varchar(100),
	`state` varchar(2),
	`zipCode` varchar(10),
	`segment` enum('VIP','REGULAR','NEW','INACTIVE') NOT NULL DEFAULT 'NEW',
	`preferences` text,
	`notes` text,
	`totalPurchases` decimal(12,2) NOT NULL DEFAULT '0',
	`purchaseCount` int NOT NULL DEFAULT 0,
	`lastPurchaseAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `financialTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('INCOME','EXPENSE') NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`transactionDate` timestamp NOT NULL DEFAULT (now()),
	`referenceId` int,
	`referenceType` varchar(50),
	`bankAccount` varchar(100),
	`isReconciled` boolean NOT NULL DEFAULT false,
	`reconciledAt` timestamp,
	`notes` text,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financialTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`url` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`isPrimary` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productVariants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`sku` varchar(100) NOT NULL,
	`size` varchar(20),
	`color` varchar(50),
	`colorHex` varchar(7),
	`stock` int NOT NULL DEFAULT 0,
	`additionalPrice` decimal(10,2) DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productVariants_id` PRIMARY KEY(`id`),
	CONSTRAINT `productVariants_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`barcode` varchar(50),
	`name` varchar(255) NOT NULL,
	`description` text,
	`categoryId` int,
	`supplierId` int,
	`brand` varchar(100),
	`costPrice` decimal(10,2) NOT NULL,
	`salePrice` decimal(10,2) NOT NULL,
	`minStock` int NOT NULL DEFAULT 0,
	`maxStock` int NOT NULL DEFAULT 1000,
	`currentStock` int NOT NULL DEFAULT 0,
	`unit` varchar(20) NOT NULL DEFAULT 'UN',
	`weight` decimal(10,3),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `purchaseOrderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchaseOrderId` int NOT NULL,
	`productId` int NOT NULL,
	`variantId` int,
	`quantity` int NOT NULL,
	`receivedQuantity` int NOT NULL DEFAULT 0,
	`unitCost` decimal(10,2) NOT NULL,
	`totalCost` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purchaseOrderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchaseOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`supplierId` int NOT NULL,
	`status` enum('DRAFT','PENDING','APPROVED','ORDERED','PARTIAL','RECEIVED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
	`orderDate` timestamp NOT NULL DEFAULT (now()),
	`expectedDate` timestamp,
	`receivedDate` timestamp,
	`subtotal` decimal(12,2) NOT NULL DEFAULT '0',
	`discount` decimal(12,2) NOT NULL DEFAULT '0',
	`shipping` decimal(10,2) NOT NULL DEFAULT '0',
	`total` decimal(12,2) NOT NULL DEFAULT '0',
	`notes` text,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchaseOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchaseOrders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `salesOrderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`salesOrderId` int NOT NULL,
	`productId` int NOT NULL,
	`variantId` int,
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`discount` decimal(10,2) NOT NULL DEFAULT '0',
	`totalPrice` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `salesOrderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `salesOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`customerId` int,
	`status` enum('DRAFT','PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','RETURNED') NOT NULL DEFAULT 'DRAFT',
	`orderDate` timestamp NOT NULL DEFAULT (now()),
	`deliveryDate` timestamp,
	`subtotal` decimal(12,2) NOT NULL DEFAULT '0',
	`discount` decimal(12,2) NOT NULL DEFAULT '0',
	`shipping` decimal(10,2) NOT NULL DEFAULT '0',
	`total` decimal(12,2) NOT NULL DEFAULT '0',
	`paymentMethod` enum('CASH','CREDIT','DEBIT','PIX','TRANSFER','INSTALLMENT'),
	`paymentStatus` enum('PENDING','PARTIAL','PAID','REFUNDED') NOT NULL DEFAULT 'PENDING',
	`notes` text,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `salesOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `salesOrders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `stockAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`variantId` int,
	`alertType` enum('LOW_STOCK','HIGH_STOCK','OUT_OF_STOCK') NOT NULL,
	`currentStock` int NOT NULL,
	`threshold` int NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`isNotified` boolean NOT NULL DEFAULT false,
	`notifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stockMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`variantId` int,
	`type` enum('IN','OUT','ADJUSTMENT') NOT NULL,
	`reason` enum('PURCHASE','SALE','RETURN','LOSS','ADJUSTMENT','TRANSFER') NOT NULL,
	`quantity` int NOT NULL,
	`previousStock` int NOT NULL,
	`newStock` int NOT NULL,
	`unitCost` decimal(10,2),
	`totalCost` decimal(12,2),
	`batch` varchar(50),
	`referenceId` int,
	`referenceType` varchar(50),
	`notes` text,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockMovements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`tradeName` varchar(255),
	`cnpj` varchar(18),
	`email` varchar(320),
	`phone` varchar(20),
	`address` text,
	`city` varchar(100),
	`state` varchar(2),
	`zipCode` varchar(10),
	`contactPerson` varchar(255),
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `suppliers_code_unique` UNIQUE(`code`)
);
