CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(128) NOT NULL,
	`entityType` varchar(64),
	`entityId` varchar(64),
	`details` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parcels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parcelId` varchar(64) NOT NULL,
	`address` text,
	`latitude` varchar(32),
	`longitude` varchar(32),
	`landValue` int,
	`buildingValue` int,
	`totalValue` int,
	`squareFeet` int,
	`yearBuilt` int,
	`propertyType` varchar(64),
	`neighborhood` varchar(128),
	`cluster` int,
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parcels_id` PRIMARY KEY(`id`),
	CONSTRAINT `parcels_parcelId_unique` UNIQUE(`parcelId`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parcelId` varchar(64) NOT NULL,
	`saleDate` timestamp NOT NULL,
	`salePrice` int NOT NULL,
	`squareFeet` int,
	`yearBuilt` int,
	`propertyType` varchar(64),
	`neighborhood` varchar(128),
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
);
