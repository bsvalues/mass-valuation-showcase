/**
 * Client-side Priority Utilities
 * Display helpers for appeal priority badges
 */

export type Priority = "low" | "medium" | "high" | "critical";

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
 * Get priority badge color classes (Tailwind)
 */
export function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    low: "bg-slate-500/10 text-slate-700 border-slate-500/20",
    medium: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    high: "bg-orange-500/10 text-orange-700 border-orange-500/20",
    critical: "bg-red-500/10 text-red-700 border-red-500/20",
  };
  return colors[priority];
}

/**
 * Get priority sort order (for sorting)
 */
export function getPrioritySortOrder(priority: Priority): number {
  const order: Record<Priority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return order[priority];
}
