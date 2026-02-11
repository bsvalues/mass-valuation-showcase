import { index, int, longtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
 * Property History table - stores historical assessment values for properties
 */
export const propertyHistory = mysqlTable("propertyHistory", {
  id: int("id").autoincrement().primaryKey(),
  parcelId: int("parcelId").notNull(), // Foreign key to parcels.id
  assessmentYear: int("assessmentYear").notNull(),
  landValue: int("landValue"),
  buildingValue: int("buildingValue"),
  totalValue: int("totalValue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PropertyHistory = typeof propertyHistory.$inferSelect;
export type InsertPropertyHistory = typeof propertyHistory.$inferInsert;

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

/**
 * Batch jobs table - tracks batch AVM valuation operations
 */
export const batchJobs = mysqlTable("batchJobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  modelId: int("modelId"), // Optional: specific model to use, null = use default
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "cancelled"]).default("pending").notNull(),
  totalParcels: int("totalParcels").default(0),
  processedParcels: int("processedParcels").default(0),
  successfulParcels: int("successfulParcels").default(0),
  failedParcels: int("failedParcels").default(0),
  progress: int("progress").default(0), // Percentage 0-100
  errorSummary: text("errorSummary"),
  resultsUrl: text("resultsUrl"), // S3 URL to results CSV/Excel file
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
});

export type BatchJob = typeof batchJobs.$inferSelect;
export type InsertBatchJob = typeof batchJobs.$inferInsert;

/**
 * Batch results table - stores individual prediction results from batch jobs
 */
export const batchResults = mysqlTable("batchResults", {
  id: int("id").autoincrement().primaryKey(),
  batchJobId: int("batchJobId").notNull(),
  parcelId: varchar("parcelId", { length: 50 }).notNull(),
  predictedValue: int("predictedValue"),
  modelType: varchar("modelType", { length: 50 }), // 'randomForest' or 'neuralNetwork'
  features: text("features"), // JSON string of input features
  error: text("error"), // Error message if prediction failed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BatchResult = typeof batchResults.$inferSelect;
export type InsertBatchResult = typeof batchResults.$inferInsert;

/**
 * WA County Parcels table - stores parcel data from WA State Geo Portal
 */
export const waCountyParcels = mysqlTable("waCountyParcels", {
  id: int("id").autoincrement().primaryKey(),
  parcelId: varchar("parcelId", { length: 64 }).notNull(),
  countyName: varchar("countyName", { length: 100 }).notNull(),
  fipsCode: varchar("fipsCode", { length: 10 }),
  situsAddress: text("situsAddress"),
  situsCity: varchar("situsCity", { length: 100 }),
  situsZip: varchar("situsZip", { length: 10 }),
  valueLand: int("valueLand"),
  valueBuilding: int("valueBuilding"),
  geometry: text("geometry"), // GeoJSON geometry
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  parcelIdIdx: index("parcelid_idx").on(table.parcelId),
  countyNameIdx: index("countyname_idx").on(table.countyName),
  // Note: situsAddress is TEXT type, cannot be fully indexed in MySQL
  // For address search, we'll use LIKE queries which can use prefix indexes
}));

export type WACountyParcel = typeof waCountyParcels.$inferSelect;
export type InsertWACountyParcel = typeof waCountyParcels.$inferInsert;

/**
 * Background jobs table - tracks long-running parcel load operations
 */
export const backgroundJobs = mysqlTable("backgroundJobs", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  userId: int("userid").notNull(),
  jobType: mysqlEnum("jobtype", ["parcel_load"]).notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "paused"]).default("pending").notNull(),
  traceId: varchar("traceid", { length: 36 }), // For distributed tracing
  countyName: varchar("countyname", { length: 100 }),
  parcelLimit: int("parcellimit"),
  // Progress tracking
  total: int("total").default(0), // Total expected (e.g., 80000 parcels)
  processed: int("processed").default(0), // Total processed (succeeded + failed)
  succeeded: int("succeeded").default(0), // Successfully inserted/updated
  failed: int("failed").default(0), // Failed to process
  // Payload and results
  payloadJson: text("payloadjson"), // JSON with source params, options
  resultSummary: text("resultsummary"), // JSON with parcel count, bounds, etc.
  errorSummary: text("errorsummary"), // Aggregated error messages
  // Timestamps
  createdAt: timestamp("createdat").defaultNow().notNull(),
  startedAt: timestamp("startedat"),
  completedAt: timestamp("completedat"),
});

export type BackgroundJob = typeof backgroundJobs.$inferSelect;
export type InsertBackgroundJob = typeof backgroundJobs.$inferInsert;

/**
 * Job events table - append-only audit trail for job progress and errors
 */
export const jobEvents = mysqlTable("jobEvents", {
  id: int("id").autoincrement().primaryKey(),
  jobId: varchar("jobId", { length: 36 }).notNull(),
  eventType: mysqlEnum("eventType", ["started", "progress", "error", "completed", "failed", "paused"]).notNull(),
  message: text("message"),
  metadata: text("metadata"), // JSON with chunk info, error details, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JobEvent = typeof jobEvents.$inferSelect;
export type InsertJobEvent = typeof jobEvents.$inferInsert;

/**
 * Job errors table - durable error log for failed parcel processing
 */
export const jobErrors = mysqlTable("jobErrors", {
  id: int("id").autoincrement().primaryKey(),
  jobId: varchar("jobId", { length: 36 }).notNull(),
  rowNumber: int("rowNumber"),
  parcelId: varchar("parcelId", { length: 100 }),
  errorMessage: text("errorMessage").notNull(),
  rawJson: text("rawJson"), // Original parcel data that failed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JobError = typeof jobErrors.$inferSelect;
export type InsertJobError = typeof jobErrors.$inferInsert;

/**
 * County statistics table - aggregated data for WA counties
 */
export const countyStatistics = mysqlTable("countyStatistics", {
  id: int("id").autoincrement().primaryKey(),
  countyName: varchar("countyName", { length: 100 }).notNull().unique(),
  parcelCount: int("parcelCount").default(0),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  avgLandValue: int("avgLandValue"),
  avgBuildingValue: int("avgBuildingValue"),
  totalAssessedValue: varchar("totalAssessedValue", { length: 20 }), // Store as string to avoid bigint issues
  minLandValue: int("minLandValue"),
  maxLandValue: int("maxLandValue"),
  minBuildingValue: int("minBuildingValue"),
  maxBuildingValue: int("maxBuildingValue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CountyStatistic = typeof countyStatistics.$inferSelect;
export type InsertCountyStatistic = typeof countyStatistics.$inferInsert;
