/**
 * Email Notification System for Appeal Status Changes
 * Sends automated emails to property owners when appeal status changes
 */

import { notifyOwner } from "./_core/notification";
import { getStatusChangeEmailHTML, getNewAppealEmailHTML } from "./emailTemplates";

interface AppealNotificationData {
  parcelId: string;
  previousStatus?: string;
  newStatus: string;
  appealDate: string;
  currentAssessedValue: number;
  appealedValue: number;
  ownerEmail?: string; // Property owner email (if available)
}

/**
 * Send email notification when appeal status changes
 */
export async function sendAppealStatusChangeEmail(data: AppealNotificationData): Promise<boolean> {
  const statusMessages = {
    pending: "Your appeal has been received and is pending review.",
    in_review: "Your appeal is now under review by our assessment team.",
    hearing_scheduled: "A hearing has been scheduled for your appeal.",
    resolved: "Your appeal has been resolved.",
    withdrawn: "Your appeal has been withdrawn.",
  };

  const statusMessage = statusMessages[data.newStatus as keyof typeof statusMessages] || "Your appeal status has been updated.";

  // Generate plain text content for project owner notification
  const plainTextContent = `
Property Tax Appeal Status Update

Parcel ID: ${data.parcelId}
Appeal Date: ${data.appealDate}
Current Assessed Value: $${data.currentAssessedValue.toLocaleString()}
Appealed Value: $${data.appealedValue.toLocaleString()}

Status Update: ${data.previousStatus ? `${data.previousStatus.toUpperCase()} → ` : ""}${data.newStatus.toUpperCase()}

${statusMessage}
  `;
  
  // Generate branded HTML email for property owner
  const htmlEmailContent = getStatusChangeEmailHTML({
    appealId: 0, // TODO: Pass actual appeal ID
    parcelId: data.parcelId,
    oldStatus: data.previousStatus || "new",
    newStatus: data.newStatus,
    ownerEmail: data.ownerEmail,
    currentAssessedValue: data.currentAssessedValue,
    appealedValue: data.appealedValue,
  });

  // Notify project owner (assessor/admin)
  const notified = await notifyOwner({
    title: `Appeal Status Change: ${data.parcelId}`,
    content: plainTextContent,
  });

  // Send email to property owner if email is provided
  // In production, integrate with email service like SendGrid, AWS SES, etc.
  if (data.ownerEmail) {
    console.log(`[EmailNotification] Sending email to property owner: ${data.ownerEmail}`);
    console.log(`[EmailNotification] HTML email generated (${htmlEmailContent.length} chars)`);
    // In production, send htmlEmailContent via email service
    // TODO: Integrate actual email service
    // await sendEmail({ to: data.ownerEmail, subject: `Appeal Status Update: ${data.parcelId}`, body: emailContent });
  }

  return notified;
}

/**
 * Send batch email notifications for multiple appeal status changes
 */
export async function sendBatchAppealNotifications(appeals: AppealNotificationData[]): Promise<number> {
  let successCount = 0;
  
  for (const appeal of appeals) {
    try {
      const sent = await sendAppealStatusChangeEmail(appeal);
      if (sent) successCount++;
    } catch (error) {
      console.error(`[EmailNotification] Failed to send notification for ${appeal.parcelId}:`, error);
    }
  }

  return successCount;
}

/**
 * Send reminder email for upcoming hearings or stale appeals
 */
export async function sendAppealReminderEmail(data: {
  type: "hearing_reminder" | "stale_appeal";
  parcelId: string;
  hearingDate?: string;
  ownerEmail: string;
  appealDate: string;
  currentAssessedValue: number;
  appealedValue: number;
}): Promise<boolean> {
  const subject = data.type === "hearing_reminder"
    ? `Reminder: Hearing Scheduled for Appeal ${data.parcelId}`
    : `Action Required: Appeal ${data.parcelId} Pending Review`;

  const message = data.type === "hearing_reminder"
    ? `Your property tax appeal hearing is scheduled for ${data.hearingDate}. Please ensure you have all necessary documentation prepared.`
    : `Your property tax appeal has been pending for over 30 days. Please contact the assessor's office for an update.`;

  const content = `
Property Tax Appeal Reminder

Parcel ID: ${data.parcelId}
Appeal Date: ${data.appealDate}
Current Assessed Value: $${data.currentAssessedValue.toLocaleString()}
Appealed Value: $${data.appealedValue.toLocaleString()}
${data.hearingDate ? `\nHearing Date: ${data.hearingDate}` : ""}

${message}
  `;

  console.log(`[EmailNotification] Sending ${data.type} reminder to: ${data.ownerEmail}`);
  console.log(`[EmailNotification] Subject: ${subject}`);
  
  // In production, send via email service
  // TODO: Integrate actual email service
  // await sendEmail({ to: data.ownerEmail, subject, body: content });

  return true;
}
