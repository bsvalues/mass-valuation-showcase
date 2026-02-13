/**
 * TerraFusion OS Color Tokens
 * 
 * This file defines the complete color palette for the TerraFusion OS design system.
 * All colors must be referenced through these tokens - no ad-hoc color values allowed.
 * 
 * Material Hierarchy:
 * - Liquid Glass: Tinted transparent surfaces for OS chrome
 * - Government Night: Dark base palette for backgrounds
 * - Signal: Cyber-gradients for system states and alerts
 * - Semantic: Functional colors for success, warning, error states
 */

export const colorTokens = {
  /**
   * Liquid Glass Tints
   * Reserved for OS-level surfaces only (Top Bar, Dock, Modals)
   * NEVER use for data walls or dense tables
   */
  glass: {
    1: 'rgba(255, 255, 255, 0.05)',
    2: 'rgba(255, 255, 255, 0.10)',
    3: 'rgba(255, 255, 255, 0.15)',
    4: 'rgba(255, 255, 255, 0.20)',
  },

  /**
   * Government Night Palette
   * Core background system for dark mode
   */
  governmentNight: {
    base: '#0A0E1A',      // Deepest background
    elevated: '#141824',   // Elevated surfaces
    surface: '#1E2330',    // Interactive surfaces
    border: '#2A3040',     // Subtle borders
  },

  /**
   * Signal Layer - Cyber-Gradients
   * For system states, alerts, and kinetic type
   * Use sparingly - signal, not theme
   */
  signal: {
    // Primary TerraFusion cyan
    primary: '#00FFEE',
    primaryDark: '#00D4FF',
    
    // Secondary accent
    secondary: '#00D9D9',
    secondaryDark: '#00B8B8',
    
    // Alert states
    alert: '#FF3366',
    alertDark: '#CC2952',
    
    // Success states
    success: '#00FF88',
    successDark: '#00CC6E',
    
    // Warning states
    warning: '#FFB800',
    warningDark: '#CC9300',
  },

  /**
   * Semantic Colors
   * Functional colors for UI states
   */
  semantic: {
    success: {
      base: '#00FF88',
      light: '#33FFAA',
      dark: '#00CC6E',
      subtle: 'rgba(0, 255, 136, 0.1)',
    },
    warning: {
      base: '#FFB800',
      light: '#FFC633',
      dark: '#CC9300',
      subtle: 'rgba(255, 184, 0, 0.1)',
    },
    error: {
      base: '#FF3366',
      light: '#FF5C85',
      dark: '#CC2952',
      subtle: 'rgba(255, 51, 102, 0.1)',
    },
    info: {
      base: '#00D4FF',
      light: '#33DDFF',
      dark: '#00A9CC',
      subtle: 'rgba(0, 212, 255, 0.1)',
    },
  },

  /**
   * Text Colors
   * Hierarchy for typography
   */
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.70)',
    tertiary: 'rgba(255, 255, 255, 0.50)',
    disabled: 'rgba(255, 255, 255, 0.30)',
    inverse: '#0A0E1A',
  },

  /**
   * Chart Colors
   * For data visualization (Bento Grid layer)
   */
  chart: {
    1: '#00FFEE',  // Primary cyan
    2: '#FF3366',  // Alert red
    3: '#FFB800',  // Warning amber
    4: '#00FF88',  // Success green
    5: '#00D4FF',  // Info blue
    6: '#B366FF',  // Purple accent
  },

  /**
   * Material Layer Indicators
   * For development/debugging - shows which material layer is active
   */
  materialDebug: {
    liquidGlass: '#00FFEE',
    bentoGrid: '#FFB800',
    tactile: '#FF3366',
    signal: '#00FF88',
  },
} as const;

/**
 * Color Utility Functions
 */

export function withOpacity(color: string, opacity: number): string {
  // Convert hex to rgba with opacity
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function getGradient(from: string, to: string, direction: 'to-r' | 'to-b' | 'to-br' = 'to-r'): string {
  return `linear-gradient(${direction}, ${from}, ${to})`;
}

/**
 * Pre-defined Gradients
 * Cyber-gradient combinations for Signal layer
 */
export const gradients = {
  cyberPrimary: getGradient(colorTokens.signal.primary, colorTokens.signal.primaryDark),
  cyberSecondary: getGradient(colorTokens.signal.secondary, colorTokens.signal.secondaryDark),
  cyberAlert: getGradient(colorTokens.signal.alert, colorTokens.signal.alertDark),
  cyberSuccess: getGradient(colorTokens.signal.success, colorTokens.signal.successDark),
  governmentNight: getGradient(colorTokens.governmentNight.base, colorTokens.governmentNight.elevated, 'to-b'),
} as const;

/**
 * Type Exports
 */
export type ColorToken = typeof colorTokens;
export type GlassVariant = keyof typeof colorTokens.glass;
export type SignalColor = keyof typeof colorTokens.signal;
export type SemanticColor = keyof typeof colorTokens.semantic;
