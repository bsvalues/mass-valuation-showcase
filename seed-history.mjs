/**
 * Seed Property History Data
 * 
 * This script populates the propertyHistory table with sample historical assessment data
 * for the first 100 parcels, showing value changes over the past 10 years.
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

async function seedHistoryData() {
  console.log('🌱 Seeding property history data...');
  
  // Get first 100 parcels
  const [parcels] = await connection.query('SELECT id, totalValue, buildingValue, landValue FROM parcels LIMIT 100');
  
  if (parcels.length === 0) {
    console.log('❌ No parcels found in database. Please import parcel data first.');
    process.exit(1);
  }
  
  console.log(`📊 Found ${parcels.length} parcels. Generating 10 years of history for each...`);
  
  const currentYear = new Date().getFullYear();
  const historyRecords = [];
  
  for (const parcel of parcels) {
    const baseTotal = parcel.totalValue || 200000;
    const baseBuilding = parcel.buildingValue || 150000;
    const baseLand = parcel.landValue || 50000;
    
    // Generate 10 years of history with realistic appreciation (2-5% per year)
    for (let i = 0; i < 10; i++) {
      const year = currentYear - (9 - i); // Start from 10 years ago
      const appreciationFactor = Math.pow(1.03, i); // 3% average appreciation per year
      const randomVariation = 0.95 + Math.random() * 0.1; // ±5% random variation
      
      const totalValue = Math.round(baseTotal * appreciationFactor * randomVariation);
      const buildingValue = Math.round(baseBuilding * appreciationFactor * randomVariation);
      const landValue = Math.round(baseLand * appreciationFactor * randomVariation);
      
      historyRecords.push({
        parcelId: parcel.id,
        assessmentYear: year,
        totalValue,
        buildingValue,
        landValue,
      });
    }
  }
  
  console.log(`💾 Inserting ${historyRecords.length} history records...`);
  
  // Batch insert in chunks of 500
  const chunkSize = 500;
  for (let i = 0; i < historyRecords.length; i += chunkSize) {
    const chunk = historyRecords.slice(i, i + chunkSize);
    const values = chunk.map(r => 
      `(${r.parcelId}, ${r.assessmentYear}, ${r.totalValue}, ${r.buildingValue}, ${r.landValue})`
    ).join(',');
    
    await connection.query(`
      INSERT INTO propertyHistory (parcelId, assessmentYear, totalValue, buildingValue, landValue)
      VALUES ${values}
    `);
    
    console.log(`✅ Inserted ${Math.min(i + chunkSize, historyRecords.length)} / ${historyRecords.length} records`);
  }
  
  console.log('🎉 Property history data seeded successfully!');
  console.log(`📈 Generated ${historyRecords.length} historical assessment records for ${parcels.length} properties`);
  
  await connection.end();
}

seedHistoryData().catch(err => {
  console.error('❌ Error seeding history data:', err);
  process.exit(1);
});
