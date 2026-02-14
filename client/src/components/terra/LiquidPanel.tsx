import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Quality Gate Detection for TerraFusion OS
 * Detects hardware capabilities and user preferences to enable/disable Liquid Glass
 */
function getQualityGate() {
  if (typeof window === "undefined") {
    return { glassEnabled: false };
  }

  // Check if backdrop-filter is supported
  const supportsBackdrop = CSS.supports("backdrop-filter: blur(1px)");

  // Check device memory (low-power heuristic)
  const deviceMemory = (navigator as any).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const lowPower = deviceMemory <= 4 || cores <= 4;

  // Check user preferences
  const reduceTrans = window.matchMedia("(prefers-reduced-transparency: reduce)").matches;

  return {
    glassEnabled: supportsBackdrop && !lowPower && !reduceTrans,
  };
}

interface LiquidPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Glass intensity level (1-4)
   * Higher numbers = more opacity
   */
  intensity?: 1 | 2 | 3 | 4;
  
  /**
   * Whether to add neon border glow
   */
  neonBorder?: boolean;
  
  /**
   * Fallback background when glass is disabled
   */
  fallbackBg?: string;
}

/**
 * LiquidPanel - OS Chrome Material (Layer 1)
 * 
 * Usage Rules (from TerraFusion Design System):
 * - Use ONLY for OS-level surfaces: Top System Bar, Dock, Control Center, Command Palette
 * - NEVER use for dense data grids, tables, ratio study sheets, or long forms
 * - Glass should "frame the world", not compete with data
 * 
 * Quality Gates:
 * - Automatically falls back to "Liquid Frost" (solid surface) on low-power devices
 * - Respects prefers-reduced-transparency user preference
 * - Includes tint layer to ensure WCAG AA contrast
 */
export function LiquidPanel({
  intensity = 2,
  neonBorder = false,
  fallbackBg = "bg-government-night-elevated",
  className,
  children,
  ...props
}: LiquidPanelProps) {
  const [gate, setGate] = React.useState({ glassEnabled: true });

  React.useEffect(() => {
    setGate(getQualityGate());
  }, []);

  const glassClass = gate.glassEnabled
    ? `backdrop-blur-xl bg-glass-${intensity} border-glass-border`
    : `${fallbackBg} border-government-night-border`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border",
        glassClass,
        neonBorder && "shadow-neon",
        className
      )}
      {...props}
    >
      {/* Tint Layer for WCAG AA Contrast */}
      {gate.glassEnabled && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, rgba(0, 217, 217, 0.03), rgba(10, 14, 26, 0.05))`,
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
