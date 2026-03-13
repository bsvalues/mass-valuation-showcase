import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { sales, neighborhoodStats, backgroundJobs, batchValuationJobs } from "../drizzle/schema";
import { sql, eq, and, gte, or, desc } from "drizzle-orm";
import { isModelTrained, getModelMetrics } from "./mlModel";

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

  bulkUpdateStatus: publicProcedure
    .input(
      z.object({
        propertyIds: z.array(z.number()),
        newStatus: z.enum(["pending", "approved", "flagged"]),
        action: z.string(), // 'approve', 'flag', 'reassign'
        notes: z.string().optional(),
        userId: z.number().optional(),
        userName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { propertyIds, newStatus, action, notes, userId, userName } = input;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Get current status of properties
        const properties = await db
          .select({
            id: sales.id,
            status: sales.status,
          })
          .from(sales)
          .where(sql`${sales.id} IN (${sql.join(propertyIds.map(id => sql`${id}`), sql`, `)})`);

        // Update sales table with new status
        await db
          .update(sales)
          .set({ status: newStatus })
          .where(sql`${sales.id} IN (${sql.join(propertyIds.map(id => sql`${id}`), sql`, `)})`);

        // Create audit log entries
        const { assessmentAuditLog } = await import("../drizzle/schema");
        const auditEntries = properties.map(prop => ({
          propertyId: prop.id,
          action,
          oldStatus: prop.status || "pending",
          newStatus,
          userId: userId || null,
          userName: userName || "System",
          notes: notes || null,
        }));

        await db.insert(assessmentAuditLog).values(auditEntries);

        return {
          success: true,
          updatedCount: propertyIds.length,
          message: `Successfully updated ${propertyIds.length} properties to ${newStatus}`,
        };
      } catch (error) {
        console.error("Bulk update error:", error);
        throw new Error("Failed to update property statuses");
      }
    }),

  getAuditLogs: publicProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        userId: z.number().optional(),
        action: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { limit, offset, userId, action, startDate, endDate } = input;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { assessmentAuditLog } = await import("../drizzle/schema");

      // Build where conditions
      const conditions = [];
      if (userId) {
        conditions.push(eq(assessmentAuditLog.userId, userId));
      }
      if (action) {
        conditions.push(eq(assessmentAuditLog.action, action));
      }
      if (startDate) {
        conditions.push(gte(assessmentAuditLog.timestamp, new Date(startDate)));
      }
      if (endDate) {
        conditions.push(sql`${assessmentAuditLog.timestamp} <= ${new Date(endDate)}`);
      }

      const logs = await db
        .select()
        .from(assessmentAuditLog)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(sql`${assessmentAuditLog.timestamp} DESC`)
        .limit(limit)
        .offset(offset);

      return logs;
    }),

  // ─── FEATURE 1: Export all filtered audit logs as CSV data ───────────────────
  exportAuditLogs: publicProcedure
    .input(
      z.object({
        action: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { action, startDate, endDate } = input;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { assessmentAuditLog } = await import("../drizzle/schema");

      const conditions = [];
      if (action && action !== "all") {
        conditions.push(eq(assessmentAuditLog.action, action));
      }
      if (startDate) {
        conditions.push(gte(assessmentAuditLog.timestamp, new Date(startDate)));
      }
      if (endDate) {
        conditions.push(sql`${assessmentAuditLog.timestamp} <= ${new Date(endDate)}`);
      }

      // No limit — export all matching records
      const logs = await db
        .select()
        .from(assessmentAuditLog)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(assessmentAuditLog.timestamp));

      return logs;
    }),

  // ─── FEATURE 2: System health check for SystemHealthMonitor ──────────────────
  getSystemHealth: publicProcedure.query(async () => {
    // 1. Database health: attempt a lightweight query
    let databaseStatus: "healthy" | "degraded" | "down" = "down";
    let databaseDetail = "Connection failed";
    try {
      const db = await getDb();
      if (db) {
        // Ping with a cheap count query
        const result = await db.execute(sql`SELECT 1 AS ping`);
        if (result) {
          databaseStatus = "healthy";
          databaseDetail = "Connected";
        }
      } else {
        databaseStatus = "degraded";
        databaseDetail = "No connection pool";
      }
    } catch {
      databaseStatus = "down";
      databaseDetail = "Query failed";
    }

    // 2. Background jobs: count running jobs
    let jobsStatus: "idle" | "processing" | "error" = "idle";
    let jobsDetail = "No active jobs";
    let activeJobCount = 0;
    try {
      const db = await getDb();
      if (db) {
        const runningJobs = await db
          .select({ id: backgroundJobs.id, status: backgroundJobs.status })
          .from(backgroundJobs)
          .where(eq(backgroundJobs.status, "running"))
          .limit(10);
        activeJobCount = runningJobs.length;
        if (activeJobCount > 0) {
          jobsStatus = "processing";
          jobsDetail = `${activeJobCount} job${activeJobCount > 1 ? "s" : ""} running`;
        } else {
          // Check for failed jobs in last hour
          const recentFailed = await db
            .select({ id: backgroundJobs.id })
            .from(backgroundJobs)
            .where(
              and(
                eq(backgroundJobs.status, "failed"),
                gte(backgroundJobs.createdAt, new Date(Date.now() - 60 * 60 * 1000))
              )
            )
            .limit(1);
          if (recentFailed.length > 0) {
            jobsStatus = "error";
            jobsDetail = "Recent job failures detected";
          } else {
            jobsStatus = "idle";
            jobsDetail = "All jobs complete";
          }
        }
      }
    } catch {
      jobsStatus = "error";
      jobsDetail = "Queue check failed";
    }

    // 3. ML Model status
    let modelStatus: "ready" | "calibrating" | "stale" = "stale";
    let modelDetail = "Model not trained";
    try {
      const trained = isModelTrained();
      const metrics = getModelMetrics();
      if (trained && metrics) {
        modelStatus = "ready";
        modelDetail = `R²=${metrics.r2?.toFixed(3) ?? "N/A"}`;
      } else if (trained) {
        modelStatus = "ready";
        modelDetail = "Trained, no metrics";
      } else {
        modelStatus = "stale";
        modelDetail = "Not yet calibrated";
      }
    } catch {
      modelStatus = "stale";
      modelDetail = "Status unavailable";
    }

    return {
      database: { status: databaseStatus, detail: databaseDetail },
      jobs: { status: jobsStatus, detail: jobsDetail, activeCount: activeJobCount },
      model: { status: modelStatus, detail: modelDetail },
      checkedAt: new Date().toISOString(),
    };
  }),
});

