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
            <stop offset="0%" stopColor="#00ffff" />
            <stop offset="100%" stopColor="#0080ff" />
          </linearGradient>
        </defs>

        {/* Outer Ring - Slow Rotation */}
        <g className="origin-center animate-spin-slow">
          <circle cx="50" cy="50" r="45" fill="none" stroke="url(#logoGradient)" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="10 5" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="url(#logoGradient)" strokeWidth="0.5" strokeOpacity="0.1" />
        </g>

        {/* Middle Ring - Reverse Rotation */}
        <g className="origin-center animate-spin-reverse-slow">
          <ellipse cx="50" cy="50" rx="35" ry="15" fill="none" stroke="#00ffff" strokeWidth="1" strokeOpacity="0.5" transform="rotate(45 50 50)" />
          <ellipse cx="50" cy="50" rx="35" ry="15" fill="none" stroke="#00ffff" strokeWidth="1" strokeOpacity="0.5" transform="rotate(-45 50 50)" />
        </g>

        {/* Inner Core - Pulsing */}
        <g className="origin-center animate-pulse-core">
          <circle cx="50" cy="50" r="12" fill="url(#logoGradient)" />
          <circle cx="50" cy="50" r="6" fill="#fff" fillOpacity="0.8" />
        </g>
      </svg>
    </div>
  );
}
