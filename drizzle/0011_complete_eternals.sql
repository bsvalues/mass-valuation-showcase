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
ALTER TABLE `backgroundJobs` MODIFY COLUMN `status` enum('pending','running','completed','failed','paused') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `backgroundJobs` ADD `traceId` varchar(36);--> statement-breakpoint
ALTER TABLE `backgroundJobs` ADD `processed` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `backgroundJobs` ADD `succeeded` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `backgroundJobs` ADD `failed` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `backgroundJobs` ADD `payloadJson` text;--> statement-breakpoint
ALTER TABLE `backgroundJobs` ADD `errorSummary` text;--> statement-breakpoint
ALTER TABLE `backgroundJobs` DROP COLUMN `progress`;--> statement-breakpoint
ALTER TABLE `backgroundJobs` DROP COLUMN `errorMessage`;