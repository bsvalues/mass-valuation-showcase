/**
 * tRPC Router for Background Jobs
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { backgroundJobs } from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const backgroundJobsRouter = router({
  /**
   * Create a new parcel load job
   */
  createParcelLoadJob: protectedProcedure
    .input(z.object({
      countyName: z.string(),
      parcelLimit: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const jobId = nanoid();
      
      await db.insert(backgroundJobs).values({
        id: jobId,
        userId: ctx.user.id,
        jobType: 'parcel_load',
        status: 'pending',
        processed: 0,
        succeeded: 0,
        failed: 0,
        total: 0,
        countyName: input.countyName,
        parcelLimit: input.parcelLimit,
      });
      
      return {
        success: true,
        jobId,
        message: `Background job created for ${input.countyName} County`,
      };
    }),
  
  /**
   * Get job status by ID
   */
  getJobStatus: protectedProcedure
    .input(z.object({
      jobId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const [job] = await db
        .select()
        .from(backgroundJobs)
        .where(eq(backgroundJobs.id, input.jobId))
        .limit(1);
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      // Only allow users to see their own jobs
      if (job.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }
      
      return job;
    }),
  
  /**
   * List all jobs for current user
   */
  listMyJobs: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const jobs = await db
        .select()
        .from(backgroundJobs)
        .where(eq(backgroundJobs.userId, ctx.user.id))
        .orderBy(desc(backgroundJobs.createdAt))
        .limit(50);
      
      return jobs;
    }),
  
  /**
   * Get job errors for CSV download
   */
  getJobErrors: protectedProcedure
    .input(z.object({
      jobId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // First verify user owns this job
      const [job] = await db
        .select()
        .from(backgroundJobs)
        .where(eq(backgroundJobs.id, input.jobId))
        .limit(1);
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      if (job.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }
      
      // Get errors from jobErrors table
      const { jobErrors } = await import('../drizzle/schema');
      const errors = await db
        .select()
        .from(jobErrors)
        .where(eq(jobErrors.jobId, input.jobId))
        .orderBy(desc(jobErrors.createdAt));
      
      return errors;
    }),
  
  /**
   * Get all jobs (admin only)
   */
  listAllJobs: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // TODO: Add admin check
      
      const jobs = await db
        .select()
        .from(backgroundJobs)
        .orderBy(desc(backgroundJobs.createdAt))
        .limit(100);
      
      return jobs;
    }),
});
