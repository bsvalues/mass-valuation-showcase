import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { sales } from "../drizzle/schema";
import type { Context } from "./_core/trpc";

/**
 * Unit tests for Ratio Studies Router
 * Tests IAAO-compliant statistical calculations (COD, PRD, PRB)
 */

describe("Ratio Studies Router", () => {
  let testContext: Context;
  let testSaleIds: number[] = [];

  beforeAll(async () => {
    // Create test context with mock user
    testContext = {
      user: {
        id: 1,
        openId: "test-user",
        name: "Test User",
        email: "test@example.com",
        role: "admin",
        loginMethod: "email",
        createdAt: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };

    // Insert test sales data for ratio study calculations
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const testSales = [
      {
        parcelId: "TEST-001",
        saleDate: new Date("2024-01-15"),
        salePrice: 350000,
        assessedValue: 336000, // Ratio: 0.96
        propertyType: "Residential",
        countyName: "Benton County",
        uploadedBy: 1,
      },
      {
        parcelId: "TEST-002",
        saleDate: new Date("2024-02-20"),
        salePrice: 425000,
        assessedValue: 408000, // Ratio: 0.96
        propertyType: "Residential",
        countyName: "Benton County",
        uploadedBy: 1,
      },
      {
        parcelId: "TEST-003",
        saleDate: new Date("2024-03-10"),
        salePrice: 500000,
        assessedValue: 490000, // Ratio: 0.98
        propertyType: "Residential",
        countyName: "Benton County",
        uploadedBy: 1,
      },
      {
        parcelId: "TEST-004",
        saleDate: new Date("2024-04-05"),
        salePrice: 275000,
        assessedValue: 264000, // Ratio: 0.96
        propertyType: "Residential",
        countyName: "Benton County",
        uploadedBy: 1,
      },
      {
        parcelId: "TEST-005",
        saleDate: new Date("2024-05-12"),
        salePrice: 600000,
        assessedValue: 582000, // Ratio: 0.97
        propertyType: "Residential",
        countyName: "Benton County",
        uploadedBy: 1,
      },
    ];

    for (const sale of testSales) {
      const result = await db.insert(sales).values(sale);
      testSaleIds.push(Number(result[0].insertId));
    }
  });

  afterAll(async () => {
    // Clean up test data
    const db = await getDb();
    if (!db) return;

    const { inArray } = await import("drizzle-orm");
    await db.delete(sales).where(inArray(sales.id, testSaleIds));
  });

  describe("calculate procedure", () => {
    it("should calculate ratio study statistics for all sales", async () => {
      const caller = appRouter.createCaller(testContext);
      
      const result = await caller.ratioStudies.calculate({
        countyName: "Benton County",
        propertyType: "Residential",
      });

      expect(result.count).toBeGreaterThanOrEqual(5);
      expect(result.medianRatio).toBeGreaterThan(0);
      expect(result.meanRatio).toBeGreaterThan(0);
      expect(result.cod).toBeGreaterThanOrEqual(0); // COD can be 0 for perfectly uniform assessments
      expect(result.prd).toBeGreaterThan(0);
    });

    it("should calculate median ratio correctly", async () => {
      const caller = appRouter.createCaller(testContext);
      
      const result = await caller.ratioStudies.calculate({
        countyName: "Benton County",
        propertyType: "Residential",
      });

      // Median of [0.96, 0.96, 0.96, 0.97, 0.98] should be 0.96
      expect(result.medianRatio).toBeCloseTo(0.96, 2);
    });

    it("should calculate mean ratio correctly", async () => {
      const caller = appRouter.createCaller(testContext);
      
      const result = await caller.ratioStudies.calculate({
        countyName: "Benton County",
        propertyType: "Residential",
      });

      // Mean of [0.96, 0.96, 0.96, 0.97, 0.98] should be ~0.966
      expect(result.meanRatio).toBeCloseTo(0.966, 2);
    });

    it("should calculate COD (Coefficient of Dispersion)", async () => {
      const caller = appRouter.createCaller(testContext);
      
      const result = await caller.ratioStudies.calculate({
        countyName: "Benton County",
        propertyType: "Residential",
      });

      // COD should be low for uniform assessments
      expect(result.cod).toBeLessThan(20); // IAAO acceptable threshold
      expect(result.cod).toBeGreaterThanOrEqual(0); // COD can be 0 for perfectly uniform assessments
    });

    it("should calculate PRD (Price-Related Differential)", async () => {
      const caller = appRouter.createCaller(testContext);
      
      const result = await caller.ratioStudies.calculate({
        countyName: "Benton County",
        propertyType: "Residential",
      });

      // PRD = mean / median, should be close to 1.0
      expect(result.prd).toBeCloseTo(1.0, 1);
      expect(result.prd).toBeGreaterThan(0);
    });

    it("should calculate PRB (Price-Related Bias)", async () => {
      const caller = appRouter.createCaller(testContext);
      
      const result = await caller.ratioStudies.calculate({
        countyName: "Benton County",
        propertyType: "Residential",
      });

      // PRB should be close to 0 for unbiased assessments
      expect(Math.abs(result.prb)).toBeLessThan(0.5); // Reasonable range
    });

    it("should filter by date range", async () => {
      const caller = appRouter.createCaller(testContext);
      
      const result = await caller.ratioStudies.calculate({
        countyName: "Benton County",
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-05-31"),
      });

      // Should only include sales from March-May (3 sales)
      expect(result.count).toBeGreaterThanOrEqual(3);
    });

    it("should filter by price range", async () => {
      const caller = appRouter.createCaller(testContext);
      
      const result = await caller.ratioStudies.calculate({
        countyName: "Benton County",
        minPrice: 400000,
        maxPrice: 700000,
      });

      // Should only include sales $400K-$700K (3 sales)
      expect(result.count).toBeGreaterThanOrEqual(3);
    });

    it("should return zero statistics for no matching sales", async () => {
      const caller = appRouter.createCaller(testContext);
      
      const result = await caller.ratioStudies.calculate({
        countyName: "Nonexistent County",
      });

      expect(result.count).toBe(0);
      expect(result.medianRatio).toBe(0);
      expect(result.meanRatio).toBe(0);
      expect(result.cod).toBe(0);
      expect(result.prd).toBe(0);
      expect(result.prb).toBe(0);
    });
  });

  describe("getSalesData procedure", () => {
    it("should return sales data with calculated ratios", async () => {
      const caller = appRouter.createCaller(testContext);
      
      const result = await caller.ratioStudies.getSalesData({
        countyName: "Benton County",
        propertyType: "Residential",
      });

      expect(result.length).toBeGreaterThanOrEqual(5);
      expect(result[0]).toHaveProperty("ratio");
      expect(result[0].ratio).toBeGreaterThan(0);
    });

    it("should respect limit parameter", async () => {
      const caller = appRouter.createCaller(testContext);
      
      const result = await caller.ratioStudies.getSalesData({
        countyName: "Benton County",
        limit: 3,
      });

      expect(result.length).toBeLessThanOrEqual(3);
    });

    it("should filter by property type", async () => {
      const caller = appRouter.createCaller(testContext);
      
      const result = await caller.ratioStudies.getSalesData({
        propertyType: "Residential",
      });

      expect(result.every(sale => sale.propertyType === "Residential")).toBe(true);
    });
  });
});
