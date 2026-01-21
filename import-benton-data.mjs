import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.js';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('🚀 Starting Benton County data import...\n');

const records = [];
const parser = createReadStream('/home/ubuntu/upload/BentonCountyDashboard2024fulltest.xlsx')
  .pipe(parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }));

let count = 0;
for await (const record of parser) {
  count++;
  
  // Skip rows without coordinates
  const xCoord = parseFloat(record.XCoord);
  const yCoord = parseFloat(record.YCoord);
  
  if (isNaN(xCoord) || isNaN(yCoord) || xCoord === 0 || yCoord === 0) {
    continue;
  }
  
  // Parse values
  const parcelId = record.ParcelID || record.prop_id || `PARCEL-${count}`;
  const address = record.situs_display || record.primary_situs || '';
  const totalMarketValue = parseFloat(record.TotalMarketValue) || 0;
  const impVal = parseFloat(record.ImpVal) || 0;
  const landVal = parseFloat(record.LandVal) || 0;
  const totalArea = parseFloat(record.TotalArea) || parseFloat(record.calc_area) || 0;
  const yearBuilt = parseInt(record.YearBuilt) || null;
  const propertyType = record.Property_Use_desc || record.property_use_cd || 'Unknown';
  const neighborhood = record.neighborhood || '';
  const zoning = record.zoning || '';
  const acres = parseFloat(record.TotalAcres) || 0;
  
  records.push({
    parcelId: parcelId.toString(),
    address: address.trim(),
    latitude: yCoord.toString(), // YCoord is latitude
    longitude: xCoord.toString(), // XCoord is longitude
    landValue: landVal,
    buildingValue: impVal,
    totalValue: totalMarketValue,
    squareFeet: totalArea,
    yearBuilt: yearBuilt,
    propertyType: propertyType.substring(0, 50), // Limit to 50 chars
    neighborhood: neighborhood.substring(0, 100),
  });
  
  // Batch insert every 500 records
  if (records.length >= 500) {
    try {
      await db.insert(schema.parcels).values(records);
      console.log(`✅ Inserted ${records.length} records (total processed: ${count})`);
      records.length = 0; // Clear array
    } catch (error) {
      console.error('❌ Error inserting batch:', error.message);
      records.length = 0; // Clear to continue
    }
  }
}

// Insert remaining records
if (records.length > 0) {
  try {
    await db.insert(schema.parcels).values(records);
    console.log(`✅ Inserted final ${records.length} records`);
  } catch (error) {
    console.error('❌ Error inserting final batch:', error.message);
  }
}

console.log(`\n🎉 Import complete! Processed ${count} total rows`);

// Get summary stats
const result = await db.execute(`
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as with_coords,
    MIN(CAST(latitude AS DECIMAL(10,6))) as min_lat,
    MAX(CAST(latitude AS DECIMAL(10,6))) as max_lat,
    MIN(CAST(longitude AS DECIMAL(10,6))) as min_lng,
    MAX(CAST(longitude AS DECIMAL(10,6))) as max_lng
  FROM parcels
`);

console.log('\n📊 Database Summary:');
console.log(result[0][0]);

await connection.end();
