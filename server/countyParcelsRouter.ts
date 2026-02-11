/**
 * County Parcels Router - tRPC procedures for fetching parcel data by county
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { waCountyParcels } from "../drizzle/schema";
import { eq, sql, like, or } from "drizzle-orm";

export const countyParcelsRouter = router({
  /**
   * Get all parcels for a specific county
   */
  getParcelsByCounty: publicProcedure
    .input(
      z.object({
        countyName: z.string(),
        limit: z.number().optional().default(100),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const { countyName, limit, offset } = input;

      const parcels = await db
        .select()
        .from(waCountyParcels)
        .where(eq(waCountyParcels.countyName, countyName))
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(waCountyParcels)
        .where(eq(waCountyParcels.countyName, countyName));

      return {
        parcels,
        total: countResult?.count || 0,
        limit,
        offset,
      };
    }),

  /**
   * Get value distribution statistics for a county
   */
  getCountyValueDistribution: publicProcedure
    .input(z.object({ countyName: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const { countyName } = input;

      // Get min, max, avg, median for land and building values
      const stats = await db
        .select({
          minLandValue: sql<number>`MIN(${waCountyParcels.valueLand})`,
          maxLandValue: sql<number>`MAX(${waCountyParcels.valueLand})`,
          avgLandValue: sql<number>`AVG(${waCountyParcels.valueLand})`,
          minBuildingValue: sql<number>`MIN(${waCountyParcels.valueBuilding})`,
          maxBuildingValue: sql<number>`MAX(${waCountyParcels.valueBuilding})`,
          avgBuildingValue: sql<number>`AVG(${waCountyParcels.valueBuilding})`,
          parcelCount: sql<number>`COUNT(*)`,
        })
        .from(waCountyParcels)
        .where(eq(waCountyParcels.countyName, countyName));

      return stats[0] || null;
    }),

  /**
   * Get value distribution histogram data
   */
  getValueHistogram: publicProcedure
    .input(
      z.object({
        countyName: z.string(),
        valueType: z.enum(["land", "building", "total"]),
        bucketCount: z.number().optional().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const { countyName, valueType, bucketCount } = input;

      // Determine which value column to use
      const valueColumn =
        valueType === "land"
          ? waCountyParcels.valueLand
          : valueType === "building"
          ? waCountyParcels.valueBuilding
          : sql`${waCountyParcels.valueLand} + ${waCountyParcels.valueBuilding}`;

      // Get min and max values to calculate bucket ranges
      const [rangeResult] = await db
        .select({
          minValue: sql<number>`MIN(${valueColumn})`,
          maxValue: sql<number>`MAX(${valueColumn})`,
        })
        .from(waCountyParcels)
        .where(eq(waCountyParcels.countyName, countyName));

      if (!rangeResult || rangeResult.minValue === null || rangeResult.maxValue === null) {
        return { buckets: [], minValue: 0, maxValue: 0 };
      }

      const { minValue, maxValue } = rangeResult;
      const bucketSize = (maxValue - minValue) / bucketCount;

      // Use a single optimized query with CASE statements for histogram
      const bucketConditions = [];
      for (let i = 0; i < bucketCount; i++) {
        const bucketMin = minValue + i * bucketSize;
        const bucketMax = minValue + (i + 1) * bucketSize;
        bucketConditions.push({
          min: bucketMin,
          max: bucketMax,
          range: `$${Math.round(bucketMin).toLocaleString()} - $${Math.round(bucketMax).toLocaleString()}`,
        });
      }

      // Build CASE statement for all buckets
      const caseStatements = bucketConditions
        .map(
          (b, i) =>
            `SUM(CASE WHEN ${valueType === "land" ? "value_land" : valueType === "building" ? "value_building" : "(value_land + value_building)"} >= ${b.min} AND ${valueType === "land" ? "value_land" : valueType === "building" ? "value_building" : "(value_land + value_building)"} < ${b.max} THEN 1 ELSE 0 END) as bucket_${i}`
        )
        .join(", ");

      const [histogramResult] = await db.execute(
        sql.raw(`SELECT ${caseStatements} FROM wa_county_parcels WHERE county_name = '${countyName}'`)
      );

      const buckets = bucketConditions.map((b, i) => ({
        range: b.range,
        count: (histogramResult as any)[`bucket_${i}`] || 0,
        minValue: b.min,
        maxValue: b.max,
      }));

      return { buckets, minValue, maxValue };
    }),

  /**
   * Search parcels by parcel ID or address
   * Supports debounced client-side search with pagination
   */
  searchParcels: publicProcedure
    .input(
      z.object({
        countyName: z.string(),
        searchTerm: z.string().min(1),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const { countyName, searchTerm, limit, offset } = input;

      // Search by parcel ID (exact and partial match) or address (fuzzy)
      const searchPattern = `%${searchTerm}%`;
      
      const parcels = await db
        .select()
        .from(waCountyParcels)
        .where(
          sql`${waCountyParcels.countyName} = ${countyName} AND (
            ${waCountyParcels.parcelId} LIKE ${searchPattern} OR
            ${waCountyParcels.situsAddress} LIKE ${searchPattern}
          )`
        )
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(waCountyParcels)
        .where(
          sql`${waCountyParcels.countyName} = ${countyName} AND (
            ${waCountyParcels.parcelId} LIKE ${searchPattern} OR
            ${waCountyParcels.situsAddress} LIKE ${searchPattern}
          )`
        );

      return {
        parcels,
        total: countResult?.count || 0,
        limit,
        offset,
        searchTerm,
      };
    }),
});
