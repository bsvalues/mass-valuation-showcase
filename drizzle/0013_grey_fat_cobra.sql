CREATE TABLE `appealComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appealId` int NOT NULL,
	`commentType` enum('internal','owner_communication') NOT NULL DEFAULT 'internal',
	`content` text NOT NULL,
	`authorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appealComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appealDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appealId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int NOT NULL,
	`fileType` varchar(100) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` varchar(1024) NOT NULL,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `appealDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appealTimeline` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appealId` int NOT NULL,
	`previousStatus` enum('pending','in_review','hearing_scheduled','resolved','withdrawn'),
	`newStatus` enum('pending','in_review','hearing_scheduled','resolved','withdrawn') NOT NULL,
	`action` varchar(255) NOT NULL,
	`notes` text,
	`performedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `appealTimeline_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appeals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parcelId` varchar(64) NOT NULL,
	`appealDate` date NOT NULL,
	`currentAssessedValue` int NOT NULL,
	`appealedValue` int NOT NULL,
	`finalValue` int,
	`status` enum('pending','in_review','hearing_scheduled','resolved','withdrawn') NOT NULL DEFAULT 'pending',
	`appealReason` text,
	`resolution` text,
	`countyName` varchar(100),
	`filedBy` int,
	`assignedTo` int,
	`ownerEmail` varchar(255),
	`hearingDate` date,
	`resolutionDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appeals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parcelId` varchar(64),
	`squareFeet` int NOT NULL,
	`yearBuilt` int NOT NULL,
	`bedrooms` int NOT NULL,
	`propertyType` varchar(50) NOT NULL,
	`basementSqFt` int,
	`acres` float,
	`predictedValue` int NOT NULL,
	`modelVersion` varchar(50),
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sales` MODIFY COLUMN `saleDate` date NOT NULL;--> statement-breakpoint
ALTER TABLE `parcels` ADD `parcelNumber` varchar(128);--> statement-breakpoint
ALTER TABLE `parcels` ADD `situsAddress` text;--> statement-breakpoint
ALTER TABLE `parcels` ADD `xCoord` float;--> statement-breakpoint
ALTER TABLE `parcels` ADD `yCoord` float;--> statement-breakpoint
ALTER TABLE `parcels` ADD `assessedLandValue` int;--> statement-breakpoint
ALTER TABLE `parcels` ADD `assessedImprovementValue` int;--> statement-breakpoint
ALTER TABLE `parcels` ADD `totalAssessedValue` int;--> statement-breakpoint
ALTER TABLE `parcels` ADD `basementSqFt` int;--> statement-breakpoint
ALTER TABLE `parcels` ADD `age` int;--> statement-breakpoint
ALTER TABLE `parcels` ADD `bedrooms` int;--> statement-breakpoint
ALTER TABLE `parcels` ADD `style` varchar(128);--> statement-breakpoint
ALTER TABLE `parcels` ADD `propertyTypeDesc` varchar(256);--> statement-breakpoint
ALTER TABLE `parcels` ADD `county` varchar(64);--> statement-breakpoint
ALTER TABLE `parcels` ADD `acres` float;--> statement-breakpoint
ALTER TABLE `sales` ADD `assessedValue` int NOT NULL;--> statement-breakpoint
ALTER TABLE `sales` ADD `situsAddress` text;--> statement-breakpoint
ALTER TABLE `sales` ADD `countyName` varchar(100);--> statement-breakpoint
ALTER TABLE `sales` ADD `bedrooms` int;--> statement-breakpoint
ALTER TABLE `sales` ADD `bathrooms` int;--> statement-breakpoint
ALTER TABLE `sales` ADD `assessedToSaleRatio` varchar(20);--> statement-breakpoint
ALTER TABLE `sales` ADD `isArmLength` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `sales` ADD `isQualified` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `sales` ADD `exclusionReason` text;--> statement-breakpoint
ALTER TABLE `sales` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `waCountyParcels` ADD `propertyType` varchar(64);--> statement-breakpoint
CREATE INDEX `comment_appealid_idx` ON `appealComments` (`appealId`);--> statement-breakpoint
CREATE INDEX `comment_createdat_idx` ON `appealComments` (`createdAt`);--> statement-breakpoint
CREATE INDEX `document_appealid_idx` ON `appealDocuments` (`appealId`);--> statement-breakpoint
CREATE INDEX `document_createdat_idx` ON `appealDocuments` (`createdAt`);--> statement-breakpoint
CREATE INDEX `timeline_appealid_idx` ON `appealTimeline` (`appealId`);--> statement-breakpoint
CREATE INDEX `timeline_createdat_idx` ON `appealTimeline` (`createdAt`);--> statement-breakpoint
CREATE INDEX `appeal_parcelid_idx` ON `appeals` (`parcelId`);--> statement-breakpoint
CREATE INDEX `appeal_status_idx` ON `appeals` (`status`);--> statement-breakpoint
CREATE INDEX `appeal_date_idx` ON `appeals` (`appealDate`);--> statement-breakpoint
CREATE INDEX `prediction_parcelid_idx` ON `predictions` (`parcelId`);--> statement-breakpoint
CREATE INDEX `prediction_userid_idx` ON `predictions` (`userId`);--> statement-breakpoint
CREATE INDEX `prediction_createdat_idx` ON `predictions` (`createdAt`);--> statement-breakpoint
CREATE INDEX `sale_parcelid_idx` ON `sales` (`parcelId`);--> statement-breakpoint
CREATE INDEX `sale_date_idx` ON `sales` (`saleDate`);--> statement-breakpoint
CREATE INDEX `sale_county_idx` ON `sales` (`countyName`);--> statement-breakpoint
CREATE INDEX `parcelid_idx` ON `waCountyParcels` (`parcelId`);--> statement-breakpoint
CREATE INDEX `countyname_idx` ON `waCountyParcels` (`countyName`);