import React from 'react';
import { cn } from "@/lib/utils";

interface AnimatedTerraLogoProps {
  className?: string;
  size?: number;
}

export function AnimatedTerraLogo({ className, size = 40 }: AnimatedTerraLogoProps) {
  return (
    <div 
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Core Glow */}
      <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse-core" />
      
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        className="relative z-10"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ffee" />
            <stop offset="50%" stopColor="#00d9d9" />
            <stop offset="100%" stopColor="#00a8a8" />
          </linearGradient>
          <radialGradient id="coreGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#00ffee" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00d9d9" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Spherical Grid Structure - Outer */}
        <g className="origin-center animate-spin-slow">
          {/* Horizontal grid lines */}
          <ellipse cx="50" cy="50" rx="45" ry="10" fill="none" stroke="#00d9d9" strokeWidth="0.5" strokeOpacity="0.4" />
          <ellipse cx="50" cy="50" rx="45" ry="20" fill="none" stroke="#00d9d9" strokeWidth="0.5" strokeOpacity="0.3" />
          <ellipse cx="50" cy="50" rx="45" ry="30" fill="none" stroke="#00d9d9" strokeWidth="0.5" strokeOpacity="0.25" />
          <ellipse cx="50" cy="50" rx="45" ry="40" fill="none" stroke="#00d9d9" strokeWidth="0.5" strokeOpacity="0.2" />
          {/* Outer sphere */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="url(#logoGradient)" strokeWidth="1" strokeOpacity="0.5" />
        </g>

        {/* Vertical Grid Lines - Reverse Rotation */}
        <g className="origin-center animate-spin-reverse-slow">
          <ellipse cx="50" cy="50" rx="45" ry="45" fill="none" stroke="#00ffee" strokeWidth="0.5" strokeOpacity="0.4" transform="rotate(0 50 50)" />
          <ellipse cx="50" cy="50" rx="45" ry="45" fill="none" stroke="#00ffee" strokeWidth="0.5" strokeOpacity="0.4" transform="rotate(30 50 50)" />
          <ellipse cx="50" cy="50" rx="45" ry="45" fill="none" stroke="#00ffee" strokeWidth="0.5" strokeOpacity="0.4" transform="rotate(60 50 50)" />
          <ellipse cx="50" cy="50" rx="45" ry="45" fill="none" stroke="#00ffee" strokeWidth="0.5" strokeOpacity="0.4" transform="rotate(90 50 50)" />
        </g>

        {/* Quantum Core - Pulsing Energy */}
        <g className="origin-center animate-pulse-core">
          {/* Core glow */}
          <circle cx="50" cy="50" r="18" fill="url(#coreGlow)" opacity="0.6" />
          {/* Core sphere */}
          <circle cx="50" cy="50" r="10" fill="url(#logoGradient)" />
          {/* Inner spiral */}
          <path d="M 50 40 Q 55 45 50 50 Q 45 55 50 60" fill="none" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.8" />
          <path d="M 50 40 Q 45 45 50 50 Q 55 55 50 60" fill="none" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.8" />
          {/* Center point */}
          <circle cx="50" cy="50" r="3" fill="#ffffff" opacity="0.9" />
        </g>
      </svg>
    </div>
  );
}
