import * as React from "react";
import { Database, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeonDot } from "./terra/NeonSignal";

interface HealthStatus {
  database: "healthy" | "degraded" | "down";
  jobs: "idle" | "processing" | "error";
  model: "ready" | "calibrating" | "stale";
}

export function SystemHealthMonitor() {
  const [health, setHealth] = React.useState<HealthStatus>({
    database: "healthy",
    jobs: "idle",
    model: "ready",
  });

  // Simulate health checks (in production, this would poll actual endpoints)
  React.useEffect(() => {
    const checkHealth = () => {
      // Mock health check logic
      setHealth({
        database: "healthy",
        jobs: "idle",
        model: "ready",
      });
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string): "success" | "warning" | "critical" | "info" => {
    if (status === "healthy" || status === "ready" || status === "idle") return "success";
    if (status === "degraded" || status === "processing" || status === "calibrating") return "warning";
    if (status === "down" || status === "error" || status === "stale") return "critical";
    return "info";
  };

  const indicators = [
    {
      icon: Database,
      label: "DB",
      status: health.database,
      tooltip: `Database: ${health.database}`,
    },
    {
      icon: Activity,
      label: "Jobs",
      status: health.jobs,
      tooltip: `Background Jobs: ${health.jobs}`,
    },
    {
      icon: Zap,
      label: "Model",
      status: health.model,
      tooltip: `Valuation Model: ${health.model}`,
    },
  ];

  return (
    <div className="flex items-center gap-3">
      {indicators.map((indicator, idx) => {
        const Icon = indicator.icon;
        const statusColor = getStatusColor(indicator.status);

        return (
          <div
            key={idx}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-lg",
              "bg-glass-1 border border-glass-border",
              "transition-all duration-200",
              "hover:bg-glass-2 hover:scale-105",
              "cursor-help"
            )}
            title={indicator.tooltip}
          >
            <Icon className="w-3.5 h-3.5 text-text-secondary" />
            <NeonDot type={statusColor} animated={statusColor !== "success"} />
          </div>
        );
      })}
    </div>
  );
}
