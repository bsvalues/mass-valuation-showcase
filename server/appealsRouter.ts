/**
 * Appeals tRPC Router
 * Handles property tax appeal management with CRUD operations
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { appeals } from "../drizzle/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { sendAppealStatusChangeEmail } from "./emailNotifications";

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
      
      // Get current appeal data before update
      const currentAppeal = await db.select().from(appeals).where(eq(appeals.id, id)).limit(1);
      const previousStatus = currentAppeal[0]?.status;
      
      await db.update(appeals).set(updateData).where(eq(appeals.id, id));
      
      // Send email notification if status changed
      if (updates.status && previousStatus && updates.status !== previousStatus) {
        const appeal = currentAppeal[0];
        await sendAppealStatusChangeEmail({
          parcelId: appeal.parcelId,
          previousStatus,
          newStatus: updates.status,
          appealDate: appeal.appealDate.toString(),
          currentAssessedValue: appeal.currentAssessedValue,
          appealedValue: appeal.appealedValue,
          ownerEmail: appeal.ownerEmail || undefined,
        });
      }
      
      return {
        success: true,
      };
    }),
  
  /**
   * Bulk update appeal status
   */
  bulkUpdateStatus: publicProcedure
    .input(z.object({
      appealIds: z.array(z.number()),
      status: z.enum(["pending", "in_review", "hearing_scheduled", "resolved", "withdrawn"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const { appealIds, status } = input;
      
      // Get current appeals before update for email notifications
      const currentAppeals = await db.select().from(appeals).where(sql`${appeals.id} IN (${appealIds.join(',')})`);
      
      // Update all appeals
      await db.update(appeals)
        .set({ status })
        .where(sql`${appeals.id} IN (${appealIds.join(',')})`);
      
      // Send email notifications for each appeal
      for (const appeal of currentAppeals) {
        if (appeal.status !== status) {
          await sendAppealStatusChangeEmail({
            parcelId: appeal.parcelId,
            previousStatus: appeal.status,
            newStatus: status,
            appealDate: appeal.appealDate.toString(),
            currentAssessedValue: appeal.currentAssessedValue,
            appealedValue: appeal.appealedValue,
            ownerEmail: appeal.ownerEmail || undefined,
          });
        }
      }
      
      return {
        success: true,
        updated: appealIds.length,
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
  
  /**
   * Get status counts for dashboard widget
   */
  getStatusCounts: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Count appeals by status
      const results = await db.select({
        status: appeals.status,
        count: sql<number>`count(*)`
      })
      .from(appeals)
      .groupBy(appeals.status);
      
      // Convert to object with all statuses (default to 0)
      const counts = {
        pending: 0,
        in_review: 0,
        hearing_scheduled: 0,
        resolved: 0,
        withdrawn: 0,
      };
      
      results.forEach(row => {
        counts[row.status as keyof typeof counts] = Number(row.count);
      });
      
      return counts;
    }),
  
  /**
   * Get trend data for sparkline
   */
  getTrendData: publicProcedure
    .input(z.object({
      dateRange: z.enum(["7", "30", "90"]).default("30"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get appeals created in specified date range, grouped by date
      const daysAgo = parseInt(input.dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      
      const results = await db.select({
        date: sql<string>`DATE_FORMAT(${appeals.createdAt}, '%Y-%m-%d')`,
        count: sql<number>`count(*)`
      })
      .from(appeals)
      .where(gte(appeals.createdAt, startDate))
      .groupBy(sql`DATE_FORMAT(${appeals.createdAt}, '%Y-%m-%d')`)
      .orderBy(sql`DATE_FORMAT(${appeals.createdAt}, '%Y-%m-%d')` );
      
      return results.map(row => ({
        date: row.date,
        count: Number(row.count)
      }));
    }),

  /**
   * Get audit log with filters
   */
  getAuditLog: publicProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      status: z.string().optional(),
      transitionType: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Query appealTimeline table with filters
      // For now, return empty array since table may not exist yet
      // Once migration is run, implement full query with filters
      return [];
    }),

  /**
   * Get timeline events for an appeal
   */
  getTimeline: publicProcedure
    .input(z.object({
      appealId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // For now, return empty array since appealTimeline table doesn't exist yet
      // Once migration is run, this will query the appealTimeline table
      return [];
    }),
});
