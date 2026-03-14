import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { batchJobs, batchResults, parcels, regressionModels } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { avmModel, type ParcelFeatures } from "./avmModel";

/**
 * Parcel column → regression variable name mapping
 * Matches the variable names used when saving regression models from RegressionStudio
 */
const PARCEL_FEATURE_MAP: Record<string, (p: Record<string, unknown>) => number> = {
  squareFeet:   (p) => Number(p.squareFeet   ?? 0),
  yearBuilt:    (p) => Number(p.yearBuilt    ?? 0),
  landValue:    (p) => Number(p.landValue    ?? 0),
  buildingValue:(p) => Number(p.buildingValue ?? 0),
  totalValue:   (p) => Number(p.totalValue   ?? 0),
  bedrooms:     (p) => Number(p.bedrooms     ?? 0),
  bathrooms:    (p) => Number(p.bathrooms    ?? 0),
  garageSpaces: (p) => Number(p.garageSpaces ?? 0),
  lotSize:      (p) => Number(p.lotSize      ?? 0),
  latitude:     (p) => Number(p.latitude     ?? 0),
  longitude:    (p) => Number(p.longitude    ?? 0),
};

/**
 * Apply stored linear regression coefficients to a parcel row.
 * Returns predicted value or null if no coefficients match any parcel features.
 */
function applyLinearModel(
  parcel: Record<string, unknown>,
  coefficients: Record<string, number>,
  intercept: number,
  variables: string[]
): number {
  let predicted = intercept;
  for (const varName of variables) {
    const coeff = coefficients[varName];
    if (coeff === undefined) continue;
    const getter = PARCEL_FEATURE_MAP[varName];
    const value = getter ? getter(parcel) : 0;
    predicted += coeff * value;
  }
  return Math.max(0, predicted);
}

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
   * Get the user's current production regression model info (for UI display)
   */
  getProductionModelInfo: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const [model] = await db
        .select()
        .from(regressionModels)
        .where(and(eq(regressionModels.createdBy, ctx.user.id), eq(regressionModels.isProduction, 1)))
        .limit(1);
      if (!model) return null;
      const coeffsRaw = JSON.parse(model.coefficients || '{}') as Record<string, number>;
      const { intercept, ...coefficients } = coeffsRaw;
      const variables: string[] = JSON.parse(model.independentVariables || '[]');
      return {
        id: model.id,
        name: model.name,
        description: model.description,
        variables,
        coefficients,
        intercept: intercept ?? 0,
        rSquared: parseFloat(model.rSquared || '0'),
        adjustedRSquared: parseFloat(model.adjustedRSquared || '0'),
        dependentVariable: model.dependentVariable,
        createdAt: model.createdAt,
      };
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
      
      // Determine inference method: use production regression model if available, else fall back to mock AVM
      // Fetch production model once (outside inner loop for performance)
      let regressionCoeffs: Record<string, number> | null = null;
      let regressionIntercept = 0;
      let regressionVariables: string[] = [];
      let modelTypeName = "mock-avm";

      if (i === 0) {
        // Only fetch on first batch iteration
        const [prodModel] = await db
          .select()
          .from(regressionModels)
          .where(eq(regressionModels.isProduction, 1))
          .limit(1);
        if (prodModel) {
          const raw = JSON.parse(prodModel.coefficients || '{}') as Record<string, number>;
          const { intercept, ...coefficients } = raw;
          regressionCoeffs = coefficients;
          regressionIntercept = intercept ?? 0;
          regressionVariables = JSON.parse(prodModel.independentVariables || '[]');
          modelTypeName = `regression-linear:${prodModel.id}`;
          console.log(`[BatchJob ${jobId}] Using production regression model: ${prodModel.name} (${regressionVariables.length} variables)`);
        } else {
          console.log(`[BatchJob ${jobId}] No production regression model found — using mock AVM`);
        }
      }

      // Run predictions using real regression coefficients or mock AVM
      const predictions: Array<{ parcelId: string; predictedValue: number; features: ParcelFeatures; error?: string }> =
        regressionCoeffs
          ? batch.map((p: Record<string, unknown>) => ({
              parcelId: p.parcelId as string,
              predictedValue: applyLinearModel(p, regressionCoeffs!, regressionIntercept, regressionVariables),
              features: {
                parcelId: p.parcelId as string,
                landValue: p.landValue as number,
                buildingValue: p.buildingValue as number,
                squareFeet: p.squareFeet as number,
                yearBuilt: p.yearBuilt as number,
                propertyType: p.propertyType as string,
                neighborhood: p.neighborhood as string,
              },
            }))
          : await avmModel.predictBatch(features);

      // Save results to database
      for (const prediction of predictions) {
        try {
          await db.insert(batchResults).values({
            batchJobId: jobId,
            parcelId: prediction.parcelId,
            predictedValue: prediction.predictedValue,
            modelType: modelTypeName,
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
