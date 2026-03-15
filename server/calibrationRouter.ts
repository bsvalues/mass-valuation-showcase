import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { calibrationSnapshots } from "../drizzle/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Zod schema for cost rates object
const CostRatesSchema = z.record(z.string(), z.number());

export const calibrationRouter = router({
  /**
   * List all calibration snapshots for the current user, optionally filtered by county.
   * Returns newest first. Includes costRates JSON and sequential version number.
   */
  list: protectedProcedure
    .input(
      z.object({
        countyName: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions = [eq(calibrationSnapshots.userId, ctx.user.id)];
      if (input?.countyName) {
        conditions.push(eq(calibrationSnapshots.countyName, input.countyName));
      }

      const rows = await db
        .select({
          id: calibrationSnapshots.id,
          name: calibrationSnapshots.name,
          description: calibrationSnapshots.description,
          countyName: calibrationSnapshots.countyName,
          costRates: calibrationSnapshots.costRates,
          snapshotMedianRatio: calibrationSnapshots.snapshotMedianRatio,
          snapshotCod: calibrationSnapshots.snapshotCod,
          snapshotPrd: calibrationSnapshots.snapshotPrd,
          isActive: calibrationSnapshots.isActive,
          createdAt: calibrationSnapshots.createdAt,
          updatedAt: calibrationSnapshots.updatedAt,
        })
        .from(calibrationSnapshots)
        .where(and(...conditions))
        .orderBy(desc(calibrationSnapshots.createdAt));

      // Assign sequential version numbers (oldest = v1, newest = vN)
      const total = rows.length;
      return rows.map((row, i) => {
        let parsedRates: Record<string, number> = {};
        try { parsedRates = JSON.parse(row.costRates as string); } catch { /* empty */ }
        return {
          ...row,
          costRates: parsedRates,
          version: total - i, // newest gets highest version number
        };
      });
    }),

  /**
   * Get the full details of a single snapshot (including cost rates JSON).
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [snapshot] = await db
        .select()
        .from(calibrationSnapshots)
        .where(
          and(
            eq(calibrationSnapshots.id, input.id),
            eq(calibrationSnapshots.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!snapshot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Calibration snapshot not found" });
      }

      let costRates: Record<string, number> = {};
      try { costRates = JSON.parse(snapshot.costRates as string); } catch { /* empty */ }

      return { ...snapshot, costRates };
    }),

  /**
   * Get the currently active snapshot for a county (the one that was last loaded).
   * Returns null if no active snapshot exists.
   */
  getActive: protectedProcedure
    .input(z.object({ countyName: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions = [
        eq(calibrationSnapshots.userId, ctx.user.id),
        eq(calibrationSnapshots.isActive, 1),
      ];
      if (input?.countyName) {
        conditions.push(eq(calibrationSnapshots.countyName, input.countyName));
      }

      const [snapshot] = await db
        .select()
        .from(calibrationSnapshots)
        .where(and(...conditions))
        .orderBy(desc(calibrationSnapshots.updatedAt))
        .limit(1);

      if (!snapshot) return null;

      let costRates: Record<string, number> = {};
      try { costRates = JSON.parse(snapshot.costRates as string); } catch { /* empty */ }

      // Compute version number: count all snapshots for this user+county up to and including this one
      const [{ value: totalCount }] = await db
        .select({ value: count() })
        .from(calibrationSnapshots)
        .where(
          and(
            eq(calibrationSnapshots.userId, ctx.user.id),
            ...(input?.countyName ? [eq(calibrationSnapshots.countyName, input.countyName)] : [])
          )
        );

      return { ...snapshot, costRates, version: totalCount };
    }),

  /**
   * Save a new calibration snapshot.
   * Returns the new snapshot id, name, and computed version number.
   */
  save: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        countyName: z.string().optional(),
        costRates: CostRatesSchema,
        landModelData: z.record(z.string(), z.unknown()).optional(),
        depreciationData: z.record(z.string(), z.unknown()).optional(),
        neighbourhoodModifiers: z.record(z.string(), z.unknown()).optional(),
        snapshotMedianRatio: z.number().optional(),
        snapshotCod: z.number().optional(),
        snapshotPrd: z.number().optional(),
        setAsActive: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      if (input.setAsActive) {
        const deactivateConditions = [eq(calibrationSnapshots.userId, ctx.user.id)];
        if (input.countyName) {
          deactivateConditions.push(eq(calibrationSnapshots.countyName, input.countyName));
        }
        await db
          .update(calibrationSnapshots)
          .set({ isActive: 0 })
          .where(and(...deactivateConditions));
      }

      const [result] = await db.insert(calibrationSnapshots).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description ?? null,
        countyName: input.countyName ?? null,
        costRates: JSON.stringify(input.costRates),
        landModelData: input.landModelData ? JSON.stringify(input.landModelData) : null,
        depreciationData: input.depreciationData ? JSON.stringify(input.depreciationData) : null,
        neighbourhoodModifiers: input.neighbourhoodModifiers ? JSON.stringify(input.neighbourhoodModifiers) : null,
        snapshotMedianRatio: input.snapshotMedianRatio ?? null,
        snapshotCod: input.snapshotCod ?? null,
        snapshotPrd: input.snapshotPrd ?? null,
        isActive: input.setAsActive ? 1 : 0,
      });

      // Count total snapshots for this user+county to derive version
      const countConditions = [eq(calibrationSnapshots.userId, ctx.user.id)];
      if (input.countyName) {
        countConditions.push(eq(calibrationSnapshots.countyName, input.countyName));
      }
      const [{ value: totalCount }] = await db
        .select({ value: count() })
        .from(calibrationSnapshots)
        .where(and(...countConditions));

      return {
        id: (result as any).insertId as number,
        name: input.name,
        version: totalCount,
        success: true,
      };
    }),

  /**
   * Update an existing snapshot's name, description, or cost rates.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        costRates: CostRatesSchema.optional(),
        snapshotMedianRatio: z.number().optional(),
        snapshotCod: z.number().optional(),
        snapshotPrd: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [existing] = await db
        .select({ id: calibrationSnapshots.id })
        .from(calibrationSnapshots)
        .where(
          and(
            eq(calibrationSnapshots.id, input.id),
            eq(calibrationSnapshots.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Snapshot not found or access denied" });
      }

      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.costRates !== undefined) updateData.costRates = JSON.stringify(input.costRates);
      if (input.snapshotMedianRatio !== undefined) updateData.snapshotMedianRatio = input.snapshotMedianRatio;
      if (input.snapshotCod !== undefined) updateData.snapshotCod = input.snapshotCod;
      if (input.snapshotPrd !== undefined) updateData.snapshotPrd = input.snapshotPrd;

      await db
        .update(calibrationSnapshots)
        .set(updateData as any)
        .where(eq(calibrationSnapshots.id, input.id));

      return { success: true };
    }),

  /**
   * Set a snapshot as the active one for its county (deactivates others).
   * Returns the snapshot name for toast messaging.
   */
  setActive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [snapshot] = await db
        .select({
          id: calibrationSnapshots.id,
          name: calibrationSnapshots.name,
          countyName: calibrationSnapshots.countyName,
        })
        .from(calibrationSnapshots)
        .where(
          and(
            eq(calibrationSnapshots.id, input.id),
            eq(calibrationSnapshots.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!snapshot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Snapshot not found or access denied" });
      }

      const deactivateConditions = [eq(calibrationSnapshots.userId, ctx.user.id)];
      if (snapshot.countyName) {
        deactivateConditions.push(eq(calibrationSnapshots.countyName, snapshot.countyName));
      }
      await db
        .update(calibrationSnapshots)
        .set({ isActive: 0 })
        .where(and(...deactivateConditions));

      await db
        .update(calibrationSnapshots)
        .set({ isActive: 1 })
        .where(eq(calibrationSnapshots.id, input.id));

      return { success: true, name: snapshot.name };
    }),

  /**
   * Delete a calibration snapshot.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [existing] = await db
        .select({ id: calibrationSnapshots.id })
        .from(calibrationSnapshots)
        .where(
          and(
            eq(calibrationSnapshots.id, input.id),
            eq(calibrationSnapshots.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Snapshot not found or access denied" });
      }

      await db
        .delete(calibrationSnapshots)
        .where(eq(calibrationSnapshots.id, input.id));

      return { success: true };
    }),

  /**
   * Phase AH: Roll back to a historical snapshot.
   * Creates a new snapshot cloned from the target (preserving the original),
   * names it "Rollback to: <original name>", and sets it as active.
   * Returns the new snapshot id and name.
   */
  rollback: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Fetch the target snapshot
      const [target] = await db
        .select()
        .from(calibrationSnapshots)
        .where(
          and(
            eq(calibrationSnapshots.id, input.id),
            eq(calibrationSnapshots.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Snapshot not found or access denied" });
      }

      // Deactivate all snapshots for this user+county
      const deactivateConditions = [eq(calibrationSnapshots.userId, ctx.user.id)];
      if (target.countyName) {
        deactivateConditions.push(eq(calibrationSnapshots.countyName, target.countyName));
      }
      await db
        .update(calibrationSnapshots)
        .set({ isActive: 0 })
        .where(and(...deactivateConditions));

      // Insert a new snapshot cloned from the target
      const rollbackName = `Rollback to: ${target.name}`;
      const result = await db.insert(calibrationSnapshots).values({
        userId: ctx.user.id,
        name: rollbackName,
        description: `Rolled back from snapshot "${target.name}" (id: ${target.id}) saved on ${new Date(target.createdAt).toLocaleDateString()}.`,
        countyName: target.countyName,
        costRates: target.costRates,
        landModelData: target.landModelData,
        depreciationData: target.depreciationData,
        neighbourhoodModifiers: target.neighbourhoodModifiers,
        snapshotMedianRatio: target.snapshotMedianRatio,
        snapshotCod: target.snapshotCod,
        snapshotPrd: target.snapshotPrd,
        isActive: 1,
      });

      return {
        success: true,
        newId: (result as any).insertId as number,
        name: rollbackName,
        originalName: target.name,
      };
    }),

  /**
   * Phase AH: Compare two snapshots side-by-side.
   * Returns both snapshots' cost rates and a computed diff array.
   */
  compare: protectedProcedure
    .input(z.object({ idA: z.number(), idB: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const snapshots = await db
        .select({
          id: calibrationSnapshots.id,
          name: calibrationSnapshots.name,
          description: calibrationSnapshots.description,
          countyName: calibrationSnapshots.countyName,
          costRates: calibrationSnapshots.costRates,
          snapshotMedianRatio: calibrationSnapshots.snapshotMedianRatio,
          snapshotCod: calibrationSnapshots.snapshotCod,
          snapshotPrd: calibrationSnapshots.snapshotPrd,
          isActive: calibrationSnapshots.isActive,
          createdAt: calibrationSnapshots.createdAt,
        })
        .from(calibrationSnapshots)
        .where(
          and(
            eq(calibrationSnapshots.userId, ctx.user.id)
          )
        );

      const a = snapshots.find(s => s.id === input.idA);
      const b = snapshots.find(s => s.id === input.idB);

      if (!a || !b) {
        throw new TRPCError({ code: "NOT_FOUND", message: "One or both snapshots not found" });
      }

      let ratesA: Record<string, number> = {};
      let ratesB: Record<string, number> = {};
      try { ratesA = JSON.parse(a.costRates as string); } catch { /* empty */ }
      try { ratesB = JSON.parse(b.costRates as string); } catch { /* empty */ }

      // Build unified key list
      const allKeys = Array.from(new Set([...Object.keys(ratesA), ...Object.keys(ratesB)]));

      const diff = allKeys.map(key => {
        const valA = ratesA[key] ?? null;
        const valB = ratesB[key] ?? null;
        const delta = valA !== null && valB !== null ? valB - valA : null;
        const pctChange = valA !== null && valB !== null && valA !== 0
          ? ((valB - valA) / valA) * 100
          : null;
        return {
          key,
          valA,
          valB,
          delta,
          pctChange,
          changed: valA !== valB,
        };
      });

      return {
        a: { ...a, costRates: ratesA },
        b: { ...b, costRates: ratesB },
        diff,
        changedCount: diff.filter(d => d.changed).length,
      };
    }),
});
