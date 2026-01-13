import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

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
        return { success: true };
      }),
    deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
      await db.deleteAllParcels(ctx.user.id);
      await db.createAuditLog({
        userId: ctx.user.id,
        action: "DELETE_ALL_PARCELS",
        entityType: "parcel",
      });
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
