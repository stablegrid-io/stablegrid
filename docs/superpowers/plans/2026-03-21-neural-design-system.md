# Neural Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing UI foundation with the Neural Command design system from Stitch — dark-only, 0px corners, glass panels, L-brackets, segmented progress bars, and a new sidebar/topbar navigation.

**Architecture:** Tailwind token swap + globals.css rewrite for the foundation layer. Fresh `components/ui/` primitives built from Stitch HTML patterns. New sidebar + topbar navigation replaces the current collapsible rail. Theme toggling infrastructure removed entirely (dark-only with hardcoded `dark` class on `<html>`).

**Tech Stack:** Next.js 14, Tailwind CSS 3.4, React 18, Lucide React (icons), Zustand (state)

**Spec:** `docs/superpowers/specs/2026-03-21-neural-design-system-design.md`

---

### Task 1: Tailwind Config Token Replacement

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add Stitch color tokens alongside existing colors**

In `tailwind.config.ts`, add all Stitch color tokens as flat keys in `theme.extend.colors`. Keep existing `brand`, `success`, `warning`, `error`, `light`, `dark`, `text` palettes for backward compatibility.

Add these new keys to the `colors` object:

```ts
// Neural Command design tokens (from Stitch)
"background": "#0c0e10",
"surface": "#0c0e10",
"surface-container-lowest": "#000000",
"surface-container-low": "#111416",
"surface-container": "#171a1c",
"surface-container-high": "#1d2023",
"surface-container-highest": "#232629",
"surface-bright": "#292c30",
"surface-variant": "#232629",
"surface-dim": "#0c0e10",
"surface-tint": "#99f7ff",
"primary": "#99f7ff",
"primary-dim": "#00e2ee",
"primary-container": "#00f1fe",
"primary-fixed": "#00f1fe",
"primary-fixed-dim": "#00e2ee",
"on-primary": "#005f64",
"on-primary-container": "#00555a",
"on-primary-fixed": "#004145",
"on-primary-fixed-variant": "#006065",
"secondary": "#bf81ff",
"secondary-dim": "#9c42f4",
"secondary-container": "#7701d0",
"secondary-fixed": "#e4c6ff",
"secondary-fixed-dim": "#dab4ff",
"on-secondary": "#32005c",
"on-secondary-container": "#f0dcff",
"on-secondary-fixed": "#4e008a",
"on-secondary-fixed-variant": "#7500cc",
"tertiary": "#ffc965",
"tertiary-dim": "#ecaa00",
"tertiary-container": "#feb700",
"tertiary-fixed": "#feb700",
"tertiary-fixed-dim": "#ecaa00",
"on-tertiary": "#5f4200",
"on-tertiary-container": "#533a00",
"on-tertiary-fixed": "#392700",
"on-tertiary-fixed-variant": "#5f4200",
"error": "#ff716c",
"error-dim": "#d7383b",
"error-container": "#9f0519",
"on-error": "#490006",
"on-error-container": "#ffa8a3",
"on-surface": "#f0f0f3",
"on-surface-variant": "#aaabae",
"on-background": "#f0f0f3",
"outline": "#747578",
"outline-variant": "#46484a",
"inverse-primary": "#006a70",
"inverse-surface": "#f9f9fc",
"inverse-on-surface": "#535558",
```

**IMPORTANT — `error` token conflict:** The existing `error` key is an object with shades `50`-`900`. Adding a flat `"error": "#ff716c"` would **replace** the object entirely, breaking all `error-500`, `error-200` etc. references across 10+ components. **Fix:** Convert the existing `error` object to include a `DEFAULT` key so both `bg-error` and `bg-error-500` work:

```ts
error: {
  DEFAULT: '#ff716c',  // Neural Command flat value
  50: '#fef2f2',       // Keep existing shades
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d'
},
```

This way `bg-error` resolves to `#ff716c` (Stitch) while `bg-error-500` still resolves to `#ef4444` (legacy). Same pattern is safe for `secondary` and `tertiary` — the existing config has no `secondary` or `tertiary` objects, so the flat keys are fine.

- [ ] **Step 2: Override border radius to 0px**

Replace the existing `borderRadius` in `theme.extend`:

```ts
borderRadius: {
  none: '0',
  sm: '0px',
  DEFAULT: '0px',
  md: '0px',
  lg: '0px',
  xl: '0px',
  '2xl': '0px',
  '3xl': '0px',
  full: '9999px'
},
```

- [ ] **Step 3: Add font families matching Stitch**

Update `fontFamily` in `theme.extend`:

```ts
fontFamily: {
  sans: ['Inter', 'var(--font-sans)', 'system-ui', 'sans-serif'],
  serif: ['var(--font-serif)', 'Georgia', 'serif'],
  mono: ['JetBrains Mono', 'var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
  headline: ['Space Grotesk', 'var(--font-sans)', 'system-ui', 'sans-serif'],
  body: ['Inter', 'var(--font-sans)', 'system-ui', 'sans-serif'],
  label: ['Space Grotesk', 'var(--font-sans)', 'system-ui', 'sans-serif'],
  'data-mono': ['JetBrains Mono', 'var(--font-mono)', 'ui-monospace', 'monospace']
},
```

- [ ] **Step 4: Verify build succeeds**

Run: `npx next build 2>&1 | tail -5` (or `npm run build`)
Expected: Build succeeds (may show warnings from existing pages using old tokens, but no hard failures).

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: add Neural Command design tokens to Tailwind config"
```

---

### Task 2: globals.css Rewrite

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace CSS variables and base layer**

Replace the `:root` and `.dark` variable blocks and body styles. The new body uses dark-only styles directly. Replace the current grid background (54px) with Stitch's pattern (applied via overlay divs, not on body). Keep the `html:has(#grid-flow)` lock rule. Keep scrollbar styling but update colors.

Replace everything in `@layer base { ... }` with:

```css
@layer base {
  :root {
    --font-sans: 'Inter', 'Avenir Next', 'Segoe UI', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
    --font-serif: 'DM Serif Display', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif;
  }

  html,
  body {
    height: 100%;
  }

  html:has(#grid-flow[data-intro-lock='true']),
  body:has(#grid-flow[data-intro-lock='true']) {
    overflow: hidden;
    touch-action: none;
    overscroll-behavior: none;
  }

  body {
    @apply font-sans antialiased;
    font-feature-settings: 'cv11', 'ss01', 'ss02', 'ss03', 'ss04';
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #0c0e10;
    color: #f0f0f3;
  }

  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #46484a;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: #747578;
  }

  ::selection {
    background-color: rgba(153, 247, 255, 0.2);
    color: #f0f0f3;
  }

  button:focus {
    outline: none;
  }

  :where(a, button, input, textarea, select, [role='button'], [tabindex]):focus {
    outline: none;
  }

  :where(a, button, input, textarea, select, [role='button'], [tabindex]):focus-visible {
    @apply ring-2 ring-offset-2;
    --tw-ring-color: #00e2ee;
    --tw-ring-offset-color: #0c0e10;
  }

  button:focus-visible {
    @apply ring-2 ring-offset-2;
    --tw-ring-color: #00e2ee;
    --tw-ring-offset-color: #0c0e10;
  }

  :disabled {
    @apply opacity-50 cursor-not-allowed;
  }
}
```

- [ ] **Step 2: Replace components layer with Neural Command patterns**

Replace everything in `@layer components { ... }` with:

```css
@layer components {
  /* === Neural Command Background Overlays === */
  .grid-overlay {
    background-image:
      linear-gradient(to right, rgba(153, 247, 255, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(153, 247, 255, 0.05) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .scanline {
    background: linear-gradient(to bottom, transparent 50%, rgba(153, 247, 255, 0.05) 50%);
    background-size: 100% 4px;
  }

  /* === Glass Panel === */
  .glass-panel {
    backdrop-filter: blur(12px);
    background: rgba(17, 20, 22, 0.7);
  }

  /* === L-Bracket Corners (2-corner diagonal) === */
  .l-bracket {
    position: relative;
  }
  .l-bracket::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 10px;
    height: 10px;
    border-top: 2px solid currentColor;
    border-left: 2px solid currentColor;
    pointer-events: none;
  }
  .l-bracket::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    border-bottom: 2px solid currentColor;
    border-right: 2px solid currentColor;
    pointer-events: none;
  }

  /* === Single-corner L-brackets (for 4-corner compositions) === */
  .l-corner {
    position: absolute;
    width: 10px;
    height: 10px;
    pointer-events: none;
  }
  .l-corner-tl { top: 0; left: 0; border-top: 2px solid currentColor; border-left: 2px solid currentColor; }
  .l-corner-tr { top: 0; right: 0; border-top: 2px solid currentColor; border-right: 2px solid currentColor; }
  .l-corner-bl { bottom: 0; left: 0; border-bottom: 2px solid currentColor; border-left: 2px solid currentColor; }
  .l-corner-br { bottom: 0; right: 0; border-bottom: 2px solid currentColor; border-right: 2px solid currentColor; }

  /* === Color-specific L-brackets (top-left only, used with w-4 h-4 divs) === */
  .l-bracket-teal  { border-left: 2px solid #99f7ff; border-top: 2px solid #99f7ff; }
  .l-bracket-red   { border-left: 2px solid #ff716c; border-top: 2px solid #ff716c; }
  .l-bracket-amber { border-left: 2px solid #ffc965; border-top: 2px solid #ffc965; }

  /* === Glow effects === */
  .glow-primary {
    box-shadow: 0 0 15px rgba(0, 242, 255, 0.4);
  }

  .neural-node {
    box-shadow: 0 0 15px #00F2FF, inset 0 0 5px #00F2FF;
  }

  /* === Legacy compat: keep data-mono for existing components === */
  .data-mono {
    font-family: 'JetBrains Mono', var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
}
```

- [ ] **Step 3: Update utilities layer**

Replace `@layer utilities { ... }` with:

```css
@layer utilities {
  .transition-smooth {
    @apply transition-all duration-150 ease-out;
  }

  .scrollbar-slim::-webkit-scrollbar {
    width: 8px;
  }

  .scrollbar-slim::-webkit-scrollbar-thumb {
    background-color: #46484a;
  }

  .scrollbar-slim::-webkit-scrollbar-track {
    @apply bg-transparent;
  }
}
```

- [ ] **Step 4: Keep non-layer styles at the bottom**

Keep these styles exactly as-is below the `@layer` blocks — they are not part of the design system change:

- `@supports (padding-bottom: env(safe-area-inset-bottom)) { .h-safe-bottom { ... } }` — **must keep**, the new BottomNav uses `h-safe-bottom`
- `@media (prefers-reduced-motion: reduce) { ... }` — accessibility, keep
- `.progress-dashboard-editing` and all `.react-grid-*` styles — keep for dashboard layout

- [ ] **Step 5: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css
git commit -m "feat: replace globals.css with Neural Command design patterns"
```

---

### Task 3: Layout & Theme Infrastructure

**Files:**
- Modify: `app/layout.tsx`
- Delete: `components/providers/ThemeProvider.tsx`
- Delete: `components/ui/ThemeToggle.tsx`
- Modify: `components/layout/Header.tsx` (remove ThemeToggle import)

- [ ] **Step 1: Update layout.tsx**

Replace the full content of `app/layout.tsx`:

```tsx
import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { CookieConsentManager } from '@/components/cookies/CookieConsentManager';
import { Navigation } from '@/components/navigation/Navigation';

export const metadata: Metadata = {
  title: 'stableGrid',
  description:
    'Earn kWh deployment credits through data engineering tasks and deploy infrastructure to stabilize a renewable grid simulation.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg'
  }
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans text-on-surface">
        <CookieConsentManager />
        <AuthProvider>
          <Navigation>{children}</Navigation>
        </AuthProvider>
      </body>
    </html>
  );
}
```

Key changes:
- `className="dark"` hardcoded on `<html>` (preserves `dark:` prefixed classes in existing pages)
- `suppressHydrationWarning` removed
- `ThemeProvider` wrapper removed
- Google Fonts link updated with full weight ranges + Inter
- `text-text-light-primary dark:text-text-dark-primary` → `text-on-surface`
- Title → "stableGrid"

- [ ] **Step 2: Delete ThemeProvider**

Delete `components/providers/ThemeProvider.tsx`.

- [ ] **Step 3: Delete both ThemeToggle files**

Delete both:
- `components/ui/ThemeToggle.tsx`
- `components/theme/ThemeToggle.tsx`

- [ ] **Step 4: Remove ThemeToggle from Header.tsx**

`components/layout/Header.tsx` imports from `@/components/theme/ThemeToggle`. Remove the import and any `<ThemeToggle />` JSX. (Note: `Header.tsx` appears to be unused — if confirmed, delete it entirely instead of modifying.)

- [ ] **Step 5: Fix useTheme imports in existing components**

Search for `useTheme` in the main `components/` directory (not worktrees). Files that import it:
- `components/missions/UnifiedMissionExperience.tsx`
- `components/missions/GhostRegulatorMission.tsx`
- `components/auth/LoginForm.tsx`
- `components/auth/SignupForm.tsx`
- `components/dashboard/XPChart.tsx`
- `components/dashboard/ActivityChart.tsx`
- `components/workspace/CodeEditor.tsx`
- `components/CodeEditor.tsx`
- `components/practice/CodeAnswer.tsx`

For each file: remove the `useTheme` import, remove the `const { theme } = useTheme()` (or similar) line, and replace any `theme === 'dark'` conditionals with `true` (since it's always dark now). If the theme variable was only used for a ternary like `theme === 'dark' ? darkValue : lightValue`, replace the whole ternary with just `darkValue`.

This is a mechanical find-and-replace task per file — read each file, find the `useTheme` usage pattern, and hardcode the dark path.

- [ ] **Step 6: Verify build**

Run: `npx next build 2>&1 | tail -10`
Expected: Build succeeds. No imports of deleted files remain.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: remove theme toggling infrastructure, go dark-only"
```

---

### Task 4: New UI Component Library

**Files:**
- Create: `components/ui/GlassPanel.tsx`
- Create: `components/ui/LBracketCard.tsx`
- Create: `components/ui/SegmentedBar.tsx`
- Create: `components/ui/SystemLabel.tsx`
- Create: `components/ui/SolidButton.tsx`
- Create: `components/ui/GhostButton.tsx`
- Create: `components/ui/NeuralInput.tsx`
- Create: `components/ui/StatBlock.tsx`

- [ ] **Step 1: Create GlassPanel**

```tsx
// components/ui/GlassPanel.tsx
import type { ReactNode } from 'react';

type AccentColor = 'primary' | 'secondary' | 'tertiary' | 'error';

const borderColorMap: Record<AccentColor, string> = {
  primary: 'border-primary/10 hover:border-primary/30',
  secondary: 'border-secondary/10 hover:border-secondary/30',
  tertiary: 'border-tertiary/10 hover:border-tertiary/30',
  error: 'border-error/10 hover:border-error/30',
};

interface GlassPanelProps {
  accentColor?: AccentColor;
  hover?: boolean;
  className?: string;
  children: ReactNode;
}

export function GlassPanel({
  accentColor = 'primary',
  hover = true,
  className = '',
  children,
}: GlassPanelProps) {
  const borderClasses = borderColorMap[accentColor];
  const appliedBorder = hover ? borderClasses : borderClasses.split(' ')[0];

  return (
    <div
      className={`glass-panel border ${appliedBorder} p-8 relative overflow-hidden transition-all ${className}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create LBracketCard**

```tsx
// components/ui/LBracketCard.tsx
import type { ReactNode } from 'react';

interface LBracketCardProps {
  corners?: 'diagonal' | 'all';
  className?: string;
  children: ReactNode;
}

export function LBracketCard({
  corners = 'diagonal',
  className = '',
  children,
}: LBracketCardProps) {
  if (corners === 'all') {
    return (
      <div
        className={`bg-surface-container-low/40 backdrop-blur-md p-6 border border-white/5 relative overflow-hidden ${className}`}
      >
        <span className="l-corner l-corner-tl" />
        <span className="l-corner l-corner-tr" />
        <span className="l-corner l-corner-bl" />
        <span className="l-corner l-corner-br" />
        {children}
      </div>
    );
  }

  return (
    <div
      className={`bg-surface-container-low/40 backdrop-blur-md p-6 l-bracket border border-white/5 relative overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create SegmentedBar**

```tsx
// components/ui/SegmentedBar.tsx
type BarColor = 'primary' | 'secondary' | 'tertiary' | 'error';

const activeColorMap: Record<BarColor, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary',
  error: 'bg-error',
};

const inactiveColorMap: Record<BarColor, string> = {
  primary: 'bg-surface-container-highest/30 border border-primary/10',
  secondary: 'bg-surface-container-highest/30 border border-secondary/10',
  tertiary: 'bg-surface-container-highest/30 border border-tertiary/10',
  error: 'bg-surface-container-highest/30 border border-error/10',
};

interface SegmentedBarProps {
  value: number;
  segments?: number;
  color?: BarColor;
  className?: string;
}

export function SegmentedBar({
  value,
  segments = 10,
  color = 'primary',
  className = '',
}: SegmentedBarProps) {
  const activeCount = Math.round((value / 100) * segments);

  return (
    <div className={`flex gap-1 h-3 ${className}`}>
      {Array.from({ length: segments }, (_, i) => (
        <div
          key={i}
          className={`flex-1 ${i < activeCount ? activeColorMap[color] : inactiveColorMap[color]}`}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create SystemLabel**

```tsx
// components/ui/SystemLabel.tsx
import type { ReactNode } from 'react';

type LabelColor = 'primary' | 'secondary' | 'tertiary' | 'error';

const textColorMap: Record<LabelColor, string> = {
  primary: 'text-primary/60',
  secondary: 'text-secondary/60',
  tertiary: 'text-tertiary/60',
  error: 'text-error/60',
};

const dotColorMap: Record<LabelColor, string> = {
  primary: 'bg-primary shadow-[0_0_5px_#99f7ff]',
  secondary: 'bg-secondary shadow-[0_0_5px_#bf81ff]',
  tertiary: 'bg-tertiary shadow-[0_0_5px_#ffc965]',
  error: 'bg-error shadow-[0_0_5px_#ff716c]',
};

interface SystemLabelProps {
  color?: LabelColor;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

export function SystemLabel({
  color = 'primary',
  dot = false,
  className = '',
  children,
}: SystemLabelProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {dot && <div className={`w-1.5 h-1.5 ${dotColorMap[color]}`} />}
      <span className={`font-mono text-[10px] ${textColorMap[color]} tracking-widest uppercase`}>
        {children}
      </span>
    </div>
  );
}
```

- [ ] **Step 5: Create SolidButton**

```tsx
// components/ui/SolidButton.tsx
import type { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonColor = 'primary' | 'error' | 'tertiary';

const colorStyles: Record<ButtonColor, string> = {
  primary: 'bg-primary text-on-primary hover:shadow-[0_0_20px_rgba(153,247,255,0.4)]',
  error: 'bg-error text-on-error hover:shadow-[0_0_20px_rgba(255,113,108,0.4)]',
  tertiary: 'bg-tertiary text-on-tertiary hover:shadow-[0_0_20px_rgba(255,201,101,0.4)]',
};

interface SolidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor;
  fullWidth?: boolean;
  children: ReactNode;
}

export function SolidButton({
  color = 'primary',
  fullWidth = false,
  children,
  className = '',
  ...props
}: SolidButtonProps) {
  return (
    <button
      className={`font-headline font-black text-xs py-4 px-6 tracking-widest uppercase active:scale-[0.98] transition-all ${colorStyles[color]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 6: Create GhostButton**

```tsx
// components/ui/GhostButton.tsx
import type { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonColor = 'primary' | 'error' | 'tertiary';

const colorStyles: Record<ButtonColor, string> = {
  primary: 'border-primary/20 text-primary hover:bg-primary/5',
  error: 'border-error/20 text-error hover:bg-error/5',
  tertiary: 'border-tertiary/20 text-tertiary hover:bg-tertiary/5',
};

interface GhostButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor;
  fullWidth?: boolean;
  children: ReactNode;
}

export function GhostButton({
  color = 'primary',
  fullWidth = false,
  children,
  className = '',
  ...props
}: GhostButtonProps) {
  return (
    <button
      className={`border bg-transparent font-headline font-bold text-xs py-4 px-6 tracking-widest uppercase active:scale-[0.98] transition-all ${colorStyles[color]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 7: Create NeuralInput**

```tsx
// components/ui/NeuralInput.tsx
import type { InputHTMLAttributes } from 'react';

interface NeuralInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function NeuralInput({ className = '', ...props }: NeuralInputProps) {
  return (
    <input
      className={`bg-surface-container-low border-b border-outline-variant/30 text-[10px] font-mono text-primary py-1 px-4 focus:outline-none focus:border-primary transition-all placeholder:text-primary/20 ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 8: Create StatBlock**

```tsx
// components/ui/StatBlock.tsx
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatBlockProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  iconColor?: string;
  className?: string;
}

export function StatBlock({
  icon: Icon,
  label,
  value,
  iconColor = 'text-primary-dim',
  className = '',
}: StatBlockProps) {
  return (
    <div className={`p-4 border border-outline-variant bg-surface-container-low flex items-center gap-4 ${className}`}>
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <div>
        <div className="text-[10px] font-mono text-on-surface-variant uppercase">{label}</div>
        <div className="text-xl font-headline font-bold">{value}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 10: Commit**

```bash
git add components/ui/GlassPanel.tsx components/ui/LBracketCard.tsx components/ui/SegmentedBar.tsx components/ui/SystemLabel.tsx components/ui/SolidButton.tsx components/ui/GhostButton.tsx components/ui/NeuralInput.tsx components/ui/StatBlock.tsx
git commit -m "feat: add Neural Command UI component library"
```

---

### Task 5: Branding Update

**Files:**
- Modify: `components/brand/StableGridLogo.tsx`

- [ ] **Step 1: Rewrite StableGridLogo.tsx**

Replace the full content with a simplified text-only brand:

```tsx
// components/brand/StableGridLogo.tsx

interface StableGridBrandProps {
  className?: string;
}

export function StableGridBrand({ className = '' }: StableGridBrandProps) {
  return (
    <span className={`font-headline font-black text-[#99f7ff] tracking-widest ${className}`}>
      stableGrid
    </span>
  );
}

// Keep backward-compatible exports for existing code that imports StableGridIcon/Wordmark
// These will be cleaned up when individual pages are rewritten

interface StableGridIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const iconSizeMap: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
};

export function StableGridIcon({ size = 'md', className = '' }: StableGridIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center w-9 h-9 bg-surface-container border border-primary/30 text-primary ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M2.5 12h4.2l1.7-4.5 3.2 9 1.7-4.5h8.2"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function StableGridWordmark({
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  subtitle?: string;
  subtitleClassName?: string;
}) {
  return <StableGridBrand className={className} />;
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds. Existing imports of `StableGridIcon` and `StableGridWordmark` still resolve.

- [ ] **Step 3: Commit**

```bash
git add components/brand/StableGridLogo.tsx
git commit -m "feat: update branding to Neural Command text-only style"
```

---

### Task 6: Navigation Config Update

**Files:**
- Modify: `components/navigation/navigation-config.ts`

- [ ] **Step 1: Update navigation config**

The nav items stay the same (same routes, same icons), but add the `disabled` property to the interface to fix the pre-existing bug where `!item.disabled` is checked but `disabled` doesn't exist on the type:

```ts
'use client';

import {
  type LucideIcon,
  BookOpen,
  ClipboardCheck,
  Home,
  User,
  Zap
} from 'lucide-react';

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  matchPrefixes?: string[];
  disabled?: boolean;
}

export const navItems: NavItem[] = [
  { href: '/home', icon: Home, label: 'Home', matchPrefixes: ['/home', '/'] },
  {
    href: '/theory',
    icon: BookOpen,
    label: 'Theory',
    matchPrefixes: ['/theory', '/learn']
  },
  {
    href: '/assignments',
    icon: ClipboardCheck,
    label: 'Tasks',
    matchPrefixes: ['/assignments', '/tasks', '/practice', '/missions', '/flashcards']
  },
  { href: '/energy', icon: Zap, label: 'Grid' },
  { href: '/progress', icon: User, label: 'Character' }
];

export const shouldHideNav = (pathname?: string | null, isAuthenticated?: boolean) => {
  if (!pathname) return false;
  if (!isAuthenticated) {
    return true;
  }
  if (
    pathname.startsWith('/practice/') &&
    pathname !== '/practice/setup' &&
    pathname !== '/practice/notebooks'
  ) {
    return true;
  }
  return ['/login', '/signup', '/reset-password', '/update-password'].includes(pathname);
};

export const isTheoryLessonPath = (pathname?: string | null) =>
  Boolean(pathname && /^\/learn\/[^/]+\/theory\/[^/]+(?:\/)?$/.test(pathname));

export const isCompactDesktopNavPath = (pathname?: string | null) =>
  Boolean(pathname?.startsWith('/admin')) || isTheoryLessonPath(pathname);

export const isNavItemActive = (pathname: string | null, item: NavItem) =>
  Boolean(
    item.matchPrefixes
      ? item.matchPrefixes.some(
          (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
        )
      : pathname === item.href || pathname?.startsWith(`${item.href}/`)
  );
```

- [ ] **Step 2: Commit**

```bash
git add components/navigation/navigation-config.ts
git commit -m "fix: add disabled property to NavItem interface"
```

---

### Task 7: Sidebar Component

**Files:**
- Create: `components/navigation/Sidebar.tsx`

- [ ] **Step 1: Create Sidebar.tsx**

This is the main desktop sidebar. It carries forward all behavioral logic from `TopNav.tsx`: admin detection, avatar loading, route prefetching, nav hide logic, compact mode adaptation.

```tsx
// components/navigation/Sidebar.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { AdminRole } from '@/lib/admin/types';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useGridOpsStore } from '@/lib/stores/useGridOpsStore';
import { StableGridBrand, StableGridIcon } from '@/components/brand/StableGridLogo';
import {
  isNavItemActive,
  navItems,
  shouldHideNav
} from './navigation-config';

type WindowWithIdle = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

interface AdminAccessData {
  enabled: boolean;
  role: AdminRole;
}

interface ProfileAvatarResponse {
  data?: { avatarUrl?: string | null };
}

const PROFILE_AVATAR_UPDATED_EVENT = 'stablegrid:profile-avatar-updated';

const toAvatarUrl = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const toNickname = (user: SupabaseUser | null) => {
  if (!user) return 'Operator';
  const metadata = user.user_metadata ?? {};
  for (const candidate of [metadata.nickname, metadata.display_name, metadata.name, metadata.full_name]) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) return candidate.trim();
  }
  if (typeof user.email === 'string' && user.email.includes('@')) {
    const localPart = user.email.split('@')[0]?.trim();
    if (localPart) return localPart;
  }
  return 'Operator';
};

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const activeIncidentCount = useGridOpsStore((s) => s.activeIncidentCount);
  const hideNav = shouldHideNav(pathname, Boolean(user));
  const nickname = toNickname(user);

  const profileAvatarUrlRaw = user?.user_metadata?.avatar_url;
  const profileAvatarFallback =
    typeof profileAvatarUrlRaw === 'string' &&
    profileAvatarUrlRaw.trim().length > 0 &&
    !profileAvatarUrlRaw.startsWith('data:')
      ? profileAvatarUrlRaw
      : null;

  const prefetchedRoutesRef = useRef<Set<string>>(new Set());
  const [adminAccess, setAdminAccess] = useState<AdminAccessData | null>(null);
  const [hasResolvedAdminAccess, setHasResolvedAdminAccess] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const resolvedAvatarUrl = profileAvatarUrl ?? profileAvatarFallback;

  const prefetchRoute = useCallback(
    (route: string) => {
      if (prefetchedRoutesRef.current.has(route)) return;
      prefetchedRoutesRef.current.add(route);
      router.prefetch(route);
    },
    [router]
  );

  // Prefetch routes
  useEffect(() => {
    const primaryRoutes = ['/home', '/theory', '/assignments', '/progress', '/energy'];
    const secondaryRoutes = ['/settings', '/profile'];
    const prefetchPrimary = () => primaryRoutes.forEach(prefetchRoute);
    const prefetchSecondary = () => secondaryRoutes.forEach(prefetchRoute);

    const immediateId = setTimeout(prefetchPrimary, 0);
    const win = window as WindowWithIdle;

    if (typeof win.requestIdleCallback === 'function') {
      const idleId = win.requestIdleCallback(prefetchSecondary, { timeout: 1200 });
      return () => { clearTimeout(immediateId); win.cancelIdleCallback?.(idleId); };
    }
    const timeoutId = setTimeout(prefetchSecondary, 400);
    return () => { clearTimeout(immediateId); clearTimeout(timeoutId); };
  }, [prefetchRoute]);

  // Admin access
  useEffect(() => { setAdminAccess(null); setHasResolvedAdminAccess(false); }, [user?.id]);

  useEffect(() => {
    if (!user?.id || hasResolvedAdminAccess) return;
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/admin/access', { signal: ac.signal });
        if (ac.signal.aborted) return;
        if (!res.ok) { setAdminAccess(null); setHasResolvedAdminAccess(true); return; }
        const payload = (await res.json()) as { data?: AdminAccessData };
        if (ac.signal.aborted) return;
        setAdminAccess(payload?.data?.enabled ? payload.data : null);
      } catch { if (!ac.signal.aborted) setAdminAccess(null); }
      finally { if (!ac.signal.aborted) setHasResolvedAdminAccess(true); }
    })();
    return () => ac.abort();
  }, [hasResolvedAdminAccess, user?.id]);

  // Avatar loading
  useEffect(() => {
    if (!user?.id) { setProfileAvatarUrl(null); return; }
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/profile/avatar', { signal: ac.signal });
        if (ac.signal.aborted || !res.ok) return;
        const payload = (await res.json()) as ProfileAvatarResponse;
        if (!ac.signal.aborted) setProfileAvatarUrl(toAvatarUrl(payload?.data?.avatarUrl));
      } catch { /* ignore */ }
    })();
    return () => ac.abort();
  }, [user?.id]);

  // Avatar update events
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ avatarUrl?: string | null }>;
      setProfileAvatarUrl(toAvatarUrl(ce.detail?.avatarUrl));
    };
    window.addEventListener(PROFILE_AVATAR_UPDATED_EVENT, handler);
    return () => window.removeEventListener(PROFILE_AVATAR_UPDATED_EVENT, handler);
  }, []);

  if (hideNav) return null;

  const filteredItems = navItems.filter((item) => !item.disabled);

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0c0e10] border-r border-[#99f7ff]/10 flex-col pt-14 pb-6 z-40 hidden lg:flex">
      {/* User section */}
      <div className="px-6 py-6 border-b border-[#99f7ff]/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-primary/30 p-0.5 flex-shrink-0">
            {resolvedAvatarUrl ? (
              <Image
                src={resolvedAvatarUrl}
                alt="Avatar"
                width={36}
                height={36}
                unoptimized
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-surface-container flex items-center justify-center">
                <StableGridIcon size="sm" className="w-full h-full border-0" />
              </div>
            )}
          </div>
          <div>
            <div className="font-mono text-xs font-bold uppercase text-[#00F2FF]">
              {nickname}
            </div>
            <div className="font-mono text-[9px] text-primary/40">
              ONLINE
            </div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item);

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => prefetchRoute(item.href)}
              className={`flex items-center gap-4 px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-100 ${
                isActive
                  ? 'bg-[#99f7ff]/10 text-[#99f7ff] border-l-4 border-[#00F2FF] font-bold'
                  : 'text-slate-500 hover:text-[#99f7ff]/70 hover:bg-[#00F2FF]/5'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.href === '/energy' && activeIncidentCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center bg-error px-1 text-[9px] font-bold text-on-error">
                  {activeIncidentCount > 9 ? '9+' : activeIncidentCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-6 pt-4 border-t border-[#99f7ff]/10 space-y-2">
        {adminAccess?.enabled && (
          <Link
            href="/admin"
            onMouseEnter={() => prefetchRoute('/admin')}
            className="flex items-center gap-4 py-2 text-[#99f7ff]/40 hover:text-[#99f7ff] font-mono text-[10px] uppercase tracking-widest transition-colors"
          >
            <Shield className="h-4 w-4" />
            <span>Admin</span>
          </Link>
        )}
        <Link
          href="/settings"
          onMouseEnter={() => prefetchRoute('/settings')}
          className="flex items-center gap-4 py-2 text-[#99f7ff]/40 hover:text-[#99f7ff] font-mono text-[10px] uppercase tracking-widest transition-colors"
        >
          <span className="h-4 w-4 text-center text-sm leading-4">&#9881;</span>
          <span>Settings</span>
        </Link>
        <Link
          href="/support"
          className="flex items-center gap-4 py-2 text-[#99f7ff]/40 hover:text-[#99f7ff] font-mono text-[10px] uppercase tracking-widest transition-colors"
        >
          <span className="h-4 w-4 text-center text-sm leading-4">?</span>
          <span>Support</span>
        </Link>
      </div>
    </aside>
  );
};
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/navigation/Sidebar.tsx
git commit -m "feat: add Neural Command desktop sidebar navigation"
```

---

### Task 8: TopBar Component

**Files:**
- Create: `components/navigation/TopBar.tsx`

- [ ] **Step 1: Create TopBar.tsx**

```tsx
// components/navigation/TopBar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Search } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { StableGridBrand } from '@/components/brand/StableGridLogo';
import { NeuralInput } from '@/components/ui/NeuralInput';
import { shouldHideNav } from './navigation-config';

export const TopBar = () => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const hideNav = shouldHideNav(pathname, Boolean(user));

  if (hideNav) return null;

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-50 flex justify-between items-center px-6 h-14 bg-[#0c0e10]/80 backdrop-blur-xl border-b border-[#99f7ff]/10 shadow-[0_0_15px_rgba(0,242,255,0.05)]">
      <div className="flex items-center gap-4">
        <Link href="/home">
          <StableGridBrand className="text-xl" />
        </Link>
      </div>

      <div className="flex items-center gap-6">
        {/* Search (visual only for now) */}
        <div className="relative hidden md:block">
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <Search className="h-3 w-3 text-primary/40" />
          </div>
          <NeuralInput
            placeholder="Search..."
            className="w-48"
          />
        </div>

        <div className="flex gap-4 items-center">
          <Link
            href="/settings"
            className="text-slate-500 hover:text-[#99f7ff] transition-colors"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add components/navigation/TopBar.tsx
git commit -m "feat: add Neural Command top bar navigation"
```

---

### Task 9: BottomNav Rewrite

**Files:**
- Modify: `components/navigation/BottomNav.tsx`

- [ ] **Step 1: Rewrite BottomNav.tsx**

Replace the full content:

```tsx
// components/navigation/BottomNav.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { isNavItemActive, navItems, shouldHideNav } from './navigation-config';

export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();

  if (shouldHideNav(pathname, Boolean(user))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-surface-container-high border-t border-white/10 flex justify-around items-center lg:hidden">
      {navItems.filter((item) => !item.disabled).map((item) => {
        const Icon = item.icon;
        const isActive = isNavItemActive(pathname, item);

        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
            type="button"
          >
            <Icon
              className={`h-5 w-5 transition-colors ${
                isActive ? 'text-primary' : 'text-slate-500'
              }`}
            />
            <span
              className={`font-mono text-[9px] uppercase tracking-wider transition-colors ${
                isActive ? 'text-primary' : 'text-slate-500'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}

      <div className="h-safe-bottom bg-surface-container-high" />
    </nav>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add components/navigation/BottomNav.tsx
git commit -m "feat: rewrite BottomNav with Neural Command styling"
```

---

### Task 10: Navigation Shell & Background Overlays

**Files:**
- Modify: `components/navigation/Navigation.tsx`
- Delete: `components/navigation/TopNav.tsx` (replaced by Sidebar + TopBar)

- [ ] **Step 1: Rewrite Navigation.tsx**

Replace the full content:

```tsx
// components/navigation/Navigation.tsx
'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { shouldHideNav } from './navigation-config';

export const Navigation = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const hideNav = shouldHideNav(pathname, Boolean(user));

  return (
    <>
      {/* Background overlays */}
      <div className="fixed inset-0 grid-overlay pointer-events-none z-0" />
      <div className="fixed inset-0 scanline pointer-events-none z-0 opacity-20" />

      <Sidebar />
      <TopBar />

      <div
        data-testid="navigation-shell-content"
        className={`relative z-10 pb-16 lg:pb-0 ${hideNav ? '' : 'lg:pl-64 pt-14'}`}
      >
        {children}
      </div>

      <BottomNav />
    </>
  );
};
```

Key changes:
- Background overlays (`grid-overlay` + `scanline`) added as fixed layers
- Content area uses `lg:pl-64` (sidebar width) and `pt-14` (top bar height)
- Simplified mode handling — no more `lesson` vs `default` distinction for padding (sidebar is always w-64)

- [ ] **Step 2: Delete TopNav.tsx**

Delete `components/navigation/TopNav.tsx`.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | tail -10`
Expected: Build succeeds. If any other files import `TopNav` directly, fix those imports.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: replace navigation shell with sidebar + topbar layout"
```

---

### Task 11: Cleanup & Verification

**Files:**
- Various cleanup across codebase

- [ ] **Step 1: Check for remaining TopNav imports**

Search for any remaining imports of `TopNav` (include `tests/` directory):

```bash
grep -r "TopNav" components/ app/ tests/ --include='*.tsx' --include='*.ts' -l
```

Fix any found by updating to use the new `Sidebar` and `TopBar` components. The file `tests/integration/top-nav-rail.test.tsx` imports `TopNav` directly — either rewrite it to test `Sidebar` instead, or delete it if the test is no longer meaningful with the new sidebar layout.

- [ ] **Step 2: Check for remaining ThemeProvider imports**

```bash
grep -r "ThemeProvider" components/ app/ --include='*.tsx' --include='*.ts' -l
```

Fix any found by removing the imports.

- [ ] **Step 3: Check for remaining ThemeToggle imports**

```bash
grep -r "ThemeToggle" components/ app/ --include='*.tsx' --include='*.ts' -l
```

Fix any found by removing the imports and JSX.

- [ ] **Step 3b: Evaluate PracticeNavDropdown.tsx**

Check if `components/navigation/PracticeNavDropdown.tsx` is imported anywhere:

```bash
grep -r "PracticeNavDropdown" components/ app/ --include='*.tsx' --include='*.ts' -l
```

If it's only imported by the now-deleted `TopNav.tsx`, delete it. If it's imported elsewhere, restyle it with the new design tokens (replace `rounded-xl`, `border-light-border`, `bg-light-surface`, `dark:` prefixed classes with Neural Command equivalents).

- [ ] **Step 4: Run full build**

Run: `npx next build`
Expected: Build succeeds with no errors. Warnings about unused variables are acceptable.

- [ ] **Step 5: Run dev server and visually verify**

Run: `npm run dev`
Check:
- Dark background with cyan grid overlay visible
- Scanline overlay subtle but present
- Left sidebar visible on desktop with nav items
- Top bar with "stableGrid" branding
- Bottom nav on mobile viewport
- 0px corners on all elements
- No light mode toggling available

- [ ] **Step 6: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "chore: cleanup remaining references to removed components"
```

---

### Task 12: Uninstall next-themes

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Uninstall next-themes**

```bash
npm uninstall next-themes
```

- [ ] **Step 2: Verify build still passes**

```bash
npx next build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: uninstall next-themes package"
```
