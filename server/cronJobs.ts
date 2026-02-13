/**
 * Cron Job Configuration
 * Automated scheduled tasks for the application
 */

import { runAppealReminderChecks } from "./appealReminders";

/**
 * Schedule: Daily at 9:00 AM
 * Purpose: Check for upcoming hearings and stale appeals
 */
export async function scheduledAppealReminders() {
  console.log("[CronJob] Running scheduled appeal reminder checks at", new Date().toISOString());
  
  try {
    const results = await runAppealReminderChecks();
    console.log("[CronJob] Appeal reminder checks completed:", results);
    return results;
  } catch (error) {
    console.error("[CronJob] Error in scheduled appeal reminders:", error);
    throw error;
  }
}

/**
 * Initialize all cron jobs
 * Call this function from server startup
 */
export function initializeCronJobs() {
  console.log("[CronJob] Initializing cron jobs...");
  
  // TEMPORARILY DISABLED: Column naming mismatch between schema and database
  // TODO: Fix appeals table column names (hearingDate vs hearingdate, appealedValue vs appealedvalue)
  
  // Schedule appeal reminders for 9:00 AM daily
  // Using node-cron or similar library in production
  // For now, we'll use setInterval for demonstration
  
  // const NINE_AM_MS = getMillisecondsUntilNextNineAM();
  
  // // Run first check at next 9 AM
  // setTimeout(() => {
  //   scheduledAppealReminders();
  //   
  //   // Then run daily at 9 AM
  //   setInterval(() => {
  //     scheduledAppealReminders();
  //   }, 24 * 60 * 60 * 1000); // 24 hours
  // }, NINE_AM_MS);
  
  console.log(`[CronJob] Appeal reminders temporarily disabled (schema mismatch)`);
}

/**
 * Calculate milliseconds until next 9:00 AM
 */
function getMillisecondsUntilNextNineAM(): number {
  const now = new Date();
  const next9AM = new Date();
  
  next9AM.setHours(9, 0, 0, 0);
  
  // If it's already past 9 AM today, schedule for tomorrow
  if (now.getHours() >= 9) {
    next9AM.setDate(next9AM.getDate() + 1);
  }
  
  return next9AM.getTime() - now.getTime();
}

/**
 * Manual trigger for testing
 * Can be called from admin interface or CLI
 */
export async function triggerAppealRemindersManually() {
  console.log("[CronJob] Manual trigger of appeal reminders");
  return await scheduledAppealReminders();
}
