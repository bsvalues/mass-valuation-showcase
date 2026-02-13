import { ReactNode } from 'react';

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
  return (
    <div
      className="min-h-screen pb-24 pt-16
                 bg-[var(--color-government-night-base)]
                 transition-all duration-[var(--duration-normal)]"
    >
      {/* Stage Content Area */}
      <div className="w-full h-full">
        {children}
      </div>
    </div>
  );
}
