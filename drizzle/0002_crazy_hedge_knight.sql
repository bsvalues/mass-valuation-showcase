CREATE TABLE `regressionModels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`dependentVariable` varchar(64) NOT NULL,
	`independentVariables` text NOT NULL,
	`coefficients` text NOT NULL,
	`rSquared` varchar(32),
	`adjustedRSquared` varchar(32),
	`fStatistic` varchar(32),
	`fPValue` varchar(32),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `regressionModels_id` PRIMARY KEY(`id`)
);
