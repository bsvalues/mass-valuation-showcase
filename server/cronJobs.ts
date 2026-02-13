/**
 * Cron Job Configuration
 * Automated scheduled tasks for the application
 */

import { runAppealReminderChecks } from "./appealReminders";
// Temporarily disabled - import path issue
// import { sendMonthlyReport } from "../scripts/generate_monthly_reports.js";

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
 * Schedule: Monthly on 1st at midnight
 * Purpose: Generate and send monthly valuation reports
 */
export async function scheduledMonthlyReports() {
  console.log("[CronJob] Running scheduled monthly valuation report at", new Date().toISOString());
  
  try {
    // Temporarily disabled - import path issue
    // await sendMonthlyReport();
    console.log("[CronJob] Monthly valuation report skipped (not yet configured)");
  } catch (error) {
    console.error("[CronJob] Error in scheduled monthly reports:", error);
    throw error;
  }
}

/**
 * Initialize all cron jobs
 * Call this function from server startup
 */
export function initializeCronJobs() {
  console.log("[CronJob] Initializing cron jobs...");
  
  // Schedule appeal reminders for 9:00 AM daily
  const NINE_AM_MS = getMillisecondsUntilNextNineAM();
  
  // Run first check at next 9 AM
  setTimeout(() => {
    scheduledAppealReminders();
    
    // Then run daily at 9 AM
    setInterval(() => {
      scheduledAppealReminders();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }, NINE_AM_MS);
  
  const nextRun = new Date(Date.now() + NINE_AM_MS);
  console.log(`[CronJob] Appeal reminders scheduled for daily execution at 9:00 AM (next run: ${nextRun.toLocaleString()})`);
  
  // Monthly reports temporarily disabled - import path issue
  // const FIRST_OF_MONTH_MS = getMillisecondsUntilFirstOfMonth();
  // setTimeout(() => {
  //   scheduledMonthlyReports();
  //   setInterval(() => {
  //     scheduledMonthlyReports();
  //   }, 30 * 24 * 60 * 60 * 1000);
  // }, FIRST_OF_MONTH_MS);
  // const nextMonthlyRun = new Date(Date.now() + FIRST_OF_MONTH_MS);
  // console.log(`[CronJob] Monthly reports scheduled for 1st of each month at midnight (next run: ${nextMonthlyRun.toLocaleString()})`);
  console.log("[CronJob] Monthly reports not yet configured");
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
 * Calculate milliseconds until 1st of next month at midnight
 */
function getMillisecondsUntilFirstOfMonth(): number {
  const now = new Date();
  const firstOfNextMonth = new Date();
  
  // If we're on the 1st and it's before midnight, schedule for today
  if (now.getDate() === 1 && now.getHours() === 0 && now.getMinutes() === 0) {
    return 0;
  }
  
  // Otherwise, schedule for 1st of next month
  firstOfNextMonth.setMonth(firstOfNextMonth.getMonth() + 1);
  firstOfNextMonth.setDate(1);
  firstOfNextMonth.setHours(0, 0, 0, 0);
  
  return firstOfNextMonth.getTime() - now.getTime();
}

/**
 * Manual trigger for testing
 * Can be called from admin interface or CLI
 */
export async function triggerAppealRemindersManually() {
  console.log("[CronJob] Manual trigger of appeal reminders");
  return await scheduledAppealReminders();
}

export async function triggerMonthlyReportManually() {
  console.log("[CronJob] Manual trigger of monthly valuation report");
  return await scheduledMonthlyReports();
}
