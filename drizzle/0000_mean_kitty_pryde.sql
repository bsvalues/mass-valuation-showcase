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
CREATE TABLE `appealTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('residential','commercial','land','industrial','agricultural') NOT NULL,
	`defaultAppealReason` text,
	`suggestedDocuments` text,
	`estimatedProcessingDays` int,
	`isActive` int NOT NULL DEFAULT 1,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appealTemplates_id` PRIMARY KEY(`id`)
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
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
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
CREATE TABLE `assessmentAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`oldStatus` enum('pending','approved','flagged'),
	`newStatus` enum('pending','approved','flagged') NOT NULL,
	`userId` int,
	`userName` varchar(255),
	`notes` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessmentAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `avmModels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`modelType` enum('randomForest','neuralNetwork') NOT NULL,
	`serializedModel` longtext NOT NULL,
	`featureStats` text NOT NULL,
	`targetStats` text NOT NULL,
	`mae` varchar(32),
	`rmse` varchar(32),
	`r2` varchar(32),
	`mape` varchar(32),
	`trainingTime` int,
	`trainingDataSize` int,
	`notes` text,
	`tags` varchar(512),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `avmModels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `backgroundJobs` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`jobType` enum('parcel_load') NOT NULL,
	`status` enum('pending','running','completed','failed','paused') NOT NULL DEFAULT 'pending',
	`traceId` varchar(36),
	`countyName` varchar(100),
	`parcelLimit` int,
	`total` int DEFAULT 0,
	`processed` int DEFAULT 0,
	`succeeded` int DEFAULT 0,
	`failed` int DEFAULT 0,
	`payloadJson` text,
	`resultSummary` text,
	`errorSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	CONSTRAINT `backgroundJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `batchJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`modelId` int,
	`status` enum('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`totalParcels` int DEFAULT 0,
	`processedParcels` int DEFAULT 0,
	`successfulParcels` int DEFAULT 0,
	`failedParcels` int DEFAULT 0,
	`progress` int DEFAULT 0,
	`errorSummary` text,
	`resultsUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	CONSTRAINT `batchJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `batchResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchJobId` int NOT NULL,
	`parcelId` varchar(50) NOT NULL,
	`predictedValue` int,
	`modelType` varchar(50),
	`features` text,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `batchResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `batchValuationJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobName` varchar(255) NOT NULL,
	`status` enum('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`totalParcels` int NOT NULL,
	`completedParcels` int NOT NULL DEFAULT 0,
	`failedParcels` int NOT NULL DEFAULT 0,
	`progress` int NOT NULL DEFAULT 0,
	`modelVersion` varchar(50),
	`filterCriteria` text,
	`errorLog` text,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `batchValuationJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `batchValuationResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`parcelId` varchar(64) NOT NULL,
	`predictedValue` int NOT NULL,
	`confidence` float,
	`actualValue` int,
	`valueDifference` int,
	`percentDifference` float,
	`propertyType` varchar(50),
	`squareFeet` int,
	`yearBuilt` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `batchValuationResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `countyStatistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`countyName` varchar(100) NOT NULL,
	`parcelCount` int DEFAULT 0,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`avgLandValue` int,
	`avgBuildingValue` int,
	`totalAssessedValue` varchar(20),
	`minLandValue` int,
	`maxLandValue` int,
	`minBuildingValue` int,
	`maxBuildingValue` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `countyStatistics_id` PRIMARY KEY(`id`),
	CONSTRAINT `countyStatistics_countyName_unique` UNIQUE(`countyName`)
);
--> statement-breakpoint
CREATE TABLE `importErrors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`rowNumber` int NOT NULL,
	`errorMessage` text NOT NULL,
	`rawData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `importErrors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `importJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileFormat` varchar(50) NOT NULL,
	`status` enum('pending','processing','completed','failed','partial') NOT NULL DEFAULT 'pending',
	`totalRecords` int DEFAULT 0,
	`successfulRecords` int DEFAULT 0,
	`failedRecords` int DEFAULT 0,
	`errorSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `importJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `importTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`mapping` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `importTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobErrors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` varchar(36) NOT NULL,
	`rowNumber` int,
	`parcelId` varchar(100),
	`errorMessage` text NOT NULL,
	`rawJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobErrors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` varchar(36) NOT NULL,
	`eventType` enum('started','progress','error','completed','failed','paused') NOT NULL,
	`message` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `neighborhoodStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`neighborhoodClusterId` int NOT NULL,
	`neighborhoodName` varchar(255),
	`county` varchar(64),
	`centerLatitude` float,
	`centerLongitude` float,
	`totalProperties` int DEFAULT 0,
	`medianHomeValue` int,
	`medianSalePrice` int,
	`medianIncome` int,
	`crimeRate` float,
	`walkabilityScore` int,
	`schoolRating` float,
	`avgDistanceToDowntown` float,
	`avgDistanceToSchool` float,
	`avgDistanceToPark` float,
	`avgDistanceToTransit` float,
	`appreciationRate3Year` float,
	`appreciationRate5Year` float,
	`avgDaysOnMarket` int,
	`salesVolume12Month` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `neighborhoodStats_id` PRIMARY KEY(`id`),
	CONSTRAINT `neighborhoodStats_neighborhoodClusterId_unique` UNIQUE(`neighborhoodClusterId`)
);
--> statement-breakpoint
CREATE TABLE `parcels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parcelId` varchar(64) NOT NULL,
	`parcelNumber` varchar(128),
	`address` text,
	`situsAddress` text,
	`latitude` varchar(32),
	`longitude` varchar(32),
	`xCoord` float,
	`yCoord` float,
	`landValue` int,
	`buildingValue` int,
	`totalValue` int,
	`assessedLandValue` int,
	`assessedImprovementValue` int,
	`totalAssessedValue` int,
	`squareFeet` int,
	`basementSqFt` int,
	`yearBuilt` int,
	`age` int,
	`bedrooms` int,
	`style` varchar(128),
	`propertyType` varchar(64),
	`propertyTypeDesc` varchar(256),
	`neighborhood` varchar(128),
	`county` varchar(64),
	`acres` float,
	`cluster` int,
	`quality` enum('economy','average','good','very_good','excellent') DEFAULT 'average',
	`condition` enum('poor','fair','average','good','excellent') DEFAULT 'average',
	`lotSize` int,
	`propertySubtype` varchar(128),
	`renovationYear` int,
	`distanceToSchool` float,
	`distanceToPark` float,
	`distanceToTransit` float,
	`distanceToDowntown` float,
	`walkabilityScore` int,
	`neighborhoodClusterId` int,
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parcels_id` PRIMARY KEY(`id`),
	CONSTRAINT `parcels_parcelId_unique` UNIQUE(`parcelId`)
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
CREATE TABLE `propertyHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parcelId` int NOT NULL,
	`assessmentYear` int NOT NULL,
	`landValue` int,
	`buildingValue` int,
	`totalValue` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propertyHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `regressionModels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`dependentVariable` varchar(64) NOT NULL,
	`independentVariables` text NOT NULL,
	`coefficients` text NOT NULL,
	`rSquared` varchar(32),
	`adjustedRSquared` varchar(32),
	`fStatistic` varchar(32),
	`fPValue` varchar(32),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `regressionModels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resolutionTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('approved','denied','partially_approved','withdrawn') NOT NULL,
	`templateText` text NOT NULL,
	`variables` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resolutionTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parcelId` varchar(64) NOT NULL,
	`saleDate` date NOT NULL,
	`salePrice` int NOT NULL,
	`assessedValue` int NOT NULL,
	`propertyType` varchar(64),
	`situsAddress` text,
	`countyName` varchar(100),
	`neighborhood` varchar(128),
	`squareFeet` int,
	`yearBuilt` int,
	`bedrooms` int,
	`bathrooms` int,
	`assessedToSaleRatio` varchar(20),
	`isArmLength` int DEFAULT 1,
	`isQualified` int DEFAULT 1,
	`exclusionReason` text,
	`neighborhoodClusterId` int,
	`latitude` float,
	`longitude` float,
	`status` enum('pending','approved','flagged') DEFAULT 'pending',
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `waCountyParcels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parcelId` varchar(64) NOT NULL,
	`countyName` varchar(100) NOT NULL,
	`fipsCode` varchar(10),
	`situsAddress` text,
	`situsCity` varchar(100),
	`situsZip` varchar(10),
	`valueLand` int,
	`valueBuilding` int,
	`propertyType` varchar(64),
	`geometry` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `waCountyParcels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `comment_appealid_idx` ON `appealComments` (`appealId`);--> statement-breakpoint
CREATE INDEX `comment_createdat_idx` ON `appealComments` (`createdAt`);--> statement-breakpoint
CREATE INDEX `document_appealid_idx` ON `appealDocuments` (`appealId`);--> statement-breakpoint
CREATE INDEX `document_createdat_idx` ON `appealDocuments` (`createdAt`);--> statement-breakpoint
CREATE INDEX `template_category_idx` ON `appealTemplates` (`category`);--> statement-breakpoint
CREATE INDEX `template_isactive_idx` ON `appealTemplates` (`isActive`);--> statement-breakpoint
CREATE INDEX `timeline_appealid_idx` ON `appealTimeline` (`appealId`);--> statement-breakpoint
CREATE INDEX `timeline_createdat_idx` ON `appealTimeline` (`createdAt`);--> statement-breakpoint
CREATE INDEX `appeal_parcelid_idx` ON `appeals` (`parcelId`);--> statement-breakpoint
CREATE INDEX `appeal_status_idx` ON `appeals` (`status`);--> statement-breakpoint
CREATE INDEX `appeal_date_idx` ON `appeals` (`appealDate`);--> statement-breakpoint
CREATE INDEX `audit_propertyid_idx` ON `assessmentAuditLog` (`propertyId`);--> statement-breakpoint
CREATE INDEX `audit_userid_idx` ON `assessmentAuditLog` (`userId`);--> statement-breakpoint
CREATE INDEX `audit_timestamp_idx` ON `assessmentAuditLog` (`timestamp`);--> statement-breakpoint
CREATE INDEX `batchjob_status_idx` ON `batchValuationJobs` (`status`);--> statement-breakpoint
CREATE INDEX `batchjob_userid_idx` ON `batchValuationJobs` (`userId`);--> statement-breakpoint
CREATE INDEX `batchjob_createdat_idx` ON `batchValuationJobs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `batchresult_jobid_idx` ON `batchValuationResults` (`jobId`);--> statement-breakpoint
CREATE INDEX `batchresult_parcelid_idx` ON `batchValuationResults` (`parcelId`);--> statement-breakpoint
CREATE INDEX `neighborhood_clusterid_idx` ON `neighborhoodStats` (`neighborhoodClusterId`);--> statement-breakpoint
CREATE INDEX `neighborhood_county_idx` ON `neighborhoodStats` (`county`);--> statement-breakpoint
CREATE INDEX `prediction_parcelid_idx` ON `predictions` (`parcelId`);--> statement-breakpoint
CREATE INDEX `prediction_userid_idx` ON `predictions` (`userId`);--> statement-breakpoint
CREATE INDEX `prediction_createdat_idx` ON `predictions` (`createdAt`);--> statement-breakpoint
CREATE INDEX `template_category_idx` ON `resolutionTemplates` (`category`);--> statement-breakpoint
CREATE INDEX `sale_parcelid_idx` ON `sales` (`parcelId`);--> statement-breakpoint
CREATE INDEX `sale_date_idx` ON `sales` (`saleDate`);--> statement-breakpoint
CREATE INDEX `sale_county_idx` ON `sales` (`countyName`);--> statement-breakpoint
CREATE INDEX `parcelid_idx` ON `waCountyParcels` (`parcelId`);--> statement-breakpoint
CREATE INDEX `countyname_idx` ON `waCountyParcels` (`countyName`);