/**
 * Analytics tRPC Router
 * Provides analytics queries for appeals dashboard
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { appeals, parcels, sales, propertyHistory } from "../drizzle/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

export const analyticsRouter = router({
  /**
   * Get resolution trends over time
   * Returns count of resolved appeals by month
   */
  getResolutionTrends: publicProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      countyName: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const conditions = [eq(appeals.status, "resolved")];
      
      if (input.startDate) {
        conditions.push(gte(appeals.resolutionDate, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(appeals.resolutionDate, new Date(input.endDate)));
      }
      if (input.countyName) {
        conditions.push(eq(appeals.countyName, input.countyName));
      }

      const results = await db
        .select({
          month: sql<string>`DATE_FORMAT(${appeals.resolutionDate}, '%Y-%m')`.as('month'),
          count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(appeals)
        .where(and(...conditions))
        .groupBy(sql`month`)
        .orderBy(sql`month`);

      return results;
    }),

  /**
   * Get average processing time by county
   */
  getProcessingTimeByCounty: publicProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const conditions = [eq(appeals.status, "resolved")];
      
      if (input.startDate) {
        conditions.push(gte(appeals.resolutionDate, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(appeals.resolutionDate, new Date(input.endDate)));
      }

      const results = await db
        .select({
          countyName: appeals.countyName,
          avgDays: sql<number>`AVG(DATEDIFF(${appeals.resolutionDate}, ${appeals.appealDate}))`,
          count: sql<number>`COUNT(*)`,
        })
        .from(appeals)
        .where(and(...conditions))
        .groupBy(appeals.countyName)
        .orderBy(desc(sql`AVG(DATEDIFF(${appeals.resolutionDate}, ${appeals.appealDate}))`));

      return results;
    }),

  /**
   * Get success rate statistics
   * Success = approved or partially_approved resolutions
   */
  getSuccessRates: publicProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      countyName: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const conditions = [eq(appeals.status, "resolved")];
      
      if (input.startDate) {
        conditions.push(gte(appeals.resolutionDate, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(appeals.resolutionDate, new Date(input.endDate)));
      }
      if (input.countyName) {
        conditions.push(eq(appeals.countyName, input.countyName));
      }

      // Use raw query to avoid MySQL GROUP BY strict mode issues
      const results = await db.execute(sql`
        SELECT 
          CASE 
            WHEN finalValue < currentAssessedValue THEN 'Approved'
            WHEN finalValue = currentAssessedValue THEN 'Denied'
            ELSE 'Withdrawn'
          END as outcome,
          COUNT(*) as count
        FROM appeals
        WHERE status = 'resolved'
          ${input.startDate ? sql`AND resolutionDate >= ${new Date(input.startDate)}` : sql``}
          ${input.endDate ? sql`AND resolutionDate <= ${new Date(input.endDate)}` : sql``}
          ${input.countyName ? sql`AND countyName = ${input.countyName}` : sql``}
        GROUP BY outcome
      `);
      
      return (results as any[]).map((row: any) => ({
        outcome: row.outcome,
        count: Number(row.count),
      }));
    }),

  /**
   * Get value adjustment distribution
   * Shows histogram of adjustment amounts
   */
  getValueAdjustments: publicProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      countyName: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const conditions = [
        eq(appeals.status, "resolved"),
        sql`${appeals.finalValue} IS NOT NULL`,
      ];
      
      if (input.startDate) {
        conditions.push(gte(appeals.resolutionDate, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(appeals.resolutionDate, new Date(input.endDate)));
      }
      if (input.countyName) {
        conditions.push(eq(appeals.countyName, input.countyName));
      }

      const results = await db
        .select({
          parcelId: appeals.parcelId,
          currentValue: appeals.currentAssessedValue,
          finalValue: appeals.finalValue,
          adjustment: sql<number>`${appeals.currentAssessedValue} - ${appeals.finalValue}`,
          adjustmentPercent: sql<number>`((${appeals.currentAssessedValue} - ${appeals.finalValue}) / ${appeals.currentAssessedValue}) * 100`,
        })
        .from(appeals)
        .where(and(...conditions))
        .orderBy(desc(sql`${appeals.currentAssessedValue} - ${appeals.finalValue}`));

      return results;
    }),

  /**
   * Get overall statistics summary
   */
  getSummaryStats: publicProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      countyName: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const conditions = [];
      
      if (input.startDate) {
        conditions.push(gte(appeals.appealDate, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(appeals.appealDate, new Date(input.endDate)));
      }
      if (input.countyName) {
        conditions.push(eq(appeals.countyName, input.countyName));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [stats] = await db
        .select({
          totalAppeals: sql<number>`COUNT(*)`,
          pendingAppeals: sql<number>`SUM(CASE WHEN ${appeals.status} = 'pending' THEN 1 ELSE 0 END)`,
          inReviewAppeals: sql<number>`SUM(CASE WHEN ${appeals.status} = 'in_review' THEN 1 ELSE 0 END)`,
          resolvedAppeals: sql<number>`SUM(CASE WHEN ${appeals.status} = 'resolved' THEN 1 ELSE 0 END)`,
          avgProcessingDays: sql<number>`AVG(CASE WHEN ${appeals.status} = 'resolved' THEN DATEDIFF(${appeals.resolutionDate}, ${appeals.appealDate}) ELSE NULL END)`,
          totalValueAdjusted: sql<number>`SUM(CASE WHEN ${appeals.status} = 'resolved' AND ${appeals.finalValue} IS NOT NULL THEN ${appeals.currentAssessedValue} - ${appeals.finalValue} ELSE 0 END)`,
        })
        .from(appeals)
        .where(whereClause);

      return stats;
    }),

  /**
   * Get property heatmap data for PropertyHeatmapWithFilters
   * Returns parcels with lat/lng and value for map rendering
   */
  getPropertyHeatmapData: publicProcedure
    .input(z.object({
      propertyType: z.string().optional(),
      neighborhood: z.string().optional(),
      minValue: z.number().optional(),
      maxValue: z.number().optional(),
      limit: z.number().default(500),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const conditions = [
        sql`${parcels.latitude} IS NOT NULL`,
        sql`${parcels.longitude} IS NOT NULL`,
        sql`${parcels.totalValue} > 0`,
      ];

      if (input.propertyType) {
        conditions.push(eq(parcels.propertyType, input.propertyType));
      }
      if (input.neighborhood) {
        conditions.push(eq(parcels.neighborhood, input.neighborhood));
      }
      if (input.minValue !== undefined) {
        conditions.push(sql`${parcels.totalValue} >= ${input.minValue}`);
      }
      if (input.maxValue !== undefined) {
        conditions.push(sql`${parcels.totalValue} <= ${input.maxValue}`);
      }

      const rows = await db
        .select({
          id: parcels.id,
          parcelId: parcels.parcelId,
          latitude: parcels.latitude,
          longitude: parcels.longitude,
          totalValue: parcels.totalValue,
          propertyType: parcels.propertyType,
          neighborhood: parcels.neighborhood,
          address: parcels.address,
        })
        .from(parcels)
        .where(and(...conditions))
        .limit(input.limit);

      return rows.map(r => ({
        ...r,
        lat: parseFloat(r.latitude ?? '0'),
        lng: parseFloat(r.longitude ?? '0'),
      }));
    }),

  /**
   * Get assessment ratio distribution histogram data
   * Buckets sales ratios (assessedValue / salePrice) into 0.05-wide bins from 0.50 to 1.50
   */
  getRatioDistribution: publicProcedure
    .input(z.object({
      countyName: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const conditions: ReturnType<typeof sql>[] = [sql`${sales.salePrice} > 0 AND ${sales.assessedValue} > 0`];
      if (input?.countyName && input.countyName !== 'all') {
        conditions.push(sql`${sales.countyName} = ${input.countyName}`);
      }

      const salesData = await db
        .select({
          assessedValue: sales.assessedValue,
          salePrice: sales.salePrice,
        })
        .from(sales)
        .where(and(...conditions))
        .limit(5000);

      const binEdges = [0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20, 1.25, 1.30];
      const bins = binEdges.slice(0, -1).map((edge, i) => ({
        ratio: edge,
        label: edge.toFixed(2),
        rangeLabel: `${edge.toFixed(2)}-${binEdges[i + 1].toFixed(2)}`,
        count: 0,
      }));

      for (const row of salesData) {
        const ratio = row.assessedValue / row.salePrice;
        const binIdx = Math.floor((ratio - 0.50) / 0.05);
        if (binIdx >= 0 && binIdx < bins.length) {
          bins[binIdx].count++;
        }
      }

      return bins;
    }),

  /**
   * Get filter options for PropertyHeatmapWithFilters dropdowns
   */
  getPropertyFilterOptions: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [propertyTypes, neighborhoods] = await Promise.all([
        db.selectDistinct({ value: parcels.propertyType })
          .from(parcels)
          .where(sql`${parcels.propertyType} IS NOT NULL`)
          .limit(50),
        db.selectDistinct({ value: parcels.neighborhood })
          .from(parcels)
          .where(sql`${parcels.neighborhood} IS NOT NULL`)
          .orderBy(parcels.neighborhood)
          .limit(100),
      ]);

      return {
        propertyTypes: propertyTypes.map(r => r.value).filter(Boolean) as string[],
        neighborhoods: neighborhoods.map(r => r.value).filter(Boolean) as string[],
      };
    }),

  /**
   * Monthly median A/S ratio trend for MarketAnalysis page
   */
  getSalesRatioTrend: publicProcedure
    .input(z.object({
      countyName: z.string().optional(),
      months: z.number().default(12),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const monthsBack = input?.months ?? 12;
      const conditions: ReturnType<typeof sql>[] = [
        sql`${sales.salePrice} > 0 AND ${sales.assessedValue} > 0`,
        sql`${sales.saleDate} >= DATE_SUB(CURDATE(), INTERVAL ${monthsBack} MONTH)`,
      ];
      if (input?.countyName && input.countyName !== 'all') {
        conditions.push(sql`${sales.countyName} = ${input.countyName}`);
      }

      const rows = await db
        .select({
          month: sql<string>`DATE_FORMAT(${sales.saleDate}, '%Y-%m')`.as('month'),
          assessedValue: sales.assessedValue,
          salePrice: sales.salePrice,
        })
        .from(sales)
        .where(and(...conditions));

      // Group by month and compute median ratio in JS
      const byMonth = new Map<string, number[]>();
      for (const row of rows) {
        const ratio = row.assessedValue / row.salePrice;
        if (!byMonth.has(row.month)) byMonth.set(row.month, []);
        byMonth.get(row.month)!.push(ratio);
      }

      const result: { month: string; ratio: number; count: number }[] = Array.from(byMonth.entries()).map(([month, ratios]) => {
        const sorted = [...ratios].sort((a, b) => a - b);
        const n = sorted.length;
        const median = n % 2 === 1
          ? sorted[Math.floor(n / 2)]
          : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
        return { month, ratio: Math.round(median * 10000) / 10000, count: n };
      });
      return result.sort((a, b) => a.month.localeCompare(b.month));
    }),

  /**
   * Parcel count by property type for MarketAnalysis donut chart
   */
  getParcelTypeDistribution: publicProcedure
    .input(z.object({ countyName: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const conditions: ReturnType<typeof sql>[] = [
        sql`${parcels.propertyType} IS NOT NULL`,
      ];
      if (input?.countyName && input.countyName !== 'all') {
        conditions.push(eq(parcels.county, input.countyName));
      }

      const rows = await db
        .select({
          propertyType: parcels.propertyType,
          count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(parcels)
        .where(and(...conditions))
        .groupBy(parcels.propertyType)
        .orderBy(sql`COUNT(*) DESC`);

      const COLORS: Record<string, string> = {
        residential: '#00FFEE', commercial: '#A855F7',
        industrial: '#22C55E', agricultural: '#EAB308',
        exempt: '#64748B', other: '#94A3B8',
      };

      return rows
        .filter(r => r.propertyType)
        .map(r => ({
          name: r.propertyType!.charAt(0).toUpperCase() + r.propertyType!.slice(1),
          value: Number(r.count),
          color: COLORS[r.propertyType!.toLowerCase()] ?? '#94A3B8',
        }));
    }),

  /**
   * Valuation change histogram comparing current vs prior assessment year
   */
  getValuationChangeDistribution: publicProcedure
    .input(z.object({ countyName: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const currentYear = new Date().getFullYear();
      const priorYear = currentYear - 1;

      const [currentRows, priorRows] = await Promise.all([
        db.select({ parcelId: propertyHistory.parcelId, totalValue: propertyHistory.totalValue })
          .from(propertyHistory).where(eq(propertyHistory.assessmentYear, currentYear)).limit(5000),
        db.select({ parcelId: propertyHistory.parcelId, totalValue: propertyHistory.totalValue })
          .from(propertyHistory).where(eq(propertyHistory.assessmentYear, priorYear)).limit(5000),
      ]);

      const priorMap = new Map(priorRows.map(r => [r.parcelId, r.totalValue ?? 0]));
      const bins = [
        { range: '< -10%',      min: -Infinity, max: -10,       count: 0 },
        { range: '-10% to -5%', min: -10,        max: -5,        count: 0 },
        { range: '-5% to 0%',   min: -5,         max: 0,         count: 0 },
        { range: '0% to 5%',    min: 0,          max: 5,         count: 0 },
        { range: '5% to 10%',   min: 5,          max: 10,        count: 0 },
        { range: '> 10%',       min: 10,         max: Infinity,  count: 0 },
      ];

      let matched = 0;
      for (const cur of currentRows) {
        const prior = priorMap.get(cur.parcelId);
        if (!prior || prior === 0 || !cur.totalValue) continue;
        const pct = ((cur.totalValue - prior) / prior) * 100;
        matched++;
        for (const bin of bins) {
          if (pct >= bin.min && pct < bin.max) { bin.count++; break; }
        }
      }

      if (matched === 0) return [];
      return bins.map(({ range, count }) => ({ range, count }));
    }),

  /**
   * Market KPI summary cards for MarketAnalysis header
   */
  getMarketKPIs: publicProcedure
    .input(z.object({ countyName: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const parcelConditions: ReturnType<typeof sql>[] = [];
      if (input?.countyName && input.countyName !== 'all') {
        parcelConditions.push(eq(parcels.county, input.countyName));
      }

      const [[kpiRow], [salesRow]] = await Promise.all([
        db.select({
          totalParcels:       sql<number>`COUNT(*)`.as('totalParcels'),
          totalAssessedValue: sql<number>`SUM(COALESCE(${parcels.totalAssessedValue}, 0))`.as('totalAssessedValue'),
          avgAssessedValue:   sql<number>`AVG(COALESCE(${parcels.totalAssessedValue}, 0))`.as('avgAssessedValue'),
          totalLandValue:     sql<number>`SUM(COALESCE(${parcels.landValue}, 0))`.as('totalLandValue'),
          totalBuildingValue: sql<number>`SUM(COALESCE(${parcels.buildingValue}, 0))`.as('totalBuildingValue'),
        }).from(parcels).where(parcelConditions.length > 0 ? and(...parcelConditions) : undefined),
        db.select({
          qualifiedSales: sql<number>`COUNT(*)`.as('qualifiedSales'),
          avgSalePrice:   sql<number>`AVG(${sales.salePrice})`.as('avgSalePrice'),
        }).from(sales),
      ]);

      return {
        totalParcels:       Number(kpiRow?.totalParcels ?? 0),
        totalAssessedValue: Number(kpiRow?.totalAssessedValue ?? 0),
        avgAssessedValue:   Number(kpiRow?.avgAssessedValue ?? 0),
        totalLandValue:     Number(kpiRow?.totalLandValue ?? 0),
        totalBuildingValue: Number(kpiRow?.totalBuildingValue ?? 0),
        qualifiedSales:     Number(salesRow?.qualifiedSales ?? 0),
        avgSalePrice:       Number(salesRow?.avgSalePrice ?? 0),
      };
    }),
});
