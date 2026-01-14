import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("parcels API", () => {
  beforeEach(async () => {
    // Clean up test data before each test
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const parcels = await caller.parcels.list();
      // Note: In a real scenario, we'd delete test parcels here
      // For now, tests should use unique IDs or handle duplicates
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  it("creates a parcel successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Use timestamp to ensure unique test ID
    const uniqueId = `TEST-${Date.now()}`;

    const result = await caller.parcels.create({
      parcelId: uniqueId,
      address: "123 Test St",
      latitude: "40.7128",
      longitude: "-74.0060",
      totalValue: 500000,
      squareFeet: 2000,
      yearBuilt: 2020,
      propertyType: "Residential",
      neighborhood: "Test District",
    });

    expect(result).toEqual({ success: true });
  });

  it("lists parcels for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const parcels = await caller.parcels.list();

    expect(Array.isArray(parcels)).toBe(true);
  });
});

describe("auditLogs API", () => {
  it("lists audit logs for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const logs = await caller.auditLogs.list();

    expect(Array.isArray(logs)).toBe(true);
  });
});
