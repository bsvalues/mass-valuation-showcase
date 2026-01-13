import React from 'react';

interface TerraLogoProps {
  className?: string;
  size?: number;
}

export function TerraLogo({ className, size = 32 }: TerraLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 512 512" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="terraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00ffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#0080ff" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="terraGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00ffff" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#00ffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00ffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* Outer Sphere Grid */}
      <g transform="translate(256, 256)" opacity="0.8">
        <circle r="220" fill="none" stroke="#00ffff" strokeWidth="20"/>
        <ellipse rx="220" ry="100" fill="none" stroke="#00ffff" strokeWidth="10"/>
        <ellipse rx="220" ry="100" fill="none" stroke="#00ffff" strokeWidth="10" transform="rotate(60)"/>
        <ellipse rx="220" ry="100" fill="none" stroke="#00ffff" strokeWidth="10" transform="rotate(120)"/>
      </g>
      
      {/* Core Vortex */}
      <g transform="translate(256, 256)">
        <circle r="80" fill="url(#terraGlow)"/>
        <path d="M 0,-60 Q 40,-40 40,0 T 0,60 T -60,0 T 0,-60" 
              fill="none" stroke="url(#terraGradient)" strokeWidth="20" strokeLinecap="round"/>
      </g>
    </svg>
  );
}
