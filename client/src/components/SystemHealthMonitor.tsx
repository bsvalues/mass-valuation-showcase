import * as React from "react";
import { Database, Zap, Activity, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeonDot } from "./terra/NeonSignal";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

/**
 * SystemHealthMonitor — TerraFusion OS SystemBar primitive
 *
 * LIVE polling via tRPC getSystemHealth every 30s.
 * Shows 4 real-time health indicators:
 *
 *   1. Database  — DB connection status (healthy / degraded / down)
 *   2. Jobs      — Background job queue (idle / processing / error)
 *   3. Model     — ML valuation model (ready / calibrating / stale)
 *   4. Appeals   — Appeals queue depth (0 = green, 1-10 = amber, >10 = red)
 *
 * NeonDot colors:
 *   success  → green  (healthy / idle / ready / 0 appeals)
 *   warning  → amber  (degraded / processing / calibrating / 1-10 appeals)
 *   critical → red    (down / error / stale / >10 appeals)
 */

type NeonColor = "success" | "warning" | "critical";

function getDbColor(s: "healthy" | "degraded" | "down"): NeonColor {
  if (s === "healthy") return "success";
  if (s === "degraded") return "warning";
  return "critical";
}

function getJobColor(s: "idle" | "processing" | "error"): NeonColor {
  if (s === "idle") return "success";
  if (s === "processing") return "warning";
  return "critical";
}

function getModelColor(s: "ready" | "calibrating" | "stale"): NeonColor {
  if (s === "ready") return "success";
  if (s === "calibrating") return "warning";
  return "critical";
}

export function SystemHealthMonitor() {
  const [, setLocation] = useLocation();
  const { data, isError } = trpc.assessmentReview.getSystemHealth.useQuery(undefined, {
    refetchInterval: 30_000,
    staleTime: 25_000,
    retry: 2,
    refetchOnWindowFocus: true,
  });

  // Fallback states while loading or on error
  const dbStatus = isError ? "down" : (data?.database.status ?? "degraded");
  const jobStatus = isError ? "error" : (data?.jobs.status ?? "idle");
  const modelStatus = isError ? "stale" : (data?.model.status ?? "stale");
  const appealsStatus: NeonColor = isError ? "warning" : (data?.appeals.status ?? "success");

  const dbDetail = data?.database.detail ?? (isError ? "Connection error" : "Checking...");
  const jobDetail = data?.jobs.detail ?? (isError ? "Queue error" : "Checking...");
  const modelDetail = data?.model.detail ?? (isError ? "Status unavailable" : "Checking...");
  const appealsDetail = data?.appeals.detail ?? (isError ? "Queue unavailable" : "Checking...");
  const activeJobCount = data?.jobs.activeCount ?? 0;
  const appealsCount = data?.appeals.count ?? 0;

  const indicators: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: NeonColor;
    tooltip: string;
    animated: boolean;
    badge?: number;
    onClick?: () => void;
  }> = [
    {
      icon: Database,
      label: "DB",
      color: getDbColor(dbStatus as "healthy" | "degraded" | "down"),
      tooltip: `Database: ${dbStatus} — ${dbDetail}`,
      animated: dbStatus !== "healthy",
    },
    {
      icon: Activity,
      label: activeJobCount > 0 ? `${activeJobCount}J` : "Jobs",
      color: getJobColor(jobStatus as "idle" | "processing" | "error"),
      tooltip: `Background Jobs: ${jobStatus} — ${jobDetail}`,
      animated: jobStatus !== "idle",
    },
    {
      icon: Zap,
      label: "Model",
      color: getModelColor(modelStatus as "ready" | "calibrating" | "stale"),
      tooltip: `Valuation Model: ${modelStatus} — ${modelDetail}`,
      animated: modelStatus !== "ready",
    },
    {
      icon: Gavel,
      label: appealsCount > 0 ? `${appealsCount}A` : "Appeals",
      color: appealsStatus,
      tooltip: `Appeals Queue: ${appealsDetail} — Click to review`,
      animated: appealsStatus !== "success",
      badge: appealsCount > 0 ? appealsCount : undefined,
      onClick: () => setLocation("/appeals?filter=in_review"),
    },
  ];

  return (
    <div className="flex items-center gap-1.5" role="status" aria-label="System health indicators">
      {indicators.map((indicator, idx) => {
        const Icon = indicator.icon;

        return (
          <div
            key={idx}
            role={indicator.onClick ? "button" : undefined}
            tabIndex={indicator.onClick ? 0 : undefined}
            onClick={indicator.onClick}
            onKeyDown={indicator.onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); indicator.onClick!(); } } : undefined}
            className={cn(
              "relative flex items-center gap-1.5 px-2 py-1 rounded-lg",
              "bg-glass-1 border border-glass-border",
              "transition-all duration-300",
              "hover:bg-glass-2 hover:scale-105",
              indicator.onClick ? "cursor-pointer select-none" : "cursor-help select-none",
              indicator.onClick && "hover:border-signal-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-primary",
              indicator.color === "warning" && "border-amber-500/30",
              indicator.color === "critical" && "border-red-500/40 shadow-[0_0_8px_rgba(255,0,0,0.2)]"
            )}
            title={indicator.tooltip}
            aria-label={indicator.tooltip}
          >
            <Icon
              className={cn(
                "w-3.5 h-3.5 transition-colors",
                indicator.color === "success" && "text-text-secondary",
                indicator.color === "warning" && "text-amber-400",
                indicator.color === "critical" && "text-red-400"
              )}
            />
            <NeonDot
              type={indicator.color}
              animated={indicator.animated}
            />
            {/* Count badge for appeals — shown when queue > 0 */}
            {indicator.badge !== undefined && indicator.badge > 0 && (
              <span
                className={cn(
                  "absolute -top-1.5 -right-1.5",
                  "min-w-[16px] h-4 px-0.5",
                  "flex items-center justify-center",
                  "text-[9px] font-bold rounded-full",
                  indicator.color === "warning" && "bg-amber-500 text-black",
                  indicator.color === "critical" && "bg-red-500 text-white",
                )}
                aria-label={`${indicator.badge} appeals in queue`}
              >
                {indicator.badge > 99 ? "99+" : indicator.badge}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
