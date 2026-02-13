/**
 * Appeals tRPC Router
 * Handles property tax appeal management with CRUD operations
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { appeals, appealTimeline, appealDocuments } from "../drizzle/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { sendAppealStatusChangeEmail } from "./emailNotifications";
import { notifyOwner } from "./_core/notification";

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
      
      // Track status change in timeline
      if (updates.status && previousStatus && updates.status !== previousStatus) {
        await db.insert(appealTimeline).values({
          appealId: id,
          previousStatus,
          newStatus: updates.status,
          action: `Status changed from ${previousStatus} to ${updates.status}`,
          performedBy: input.assignedTo || null, // TODO: Get from authenticated user context
        });
      }
      
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
   * Assign appeal to staff member
   */
  assignAppeal: publicProcedure
    .input(z.object({
      appealId: z.number(),
      assignedTo: z.number().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const { users } = await import('../drizzle/schema');
      
      // Update assignment
      await db.update(appeals)
        .set({ assignedTo: input.assignedTo })
        .where(eq(appeals.id, input.appealId));
      
      // Get appeal and assignee details for notification
      const appeal = await db.select().from(appeals).where(eq(appeals.id, input.appealId)).limit(1);
      
      if (input.assignedTo && appeal[0]) {
        const assignee = await db.select().from(users).where(eq(users.id, input.assignedTo)).limit(1);
        
        if (assignee[0]?.email) {
          // Send notification email
          await notifyOwner({
            title: `Appeal Assigned: ${appeal[0].parcelId}`,
            content: `Appeal #${appeal[0].id} for parcel ${appeal[0].parcelId} has been assigned to ${assignee[0].name || 'you'}.\n\nCurrent Value: $${appeal[0].currentAssessedValue.toLocaleString()}\nAppealed Value: $${appeal[0].appealedValue.toLocaleString()}\nStatus: ${appeal[0].status}`,
          });
        }
      }
      
      return { success: true };
    }),

  /**
   * Get list of staff members for assignment dropdown
   */
  getStaffList: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const { users } = await import('../drizzle/schema');
      
      const staffList = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .orderBy(users.name);
      
      return staffList;
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

  /**
   * Get comments for an appeal with author information
   */
  getComments: publicProcedure
    .input(z.object({
      appealId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const { appealComments, users } = await import('../drizzle/schema');
      
      // Query comments with author information
      const results = await db.select({
        id: appealComments.id,
        appealId: appealComments.appealId,
        commentType: appealComments.commentType,
        content: appealComments.content,
        createdAt: appealComments.createdAt,
        authorId: appealComments.authorId,
        authorName: users.name,
      })
      .from(appealComments)
      .leftJoin(users, eq(appealComments.authorId, users.id))
      .where(eq(appealComments.appealId, input.appealId))
      .orderBy(desc(appealComments.createdAt));
      
      return results;
    }),

  /**
   * Add comment to an appeal
   */
  addComment: publicProcedure
    .input(z.object({
      appealId: z.number(),
      commentType: z.enum(["internal", "owner_communication"]),
      content: z.string(),
      authorId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const { appealComments } = await import('../drizzle/schema');
      
      const result = await db.insert(appealComments).values({
        appealId: input.appealId,
        commentType: input.commentType,
        content: input.content,
        authorId: input.authorId,
      });
      
      return {
        success: true,
        id: Number((result as any).insertId),
      };
    }),

  /**
   * Get documents for an appeal
   */
  getDocuments: publicProcedure
    .input(z.object({
      appealId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const { appealDocuments } = await import('../drizzle/schema');
      
      const results = await db.select()
        .from(appealDocuments)
        .where(eq(appealDocuments.appealId, input.appealId))
        .orderBy(desc(appealDocuments.createdAt));
      
      return results;
    }),

  /**
   * Upload document for an appeal
   * Client should first upload file to S3, then call this with metadata
   */
  uploadDocument: publicProcedure
    .input(z.object({
      appealId: z.number(),
      fileName: z.string(),
      fileSize: z.number(),
      fileType: z.string(),
      fileKey: z.string(),
      fileUrl: z.string(),
      uploadedBy: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const { appealDocuments } = await import('../drizzle/schema');
      
      const result = await db.insert(appealDocuments).values({
        appealId: input.appealId,
        fileName: input.fileName,
        fileSize: input.fileSize,
        fileType: input.fileType,
        fileKey: input.fileKey,
        fileUrl: input.fileUrl,
        uploadedBy: input.uploadedBy,
      });
      
      return {
        success: true,
        id: Number((result as any).insertId),
      };
    }),

  /**
   * Delete document from an appeal
   */
  deleteDocument: publicProcedure
    .input(z.object({
      documentId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const { appealDocuments } = await import('../drizzle/schema');
      
      await db.delete(appealDocuments)
        .where(eq(appealDocuments.id, input.documentId));
      
      return { success: true };
    }),

  /**
   * Get all documents for multiple appeals (for bulk download)
   */
  getBulkDocuments: publicProcedure
    .input(z.object({
      appealIds: z.array(z.number()),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const { appealDocuments } = await import('../drizzle/schema');
      
      const results = await db.select()
        .from(appealDocuments)
        .where(sql`${appealDocuments.appealId} IN (${input.appealIds.join(',')})`)
        .orderBy(desc(appealDocuments.createdAt));
      
      return results;
    }),

  /**
   * Get analytics: resolution time trend (monthly average)
   */
  getResolutionTimeTrend: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get average resolution time per month for last 6 months
      const results = await db.select({
        month: sql<string>`DATE_FORMAT(${appeals.resolutionDate}, '%b')`,
        avgDays: sql<number>`AVG(DATEDIFF(${appeals.resolutionDate}, ${appeals.appealDate}))`
      })
      .from(appeals)
      .where(and(
        sql`${appeals.resolutionDate} IS NOT NULL`,
        gte(appeals.resolutionDate, sql`DATE_SUB(NOW(), INTERVAL 6 MONTH)`)
      ))
      .groupBy(sql`DATE_FORMAT(${appeals.resolutionDate}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${appeals.resolutionDate}, '%Y-%m')`);
      
      return results.map(row => ({
        month: row.month,
        avgDays: Math.round(Number(row.avgDays) || 0)
      }));
    }),

  /**
   * Get analytics: success rate by property type
   */
  getSuccessRateByType: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Join with parcels to get property type, calculate success rate
      const { parcels } = await import('../drizzle/schema');
      
      const results = await db.select({
        propertyType: parcels.propertyType,
        total: sql<number>`COUNT(*)`,
        successful: sql<number>`SUM(CASE WHEN ${appeals.status} = 'resolved' AND ${appeals.finalValue} < ${appeals.currentAssessedValue} THEN 1 ELSE 0 END)`
      })
      .from(appeals)
      .leftJoin(parcels, eq(appeals.parcelId, parcels.parcelId))
      .where(sql`${parcels.propertyType} IS NOT NULL`)
      .groupBy(parcels.propertyType);
      
      return results.map(row => ({
        propertyType: row.propertyType || 'Unknown',
        total: Number(row.total),
        successRate: row.total > 0 ? Math.round((Number(row.successful) / Number(row.total)) * 100) : 0
      }));
    }),

  /**
   * Get analytics: value adjustment distribution
   */
  getValueAdjustmentDistribution: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Calculate value reduction ranges
      const results = await db.select({
        range: sql<string>`CASE
          WHEN (${appeals.currentAssessedValue} - ${appeals.finalValue}) < 10000 THEN '$0-$10K'
          WHEN (${appeals.currentAssessedValue} - ${appeals.finalValue}) < 25000 THEN '$10K-$25K'
          WHEN (${appeals.currentAssessedValue} - ${appeals.finalValue}) < 50000 THEN '$25K-$50K'
          WHEN (${appeals.currentAssessedValue} - ${appeals.finalValue}) < 100000 THEN '$50K-$100K'
          ELSE '$100K+'
        END`,
        count: sql<number>`COUNT(*)`
      })
      .from(appeals)
      .where(and(
        sql`${appeals.finalValue} IS NOT NULL`,
        sql`${appeals.finalValue} < ${appeals.currentAssessedValue}`
      ))
      .groupBy(sql`CASE
        WHEN (${appeals.currentAssessedValue} - ${appeals.finalValue}) < 10000 THEN '$0-$10K'
        WHEN (${appeals.currentAssessedValue} - ${appeals.finalValue}) < 25000 THEN '$10K-$25K'
        WHEN (${appeals.currentAssessedValue} - ${appeals.finalValue}) < 50000 THEN '$25K-$50K'
        WHEN (${appeals.currentAssessedValue} - ${appeals.finalValue}) < 100000 THEN '$50K-$100K'
        ELSE '$100K+'
      END`);
      
      return results.map(row => ({
        range: row.range,
        count: Number(row.count)
      }));
    }),

  /**
   * Get analytics: KPI metrics
   */
  getAnalyticsKPIs: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Average resolution time
      const avgResolutionResult = await db.select({
        avgDays: sql<number>`AVG(DATEDIFF(${appeals.resolutionDate}, ${appeals.appealDate}))`
      })
      .from(appeals)
      .where(sql`${appeals.resolutionDate} IS NOT NULL`);
      
      // Overall success rate
      const successRateResult = await db.select({
        total: sql<number>`COUNT(*)`,
        successful: sql<number>`SUM(CASE WHEN ${appeals.status} = 'resolved' AND ${appeals.finalValue} < ${appeals.currentAssessedValue} THEN 1 ELSE 0 END)`
      })
      .from(appeals)
      .where(eq(appeals.status, 'resolved'));
      
      // Total value adjusted
      const valueAdjustedResult = await db.select({
        totalAdjusted: sql<number>`SUM(${appeals.currentAssessedValue} - ${appeals.finalValue})`
      })
      .from(appeals)
      .where(and(
        sql`${appeals.finalValue} IS NOT NULL`,
        sql`${appeals.finalValue} < ${appeals.currentAssessedValue}`
      ));
      
      // Appeals this month
      const thisMonthResult = await db.select({
        count: sql<number>`COUNT(*)`
      })
      .from(appeals)
      .where(gte(appeals.createdAt, sql`DATE_SUB(NOW(), INTERVAL 1 MONTH)`));
      
      const avgDays = Math.round(Number(avgResolutionResult[0]?.avgDays) || 0);
      const successRate = successRateResult[0] ? 
        Math.round((Number(successRateResult[0].successful) / Number(successRateResult[0].total)) * 100) : 0;
      const totalAdjusted = Number(valueAdjustedResult[0]?.totalAdjusted) || 0;
      const thisMonthCount = Number(thisMonthResult[0]?.count) || 0;
      
      return {
        avgResolutionDays: avgDays,
        successRate,
        totalValueAdjusted: totalAdjusted,
        appealsThisMonth: thisMonthCount
      };
    }),

  /**
   * Get status change history for an appeal
   */
  getStatusHistory: publicProcedure
    .input(z.object({
      appealId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const history = await db.select()
        .from(appealTimeline)
        .where(eq(appealTimeline.appealId, input.appealId))
        .orderBy(desc(appealTimeline.createdAt));
      
      return history;
    }),

  /**
   * Bulk import appeals from CSV
   */
  bulkImport: publicProcedure
    .input(z.object({
      appeals: z.array(z.object({
        parcelId: z.string(),
        appealDate: z.string(), // ISO date string
        currentAssessedValue: z.number(),
        appealedValue: z.number(),
        finalValue: z.number().optional(),
        status: z.enum(["pending", "in_review", "hearing_scheduled", "resolved", "withdrawn"]),
        appealReason: z.string(),
        resolution: z.string().optional(),
        countyName: z.string(),
        filedBy: z.number().optional(),
        assignedTo: z.number().optional(),
        ownerEmail: z.string().email(),
        hearingDate: z.string().optional(), // ISO date string
        resolutionDate: z.string().optional(), // ISO date string
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      try {
        // Convert date strings to Date objects
        const appealsToInsert = input.appeals.map(appeal => ({
          ...appeal,
          appealDate: new Date(appeal.appealDate),
          hearingDate: appeal.hearingDate ? new Date(appeal.hearingDate) : null,
          resolutionDate: appeal.resolutionDate ? new Date(appeal.resolutionDate) : null,
        }));

        // Insert all appeals
        const result = await db.insert(appeals).values(appealsToInsert);

        return {
          success: true,
          count: input.appeals.length,
          message: `Successfully imported ${input.appeals.length} appeals`,
        };
      } catch (error) {
        console.error('[Appeals] Bulk import error:', error);
        throw new Error(`Failed to import appeals: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});
