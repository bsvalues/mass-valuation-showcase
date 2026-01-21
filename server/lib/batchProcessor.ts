/**
 * Batch Valuation Processing Service
 * Handles batch AVM predictions on thousands of parcels with progress tracking
 */

import { getDb } from '../db';
import { batchJobs, batchResults, parcels } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Predict with trained model (placeholder - will be replaced with actual AVM logic)
 */
function predictWithModel(modelData: any, modelType: string, features: any): Promise<number> {
  // TODO: Implement actual prediction logic using ml.js or brain.js
  // For now, return a simple estimate based on features
  const { squareFeet, yearBuilt, landValue, buildingValue } = features;
  const estimate = landValue + buildingValue + (squareFeet * 150);
  return Promise.resolve(estimate);
}

export interface BatchProcessingOptions {
  batchJobId: number;
  modelData: any; // Serialized model (RF or NN)
  modelType: 'randomForest' | 'neuralNetwork';
  parcelIds: string[];
  onProgress?: (progress: number, processed: number, total: number) => void;
}

/**
 * Process batch valuation job
 * Runs AVM predictions on all specified parcels with progress tracking
 */
export async function processBatchJob(options: BatchProcessingOptions): Promise<void> {
  const { batchJobId, modelData, modelType, parcelIds, onProgress } = options;
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  try {
    // Update job status to processing
    await db.update(batchJobs)
      .set({ 
        status: 'processing',
        startedAt: new Date(),
      })
      .where(eq(batchJobs.id, batchJobId));

    const totalParcels = parcelIds.length;
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Process parcels in batches of 100 for performance
    const BATCH_SIZE = 100;
    for (let i = 0; i < parcelIds.length; i += BATCH_SIZE) {
      const batchParcelIds = parcelIds.slice(i, i + BATCH_SIZE);
      
      // Fetch parcel data
      const parcelData = await db.select().from(parcels)
        .where(eq(parcels.parcelId, batchParcelIds[0])); // TODO: Use IN clause for multiple IDs

      // Process each parcel
      for (const parcelId of batchParcelIds) {
        try {
          // Find parcel data
          const parcel = parcelData.find(p => p.parcelId === parcelId);
          if (!parcel) {
            throw new Error(`Parcel ${parcelId} not found`);
          }

          // Extract features
          const features = {
            squareFeet: parcel.squareFeet || 0,
            yearBuilt: parcel.yearBuilt || 0,
            landValue: parcel.landValue || 0,
            buildingValue: parcel.buildingValue || 0,
          };

          // Run prediction
          const prediction = await predictWithModel(modelData, modelType, features);

          // Save result
          await db.insert(batchResults).values({
            batchJobId,
            parcelId,
            predictedValue: Math.round(prediction),
            modelType,
            features: JSON.stringify(features),
            error: null,
          });

          successCount++;
        } catch (error) {
          // Log error
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Parcel ${parcelId}: ${errorMessage}`);
          
          await db.insert(batchResults).values({
            batchJobId,
            parcelId,
            predictedValue: null,
            modelType,
            features: null,
            error: errorMessage,
          });

          failedCount++;
        }

        processedCount++;

        // Update progress
        const progress = Math.round((processedCount / totalParcels) * 100);
        await db.update(batchJobs)
          .set({ 
            processedParcels: processedCount,
            successfulParcels: successCount,
            failedParcels: failedCount,
            progress,
          })
          .where(eq(batchJobs.id, batchJobId));

        // Call progress callback
        if (onProgress) {
          onProgress(progress, processedCount, totalParcels);
        }
      }
    }

    // Mark job as completed
    await db.update(batchJobs)
      .set({ 
        status: 'completed',
        completedAt: new Date(),
        errorSummary: errors.length > 0 ? errors.slice(0, 100).join('\n') : null,
      })
      .where(eq(batchJobs.id, batchJobId));

  } catch (error) {
    // Mark job as failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await db.update(batchJobs)
      .set({ 
        status: 'failed',
        completedAt: new Date(),
        errorSummary: errorMessage,
      })
      .where(eq(batchJobs.id, batchJobId));

    throw error;
  }
}

/**
 * Cancel a running batch job
 */
export async function cancelBatchJob(batchJobId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  await db.update(batchJobs)
    .set({ 
      status: 'cancelled',
      completedAt: new Date(),
    })
    .where(eq(batchJobs.id, batchJobId));
}

/**
 * Get batch job status
 */
export async function getBatchJobStatus(batchJobId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const [job] = await db.select().from(batchJobs)
    .where(eq(batchJobs.id, batchJobId));

  return job;
}

/**
 * Get batch job results
 */
export async function getBatchJobResults(batchJobId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const results = await db.select().from(batchResults)
    .where(eq(batchResults.batchJobId, batchJobId));

  return results;
}
