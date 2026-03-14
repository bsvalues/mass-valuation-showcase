/**
 * tRPC Router for County Statistics
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { countyStatistics, waCountyParcels, sales } from '../drizzle/schema';
import { eq, sql, and } from 'drizzle-orm';

/**
 * Compute IAAO ratio study statistics from an array of ratio rows.
 * - Median Ratio: middle value of sorted ratios
 * - COD: Coefficient of Dispersion = (mean absolute deviation from median / median) * 100
 * - PRD: Price-Related Differential = mean ratio / weighted mean ratio
 */
function computeRatioStats(rows: { ratio: number; salePrice: number; assessedValue: number }[]) {
  if (rows.length === 0) return null;
  const ratios = rows.map(r => r.ratio).sort((a, b) => a - b);
  const n = ratios.length;
  const medianRatio = n % 2 === 0
    ? (ratios[n / 2 - 1] + ratios[n / 2]) / 2
    : ratios[Math.floor(n / 2)];
  const mad = ratios.reduce((sum, r) => sum + Math.abs(r - medianRatio), 0) / n;
  const cod = medianRatio > 0 ? (mad / medianRatio) * 100 : 0;
  const meanRatio = ratios.reduce((s, r) => s + r, 0) / n;
  const totalAssessed = rows.reduce((s, r) => s + r.assessedValue, 0);
  const totalSale = rows.reduce((s, r) => s + r.salePrice, 0);
  const weightedMean = totalSale > 0 ? totalAssessed / totalSale : meanRatio;
  const prd = weightedMean > 0 ? meanRatio / weightedMean : 1.0;
  return {
    medianRatio: parseFloat(medianRatio.toFixed(4)),
    cod: parseFloat(cod.toFixed(4)),
    prd: parseFloat(prd.toFixed(4)),
    qualifiedSalesCount: n,
  };
}

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
      
      // ── 2. Ratio study stats from qualified sales ─────────────────────────
      const salesRows = await db
        .select({
          assessedToSaleRatio: sales.assessedToSaleRatio,
          salePrice: sales.salePrice,
          assessedValue: sales.assessedValue,
        })
        .from(sales)
        .where(
          and(
            eq(sales.countyName, input.countyName),
            eq(sales.isQualified, 1),
          )
        );

      const ratioRows = salesRows
        .map(r => ({
          ratio: parseFloat(r.assessedToSaleRatio ?? '0'),
          salePrice: r.salePrice,
          assessedValue: r.assessedValue,
        }))
        .filter(r => r.ratio > 0 && r.ratio < 5);

      const ratioStats = computeRatioStats(ratioRows);

      // ── 3. Upsert county statistics ───────────────────────────────────────
      const upsertBase = {
        countyName: input.countyName,
        parcelCount: Number(stats.count),
        avgLandValue: Math.round(Number(stats.avgLandValue) || 0),
        avgBuildingValue: Math.round(Number(stats.avgBuildingValue) || 0),
        totalAssessedValue: String(stats.totalAssessedValue || '0'),
        minLandValue: Number(stats.minLandValue) || 0,
        maxLandValue: Number(stats.maxLandValue) || 0,
        minBuildingValue: Number(stats.minBuildingValue) || 0,
        maxBuildingValue: Number(stats.maxBuildingValue) || 0,
        ...(ratioStats ? {
          medianRatio: ratioStats.medianRatio,
          cod: ratioStats.cod,
          prd: ratioStats.prd,
          qualifiedSalesCount: ratioStats.qualifiedSalesCount,
        } : {}),
      };

      await db
        .insert(countyStatistics)
        .values(upsertBase)
        .onDuplicateKeyUpdate({
          set: {
            ...upsertBase,
            lastUpdated: new Date(),
          },
        });

      return {
        success: true,
        message: `Statistics updated for ${input.countyName} County`,
        countyName: input.countyName,
        stats: {
          parcelCount: Number(stats.count),
          avgLandValue: Math.round(Number(stats.avgLandValue) || 0),
          avgBuildingValue: Math.round(Number(stats.avgBuildingValue) || 0),
          ...(ratioStats ?? {}),
        },
      };
    }),
});
