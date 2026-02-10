/**
 * Background Worker for Processing Long-Running Jobs
 * Polls for pending jobs and executes them asynchronously
 */

import { getDb } from './db';
import { backgroundJobs } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { loadWACountyParcels } from './waParcelFabric';
import { notifyOwner } from './_core/notification';

const POLL_INTERVAL_MS = 5000; // Check for new jobs every 5 seconds
let isProcessing = false;

/**
 * Start the background worker
 */
export function startBackgroundWorker() {
  console.log('[BackgroundWorker] Starting worker...');
  
  setInterval(async () => {
    if (isProcessing) {
      return; // Skip if already processing a job
    }
    
    await processNextJob();
  }, POLL_INTERVAL_MS);
}

/**
 * Process the next pending job
 */
async function processNextJob() {
  try {
    const db = await getDb();
    if (!db) return;
    
    // Find oldest pending job
    const [job] = await db
      .select()
      .from(backgroundJobs)
      .where(eq(backgroundJobs.status, 'pending'))
      .orderBy(backgroundJobs.createdAt)
      .limit(1);
    
    if (!job) {
      return; // No pending jobs
    }
    
    isProcessing = true;
    console.log(`[BackgroundWorker] Processing job ${job.id} (${job.jobType})`);
    
    // Mark job as running
    await db
      .update(backgroundJobs)
      .set({
        status: 'running',
        startedAt: new Date(),
      })
      .where(eq(backgroundJobs.id, job.id));
    
    // Execute job based on type
    if (job.jobType === 'parcel_load') {
      await processParcelLoadJob(job);
    }
    
  } catch (error: any) {
    console.error('[BackgroundWorker] Error processing job:', error);
  } finally {
    isProcessing = false;
  }
}

/**
 * Process a parcel load job
 */
async function processParcelLoadJob(job: any) {
  const startTime = Date.now();
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  try {
    // Progress callback to update job status
    const onProgress = async (current: number, total: number) => {
      await db
        .update(backgroundJobs)
        .set({
          progress: current,
          total: total,
        })
        .where(eq(backgroundJobs.id, job.id));
    };
    
    // Load parcels with progress tracking
    const result = await loadWACountyParcels(
      job.countyName,
      job.parcelLimit || 0,
      onProgress
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to load parcels');
    }
    
    // TODO: Save parcels to database (implement saveWAParcelsToDatabase)
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    // Mark job as completed
    await db
      .update(backgroundJobs)
      .set({
        status: 'completed',
        progress: result.parcelCount,
        total: result.parcelCount,
        completedAt: new Date(),
        resultSummary: JSON.stringify({
          parcelCount: result.parcelCount,
          bounds: result.bounds,
          durationSeconds: duration,
        }),
      })
      .where(eq(backgroundJobs.id, job.id));
    
    // Send email notification
    await notifyOwner({
      title: `✅ Parcel Load Complete: ${job.countyName} County`,
      content: `Successfully loaded ${result.parcelCount} parcels from ${job.countyName} County in ${duration} seconds.\n\n` +
        `View the data in Map Explorer or County Dashboard.`,
    });
    
    console.log(`[BackgroundWorker] Job ${job.id} completed successfully`);
    
  } catch (error: any) {
    console.error(`[BackgroundWorker] Job ${job.id} failed:`, error);
    
    // Mark job as failed
    await db
      .update(backgroundJobs)
      .set({
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error.message || 'Unknown error',
      })
      .where(eq(backgroundJobs.id, job.id));
    
    // Send error notification
    await notifyOwner({
      title: `❌ Parcel Load Failed: ${job.countyName} County`,
      content: `Failed to load parcels from ${job.countyName} County.\n\nError: ${error.message}`,
    });
  }
}
