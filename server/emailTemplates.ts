/**
 * Branded HTML email templates for TerraForge appeal notifications
 */

interface StatusChangeEmailParams {
  appealId: number;
  parcelId: string;
  oldStatus: string;
  newStatus: string;
  ownerEmail?: string;
  currentAssessedValue: number;
  appealedValue: number;
}

interface NewAppealEmailParams {
  appealId: number;
  parcelId: string;
  currentAssessedValue: number;
  appealedValue: number;
  appealReason?: string;
  ownerEmail?: string;
}

interface HearingScheduledEmailParams {
  appealId: number;
  parcelId: string;
  hearingDate: string;
  currentAssessedValue: number;
  ownerEmail?: string;
}

const TERRAFORGE_CYAN = "#00D9D9";
const TERRAFORGE_DARK = "#0A0E1A";
const TERRAFORGE_GRAY = "#1E293B";

/**
 * Base email template with TerraForge branding
 */
function getEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TerraForge Notification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, ${TERRAFORGE_DARK} 0%, ${TERRAFORGE_GRAY} 100%);
      padding: 40px 30px;
      text-align: center;
      border-bottom: 4px solid ${TERRAFORGE_CYAN};
    }
    .logo {
      color: ${TERRAFORGE_CYAN};
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin: 0;
      text-shadow: 0 0 20px rgba(0, 217, 217, 0.3);
    }
    .subtitle {
      color: #94a3b8;
      font-size: 14px;
      margin: 8px 0 0 0;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .content {
      padding: 40px 30px;
      color: #1e293b;
      line-height: 1.6;
    }
    .content h2 {
      color: #0f172a;
      font-size: 24px;
      margin: 0 0 20px 0;
      font-weight: 600;
    }
    .content p {
      margin: 0 0 16px 0;
      font-size: 16px;
    }
    .info-box {
      background-color: #f8fafc;
      border-left: 4px solid ${TERRAFORGE_CYAN};
      padding: 20px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 8px 0;
      font-size: 15px;
    }
    .info-box strong {
      color: #0f172a;
      font-weight: 600;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, ${TERRAFORGE_CYAN} 0%, #00FFEE 100%);
      color: ${TERRAFORGE_DARK};
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
      box-shadow: 0 4px 12px rgba(0, 217, 217, 0.3);
    }
    .footer {
      background-color: #f8fafc;
      padding: 30px;
      text-align: center;
      color: #64748b;
      font-size: 14px;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 8px 0;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-pending { background-color: #fef3c7; color: #92400e; }
    .status-in-review { background-color: #dbeafe; color: #1e40af; }
    .status-hearing { background-color: #e9d5ff; color: #6b21a8; }
    .status-resolved { background-color: #d1fae5; color: #065f46; }
    .status-withdrawn { background-color: #f3f4f6; color: #374151; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">TerraForge</h1>
      <p class="subtitle">Mass Valuation Appraisal Suite</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p><strong>TerraForge</strong> • Quantum-Powered Mass Valuation</p>
      <p>Part of the TerraFusion Elite Government OS Platform</p>
      <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">
        This is an automated notification. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Format currency for display
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status: string): string {
  const statusClass = `status-${status.replace('_', '-')}`;
  const statusText = status.replace('_', ' ').toUpperCase();
  return `<span class="status-badge ${statusClass}">${statusText}</span>`;
}

/**
 * Status change notification email
 */
export function getStatusChangeEmailHTML(params: StatusChangeEmailParams): string {
  const content = `
    <h2>Appeal Status Update</h2>
    <p>The status of your property tax appeal has been updated.</p>
    
    <div class="info-box">
      <p><strong>Appeal ID:</strong> #${params.appealId}</p>
      <p><strong>Parcel ID:</strong> ${params.parcelId}</p>
      <p><strong>Current Assessed Value:</strong> ${formatCurrency(params.currentAssessedValue)}</p>
      <p><strong>Appealed Value:</strong> ${formatCurrency(params.appealedValue)}</p>
      <p style="margin-top: 16px;"><strong>Status Change:</strong></p>
      <p>${getStatusBadge(params.oldStatus)} → ${getStatusBadge(params.newStatus)}</p>
    </div>
    
    <p>You can view the full details and timeline of your appeal by accessing the TerraForge portal.</p>
    
    <a href="#" class="button">View Appeal Details</a>
    
    <p style="margin-top: 32px; font-size: 14px; color: #64748b;">
      If you have any questions about this status change, please contact your county assessor's office.
    </p>
  `;
  
  return getEmailTemplate(content);
}

/**
 * New appeal submission confirmation email
 */
export function getNewAppealEmailHTML(params: NewAppealEmailParams): string {
  const valueDifference = params.currentAssessedValue - params.appealedValue;
  
  const content = `
    <h2>Appeal Submitted Successfully</h2>
    <p>Your property tax appeal has been received and is now under review.</p>
    
    <div class="info-box">
      <p><strong>Appeal ID:</strong> #${params.appealId}</p>
      <p><strong>Parcel ID:</strong> ${params.parcelId}</p>
      <p><strong>Current Assessed Value:</strong> ${formatCurrency(params.currentAssessedValue)}</p>
      <p><strong>Requested Value:</strong> ${formatCurrency(params.appealedValue)}</p>
      <p><strong>Reduction Requested:</strong> ${formatCurrency(valueDifference)}</p>
      ${params.appealReason ? `<p style="margin-top: 16px;"><strong>Reason:</strong> ${params.appealReason}</p>` : ''}
    </div>
    
    <p>Your appeal is currently ${getStatusBadge('pending')} and will be reviewed by our assessment team. You will receive email notifications as your appeal progresses through the review process.</p>
    
    <a href="#" class="button">Track Appeal Status</a>
    
    <p style="margin-top: 32px; font-size: 14px; color: #64748b;">
      <strong>What happens next?</strong><br>
      1. Initial review (3-5 business days)<br>
      2. Detailed assessment analysis<br>
      3. Decision or hearing scheduling<br>
      4. Final resolution
    </p>
  `;
  
  return getEmailTemplate(content);
}

/**
 * Hearing scheduled notification email
 */
export function getHearingScheduledEmailHTML(params: HearingScheduledEmailParams): string {
  const hearingDate = new Date(params.hearingDate);
  const formattedDate = hearingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = hearingDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  const content = `
    <h2>Appeal Hearing Scheduled</h2>
    <p>A hearing has been scheduled for your property tax appeal.</p>
    
    <div class="info-box">
      <p><strong>Appeal ID:</strong> #${params.appealId}</p>
      <p><strong>Parcel ID:</strong> ${params.parcelId}</p>
      <p><strong>Current Assessed Value:</strong> ${formatCurrency(params.currentAssessedValue)}</p>
      <p style="margin-top: 16px;"><strong>Hearing Date:</strong> ${formattedDate}</p>
      <p><strong>Hearing Time:</strong> ${formattedTime}</p>
    </div>
    
    <p>Please arrive 15 minutes early and bring any supporting documentation for your appeal. You may also have legal representation present if desired.</p>
    
    <a href="#" class="button">View Hearing Details</a>
    
    <p style="margin-top: 32px; font-size: 14px; color: #64748b;">
      <strong>What to bring:</strong><br>
      • Photo ID<br>
      • Property documentation<br>
      • Comparable sales data<br>
      • Any other supporting evidence
    </p>
    
    <p style="font-size: 14px; color: #64748b;">
      If you cannot attend, please contact the assessor's office at least 48 hours in advance to reschedule.
    </p>
  `;
  
  return getEmailTemplate(content);
}
