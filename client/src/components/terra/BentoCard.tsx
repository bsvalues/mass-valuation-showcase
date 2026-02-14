import * as React from "react";
import { cn } from "@/lib/utils";

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Card title
   */
  title?: string;
  
  /**
   * Card description/subtitle
   */
  description?: string;
  
  /**
   * Icon component to display in header
   */
  icon?: React.ReactNode;
  
  /**
   * Whether this card promotes a next action (adds visual emphasis)
   */
  actionable?: boolean;
  
  /**
   * Grid span (for responsive Bento layouts)
   */
  span?: "1" | "2" | "3" | "full";
}

/**
 * BentoCard - Infrastructure Layer (Layer 2)
 * 
 * Usage Rules (from TerraFusion Design System):
 * - Bento Grids are "Attention Allocators" for living dashboards
 * - Use for task-specific modules, NOT decorative layouts
 * - Must promote the next required step (e.g., "QA Gate Failed: 15 parcels missing")
 * - NEVER cause Layout Shift (CLS) - use transforms/opacity for animations
 * 
 * Grid System:
 * - Modular, auto-resizing containers
 * - Expand/shrink based on user intent (Context Mode)
 * - Keep layout predictable for government-class hardware
 */
export function BentoCard({
  title,
  description,
  icon,
  actionable = false,
  span = "1",
  className,
  children,
  ...props
}: BentoCardProps) {
  const spanClasses = {
    "1": "col-span-1",
    "2": "col-span-1 md:col-span-2",
    "3": "col-span-1 md:col-span-2 lg:col-span-3",
    "full": "col-span-full",
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border transition-all duration-300",
        "bg-glass-1 border-glass-border",
        actionable && "ring-2 ring-signal-primary/30 border-signal-primary/50",
        spanClasses[span],
        className
      )}
      {...props}
    >
      {/* Header */}
      {(title || icon) && (
        <div className="flex items-start gap-3 p-4 border-b border-glass-border">
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-glass-2 flex items-center justify-center text-signal-primary">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-lg font-semibold text-text-primary truncate">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-text-secondary mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-4">
        {children}
      </div>
      
      {/* Actionable Indicator */}
      {actionable && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 rounded-full bg-signal-primary animate-pulse" />
        </div>
      )}
    </div>
  );
}

/**
 * BentoGrid - Container for Bento Cards
 * 
 * Provides responsive grid layout with zero CLS
 */
export function BentoGrid({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        "transition-opacity duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
