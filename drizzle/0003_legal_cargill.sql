CREATE TABLE `calibrationSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`countyName` varchar(128),
	`costRates` text NOT NULL,
	`landModelData` text,
	`depreciationData` text,
	`neighbourhoodModifiers` text,
	`snapshotMedianRatio` float,
	`snapshotCod` float,
	`snapshotPrd` float,
	`isActive` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calibrationSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `calib_userid_idx` ON `calibrationSnapshots` (`userId`);--> statement-breakpoint
CREATE INDEX `calib_county_idx` ON `calibrationSnapshots` (`countyName`);--> statement-breakpoint
CREATE INDEX `calib_active_idx` ON `calibrationSnapshots` (`isActive`);