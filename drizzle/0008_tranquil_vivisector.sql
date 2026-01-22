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
