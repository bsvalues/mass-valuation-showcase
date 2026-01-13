import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, parcels, InsertParcel, sales, InsertSale, auditLogs, InsertAuditLog } from "../drizzle/schema";
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

// Audit log queries
export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(auditLogs).values(log);
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
