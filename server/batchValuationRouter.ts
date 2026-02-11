import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { batchJobs, batchResults, parcels } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { avmModel, type ParcelFeatures } from "./avmModel";

/**
 * Batch Valuation Router
 * Handles mass property valuation using AVM models with background job processing
 */

export const batchValuationRouter = router({
  /**
   * Start a new batch valuation job
   */
  startJob: protectedProcedure
    .input(z.object({
      name: z.string(),
      modelId: z.number().optional(),
      parcelIds: z.array(z.string()).optional(), // If not provided, process all parcels
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get parcels to process
      let parcelsToProcess;
      if (input.parcelIds && input.parcelIds.length > 0) {
        const { inArray } = await import("drizzle-orm");
        parcelsToProcess = await db
          .select()
          .from(parcels)
          .where(inArray(parcels.parcelId, input.parcelIds));
      } else {
        parcelsToProcess = await db.select().from(parcels);
      }
      
      if (parcelsToProcess.length === 0) {
        throw new Error("No parcels found to process");
      }
      
      // Create batch job record
      const result = await db.insert(batchJobs).values({
        userId: ctx.user.id,
        name: input.name,
        modelId: input.modelId || null,
        status: "pending",
        totalParcels: parcelsToProcess.length,
        processedParcels: 0,
        successfulParcels: 0,
        failedParcels: 0,
        progress: 0,
        startedAt: new Date(),
      });
      
      const jobId = Number(result[0].insertId);
      
      // Start background processing (non-blocking)
      processBatchJob(jobId, parcelsToProcess).catch(error => {
        console.error(`Batch job ${jobId} failed:`, error);
      });
      
      return {
        jobId,
        totalParcels: parcelsToProcess.length,
        status: "pending",
      };
    }),
  
  /**
   * Get status of a batch job
   */
  getJobStatus: protectedProcedure
    .input(z.object({
      jobId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const job = await db
        .select()
        .from(batchJobs)
        .where(eq(batchJobs.id, input.jobId))
        .limit(1);
      
      if (job.length === 0) {
        throw new Error("Job not found");
      }
      
      return job[0];
    }),
  
  /**
   * Get results of a completed batch job
   */
  getJobResults: protectedProcedure
    .input(z.object({
      jobId: z.number(),
      limit: z.number().default(100),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const results = await db
        .select()
        .from(batchResults)
        .where(eq(batchResults.batchJobId, input.jobId))
        .limit(input.limit)
        .offset(input.offset);
      
      return results;
    }),
  
  /**
   * List all batch jobs for current user
   */
  listJobs: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const jobs = await db
        .select()
        .from(batchJobs)
        .where(eq(batchJobs.userId, ctx.user.id))
        .orderBy(desc(batchJobs.createdAt))
        .limit(input.limit);
      
      return jobs;
    }),
  
  /**
   * Cancel a running batch job
   */
  cancelJob: protectedProcedure
    .input(z.object({
      jobId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Verify job belongs to user
      const job = await db
        .select()
        .from(batchJobs)
        .where(eq(batchJobs.id, input.jobId))
        .limit(1);
      
      if (job.length === 0) {
        throw new Error("Job not found");
      }
      
      if (job[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      
      if (job[0].status === "completed" || job[0].status === "failed") {
        throw new Error("Cannot cancel completed or failed job");
      }
      
      // Update job status to cancelled
      await db
        .update(batchJobs)
        .set({
          status: "cancelled",
          completedAt: new Date(),
        })
        .where(eq(batchJobs.id, input.jobId));
      
      return { success: true };
    }),
  
  /**
   * Delete a batch job and its results
   */
  deleteJob: protectedProcedure
    .input(z.object({
      jobId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Verify job belongs to user
      const job = await db
        .select()
        .from(batchJobs)
        .where(eq(batchJobs.id, input.jobId))
        .limit(1);
      
      if (job.length === 0) {
        throw new Error("Job not found");
      }
      
      if (job[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      
      // Delete results first (foreign key constraint)
      await db.delete(batchResults).where(eq(batchResults.batchJobId, input.jobId));
      
      // Delete job
      await db.delete(batchJobs).where(eq(batchJobs.id, input.jobId));
      
      return { success: true };
    }),
});

/**
 * Background job processor
 * Processes parcels in batches and updates job status
 */
async function processBatchJob(jobId: number, parcelsToProcess: any[]) {
  const db = await getDb();
  if (!db) {
    console.error("Database not available for batch job processing");
    return;
  }
  
  try {
    // Update job status to processing
    await db
      .update(batchJobs)
      .set({ status: "processing" })
      .where(eq(batchJobs.id, jobId));
    
    const batchSize = 50; // Process 50 parcels at a time
    let processedCount = 0;
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < parcelsToProcess.length; i += batchSize) {
      // Check if job was cancelled
      const jobStatus = await db
        .select()
        .from(batchJobs)
        .where(eq(batchJobs.id, jobId))
        .limit(1);
      
      if (jobStatus[0]?.status === "cancelled") {
        console.log(`Batch job ${jobId} was cancelled`);
        return;
      }
      
      const batch = parcelsToProcess.slice(i, i + batchSize);
      
      // Convert parcels to features
      const features: ParcelFeatures[] = batch.map(p => ({
        parcelId: p.parcelId,
        landValue: p.landValue,
        buildingValue: p.buildingValue,
        squareFeet: p.squareFeet,
        yearBuilt: p.yearBuilt,
        propertyType: p.propertyType,
        neighborhood: p.neighborhood,
        latitude: p.latitude,
        longitude: p.longitude,
      }));
      
      // Run predictions
      const predictions = await avmModel.predictBatch(features);
      
      // Save results to database
      for (const prediction of predictions) {
        try {
          await db.insert(batchResults).values({
            batchJobId: jobId,
            parcelId: prediction.parcelId,
            predictedValue: prediction.predictedValue,
            modelType: "mock-avm",
            features: JSON.stringify(prediction.features),
            error: prediction.error || null,
          });
          
          if (prediction.error) {
            failCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to save result for parcel ${prediction.parcelId}:`, error);
          failCount++;
        }
      }
      
      processedCount += batch.length;
      const progress = Math.round((processedCount / parcelsToProcess.length) * 100);
      
      // Update job progress
      await db
        .update(batchJobs)
        .set({
          processedParcels: processedCount,
          successfulParcels: successCount,
          failedParcels: failCount,
          progress,
        })
        .where(eq(batchJobs.id, jobId));
    }
    
    // Mark job as completed
    await db
      .update(batchJobs)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(batchJobs.id, jobId));
    
    console.log(`Batch job ${jobId} completed: ${successCount} successful, ${failCount} failed`);
  } catch (error) {
    console.error(`Batch job ${jobId} processing error:`, error);
    
    // Mark job as failed
    await db
      .update(batchJobs)
      .set({
        status: "failed",
        errorSummary: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      })
      .where(eq(batchJobs.id, jobId));
  }
}
