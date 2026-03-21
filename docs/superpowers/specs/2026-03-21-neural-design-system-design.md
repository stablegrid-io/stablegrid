# Neural Design System: Component Library Rewrite

**Date:** 2026-03-21
**Status:** Approved

## Problem

The current stableGrid UI uses a clean modern design with light/dark theme support, rounded corners, and conventional SaaS styling. The Stitch STABLE_GRID project defines a "Neural Command" tactical terminal aesthetic — dark-only, sharp 0px corners, L-bracket accents, segmented progress bars, glass panels, and scanline overlays. The codebase needs to adopt this design system at the foundation level, replacing the existing component library with new primitives built directly from Stitch's HTML output.

## Decisions

- **Approach 3: Component Library Rewrite** — build fresh `components/ui/` primitives from Stitch's actual HTML patterns, then swap into existing pages
- **Visual style only** — keep friendly readable naming (stableGrid, readable card titles), no fake version numbers or classified codes
- **Dark-only** — drop light mode, remove `next-themes` and `ThemeProvider`
- **Foundation + navigation first** — individual page content rewrites come in follow-up sessions
- **No leaderboard page** — cut from scope entirely
- **Landing page deferred** — separate future session

## Scope

### In scope (this pass)

1. Tailwind config token replacement
2. globals.css rewrite (backgrounds, utility classes, remove light mode)
3. New UI component library
4. Navigation rewrite (sidebar + top bar + mobile bottom nav)
5. Branding update (stableGrid)
6. Remove theme toggling infrastructure

### Out of scope

- Individual page content rewrites (HomeDashboard, TopicGrid, assignments, character, etc.)
- Landing page reskin
- Leaderboard page (cut)

---

## Design Tokens

### Colors (from Stitch HTML source)

```
background:               #0c0e10
surface:                  #0c0e10
surface-container-lowest: #000000
surface-container-low:    #111416
surface-container:        #171a1c
surface-container-high:   #1d2023
surface-container-highest:#232629
surface-bright:           #292c30
surface-variant:          #232629

primary:                  #99f7ff
primary-dim:              #00e2ee
primary-container:        #00f1fe
primary-fixed:            #00f1fe
primary-fixed-dim:        #00e2ee
on-primary:               #005f64
on-primary-container:     #00555a
surface-tint:             #99f7ff

secondary:                #bf81ff
secondary-dim:            #9c42f4
secondary-container:      #7701d0
secondary-fixed:          #e4c6ff
on-secondary:             #32005c

tertiary:                 #ffc965
tertiary-dim:             #ecaa00
tertiary-container:       #feb700
on-tertiary:              #5f4200

error:                    #ff716c
error-dim:                #d7383b
error-container:          #9f0519
on-error:                 #490006

on-surface:               #f0f0f3
on-surface-variant:       #aaabae
on-background:            #f0f0f3
outline:                  #747578
outline-variant:          #46484a

inverse-primary:          #006a70
inverse-surface:          #f9f9fc
inverse-on-surface:       #535558
```

### Border Radius

All `0px`. Only exception: `full: 9999px` for dot indicators.

### Fonts

```
headline: Space Grotesk (300-900)
body:     Inter (300-700)
mono:     JetBrains Mono (300-700)
label:    Space Grotesk
```

**Font loading changes required in `layout.tsx`:**
- Current Google Fonts link loads Space Grotesk 300-700 only — must add weights 800, 900 (needed for `font-black` / `font-extrabold` headlines)
- Current link loads JetBrains Mono 400, 500, 700 only — add weight 300
- **Inter is not loaded via Google Fonts** — it only works if installed locally. Must add Inter to the Google Fonts link with weights 300-700

Updated Google Fonts link:
```
https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;700&family=Inter:wght@300;400;500;600;700&display=swap
```

### Shadows

No drop shadows. Luminous glows only:
- `glow-primary`: `box-shadow: 0 0 15px rgba(0, 242, 255, 0.4)`
- Button hover: `shadow-[0_0_20px_rgba(153,247,255,0.4)]`
- Neural node: `box-shadow: 0 0 15px #00F2FF, inset 0 0 5px #00F2FF`

### Tailwind Config Color Structure

The colors above must be added as flat keys in `tailwind.config.ts` `theme.extend.colors`, matching the exact Stitch Tailwind config format:

```ts
colors: {
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
}
```

**Existing color tokens** (`brand`, `success`, `warning`, `light`, `dark`, `text` palettes) are **kept** during this pass for backward compatibility — existing page components still reference them. They will be removed incrementally as pages are rewritten in follow-up sessions.

### Border Radius Strategy

Override all Tailwind radius tokens to `0px`:

```ts
borderRadius: {
  "DEFAULT": "0px",
  "sm": "0px",
  "md": "0px",
  "lg": "0px",
  "xl": "0px",
  "2xl": "0px",
  "3xl": "0px",
  "full": "9999px",
}
```

This means every `rounded-*` class across the app becomes `0px` immediately. Existing pages will lose their rounded corners — this is intentional and accepted as part of the foundation change. The sharp-corner aesthetic applies globally.

---

## globals.css Patterns (from Stitch HTML)

### Background Overlays

```css
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
```

Applied as fixed full-screen overlays with `pointer-events-none`.

### Glass Panel

```css
.glass-panel {
  backdrop-filter: blur(12px);
  background: rgba(17, 20, 22, 0.7);
}
```

### L-Bracket Corners (2-corner variant)

The Stitch HTML uses `::before` (top-left) and `::after` (bottom-right) for a diagonal 2-corner accent. This is the default `LBracketCard` style:

```css
.l-bracket {
  position: relative;
}
.l-bracket::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 10px; height: 10px;
  border-top: 2px solid currentColor;
  border-left: 2px solid currentColor;
}
.l-bracket::after {
  content: '';
  position: absolute;
  bottom: 0; right: 0;
  width: 10px; height: 10px;
  border-bottom: 2px solid currentColor;
  border-right: 2px solid currentColor;
}
```

For 4-corner brackets (used in the Assignments cards), use a single-corner CSS class applied via 4 child `<span>` elements positioned absolutely at each corner. The `LBracketCard` component supports a `corners` prop: `"diagonal"` (default, 2 corners via pseudo-elements) or `"all"` (4 corners via child spans).

### Color-Specific L-Brackets

```css
.l-bracket-teal  { border-left: 2px solid #99f7ff; border-top: 2px solid #99f7ff; }
.l-bracket-red   { border-left: 2px solid #ff716c; border-top: 2px solid #ff716c; }
.l-bracket-amber { border-left: 2px solid #ffc965; border-top: 2px solid #ffc965; }
```

### Removed

- All light mode CSS (`:root` light variables, `.light` selectors, media queries for `prefers-color-scheme`)
- Current `.btn`, `.card`, `.badge`, `.input` utility classes — replaced by component library
- Current grid background pattern (54px grid) — replaced by Stitch's 40px grid

---

## New UI Component Library

### GlassPanel

Universal container replacing current `Card`.

```tsx
// Props: accentColor?, hover?, className?, children
<div class="glass-panel border border-primary/10 p-8 relative overflow-hidden
            transition-all hover:border-primary/30">
  {children}
</div>
```

Accent color variants change border color: `border-error/10`, `border-tertiary/10`, `border-secondary/10`.

### LBracketCard

GlassPanel + L-bracket corner pseudo-elements. Used in character stats, data panels.

```tsx
// Props: accentColor?, className?, children
<div class="bg-surface-container-low/40 backdrop-blur-md p-6 l-bracket
            border border-white/5 relative overflow-hidden">
  {children}
</div>
```

### SegmentedBar

Replaces all smooth progress bars. Hardware readout aesthetic.

```tsx
// Props: value (0-100), segments? (default 10), color? (default primary)
<div class="flex gap-1 h-3">
  {/* Active segments: bg-{color} */}
  {/* Inactive segments: bg-surface-container-highest/30 border border-{color}/10 */}
</div>
```

### SystemLabel

Monospaced uppercase micro-label with optional dot indicator.

```tsx
// Props: color?, dot?, children
<div class="flex items-center gap-3">
  {dot && <div class="w-1.5 h-1.5 bg-{color} shadow-[0_0_5px]" />}
  <span class="font-mono text-[10px] text-{color}/60 tracking-widest uppercase">
    {children}
  </span>
</div>
```

### SolidButton

Primary CTA.

```tsx
// Props: color? (primary/error/tertiary), fullWidth?, children
<button class="bg-primary text-on-primary font-headline font-black text-xs
               py-4 tracking-widest uppercase
               hover:shadow-[0_0_20px_rgba(153,247,255,0.4)]
               active:scale-[0.98] transition-all">
  {children}
</button>
```

Color variants: `bg-error text-on-error`, `bg-tertiary text-on-tertiary` with matching glow colors.

### GhostButton

Secondary/outline CTA.

```tsx
// Props: color? (primary/error/tertiary), fullWidth?, children
<button class="border border-primary/20 text-primary bg-transparent
               font-headline font-bold text-xs tracking-widest uppercase
               hover:bg-primary/5 active:scale-[0.98] transition-all">
  {children}
</button>
```

### NeuralInput

Bottom-border-only input from Stitch header.

```tsx
// Props: placeholder?, className?
<input class="bg-surface-container-low border-b border-outline-variant/30
              text-[10px] font-mono text-primary py-1 px-4
              focus:outline-none focus:border-primary transition-all
              placeholder:text-primary/20" />
```

### StatBlock

Stat display card used in theory hub and dashboard.

```tsx
// Props: icon, label, value, iconColor?
<div class="p-4 border border-outline-variant bg-surface-container-low flex items-center gap-4">
  <Icon class="text-{iconColor}" />
  <div>
    <div class="text-[10px] font-mono text-on-surface-variant uppercase">{label}</div>
    <div class="text-xl font-headline font-bold">{value}</div>
  </div>
</div>
```

### Removed Components

- `ThemeToggle` — deleted
- `ThemeProvider` / `next-themes` — removed from `layout.tsx` and dependencies
- Current `Button.tsx`, `Card.tsx`, `Badge.tsx`, `Input.tsx` — replaced by new components
- `ViewToggle` — evaluate if still needed, restyle if kept

### Kept and Restyled

- `BracketBox` — merge into `LBracketCard` if redundant, otherwise restyle
- `GameBadge` — restyle with new tokens
- `GameToast` — restyle with new tokens

---

## Navigation Rewrite

### Desktop Layout

**Sidebar** (`components/navigation/Sidebar.tsx`):
- Fixed left, `w-64`, full height
- `bg-[#0c0e10] border-r border-[#99f7ff]/10`
- **User section** (top): Square avatar (`border border-primary/30 p-0.5`), username in `font-mono text-xs font-bold uppercase text-[#00F2FF]`, status line
- **Nav links** (middle): Material Symbols icon + label
  - Active: `bg-[#99f7ff]/10 text-[#99f7ff] border-l-4 border-[#00F2FF] font-bold`
  - Inactive: `text-slate-500 hover:text-[#99f7ff]/70 hover:bg-[#00F2FF]/5`
  - Font: `font-mono text-xs uppercase tracking-widest`
- **Footer links** (bottom): Settings, Support in smaller `text-[10px]`
- Hidden on mobile: `hidden lg:flex`

**Top Bar** (`components/navigation/TopBar.tsx`):
- Fixed top, full width, `h-14`
- `bg-[#0c0e10]/80 backdrop-blur-xl border-b border-[#99f7ff]/10`
- Left: "stableGrid" in `text-xl font-black text-[#99f7ff] tracking-widest font-headline`
- Right: Search input (NeuralInput), icon buttons, user avatar
- Offset: `left-64` on desktop (clears sidebar), `left-0` on mobile

**Navigation items** (same routes as current):
1. Home → `/home` → icon: `Home` (Lucide)
2. Theory → `/theory` → icon: `BookOpen` (Lucide)
3. Assignments → `/assignments` → icon: `ClipboardCheck` (Lucide)
4. Grid → `/energy` → icon: `Zap` (Lucide)
5. Character → `/progress` → icon: `User` (Lucide)
6. Admin → `/admin` → icon: `Shield` (Lucide, admin role only)

Note: The Grid/Energy nav item at `/energy` is kept from the current config. Lucide icons are used (not Material Symbols) per the Icon System decision.

### Mobile Layout

**Bottom Nav** (`components/navigation/BottomNav.tsx`):
- `fixed bottom-0 h-16 bg-surface-container-high border-t border-white/10`
- `flex justify-around items-center`
- Icons only, active state with `text-primary`, inactive `text-slate-500`
- Visible only on mobile: `lg:hidden`

### Behavioral Logic to Preserve

The current `TopNav.tsx` contains significant behavioral logic that must be carried forward into `Sidebar.tsx` and `TopBar.tsx`:

- **Admin role detection** — checks `admin_memberships` to show/hide Admin nav item
- **Avatar loading** — fetches user avatar from profile, listens for `avatar-updated` custom events
- **Route prefetching** — uses `requestIdleCallback` to prefetch nav item routes on mount
- **Nav hide logic** — `shouldHideNav()` hides nav on auth pages, during practice sessions
- **Compact mode** — `isCompactDesktopNavPath()` for admin/theory lesson pages (adapt to sidebar context)
- **`PracticeNavDropdown.tsx`** — currently exists in the navigation directory; keep and restyle if still used, otherwise remove

### Files Changed

- **New:** `Sidebar.tsx`, `TopBar.tsx`
- **Rewritten:** `BottomNav.tsx`
- **Updated:** `Navigation.tsx` (compose new pieces), `navigation-config.ts` (icon mappings)
- **Removed:** Current `TopNav.tsx` (replaced by `Sidebar.tsx` + `TopBar.tsx`)
- **Evaluated:** `PracticeNavDropdown.tsx` — keep/restyle or remove

---

## Branding

- `StableGridLogo.tsx` — simplify to text-only: "stableGrid" in `font-headline font-black text-[#99f7ff] tracking-widest`
- `layout.tsx` title → "stableGrid"
- Keep `.io` only where referring to the domain/URL, not as part of the brand display

---

## Icon System

Stitch uses **Material Symbols Outlined** (`material-symbols-outlined` class). Current codebase uses **Lucide React**.

Decision: **Keep Lucide React** for the implementation. The Stitch HTML uses Material Symbols because that's what Stitch generates, but Lucide has equivalent icons and is already installed. No need to add a new icon dependency. Map Stitch icon names to Lucide equivalents during implementation.

---

## Theme Removal Strategy

Removing `next-themes` requires a specific approach to avoid breaking `dark:` utility classes across the codebase:

1. **Remove `ThemeProvider`** from `layout.tsx` — delete the import and wrapper
2. **Hardcode `className="dark"`** on the `<html>` element in `layout.tsx` — this preserves `dark:` prefix functionality for existing page components during migration
3. **Remove `suppressHydrationWarning`** from `<html>` — no longer needed without theme switching
4. **Delete** `components/providers/ThemeProvider.tsx`
5. **Delete** `components/ui/ThemeToggle.tsx` and remove from wherever it's rendered
6. **Find and fix** all `useTheme()` imports — replace with hardcoded dark values or remove the conditional logic
7. **Uninstall** `next-themes` package

The hardcoded `dark` class ensures that existing `dark:` prefixed utilities in page components continue to work. These prefixes will be cleaned up incrementally as each page is rewritten.

---

## TopBar Search Input

The TopBar includes a search input from the Stitch design. For this foundation pass, it is **visual only** — a styled `NeuralInput` with placeholder text. It does not connect to any search functionality. Wiring it to the existing `lib/learn-search.ts` or adding search behavior is deferred to a page rewrite session.

---

## Migration Notes

- Existing pages will look partially broken after foundation changes (0px corners, new colors, removed utilities). This is expected — page rewrites follow in subsequent sessions.
- The new component library is additive. Old components can be removed incrementally as pages adopt new ones.
- Old Tailwind color tokens (`brand`, `light`, `dark`, `text`) are kept for backward compatibility. New Stitch tokens are added alongside them.
- The hardcoded `dark` class on `<html>` ensures `dark:` prefixed classes still work during migration.
