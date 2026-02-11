-- Add Benton County spatial data fields to parcels table
ALTER TABLE `parcels` 
  ADD COLUMN IF NOT EXISTS `parcelNumber` VARCHAR(128),
  ADD COLUMN IF NOT EXISTS `situsAddress` TEXT,
  ADD COLUMN IF NOT EXISTS `xCoord` FLOAT,
  ADD COLUMN IF NOT EXISTS `yCoord` FLOAT,
  ADD COLUMN IF NOT EXISTS `assessedLandValue` INT,
  ADD COLUMN IF NOT EXISTS `assessedImprovementValue` INT,
  ADD COLUMN IF NOT EXISTS `totalAssessedValue` INT,
  ADD COLUMN IF NOT EXISTS `basementSqFt` INT,
  ADD COLUMN IF NOT EXISTS `age` INT,
  ADD COLUMN IF NOT EXISTS `bedrooms` INT,
  ADD COLUMN IF NOT EXISTS `style` VARCHAR(128),
  ADD COLUMN IF NOT EXISTS `propertyTypeDesc` VARCHAR(256),
  ADD COLUMN IF NOT EXISTS `county` VARCHAR(64),
  ADD COLUMN IF NOT EXISTS `acres` FLOAT;

-- Add additional fields to sales table for Benton County data
ALTER TABLE `sales`
  ADD COLUMN IF NOT EXISTS `ratio` FLOAT,
  ADD COLUMN IF NOT EXISTS `county` VARCHAR(64),
  ADD COLUMN IF NOT EXISTS `saleInstrument` VARCHAR(64);
