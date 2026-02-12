/**
 * Appeals tRPC Router
 * Handles property tax appeal management with CRUD operations
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { appeals } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const appealsRouter = router({
  /**
   * Get all appeals with optional filtering
   */
  list: publicProcedure
    .input(z.object({
      status: z.enum(["pending", "in_review", "hearing_scheduled", "resolved", "withdrawn"]).optional(),
      parcelId: z.string().optional(),
      countyName: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      let query = db.select().from(appeals);
      
      const conditions = [];
      if (input?.status) {
        conditions.push(eq(appeals.status, input.status));
      }
      if (input?.parcelId) {
        conditions.push(eq(appeals.parcelId, input.parcelId));
      }
      if (input?.countyName) {
        conditions.push(eq(appeals.countyName, input.countyName));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      const results = await query.orderBy(desc(appeals.createdAt));
      return results;
    }),
  
  /**
   * Get single appeal by ID
   */
  getById: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const result = await db.select().from(appeals).where(eq(appeals.id, input.id));
      return result[0] || null;
    }),
  
  /**
   * Create new appeal
   */
  create: publicProcedure
    .input(z.object({
      parcelId: z.string(),
      appealDate: z.string(), // ISO date string
      currentAssessedValue: z.number(),
      appealedValue: z.number(),
      appealReason: z.string().optional(),
      countyName: z.string().optional(),
      filedBy: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('[AppealsRouter] create mutation called with input:', JSON.stringify(input));
      const db = await getDb();
      if (!db) {
        console.error('[AppealsRouter] Database not available');
        throw new Error('Database not available');
      }
      
      console.log('[AppealsRouter] Inserting appeal into database...');
      const result = await db.insert(appeals).values({
        parcelId: input.parcelId,
        appealDate: new Date(input.appealDate),
        currentAssessedValue: input.currentAssessedValue,
        appealedValue: input.appealedValue,
        appealReason: input.appealReason,
        countyName: input.countyName,
        filedBy: input.filedBy,
        status: "pending",
      });
      
      return {
        success: true,
        id: Number((result as any).insertId),
      };
    }),
  
  /**
   * Update appeal
   */
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "in_review", "hearing_scheduled", "resolved", "withdrawn"]).optional(),
      finalValue: z.number().optional(),
      appealReason: z.string().optional(),
      resolution: z.string().optional(),
      assignedTo: z.number().optional(),
      hearingDate: z.string().optional(), // ISO date string
      resolutionDate: z.string().optional(), // ISO date string
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const { id, ...updates } = input;
      
      const updateData: any = {};
      if (updates.status) updateData.status = updates.status;
      if (updates.finalValue !== undefined) updateData.finalValue = updates.finalValue;
      if (updates.appealReason) updateData.appealReason = updates.appealReason;
      if (updates.resolution) updateData.resolution = updates.resolution;
      if (updates.assignedTo) updateData.assignedTo = updates.assignedTo;
      if (updates.hearingDate) updateData.hearingDate = new Date(updates.hearingDate);
      if (updates.resolutionDate) updateData.resolutionDate = new Date(updates.resolutionDate);
      
      await db.update(appeals).set(updateData).where(eq(appeals.id, id));
      
      return {
        success: true,
      };
    }),
  
  /**
   * Delete appeal
   */
  delete: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.delete(appeals).where(eq(appeals.id, input.id));
      
      return {
        success: true,
      };
    }),
  
  /**
   * Update appeal status (for drag-and-drop)
   */
  updateStatus: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "in_review", "hearing_scheduled", "resolved", "withdrawn"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.update(appeals).set({ status: input.status }).where(eq(appeals.id, input.id));
      
      return {
        success: true,
      };
    }),
});
