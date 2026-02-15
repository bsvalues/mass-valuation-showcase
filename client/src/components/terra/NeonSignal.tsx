import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

/**
 * Neon Signal Component
 * 
 * Following TerraFusion OS "Neon as Signal" principle:
 * - Use neon gradients ONLY for system alerts, status updates, and theatrical hero moments
 * - Never use for decorative elements or general UI themes
 * - Animated pulse to draw attention
 * 
 * Signal Types:
 * - info: Cyan (#00FFEE) - System information
 * - success: Lime (#00FF00) - Successful operations
 * - warning: Amber (#FFA500) - Warnings and cautions
 * - critical: Red (#FF0000) - Critical alerts and errors
 */

export type SignalType = "info" | "success" | "warning" | "critical";

interface NeonSignalProps {
  type: SignalType;
  message: string;
  animated?: boolean;
  icon?: boolean;
  className?: string;
}

const signalConfig = {
  info: {
    color: "from-cyan-400 to-cyan-600",
    glow: "shadow-[0_0_20px_rgba(0,255,238,0.5)]",
    icon: Info,
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
  },
  success: {
    color: "from-lime-400 to-lime-600",
    glow: "shadow-[0_0_20px_rgba(0,255,0,0.5)]",
    icon: CheckCircle2,
    bg: "bg-lime-500/10",
    border: "border-lime-500/30",
  },
  warning: {
    color: "from-amber-400 to-amber-600",
    glow: "shadow-[0_0_20px_rgba(255,165,0,0.5)]",
    icon: AlertTriangle,
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  critical: {
    color: "from-red-400 to-red-600",
    glow: "shadow-[0_0_20px_rgba(255,0,0,0.5)]",
    icon: AlertCircle,
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  },
};

export function NeonSignal({
  type,
  message,
  animated = true,
  icon = true,
  className,
}: NeonSignalProps) {
  const config = signalConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm",
        config.bg,
        config.border,
        animated && "animate-pulse",
        className
      )}
    >
      {icon && (
        <div className={cn("flex-shrink-0", config.glow)}>
          <Icon className={cn("w-4 h-4 bg-gradient-to-r bg-clip-text text-transparent", config.color)} />
        </div>
      )}
      <span className="text-sm font-medium text-foreground/90">{message}</span>
    </div>
  );
}

/**
 * Compact badge variant for inline use
 */
export function NeonBadge({
  type,
  children,
  animated = false,
  className,
}: {
  type: SignalType;
  children: React.ReactNode;
  animated?: boolean;
  className?: string;
}) {
  const config = signalConfig[type];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full",
        config.bg,
        config.border,
        config.glow,
        animated && "animate-pulse",
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Floating signal dot for status indicators
 */
export function NeonDot({
  type,
  animated = true,
  className,
}: {
  type: SignalType;
  animated?: boolean;
  className?: string;
}) {
  const config = signalConfig[type];

  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full",
        config.bg,
        config.glow,
        animated && "animate-pulse",
        className
      )}
    />
  );
}
