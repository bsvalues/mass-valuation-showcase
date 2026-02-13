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
CREATE INDEX `batchjob_status_idx` ON `batchValuationJobs` (`status`);--> statement-breakpoint
CREATE INDEX `batchjob_userid_idx` ON `batchValuationJobs` (`userId`);--> statement-breakpoint
CREATE INDEX `batchjob_createdat_idx` ON `batchValuationJobs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `batchresult_jobid_idx` ON `batchValuationResults` (`jobId`);--> statement-breakpoint
CREATE INDEX `batchresult_parcelid_idx` ON `batchValuationResults` (`parcelId`);