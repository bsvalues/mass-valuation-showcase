import { getDb } from './db';
import { parcels, propertyHistory } from '../drizzle/schema';

/**
 * Seed historical property data for trend visualization
 * Generates 5-10 years of assessment values with realistic year-over-year growth
 */
export async function seedHistoricalData() {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  console.log('🌱 Starting historical data seeding...');

  // Fetch all existing properties
  const allProperties = await db.select().from(parcels);
  console.log(`📊 Found ${allProperties.length} properties to seed`);

  if (allProperties.length === 0) {
    console.log('⚠️  No properties found. Please import property data first.');
    return { success: false, message: 'No properties to seed' };
  }

  const currentYear = new Date().getFullYear();
  const yearsToGenerate = 8; // Generate 8 years of historical data
  const startYear = currentYear - yearsToGenerate;

  let totalRecordsCreated = 0;

  // Process each property
  for (const property of allProperties) {
    const currentValue = property.totalValue || 0;
    
    if (currentValue === 0) {
      console.log(`⏭️  Skipping property ${property.id} (no current value)`);
      continue;
    }

    // Generate realistic historical values with year-over-year growth
    const historicalRecords = [];
    
    for (let yearOffset = yearsToGenerate; yearOffset >= 1; yearOffset--) {
      const year = currentYear - yearOffset;
      
      // Calculate historical value with realistic growth patterns
      // Average annual appreciation: 3-7% with some volatility
      const baseGrowthRate = 0.05; // 5% average
      const volatility = (Math.random() - 0.5) * 0.04; // ±2% random variation
      const annualGrowthRate = baseGrowthRate + volatility;
      
      // Compound growth backwards from current value
      const yearsFromNow = yearOffset;
      const historicalValue = Math.round(
        currentValue / Math.pow(1 + annualGrowthRate, yearsFromNow)
      );

      // Calculate land and building value proportions
      const landRatio = property.landValue && property.totalValue 
        ? property.landValue / property.totalValue 
        : 0.3; // Default 30% land, 70% building
      
      const historicalLandValue = Math.round(historicalValue * landRatio);
      const historicalBuildingValue = Math.round(historicalValue * (1 - landRatio));
      // Adjust total to match sum (handle rounding)
      const adjustedTotal = historicalLandValue + historicalBuildingValue;

      historicalRecords.push({
        parcelId: property.id,
        assessmentYear: year,
        landValue: historicalLandValue,
        buildingValue: historicalBuildingValue,
        totalValue: adjustedTotal,
      });
    }

    // Insert historical records for this property
    try {
      await db.insert(propertyHistory).values(historicalRecords);
      totalRecordsCreated += historicalRecords.length;
      
      if (totalRecordsCreated % 100 === 0) {
        console.log(`✅ Created ${totalRecordsCreated} historical records...`);
      }
    } catch (error) {
      console.error(`❌ Error seeding property ${property.id}:`, error);
    }
  }

  console.log(`🎉 Historical data seeding complete!`);
  console.log(`📈 Created ${totalRecordsCreated} historical records for ${allProperties.length} properties`);
  console.log(`📅 Years covered: ${startYear} - ${currentYear - 1}`);

  return {
    success: true,
    recordsCreated: totalRecordsCreated,
    propertiesProcessed: allProperties.length,
    yearsGenerated: yearsToGenerate,
    startYear,
    endYear: currentYear - 1,
  };
}
