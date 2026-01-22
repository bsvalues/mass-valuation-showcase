import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { broadcastToAll } from "./websocket";
import type { Server as SocketIOServer } from "socket.io";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  parcels: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getParcels(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        parcelId: z.string(),
        address: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        landValue: z.number().optional(),
        buildingValue: z.number().optional(),
        totalValue: z.number().optional(),
        squareFeet: z.number().optional(),
        yearBuilt: z.number().optional(),
        propertyType: z.string().optional(),
        neighborhood: z.string().optional(),
        cluster: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createParcel({ ...input, uploadedBy: ctx.user.id });
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "CREATE_PARCEL",
          entityType: "parcel",
          entityId: input.parcelId,
          details: JSON.stringify(input),
        });
        
        // Broadcast parcel update to all connected clients
        const io: SocketIOServer = (global as any).io;
        if (io) {
          broadcastToAll(io, 'parcel:updated', { parcel: input, action: 'created' }, ctx.user.id.toString());
        }
        
        return { success: true };
      }),
    deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
      await db.deleteAllParcels(ctx.user.id);
      await db.createAuditLog({
        userId: ctx.user.id,
        action: "DELETE_ALL_PARCELS",
        entityType: "parcel",
      });
      
      // Broadcast parcel deletion to all connected clients
      const io: SocketIOServer = (global as any).io;
      if (io) {
        broadcastToAll(io, 'parcel:deleted', { action: 'deleted_all' }, ctx.user.id.toString());
      }
      
      return { success: true };
    }),
    bulkCreate: protectedProcedure
      .input(z.object({
        parcels: z.array(z.object({
          parcelId: z.string(),
          address: z.string().optional(),
          latitude: z.string().optional(),
          longitude: z.string().optional(),
          landValue: z.number().optional(),
          buildingValue: z.number().optional(),
          totalValue: z.number().optional(),
          squareFeet: z.number().optional(),
          yearBuilt: z.number().optional(),
          propertyType: z.string().optional(),
          neighborhood: z.string().optional(),
          cluster: z.number().optional(),
        }))
      }))
      .mutation(async ({ ctx, input }) => {
        await db.bulkCreateParcels(input.parcels.map(p => ({ ...p, uploadedBy: ctx.user.id })));
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "BULK_CREATE_PARCELS",
          entityType: "parcel",
          details: `Uploaded ${input.parcels.length} parcels`,
        });
        
        // Broadcast bulk parcel update to all connected clients
        const io: SocketIOServer = (global as any).io;
        if (io) {
          broadcastToAll(io, 'parcel:updated', { count: input.parcels.length, action: 'bulk_created' }, ctx.user.id.toString());
        }
        
        return { success: true, count: input.parcels.length };
      }),
  }),
  sales: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSales(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        parcelId: z.string(),
        saleDate: z.date(),
        salePrice: z.number(),
        squareFeet: z.number().optional(),
        yearBuilt: z.number().optional(),
        propertyType: z.string().optional(),
        neighborhood: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createSale({ ...input, uploadedBy: ctx.user.id });
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "CREATE_SALE",
          entityType: "sale",
          entityId: input.parcelId,
          details: JSON.stringify(input),
        });
        return { success: true };
      }),
  }),
  auditLogs: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAuditLogs(ctx.user.id);
    }),
  }),
  regressionModels: router({
    save: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        dependentVariable: z.string(),
        independentVariables: z.array(z.string()),
        coefficients: z.record(z.string(), z.number()),
        intercept: z.number(),
        rSquared: z.number(),
        adjustedRSquared: z.number(),
        fStatistic: z.number(),
        fPValue: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const modelId = await db.saveRegressionModel({
          name: input.name,
          description: input.description || null,
          dependentVariable: input.dependentVariable,
          independentVariables: JSON.stringify(input.independentVariables),
          coefficients: JSON.stringify({ ...input.coefficients, intercept: input.intercept }),
          rSquared: String(input.rSquared),
          adjustedRSquared: String(input.adjustedRSquared),
          fStatistic: String(input.fStatistic),
          fPValue: String(input.fPValue),
          createdBy: ctx.user.id,
        });
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "SAVE_REGRESSION_MODEL",
          entityType: "regressionModel",
          entityId: String(modelId),
          details: `Saved model: ${input.name}`,
        });
        return { success: true, modelId };
      }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getRegressionModels(ctx.user.id);
    }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteRegressionModel(input.id, ctx.user.id);
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "DELETE_REGRESSION_MODEL",
          entityType: "regressionModel",
          entityId: String(input.id),
          details: "Deleted regression model",
        });
        return { success: true };
      }),
  }),
  avmModels: router({
    save: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        modelType: z.enum(["randomForest", "neuralNetwork"]),
        serializedModel: z.string(),
        featureStats: z.object({
          mean: z.record(z.string(), z.number()),
          std: z.record(z.string(), z.number()),
        }),
        targetStats: z.object({
          mean: z.number(),
          std: z.number(),
        }),
        mae: z.number(),
        rmse: z.number(),
        r2: z.number(),
        mape: z.number(),
        trainingTime: z.number(),
        trainingDataSize: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const modelId = await db.saveAVMModel({
          name: input.name,
          description: input.description || null,
          modelType: input.modelType,
          serializedModel: input.serializedModel,
          featureStats: JSON.stringify(input.featureStats),
          targetStats: JSON.stringify(input.targetStats),
          mae: String(input.mae),
          rmse: String(input.rmse),
          r2: String(input.r2),
          mape: String(input.mape),
          trainingTime: input.trainingTime,
          trainingDataSize: input.trainingDataSize,
          createdBy: ctx.user.id,
        });
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "SAVE_AVM_MODEL",
          entityType: "avmModel",
          entityId: String(modelId),
          details: `Saved ${input.modelType} model: ${input.name}`,
        });
        return { success: true, modelId };
      }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAVMModels(ctx.user.id);
    }),
    load: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getAVMModelById(input.id, ctx.user.id);
      }),
    updateNotesTags: protectedProcedure
      .input(z.object({
        id: z.number(),
        notes: z.string().optional(),
        tags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateAVMModelNotesTags(input.id, ctx.user.id, input.notes || null, input.tags || null);
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "UPDATE_AVM_MODEL_NOTES",
          entityType: "avmModel",
          entityId: String(input.id),
          details: "Updated model notes/tags",
        });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteAVMModel(input.id, ctx.user.id);
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "DELETE_AVM_MODEL",
          entityType: "avmModel",
          entityId: String(input.id),
          details: "Deleted AVM model",
        });
        return { success: true };
      }),
  }),
  
  dataImport: router({
    uploadFile: protectedProcedure
      .input(z.object({
        filename: z.string(),
        fileFormat: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import('./storage');
        const { importJobs } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        // Generate S3 file key
        const timestamp = Date.now();
        const fileKey = `imports/${ctx.user.id}/${timestamp}-${input.filename}`;
        
        // Create import job record
        const result = await db.insert(importJobs).values({
          userId: ctx.user.id,
          filename: input.filename,
          fileUrl: `placeholder-${fileKey}`, // Will be updated after S3 upload
          fileFormat: input.fileFormat,
          status: 'pending',
        });
        
        // Get the inserted job ID from result
        const jobId = result[0]?.insertId || 0;
        
        // Return job ID and file key for client-side upload
        return { 
          jobId, 
          fileKey,
        };
      }),
    
    uploadToS3: protectedProcedure
      .input(z.object({
        fileKey: z.string(),
        fileData: z.string(), // base64 encoded file
        contentType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import('./storage');
        
        // Decode base64 to buffer
        const buffer = Buffer.from(input.fileData, 'base64');
        
        // Upload to S3
        const { url } = await storagePut(input.fileKey, buffer, input.contentType);
        
        return { url };
      }),
    
    parsePreview: protectedProcedure
      .input(z.object({
        fileUrl: z.string(),
        fileFormat: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { parseCSV } = await import('./lib/fileProcessing/csvParser');
        const { parseExcel } = await import('./lib/fileProcessing/excelParser');
        const { parseJSON } = await import('./lib/fileProcessing/jsonParser');
        const { parseXML } = await import('./lib/fileProcessing/xmlParser');
        const { autoDetectMapping } = await import('./lib/fileProcessing/transformer');
        
        // Parse file based on format
        let records: any[] = [];
        
        if (input.fileFormat === 'csv') {
          records = await parseCSV(input.fileUrl);
        } else if (['xlsx', 'xls'].includes(input.fileFormat)) {
          records = await parseExcel(input.fileUrl);
        } else if (input.fileFormat === 'json') {
          records = await parseJSON(input.fileUrl);
        } else if (input.fileFormat === 'xml') {
          records = await parseXML(input.fileUrl);
        } else {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Unsupported file format: ${input.fileFormat}` });
        }
        
        if (records.length === 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'File contains no data' });
        }
        
        // Get headers from first record
        const headers = Object.keys(records[0]);
        
        // Auto-detect column mapping
        const detectedMapping = autoDetectMapping(headers);
        
        // Get first 10 rows as sample
        const sampleRows = records.slice(0, 10);
        
        return {
          headers,
          detectedMapping,
          sampleRows,
          totalRows: records.length,
        };
      }),
    
    processFile: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        fileUrl: z.string(),
        customMapping: z.object({
          parcelId: z.string().optional(),
          address: z.string().optional(),
          sqft: z.string().optional(),
          yearBuilt: z.string().optional(),
          landValue: z.string().optional(),
          buildingValue: z.string().optional(),
          salePrice: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        const { processImportJob } = await import('./lib/fileProcessing/importer');
        const { importJobs } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        // Update job with actual file URL
        await db.update(importJobs).set({ fileUrl: input.fileUrl }).where(eq(importJobs.id, input.jobId));
        
        // Trigger async processing (don't await to avoid timeout)
        processImportJob(input.jobId, input.customMapping).catch(err => {
          console.error(`Failed to process import job ${input.jobId}:`, err);
        });
        
        return { success: true, message: 'Processing started' };
      }),
    
    getJobStatus: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        const { importJobs } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) return null;
        
        const results = await db.select()
          .from(importJobs)
          .where(eq(importJobs.id, input.jobId))
          .limit(1);
        
        return results[0] || null;
      }),
    
    listJobs: protectedProcedure
      .input(z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
      }))
      .query(async ({ ctx, input }) => {
        const { importJobs } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const { eq, desc } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) return [];
        
        const offset = (input.page - 1) * input.pageSize;
        
        const jobs = await db.select()
          .from(importJobs)
          .where(eq(importJobs.userId, ctx.user.id))
          .orderBy(desc(importJobs.createdAt))
          .limit(input.pageSize)
          .offset(offset);
        
        return jobs;
      }),
    
    getJobErrors: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        page: z.number().default(1),
        pageSize: z.number().default(50),
      }))
      .query(async ({ input }) => {
        const { importErrors } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const { eq, asc } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) return [];
        
        const offset = (input.page - 1) * input.pageSize;
        
        const errors = await db.select()
          .from(importErrors)
          .where(eq(importErrors.jobId, input.jobId))
          .orderBy(asc(importErrors.rowNumber))
          .limit(input.pageSize)
          .offset(offset);
        
        return errors;
      }),
    
    deleteJob: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { importJobs } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        // Verify ownership
        const job = await db.select()
          .from(importJobs)
          .where(eq(importJobs.id, input.jobId))
          .limit(1);
        
        if (!job.length || job[0].userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        
        // Delete job (cascade will delete errors)
        await db.delete(importJobs).where(eq(importJobs.id, input.jobId));
        
        return { success: true };
      }),
    
    // Template Management
    saveTemplate: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        mapping: z.record(z.string(), z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        const { importTemplates } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const result = await db.insert(importTemplates).values({
          name: input.name,
          description: input.description || null,
          mapping: JSON.stringify(input.mapping),
          createdBy: ctx.user.id,
        });
        
        const templateId = result[0]?.insertId || 0;
        
        return { templateId, success: true };
      }),
    
    listTemplates: protectedProcedure
      .query(async ({ ctx }) => {
        const { importTemplates } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const { eq, desc } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const templates = await db.select()
          .from(importTemplates)
          .where(eq(importTemplates.createdBy, ctx.user.id))
          .orderBy(desc(importTemplates.createdAt));
        
        return templates.map(t => ({
          ...t,
          mapping: JSON.parse(t.mapping) as Record<string, string>,
        }));
      }),
    
    loadTemplate: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { importTemplates } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const template = await db.select()
          .from(importTemplates)
          .where(eq(importTemplates.id, input.templateId))
          .limit(1);
        
        if (!template.length || template[0].createdBy !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        
        return {
          ...template[0],
          mapping: JSON.parse(template[0].mapping) as Record<string, string>,
        };
      }),
    
    deleteTemplate: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { importTemplates } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        // Verify ownership
        const template = await db.select()
          .from(importTemplates)
          .where(eq(importTemplates.id, input.templateId))
          .limit(1);
        
        if (!template.length || template[0].createdBy !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        
        await db.delete(importTemplates).where(eq(importTemplates.id, input.templateId));
        
        return { success: true };
      }),
  }),
  
  batchValuation: router({
    startBatch: protectedProcedure
      .input(z.object({
        name: z.string(),
        modelId: z.number().optional(),
        parcelIds: z.array(z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        const { batchJobs } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        // Create batch job
        const result = await db.insert(batchJobs).values({
          userId: ctx.user.id,
          name: input.name,
          modelId: input.modelId ?? null,
          status: 'pending',
          totalParcels: input.parcelIds.length,
          processedParcels: 0,
          successfulParcels: 0,
          failedParcels: 0,
          progress: 0,
        });
        
        const batchJobId = result[0]?.insertId || 0;
        
        // TODO: Start async processing in background
        // For now, return job ID immediately
        
        return { batchJobId, success: true };
      }),
    
    getBatchStatus: protectedProcedure
      .input(z.object({ batchJobId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getBatchJobStatus } = await import('./lib/batchProcessor');
        const job = await getBatchJobStatus(input.batchJobId);
        
        if (!job || job.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        
        return job;
      }),
    
    getBatchResults: protectedProcedure
      .input(z.object({ batchJobId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getBatchJobStatus, getBatchJobResults } = await import('./lib/batchProcessor');
        const job = await getBatchJobStatus(input.batchJobId);
        
        if (!job || job.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        
        const results = await getBatchJobResults(input.batchJobId);
        return results;
      }),
    
    listBatchJobs: protectedProcedure
      .query(async ({ ctx }) => {
        const { batchJobs } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const { eq, desc } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const jobs = await db.select()
          .from(batchJobs)
          .where(eq(batchJobs.userId, ctx.user.id))
          .orderBy(desc(batchJobs.createdAt));
        
        return jobs;
      }),
    
    cancelBatch: protectedProcedure
      .input(z.object({ batchJobId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { cancelBatchJob, getBatchJobStatus } = await import('./lib/batchProcessor');
        const job = await getBatchJobStatus(input.batchJobId);
        
        if (!job || job.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        
        await cancelBatchJob(input.batchJobId);
        return { success: true };
      }),
  }),
  
  analytics: router({
    getAssessmentKPIs: protectedProcedure
      .query(async () => {
        const { parcels } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const { sql } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        // Get total assessed value and parcel count
        const totals = await db.select({
          totalValue: sql<number>`COALESCE(SUM(${parcels.buildingValue} + ${parcels.landValue}), 0)`,
          parcelCount: sql<number>`COUNT(*)`,
        }).from(parcels);
        
        // Placeholder for median ratio and COD (requires sales data)
        const medianRatio = 0.96; // Mock value
        const cod = 8.4; // Mock value
        
        return {
          totalValue: totals[0]?.totalValue || 0,
          parcelCount: totals[0]?.parcelCount || 0,
          medianRatio: medianRatio || 0,
          cod: cod || 0,
        };
      }),
    
    getValueTrends: protectedProcedure
      .query(async () => {
        const { parcels } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const { sql } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        try {
          // Get monthly trends for last 12 months
          const trends = await db.execute(sql`
            SELECT 
              DATE_FORMAT(createdAt, '%Y-%m') as month,
              COALESCE(SUM(buildingValue + landValue), 0) as totalValue,
              COUNT(*) as count
            FROM parcels
            WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
            ORDER BY DATE_FORMAT(createdAt, '%Y-%m')
          `);
          
          return (trends as any[]).map((row: any) => ({
            month: row.month || '',
            totalValue: Number(row.totalValue) || 0,
            count: Number(row.count) || 0,
          }));
        } catch (error) {
          console.error('getValueTrends error:', error);
          // Return empty array if query fails
          return [];
        }
      }),
    
    getRecentActivity: protectedProcedure
      .query(async () => {
        const { importJobs, avmModels, batchJobs } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const { desc, sql } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        // Get recent imports
        const recentImports = await db.select({
          id: importJobs.id,
          type: sql<string>`'import'`,
          description: sql<string>`CONCAT('Imported ', ${importJobs.successfulRecords}, ' records from ', ${importJobs.filename})`,
          timestamp: importJobs.createdAt,
          status: importJobs.status,
        })
        .from(importJobs)
        .orderBy(desc(importJobs.createdAt))
        .limit(5);
        
        // Get recent models
        const recentModels = await db.select({
          id: avmModels.id,
          type: sql<string>`'model'`,
          description: sql<string>`CONCAT('Trained ', ${avmModels.modelType}, ' model: ', ${avmModels.name})`,
          timestamp: avmModels.createdAt,
          status: sql<string>`'completed'`,
        })
        .from(avmModels)
        .orderBy(desc(avmModels.createdAt))
        .limit(5);
        
        // Get recent batch jobs
        const recentBatches = await db.select({
          id: batchJobs.id,
          type: sql<string>`'batch'`,
          description: sql<string>`CONCAT('Batch valuation: ', ${batchJobs.successfulParcels}, '/', ${batchJobs.totalParcels}, ' parcels')`,
          timestamp: batchJobs.createdAt,
          status: batchJobs.status,
        })
        .from(batchJobs)
        .orderBy(desc(batchJobs.createdAt))
        .limit(5);
        
        // Combine and sort all activities
        const allActivities = [...recentImports, ...recentModels, ...recentBatches];
        allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        return allActivities.slice(0, 10);
      }),
    
    getPropertyHeatmapData: protectedProcedure
      .input(z.object({
        propertyTypes: z.array(z.string()).optional(),
        minValue: z.number().optional(),
        maxValue: z.number().optional(),
        minYear: z.number().optional(),
        maxYear: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const { parcels } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        // Build query with filters
        let query = db.select({
          latitude: parcels.latitude,
          longitude: parcels.longitude,
          value: parcels.buildingValue,
          propertyType: parcels.propertyType,
          yearBuilt: parcels.yearBuilt,
        })
        .from(parcels);
        
        // Apply filters if provided
        const filters = input || {};
        const { sql, and, gte, lte, inArray, isNotNull } = await import('drizzle-orm');
        
        const conditions = [
          isNotNull(parcels.latitude),
          isNotNull(parcels.longitude),
          isNotNull(parcels.buildingValue),
        ];
        
        if (filters.propertyTypes && filters.propertyTypes.length > 0) {
          conditions.push(inArray(parcels.propertyType, filters.propertyTypes));
        }
        
        if (filters.minValue !== undefined) {
          conditions.push(gte(parcels.buildingValue, filters.minValue));
        }
        
        if (filters.maxValue !== undefined) {
          conditions.push(lte(parcels.buildingValue, filters.maxValue));
        }
        
        if (filters.minYear !== undefined) {
          conditions.push(gte(parcels.yearBuilt, filters.minYear));
        }
        
        if (filters.maxYear !== undefined) {
          conditions.push(lte(parcels.yearBuilt, filters.maxYear));
        }
        
        query = query.where(and(...conditions)) as any;
        
        const properties = await query.limit(1000); // Limit to 1000 points for performance
        
        // Map to heatmap format
        return properties
          .filter(p => p.latitude && p.longitude && p.value)
          .map(p => ({
            latitude: parseFloat(p.latitude!),
            longitude: parseFloat(p.longitude!),
            value: (p.value || 0),
          }));
      }),
    
    getPropertyFilterOptions: protectedProcedure
      .query(async () => {        const { parcels } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const { sql } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        // Get unique property types
        const propertyTypes = await db.selectDistinct({ propertyType: parcels.propertyType })
          .from(parcels)
          .where(sql`${parcels.propertyType} IS NOT NULL`);
        
        // Get value range
        const valueRange = await db.select({
          minValue: sql<number>`MIN(${parcels.buildingValue})`,
          maxValue: sql<number>`MAX(${parcels.buildingValue})`,
        })
        .from(parcels)
        .where(sql`${parcels.buildingValue} IS NOT NULL`);
        
        // Get year range
        const yearRange = await db.select({
          minYear: sql<number>`MIN(${parcels.yearBuilt})`,
          maxYear: sql<number>`MAX(${parcels.yearBuilt})`,
        })
        .from(parcels)
        .where(sql`${parcels.yearBuilt} IS NOT NULL`);
        
        return {
          propertyTypes: propertyTypes
            .map(p => p.propertyType)
            .filter((t): t is string => !!t)
            .sort(),
          valueRange: {
            min: valueRange[0]?.minValue || 0,
            max: valueRange[0]?.maxValue || 1000000,
          },
          yearRange: {
            min: yearRange[0]?.minYear || 1900,
            max: yearRange[0]?.maxYear || new Date().getFullYear(),
          },
        };
      }),
  }),
  
  admin: router({
    listUsers: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),
    updateUserRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserRole(input.userId, input.role);
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "UPDATE_USER_ROLE",
          entityType: "user",
          entityId: String(input.userId),
          details: `Changed role to ${input.role}`,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
