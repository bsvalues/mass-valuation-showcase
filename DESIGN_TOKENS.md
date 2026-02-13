# TerraFusion OS Design Token System

**Version:** 1.0.0  
**Last Updated:** 2026-02-13  
**Status:** ✅ Implemented (Phase 1 Complete)

---

## Overview

The TerraFusion OS Design Token System establishes a "visual constitution" that governs all design decisions in the Mass Valuation Showcase. This system ensures consistency, maintainability, and alignment with TerraFusion OS design principles.

### Core Principles

1. **Tokens as Single Source of Truth** - All visual values flow from centralized tokens
2. **Material Hierarchy** - Four-layer system (OS Chrome, Data Walls, Content, Signal)
3. **8px Base Grid** - All spacing derives from 8px increments
4. **Semantic Naming** - Tokens describe purpose, not appearance
5. **Responsive by Default** - Mobile-first with breakpoint-specific values

---

## Token Categories

### 1. Color Tokens

#### Liquid Glass Tints (OS Chrome Only)
```css
--color-glass-1: rgba(255, 255, 255, 0.05)
--color-glass-2: rgba(255, 255, 255, 0.10)
--color-glass-3: rgba(255, 255, 255, 0.15)
--color-glass-4: rgba(255, 255, 255, 0.20)
```

**Usage:**  
Reserved for navigation chrome, command palette, and system UI. Never use for content areas.

```tsx
// ✅ Correct - OS Chrome
<div className="bg-[var(--color-glass-2)] backdrop-blur-xl">
  <CommandPalette />
</div>

// ❌ Wrong - Content area
<Card className="bg-[var(--color-glass-2)]">
  Data content
</Card>
```

#### Government Night Palette
```css
--color-government-night-base: #0A0E1A
--color-government-night-elevated: #141824
--color-government-night-surface: #1E2330
--color-government-night-border: #2A3040
```

**Usage:**  
Primary background colors for Data Walls and content surfaces.

```tsx
// ✅ Correct
<Card className="bg-[var(--color-government-night-surface)]">
  Appeal data
</Card>
```

#### Signal Layer (Cyber-Gradients)
```css
--color-signal-primary: #00FFEE      /* Cyan - Primary actions */
--color-signal-secondary: #00D9D9    /* Cyan dark - Secondary actions */
--color-signal-alert: #FF3366        /* Red - Destructive/urgent */
--color-signal-success: #00FF88      /* Green - Success states */
--color-signal-warning: #FFB800      /* Gold - Warnings */
```

**Usage:**  
Reserved for **commitment actions only** (submit, delete, approve). Never use for decorative purposes.

```tsx
// ✅ Correct - Commitment action
<Button className="bg-[var(--color-signal-primary)]">
  Submit Appeal
</Button>

// ❌ Wrong - Decorative use
<Badge className="bg-[var(--color-signal-primary)]">
  Status: Pending
</Badge>
```

#### Text Colors
```css
--color-text-primary: #FFFFFF
--color-text-secondary: rgba(255, 255, 255, 0.70)
--color-text-tertiary: rgba(255, 255, 255, 0.50)
--color-text-disabled: rgba(255, 255, 255, 0.30)
```

**Hierarchy:**  
- **Primary:** Headings, critical data
- **Secondary:** Body text, labels
- **Tertiary:** Captions, metadata
- **Disabled:** Inactive states

---

### 2. Spacing Tokens

**Base Unit:** 8px (0.5rem)

```typescript
import { spacingTokens } from '@/tokens/spacing';

// Core scale
spacingTokens[2]   // 8px  - base unit
spacingTokens[4]   // 16px - standard padding
spacingTokens[6]   // 24px - section gaps
spacingTokens[8]   // 32px - large spacing
spacingTokens[11]  // 44px - minimum touch target (WCAG)
spacingTokens[12]  // 48px - comfortable touch target
```

#### Semantic Spacing

```typescript
import { semanticSpacing } from '@/tokens/spacing';

// Component spacing
semanticSpacing.component.paddingMd  // 16px
semanticSpacing.component.gapMd      // 16px

// Layout spacing
semanticSpacing.layout.sectionGap    // 48px
semanticSpacing.layout.containerPaddingMd  // 32px

// Touch targets
semanticSpacing.touchTarget.minimum  // 44px (WCAG AA)
semanticSpacing.touchTarget.comfortable  // 48px
```

#### Usage Examples

```tsx
// ✅ Correct - Using spacing tokens
<div className="p-4 gap-6">  {/* 16px padding, 24px gap */}
  <Card className="mb-8">    {/* 32px margin-bottom */}
    Content
  </Card>
</div>

// ❌ Wrong - Hardcoded values
<div style={{ padding: '20px', gap: '25px' }}>
  Content
</div>
```

---

### 3. Typography Tokens

**Font Families:**
```css
--font-sans: "Inter", system-ui, sans-serif
--font-mono: "JetBrains Mono", monospace
--font-display: "Inter", sans-serif
```

#### Kinetic Type Scale

```typescript
import { semanticTypography } from '@/tokens/typography';

// Headings
semanticTypography.h1  // 32px mobile → 40px desktop
semanticTypography.h2  // 24px mobile → 32px desktop
semanticTypography.h3  // 20px mobile → 24px desktop
semanticTypography.h4  // 18px mobile → 20px desktop

// Body
semanticTypography.body       // 16px (base)
semanticTypography.bodyLarge  // 18px (emphasis)
semanticTypography.bodySmall  // 14px (captions)
```

#### Usage Examples

```tsx
// ✅ Correct - Semantic HTML with automatic styling
<h1>Appeal Management</h1>  {/* Auto-applies h1 token styles */}
<h2>Recent Appeals</h2>     {/* Auto-applies h2 token styles */}
<p>Body text content</p>    {/* Auto-applies body token styles */}

// ✅ Correct - Manual token application
<div className="text-[var(--font-size-h2-mobile)] md:text-[var(--font-size-h2-desktop)]">
  Custom heading
</div>

// ❌ Wrong - Hardcoded sizes
<h1 className="text-[32px]">Title</h1>
```

---

### 4. Motion Tokens

**Durations:**
```css
--duration-instant: 0ms
--duration-fast: 150ms
--duration-normal: 300ms
--duration-slow: 500ms
--duration-slower: 700ms
```

**Easing Functions:**
```css
--easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1)
--easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1)
--easing-accelerate: cubic-bezier(0.4, 0.0, 1, 1)
--easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

#### Usage Examples

```tsx
// ✅ Correct - Token-based transitions
<Button className="transition-transform duration-[var(--duration-fast)] ease-[var(--easing-bounce)]">
  Click me
</Button>

// ✅ Correct - Tactile physics (commitment actions only)
<Button className="tactile-button">
  Submit Appeal
</Button>

// ❌ Wrong - Hardcoded animation
<div style={{ transition: 'all 0.3s ease-in-out' }}>
  Content
</div>
```

---

## Material Hierarchy

### Layer 1: OS Chrome (Liquid Glass)
- **Purpose:** Navigation, command palette, system UI
- **Colors:** `--color-glass-*` only
- **Backdrop:** `blur(24px) saturate(180%)`

```tsx
<nav className="liquid-glass">
  <CommandPalette />
</nav>
```

### Layer 2: Data Walls (Bento Cards)
- **Purpose:** Modular data containers
- **Colors:** `--color-government-night-surface`
- **Spacing:** `semanticSpacing.bentoGrid.*`

```tsx
<div className="bento-card">
  <h3>Appeal Statistics</h3>
  <Chart data={stats} />
</div>
```

### Layer 3: Content
- **Purpose:** Text, forms, tables
- **Colors:** `--color-text-*`
- **Typography:** Semantic heading tags

```tsx
<article>
  <h2>Appeal Details</h2>
  <p className="text-[var(--color-text-secondary)]">
    Submitted on {date}
  </p>
</article>
```

### Layer 4: Signal
- **Purpose:** Commitment actions, alerts
- **Colors:** `--color-signal-*` only
- **Motion:** Tactile physics

```tsx
<Button className="bg-[var(--color-signal-primary)] tactile-button">
  Approve Appeal
</Button>
```

---

## Enforcement Rules

### ESLint Rules

The project includes `.eslintrc.token-enforcement.json` with the following rules:

1. **No hex colors** - Use tokens instead
2. **No hardcoded px values** - Use spacing tokens
3. **No inline styles** - Use Tailwind classes
4. **No direct CSS imports** - Tokens are global

### Stylelint Rules

The project includes `.stylelintrc.json` with:

1. **No hex colors outside @theme** - Use CSS variables
2. **No hardcoded spacing** - Use `var(--spacing-*)`
3. **Custom property naming** - Must follow `--{category}-{name}`

---

## Migration Guide

### Replacing Hardcoded Colors

```tsx
// Before
<div style={{ backgroundColor: '#00FFEE' }}>

// After
<div className="bg-[var(--color-signal-primary)]">
```

### Replacing Hardcoded Spacing

```tsx
// Before
<div style={{ padding: '16px', gap: '24px' }}>

// After
<div className="p-4 gap-6">  {/* Uses spacingTokens[4] and spacingTokens[6] */}
```

### Replacing Hardcoded Typography

```tsx
// Before
<h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>

// After
<h1>  {/* Auto-applies h1 token styles */}
```

---

## Token Reference Files

| File | Purpose |
|------|---------|
| `client/src/tokens/colors.ts` | Color token definitions and utilities |
| `client/src/tokens/spacing.ts` | Spacing scale and semantic spacing |
| `client/src/tokens/typography.ts` | Type scales and font definitions |
| `client/src/tokens/motion.ts` | Duration and easing functions |
| `client/src/index.css` | CSS variable mappings (Tailwind v4) |

---

## Best Practices

### ✅ DO

- Use semantic HTML tags (`<h1>`, `<h2>`, `<p>`) for automatic token application
- Use Tailwind utility classes with token-based values
- Import tokens from `@/tokens` for programmatic use
- Follow the 8px spacing grid for all layouts
- Reserve Signal colors for commitment actions only

### ❌ DON'T

- Use hex colors, RGB, or HSL values directly
- Hardcode pixel values for spacing
- Create custom CSS classes for spacing/colors
- Use inline styles for visual properties
- Apply Signal colors decoratively

---

## Compliance Checklist

- [x] Color tokens defined
- [x] Spacing tokens defined (8px grid)
- [x] Typography tokens defined (Kinetic Type)
- [x] Motion tokens defined (Tactile physics)
- [x] CSS variables integrated (Tailwind v4)
- [x] ESLint rules configured
- [x] Stylelint rules configured
- [x] Documentation complete

---

## Next Steps (Phase 2)

1. **Command Palette (⌘K)** - Universal navigation
2. **Dock + Stage Architecture** - Replace sidebar navigation
3. **System Bar** - Top-level status and controls

---

## Support

For questions or token requests, refer to:
- TerraFusion OS Design Manifesto
- Material Design Masterclass
- Human Logic of Interface Design

**Token Version:** 1.0.0  
**Compliance:** TerraFusion OS Phase 1 Complete ✅
