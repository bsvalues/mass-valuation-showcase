import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { sales, parcels } from "../drizzle/schema";
import { and, gte, lte, eq, sql, desc } from "drizzle-orm";

/**
 * Defense Studio Router
 * Provides tools for property tax appeal defense including comparable sales search
 * and automated evidence compilation
 */

export const defenseStudioRouter = router({
  /**
   * Search for comparable sales based on subject property characteristics
   */
  searchComparables: protectedProcedure
    .input(z.object({
      subjectParcelId: z.string(),
      maxDistance: z.number().default(1), // miles
      propertyType: z.string().optional(),
      minSalePrice: z.number().optional(),
      maxSalePrice: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get subject property
      const subjectProperty = await db
        .select()
        .from(parcels)
        .where(eq(parcels.parcelId, input.subjectParcelId))
        .limit(1);
      
      if (subjectProperty.length === 0) {
        throw new Error("Subject property not found");
      }
      
      const subject = subjectProperty[0];
      
      // Build filter conditions
      const conditions = [];
      
      if (input.propertyType) {
        conditions.push(eq(sales.propertyType, input.propertyType));
      }
      if (input.minSalePrice) {
        conditions.push(gte(sales.salePrice, input.minSalePrice));
      }
      if (input.maxSalePrice) {
        conditions.push(lte(sales.salePrice, input.maxSalePrice));
      }
      if (input.startDate) {
        conditions.push(gte(sales.saleDate, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(sales.saleDate, input.endDate));
      }
      
      // Query comparable sales
      const comparableSales = await db
        .select()
        .from(sales)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(sales.saleDate))
        .limit(input.limit * 2); // Get more than needed for filtering
      
      // Calculate similarity scores and filter by distance
      const comparablesWithScores = comparableSales
        .map(sale => {
          // Calculate distance (Haversine formula)
          const distance = calculateDistance(
            parseFloat(subject.latitude || "0"),
            parseFloat(subject.longitude || "0"),
            parseFloat(sale.situsAddress || "0"), // Mock: use latitude from address field
            parseFloat(sale.situsAddress || "0")  // Mock: use longitude from address field
          );
          
          // Calculate similarity score (0-100)
          let score = 100;
          
          // Distance penalty (closer is better)
          score -= distance * 10; // -10 points per mile
          
          // Property type match
          if (sale.propertyType !== subject.propertyType) {
            score -= 20;
          }
          
          // Size similarity (if available)
          if (subject.squareFeet && sale.bedrooms) {
            const sizeDiff = Math.abs((subject.squareFeet || 0) - (sale.bedrooms * 1000)); // Mock calculation
            score -= (sizeDiff / 1000) * 5; // -5 points per 1000 sqft difference
          }
          
          // Age similarity
          if (subject.yearBuilt && sale.bedrooms) {
            const ageDiff = Math.abs((subject.yearBuilt || 0) - (2020 - (sale.bedrooms || 0))); // Mock calculation
            score -= ageDiff * 0.5; // -0.5 points per year difference
          }
          
          return {
            ...sale,
            distance: Math.round(distance * 100) / 100,
            similarityScore: Math.max(0, Math.round(score)),
          };
        })
        .filter(sale => sale.distance <= input.maxDistance)
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, input.limit);
      
      return {
        subjectProperty: subject,
        comparables: comparablesWithScores,
      };
    }),
  
  /**
   * Get subject property details
   */
  getSubjectProperty: protectedProcedure
    .input(z.object({
      parcelId: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const property = await db
        .select()
        .from(parcels)
        .where(eq(parcels.parcelId, input.parcelId))
        .limit(1);
      
      if (property.length === 0) {
        throw new Error("Property not found");
      }
      
      return property[0];
    }),
  
  /**
   * Generate defense report summary statistics
   */
  generateDefenseSummary: protectedProcedure
    .input(z.object({
      subjectParcelId: z.string(),
      comparableIds: z.array(z.number()),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get subject property
      const subjectProperty = await db
        .select()
        .from(parcels)
        .where(eq(parcels.parcelId, input.subjectParcelId))
        .limit(1);
      
      if (subjectProperty.length === 0) {
        throw new Error("Subject property not found");
      }
      
      const subject = subjectProperty[0];
      
      // Get comparable sales
      const { inArray } = await import("drizzle-orm");
      const comparables = await db
        .select()
        .from(sales)
        .where(inArray(sales.id, input.comparableIds));
      
      if (comparables.length === 0) {
        return {
          subjectValue: subject.totalValue || 0,
          comparableCount: 0,
          medianSalePrice: 0,
          averageSalePrice: 0,
          priceRange: { min: 0, max: 0 },
          assessmentVariance: 0,
        };
      }
      
      // Calculate statistics
      const salePrices = comparables.map(c => c.salePrice).sort((a, b) => a - b);
      const medianSalePrice = salePrices[Math.floor(salePrices.length / 2)];
      const averageSalePrice = salePrices.reduce((sum, price) => sum + price, 0) / salePrices.length;
      const minPrice = salePrices[0];
      const maxPrice = salePrices[salePrices.length - 1];
      
      // Calculate assessment variance (how much subject differs from comparables)
      const subjectValue = subject.totalValue || 0;
      const assessmentVariance = ((subjectValue - medianSalePrice) / medianSalePrice) * 100;
      
      return {
        subjectValue,
        comparableCount: comparables.length,
        medianSalePrice: Math.round(medianSalePrice),
        averageSalePrice: Math.round(averageSalePrice),
        priceRange: { min: minPrice, max: maxPrice },
        assessmentVariance: Math.round(assessmentVariance * 100) / 100,
      };
    }),
});

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in miles
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
