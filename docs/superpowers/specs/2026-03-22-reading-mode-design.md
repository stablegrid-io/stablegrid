# Reading Mode: Premium Appearance Switcher

**Date:** 2026-03-22
**Status:** Approved

## Problem

The lesson reading page uses a single dark terminal aesthetic. Users reading long-form technical content for extended periods need alternative visual modes for comfort. The current dark-only design causes eye strain for some users and lacks the editorial clarity expected from a premium learning platform.

## Solution

Add a 3-mode appearance system (Dark, Light, Book) with a separate Focus toggle. Only the content area changes — the navigation shell stays dark. Preference persists in localStorage. Transitions use a 200ms crossfade.

## Decisions

- **Scope:** Content area only. Sidebar, TopBar, and header bar stay Neural Command dark.
- **Modes:** Dark (current), Light (cool minimal, Apple-like), Book (warm editorial, serif).
- **Focus:** Separate toggle that works in any mode. Hides sidebar, minimizes header, centers content.
- **UI:** Single "APPEARANCE" dropdown button in the lesson header bar. Contains mode selection (radio) and focus toggle (checkbox).
- **Persistence:** localStorage via Zustand store. No server sync.
- **Transition:** 200ms crossfade on background-color, color, and border-color.
- **Code blocks:** Stay dark in all modes (industry standard — light code blocks look cheap).

---

## Architecture

### CSS Variable Theming

The content container gets a `data-reading-mode` attribute. CSS custom properties define the theme tokens for each mode. Content components reference these variables instead of hardcoded Tailwind colors.

```
[data-reading-mode="dark"]  { --rm-bg: #141a1e; --rm-text: #cfdad5; ... }
[data-reading-mode="light"] { --rm-bg: #f8f9fa; --rm-text: #374151; ... }
[data-reading-mode="book"]  { --rm-bg: #faf7f2; --rm-text: #3d3529; ... }
```

**Why CSS variables over Tailwind class switching:**
- No conditional class logic in dozens of components
- One CSS block per mode, centrally defined
- Adding a 4th mode = one CSS block, zero component changes
- Transition animation is trivial on CSS variables
- Content components just use `var(--rm-text)` — clean, no branching

### State Management

Zustand store with localStorage persistence:

```typescript
interface ReadingModeState {
  mode: 'dark' | 'light' | 'book';
  focusMode: boolean;
  setMode: (mode: 'dark' | 'light' | 'book') => void;
  toggleFocus: () => void;
}
```

Persisted under key `stablegrid-reading-mode` in localStorage. Hydrated on mount with `dark` as the default.

---

## Design Tokens

### Dark Mode (current — default)

| Token | Value | Usage |
|-------|-------|-------|
| `--rm-bg` | `#141a1e` | Content background |
| `--rm-bg-elevated` | `#1d2023` | Callout/card backgrounds |
| `--rm-text` | `#cfdad5` | Body text |
| `--rm-text-heading` | `#f3f6f4` | Headings |
| `--rm-text-secondary` | `#8ca79a` | Metadata, labels |
| `--rm-border` | `rgba(255,255,255,0.08)` | Dividers, card borders |
| `--rm-accent` | `#99f7ff` | Links, highlights |
| `--rm-callout-bg` | `rgba(153,247,255,0.05)` | Callout background |
| `--rm-callout-border` | `rgba(153,247,255,0.2)` | Callout left border |
| `--rm-code-bg` | `#0d1117` | Code block background |
| `--rm-font` | `Inter, system-ui, sans-serif` | Body font |
| `--rm-font-heading` | `'Space Grotesk', sans-serif` | Heading font |
| `--rm-line-height` | `1.8` | Body line height |
| `--rm-content-max-width` | `54rem` | Content column width |

### Light Mode (cool, minimal, Apple-like)

| Token | Value | Usage |
|-------|-------|-------|
| `--rm-bg` | `#f8f9fa` | Content background |
| `--rm-bg-elevated` | `#ffffff` | Callout/card backgrounds |
| `--rm-text` | `#374151` | Body text |
| `--rm-text-heading` | `#111827` | Headings |
| `--rm-text-secondary` | `#6b7280` | Metadata, labels |
| `--rm-border` | `#e5e7eb` | Dividers, card borders |
| `--rm-accent` | `#3b82f6` | Links, highlights |
| `--rm-callout-bg` | `#eff6ff` | Callout background |
| `--rm-callout-border` | `#3b82f6` | Callout left border |
| `--rm-code-bg` | `#1e293b` | Code block stays dark |
| `--rm-font` | `-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif` | Body font |
| `--rm-font-heading` | `-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif` | Heading font |
| `--rm-line-height` | `1.85` | Body line height |
| `--rm-content-max-width` | `50rem` | Slightly narrower |

### Book Mode (warm, editorial, serif)

| Token | Value | Usage |
|-------|-------|-------|
| `--rm-bg` | `#faf7f2` | Content background |
| `--rm-bg-elevated` | `#f3efe8` | Callout/card backgrounds |
| `--rm-text` | `#3d3529` | Body text |
| `--rm-text-heading` | `#1a1510` | Headings |
| `--rm-text-secondary` | `#8a7e6b` | Metadata, labels |
| `--rm-border` | `#e0d9cc` | Dividers, card borders |
| `--rm-accent` | `#c4a97d` | Links, highlights, accents |
| `--rm-callout-bg` | `#f3efe8` | Callout background |
| `--rm-callout-border` | `#c4a97d` | Callout left border |
| `--rm-code-bg` | `#2d2a24` | Dark with warm tint |
| `--rm-font` | `Georgia, 'Iowan Old Style', 'Times New Roman', serif` | Body font |
| `--rm-font-heading` | `Georgia, 'Iowan Old Style', serif` | Heading font |
| `--rm-line-height` | `1.9` | Generous for long reading |
| `--rm-content-max-width` | `48rem` | Narrowest for readability |

### Callout Variant Colors Per Mode

Each callout variant (insight, warning, tip, danger) needs mode-specific colors. The pattern:

| Variant | Dark | Light | Book |
|---------|------|-------|------|
| insight | cyan tint | blue tint | gold tint |
| warning | amber tint | amber tint | amber tint |
| tip | green tint | green tint | green tint |
| danger | red tint | red tint | red tint |

These are defined as `--rm-callout-{variant}-bg` and `--rm-callout-{variant}-border` variables.

---

## Components

### New: `ReadingModeDropdown.tsx`

A dropdown button labeled "APPEARANCE" (or a moon/sun icon) that opens a popover with:

1. **Mode selector** — three radio-style options: Dark, Light, Book. Each shows a small color swatch preview.
2. **Focus toggle** — checkbox/switch labeled "Focus Mode".
3. **Divider** between the two sections.

Styling matches the Neural Command design (monospace, uppercase, outline borders). The dropdown itself uses the dark shell theme regardless of content mode.

Keyboard accessible: Escape closes, arrow keys navigate options, Enter/Space selects.

### New: `useReadingModeStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ReadingMode = 'dark' | 'light' | 'book';

interface ReadingModeState {
  mode: ReadingMode;
  focusMode: boolean;
  hasHydrated: boolean;
  setMode: (mode: ReadingMode) => void;
  toggleFocus: () => void;
}

export const useReadingModeStore = create<ReadingModeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      focusMode: false,
      hasHydrated: false,
      setMode: (mode) => set({ mode }),
      toggleFocus: () => set((state) => ({ focusMode: !state.focusMode })),
    }),
    {
      name: 'stablegrid-reading-mode',
      onRehydrateStorage: () => () => {
        useReadingModeStore.setState({ hasHydrated: true });
      },
    }
  )
);
```

### Modified: `TheoryLayout.tsx`

- Import `useReadingModeStore` and `ReadingModeDropdown`.
- Render `ReadingModeDropdown` in the header bar, before the SESSION button.
- When `focusMode` is true: add a CSS class that hides the sidebar toggle and simplifies the header to just the back button, mode dropdown, and lesson counter.
- The content wrapper div already exists — add `data-reading-mode={mode}` to it.

### Modified: `TheoryContent.tsx`

- The outer `motion.div` gets `data-reading-mode={mode}` from the store.
- Add `style={{ maxWidth: 'var(--rm-content-max-width)' }}` for mode-responsive width.
- Add `transition: background-color 0.2s ease, color 0.2s ease` to the wrapper.

### Modified: `TheorySection.tsx`

Replace hardcoded color classes with CSS variable references. The changes are systematic — every `text-text-light-secondary dark:text-[#cfdad5]` becomes `style={{ color: 'var(--rm-text)' }}`, every `dark:text-text-dark-primary` becomes `style={{ color: 'var(--rm-text-heading)' }}`.

Affected elements:
- Paragraph text color and line-height
- Heading text color and font-family
- List item text and badge colors
- Table header, cell, and border colors
- Diagram/comparison container backgrounds and borders
- Horizontal rule colors

### Modified: `TheoryLessonReading.tsx` (TheoryLessonIntro)

- Lesson title: use `var(--rm-text-heading)` and `var(--rm-font-heading)`
- Metadata line (Module X · Lesson Y · Z min): use `var(--rm-text-secondary)`
- Section border: use `var(--rm-border)`
- Module progress bar: keep using the primary cyan (it's a UI element, not content)

### Modified: `CalloutBlock.tsx`

- Background: `var(--rm-callout-bg)` (with variant overrides)
- Border: `var(--rm-callout-border)` (with variant overrides)
- Title text: `var(--rm-text-heading)`
- Body text: `var(--rm-text)`

### Modified: `CodeBlock.tsx`

- Code blocks stay dark in ALL modes. This is the industry standard (VS Code, GitHub, Notion all keep code dark in light mode).
- The `--rm-code-bg` variable allows slight tint variation (cool dark for Light, warm dark for Book).
- Code text colors (syntax highlighting) are unchanged across modes.

### CSS in `globals.css`

Add approximately 80 lines of CSS variable definitions:

```css
/* Reading Mode Tokens */
[data-reading-mode="dark"] {
  --rm-bg: #141a1e;
  --rm-bg-elevated: #1d2023;
  --rm-text: #cfdad5;
  --rm-text-heading: #f3f6f4;
  /* ... all dark tokens ... */
}

[data-reading-mode="light"] {
  --rm-bg: #f8f9fa;
  --rm-bg-elevated: #ffffff;
  --rm-text: #374151;
  --rm-text-heading: #111827;
  /* ... all light tokens ... */
}

[data-reading-mode="book"] {
  --rm-bg: #faf7f2;
  --rm-bg-elevated: #f3efe8;
  --rm-text: #3d3529;
  --rm-text-heading: #1a1510;
  /* ... all book tokens ... */
}

/* Transition */
[data-reading-mode] {
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* All children inherit the transition */
[data-reading-mode] * {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
```

---

## Focus Mode Behavior

When Focus Mode is toggled on (in any appearance mode):

1. The sidebar becomes hidden (same as compact mode on theory pages).
2. The header bar simplifies: only the ← MODULES button, lesson counter, and APPEARANCE dropdown remain. SESSION and SETTINGS buttons hide.
3. Content padding increases slightly for a centered, distraction-free layout.
4. The `lg:pl-48` padding from the sidebar is removed so content centers fully.

Implementation: a `data-focus-mode="true"` attribute on the TheoryLayout root, with CSS rules that hide elements and adjust layout.

---

## File Manifest

### New Files
| File | Purpose |
|------|---------|
| `lib/stores/useReadingModeStore.ts` | Zustand store with localStorage persistence |
| `components/learn/theory/ReadingModeDropdown.tsx` | APPEARANCE dropdown component |

### Modified Files
| File | Change |
|------|--------|
| `app/globals.css` | ~80 lines of CSS variable definitions for 3 modes |
| `components/learn/theory/TheoryLayout.tsx` | Add data attributes, render dropdown, focus mode logic |
| `components/learn/theory/TheoryContent.tsx` | Apply data-reading-mode, use CSS variables for max-width |
| `components/learn/theory/TheorySection.tsx` | Swap hardcoded colors to CSS variables |
| `components/learn/theory/TheoryLessonReading.tsx` | Swap hardcoded colors to CSS variables |
| `components/learn/theory/CalloutBlock.tsx` | Swap hardcoded colors to CSS variables |
| `components/learn/theory/CodeBlock.tsx` | Minor: use --rm-code-bg for background tint |

### Unchanged
| File | Reason |
|------|--------|
| `components/navigation/Sidebar.tsx` | Shell stays dark |
| `components/navigation/TopBar.tsx` | Shell stays dark |
| `components/navigation/BottomNav.tsx` | Shell stays dark |
| `tailwind.config.ts` | CSS variables are defined in globals.css, not Tailwind |

---

## Accessibility

- All 3 modes meet WCAG AA contrast ratios (4.5:1 for body text, 3:1 for large text).
- Focus toggle is keyboard accessible (checkbox semantics).
- Mode switcher dropdown supports keyboard navigation (Escape, arrows, Enter).
- `prefers-reduced-motion` disables the 200ms transition.
- Screen readers announce the current mode when changed.

---

## Out of Scope

- Font size adjustment (could be added later as a slider in the dropdown)
- Custom user-defined themes
- Server-side persistence / cross-device sync
- Mode switching outside the theory reading page (other pages stay dark)
- Print stylesheet
