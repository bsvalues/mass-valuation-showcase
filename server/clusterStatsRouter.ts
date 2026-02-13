import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { neighborhoodStats, sales } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

export const clusterStatsRouter = router({
  /**
   * Get statistics for a specific cluster
   */
  getClusterById: publicProcedure
    .input(z.object({
      clusterId: z.number(),
    }))
    .query(async ({ input }) => {
      const { clusterId } = input;

      const db = await getDb();
      if (!db) return null;

      // Fetch from neighborhoodStats table
      const stats = await db
        .select()
        .from(neighborhoodStats)
        .where(eq(neighborhoodStats.neighborhoodClusterId, clusterId))
        .limit(1);

      if (stats.length === 0) {
        // If no stats exist, calculate from sales table  
        const clusterSales = await db!
          .select({
            count: sql<number>`COUNT(*)`,
            medianPrice: sql<number>`AVG(${sales.salePrice})`,
            medianSqft: sql<number>`AVG(${sales.squareFeet})`,
            medianAge: sql<number>`AVG(YEAR(CURDATE()) - ${sales.yearBuilt})`,
            medianPriceSqft: sql<number>`AVG(${sales.salePrice} / NULLIF(${sales.squareFeet}, 0))`,
          })
          .from(sales)
          .where(sql`neighborhoodClusterId = ${clusterId}`);

        if (clusterSales.length > 0 && clusterSales[0].count > 0) {
          return {
            id: clusterId,
            clusterId,
            propertyCount: clusterSales[0].count,
            medianPrice: clusterSales[0].medianPrice || 0,
            medianSqft: clusterSales[0].medianSqft || 0,
            medianAge: clusterSales[0].medianAge || 0,
            medianPriceSqft: clusterSales[0].medianPriceSqft || 0,
            medianQuality: 3.0, // Default
          };
        }
      }

      return stats[0] || null;
    }),

  /**
   * Get all cluster statistics
   */
  getAllClusters: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];

      // Try to fetch from neighborhoodStats table first
      const stats = await db
        .select()
        .from(neighborhoodStats)
        .orderBy(neighborhoodStats.neighborhoodClusterId);

      if (stats.length > 0) {
        return stats;
      }

      // If no stats exist, calculate from sales table
      const clusterData = await db!
        .select({
          clusterId: sales.neighborhoodClusterId,
          count: sql<number>`COUNT(*)`,
          medianPrice: sql<number>`AVG(${sales.salePrice})`, // Using AVG as fallback
          medianSqft: sql<number>`AVG(${sales.squareFeet})`,
          medianAge: sql<number>`AVG(YEAR(CURDATE()) - ${sales.yearBuilt})`,
        })
        .from(sales)
        .where(sql`${sales.neighborhoodClusterId} IS NOT NULL`)
        .groupBy(sales.neighborhoodClusterId)
        .orderBy(sales.neighborhoodClusterId);

      return clusterData.map((cluster: any, index: number) => ({
        id: cluster.clusterId || index,
        clusterId: cluster.clusterId || index,
        propertyCount: cluster.count,
        medianPrice: cluster.medianPrice || 0,
        medianSqft: cluster.medianSqft || 0,
        medianAge: cluster.medianAge || 0,
        medianPriceSqft: cluster.medianPrice && cluster.medianSqft 
          ? cluster.medianPrice / cluster.medianSqft 
          : 0,
        medianQuality: 3.0,
      }));
    }),

  /**
   * Get properties in a specific cluster
   */
  getClusterProperties: publicProcedure
    .input(z.object({
      clusterId: z.number(),
      limit: z.number().optional().default(100),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input }) => {
      const { clusterId, limit, offset } = input;

      const db = await getDb();
      if (!db) return [];

      const properties = await db
        .select({
          id: sales.id,
          parcelNumber: sales.parcelId,
          siteAddress: sales.situsAddress,
          salePrice: sales.salePrice,
          squareFeet: sales.squareFeet,
          yearBuilt: sales.yearBuilt,
        })
        .from(sales)
        .where(sql`neighborhoodClusterId = ${clusterId}`)
        .limit(limit)
        .offset(offset);

      return properties;
    }),

  /**
   * Get cluster boundaries (for map visualization)
   */
  getClusterBoundaries: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];

      // Get min/max coordinates for each cluster
      const boundaries = await db
        .select({
          clusterId: sales.neighborhoodClusterId,
          minLat: sql<number>`MIN(CAST(latitude AS DECIMAL(10,6)))`,
          maxLat: sql<number>`MAX(CAST(latitude AS DECIMAL(10,6)))`,
          minLng: sql<number>`MIN(CAST(longitude AS DECIMAL(10,6)))`,
          maxLng: sql<number>`MAX(CAST(longitude AS DECIMAL(10,6)))`,
          count: sql<number>`COUNT(*)`,
        })
        .from(sales)
        .where(sql`neighborhoodClusterId IS NOT NULL`)
        .groupBy(sales.neighborhoodClusterId);

      return boundaries.map((b: any) => ({
        clusterId: b.clusterId || 0,
        bounds: {
          north: b.maxLat || 0,
          south: b.minLat || 0,
          east: b.maxLng || 0,
          west: b.minLng || 0,
        },
        propertyCount: b.count,
      }));
    }),
});
