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
