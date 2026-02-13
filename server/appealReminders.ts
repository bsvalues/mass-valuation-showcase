/**
 * Appeal Reminder System
 * Automated email notifications for:
 * - Hearings scheduled within 7 days
 * - Appeals pending for more than 30 days
 */

import { getDb } from "./db";
import { appeals } from "../drizzle/schema";
import { and, eq, lte, gte, sql } from "drizzle-orm";
import { sendAppealReminderEmail } from "./emailNotifications";
import { notifyOwner } from "./_core/notification";

/**
 * Check for upcoming hearings (within 7 days) and send reminders
 */
export async function sendHearingReminders() {
  const db = await getDb();
  if (!db) {
    console.error("[AppealReminders] Database not available");
    return { sent: 0, errors: 0 };
  }

  try {
    // Find appeals with hearings in the next 7 days
    const upcomingHearings = await db.select()
      .from(appeals)
      .where(and(
        eq(appeals.status, "hearing_scheduled"),
        sql`${appeals.hearingDate} BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`,
        sql`${appeals.ownerEmail} IS NOT NULL`
      ));

    let sent = 0;
    let errors = 0;

    for (const appeal of upcomingHearings) {
      try {
        if (appeal.ownerEmail) {
          await sendAppealReminderEmail({
            type: "hearing_reminder",
            parcelId: appeal.parcelId,
            hearingDate: appeal.hearingDate?.toString() || "",
            ownerEmail: appeal.ownerEmail,
            appealDate: appeal.appealDate.toString(),
            currentAssessedValue: appeal.currentAssessedValue,
            appealedValue: appeal.appealedValue,
          });
          sent++;
        }
      } catch (error) {
        console.error(`[AppealReminders] Error sending hearing reminder for appeal ${appeal.id}:`, error);
        errors++;
      }
    }

    console.log(`[AppealReminders] Hearing reminders sent: ${sent}, errors: ${errors}`);
    return { sent, errors };
  } catch (error) {
    console.error("[AppealReminders] Error in sendHearingReminders:", error);
    return { sent: 0, errors: 1 };
  }
}

/**
 * Check for stale appeals (pending > 30 days) and send notifications
 */
export async function sendStaleAppealNotifications() {
  const db = await getDb();
  if (!db) {
    console.error("[AppealReminders] Database not available");
    return { sent: 0, errors: 0 };
  }

  try {
    // Find appeals pending for more than 30 days
    const staleAppeals = await db.select()
      .from(appeals)
      .where(and(
        eq(appeals.status, "pending"),
        sql`DATEDIFF(CURDATE(), ${appeals.appealDate}) > 30`
      ));

    if (staleAppeals.length > 0) {
      // Notify owner about stale appeals
      await notifyOwner({
        title: `${staleAppeals.length} Stale Appeals Require Attention`,
        content: `There are ${staleAppeals.length} appeals that have been pending for more than 30 days. Please review and take action.\n\nParcel IDs: ${staleAppeals.map(a => a.parcelId).join(", ")}`,
      });

      console.log(`[AppealReminders] Stale appeal notification sent for ${staleAppeals.length} appeals`);
      return { sent: 1, errors: 0 };
    }

    return { sent: 0, errors: 0 };
  } catch (error) {
    console.error("[AppealReminders] Error in sendStaleAppealNotifications:", error);
    return { sent: 0, errors: 1 };
  }
}

/**
 * Run all reminder checks
 * This function should be called by a cron job or scheduler
 */
export async function runAppealReminderChecks() {
  console.log("[AppealReminders] Running reminder checks...");
  
  const hearingResults = await sendHearingReminders();
  const staleResults = await sendStaleAppealNotifications();

  const totalSent = hearingResults.sent + staleResults.sent;
  const totalErrors = hearingResults.errors + staleResults.errors;

  console.log(`[AppealReminders] Reminder checks complete. Sent: ${totalSent}, Errors: ${totalErrors}`);
  
  return {
    hearingReminders: hearingResults,
    staleNotifications: staleResults,
    totalSent,
    totalErrors,
  };
}
