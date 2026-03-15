import { createHash } from "crypto";
import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, parcels, InsertParcel, sales, InsertSale, auditLogs, InsertAuditLog, regressionModels, InsertRegressionModel, avmModels, InsertAVMModel } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Parcel queries
export async function createParcel(parcel: InsertParcel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(parcels).values(parcel);
  return result;
}

export async function getParcels(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (userId) {
    return await db.select().from(parcels).where(eq(parcels.uploadedBy, userId));
  }
  return await db.select().from(parcels);
}

export async function getParcelById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(parcels).where(eq(parcels.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function bulkCreateParcels(parcelList: InsertParcel[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Process in batches of 1000 to avoid overwhelming the database
  const batchSize = 1000;
  for (let i = 0; i < parcelList.length; i += batchSize) {
    const batch = parcelList.slice(i, i + batchSize);
    await db.insert(parcels).values(batch);
  }
}

export async function deleteAllParcels(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(parcels).where(eq(parcels.uploadedBy, userId));
}

// Sales queries
export async function createSale(sale: InsertSale) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sales).values(sale);
  return result;
}

export async function getSales(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (userId) {
    return await db.select().from(sales).where(eq(sales.uploadedBy, userId));
  }
  return await db.select().from(sales);
}

// ─── Chained Audit Hash Utility (Phase AF) ────────────────────────────────────
/**
 * Compute SHA-256(prevHash || action || timestamp || details).
 * Uses Node.js built-in `crypto` — server-side only.
 * Returns a 64-character hex string.
 */
function computeChainHash(
  prevHash: string | null,
  action: string,
  timestamp: Date,
  details: string | null | undefined
): string {
  const payload = [
    prevHash ?? "GENESIS",
    action,
    timestamp.toISOString(),
    details ?? "",
  ].join("|");
  return createHash("sha256").update(payload, "utf8").digest("hex");
}

// Audit log queries
export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Phase AF: Fetch the most recent chainHash to build the chain
  const [lastEntry] = await db
    .select({ chainHash: auditLogs.chainHash })
    .from(auditLogs)
    .orderBy(desc(auditLogs.id))
    .limit(1);

  const prevHash = lastEntry?.chainHash ?? null;
  const now = new Date();
  const chainHash = computeChainHash(prevHash, log.action, now, log.details ?? null);

  const result = await db.insert(auditLogs).values({
    ...log,
    chainHash,
    prevHash,
  });
  return result;
}

export async function getAuditLogs(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (userId) {
    return await db.select().from(auditLogs).where(eq(auditLogs.userId, userId));
  }
  return await db.select().from(auditLogs);
}

// Admin queries
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users);
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// Regression model queries
export async function saveRegressionModel(model: InsertRegressionModel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(regressionModels).values(model);
  return result[0].insertId;
}

export async function getRegressionModels(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(regressionModels).where(eq(regressionModels.createdBy, userId));
}

export async function deleteRegressionModel(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(regressionModels).where(eq(regressionModels.id, id));
}

// AVM model queries
export async function saveAVMModel(model: InsertAVMModel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(avmModels).values(model);
  return result[0].insertId;
}

export async function getAVMModels(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(avmModels).where(eq(avmModels.createdBy, userId));
}

export async function getAVMModelById(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const results = await db.select().from(avmModels).where(eq(avmModels.id, id));
  if (results.length === 0 || results[0].createdBy !== userId) {
    throw new Error("Model not found or access denied");
  }
  return results[0];
}

export async function updateAVMModelNotesTags(id: number, userId: number, notes: string | null, tags: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Verify ownership
  const results = await db.select().from(avmModels).where(eq(avmModels.id, id));
  if (results.length === 0 || results[0].createdBy !== userId) {
    throw new Error("Model not found or access denied");
  }
  await db.update(avmModels).set({ notes, tags }).where(eq(avmModels.id, id));
}

export async function deleteAVMModel(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(avmModels).where(eq(avmModels.id, id));
}
