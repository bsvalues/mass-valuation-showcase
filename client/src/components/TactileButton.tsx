import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type TactileButtonVariant = "neon" | "chrome" | "clay";

export interface TactileButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: TactileButtonVariant;
  children: React.ReactNode;
}

const variantStyles: Record<TactileButtonVariant, string> = {
  neon: `
    bg-gradient-to-br from-neon-cyan to-neon-magenta
    text-deep-charcoal font-bold
    shadow-[0_0_20px_rgba(0,255,238,0.5),0_0_40px_rgba(0,255,238,0.3)]
    hover:shadow-[0_0_30px_rgba(0,255,238,0.7),0_0_60px_rgba(0,255,238,0.4)]
  `,
  chrome: `
    bg-gradient-to-br from-chrome-light to-chrome-dark
    text-foreground font-semibold
    shadow-[0_4px_20px_rgba(255,255,255,0.2),inset_0_1px_0_rgba(255,255,255,0.4)]
    hover:shadow-[0_6px_30px_rgba(255,255,255,0.3),inset_0_1px_0_rgba(255,255,255,0.6)]
  `,
  clay: `
    bg-gradient-to-br from-muted to-muted/70
    text-foreground font-medium
    shadow-[0_2px_10px_rgba(0,0,0,0.2),inset_0_-2px_0_rgba(0,0,0,0.1)]
    hover:shadow-[0_4px_15px_rgba(0,0,0,0.3),inset_0_-2px_0_rgba(0,0,0,0.15)]
  `,
};

export const TactileButton = forwardRef<HTMLButtonElement, TactileButtonProps>(
  ({ variant = "neon", className, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          "relative px-6 py-3 rounded-xl overflow-hidden",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
          variantStyles[variant],
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ 
          scale: 0.98,
          transition: { 
            type: "spring", 
            stiffness: 400, 
            damping: 10 
          } 
        }}
        {...props}
      >
        {/* Squishy animation layer */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ scaleY: 1 }}
          whileTap={{ 
            scaleY: 1.08,
            transition: { 
              type: "spring", 
              stiffness: 400, 
              damping: 10,
              duration: 0.3
            }
          }}
        />
        
        {/* Content */}
        <span className="relative z-10">{children}</span>
        
        {/* Gloss highlight */}
        <div 
          className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none"
          style={{ borderRadius: "inherit" }}
        />
      </motion.button>
    );
  }
);

TactileButton.displayName = "TactileButton";
