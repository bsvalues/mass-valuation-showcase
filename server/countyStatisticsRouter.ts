/**
 * tRPC Router for County Statistics
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { countyStatistics, waCountyParcels } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

export const countyStatisticsRouter = router({
  /**
   * Get statistics for all counties
   */
  getAllCountyStats: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const stats = await db
        .select()
        .from(countyStatistics)
        .orderBy(countyStatistics.countyName);
      
      return stats;
    }),
  
  /**
   * Get statistics for a specific county
   */
  getCountyStats: publicProcedure
    .input(z.object({
      countyName: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const [stats] = await db
        .select()
        .from(countyStatistics)
        .where(eq(countyStatistics.countyName, input.countyName))
        .limit(1);
      
      return stats || null;
    }),
  
  /**
   * Recalculate statistics for a county from WA parcel data
   */
  recalculateCountyStats: protectedProcedure
    .input(z.object({
      countyName: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Calculate statistics from wa_county_parcels table
      const result = await db
        .select({
          count: sql<number>`COUNT(*)`,
          avgLandValue: sql<number>`AVG(${waCountyParcels.valueLand})`,
          avgBuildingValue: sql<number>`AVG(${waCountyParcels.valueBuilding})`,
          totalAssessedValue: sql<string>`SUM(COALESCE(${waCountyParcels.valueLand}, 0) + COALESCE(${waCountyParcels.valueBuilding}, 0))`,
          minLandValue: sql<number>`MIN(${waCountyParcels.valueLand})`,
          maxLandValue: sql<number>`MAX(${waCountyParcels.valueLand})`,
          minBuildingValue: sql<number>`MIN(${waCountyParcels.valueBuilding})`,
          maxBuildingValue: sql<number>`MAX(${waCountyParcels.valueBuilding})`,
        })
        .from(waCountyParcels)
        .where(eq(waCountyParcels.countyName, input.countyName));
      
      const stats = result[0];
      
      if (!stats || stats.count === 0) {
        return {
          success: false,
          message: `No parcel data found for ${input.countyName} County`,
        };
      }
      
      // Upsert county statistics
      await db
        .insert(countyStatistics)
        .values({
          countyName: input.countyName,
          parcelCount: Number(stats.count),
          avgLandValue: Math.round(Number(stats.avgLandValue) || 0),
          avgBuildingValue: Math.round(Number(stats.avgBuildingValue) || 0),
          totalAssessedValue: String(stats.totalAssessedValue || "0"),
          minLandValue: Number(stats.minLandValue) || 0,
          maxLandValue: Number(stats.maxLandValue) || 0,
          minBuildingValue: Number(stats.minBuildingValue) || 0,
          maxBuildingValue: Number(stats.maxBuildingValue) || 0,
        })
        .onDuplicateKeyUpdate({
          set: {
            parcelCount: Number(stats.count),
            avgLandValue: Math.round(Number(stats.avgLandValue) || 0),
            avgBuildingValue: Math.round(Number(stats.avgBuildingValue) || 0),
            totalAssessedValue: String(stats.totalAssessedValue || "0"),
            minLandValue: Number(stats.minLandValue) || 0,
            maxLandValue: Number(stats.maxLandValue) || 0,
            minBuildingValue: Number(stats.minBuildingValue) || 0,
            maxBuildingValue: Number(stats.maxBuildingValue) || 0,
            lastUpdated: new Date(),
          },
        });
      
      return {
        success: true,
        message: `Statistics updated for ${input.countyName} County`,
        stats: {
          parcelCount: Number(stats.count),
          avgLandValue: Math.round(Number(stats.avgLandValue) || 0),
          avgBuildingValue: Math.round(Number(stats.avgBuildingValue) || 0),
        },
      };
    }),
});
