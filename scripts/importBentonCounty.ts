/**
 * Import Benton County spatial data into database
 * Usage: tsx scripts/importBentonCounty.ts /path/to/comper_spatialest.csv
 */

import { readFileSync } from 'fs';
import { getDb } from '../server/db';
import { parcels, sales } from '../drizzle/schema';

interface BentonCountyRow {
  parcelId: string;
  parcelNumber: string;
  situsAddress: string;
  propertyType: string;
  propertyTypeDesc: string;
  squareFeet: number | null;
  basementSqFt: number | null;
  yearBuilt: number | null;
  age: number | null;
  bedrooms: number | null;
  style: string | null;
  assessedLandValue: number;
  assessedImprovementValue: number;
  totalAssessedValue: number;
  acres: number | null;
  salePrice: number | null;
  saleDate: string | null;
  saleInstrument: string | null;
  xCoord: number | null;
  yCoord: number | null;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  fields.push(current.trim());
  return fields;
}

function parseNumber(value: string): number | null {
  if (!value || value === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Format: "MM/DD/YYYY          " (with trailing spaces)
  const cleaned = dateStr.trim();
  const parts = cleaned.split('/');
  
  if (parts.length !== 3) return null;
  
  const month = parseInt(parts[0]);
  const day = parseInt(parts[1]);
  const year = parseInt(parts[2]);
  
  if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
  
  return new Date(year, month - 1, day);
}

function parseBentonCountyRow(fields: string[]): BentonCountyRow | null {
  try {
    const parcelId = fields[0];
    const parcelNumber = fields[1];
    const situsAddress = fields[3];
    
    // Skip header row
    if (parcelId === 'ParcelID') return null;
    
    // Skip rows without parcel ID
    if (!parcelId || parcelId === '') return null;
    
    const propertyType = fields[14] || '';
    const propertyTypeDesc = fields[16] || '';
    const squareFeet = parseNumber(fields[20]);
    const basementSqFt = parseNumber(fields[21]);
    const yearBuilt = parseNumber(fields[24]);
    const age = parseNumber(fields[25]);
    const bedrooms = parseNumber(fields[28]);
    const style = fields[30] || null;
    
    const assessedLandValue = parseNumber(fields[39]) || 0;
    const assessedImprovementValue = parseNumber(fields[40]) || 0;
    const totalAssessedValue = parseNumber(fields[41]) || 0;
    const acres = parseNumber(fields[44]);
    
    const salePrice = parseNumber(fields[54]); // OriginalSalePrice (column 55, 0-indexed 54)
    const saleDate = fields[55] || null; // SaleDate (column 56, 0-indexed 55)
    const saleInstrument = fields[51] || null; // deed_type_cd (column 52, 0-indexed 51)
    
    const xCoord = parseNumber(fields[61]);
    const yCoord = parseNumber(fields[62]);
    
    return {
      parcelId,
      parcelNumber,
      situsAddress,
      propertyType,
      propertyTypeDesc,
      squareFeet,
      basementSqFt,
      yearBuilt,
      age,
      bedrooms,
      style,
      assessedLandValue,
      assessedImprovementValue,
      totalAssessedValue,
      acres,
      salePrice,
      saleDate,
      saleInstrument,
      xCoord,
      yCoord,
    };
  } catch (error) {
    console.error('Error parsing row:', error);
    return null;
  }
}

async function importBentonCountyData(csvPath: string) {
  console.log('Reading CSV file:', csvPath);
  const fileContent = readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split('\n');
  
  console.log(`Total lines: ${lines.length}`);
  
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }
  
  let parcelCount = 0;
  let salesCount = 0;
  let errorCount = 0;
  
  const batchSize = 100;
  let parcelBatch: any[] = [];
  let salesBatch: any[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields = parseCSVLine(line);
    const row = parseBentonCountyRow(fields);
    
    if (!row) {
      if (i > 0) errorCount++; // Don't count header as error
      continue;
    }
    
    // Prepare parcel insert
    const parcelData = {
      parcelId: row.parcelId,
      parcelNumber: row.parcelNumber,
      situsAddress: row.situsAddress,
      propertyType: row.propertyType,
      propertyTypeDesc: row.propertyTypeDesc,
      squareFeet: row.squareFeet,
      basementSqFt: row.basementSqFt,
      yearBuilt: row.yearBuilt,
      age: row.age,
      bedrooms: row.bedrooms,
      style: row.style,
      assessedLandValue: row.assessedLandValue,
      assessedImprovementValue: row.assessedImprovementValue,
      totalAssessedValue: row.totalAssessedValue,
      acres: row.acres,
      xCoord: row.xCoord,
      yCoord: row.yCoord,
      county: 'Benton',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    parcelBatch.push(parcelData);
    parcelCount++;
    
    // If there's a sale, prepare sale insert
    if (row.salePrice && row.salePrice > 0 && row.saleDate) {
      const saleDateParsed = parseDate(row.saleDate);
      
      if (saleDateParsed) {
        const saleData = {
          parcelId: row.parcelId,
          salePrice: row.salePrice,
          saleDate: saleDateParsed,
          assessedValue: row.totalAssessedValue,
          propertyType: row.propertyType,
          situsAddress: row.situsAddress,
          countyName: 'Benton',
          squareFeet: row.squareFeet,
          yearBuilt: row.yearBuilt,
          bedrooms: row.bedrooms,
          assessedToSaleRatio: (row.totalAssessedValue / row.salePrice).toFixed(4),
          createdAt: new Date(),
        };
        
        salesBatch.push(saleData);
        salesCount++;
      }
    }
    
    // Insert in batches
    if (parcelBatch.length >= batchSize) {
      try {
        await db.insert(parcels).values(parcelBatch).onDuplicateKeyUpdate({
          set: { updatedAt: new Date() }
        });
        console.log(`Inserted ${parcelCount} parcels...`);
      } catch (error) {
        console.error('Error inserting parcel batch:', error);
      }
      parcelBatch = [];
    }
    
    if (salesBatch.length >= batchSize) {
      try {
        await db.insert(sales).values(salesBatch);
        console.log(`Inserted ${salesCount} sales...`);
      } catch (error) {
        console.error('Error inserting sales batch:', error);
      }
      salesBatch = [];
    }
  }
  
  // Insert remaining records
  if (parcelBatch.length > 0) {
    try {
      await db.insert(parcels).values(parcelBatch).onDuplicateKeyUpdate({
        set: { updatedAt: new Date() }
      });
    } catch (error) {
      console.error('Error inserting final parcel batch:', error);
    }
  }
  
  if (salesBatch.length > 0) {
    try {
      await db.insert(sales).values(salesBatch);
    } catch (error) {
      console.error('Error inserting final sales batch:', error);
    }
  }
  
  console.log('\n=== Import Complete ===');
  console.log(`Parcels imported: ${parcelCount}`);
  console.log(`Sales imported: ${salesCount}`);
  console.log(`Errors: ${errorCount}`);
}

// Run import
const csvPath = process.argv[2] || '/home/ubuntu/upload/comper_spatialest.csv';
importBentonCountyData(csvPath)
  .then(() => {
    console.log('Import finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
