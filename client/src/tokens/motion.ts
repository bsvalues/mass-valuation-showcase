/**
 * TerraFusion OS Motion Tokens
 * 
 * Defines animation physics and timing for the design system.
 * 
 * Tactile Maximalism Rules:
 * - "Squish" physics ONLY for commitment actions (Publish Roll, Delete, etc.)
 * - Standard transitions for everything else
 * - Respect prefers-reduced-motion
 */

export const motionTokens = {
  /**
   * Tactile Physics (Spring-based)
   * Reserved for commitment actions only
   */
  spring: {
    // Stiff spring - quick, responsive (for buttons)
    stiff: {
      tension: 300,
      friction: 20,
      mass: 1,
    },
    // Bouncy spring - playful (for success states)
    bouncy: {
      tension: 200,
      friction: 12,
      mass: 1,
    },
    // Gentle spring - smooth (for modals, drawers)
    gentle: {
      tension: 150,
      friction: 25,
      mass: 1,
    },
  },

  /**
   * Standard Durations
   * For non-tactile animations
   */
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
  },

  /**
   * Easing Functions
   * Material Design-inspired curves
   */
  easing: {
    // Standard easing - general use
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    
    // Decelerate - entering elements
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    
    // Accelerate - exiting elements
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
    
    // Sharp - quick transitions
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
    
    // Bounce - playful (use sparingly)
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  /**
   * Transition Presets
   * Common animation combinations
   */
  transition: {
    // Fade transitions
    fadeIn: {
      duration: '300ms',
      easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      property: 'opacity',
    },
    fadeOut: {
      duration: '200ms',
      easing: 'cubic-bezier(0.4, 0.0, 1, 1)',
      property: 'opacity',
    },
    
    // Transform transitions
    slideUp: {
      duration: '300ms',
      easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      property: 'transform',
      from: 'translateY(20px)',
      to: 'translateY(0)',
    },
    slideDown: {
      duration: '300ms',
      easing: 'cubic-bezier(0.4, 0.0, 1, 1)',
      property: 'transform',
      from: 'translateY(0)',
      to: 'translateY(20px)',
    },
    
    // Scale transitions
    scaleIn: {
      duration: '200ms',
      easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      property: 'transform',
      from: 'scale(0.95)',
      to: 'scale(1)',
    },
    scaleOut: {
      duration: '150ms',
      easing: 'cubic-bezier(0.4, 0.0, 1, 1)',
      property: 'transform',
      from: 'scale(1)',
      to: 'scale(0.95)',
    },
  },

  /**
   * Keyframe Animations
   * For complex motion sequences
   */
  keyframes: {
    // Pulse effect (for notifications, badges)
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    
    // Spin effect (for loading indicators)
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    
    // Bounce effect (for success states)
    bounce: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' },
    },
    
    // Shimmer effect (for skeleton loaders)
    shimmer: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    
    // Tactile squish (commitment actions only)
    squish: {
      '0%, 100%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(0.95)' },
    },
  },

  /**
   * Layout Shift Prevention
   * Zero-layout-shift animation properties
   */
  safeProperties: [
    'transform',
    'opacity',
    'filter',
    'backdrop-filter',
  ] as const,

  /**
   * Unsafe Properties
   * These trigger layout recalculation - avoid in animations
   */
  unsafeProperties: [
    'width',
    'height',
    'margin',
    'padding',
    'top',
    'left',
    'right',
    'bottom',
  ] as const,
} as const;

/**
 * Motion Utility Functions
 */

export function getTransition(
  properties: string | string[],
  duration: keyof typeof motionTokens.duration = 'normal',
  easing: keyof typeof motionTokens.easing = 'standard'
): string {
  const props = Array.isArray(properties) ? properties : [properties];
  return props
    .map(prop => `${prop} ${motionTokens.duration[duration]} ${motionTokens.easing[easing]}`)
    .join(', ');
}

export function getSpringTransition(
  springType: keyof typeof motionTokens.spring = 'stiff'
): { tension: number; friction: number; mass: number } {
  return motionTokens.spring[springType];
}

/**
 * Reduced Motion Support
 * Automatically applied via CSS @media query
 */
export const reducedMotion = {
  // Disable all animations
  disableAnimations: true,
  
  // Use instant transitions
  duration: '0ms',
  
  // No spring physics
  spring: {
    tension: 0,
    friction: 0,
    mass: 1,
  },
} as const;

/**
 * Type Exports
 */
export type MotionToken = typeof motionTokens;
export type SpringType = keyof typeof motionTokens.spring;
export type DurationType = keyof typeof motionTokens.duration;
export type EasingType = keyof typeof motionTokens.easing;
export type TransitionPreset = keyof typeof motionTokens.transition;
