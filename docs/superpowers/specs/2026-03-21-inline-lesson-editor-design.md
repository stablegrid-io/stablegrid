# Inline Lesson Editor

**Date:** 2026-03-21
**Status:** Approved

## Problem

Editing theory lesson content currently requires navigating to the admin panel, selecting the track/module/lesson, making changes, and saving. This context switch is slow and disorienting when you're reading a lesson and spot a typo or want to restructure a block.

## Solution

Add an inline editing mode to the theory lesson reader. Admin users see an "Edit" button on each lesson. Clicking it replaces the rendered content with form fields for editing title, estimated minutes, and all content blocks. Saves use the existing PATCH `/api/admin/theory-docs/lessons` endpoint.

## Scope

- One lesson at a time editing (not full module)
- Reuses existing save API (writes to published JSON files on disk)
- Admin-only (requires `admin_memberships` row with `content_admin` or `super_admin` role)
- All block types supported: paragraph, heading, subheading, callout, bullet-list, numbered-list, key-concept, code, diagram, table, comparison
- Drag-and-drop block reordering deferred to v2 (use move up/down buttons for v1)
- JSON toggle deferred to v2 (visual mode only for v1)
- Mobile: edit button hidden on viewports < 768px (complex form fields are impractical on small screens)

## Architecture

### New Files

1. **`app/api/profile/admin-status/route.ts`** - GET endpoint that checks if the authenticated user has an `admin_memberships` row with role `content_admin` or `super_admin`. Returns `{ isAdmin: boolean }`. Uses the service role client to query `admin_memberships` (same pattern as middleware).

2. **`lib/hooks/useAdminStatus.ts`** - Client-side hook that calls the admin-status API once on mount, caches the result. Returns `{ isAdmin: boolean, isLoading: boolean }`.

3. **`components/learn/theory/InlineLessonEditor.tsx`** - Standalone editor component that renders form fields for a single lesson. Props: `section` (TheorySection), `topic` (string), `chapterId` (string), `onSave` (callback with updated section), `onCancel` (callback). Manages its own draft state for title, estimatedMinutes, and blocks array.

### Modified Files

4. **`components/learn/theory/TheorySection.tsx`** - Add an "Edit" button in the lesson header (visible when `isAdmin` is true, edit mode is off, and viewport >= 768px). When edit mode is active for this lesson, render `InlineLessonEditor` instead of the read-only block renderers.

5. **`components/learn/theory/TheoryContent.tsx`** - Thread `topic` and admin status down to TheorySection. Manage which lessonId is currently being edited (only one at a time). Provide `onEditStart` / `onEditEnd` callbacks.

### Unchanged

- **`app/api/admin/theory-docs/lessons/route.ts`** - Existing PATCH endpoint. No changes needed.
- **`lib/admin/theory.ts`** - Existing server-side logic for reading/writing theory docs. No changes needed.
- **`components/admin/TheoryLessonsSection.tsx`** - Admin panel editor stays untouched.

## Save Payload and Post-Save Strategy

The PATCH request sends the full lesson payload matching the existing API contract:

```json
{
  "topic": "airflow",
  "chapterId": "module-AFI1",
  "lessonId": "module-AFI1-lesson-01",
  "title": "Lesson 1: Why TaskFlow Exists",
  "estimatedMinutes": 12,
  "blocks": [...]
}
```

On success, the PATCH response returns `{ data: { topic, lesson, chapter } }`. The `InlineLessonEditor` calls `onSave(updatedSection)` with the response data, and `TheoryContent` updates the local section state directly (optimistic-style, no refetch). This updates the visible lesson content immediately. A `router.refresh()` is also triggered to refresh server-rendered sidebar data (lesson titles, module minutes) so the sidebar reflects any title or timing changes.

## User Flow

1. Admin loads any theory lesson page
2. `useAdminStatus` hook fires, confirms admin role
3. A small "Edit" button appears in the lesson header area (desktop only)
4. Clicking "Edit" transitions the lesson to edit mode:
   - Title becomes an editable input field
   - Estimated minutes becomes an editable number input
   - Each content block renders as an editable card with type-specific form fields
   - A toolbar appears at the bottom with: Save (primary button, disabled + spinner during save), Cancel, and Add Block dropdown
5. Blocks can be moved up/down, deleted, or duplicated (deep clone inserted after original)
6. "Save" sends PATCH to `/api/admin/theory-docs/lessons` with the full lesson payload
7. On success: exits edit mode, updates the displayed content with response data, refreshes server components
8. "Cancel" discards all changes, returns to read mode
9. Only one lesson can be in edit mode at a time

## Block Editor Specifications

Each block type has specific form fields:

| Block Type | Fields |
|---|---|
| paragraph | Single textarea for content |
| heading | Single input for content |
| subheading | Single input for content |
| callout | Variant select (info/tip/warning/danger/insight), title input, content textarea |
| bullet-list | Textarea (one item per line) |
| numbered-list | Textarea (one item per line) |
| key-concept | Term input, definition textarea, analogy textarea |
| code | Language input, label input, code textarea (monospace) |
| diagram | Title input, caption input, content textarea (monospace) |
| table | Headers input (pipe-separated), rows textarea (pipe-separated per row), caption input |
| comparison | Title input, left label + points textarea, right label + points textarea |

## Styling

- The inline editor uses the lesson reader's theme (light/dark responsive), not the admin panel's dark-only theme
- Input fields: rounded borders, subtle background, consistent with the app's form field patterns
- Block cards: light border, slight background differentiation to visually separate blocks
- Toolbar: sticky at bottom of edit area, with clear Save (primary) and Cancel (secondary) buttons
- Save button shows a spinner and is disabled during the save request
- Edit button: small, subtle, positioned near the lesson title - not distracting during normal reading
- Hidden on mobile (viewport < 768px)

## Admin Status Check

The admin status API is intentionally simple and separate from the middleware admin check:

- Middleware checks admin status for `/admin` routes (server-side, blocks navigation)
- The new API endpoint checks specifically for `content_admin` or `super_admin` role (matching the PATCH endpoint requirement)
- If the API fails or returns false, no Edit button appears - the lesson reader works exactly as before
- The PATCH endpoint independently enforces `content_admin` role, so even if someone spoofs the client-side check, unauthorized saves are rejected

## Error Handling

- Save failures show an inline error message above the toolbar with the error text
- Network errors show a generic "Save failed" message
- Validation errors from the server (empty title, invalid blocks) are displayed as-is
- The editor does not auto-save - explicit Save action only
- Unsaved changes: if the user tries to navigate away with unsaved edits, no browser prompt (keep it simple for v1)

## Testing Approach

- Unit test for `useAdminStatus` hook (mock fetch, verify states)
- Integration test for the admin-status API route
- Integration test for TheorySection rendering the Edit button when admin, hidden for non-admin
- Integration test for InlineLessonEditor save flow (mock PATCH, verify state transitions)
- Integration test for cancel discarding changes
