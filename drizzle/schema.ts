import { date, float, index, int, longtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  parcelNumber: varchar("parcelNumber", { length: 128 }),
  address: text("address"),
  situsAddress: text("situsAddress"),
  latitude: varchar("latitude", { length: 32 }),
  longitude: varchar("longitude", { length: 32 }),
  xCoord: float("xCoord"), // State Plane X coordinate
  yCoord: float("yCoord"), // State Plane Y coordinate
  landValue: int("landValue"),
  buildingValue: int("buildingValue"),
  totalValue: int("totalValue"),
  assessedLandValue: int("assessedLandValue"),
  assessedImprovementValue: int("assessedImprovementValue"),
  totalAssessedValue: int("totalAssessedValue"),
  squareFeet: int("squareFeet"),
  basementSqFt: int("basementSqFt"),
  yearBuilt: int("yearBuilt"),
  age: int("age"),
  bedrooms: int("bedrooms"),
  style: varchar("style", { length: 128 }),
  propertyType: varchar("propertyType", { length: 64 }),
  propertyTypeDesc: varchar("propertyTypeDesc", { length: 256 }),
  neighborhood: varchar("neighborhood", { length: 128 }),
  county: varchar("county", { length: 64 }),
  acres: float("acres"),
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
 * Sales table - stores property sales transactions for ratio studies and comparable sales analysis
 */
export const sales = mysqlTable("sales", {
  id: int("id").autoincrement().primaryKey(),
  parcelId: varchar("parcelId", { length: 64 }).notNull(),
  saleDate: date("saleDate").notNull(),
  salePrice: int("salePrice").notNull(),
  assessedValue: int("assessedValue").notNull(), // Assessed value at time of sale
  propertyType: varchar("propertyType", { length: 64 }),
  situsAddress: text("situsAddress"),
  countyName: varchar("countyName", { length: 100 }),
  neighborhood: varchar("neighborhood", { length: 128 }),
  squareFeet: int("squareFeet"),
  yearBuilt: int("yearBuilt"),
  bedrooms: int("bedrooms"),
  bathrooms: int("bathrooms"),
  // Ratio study fields
  assessedToSaleRatio: varchar("assessedToSaleRatio", { length: 20 }), // Calculated ratio (assessed/sale)
  // Flags for data quality
  isArmLength: int("isArmLength").default(1), // 1 = arm's length, 0 = non-arm's length
  isQualified: int("isQualified").default(1), // 1 = qualified for ratio study, 0 = excluded
  exclusionReason: text("exclusionReason"),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  parcelIdIdx: index("sale_parcelid_idx").on(table.parcelId),
  saleDateIdx: index("sale_date_idx").on(table.saleDate),
  countyNameIdx: index("sale_county_idx").on(table.countyName),
}));

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
  propertyType: varchar("propertyType", { length: 64 }), // residential, commercial, industrial, agricultural
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
  userId: int("userId").notNull(),
  jobType: mysqlEnum("jobType", ["parcel_load"]).notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "paused"]).default("pending").notNull(),
  traceId: varchar("traceId", { length: 36 }), // For distributed tracing
  countyName: varchar("countyName", { length: 100 }),
  parcelLimit: int("parcelLimit"),
  // Progress tracking
  total: int("total").default(0), // Total expected (e.g., 80000 parcels)
  processed: int("processed").default(0), // Total processed (succeeded + failed)
  succeeded: int("succeeded").default(0), // Successfully inserted/updated
  failed: int("failed").default(0), // Failed to process
  // Payload and results
  payloadJson: text("payloadJson"), // JSON with source params, options
  resultSummary: text("resultSummary"), // JSON with parcel count, bounds, etc.
  errorSummary: text("errorSummary"), // Aggregated error messages
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
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



/**
 * Appeals table - tracks property tax appeals
 */
export const appeals = mysqlTable("appeals", {
  id: int("id").autoincrement().primaryKey(),
  parcelId: varchar("parcelId", { length: 64 }).notNull(),
  appealDate: date("appealDate").notNull(),
  currentAssessedValue: int("currentAssessedValue").notNull(),
  appealedValue: int("appealedValue").notNull(), // Value requested by taxpayer
  finalValue: int("finalValue"), // Final determined value (if resolved)
  status: mysqlEnum("status", ["pending", "in_review", "hearing_scheduled", "resolved", "withdrawn"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  appealReason: text("appealReason"),
  resolution: text("resolution"),
  countyName: varchar("countyName", { length: 100 }),
  filedBy: int("filedBy"), // User ID who filed the appeal
  assignedTo: int("assignedTo"), // User ID assigned to review
  ownerEmail: varchar("ownerEmail", { length: 255 }), // Property owner email for notifications
  hearingDate: date("hearingDate"),
  resolutionDate: date("resolutionDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  parcelIdIdx: index("appeal_parcelid_idx").on(table.parcelId),
  statusIdx: index("appeal_status_idx").on(table.status),
  appealDateIdx: index("appeal_date_idx").on(table.appealDate),
}));

export type Appeal = typeof appeals.$inferSelect;
export type InsertAppeal = typeof appeals.$inferInsert;

/**
 * Appeal Timeline table - tracks status changes and actions on appeals
 */
export const appealTimeline = mysqlTable("appealTimeline", {
  id: int("id").autoincrement().primaryKey(),
  appealId: int("appealId").notNull(),
  previousStatus: mysqlEnum("previousStatus", ["pending", "in_review", "hearing_scheduled", "resolved", "withdrawn"]),
  newStatus: mysqlEnum("newStatus", ["pending", "in_review", "hearing_scheduled", "resolved", "withdrawn"]).notNull(),
  action: varchar("action", { length: 255 }).notNull(), // e.g., "Status changed", "Hearing scheduled", "Documents uploaded"
  notes: text("notes"),
  performedBy: int("performedBy"), // User ID who performed the action
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  appealIdIdx: index("timeline_appealid_idx").on(table.appealId),
  createdAtIdx: index("timeline_createdat_idx").on(table.createdAt),
}));

export type AppealTimeline = typeof appealTimeline.$inferSelect;
export type InsertAppealTimeline = typeof appealTimeline.$inferInsert;

/**
 * Appeal Comments table - tracks notes and communications on appeals
 */
export const appealComments = mysqlTable("appealComments", {
  id: int("id").autoincrement().primaryKey(),
  appealId: int("appealId").notNull(),
  commentType: mysqlEnum("commentType", ["internal", "owner_communication"]).default("internal").notNull(),
  content: text("content").notNull(),
  authorId: int("authorId").notNull(), // User ID who wrote the comment
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  appealIdIdx: index("comment_appealid_idx").on(table.appealId),
  createdAtIdx: index("comment_createdat_idx").on(table.createdAt),
}));

export type AppealComment = typeof appealComments.$inferSelect;
export type InsertAppealComment = typeof appealComments.$inferInsert;

/**
 * Appeal Documents table - tracks uploaded files for appeals
 */
export const appealDocuments = mysqlTable("appealDocuments", {
  id: int("id").autoincrement().primaryKey(),
  appealId: int("appealId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull(), // Size in bytes
  fileType: varchar("fileType", { length: 100 }).notNull(), // MIME type
  fileKey: varchar("fileKey", { length: 512 }).notNull(), // S3 key
  fileUrl: varchar("fileUrl", { length: 1024 }).notNull(), // S3 URL
  uploadedBy: int("uploadedBy").notNull(), // User ID who uploaded
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  appealIdIdx: index("document_appealid_idx").on(table.appealId),
  createdAtIdx: index("document_createdat_idx").on(table.createdAt),
}));

export type AppealDocument = typeof appealDocuments.$inferSelect;
export type InsertAppealDocument = typeof appealDocuments.$inferInsert;

/**
 * Resolution Templates table - pre-written templates for common appeal outcomes
 */
export const resolutionTemplates = mysqlTable("resolutionTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["approved", "denied", "partially_approved", "withdrawn"]).notNull(),
  templateText: text("templateText").notNull(),
  variables: text("variables"), // JSON array of variable names like ["parcelId", "ownerName", "adjustedValue"]
  createdBy: int("createdBy"), // User ID who created the template
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("template_category_idx").on(table.category),
}));

export type ResolutionTemplate = typeof resolutionTemplates.$inferSelect;
export type InsertResolutionTemplate = typeof resolutionTemplates.$inferInsert;

/**
 * ML Predictions table - tracks all property valuation predictions
 */
export const predictions = mysqlTable("predictions", {
  id: int("id").autoincrement().primaryKey(),
  parcelId: varchar("parcelId", { length: 64 }),
  squareFeet: int("squareFeet").notNull(),
  yearBuilt: int("yearBuilt").notNull(),
  bedrooms: int("bedrooms").notNull(),
  propertyType: varchar("propertyType", { length: 50 }).notNull(),
  basementSqFt: int("basementSqFt"),
  acres: float("acres"),
  predictedValue: int("predictedValue").notNull(),
  modelVersion: varchar("modelVersion", { length: 50 }),
  userId: int("userId"), // User who requested the prediction
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  parcelIdIdx: index("prediction_parcelid_idx").on(table.parcelId),
  userIdIdx: index("prediction_userid_idx").on(table.userId),
  createdAtIdx: index("prediction_createdat_idx").on(table.createdAt),
}));

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;


/**
 * Appeal Templates table - pre-defined templates for common appeal scenarios
 */
export const appealTemplates = mysqlTable("appealTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Residential Overvaluation"
  description: text("description"), // Detailed description of when to use this template
  category: mysqlEnum("category", ["residential", "commercial", "land", "industrial", "agricultural"]).notNull(),
  defaultAppealReason: text("defaultAppealReason"), // Pre-filled appeal reason text
  suggestedDocuments: text("suggestedDocuments"), // JSON array of suggested document types
  estimatedProcessingDays: int("estimatedProcessingDays"), // Typical processing time
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = inactive
  createdBy: int("createdBy"), // User ID who created the template
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("template_category_idx").on(table.category),
  isActiveIdx: index("template_isactive_idx").on(table.isActive),
}));

export type AppealTemplate = typeof appealTemplates.$inferSelect;
export type InsertAppealTemplate = typeof appealTemplates.$inferInsert;


/**
 * Batch Valuation Jobs table - tracks mass valuation processing jobs
 */
export const batchValuationJobs = mysqlTable("batchValuationJobs", {
  id: int("id").autoincrement().primaryKey(),
  jobName: varchar("jobName", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "cancelled"]).notNull().default("pending"),
  totalParcels: int("totalParcels").notNull(),
  completedParcels: int("completedParcels").notNull().default(0),
  failedParcels: int("failedParcels").notNull().default(0),
  progress: int("progress").notNull().default(0), // Percentage 0-100
  modelVersion: varchar("modelVersion", { length: 50 }),
  filterCriteria: text("filterCriteria"), // JSON string of filter params used
  errorLog: text("errorLog"), // JSON array of error messages
  userId: int("userId").notNull(), // User who created the job
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  statusIdx: index("batchjob_status_idx").on(table.status),
  userIdIdx: index("batchjob_userid_idx").on(table.userId),
  createdAtIdx: index("batchjob_createdat_idx").on(table.createdAt),
}));

export type BatchValuationJob = typeof batchValuationJobs.$inferSelect;
export type InsertBatchValuationJob = typeof batchValuationJobs.$inferInsert;

/**
 * Batch Valuation Results table - stores individual prediction results from batch jobs
 */
export const batchValuationResults = mysqlTable("batchValuationResults", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(), // Foreign key to batchValuationJobs
  parcelId: varchar("parcelId", { length: 64 }).notNull(),
  predictedValue: int("predictedValue").notNull(),
  confidence: float("confidence"), // Confidence interval or score
  actualValue: int("actualValue"), // Current assessed value for comparison
  valueDifference: int("valueDifference"), // predictedValue - actualValue
  percentDifference: float("percentDifference"), // (valueDifference / actualValue) * 100
  propertyType: varchar("propertyType", { length: 50 }),
  squareFeet: int("squareFeet"),
  yearBuilt: int("yearBuilt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("batchresult_jobid_idx").on(table.jobId),
  parcelIdIdx: index("batchresult_parcelid_idx").on(table.parcelId),
}));

export type BatchValuationResult = typeof batchValuationResults.$inferSelect;
export type InsertBatchValuationResult = typeof batchValuationResults.$inferInsert;
