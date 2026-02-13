/**
 * Appeal Priority Calculator
 * Automatically calculates priority based on value difference and days pending
 */

export type Priority = "low" | "medium" | "high" | "critical";

interface PriorityCalculationParams {
  currentAssessedValue: number;
  appealedValue: number;
  appealDate: Date;
  status: string;
}

/**
 * Calculate appeal priority based on:
 * 1. Value difference (impact)
 * 2. Days pending (urgency)
 * 3. Status (resolved appeals get low priority)
 */
export function calculateAppealPriority(params: PriorityCalculationParams): Priority {
  const { currentAssessedValue, appealedValue, appealDate, status } = params;

  // Resolved or withdrawn appeals always get low priority
  if (status === "resolved" || status === "withdrawn") {
    return "low";
  }

  // Calculate value difference
  const valueDifference = Math.abs(currentAssessedValue - appealedValue);

  // Calculate days pending
  const now = new Date();
  const daysPending = Math.floor((now.getTime() - appealDate.getTime()) / (1000 * 60 * 60 * 24));

  // Priority scoring logic
  // Critical: $500K+ value difference OR 90+ days pending
  if (valueDifference >= 500000 || daysPending >= 90) {
    return "critical";
  }

  // High: $100K-500K value difference OR 60-90 days pending
  if (valueDifference >= 100000 || daysPending >= 60) {
    return "high";
  }

  // Medium: $25K-100K value difference OR 30-60 days pending
  if (valueDifference >= 25000 || daysPending >= 30) {
    return "medium";
  }

  // Low: < $25K value difference AND < 30 days pending
  return "low";
}

/**
 * Get priority display label
 */
export function getPriorityLabel(priority: Priority): string {
  const labels: Record<Priority, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  };
  return labels[priority];
}

/**
 * Get priority badge color class
 */
export function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    low: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    critical: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  return colors[priority];
}
