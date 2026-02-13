/**
 * Resolution Templates tRPC Router
 * Manages pre-written templates for common appeal outcomes
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { resolutionTemplates } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const resolutionTemplatesRouter = router({
  /**
   * Get all resolution templates
   */
  list: publicProcedure
    .input(z.object({
      category: z.enum(["approved", "denied", "partially_approved", "withdrawn"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      let query = db.select().from(resolutionTemplates);
      
      if (input?.category) {
        query = query.where(eq(resolutionTemplates.category, input.category)) as any;
      }
      
      const results = await query.orderBy(desc(resolutionTemplates.createdAt));
      return results;
    }),

  /**
   * Get single template by ID
   */
  getById: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const template = await db.select()
        .from(resolutionTemplates)
        .where(eq(resolutionTemplates.id, input.id))
        .limit(1);
      
      return template[0] || null;
    }),

  /**
   * Create new resolution template
   */
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      category: z.enum(["approved", "denied", "partially_approved", "withdrawn"]),
      templateText: z.string(),
      variables: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const result = await db.insert(resolutionTemplates).values({
        name: input.name,
        category: input.category,
        templateText: input.templateText,
        variables: input.variables ? JSON.stringify(input.variables) : undefined,
        createdBy: undefined, // TODO: Get from authenticated user context
      });
      
      return {
        success: true,
      };
    }),

  /**
   * Update existing template
   */
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      category: z.enum(["approved", "denied", "partially_approved", "withdrawn"]).optional(),
      templateText: z.string().optional(),
      variables: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const { id, ...updates } = input;
      
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.category) updateData.category = updates.category;
      if (updates.templateText) updateData.templateText = updates.templateText;
      if (updates.variables) updateData.variables = JSON.stringify(updates.variables);
      
      await db.update(resolutionTemplates).set(updateData).where(eq(resolutionTemplates.id, id));
      
      return {
        success: true,
      };
    }),

  /**
   * Delete template
   */
  delete: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.delete(resolutionTemplates).where(eq(resolutionTemplates.id, input.id) as any);
      
      return {
        success: true,
      };
    }),

  /**
   * Apply template to appeal (replace variables with actual values)
   */
  applyTemplate: publicProcedure
    .input(z.object({
      templateId: z.number(),
      variables: z.record(z.string(), z.string()), // Map of variable names to values
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const template = await db.select()
        .from(resolutionTemplates)
        .where(eq(resolutionTemplates.id, input.templateId))
        .limit(1);
      
      if (!template[0]) {
        throw new Error('Template not found');
      }
      
      let resolvedText = template[0].templateText;
      
      // Replace variables in template text
      for (const [varName, varValue] of Object.entries(input.variables)) {
        const regex = new RegExp(`{{${varName}}}`, 'g');
        resolvedText = resolvedText.replace(regex, String(varValue));
      }
      
      return {
        resolvedText,
        category: template[0].category,
      };
    }),
});
