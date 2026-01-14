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
