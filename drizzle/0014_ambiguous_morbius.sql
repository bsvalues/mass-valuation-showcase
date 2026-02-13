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
CREATE INDEX `template_category_idx` ON `resolutionTemplates` (`category`);