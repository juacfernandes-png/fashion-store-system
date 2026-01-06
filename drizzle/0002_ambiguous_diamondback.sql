CREATE TABLE `returnItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`returnId` int NOT NULL,
	`productId` int NOT NULL,
	`variantId` int,
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`condition` enum('NEW','USED','DAMAGED','DEFECTIVE') NOT NULL DEFAULT 'USED',
	`returnedToStock` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `returnItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `returns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`returnNumber` varchar(50) NOT NULL,
	`salesOrderId` int,
	`customerId` int,
	`unitId` int,
	`type` enum('RETURN','EXCHANGE') NOT NULL,
	`status` enum('PENDING','APPROVED','PROCESSING','COMPLETED','REJECTED') NOT NULL DEFAULT 'PENDING',
	`reason` enum('DEFECT','WRONG_SIZE','WRONG_COLOR','REGRET','DAMAGED','OTHER') NOT NULL,
	`reasonDetails` text,
	`refundAmount` decimal(12,2) DEFAULT '0',
	`refundMethod` enum('CASH','CREDIT','STORE_CREDIT','EXCHANGE'),
	`processedAt` timestamp,
	`processedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `returns_id` PRIMARY KEY(`id`),
	CONSTRAINT `returns_returnNumber_unique` UNIQUE(`returnNumber`)
);
--> statement-breakpoint
CREATE TABLE `stockTransferItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transferId` int NOT NULL,
	`productId` int NOT NULL,
	`variantId` int,
	`requestedQuantity` int NOT NULL,
	`shippedQuantity` int NOT NULL DEFAULT 0,
	`receivedQuantity` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockTransferItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stockTransfers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transferNumber` varchar(50) NOT NULL,
	`fromUnitId` int NOT NULL,
	`toUnitId` int NOT NULL,
	`status` enum('DRAFT','PENDING','APPROVED','IN_TRANSIT','RECEIVED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	`approvedBy` int,
	`shippedAt` timestamp,
	`receivedAt` timestamp,
	`receivedBy` int,
	`notes` text,
	`requestedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stockTransfers_id` PRIMARY KEY(`id`),
	CONSTRAINT `stockTransfers_transferNumber_unique` UNIQUE(`transferNumber`)
);
--> statement-breakpoint
CREATE TABLE `stockTurnover` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int,
	`productId` int NOT NULL,
	`variantId` int,
	`period` varchar(7) NOT NULL,
	`openingStock` int NOT NULL DEFAULT 0,
	`closingStock` int NOT NULL DEFAULT 0,
	`averageStock` decimal(10,2) NOT NULL DEFAULT '0',
	`totalSold` int NOT NULL DEFAULT 0,
	`totalPurchased` int NOT NULL DEFAULT 0,
	`turnoverRate` decimal(10,4) NOT NULL DEFAULT '0',
	`daysInStock` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stockTurnover_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storeUnits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('STORE','WAREHOUSE','ECOMMERCE') NOT NULL,
	`address` text,
	`city` varchar(100),
	`state` varchar(2),
	`zipCode` varchar(10),
	`phone` varchar(20),
	`email` varchar(320),
	`manager` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storeUnits_id` PRIMARY KEY(`id`),
	CONSTRAINT `storeUnits_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `unitStock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`productId` int NOT NULL,
	`variantId` int,
	`quantity` int NOT NULL DEFAULT 0,
	`minStock` int NOT NULL DEFAULT 0,
	`maxStock` int NOT NULL DEFAULT 1000,
	`reservedQuantity` int NOT NULL DEFAULT 0,
	`availableQuantity` int NOT NULL DEFAULT 0,
	`lastMovementAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unitStock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unitStockMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`productId` int NOT NULL,
	`variantId` int,
	`type` enum('IN','OUT','ADJUSTMENT') NOT NULL,
	`reason` enum('PURCHASE','SALE','RETURN','EXCHANGE','LOSS','ADJUSTMENT','TRANSFER_IN','TRANSFER_OUT','INVENTORY') NOT NULL,
	`quantity` int NOT NULL,
	`previousStock` int NOT NULL,
	`newStock` int NOT NULL,
	`unitCost` decimal(10,2),
	`referenceId` int,
	`referenceType` varchar(50),
	`batch` varchar(50),
	`barcode` varchar(100),
	`notes` text,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `unitStockMovements_id` PRIMARY KEY(`id`)
);
