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
