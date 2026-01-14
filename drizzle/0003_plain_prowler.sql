CREATE TABLE `avmModels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`modelType` enum('randomForest','neuralNetwork') NOT NULL,
	`serializedModel` longtext NOT NULL,
	`featureStats` text NOT NULL,
	`targetStats` text NOT NULL,
	`mae` varchar(32),
	`rmse` varchar(32),
	`r2` varchar(32),
	`mape` varchar(32),
	`trainingTime` int,
	`trainingDataSize` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `avmModels_id` PRIMARY KEY(`id`)
);
