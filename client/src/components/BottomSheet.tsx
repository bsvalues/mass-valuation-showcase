import { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export type BottomSheetState = 'collapsed' | 'half' | 'full';

interface BottomSheetProps {
  children: React.ReactNode;
  state: BottomSheetState;
  onStateChange: (state: BottomSheetState) => void;
}

const STATE_HEIGHTS = {
  collapsed: 80,
  half: typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400,
  full: typeof window !== 'undefined' ? window.innerHeight * 0.9 : 700,
};

export function BottomSheet({ children, state, onStateChange }: BottomSheetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentHeight, setCurrentHeight] = useState(STATE_HEIGHTS[state]);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentHeight(STATE_HEIGHTS[state]);
  }, [state]);

  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    setDragStartY(clientY);
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;
    
    const deltaY = dragStartY - clientY;
    const newHeight = Math.max(
      STATE_HEIGHTS.collapsed,
      Math.min(STATE_HEIGHTS.full, currentHeight + deltaY)
    );
    
    setCurrentHeight(newHeight);
    setDragStartY(clientY);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Snap to nearest state
    const distances = {
      collapsed: Math.abs(currentHeight - STATE_HEIGHTS.collapsed),
      half: Math.abs(currentHeight - STATE_HEIGHTS.half),
      full: Math.abs(currentHeight - STATE_HEIGHTS.full),
    };

    const nearestState = Object.keys(distances).reduce((a, b) =>
      distances[a as BottomSheetState] < distances[b as BottomSheetState] ? a : b
    ) as BottomSheetState;

    onStateChange(nearestState);
  };

  const cycleState = () => {
    const states: BottomSheetState[] = ['collapsed', 'half', 'full'];
    const currentIndex = states.indexOf(state);
    const nextIndex = (currentIndex + 1) % states.length;
    onStateChange(states[nextIndex]);
  };

  return (
    <div
      ref={sheetRef}
      className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-out"
      style={{
        height: isDragging ? `${currentHeight}px` : `${STATE_HEIGHTS[state]}px`,
      }}
    >
      {/* Bottom Sheet Container */}
      <div className="h-full bg-black/60 backdrop-blur-2xl border-t border-white/10 shadow-2xl rounded-t-3xl overflow-hidden flex flex-col">
        {/* Drag Handle */}
        <div
          className="flex-shrink-0 h-20 flex items-center justify-center cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => handleDragStart(e.clientY)}
          onMouseMove={(e) => handleDragMove(e.clientY)}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
          onTouchEnd={handleDragEnd}
          onClick={cycleState}
        >
          <div className="w-12 h-1.5 bg-white/30 rounded-full" />
          {state === 'collapsed' && (
            <ChevronUp className="ml-2 w-5 h-5 text-white/50" />
          )}
          {state === 'full' && (
            <ChevronDown className="ml-2 w-5 h-5 text-white/50" />
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
