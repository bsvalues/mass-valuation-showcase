import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface LiquidPanelProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  children: React.ReactNode;
  /** Enable warp effect on hover (GPU-intensive) */
  enableWarp?: boolean;
  /** Enable breathe animation */
  enableBreathe?: boolean;
}

export const LiquidPanel = forwardRef<HTMLDivElement, LiquidPanelProps>(
  ({ className, children, enableWarp = false, enableBreathe = false, ...props }, ref) => {
    const [supportsBackdropFilter, setSupportsBackdropFilter] = useState(true);
    
    useEffect(() => {
      // Check for backdrop-filter support
      const testElement = document.createElement("div");
      testElement.style.backdropFilter = "blur(10px)";
      const supported = testElement.style.backdropFilter !== "";
      setSupportsBackdropFilter(supported);
    }, []);

    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative",
          supportsBackdropFilter ? "liquid-glass" : "bg-card/95",
          enableBreathe && "animate-[breathe_3s_ease-in-out_infinite]",
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        whileHover={
          enableWarp
            ? {
                rotateY: 2,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                },
              }
            : undefined
        }
        style={{
          transformStyle: "preserve-3d",
          perspective: "1000px",
        }}
        {...props}
      >
        {/* Refractive edge highlight */}
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{
            background: `
              linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.1) 0%,
                transparent 50%,
                rgba(0, 255, 238, 0.05) 100%
              )
            `,
          }}
        />
        
        {/* Content */}
        <div className="relative z-10">{children}</div>
        
        {/* Glow effect for accessibility contrast */}
        <div
          className="absolute -inset-[1px] rounded-[inherit] pointer-events-none opacity-50"
          style={{
            background: `
              radial-gradient(
                circle at 50% 0%,
                rgba(0, 255, 238, 0.1) 0%,
                transparent 70%
              )
            `,
          }}
        />
      </motion.div>
    );
  }
);

LiquidPanel.displayName = "LiquidPanel";
