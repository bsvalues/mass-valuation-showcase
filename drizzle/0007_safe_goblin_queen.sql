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
