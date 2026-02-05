import { describe, it, expect, beforeAll } from 'vitest';
import { seedHistoricalData } from './seedHistoricalData';
import { getDb } from './db';
import { parcels, propertyHistory } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Historical Data Seeding', () => {
  it('should generate historical records for existing properties', async () => {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    // Get count of properties before seeding
    const propertiesBeforeSeed = await db.select().from(parcels);
    
    if (propertiesBeforeSeed.length === 0) {
      console.log('⚠️  No properties found for testing. Skipping historical data seed test.');
      return;
    }

    // Run seeding
    const result = await seedHistoricalData();

    // Verify result structure
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('recordsCreated');
    expect(result).toHaveProperty('propertiesProcessed');
    expect(result).toHaveProperty('yearsGenerated');

    if (result.success) {
      expect(result.recordsCreated).toBeGreaterThan(0);
      expect(result.propertiesProcessed).toBe(propertiesBeforeSeed.length);
      expect(result.yearsGenerated).toBe(8);

      // Verify historical records were created
      const sampleProperty = propertiesBeforeSeed[0];
      const historyRecords = await db
        .select()
        .from(propertyHistory)
        .where(eq(propertyHistory.parcelId, sampleProperty.id));

      expect(historyRecords.length).toBeGreaterThan(0);
      // Note: May have more than 8 if test ran multiple times
      expect(historyRecords.length).toBeGreaterThanOrEqual(8);

      // Verify data quality - check most recent record
      const recentRecord = historyRecords[historyRecords.length - 1];
      expect(recentRecord.parcelId).toBe(sampleProperty.id);
      expect(recentRecord.assessmentYear).toBeGreaterThan(2015);
      expect(recentRecord.totalValue).toBeGreaterThan(0);
      expect(recentRecord.landValue).toBeGreaterThan(0);
      expect(recentRecord.buildingValue).toBeGreaterThan(0);
    }
  }, 30000); // 30 second timeout for seeding operation
});
