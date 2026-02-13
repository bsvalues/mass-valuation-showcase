/**
 * TerraFusion OS Design Tokens
 * 
 * Central export for all design tokens.
 * Import from this file to access the complete token system.
 * 
 * Usage:
 * ```typescript
 * import { colorTokens, motionTokens, spacingTokens, typographyTokens } from '@/tokens';
 * ```
 */

export * from './colors';
export * from './motion';
export * from './spacing';
export * from './typography';

/**
 * Token Version
 * Increment when making breaking changes to token structure
 */
export const DESIGN_TOKEN_VERSION = '1.0.0';

/**
 * Token Metadata
 */
export const tokenMetadata = {
  version: DESIGN_TOKEN_VERSION,
  lastUpdated: '2026-02-13',
  designSystem: 'TerraFusion OS',
  baseUnit: '8px',
  colorMode: 'dark',
} as const;
