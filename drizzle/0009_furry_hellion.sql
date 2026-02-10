CREATE TABLE `backgroundJobs` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`jobType` enum('parcel_load') NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`progress` int DEFAULT 0,
	`total` int DEFAULT 0,
	`countyName` varchar(100),
	`parcelLimit` int,
	`resultSummary` text,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	CONSTRAINT `backgroundJobs_id` PRIMARY KEY(`id`)
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
