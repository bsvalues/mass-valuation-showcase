import { int, longtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Parcels table - stores property/parcel data
 */
export const parcels = mysqlTable("parcels", {
  id: int("id").autoincrement().primaryKey(),
  parcelId: varchar("parcelId", { length: 64 }).notNull().unique(),
  address: text("address"),
  latitude: varchar("latitude", { length: 32 }),
  longitude: varchar("longitude", { length: 32 }),
  landValue: int("landValue"),
  buildingValue: int("buildingValue"),
  totalValue: int("totalValue"),
  squareFeet: int("squareFeet"),
  yearBuilt: int("yearBuilt"),
  propertyType: varchar("propertyType", { length: 64 }),
  neighborhood: varchar("neighborhood", { length: 128 }),
  cluster: int("cluster"),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Parcel = typeof parcels.$inferSelect;
export type InsertParcel = typeof parcels.$inferInsert;

/**
 * Sales table - stores comparable sales data
 */
export const sales = mysqlTable("sales", {
  id: int("id").autoincrement().primaryKey(),
  parcelId: varchar("parcelId", { length: 64 }).notNull(),
  saleDate: timestamp("saleDate").notNull(),
  salePrice: int("salePrice").notNull(),
  squareFeet: int("squareFeet"),
  yearBuilt: int("yearBuilt"),
  propertyType: varchar("propertyType", { length: 64 }),
  neighborhood: varchar("neighborhood", { length: 128 }),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

/**
 * Audit logs table - immutable record of all system actions
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  entityType: varchar("entityType", { length: 64 }),
  entityId: varchar("entityId", { length: 64 }),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Regression models table - stores saved regression analysis models
 */
export const regressionModels = mysqlTable("regressionModels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  dependentVariable: varchar("dependentVariable", { length: 64 }).notNull(),
  independentVariables: text("independentVariables").notNull(), // JSON array of variable names
  coefficients: text("coefficients").notNull(), // JSON object with coefficients
  rSquared: varchar("rSquared", { length: 32 }),
  adjustedRSquared: varchar("adjustedRSquared", { length: 32 }),
  fStatistic: varchar("fStatistic", { length: 32 }),
  fPValue: varchar("fPValue", { length: 32 }),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RegressionModel = typeof regressionModels.$inferSelect;
export type InsertRegressionModel = typeof regressionModels.$inferInsert;

/**
 * AVM models table - stores saved machine learning valuation models
 */
export const avmModels = mysqlTable("avmModels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  modelType: mysqlEnum("modelType", ["randomForest", "neuralNetwork"]).notNull(),
  serializedModel: longtext("serializedModel").notNull(), // JSON serialized model
  featureStats: text("featureStats").notNull(), // JSON feature normalization stats
  targetStats: text("targetStats").notNull(), // JSON target normalization stats
  // Performance metrics
  mae: varchar("mae", { length: 32 }),
  rmse: varchar("rmse", { length: 32 }),
  r2: varchar("r2", { length: 32 }),
  mape: varchar("mape", { length: 32 }),
  trainingTime: int("trainingTime"), // milliseconds
  trainingDataSize: int("trainingDataSize"), // number of parcels used
  notes: text("notes"), // User notes/description
  tags: varchar("tags", { length: 512 }), // Comma-separated tags
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AVMModel = typeof avmModels.$inferSelect;
export type InsertAVMModel = typeof avmModels.$inferInsert;

/**
 * Import jobs table - tracks file upload and processing status
 */
export const importJobs = mysqlTable("importJobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileFormat: varchar("fileFormat", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "partial"]).default("pending").notNull(),
  totalRecords: int("totalRecords").default(0),
  successfulRecords: int("successfulRecords").default(0),
  failedRecords: int("failedRecords").default(0),
  errorSummary: text("errorSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type ImportJob = typeof importJobs.$inferSelect;
export type InsertImportJob = typeof importJobs.$inferInsert;

/**
 * Import errors table - logs validation and parsing errors for failed records
 */
export const importErrors = mysqlTable("importErrors", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  rowNumber: int("rowNumber").notNull(),
  errorMessage: text("errorMessage").notNull(),
  rawData: text("rawData"), // JSON string of the raw record
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ImportError = typeof importErrors.$inferSelect;
export type InsertImportError = typeof importErrors.$inferInsert;

/**
 * Import templates table - stores reusable column mapping templates
 */
export const importTemplates = mysqlTable("importTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  mapping: text("mapping").notNull(), // JSON string of column mapping
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ImportTemplate = typeof importTemplates.$inferSelect;
export type InsertImportTemplate = typeof importTemplates.$inferInsert;
