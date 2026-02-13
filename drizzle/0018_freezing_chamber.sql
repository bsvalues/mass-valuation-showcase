CREATE TABLE `neighborhoodStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`neighborhoodClusterId` int NOT NULL,
	`neighborhoodName` varchar(255),
	`county` varchar(64),
	`centerLatitude` float,
	`centerLongitude` float,
	`totalProperties` int DEFAULT 0,
	`medianHomeValue` int,
	`medianSalePrice` int,
	`medianIncome` int,
	`crimeRate` float,
	`walkabilityScore` int,
	`schoolRating` float,
	`avgDistanceToDowntown` float,
	`avgDistanceToSchool` float,
	`avgDistanceToPark` float,
	`avgDistanceToTransit` float,
	`appreciationRate3Year` float,
	`appreciationRate5Year` float,
	`avgDaysOnMarket` int,
	`salesVolume12Month` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `neighborhoodStats_id` PRIMARY KEY(`id`),
	CONSTRAINT `neighborhoodStats_neighborhoodClusterId_unique` UNIQUE(`neighborhoodClusterId`)
);
--> statement-breakpoint
ALTER TABLE `parcels` ADD `quality` enum('economy','average','good','very_good','excellent') DEFAULT 'average';--> statement-breakpoint
ALTER TABLE `parcels` ADD `condition` enum('poor','fair','average','good','excellent') DEFAULT 'average';--> statement-breakpoint
ALTER TABLE `parcels` ADD `lotSize` int;--> statement-breakpoint
ALTER TABLE `parcels` ADD `propertySubtype` varchar(128);--> statement-breakpoint
ALTER TABLE `parcels` ADD `renovationYear` int;--> statement-breakpoint
ALTER TABLE `parcels` ADD `distanceToSchool` float;--> statement-breakpoint
ALTER TABLE `parcels` ADD `distanceToPark` float;--> statement-breakpoint
ALTER TABLE `parcels` ADD `distanceToTransit` float;--> statement-breakpoint
ALTER TABLE `parcels` ADD `distanceToDowntown` float;--> statement-breakpoint
ALTER TABLE `parcels` ADD `walkabilityScore` int;--> statement-breakpoint
ALTER TABLE `parcels` ADD `neighborhoodClusterId` int;--> statement-breakpoint
CREATE INDEX `neighborhood_clusterid_idx` ON `neighborhoodStats` (`neighborhoodClusterId`);--> statement-breakpoint
CREATE INDEX `neighborhood_county_idx` ON `neighborhoodStats` (`county`);