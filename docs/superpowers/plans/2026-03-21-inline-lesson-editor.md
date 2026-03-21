# Inline Lesson Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admin users to edit theory lessons inline from the lesson reader, without navigating to the admin panel.

**Architecture:** Three new files (API route, hook, editor component) and two modified files (TheorySection, TheoryContent). The editor reuses the existing PATCH `/api/admin/theory-docs/lessons` endpoint. Admin status is checked via a lightweight GET endpoint. The InlineLessonEditor is a standalone component with its own draft state that replaces the read-only content when editing.

**Tech Stack:** Next.js App Router, React, Supabase (admin_memberships table), existing theory PATCH API

**Spec:** `docs/superpowers/specs/2026-03-21-inline-lesson-editor-design.md`

---

### Task 1: Admin Status API Route

**Files:**
- Create: `app/api/profile/admin-status/route.ts`

- [ ] **Step 1: Create the admin-status GET endpoint**

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ isAdmin: false });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('admin_memberships')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['content_admin', 'super_admin'])
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ isAdmin: false });
  }

  return NextResponse.json({ isAdmin: true });
}
```

- [ ] **Step 2: Verify it works manually**

Run: `curl -s http://localhost:3000/api/profile/admin-status` (should return `{"isAdmin":false}` without auth)

- [ ] **Step 3: Commit**

```bash
git add app/api/profile/admin-status/route.ts
git commit -m "feat: add admin-status API endpoint for inline editing"
```

---

### Task 2: useAdminStatus Hook

**Files:**
- Create: `lib/hooks/useAdminStatus.ts`

- [ ] **Step 1: Create the hook**

```ts
'use client';

import { useEffect, useState } from 'react';

interface AdminStatusState {
  isAdmin: boolean;
  isLoading: boolean;
}

export const useAdminStatus = (): AdminStatusState => {
  const [state, setState] = useState<AdminStatusState>({
    isAdmin: false,
    isLoading: true
  });

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const response = await fetch('/api/profile/admin-status', {
          cache: 'no-store'
        });
        if (cancelled) return;

        if (!response.ok) {
          setState({ isAdmin: false, isLoading: false });
          return;
        }

        const data = (await response.json()) as { isAdmin?: boolean };
        if (cancelled) return;

        setState({ isAdmin: Boolean(data.isAdmin), isLoading: false });
      } catch {
        if (!cancelled) {
          setState({ isAdmin: false, isLoading: false });
        }
      }
    };

    void check();
    return () => { cancelled = true; };
  }, []);

  return state;
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/hooks/useAdminStatus.ts
git commit -m "feat: add useAdminStatus client hook"
```

---

### Task 3: InlineLessonEditor Component

**Files:**
- Create: `components/learn/theory/InlineLessonEditor.tsx`

This is the largest task. The component renders editable form fields for all 11 block types, plus title/minutes fields and a Save/Cancel toolbar.

- [ ] **Step 1: Create the InlineLessonEditor component**

The component needs:
- Props: `section` (TheorySection), `topic` (string), `chapterId` (string), `onSave` (callback with updated TheorySection), `onCancel` (callback)
- Local state: `title`, `estimatedMinutes`, `blocks` (ContentBlock[]), `saving`, `saveError`
- Block editing: for each block type, render appropriate form fields (matching the block editor specs in the design doc)
- Block operations: add (from dropdown), delete, duplicate (deep clone after original), move up/down
- Save handler:
  ```ts
  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch('/api/admin/theory-docs/lessons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          chapterId,
          lessonId: section.id,
          title,
          estimatedMinutes,
          blocks
        })
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? 'Save failed.');
      }
      const payload = await response.json();
      // Response shape: { data: { topic, doc, chapterId, lesson } }
      // where lesson is TheorySection (AdminTheoryLessonMutationPayload)
      onSave(payload.data.lesson);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };
  ```
- Cancel: call `onCancel` callback

**Block editor field patterns** (replicate from `TheoryLessonsSection.tsx` lines 800-1100):
- paragraph: textarea for `content`
- heading/subheading: input for `content`
- callout: select for `variant`, input for `title`, textarea for `content`
- bullet-list/numbered-list: textarea (one item per line, split on `\n`)
- key-concept: input for `term`, textarea for `definition`, textarea for `analogy`
- code: input for `language`, input for `label`, textarea (monospace) for `content`
- diagram: input for `title`, input for `caption`, textarea (monospace) for `content`
- table: input for `headers` (pipe-separated), textarea for `rows` (pipe-separated per row), input for `caption`
- comparison: input for `title`, left label input + points textarea, right label input + points textarea

**Styling:** Use the lesson reader's light/dark theme. Input class pattern:
```
"w-full rounded-lg border border-light-border bg-light-surface px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-dark-border dark:bg-dark-surface"
```

**Toolbar:** Sticky at the bottom of the editor with Save (primary, disabled + spinner during save), Cancel (secondary), and Add Block dropdown.

**Helper functions** — copy these from `TheoryLessonsSection.tsx:158-210` into the new file (they are small pure functions, not worth a shared module):
- `toLineItems(value: string)` — split textarea by newline, trim, filter empty
- `fromLineItems(items: string[])` — join with newline
- `toTableRows(value: string)` / `fromTableRows(rows: string[][])` — pipe-separated
- `createDefaultBlock(type: BlockType)` — returns a new empty block of given type
- `cloneBlock(block: ContentBlock)` — JSON deep clone

Reference files:
- Block type definitions: `types/theory.ts`
- Admin block editors (for field logic, not styling): `components/admin/TheoryLessonsSection.tsx:800-1100`

- [ ] **Step 2: Commit**

```bash
git add components/learn/theory/InlineLessonEditor.tsx
git commit -m "feat: add InlineLessonEditor component with all block type editors"
```

---

### Task 4: Wire Edit Mode into TheorySection

**Files:**
- Modify: `components/learn/theory/TheorySection.tsx:17-21` (props interface)
- Modify: `components/learn/theory/TheorySection.tsx:223-265` (component body)

- [ ] **Step 1: Add edit-mode props to TheorySectionProps**

Add to the existing interface at line 17:

```ts
interface TheorySectionProps {
  section: TheorySectionType;
  lessonIndex: number;
  lessonTotal: number;
  showHeader?: boolean;
  // New props for inline editing
  isAdmin?: boolean;
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditEnd?: (updatedSection?: TheorySectionType) => void;
  editContext?: { topic: string; chapterId: string };
}
```

- [ ] **Step 2: Update the TheorySection component body**

Replace the component body (lines 223-265) to conditionally render `InlineLessonEditor` when editing:

```tsx
export const TheorySection = ({
  section,
  lessonIndex,
  lessonTotal,
  showHeader = true,
  isAdmin = false,
  isEditing = false,
  onEditStart,
  onEditEnd,
  editContext
}: TheorySectionProps) => {
  if (isEditing && editContext && onEditEnd) {
    return (
      <section id={section.id} data-section-id={section.id}>
        <InlineLessonEditor
          section={section}
          topic={editContext.topic}
          chapterId={editContext.chapterId}
          onSave={(updated) => onEditEnd(updated)}
          onCancel={() => onEditEnd()}
        />
      </section>
    );
  }

  return (
    <section id={section.id} data-section-id={section.id}>
      {showHeader ? (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="rounded-full bg-brand-500/10 px-2.5 py-1 font-semibold uppercase tracking-[0.12em] text-brand-500">
              Lesson {lessonIndex + 1} of {lessonTotal}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-text-light-tertiary dark:text-text-dark-tertiary">
                ~{section.estimatedMinutes} min
              </span>
              {isAdmin && onEditStart ? (
                <button
                  onClick={onEditStart}
                  className="hidden rounded-md border border-light-border px-2 py-0.5 text-[11px] font-medium text-text-light-secondary transition hover:border-brand-400 hover:text-brand-500 md:inline-flex dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-brand-400 dark:hover:text-brand-400"
                >
                  Edit
                </button>
              ) : null}
            </div>
          </div>
          <h2 className="mb-6 border-b border-light-border pb-3 text-xl font-semibold dark:border-dark-border">
            {section.title}
          </h2>
        </>
      ) : isAdmin && onEditStart ? (
        <div className="mb-4 flex justify-end">
          <button
            onClick={onEditStart}
            className="hidden rounded-md border border-light-border px-2 py-0.5 text-[11px] font-medium text-text-light-secondary transition hover:border-brand-400 hover:text-brand-500 md:inline-flex dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-brand-400 dark:hover:text-brand-400"
          >
            Edit
          </button>
        </div>
      ) : null}
      <div className="space-y-5">
        {section.blocks.map((block, index) => {
          const segmentId = shouldTrackReadingBlock(block)
            ? `${section.id}-segment-${index}`
            : null;
          return (
            <div
              key={`${section.id}-${index}`}
              id={segmentId ?? undefined}
              data-reading-segment-id={segmentId ?? undefined}
            >
              <RenderBlock block={block} isFirstBlock={index === 0} />
            </div>
          );
        })}
      </div>
    </section>
  );
};
```

Import `InlineLessonEditor` at the top:
```ts
import { InlineLessonEditor } from '@/components/learn/theory/InlineLessonEditor';
```

- [ ] **Step 3: Commit**

```bash
git add components/learn/theory/TheorySection.tsx
git commit -m "feat: add edit mode toggle to TheorySection"
```

---

### Task 5: Wire Edit State into TheoryContent

**Files:**
- Modify: `components/learn/theory/TheoryContent.tsx:1-10` (imports)
- Modify: `components/learn/theory/TheoryContent.tsx:20-36` (props interface)
- Modify: `components/learn/theory/TheoryContent.tsx:38-54` (component body - add state)
- Modify: `components/learn/theory/TheoryContent.tsx:272-278` (TheorySection render)

- [ ] **Step 1: Add imports**

Add at the top of the file:
```ts
import { useRouter } from 'next/navigation';
import type { TheorySection as TheorySectionType } from '@/types/theory';
```

- [ ] **Step 2: Add admin prop to TheoryContentProps interface**

Add to the interface (around line 20):
```ts
isAdmin?: boolean;
```

- [ ] **Step 3: Add edit state and handlers inside the component body**

After existing state declarations (around line 98), add:
```ts
const router = useRouter();
const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
const [localSections, setLocalSections] = useState(activeModule.sections);
```

Add a useEffect to reset state when the active module or lesson changes:
```ts
useEffect(() => {
  setLocalSections(activeModule.sections);
  setEditingLessonId(null);
}, [activeModule.id, visibleLesson?.id]);
```

Update `orderedLessons` to read from `localSections` instead of `activeModule.sections`:
```ts
// Change the existing line:
//   const orderedLessons = sortLessonsByOrder(activeModule.sections);
// To:
const orderedLessons = sortLessonsByOrder(localSections);
```

Add the edit end handler:
```ts
const handleEditEnd = (updatedSection?: TheorySectionType) => {
  if (updatedSection) {
    setLocalSections((prev) =>
      prev.map((s) => (s.id === updatedSection.id ? updatedSection : s))
    );
    router.refresh();
  }
  setEditingLessonId(null);
};
```

- [ ] **Step 4: Pass edit props to TheorySection**

Update the TheorySection render (around line 273):
```tsx
<TheorySection
  section={visibleLesson}
  lessonIndex={Math.max(activeLessonIndex, 0)}
  lessonTotal={orderedLessons.length}
  showHeader={false}
  isAdmin={isAdmin}
  isEditing={editingLessonId === visibleLesson.id}
  onEditStart={() => setEditingLessonId(visibleLesson.id)}
  onEditEnd={handleEditEnd}
  editContext={{ topic, chapterId: activeModule.id }}
/>
```

- [ ] **Step 5: Commit**

```bash
git add components/learn/theory/TheoryContent.tsx
git commit -m "feat: wire edit state management into TheoryContent"
```

---

### Task 6: Pass Admin Status from TheoryLayout

**Files:**
- Modify: `components/learn/theory/TheoryLayout.tsx`

- [ ] **Step 1: Add useAdminStatus to TheoryLayout**

The file is a `'use client'` component that renders `TheorySidebar` and `TheoryContent`.

1. Add import at the top:
   ```ts
   import { useAdminStatus } from '@/lib/hooks/useAdminStatus';
   ```
2. Inside the component body, add:
   ```ts
   const { isAdmin } = useAdminStatus();
   ```
3. Find the `<TheoryContent` render and add the `isAdmin` prop:
   ```tsx
   <TheoryContent
     ...existingProps
     isAdmin={isAdmin}
   />
   ```

- [ ] **Step 2: Commit**

```bash
git add components/learn/theory/TheoryLayout.tsx
git commit -m "feat: pass admin status from TheoryLayout to TheoryContent"
```

---

### Task 7: Tests

**Files:**
- Create: `tests/integration/inline-lesson-editor.test.tsx`

- [ ] **Step 1: Write integration tests**

```ts
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TheorySection } from '@/components/learn/theory/TheorySection';
import { InlineLessonEditor } from '@/components/learn/theory/InlineLessonEditor';
import type { TheorySection as TheorySectionType } from '@/types/theory';

const testSection: TheorySectionType = {
  id: 'module-01-lesson-01',
  title: 'Lesson 1: Test Lesson',
  estimatedMinutes: 15,
  blocks: [{ type: 'paragraph', content: 'Test paragraph content.' }]
};

describe('Inline Lesson Editor', () => {
  it('hides edit button for non-admin users', () => {
    render(
      <TheorySection
        section={testSection}
        lessonIndex={0}
        lessonTotal={3}
        isAdmin={false}
      />
    );
    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
  });

  it('shows edit button for admin users', () => {
    const onEditStart = vi.fn();
    render(
      <TheorySection
        section={testSection}
        lessonIndex={0}
        lessonTotal={3}
        isAdmin={true}
        onEditStart={onEditStart}
      />
    );
    expect(screen.getByRole('button', { name: /edit/i })).toBeDefined();
  });

  it('renders editor when isEditing is true', () => {
    const onEditEnd = vi.fn();
    render(
      <TheorySection
        section={testSection}
        lessonIndex={0}
        lessonTotal={3}
        isAdmin={true}
        isEditing={true}
        onEditEnd={onEditEnd}
        editContext={{ topic: 'pyspark', chapterId: 'module-01' }}
      />
    );
    // InlineLessonEditor renders Save and Cancel buttons
    expect(screen.getByRole('button', { name: /save/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDefined();
  });

  it('calls onCancel when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <InlineLessonEditor
        section={testSection}
        topic="pyspark"
        chapterId="module-01"
        onSave={vi.fn()}
        onCancel={onCancel}
      />
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onSave with updated section after successful save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const updatedLesson = { ...testSection, title: 'Updated Title' };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          topic: 'pyspark',
          chapterId: 'module-01',
          doc: {},
          lesson: updatedLesson
        }
      })
    });

    render(
      <InlineLessonEditor
        section={testSection}
        topic="pyspark"
        chapterId="module-01"
        onSave={onSave}
        onCancel={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/theory-docs/lessons',
      expect.objectContaining({ method: 'PATCH' })
    );
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run tests/integration/inline-lesson-editor.test.tsx`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/integration/inline-lesson-editor.test.tsx
git commit -m "test: add integration tests for inline lesson editor"
```

---

### Task 8: Manual Verification

- [ ] **Step 1: Start dev server and test the full flow**

1. Navigate to `/learn/airflow/theory/beginner-track`, click into a lesson
2. Verify "Edit" button appears (you are super_admin)
3. Click Edit - verify form fields appear for title, minutes, and all blocks
4. Modify a paragraph's text
5. Click Save - verify content updates inline and sidebar refreshes
6. Click Edit again, make a change, click Cancel - verify changes are discarded
7. Test adding a new block, deleting a block, moving blocks up/down
8. Navigate to a different lesson while not editing - verify no stale edit state

- [ ] **Step 2: Final commit with any fixes**

```bash
git add -A
git commit -m "fix: address manual testing feedback for inline editor"
```
