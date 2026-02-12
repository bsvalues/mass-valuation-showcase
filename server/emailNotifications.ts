/**
 * Email Notification System for Appeal Status Changes
 * Sends automated emails to property owners when appeal status changes
 */

import { notifyOwner } from "./_core/notification";

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

  const emailContent = `
Property Tax Appeal Status Update

Parcel ID: ${data.parcelId}
Appeal Date: ${data.appealDate}
Current Assessed Value: $${data.currentAssessedValue.toLocaleString()}
Appealed Value: $${data.appealedValue.toLocaleString()}

Status Update: ${data.previousStatus ? `${data.previousStatus.toUpperCase()} → ` : ""}${data.newStatus.toUpperCase()}

${statusMessage}

${data.newStatus === "hearing_scheduled" ? "You will receive a separate notice with the hearing date, time, and location." : ""}
${data.newStatus === "resolved" ? "Please check your account for the final determination and any value adjustments." : ""}

If you have any questions, please contact the assessor's office.

---
TerraForge Mass Valuation System
  `;

  // Notify project owner (assessor/admin)
  const notified = await notifyOwner({
    title: `Appeal Status Change: ${data.parcelId}`,
    content: emailContent,
  });

  // Send email to property owner if email is provided
  // In production, integrate with email service like SendGrid, AWS SES, etc.
  if (data.ownerEmail) {
    console.log(`[EmailNotification] Sending email to property owner: ${data.ownerEmail}`);
    console.log(`[EmailNotification] Email content:`, emailContent);
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
