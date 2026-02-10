CREATE TABLE `waCountyParcels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parcelId` varchar(64) NOT NULL,
	`countyName` varchar(100) NOT NULL,
	`fipsCode` varchar(10),
	`situsAddress` text,
	`situsCity` varchar(100),
	`situsZip` varchar(10),
	`valueLand` int,
	`valueBuilding` int,
	`geometry` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `waCountyParcels_id` PRIMARY KEY(`id`)
);
