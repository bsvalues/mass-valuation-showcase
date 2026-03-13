import * as React from "react";
import { Database, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeonDot } from "./terra/NeonSignal";
import { trpc } from "@/lib/trpc";

/**
 * SystemHealthMonitor — TerraFusion OS SystemBar primitive
 *
 * LIVE polling via tRPC getSystemHealth every 30s.
 * Shows real DB connection, background job queue, and ML model status.
 *
 * States per indicator:
 *   Database:  healthy | degraded | down
 *   Jobs:      idle | processing | error
 *   Model:     ready | calibrating | stale
 *
 * NeonDot colors:
 *   success  → green  (healthy / idle / ready)
 *   warning  → amber  (degraded / processing / calibrating)
 *   critical → red    (down / error / stale)
 */

type DatabaseStatus = "healthy" | "degraded" | "down";
type JobsStatus = "idle" | "processing" | "error";
type ModelStatus = "ready" | "calibrating" | "stale";

function getDbColor(s: DatabaseStatus): "success" | "warning" | "critical" {
  if (s === "healthy") return "success";
  if (s === "degraded") return "warning";
  return "critical";
}

function getJobColor(s: JobsStatus): "success" | "warning" | "critical" {
  if (s === "idle") return "success";
  if (s === "processing") return "warning";
  return "critical";
}

function getModelColor(s: ModelStatus): "success" | "warning" | "critical" {
  if (s === "ready") return "success";
  if (s === "calibrating") return "warning";
  return "critical";
}

export function SystemHealthMonitor() {
  // Poll the live health endpoint every 30 seconds
  const { data, isError } = trpc.assessmentReview.getSystemHealth.useQuery(undefined, {
    refetchInterval: 30_000,        // live poll every 30s
    staleTime: 25_000,              // consider stale after 25s
    retry: 2,
    refetchOnWindowFocus: true,
  });

  // Fallback while loading or on error — show degraded
  const dbStatus: DatabaseStatus = isError ? "down" : (data?.database.status ?? "degraded");
  const jobStatus: JobsStatus = isError ? "error" : (data?.jobs.status ?? "idle");
  const modelStatus: ModelStatus = isError ? "stale" : (data?.model.status ?? "stale");

  const dbDetail = data?.database.detail ?? (isError ? "Connection error" : "Checking...");
  const jobDetail = data?.jobs.detail ?? (isError ? "Queue error" : "Checking...");
  const modelDetail = data?.model.detail ?? (isError ? "Status unavailable" : "Checking...");
  const activeJobCount = data?.jobs.activeCount ?? 0;

  const indicators = [
    {
      icon: Database,
      label: "DB",
      color: getDbColor(dbStatus),
      tooltip: `Database: ${dbStatus} — ${dbDetail}`,
      animated: dbStatus !== "healthy",
    },
    {
      icon: Activity,
      label: activeJobCount > 0 ? `${activeJobCount}J` : "Jobs",
      color: getJobColor(jobStatus),
      tooltip: `Background Jobs: ${jobStatus} — ${jobDetail}`,
      animated: jobStatus !== "idle",
    },
    {
      icon: Zap,
      label: "Model",
      color: getModelColor(modelStatus),
      tooltip: `Valuation Model: ${modelStatus} — ${modelDetail}`,
      animated: modelStatus !== "ready",
    },
  ];

  return (
    <div className="flex items-center gap-2" role="status" aria-label="System health indicators">
      {indicators.map((indicator, idx) => {
        const Icon = indicator.icon;

        return (
          <div
            key={idx}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-lg",
              "bg-glass-1 border border-glass-border",
              "transition-all duration-300",
              "hover:bg-glass-2 hover:scale-105",
              "cursor-help select-none",
              // Subtle amber glow for warning states
              indicator.color === "warning" && "border-amber-500/30",
              // Red glow for critical states
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
          </div>
        );
      })}
    </div>
  );
}
