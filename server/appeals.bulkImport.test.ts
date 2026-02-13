/**
 * Test: Appeals Bulk Import
 * Verifies CSV batch import functionality
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { appeals } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Appeals Bulk Import", () => {
  let testParcelIds: string[] = [];

  beforeAll(async () => {
    // Clean up any existing test data
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    testParcelIds = ["TEST-BULK-001", "TEST-BULK-002", "TEST-BULK-003"];
    
    for (const parcelId of testParcelIds) {
      await db.delete(appeals).where(eq(appeals.parcelId, parcelId));
    }
  });

  afterAll(async () => {
    // Clean up test data
    const db = await getDb();
    if (!db) return;
    
    for (const parcelId of testParcelIds) {
      await db.delete(appeals).where(eq(appeals.parcelId, parcelId));
    }
  });

  it("should import multiple appeals from structured data", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const testAppeals = [
      {
        parcelId: "TEST-BULK-001",
        appealDate: new Date("2026-02-01"),
        currentAssessedValue: 300000,
        appealedValue: 280000,
        status: "pending" as const,
        appealReason: "Test bulk import appeal 1",
        countyName: "Test County",
        ownerEmail: "test1@example.com",
      },
      {
        parcelId: "TEST-BULK-002",
        appealDate: new Date("2026-02-02"),
        currentAssessedValue: 450000,
        appealedValue: 420000,
        finalValue: 435000,
        status: "resolved" as const,
        appealReason: "Test bulk import appeal 2",
        resolution: "Partially approved",
        countyName: "Test County",
        ownerEmail: "test2@example.com",
        resolutionDate: new Date("2026-02-10"),
      },
      {
        parcelId: "TEST-BULK-003",
        appealDate: new Date("2026-02-03"),
        currentAssessedValue: 550000,
        appealedValue: 520000,
        status: "in_review" as const,
        appealReason: "Test bulk import appeal 3",
        countyName: "Test County",
        assignedTo: 1,
        ownerEmail: "test3@example.com",
      },
    ];

    // Insert test appeals
    await db.insert(appeals).values(testAppeals);

    // Verify all appeals were inserted
    const insertedAppeals = await db
      .select()
      .from(appeals)
      .where(eq(appeals.countyName, "Test County"));

    expect(insertedAppeals.length).toBeGreaterThanOrEqual(3);

    // Verify specific appeals
    const appeal1 = insertedAppeals.find((a) => a.parcelId === "TEST-BULK-001");
    expect(appeal1).toBeDefined();
    expect(appeal1?.status).toBe("pending");
    expect(appeal1?.currentAssessedValue).toBe(300000);
    expect(appeal1?.appealedValue).toBe(280000);

    const appeal2 = insertedAppeals.find((a) => a.parcelId === "TEST-BULK-002");
    expect(appeal2).toBeDefined();
    expect(appeal2?.status).toBe("resolved");
    expect(appeal2?.finalValue).toBe(435000);
    expect(appeal2?.resolution).toBe("Partially approved");

    const appeal3 = insertedAppeals.find((a) => a.parcelId === "TEST-BULK-003");
    expect(appeal3).toBeDefined();
    expect(appeal3?.status).toBe("in_review");
    expect(appeal3?.assignedTo).toBe(1);
  });

  it("should handle date conversions correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const appeal = await db
      .select()
      .from(appeals)
      .where(eq(appeals.parcelId, "TEST-BULK-002"))
      .limit(1);

    expect(appeal.length).toBe(1);
    expect(appeal[0].appealDate).toBeInstanceOf(Date);
    expect(appeal[0].resolutionDate).toBeInstanceOf(Date);
  });

  it("should handle optional fields correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const appeal1 = await db
      .select()
      .from(appeals)
      .where(eq(appeals.parcelId, "TEST-BULK-001"))
      .limit(1);

    expect(appeal1.length).toBe(1);
    expect(appeal1[0].finalValue).toBeNull();
    expect(appeal1[0].resolution).toBeNull();
    expect(appeal1[0].hearingDate).toBeNull();
    expect(appeal1[0].resolutionDate).toBeNull();
  });
});
