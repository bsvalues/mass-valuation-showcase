/**
 * TerraFusion OS Spacing Tokens
 * 
 * 8px base grid system for consistent spacing and rhythm.
 * All spacing values must be multiples of 4px (0.25rem).
 * 
 * Usage:
 * - Use for margins, padding, gaps
 * - Maintain vertical rhythm
 * - Ensure touch targets meet 44px minimum
 */

export const spacingTokens = {
  /**
   * Core Spacing Scale
   * Based on 8px (0.5rem) base unit
   */
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px (base unit)
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px (minimum touch target)
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

/**
 * Semantic Spacing
 * Named spacing for common use cases
 */
export const semanticSpacing = {
  /**
   * Component Spacing
   */
  component: {
    // Internal padding
    paddingXs: spacingTokens[2],    // 8px
    paddingSm: spacingTokens[3],    // 12px
    paddingMd: spacingTokens[4],    // 16px
    paddingLg: spacingTokens[6],    // 24px
    paddingXl: spacingTokens[8],    // 32px
    
    // Gaps between elements
    gapXs: spacingTokens[1],        // 4px
    gapSm: spacingTokens[2],        // 8px
    gapMd: spacingTokens[4],        // 16px
    gapLg: spacingTokens[6],        // 24px
    gapXl: spacingTokens[8],        // 32px
  },

  /**
   * Layout Spacing
   */
  layout: {
    // Section spacing
    sectionGap: spacingTokens[12],   // 48px
    sectionPadding: spacingTokens[8], // 32px
    
    // Container padding
    containerPaddingXs: spacingTokens[4],  // 16px (mobile)
    containerPaddingSm: spacingTokens[6],  // 24px (tablet)
    containerPaddingMd: spacingTokens[8],  // 32px (desktop)
    containerPaddingLg: spacingTokens[12], // 48px (large desktop)
    
    // Page margins
    pageMarginTop: spacingTokens[8],    // 32px
    pageMarginBottom: spacingTokens[12], // 48px
  },

  /**
   * Bento Grid Spacing
   * For modular dashboard layouts
   */
  bentoGrid: {
    // Gap between cards
    gapMobile: spacingTokens[4],     // 16px
    gapTablet: spacingTokens[6],     // 24px
    gapDesktop: spacingTokens[8],    // 32px
    
    // Card padding
    cardPaddingMobile: spacingTokens[4],  // 16px
    cardPaddingTablet: spacingTokens[6],  // 24px
    cardPaddingDesktop: spacingTokens[8], // 32px
  },

  /**
   * Touch Targets
   * Minimum sizes for interactive elements
   */
  touchTarget: {
    minimum: spacingTokens[11],      // 44px (WCAG minimum)
    comfortable: spacingTokens[12],  // 48px (recommended)
    spacious: spacingTokens[14],     // 56px (large buttons)
  },

  /**
   * Icon Spacing
   */
  icon: {
    // Icon sizes
    xs: spacingTokens[3],   // 12px
    sm: spacingTokens[4],   // 16px
    md: spacingTokens[5],   // 20px
    lg: spacingTokens[6],   // 24px
    xl: spacingTokens[8],   // 32px
    xxl: spacingTokens[12], // 48px
    
    // Icon padding (inside buttons)
    padding: spacingTokens[2], // 8px
  },
} as const;

/**
 * Spacing Utility Functions
 */

export function getSpacing(value: keyof typeof spacingTokens): string {
  return spacingTokens[value];
}

export function multiplySpacing(value: keyof typeof spacingTokens, multiplier: number): string {
  const baseValue = parseFloat(spacingTokens[value]);
  return `${baseValue * multiplier}rem`;
}

export function addSpacing(...values: (keyof typeof spacingTokens)[]): string {
  const total = values.reduce((sum: number, key) => {
    const value = spacingTokens[key];
    const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    return sum + numericValue;
  }, 0);
  return `${total}rem`;
}

/**
 * Responsive Spacing
 * Breakpoint-specific spacing values
 */
export const responsiveSpacing = {
  mobile: {
    containerPadding: semanticSpacing.layout.containerPaddingXs,
    sectionGap: spacingTokens[8],
    bentoGap: semanticSpacing.bentoGrid.gapMobile,
  },
  tablet: {
    containerPadding: semanticSpacing.layout.containerPaddingSm,
    sectionGap: spacingTokens[10],
    bentoGap: semanticSpacing.bentoGrid.gapTablet,
  },
  desktop: {
    containerPadding: semanticSpacing.layout.containerPaddingMd,
    sectionGap: spacingTokens[12],
    bentoGap: semanticSpacing.bentoGrid.gapDesktop,
  },
  largeDesktop: {
    containerPadding: semanticSpacing.layout.containerPaddingLg,
    sectionGap: spacingTokens[16],
    bentoGap: spacingTokens[10],
  },
} as const;

/**
 * Type Exports
 */
export type SpacingToken = typeof spacingTokens;
export type SpacingKey = keyof typeof spacingTokens;
export type SemanticSpacing = typeof semanticSpacing;
