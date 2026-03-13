import * as React from "react";
import { cn } from "@/lib/utils";

interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant
   */
  variant?: "neon" | "glass" | "solid";
  
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
  
  /**
   * Whether this is a commitment action (enables squish physics)
   * Only use for: Run, Publish, Certify, Export, Lock Model, Generate Defense Packet
   */
  commitment?: boolean;
}

/**
 * TactileButton - Interactive Layer (Layer 3)
 * 
 * Usage Rules (from TerraFusion Design System):
 * - Tactile Maximalism ("squish") is ONLY for Commitment Actions
 * - Commitment Actions: Run, Publish, Certify, Export, Lock Model, Approve Calibration
 * - "If everything is squishy, nothing feels important"
 * - General navigation and low-stakes buttons should NOT use commitment=true
 * 
 * Physics:
 * - Uses "stiff + bouncy" spring physics for psychological confirmation
 * - Respects prefers-reduced-motion user preference
 */
export const TactileButton = React.forwardRef<HTMLButtonElement, TactileButtonProps>(function TactileButton({
  variant = "neon",
  size = "md",
  commitment = false,
  className,
  children,
  disabled,
  ...props
}, ref) {
  const [isPressed, setIsPressed] = React.useState(false);
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const variantClasses = {
    neon: "bg-gradient-to-r from-signal-primary to-signal-secondary text-government-night-base font-semibold shadow-neon hover:shadow-neon-strong",
    glass: "bg-glass-2 border border-glass-border text-text-primary hover:bg-glass-3",
    solid: "bg-government-night-surface border border-government-night-border text-text-primary hover:bg-government-night-elevated",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const handleMouseDown = () => {
    if (commitment && !reduceMotion && !disabled) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  return (
    <button
      className={cn(
        "relative rounded-lg transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-primary focus-visible:ring-offset-2 focus-visible:ring-offset-government-night-base",
        variantClasses[variant],
        sizeClasses[size],
        disabled && "opacity-50 cursor-not-allowed",
        commitment && !reduceMotion && "active:scale-96",
        className
      )}
      style={{
        transform: isPressed && commitment && !reduceMotion ? "scale(0.96)" : "scale(1)",
        transition: commitment && !reduceMotion 
          ? "transform 120ms cubic-bezier(0.68, -0.55, 0.265, 1.55)" 
          : undefined,
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});
