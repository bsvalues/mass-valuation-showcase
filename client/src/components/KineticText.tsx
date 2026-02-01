import { useEffect, useRef, useState } from 'react';

interface KineticTextProps {
  children: React.ReactNode;
  className?: string;
  minWeight?: number;
  maxWeight?: number;
  scrollThreshold?: number;
}

/**
 * KineticText - 2026 scroll-reactive typography
 * Font weight transitions from light to bold based on scroll position
 * Includes neon cyber-gradient text effect
 */
export function KineticText({
  children,
  className = '',
  minWeight = 300,
  maxWeight = 700,
  scrollThreshold = 200,
}: KineticTextProps) {
  const [fontWeight, setFontWeight] = useState(minWeight);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const scrollProgress = Math.max(0, Math.min(1, 1 - rect.top / scrollThreshold));
      
      const weight = minWeight + (maxWeight - minWeight) * scrollProgress;
      setFontWeight(weight);
    };

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      setFontWeight(maxWeight);
      return;
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [minWeight, maxWeight, scrollThreshold]);

  return (
    <div
      ref={elementRef}
      className={`kinetic-text ${className}`}
      style={{
        fontWeight,
        transition: 'font-weight 0.1s ease-out',
        background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-magenta))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {children}
    </div>
  );
}
