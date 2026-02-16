import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface StageProps {
  children: ReactNode;
}

/**
 * Stage - The active workspace area in TerraFusion OS
 * 
 * Replaces traditional page containers with a spatial computing paradigm.
 * Content appears in the "center stage" while the Dock provides persistent navigation.
 */
export function Stage({ children }: StageProps) {
  const [location] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  // Scene transition effect
  useEffect(() => {
    // Start fade out
    setIsTransitioning(true);

    // After fade out, update content
    const updateTimer = setTimeout(() => {
      setDisplayChildren(children);
    }, 150); // Half of transition duration

    // Complete fade in
    const completeTimer = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);

    return () => {
      clearTimeout(updateTimer);
      clearTimeout(completeTimer);
    };
  }, [location, children]);

  return (
    <div
      className="min-h-screen pb-24 pt-16
                 bg-[var(--color-government-night-base)]
                 transition-all duration-[var(--duration-normal)]"
    >
      {/* Stage Content Area with Transitions */}
      <div
        className="w-full h-full transition-all duration-300"
        style={{
          opacity: isTransitioning ? 0.3 : 1,
          transform: isTransitioning ? 'translateY(8px)' : 'translateY(0)',
        }}
      >
        {displayChildren}
      </div>
    </div>
  );
}
