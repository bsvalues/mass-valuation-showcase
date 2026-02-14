import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { sales } from "../drizzle/schema";
import { like, or, eq } from "drizzle-orm";

export const propertyComparisonRouter = router({
  searchProperties: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const { query, limit } = input;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = await db
        .select({
          id: sales.id,
          parcelId: sales.parcelId,
          address: sales.situsAddress,
          salePrice: sales.salePrice,
          assessedValue: sales.assessedValue,
          sqft: sales.squareFeet,
          yearBuilt: sales.yearBuilt,
          bedrooms: sales.bedrooms,
          bathrooms: sales.bathrooms,
        })
        .from(sales)
        .where(
          or(
            like(sales.parcelId, `%${query}%`),
            like(sales.situsAddress, `%${query}%`)
          )
        )
        .limit(limit);

      return results;
    }),

  getPropertyById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const property = await db
        .select()
        .from(sales)
        .where(eq(sales.id, input.id))
        .limit(1);

      if (property.length === 0) {
        throw new Error("Property not found");
      }

      return property[0];
    }),

  getPropertiesByIds: publicProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .query(async ({ input }) => {
      if (input.ids.length === 0) return [];
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const properties = await db
        .select({
          id: sales.id,
          parcelId: sales.parcelId,
          address: sales.situsAddress,
          salePrice: sales.salePrice,
          assessedValue: sales.assessedValue,
          sqft: sales.squareFeet,
          yearBuilt: sales.yearBuilt,
          bedrooms: sales.bedrooms,
          bathrooms: sales.bathrooms,
          propertyType: sales.propertyType,
          clusterId: sales.neighborhoodClusterId,
        })
        .from(sales)
        .where(
          or(...input.ids.map(id => eq(sales.id, id)))
        );

      return properties;
    }),
});
