#!/usr/bin/env node
/**
 * Seed Appeals Data Script
 * Run with: node scripts/seedAppeals.mjs
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';

const sampleAppeals = [
  // Pending Appeals (3)
  {
    parcelId: "123-456-789",
    appealDate: "2026-01-15",
    currentAssessedValue: 450000,
    appealedValue: 420000,
    status: "pending",
    appealReason: "Recent comparable sales in the neighborhood show lower values. Property at 123 Oak St sold for $415,000 with similar square footage.",
    countyName: "Benton County",
    ownerEmail: "john.smith@example.com",
  },
  {
    parcelId: "234-567-890",
    appealDate: "2026-01-20",
    currentAssessedValue: 325000,
    appealedValue: 290000,
    status: "pending",
    appealReason: "Property has significant foundation issues requiring $35,000 in repairs. Assessment does not reflect condition.",
    countyName: "Franklin County",
    ownerEmail: "sarah.johnson@example.com",
  },
  {
    parcelId: "345-678-901",
    appealDate: "2026-02-01",
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
    appealDate: "2026-01-10",
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
    appealDate: "2026-01-12",
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
    appealDate: "2026-01-18",
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
    appealDate: "2025-12-15",
    currentAssessedValue: 520000,
    appealedValue: 480000,
    status: "hearing_scheduled",
    appealReason: "Assessment based on incorrect square footage. County records show 2,800 sq ft, actual is 2,400 sq ft per recent appraisal.",
    countyName: "Benton County",
    assignedTo: 1,
    ownerEmail: "robert.martinez@example.com",
    hearingDate: "2026-02-20",
  },
  {
    parcelId: "890-123-456",
    appealDate: "2025-12-20",
    currentAssessedValue: 365000,
    appealedValue: 340000,
    status: "hearing_scheduled",
    appealReason: "Property has easement restrictions limiting buildable area. Assessment does not account for reduced usability.",
    countyName: "Walla Walla County",
    assignedTo: 1,
    ownerEmail: "lisa.anderson@example.com",
    hearingDate: "2026-02-25",
  },
  {
    parcelId: "901-234-567",
    appealDate: "2025-12-28",
    currentAssessedValue: 445000,
    appealedValue: 415000,
    status: "hearing_scheduled",
    appealReason: "Recent market downturn in neighborhood. Median sale price dropped 7% in Q4 2025.",
    countyName: "Franklin County",
    assignedTo: 1,
    ownerEmail: "william.thomas@example.com",
    hearingDate: "2026-03-05",
  },

  // Resolved (4)
  {
    parcelId: "012-345-678",
    appealDate: "2025-11-10",
    currentAssessedValue: 390000,
    appealedValue: 370000,
    finalValue: 375000,
    status: "resolved",
    appealReason: "Assessment higher than comparable properties. Requested reduction based on three comparable sales.",
    resolution: "Appeal partially approved. Assessment reduced to $375,000 based on comparable sales analysis. Property characteristics reviewed and adjusted for age and condition.",
    countyName: "Benton County",
    assignedTo: 1,
    ownerEmail: "mary.jackson@example.com",
    resolutionDate: "2025-12-15",
  },
  {
    parcelId: "123-456-780",
    appealDate: "2025-11-15",
    currentAssessedValue: 285000,
    appealedValue: 285000,
    finalValue: 285000,
    status: "resolved",
    appealReason: "Disputed assessment methodology. Requested review of cost approach calculations.",
    resolution: "Appeal denied. Assessment methodology reviewed and found to be consistent with IAAO standards. Current valuation upheld.",
    countyName: "Franklin County",
    assignedTo: 1,
    ownerEmail: "james.white@example.com",
    resolutionDate: "2025-12-20",
  },
  {
    parcelId: "234-567-891",
    appealDate: "2025-11-20",
    currentAssessedValue: 510000,
    appealedValue: 475000,
    finalValue: 490000,
    status: "resolved",
    appealReason: "Property has wetland restrictions on 30% of lot. Assessment does not reflect reduced buildable area.",
    resolution: "Appeal approved. Assessment reduced to $490,000 after verification of wetland designation and impact on property value.",
    countyName: "Walla Walla County",
    assignedTo: 1,
    ownerEmail: "patricia.harris@example.com",
    resolutionDate: "2026-01-05",
  },
  {
    parcelId: "345-678-902",
    appealDate: "2025-11-25",
    currentAssessedValue: 425000,
    appealedValue: 395000,
    finalValue: 410000,
    status: "resolved",
    appealReason: "Assessment includes upgrades that were never completed. Kitchen remodel shown in records was abandoned.",
    resolution: "Appeal partially approved. Assessment reduced to $410,000 after site inspection confirmed incomplete kitchen remodel.",
    countyName: "Benton County",
    assignedTo: 1,
    ownerEmail: "charles.martin@example.com",
    resolutionDate: "2026-01-10",
  },

  // Withdrawn (2)
  {
    parcelId: "456-789-013",
    appealDate: "2025-12-05",
    currentAssessedValue: 355000,
    appealedValue: 330000,
    status: "withdrawn",
    appealReason: "Assessment appears high based on initial research. Requesting review.",
    resolution: "Appeal withdrawn by property owner after receiving detailed assessment explanation.",
    countyName: "Franklin County",
    ownerEmail: "barbara.thompson@example.com",
    resolutionDate: "2025-12-18",
  },
  {
    parcelId: "567-890-124",
    appealDate: "2025-12-10",
    currentAssessedValue: 295000,
    appealedValue: 275000,
    status: "withdrawn",
    appealReason: "Believe assessment is too high. Requesting reduction.",
    resolution: "Appeal withdrawn. Property owner obtained independent appraisal confirming county assessment accuracy.",
    countyName: "Walla Walla County",
    ownerEmail: "richard.lopez@example.com",
    resolutionDate: "2025-12-22",
  },
];

async function seedAppeals() {
  console.log("[Seed] Connecting to database...");
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Check if appeals already exist
    const [existingAppeals] = await connection.query('SELECT COUNT(*) as count FROM appeals');
    
    if (existingAppeals[0].count > 0) {
      console.log(`[Seed] Appeals table already contains ${existingAppeals[0].count} records. Skipping seed.`);
      return;
    }

    console.log("[Seed] Inserting sample appeals...");

    // Insert each appeal
    for (const appeal of sampleAppeals) {
      const query = `
        INSERT INTO appeals (
          parcelId, appealDate, currentAssessedValue, appealedValue, finalValue,
          status, appealReason, resolution, countyName, filedBy, assignedTo,
          ownerEmail, hearingDate, resolutionDate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        appeal.parcelId,
        appeal.appealDate,
        appeal.currentAssessedValue,
        appeal.appealedValue,
        appeal.finalValue || null,
        appeal.status,
        appeal.appealReason,
        appeal.resolution || null,
        appeal.countyName,
        appeal.filedBy || null,
        appeal.assignedTo || null,
        appeal.ownerEmail,
        appeal.hearingDate || null,
        appeal.resolutionDate || null,
      ];
      
      await connection.query(query, values);
    }

    console.log(`[Seed] Successfully seeded ${sampleAppeals.length} appeals`);
  } catch (error) {
    console.error("[Seed] Error seeding appeals:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedAppeals()
  .then(() => {
    console.log("[Seed] Seed script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[Seed] Seed script failed:", error);
    process.exit(1);
  });
