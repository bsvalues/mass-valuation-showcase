/**
 * TerraFusion OS Typography Tokens
 * 
 * Kinetic Type system with responsive scales and hierarchy.
 * 
 * Principles:
 * - Clear hierarchy (6 levels: Display, H1-H4, Body)
 * - Responsive sizing (mobile → desktop)
 * - Optimal line heights for readability
 * - Tight letter spacing for headings
 */

export const typographyTokens = {
  /**
   * Font Families
   */
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
    display: '"Inter", sans-serif', // Can be customized for brand
  },

  /**
   * Font Sizes
   * Mobile-first, scales up at breakpoints
   */
  fontSize: {
    // Display (hero text)
    display: {
      mobile: '2.5rem',    // 40px
      tablet: '3rem',      // 48px
      desktop: '3.5rem',   // 56px
    },
    
    // Heading 1
    h1: {
      mobile: '2rem',      // 32px
      tablet: '2.25rem',   // 36px
      desktop: '2.5rem',   // 40px
    },
    
    // Heading 2
    h2: {
      mobile: '1.5rem',    // 24px
      tablet: '1.75rem',   // 28px
      desktop: '2rem',     // 32px
    },
    
    // Heading 3
    h3: {
      mobile: '1.25rem',   // 20px
      tablet: '1.375rem',  // 22px
      desktop: '1.5rem',   // 24px
    },
    
    // Heading 4
    h4: {
      mobile: '1.125rem',  // 18px
      tablet: '1.125rem',  // 18px
      desktop: '1.25rem',  // 20px
    },
    
    // Body text
    body: {
      large: '1.125rem',   // 18px
      base: '1rem',        // 16px
      small: '0.875rem',   // 14px
      xs: '0.75rem',       // 12px
    },
  },

  /**
   * Line Heights
   * Optimized for readability
   */
  lineHeight: {
    tight: '1.1',        // Headings
    snug: '1.25',        // Subheadings
    normal: '1.5',       // Body text
    relaxed: '1.75',     // Long-form content
    loose: '2',          // Spacious layouts
  },

  /**
   * Font Weights
   */
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  /**
   * Letter Spacing
   * Tighter for headings, normal for body
   */
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

/**
 * Semantic Typography Styles
 * Pre-configured combinations for common use cases
 */
export const semanticTypography = {
  /**
   * Display Text (Hero sections)
   */
  display: {
    fontSize: typographyTokens.fontSize.display,
    lineHeight: typographyTokens.lineHeight.tight,
    fontWeight: typographyTokens.fontWeight.bold,
    letterSpacing: typographyTokens.letterSpacing.tight,
    fontFamily: typographyTokens.fontFamily.display,
  },

  /**
   * Headings
   */
  h1: {
    fontSize: typographyTokens.fontSize.h1,
    lineHeight: typographyTokens.lineHeight.tight,
    fontWeight: typographyTokens.fontWeight.bold,
    letterSpacing: typographyTokens.letterSpacing.tight,
    fontFamily: typographyTokens.fontFamily.sans,
  },
  h2: {
    fontSize: typographyTokens.fontSize.h2,
    lineHeight: typographyTokens.lineHeight.snug,
    fontWeight: typographyTokens.fontWeight.semibold,
    letterSpacing: typographyTokens.letterSpacing.tight,
    fontFamily: typographyTokens.fontFamily.sans,
  },
  h3: {
    fontSize: typographyTokens.fontSize.h3,
    lineHeight: typographyTokens.lineHeight.snug,
    fontWeight: typographyTokens.fontWeight.semibold,
    letterSpacing: typographyTokens.letterSpacing.normal,
    fontFamily: typographyTokens.fontFamily.sans,
  },
  h4: {
    fontSize: typographyTokens.fontSize.h4,
    lineHeight: typographyTokens.lineHeight.normal,
    fontWeight: typographyTokens.fontWeight.medium,
    letterSpacing: typographyTokens.letterSpacing.normal,
    fontFamily: typographyTokens.fontFamily.sans,
  },

  /**
   * Body Text
   */
  bodyLarge: {
    fontSize: typographyTokens.fontSize.body.large,
    lineHeight: typographyTokens.lineHeight.relaxed,
    fontWeight: typographyTokens.fontWeight.normal,
    letterSpacing: typographyTokens.letterSpacing.normal,
    fontFamily: typographyTokens.fontFamily.sans,
  },
  body: {
    fontSize: typographyTokens.fontSize.body.base,
    lineHeight: typographyTokens.lineHeight.normal,
    fontWeight: typographyTokens.fontWeight.normal,
    letterSpacing: typographyTokens.letterSpacing.normal,
    fontFamily: typographyTokens.fontFamily.sans,
  },
  bodySmall: {
    fontSize: typographyTokens.fontSize.body.small,
    lineHeight: typographyTokens.lineHeight.normal,
    fontWeight: typographyTokens.fontWeight.normal,
    letterSpacing: typographyTokens.letterSpacing.normal,
    fontFamily: typographyTokens.fontFamily.sans,
  },
  caption: {
    fontSize: typographyTokens.fontSize.body.xs,
    lineHeight: typographyTokens.lineHeight.normal,
    fontWeight: typographyTokens.fontWeight.normal,
    letterSpacing: typographyTokens.letterSpacing.wide,
    fontFamily: typographyTokens.fontFamily.sans,
  },

  /**
   * Special Purpose
   */
  code: {
    fontSize: typographyTokens.fontSize.body.small,
    lineHeight: typographyTokens.lineHeight.normal,
    fontWeight: typographyTokens.fontWeight.normal,
    letterSpacing: typographyTokens.letterSpacing.normal,
    fontFamily: typographyTokens.fontFamily.mono,
  },
  label: {
    fontSize: typographyTokens.fontSize.body.small,
    lineHeight: typographyTokens.lineHeight.normal,
    fontWeight: typographyTokens.fontWeight.medium,
    letterSpacing: typographyTokens.letterSpacing.wide,
    fontFamily: typographyTokens.fontFamily.sans,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontSize: typographyTokens.fontSize.body.base,
    lineHeight: typographyTokens.lineHeight.tight,
    fontWeight: typographyTokens.fontWeight.semibold,
    letterSpacing: typographyTokens.letterSpacing.wide,
    fontFamily: typographyTokens.fontFamily.sans,
  },
} as const;

/**
 * Typography Utility Functions
 */

export function getResponsiveFontSize(
  level: 'display' | 'h1' | 'h2' | 'h3' | 'h4',
  breakpoint: 'mobile' | 'tablet' | 'desktop'
): string {
  return typographyTokens.fontSize[level][breakpoint];
}

export function getTypographyStyle(variant: keyof typeof semanticTypography) {
  return semanticTypography[variant];
}

/**
 * Kinetic Type Animation
 * For Signal layer - use sparingly
 */
export const kineticType = {
  // Gradient text animation
  gradient: {
    backgroundImage: 'linear-gradient(90deg, #00FFEE, #00D4FF, #00FFEE)',
    backgroundSize: '200% auto',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'gradientShift 3s ease infinite',
  },
  
  // Pulse animation (for alerts)
  pulse: {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
  
  // Glow effect (for hero text)
  glow: {
    textShadow: '0 0 20px rgba(0, 255, 238, 0.5), 0 0 40px rgba(0, 255, 238, 0.3)',
  },
} as const;

/**
 * Type Exports
 */
export type TypographyToken = typeof typographyTokens;
export type SemanticTypographyVariant = keyof typeof semanticTypography;
export type FontSize = keyof typeof typographyTokens.fontSize;
export type FontWeight = keyof typeof typographyTokens.fontWeight;
export type LineHeight = keyof typeof typographyTokens.lineHeight;
export type LetterSpacing = keyof typeof typographyTokens.letterSpacing;
