# Reading Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 3-mode appearance system (Dark, Light, Book) with Focus toggle to the theory lesson reading page.

**Architecture:** CSS custom properties on a `data-reading-mode` attribute applied to the content wrapper div. A Zustand store with localStorage persistence manages the selected mode. A dropdown in the header bar provides the UI. Only content area components use the CSS variables — the shell stays dark.

**Tech Stack:** React, Zustand (persist middleware), CSS custom properties, Tailwind CSS (existing), Lucide icons

**Spec:** `docs/superpowers/specs/2026-03-22-reading-mode-design.md`

---

### Task 1: CSS Variable Definitions

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add reading mode CSS variables for all 3 modes**

Add after the existing `@layer utilities` block in `globals.css`:

```css
/* ── Reading Mode Tokens ── */
[data-reading-mode="dark"] {
  --rm-bg: #141a1e;
  --rm-bg-elevated: #1d2023;
  --rm-text: #cfdad5;
  --rm-text-heading: #f3f6f4;
  --rm-text-secondary: #8ca79a;
  --rm-text-lead: #f3f6f4;
  --rm-border: rgba(255,255,255,0.08);
  --rm-accent: #99f7ff;
  --rm-callout-bg: rgba(153,247,255,0.05);
  --rm-callout-border: rgba(153,247,255,0.2);
  --rm-code-bg: #0d1117;
  --rm-font: Inter, system-ui, sans-serif;
  --rm-font-heading: 'Space Grotesk', sans-serif;
  --rm-line-height: 1.8;
  --rm-content-max-width: 54rem;
  --rm-table-header-bg: rgba(255,255,255,0.03);
  --rm-table-hover: rgba(255,255,255,0.02);
  --rm-list-badge-bg: rgba(153,247,255,0.1);
  --rm-list-badge-text: #99f7ff;
  --rm-hr: rgba(255,255,255,0.06);
}

[data-reading-mode="light"] {
  --rm-bg: #f8f9fa;
  --rm-bg-elevated: #ffffff;
  --rm-text: #374151;
  --rm-text-heading: #111827;
  --rm-text-secondary: #6b7280;
  --rm-text-lead: #1f2937;
  --rm-border: #e5e7eb;
  --rm-accent: #3b82f6;
  --rm-callout-bg: #eff6ff;
  --rm-callout-border: #3b82f6;
  --rm-code-bg: #1e293b;
  --rm-font: -apple-system, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif;
  --rm-font-heading: -apple-system, 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif;
  --rm-line-height: 1.85;
  --rm-content-max-width: 50rem;
  --rm-table-header-bg: #f3f4f6;
  --rm-table-hover: #f9fafb;
  --rm-list-badge-bg: #dbeafe;
  --rm-list-badge-text: #1d4ed8;
  --rm-hr: #e5e7eb;
}

[data-reading-mode="book"] {
  --rm-bg: #faf7f2;
  --rm-bg-elevated: #f3efe8;
  --rm-text: #3d3529;
  --rm-text-heading: #1a1510;
  --rm-text-secondary: #8a7e6b;
  --rm-text-lead: #2c2416;
  --rm-border: #e0d9cc;
  --rm-accent: #c4a97d;
  --rm-callout-bg: #f3efe8;
  --rm-callout-border: #c4a97d;
  --rm-code-bg: #2d2a24;
  --rm-font: Georgia, 'Iowan Old Style', 'Times New Roman', serif;
  --rm-font-heading: Georgia, 'Iowan Old Style', serif;
  --rm-line-height: 1.9;
  --rm-content-max-width: 48rem;
  --rm-table-header-bg: #efe9dd;
  --rm-table-hover: #f5f0e8;
  --rm-list-badge-bg: rgba(196,169,125,0.15);
  --rm-list-badge-text: #8a7e6b;
  --rm-hr: #e0d9cc;
}

/* Transition on container */
[data-reading-mode] {
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* Targeted child transitions (NOT wildcard — avoids Framer Motion jank) */
[data-reading-mode] h1, [data-reading-mode] h2, [data-reading-mode] h3,
[data-reading-mode] p, [data-reading-mode] li, [data-reading-mode] td,
[data-reading-mode] th, [data-reading-mode] section,
[data-reading-mode] blockquote, [data-reading-mode] pre {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

@media (prefers-reduced-motion: reduce) {
  [data-reading-mode], [data-reading-mode] * {
    transition: none !important;
  }
}

/* Focus Mode */
[data-focus-mode="true"] [data-hide-on-focus] {
  display: none !important;
}
```

- [ ] **Step 2: Verify CSS is valid**

Run: `npx next lint --file app/globals.css`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(reading-mode): add CSS variable definitions for dark/light/book modes"
```

---

### Task 2: Zustand Store

**Files:**
- Create: `lib/stores/useReadingModeStore.ts`

- [ ] **Step 1: Create the store**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReadingMode = 'dark' | 'light' | 'book';

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

- [ ] **Step 2: Lint**

Run: `npx next lint --file lib/stores/useReadingModeStore.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/stores/useReadingModeStore.ts
git commit -m "feat(reading-mode): add Zustand store with localStorage persistence"
```

---

### Task 3: ReadingModeDropdown Component

**Files:**
- Create: `components/learn/theory/ReadingModeDropdown.tsx`

- [ ] **Step 1: Build the dropdown component**

The dropdown has:
- An icon-only trigger button (Palette or Eye icon) matching the header bar style
- A popover panel with: title "APPEARANCE", 3 mode radio options with color swatches, a divider, and a Focus toggle
- Escape key closes the dropdown
- Clicking outside closes the dropdown
- Uses `useReadingModeStore` for state

```typescript
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, Moon, Sun, BookOpen, Maximize2 } from 'lucide-react';
import { useReadingModeStore, type ReadingMode } from '@/lib/stores/useReadingModeStore';

const MODE_OPTIONS: { id: ReadingMode; label: string; icon: typeof Moon; swatch: string }[] = [
  { id: 'dark', label: 'DARK', icon: Moon, swatch: '#141a1e' },
  { id: 'light', label: 'LIGHT', icon: Sun, swatch: '#f8f9fa' },
  { id: 'book', label: 'BOOK', icon: BookOpen, swatch: '#faf7f2' },
];

export const ReadingModeDropdown = () => {
  const { mode, focusMode, setMode, toggleFocus } = useReadingModeStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, close]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-1.5 border border-outline-variant/50 bg-surface-container px-2.5 text-xs font-mono text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
        aria-label="Appearance settings"
        aria-expanded={open}
      >
        <Eye className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-52 border border-outline-variant/30 bg-surface-container shadow-xl">
          <div className="px-3 py-2 border-b border-outline-variant/20">
            <span className="font-mono text-[9px] text-on-surface-variant tracking-widest uppercase">
              APPEARANCE
            </span>
          </div>

          <div className="p-1.5">
            {MODE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = mode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setMode(opt.id); }}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 text-left transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                  role="radio"
                  aria-checked={isActive}
                >
                  <div
                    className="w-4 h-4 border border-outline-variant/40 flex-shrink-0"
                    style={{ backgroundColor: opt.swatch }}
                  />
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-mono text-[10px] tracking-widest uppercase">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-outline-variant/20 p-1.5">
            <button
              type="button"
              onClick={toggleFocus}
              className={`w-full flex items-center gap-3 px-2.5 py-2 text-left transition-colors ${
                focusMode
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Maximize2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="font-mono text-[10px] tracking-widest uppercase">
                FOCUS MODE
              </span>
              <span className={`ml-auto w-2 h-2 rounded-full ${focusMode ? 'bg-primary' : 'bg-outline-variant/30'}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Lint**

Run: `npx next lint --file components/learn/theory/ReadingModeDropdown.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/learn/theory/ReadingModeDropdown.tsx
git commit -m "feat(reading-mode): add ReadingModeDropdown component"
```

---

### Task 4: Wire into TheoryLayout

**Files:**
- Modify: `components/learn/theory/TheoryLayout.tsx`

- [ ] **Step 1: Add imports**

Add near the top imports:
```typescript
import { useReadingModeStore } from '@/lib/stores/useReadingModeStore';
import { ReadingModeDropdown } from '@/components/learn/theory/ReadingModeDropdown';
```

- [ ] **Step 2: Read store state inside the component**

Inside the `TheoryLayout` component function, after existing store reads:
```typescript
const readingMode = useReadingModeStore((s) => s.mode);
const focusMode = useReadingModeStore((s) => s.focusMode);
```

- [ ] **Step 3: Add data-reading-mode to the content wrapper**

Find the content wrapper div (the one with `ref={contentRef}`, around line 1062):
```tsx
<div
  ref={contentRef}
  aria-hidden={sessionPickerVisible && !theorySession.hasActiveSession}
  className="min-h-0 flex-1 overflow-y-auto bg-surface"
>
```

Change to:
```tsx
<div
  ref={contentRef}
  data-reading-mode={readingMode}
  aria-hidden={sessionPickerVisible && !theorySession.hasActiveSession}
  className="min-h-0 flex-1 overflow-y-auto"
  style={{ backgroundColor: 'var(--rm-bg)' }}
>
```

- [ ] **Step 4: Add data-focus-mode to the root layout div**

The root div (around line 935):
```tsx
<div className="relative flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-surface lg:h-[calc(100dvh-3.5rem)]">
```

Change to:
```tsx
<div
  className="relative flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-surface lg:h-[calc(100dvh-3.5rem)]"
  data-focus-mode={focusMode ? 'true' : undefined}
>
```

- [ ] **Step 5: Add ReadingModeDropdown to the header bar**

Find the SESSION button area in the header bar (the `ml-auto flex items-center gap-3` div). Add the dropdown before the SESSION button:
```tsx
<ReadingModeDropdown />
```

- [ ] **Step 6: Add data-hide-on-focus to elements that should hide in focus mode**

Add `data-hide-on-focus` attribute to:
- The sidebar toggle button (the MODULES button)
- The SESSION button
- The SETTINGS button

These elements will be hidden by the CSS rule `[data-focus-mode="true"] [data-hide-on-focus] { display: none !important; }` defined in Task 1.

- [ ] **Step 7: Lint and verify**

Run: `npx next lint --file components/learn/theory/TheoryLayout.tsx`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add components/learn/theory/TheoryLayout.tsx
git commit -m "feat(reading-mode): wire store and dropdown into TheoryLayout"
```

---

### Task 5: Theme TheorySection Content Blocks

**Files:**
- Modify: `components/learn/theory/TheorySection.tsx`

This is the largest change. Every hardcoded Tailwind color in the content rendering must be swapped to use CSS variables. The pattern is systematic:

- [ ] **Step 1: Theme paragraph text**

Find all paragraph rendering. Replace text color classes like `text-text-light-secondary dark:text-[#cfdad5]` with:
```tsx
style={{ color: 'var(--rm-text)', lineHeight: 'var(--rm-line-height)', fontFamily: 'var(--rm-font)' }}
```

For lead text (first paragraph, larger), use `var(--rm-text-lead)`.

- [ ] **Step 2: Theme headings**

Replace heading color classes like `text-text-light-primary dark:text-text-dark-primary` with:
```tsx
style={{ color: 'var(--rm-text-heading)', fontFamily: 'var(--rm-font-heading)' }}
```

- [ ] **Step 3: Theme lists**

For bullet and numbered lists:
- List text: `style={{ color: 'var(--rm-text)' }}`
- Numbered list badges: `style={{ backgroundColor: 'var(--rm-list-badge-bg)', color: 'var(--rm-list-badge-text)' }}`

- [ ] **Step 4: Theme tables**

- Table container border: `style={{ borderColor: 'var(--rm-border)' }}`
- Header cells: `style={{ backgroundColor: 'var(--rm-table-header-bg)', color: 'var(--rm-text-heading)' }}`
- Body cells: `style={{ color: 'var(--rm-text)', borderColor: 'var(--rm-border)' }}`
- Hover rows: `style={{ backgroundColor: 'var(--rm-table-hover)' }}` (use onMouseEnter/Leave or a CSS class)

- [ ] **Step 5: Theme RenderComparison and RenderKeyConcept**

- Comparison container: `style={{ borderColor: 'var(--rm-border)', backgroundColor: 'var(--rm-bg-elevated)' }}`
- KeyConcept: `style={{ borderColor: 'var(--rm-border)', backgroundColor: 'var(--rm-bg-elevated)', color: 'var(--rm-text)' }}`

- [ ] **Step 6: Theme horizontal rules**

Replace `bg-light-border dark:bg-dark-border` with:
```tsx
style={{ backgroundColor: 'var(--rm-hr)' }}
```

- [ ] **Step 7: Lint**

Run: `npx next lint --file components/learn/theory/TheorySection.tsx`

- [ ] **Step 8: Commit**

```bash
git add components/learn/theory/TheorySection.tsx
git commit -m "feat(reading-mode): theme TheorySection content blocks with CSS variables"
```

---

### Task 6: Theme TheoryLessonReading (Intro)

**Files:**
- Modify: `components/learn/theory/TheoryLessonReading.tsx`

- [ ] **Step 1: Theme the lesson intro section**

- Lesson title (`<h1>`): `style={{ color: 'var(--rm-text-heading)', fontFamily: 'var(--rm-font-heading)' }}`
- Metadata line (Module X · Lesson Y): `style={{ color: 'var(--rm-text-secondary)' }}`
- Section border: `style={{ borderColor: 'var(--rm-border)' }}`
- Keep the module progress bar using primary cyan (it's a UI element)

- [ ] **Step 2: Lint**

Run: `npx next lint --file components/learn/theory/TheoryLessonReading.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/learn/theory/TheoryLessonReading.tsx
git commit -m "feat(reading-mode): theme TheoryLessonIntro with CSS variables"
```

---

### Task 7: Theme CalloutBlock

**Files:**
- Modify: `components/learn/theory/CalloutBlock.tsx`

- [ ] **Step 1: Replace hardcoded callout colors**

Replace the Tailwind variant color classes with CSS variables:
- Background: `style={{ backgroundColor: 'var(--rm-callout-bg)' }}`
- Left border: `style={{ borderLeftColor: 'var(--rm-callout-border)' }}`
- Title text: `style={{ color: 'var(--rm-text-heading)' }}`
- Body text: `style={{ color: 'var(--rm-text)' }}`

Keep the variant icon colors as-is for now (they're small accent elements).

- [ ] **Step 2: Lint and commit**

```bash
git add components/learn/theory/CalloutBlock.tsx
git commit -m "feat(reading-mode): theme CalloutBlock with CSS variables"
```

---

### Task 8: Theme DiagramBlock and CodeBlock

**Files:**
- Modify: `components/learn/theory/DiagramBlock.tsx`
- Modify: `components/learn/CodeBlock.tsx`

- [ ] **Step 1: Theme DiagramBlock**

Replace hardcoded border and background colors with CSS variables:
```tsx
style={{ borderColor: 'var(--rm-border)', backgroundColor: 'var(--rm-bg-elevated)', color: 'var(--rm-text)' }}
```

- [ ] **Step 2: Theme CodeBlock background tint**

In `CodeBlock.tsx`, find the container background color (currently `dark:bg-[#0d1117]` or similar). Replace with:
```tsx
style={{ backgroundColor: 'var(--rm-code-bg)' }}
```

Do NOT change syntax highlighting colors — they stay the same in all modes.

- [ ] **Step 3: Lint both files**

Run: `npx next lint --file components/learn/theory/DiagramBlock.tsx --file components/learn/CodeBlock.tsx`

- [ ] **Step 4: Commit**

```bash
git add components/learn/theory/DiagramBlock.tsx components/learn/CodeBlock.tsx
git commit -m "feat(reading-mode): theme DiagramBlock and CodeBlock backgrounds"
```

---

### Task 9: Theme TheoryContent Navigation

**Files:**
- Modify: `components/learn/theory/TheoryContent.tsx`

- [ ] **Step 1: Apply max-width from CSS variable**

Find the outer content wrapper and add:
```tsx
style={{ maxWidth: 'var(--rm-content-max-width)' }}
```

- [ ] **Step 2: Theme the bottom prev/next navigation**

Find the bottom navigation section. Replace hardcoded border and text color classes:
- Container border: `style={{ borderColor: 'var(--rm-border)' }}`
- Previous/next text: `style={{ color: 'var(--rm-text-secondary)' }}`
- Lesson counter: `style={{ color: 'var(--rm-text-secondary)' }}`

Keep the "Next Lesson" CTA button using primary cyan (it's a UI action button, not content).

- [ ] **Step 3: Lint and commit**

```bash
git add components/learn/theory/TheoryContent.tsx
git commit -m "feat(reading-mode): theme TheoryContent width and navigation"
```

---

### Task 10: Visual QA and Final Polish

**Files:**
- All modified files from Tasks 1-9

- [ ] **Step 1: Test all 3 modes visually**

Open a lesson page with rich content (code blocks, callouts, tables, diagrams, lists). Switch between Dark, Light, and Book modes. Verify:
- Background transitions smoothly (200ms fade)
- Text is readable in all modes
- Code blocks stay dark in all modes
- Callouts have appropriate backgrounds
- Tables are legible
- Headings use the correct font family (sans in Dark/Light, serif in Book)
- Content column narrows appropriately (54rem → 50rem → 48rem)

- [ ] **Step 2: Test Focus Mode**

Toggle Focus Mode on in each appearance mode. Verify:
- Sidebar toggle button hides
- SESSION and SETTINGS buttons hide
- Content remains centered
- Focus toggle indicator shows active state in the dropdown

- [ ] **Step 3: Test persistence**

1. Set mode to Book
2. Navigate away from the theory page
3. Return to the theory page
4. Verify Book mode is restored from localStorage

- [ ] **Step 4: Test keyboard accessibility**

- Open dropdown with Enter/Space
- Navigate modes with arrow keys
- Close with Escape
- Toggle Focus with Enter/Space

- [ ] **Step 5: Lint all modified files**

Run: `npx next lint --file app/globals.css --file lib/stores/useReadingModeStore.ts --file components/learn/theory/ReadingModeDropdown.tsx --file components/learn/theory/TheoryLayout.tsx --file components/learn/theory/TheorySection.tsx --file components/learn/theory/TheoryLessonReading.tsx --file components/learn/theory/CalloutBlock.tsx --file components/learn/theory/DiagramBlock.tsx --file components/learn/CodeBlock.tsx --file components/learn/theory/TheoryContent.tsx`

- [ ] **Step 6: Final commit and push**

```bash
git add -A
git commit -m "feat(reading-mode): complete 3-mode appearance system with focus toggle"
git push origin feature/energy-game-concept
```
