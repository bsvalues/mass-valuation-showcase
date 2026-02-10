CREATE TABLE `jobErrors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` varchar(36) NOT NULL,
	`rowNumber` int,
	`parcelId` varchar(100),
	`errorMessage` text NOT NULL,
	`rawJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobErrors_id` PRIMARY KEY(`id`)
);
