/**
 * Appeal Templates tRPC Router
 * Handles CRUD operations for appeal templates
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { appealTemplates } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const templatesRouter = router({
  /**
   * Get all active templates
   */
  list: publicProcedure
    .input(z.object({
      category: z.enum(["residential", "commercial", "land", "industrial", "agricultural"]).optional(),
      includeInactive: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      let query = db.select().from(appealTemplates);
      
      const conditions = [];
      if (!input?.includeInactive) {
        conditions.push(eq(appealTemplates.isActive, 1));
      }
      if (input?.category) {
        conditions.push(eq(appealTemplates.category, input.category));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      const results = await query.orderBy(desc(appealTemplates.createdAt));
      return results;
    }),
  
  /**
   * Get single template by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const [template] = await db
        .select()
        .from(appealTemplates)
        .where(eq(appealTemplates.id, input.id))
        .limit(1);
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      return template;
    }),
  
  /**
   * Create new template
   */
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      category: z.enum(["residential", "commercial", "land", "industrial", "agricultural"]),
      defaultAppealReason: z.string().optional(),
      suggestedDocuments: z.string().optional(), // JSON string
      estimatedProcessingDays: z.number().optional(),
      createdBy: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const result = await db.insert(appealTemplates).values({
        ...input,
        isActive: 1,
      });
      
      return {
        success: true,
        id: Number((result as any).insertId),
        message: 'Template created successfully',
      };
    }),
  
  /**
   * Update existing template
   */
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      category: z.enum(["residential", "commercial", "land", "industrial", "agricultural"]).optional(),
      defaultAppealReason: z.string().optional(),
      suggestedDocuments: z.string().optional(),
      estimatedProcessingDays: z.number().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const { id, ...updates } = input;
      
      await db
        .update(appealTemplates)
        .set(updates)
        .where(eq(appealTemplates.id, id));
      
      return {
        success: true,
        message: 'Template updated successfully',
      };
    }),
  
  /**
   * Delete template (soft delete by setting isActive = 0)
   */
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db
        .update(appealTemplates)
        .set({ isActive: 0 })
        .where(eq(appealTemplates.id, input.id));
      
      return {
        success: true,
        message: 'Template deactivated successfully',
      };
    }),
  
  /**
   * Toggle template active status
   */
  toggleActive: publicProcedure
    .input(z.object({
      id: z.number(),
      isActive: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db
        .update(appealTemplates)
        .set({ isActive: input.isActive })
        .where(eq(appealTemplates.id, input.id));
      
      return {
        success: true,
        message: `Template ${input.isActive ? 'activated' : 'deactivated'} successfully`,
      };
    }),
});
