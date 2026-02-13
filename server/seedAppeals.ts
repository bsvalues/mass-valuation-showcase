/**
 * Seed Appeals Data
 * Populates the appeals table with realistic test data
 */

import { getDb } from "./db";
import { appeals } from "../drizzle/schema";

interface SeedAppeal {
  parcelId: string;
  appealDate: Date;
  currentAssessedValue: number;
  appealedValue: number;
  finalValue?: number;
  status: "pending" | "in_review" | "hearing_scheduled" | "resolved" | "withdrawn";
  appealReason: string;
  resolution?: string;
  countyName: string;
  filedBy?: number;
  assignedTo?: number;
  ownerEmail: string;
  hearingDate?: Date;
  resolutionDate?: Date;
}

const sampleAppeals: SeedAppeal[] = [
  // Pending Appeals (3)
  {
    parcelId: "123-456-789",
    appealDate: new Date("2026-01-15"),
    currentAssessedValue: 450000,
    appealedValue: 420000,
    status: "pending",
    appealReason: "Recent comparable sales in the neighborhood show lower values. Property at 123 Oak St sold for $415,000 with similar square footage.",
    countyName: "Benton County",
    ownerEmail: "john.smith@example.com",
  },
  {
    parcelId: "234-567-890",
    appealDate: new Date("2026-01-20"),
    currentAssessedValue: 325000,
    appealedValue: 290000,
    status: "pending",
    appealReason: "Property has significant foundation issues requiring $35,000 in repairs. Assessment does not reflect condition.",
    countyName: "Franklin County",
    ownerEmail: "sarah.johnson@example.com",
  },
  {
    parcelId: "345-678-901",
    appealDate: new Date("2026-02-01"),
    currentAssessedValue: 580000,
    appealedValue: 540000,
    status: "pending",
    appealReason: "Assessed value exceeds market value. Three recent sales within 0.5 miles averaged $535,000.",
    countyName: "Benton County",
    ownerEmail: "michael.davis@example.com",
  },

  // In Review (3)
  {
    parcelId: "456-789-012",
    appealDate: new Date("2026-01-10"),
    currentAssessedValue: 275000,
    appealedValue: 250000,
    status: "in_review",
    appealReason: "Property zoning changed from commercial to residential, reducing market value by approximately 10%.",
    countyName: "Walla Walla County",
    assignedTo: 1,
    ownerEmail: "emily.wilson@example.com",
  },
  {
    parcelId: "567-890-123",
    appealDate: new Date("2026-01-12"),
    currentAssessedValue: 410000,
    appealedValue: 385000,
    status: "in_review",
    appealReason: "Assessment includes finished basement, but basement flooded in 2025 and is no longer habitable.",
    countyName: "Benton County",
    assignedTo: 1,
    ownerEmail: "david.brown@example.com",
  },
  {
    parcelId: "678-901-234",
    appealDate: new Date("2026-01-18"),
    currentAssessedValue: 195000,
    appealedValue: 175000,
    status: "in_review",
    appealReason: "Property located adjacent to new industrial development, negatively impacting residential value.",
    countyName: "Franklin County",
    assignedTo: 1,
    ownerEmail: "jennifer.garcia@example.com",
  },

  // Hearing Scheduled (3)
  {
    parcelId: "789-012-345",
    appealDate: new Date("2025-12-15"),
    currentAssessedValue: 520000,
    appealedValue: 480000,
    status: "hearing_scheduled",
    appealReason: "Assessment based on incorrect square footage. County records show 2,800 sq ft, actual is 2,400 sq ft per recent appraisal.",
    countyName: "Benton County",
    assignedTo: 1,
    ownerEmail: "robert.martinez@example.com",
    hearingDate: new Date("2026-02-20"),
  },
  {
    parcelId: "890-123-456",
    appealDate: new Date("2025-12-20"),
    currentAssessedValue: 365000,
    appealedValue: 340000,
    status: "hearing_scheduled",
    appealReason: "Property has easement restrictions limiting buildable area. Assessment does not account for reduced usability.",
    countyName: "Walla Walla County",
    assignedTo: 1,
    ownerEmail: "lisa.anderson@example.com",
    hearingDate: new Date("2026-02-25"),
  },
  {
    parcelId: "901-234-567",
    appealDate: new Date("2025-12-28"),
    currentAssessedValue: 445000,
    appealedValue: 415000,
    status: "hearing_scheduled",
    appealReason: "Recent market downturn in neighborhood. Median sale price dropped 7% in Q4 2025.",
    countyName: "Franklin County",
    assignedTo: 1,
    ownerEmail: "william.thomas@example.com",
    hearingDate: new Date("2026-03-05"),
  },

  // Resolved (4)
  {
    parcelId: "012-345-678",
    appealDate: new Date("2025-11-10"),
    currentAssessedValue: 390000,
    appealedValue: 370000,
    finalValue: 375000,
    status: "resolved",
    appealReason: "Assessment higher than comparable properties. Requested reduction based on three comparable sales.",
    resolution: "Appeal partially approved. Assessment reduced to $375,000 based on comparable sales analysis. Property characteristics reviewed and adjusted for age and condition.",
    countyName: "Benton County",
    assignedTo: 1,
    ownerEmail: "mary.jackson@example.com",
    resolutionDate: new Date("2025-12-15"),
  },
  {
    parcelId: "123-456-780",
    appealDate: new Date("2025-11-15"),
    currentAssessedValue: 285000,
    appealedValue: 285000,
    finalValue: 285000,
    status: "resolved",
    appealReason: "Disputed assessment methodology. Requested review of cost approach calculations.",
    resolution: "Appeal denied. Assessment methodology reviewed and found to be consistent with IAAO standards. Current valuation upheld.",
    countyName: "Franklin County",
    assignedTo: 1,
    ownerEmail: "james.white@example.com",
    resolutionDate: new Date("2025-12-20"),
  },
  {
    parcelId: "234-567-891",
    appealDate: new Date("2025-11-20"),
    currentAssessedValue: 510000,
    appealedValue: 475000,
    finalValue: 490000,
    status: "resolved",
    appealReason: "Property has wetland restrictions on 30% of lot. Assessment does not reflect reduced buildable area.",
    resolution: "Appeal approved. Assessment reduced to $490,000 after verification of wetland designation and impact on property value.",
    countyName: "Walla Walla County",
    assignedTo: 1,
    ownerEmail: "patricia.harris@example.com",
    resolutionDate: new Date("2026-01-05"),
  },
  {
    parcelId: "345-678-902",
    appealDate: new Date("2025-11-25"),
    currentAssessedValue: 425000,
    appealedValue: 395000,
    finalValue: 410000,
    status: "resolved",
    appealReason: "Assessment includes upgrades that were never completed. Kitchen remodel shown in records was abandoned.",
    resolution: "Appeal partially approved. Assessment reduced to $410,000 after site inspection confirmed incomplete kitchen remodel.",
    countyName: "Benton County",
    assignedTo: 1,
    ownerEmail: "charles.martin@example.com",
    resolutionDate: new Date("2026-01-10"),
  },

  // Withdrawn (2)
  {
    parcelId: "456-789-013",
    appealDate: new Date("2025-12-05"),
    currentAssessedValue: 355000,
    appealedValue: 330000,
    status: "withdrawn",
    appealReason: "Assessment appears high based on initial research. Requesting review.",
    resolution: "Appeal withdrawn by property owner after receiving detailed assessment explanation.",
    countyName: "Franklin County",
    ownerEmail: "barbara.thompson@example.com",
    resolutionDate: new Date("2025-12-18"),
  },
  {
    parcelId: "567-890-124",
    appealDate: new Date("2025-12-10"),
    currentAssessedValue: 295000,
    appealedValue: 275000,
    status: "withdrawn",
    appealReason: "Believe assessment is too high. Requesting reduction.",
    resolution: "Appeal withdrawn. Property owner obtained independent appraisal confirming county assessment accuracy.",
    countyName: "Walla Walla County",
    ownerEmail: "richard.lopez@example.com",
    resolutionDate: new Date("2025-12-22"),
  },
];

/**
 * Seed the appeals table with sample data
 */
export async function seedAppealsData() {
  console.log("[Seed] Starting appeals data seeding...");

  try {
    // Check if appeals already exist
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const existingAppeals = await db.select().from(appeals).limit(1);
    
    if (existingAppeals.length > 0) {
      console.log("[Seed] Appeals table already contains data. Skipping seed.");
      return {
        success: true,
        message: "Appeals table already seeded",
        count: 0,
      };
    }

    // Insert sample appeals
    const insertedAppeals = await db.insert(appeals).values(sampleAppeals);

    console.log(`[Seed] Successfully seeded ${sampleAppeals.length} appeals`);

    return {
      success: true,
      message: `Successfully seeded ${sampleAppeals.length} appeals`,
      count: sampleAppeals.length,
    };
  } catch (error) {
    console.error("[Seed] Error seeding appeals data:", error);
    throw error;
  }
}

/**
 * Clear all appeals data (for testing)
 */
export async function clearAppealsData() {
  console.log("[Seed] Clearing appeals data...");

  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    await db.delete(appeals);
    console.log("[Seed] Appeals data cleared successfully");

    return {
      success: true,
      message: "Appeals data cleared successfully",
    };
  } catch (error) {
    console.error("[Seed] Error clearing appeals data:", error);
    throw error;
  }
}
