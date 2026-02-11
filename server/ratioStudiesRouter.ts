import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { sales } from "../drizzle/schema";
import { and, gte, lte, eq, sql } from "drizzle-orm";
import { generateRatioStudyPDF } from "./pdfExport";

/**
 * IAAO-Compliant Ratio Studies Router
 * 
 * Implements statistical calculations for property assessment quality:
 * - COD (Coefficient of Dispersion): Measures uniformity of assessments
 * - PRD (Price-Related Differential): Detects assessment bias by price level
 * - PRB (Price-Related Bias): Regression-based bias detection
 */

interface RatioStatistics {
  count: number;
  medianRatio: number;
  meanRatio: number;
  cod: number; // Coefficient of Dispersion
  prd: number; // Price-Related Differential
  prb: number; // Price-Related Bias
  minRatio: number;
  maxRatio: number;
  totalSalesValue: number;
  totalAssessedValue: number;
}

interface SaleWithRatio {
  id: number;
  parcelId: string;
  saleDate: Date;
  salePrice: number;
  assessedValue: number;
  ratio: number;
  propertyType: string | null;
}

/**
 * Calculate median from sorted array
 */
function calculateMedian(sortedValues: number[]): number {
  const n = sortedValues.length;
  if (n === 0) return 0;
  if (n % 2 === 1) {
    return sortedValues[Math.floor(n / 2)];
  }
  const mid1 = sortedValues[n / 2 - 1];
  const mid2 = sortedValues[n / 2];
  return (mid1 + mid2) / 2;
}

/**
 * Calculate Coefficient of Dispersion (COD)
 * COD = (Median Absolute Deviation / Median Ratio) × 100
 * 
 * IAAO Standards:
 * - Excellent: COD < 10%
 * - Good: COD 10-15%
 * - Fair: COD 15-20%
 * - Poor: COD > 20%
 */
function calculateCOD(ratios: number[], medianRatio: number): number {
  if (ratios.length === 0 || medianRatio === 0) return 0;
  
  const absoluteDeviations = ratios.map(r => Math.abs(r - medianRatio));
  const sortedDeviations = absoluteDeviations.sort((a, b) => a - b);
  const medianAbsoluteDeviation = calculateMedian(sortedDeviations);
  
  return (medianAbsoluteDeviation / medianRatio) * 100;
}

/**
 * Calculate Price-Related Differential (PRD)
 * PRD = Mean Ratio / Median Ratio
 * 
 * IAAO Standards:
 * - Acceptable: 0.98 ≤ PRD ≤ 1.03
 * - Progressive (favors high-value): PRD < 0.98
 * - Regressive (favors low-value): PRD > 1.03
 */
function calculatePRD(meanRatio: number, medianRatio: number): number {
  if (medianRatio === 0) return 0;
  return meanRatio / medianRatio;
}

/**
 * Calculate Price-Related Bias (PRB)
 * PRB = Slope coefficient from regression of (Ratio - MeanRatio) on (SalePrice / 1000)
 * 
 * IAAO Standards:
 * - Acceptable: -0.05 ≤ PRB ≤ 0.05
 * - Progressive: PRB < -0.05
 * - Regressive: PRB > 0.05
 */
function calculatePRB(salesData: SaleWithRatio[], meanRatio: number): number {
  if (salesData.length < 2) return 0;
  
  // Prepare data for regression: Y = (ratio - meanRatio), X = salePrice / 1000
  const n = salesData.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  
  salesData.forEach(sale => {
    const x = sale.salePrice / 1000;
    const y = sale.ratio - meanRatio;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });
  
  const meanX = sumX / n;
  const meanY = sumY / n;
  
  // Calculate slope (PRB)
  const numerator = sumXY - n * meanX * meanY;
  const denominator = sumX2 - n * meanX * meanX;
  
  if (denominator === 0) return 0;
  
  return numerator / denominator;
}

export const ratioStudiesRouter = router({
  /**
   * Calculate ratio study statistics for a given set of filters
   */
  calculate: protectedProcedure
    .input(z.object({
      propertyType: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      countyName: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Build filter conditions
      const conditions = [];
      
      if (input.propertyType) {
        conditions.push(eq(sales.propertyType, input.propertyType));
      }
      if (input.startDate) {
        conditions.push(gte(sales.saleDate, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(sales.saleDate, input.endDate));
      }
      if (input.minPrice) {
        conditions.push(gte(sales.salePrice, input.minPrice));
      }
      if (input.maxPrice) {
        conditions.push(lte(sales.salePrice, input.maxPrice));
      }
      if (input.countyName) {
        conditions.push(eq(sales.countyName, input.countyName));
      }
      
      // Query sales data
      const salesData = await db
        .select()
        .from(sales)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      if (salesData.length === 0) {
        return {
          count: 0,
          medianRatio: 0,
          meanRatio: 0,
          cod: 0,
          prd: 0,
          prb: 0,
          minRatio: 0,
          maxRatio: 0,
          totalSalesValue: 0,
          totalAssessedValue: 0,
        } as RatioStatistics;
      }
      
      // Calculate ratios and statistics
      const salesWithRatios: SaleWithRatio[] = salesData.map(sale => ({
        ...sale,
        ratio: sale.salePrice > 0 ? sale.assessedValue / sale.salePrice : 0,
      }));
      
      const ratios = salesWithRatios.map(s => s.ratio).filter(r => r > 0);
      const sortedRatios = [...ratios].sort((a, b) => a - b);
      
      const medianRatio = calculateMedian(sortedRatios);
      const meanRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
      const cod = calculateCOD(ratios, medianRatio);
      const prd = calculatePRD(meanRatio, medianRatio);
      const prb = calculatePRB(salesWithRatios, meanRatio);
      
      const totalSalesValue = salesData.reduce((sum, s) => sum + s.salePrice, 0);
      const totalAssessedValue = salesData.reduce((sum, s) => sum + s.assessedValue, 0);
      
      return {
        count: salesData.length,
        medianRatio,
        meanRatio,
        cod,
        prd,
        prb,
        minRatio: sortedRatios[0] || 0,
        maxRatio: sortedRatios[sortedRatios.length - 1] || 0,
        totalSalesValue,
        totalAssessedValue,
      } as RatioStatistics;
    }),
  
  /**
   * Get detailed sales data for ratio study analysis
   */
  getSalesData: protectedProcedure
    .input(z.object({
      propertyType: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      countyName: z.string().optional(),
      limit: z.number().default(1000),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [];
      
      if (input.propertyType) {
        conditions.push(eq(sales.propertyType, input.propertyType));
      }
      if (input.startDate) {
        conditions.push(gte(sales.saleDate, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(sales.saleDate, input.endDate));
      }
      if (input.minPrice) {
        conditions.push(gte(sales.salePrice, input.minPrice));
      }
      if (input.maxPrice) {
        conditions.push(lte(sales.salePrice, input.maxPrice));
      }
      if (input.countyName) {
        conditions.push(eq(sales.countyName, input.countyName));
      }
      
      const salesData = await db
        .select()
        .from(sales)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(input.limit);
      
      return salesData.map(sale => ({
        ...sale,
        ratio: sale.salePrice > 0 ? sale.assessedValue / sale.salePrice : 0,
      }));  }),

  /**
   * Export ratio study report as PDF
   */
  exportPDF: protectedProcedure
    .input(z.object({
      propertyType: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      countyName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Calculate statistics (reuse calculate logic)
      const conditions = [];
      
      if (input.propertyType) {
        conditions.push(eq(sales.propertyType, input.propertyType));
      }
      if (input.startDate) {
        conditions.push(gte(sales.saleDate, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(sales.saleDate, input.endDate));
      }
      if (input.minPrice) {
        conditions.push(gte(sales.salePrice, input.minPrice));
      }
      if (input.maxPrice) {
        conditions.push(lte(sales.salePrice, input.maxPrice));
      }
      if (input.countyName) {
        conditions.push(eq(sales.countyName, input.countyName));
      }
      
      const salesData = await db
        .select()
        .from(sales)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      if (salesData.length === 0) {
        throw new Error("No sales data found for the specified filters");
      }
      
      // Calculate ratios and statistics
      const salesWithRatios = salesData.map(sale => ({
        ...sale,
        ratio: sale.salePrice > 0 ? sale.assessedValue / sale.salePrice : 0,
      }));
      
      const ratios = salesWithRatios.map(s => s.ratio).filter(r => r > 0);
      const sortedRatios = [...ratios].sort((a, b) => a - b);
      
      const medianRatio = calculateMedian(sortedRatios);
      const meanRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
      const cod = calculateCOD(ratios, medianRatio);
      const prd = calculatePRD(meanRatio, medianRatio);
      const prb = calculatePRB(salesWithRatios, meanRatio);
      
      const totalSalesValue = salesData.reduce((sum, s) => sum + s.salePrice, 0);
      const totalAssessedValue = salesData.reduce((sum, s) => sum + s.assessedValue, 0);
      
      const ratioStudyData = {
        count: salesData.length,
        medianRatio,
        meanRatio,
        cod,
        prd,
        prb,
        minRatio: sortedRatios[0] || 0,
        maxRatio: sortedRatios[sortedRatios.length - 1] || 0,
        totalSalesValue,
        totalAssessedValue,
      };
      
      // Generate PDF
      const pdfBuffer = generateRatioStudyPDF(ratioStudyData, input);
      
      // Return base64 encoded PDF for download
      return {
        pdf: pdfBuffer.toString("base64"),
        filename: `ratio-study-${input.countyName || "all"}-${new Date().toISOString().split("T")[0]}.pdf`,
      };
    }),
});
