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
CREATE INDEX `template_category_idx` ON `appealTemplates` (`category`);--> statement-breakpoint
CREATE INDEX `template_isactive_idx` ON `appealTemplates` (`isActive`);