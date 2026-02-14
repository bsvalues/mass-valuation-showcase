import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { sales, neighborhoodStats } from "../drizzle/schema";
import { sql, eq, and, gte, or } from "drizzle-orm";

export const assessmentReviewRouter = router({
  getHighVarianceProperties: publicProcedure
    .input(
      z.object({
        minVariancePercent: z.number().default(15), // Minimum variance threshold
        limit: z.number().default(100),
        offset: z.number().default(0),
        severity: z.enum(["all", "warning", "critical"]).default("all"),
        status: z.enum(["all", "pending", "approved", "flagged"]).default("all"),
      })
    )
    .query(async ({ input }) => {
      const { minVariancePercent, limit, offset } = input;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Query sales with cluster information
      const results = await db
        .select({
          id: sales.id,
          parcelId: sales.parcelId,
          address: sales.situsAddress,
          assessedValue: sales.assessedValue,
          salePrice: sales.salePrice,
          ratio: sales.assessedToSaleRatio,
          clusterId: sales.neighborhoodClusterId,
          saleDate: sales.saleDate,
        })
        .from(sales)
        .where(
          and(
            sql`${sales.neighborhoodClusterId} IS NOT NULL`,
            sql`${sales.assessedToSaleRatio} IS NOT NULL`
          )
        )
        .limit(limit)
        .offset(offset);

      // Get cluster median ratios
      const clusterIds = Array.from(new Set(results.map(r => r.clusterId).filter(Boolean)));
      const clusterMedians = await db
        .select({
          clusterId: neighborhoodStats.neighborhoodClusterId,
          medianSalePrice: neighborhoodStats.medianSalePrice,
          medianHomeValue: neighborhoodStats.medianHomeValue,
        })
        .from(neighborhoodStats)
        .where(
          or(...clusterIds.map(id => eq(neighborhoodStats.neighborhoodClusterId, id!)))
        );

      const medianMap = new Map(
        clusterMedians.map(c => {
          const medianRatio = c.medianHomeValue && c.medianSalePrice 
            ? c.medianHomeValue / c.medianSalePrice 
            : 0.96;
          return [c.clusterId, medianRatio];
        })
      );

      // Calculate variance and filter
      const propertiesWithVariance = results
        .map(property => {
          const ratio = parseFloat(property.ratio || "0");
          const clusterMedian = medianMap.get(property.clusterId!) || 0.96;
          const variancePercent = ((ratio - clusterMedian) / clusterMedian) * 100;
          const absVariance = Math.abs(variancePercent);

          return {
            ...property,
            ratio,
            clusterMedianRatio: clusterMedian,
            variancePercent,
            severity: absVariance > 20 ? ("critical" as const) : ("warning" as const),
            status: "pending" as const, // Default status
            lastReviewDate: null,
          };
        })
        .filter(p => Math.abs(p.variancePercent) >= minVariancePercent);

      return propertiesWithVariance;
    }),

  getVarianceDistribution: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // This would calculate actual distribution from database
    // For now, return mock data structure
    return [
      { range: "-30 to -20%", count: 0 },
      { range: "-20 to -10%", count: 0 },
      { range: "-10 to 0%", count: 0 },
      { range: "0 to 10%", count: 0 },
      { range: "10 to 20%", count: 0 },
      { range: "20 to 30%", count: 0 },
      { range: "30%+", count: 0 },
    ];
  }),

  // TODO: Bulk update mutation - requires status column in sales table schema
  // Will be implemented in next phase after schema migration
});
