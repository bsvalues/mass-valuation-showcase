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
CREATE INDEX `audit_propertyid_idx` ON `assessmentAuditLog` (`propertyId`);--> statement-breakpoint
CREATE INDEX `audit_userid_idx` ON `assessmentAuditLog` (`userId`);--> statement-breakpoint
CREATE INDEX `audit_timestamp_idx` ON `assessmentAuditLog` (`timestamp`);