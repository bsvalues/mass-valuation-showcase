/**
 * Appeals Analytics Router Tests
 * Tests for appeals analytics queries and data aggregation
 */

import { describe, it, expect, beforeAll } from "vitest";
import { analyticsRouter } from "./analyticsRouter";
import { getDb } from "./db";

describe("Appeals Analytics Router", () => {
  beforeAll(async () => {
    // Ensure database is available
    const db = await getDb();
    expect(db).toBeDefined();
  });

  it("should get summary statistics", async () => {
    const caller = analyticsRouter.createCaller({} as any);
    const stats = await caller.getSummaryStats({});
    
    expect(stats).toBeDefined();
    expect(typeof stats.totalAppeals).toBe("number");
    expect(typeof stats.pendingAppeals).toBe("number");
    expect(typeof stats.resolvedAppeals).toBe("number");
    expect(stats.totalAppeals).toBeGreaterThanOrEqual(0);
  });

  it("should get resolution trends", async () => {
    const caller = analyticsRouter.createCaller({} as any);
    const trends = await caller.getResolutionTrends({});
    
    expect(Array.isArray(trends)).toBe(true);
  });

  it("should get processing time by county", async () => {
    const caller = analyticsRouter.createCaller({} as any);
    const times = await caller.getProcessingTimeByCounty({});
    
    expect(Array.isArray(times)).toBe(true);
  });

  it("should get success rates", async () => {
    const caller = analyticsRouter.createCaller({} as any);
    const rates = await caller.getSuccessRates({});
    
    expect(Array.isArray(rates)).toBe(true);
  });

  it("should get value adjustments", async () => {
    const caller = analyticsRouter.createCaller({} as any);
    const adjustments = await caller.getValueAdjustments({});
    
    expect(Array.isArray(adjustments)).toBe(true);
  });

  it("should filter analytics by date range", async () => {
    const caller = analyticsRouter.createCaller({} as any);
    const startDate = "2025-01-01";
    const endDate = "2026-12-31";
    
    const stats = await caller.getSummaryStats({ startDate, endDate });
    expect(stats).toBeDefined();
    expect(typeof stats.totalAppeals).toBe("number");
  });

  it("should filter analytics by county", async () => {
    const caller = analyticsRouter.createCaller({} as any);
    const countyName = "Benton County";
    
    const stats = await caller.getSummaryStats({ countyName });
    expect(stats).toBeDefined();
    expect(typeof stats.totalAppeals).toBe("number");
  });
});
