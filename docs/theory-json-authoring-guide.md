# Theory Track JSON Authoring Guide

This guide defines the preferred JSON structure and content rules for StableGrid theory tracks.

Use it after `DOCX -> normalized JSON` and before publishing to `data/learn/theory/published/*.json`.

The goal is not only valid JSON. The goal is theory content that is:

- easy to scan
- easy to learn
- pleasant to read in the current reader UI
- consistent across tracks
- easy to validate and maintain

## 1. What Good Looks Like

A good theory track JSON file should:

- have a stable, predictable schema
- break modules into multiple real lessons
- avoid giant title+subtitle walls
- avoid raw DOCX scaffolding in the lesson body
- use structured blocks instead of paragraph spam
- surface concepts in a way the current UI can turn into clean keyword pills, headings, callouts, diagrams, and lists

## 2. Canonical Top-Level Shape

Published track files should follow this shape:

```json
{
  "topic": "fabric",
  "title": "Microsoft Fabric: Data Engineering Track",
  "description": "One-sentence track summary.",
  "version": "DOCX import 2026-03-19",
  "chapters": [
    {
      "id": "module-F1",
      "number": 1,
      "title": "Platform Foundations & Architecture",
      "description": "One-sentence module summary.",
      "totalMinutes": 42,
      "sections": [
        {
          "id": "module-F1-lesson-01",
          "title": "What Is Microsoft Fabric?",
          "estimatedMinutes": 8,
          "blocks": []
        }
      ]
    }
  ]
}
```

## 3. Required Fields

### Track

| Field | Required | Notes |
| --- | --- | --- |
| `topic` | Yes | Use the product topic, not the track slug. Example: Fabric tracks still use `"topic": "fabric"`. |
| `title` | Yes | Reader-facing track title. |
| `description` | Yes | One sentence. Clear and concrete. |
| `version` | Recommended | Use a clear import/revision label. |
| `chapters` | Yes | This is the main module array. |

### Module

| Field | Required | Notes |
| --- | --- | --- |
| `id` | Yes | Stable route/task id. Example: `module-F1`, `module-BI2`. |
| `number` | Yes | 1-based module order. |
| `title` | Yes | Short module name. |
| `description` | Yes | One sentence explaining what the module teaches. |
| `totalMinutes` | Yes | Must match the sum of lesson `estimatedMinutes`. |
| `sections` | Yes | Lessons in the module. |

### Lesson

| Field | Required | Notes |
| --- | --- | --- |
| `id` | Yes | Stable id. Example: `module-F1-lesson-01`. |
| `title` | Yes | Reader-facing lesson title. |
| `estimatedMinutes` | Yes | Positive integer. |
| `blocks` | Yes | Ordered content blocks. |

## 4. Optional Fields You Usually Do Not Need to Author Manually

The schema supports these, but most hand-authored published docs should omit them unless there is a specific reason:

- `id` on the top-level doc
- `slug`
- `status`
- `order`
- `learningStatus`
- `durationMinutes`
- `modules`

Author `chapters`. Do not duplicate `chapters` into `modules` manually unless a workflow explicitly requires it.

## 5. Stable ID Rules

IDs matter because routes, admin editing, progress, and activation tasks can depend on them.

### Module IDs

Use:

- `module-F1`
- `module-F2`
- `module-BI1`
- `module-07`

### Lesson IDs

Use:

- `module-F1-lesson-01`
- `module-F1-lesson-02`
- `module-BI3-lesson-04`

Rules:

- keep IDs stable once published
- never reuse an old ID for a different lesson
- do not change IDs just to “clean them up” after tasks or routes already reference them

## 6. Track-Level Content Rules

### Use Real Lessons, Not One Giant Module Dump

Bad:

- one 60-90 minute module flattened into a single lesson

Good:

- one module split into 6-12 lessons
- each lesson covers one idea or one tight cluster of ideas

### Write for the Reader UI

The current theory reader works best when:

- titles are short enough to wrap cleanly
- the lesson intro can extract 2-3 useful keyword pills
- paragraphs are short
- headings are meaningful
- diagrams/tables/code use the correct block types

If the JSON is technically valid but structurally noisy, the reading experience still feels bad.

## 7. Lesson Title Rules

The lesson title is the most important UX field.

### Recommended title rules

- 3-9 words is ideal
- aim for under 60 characters when possible
- avoid sentence-length titles
- avoid “title + subtitle” stacked into one long line
- use nouns and concepts, not full explanatory sentences

### Good examples

- `What Is Microsoft Fabric?`
- `The Seven Workloads`
- `OneLake as the Storage Layer`
- `Lakehouse vs Warehouse`
- `DirectLake and Semantic Models`
- `Licensing, Trials, and Cost Planning`

### Bad examples

- `Understanding Fabric’s cost model before you start building prevents surprises`
- `The Lakehouse Architecture and Why It Matters for the End-to-End Platform`
- `Licensing, Trials, and Cost Planning Understanding Fabric’s cost model before you start building prevents surprises`

### Important note

If you need nuance beyond the main title, do not cram it into the title.

Put that nuance into:

- keyword pills
- headings
- callouts
- lead paragraph

## 8. Keyword Pill Rules

The current reader can show 2-3 keyword pills under the lesson title.

To make that work well:

- keep lesson titles concept-driven
- use concise headings, subheadings, key concepts, and callout titles
- avoid long prose in early section labels

### Best pattern

Give the lesson 2-3 short concepts like:

- `Licensing`
- `Trials`
- `Capacity`

or:

- `Core idea`
- `DirectLake`
- `Refresh`

### Do not use pills as subtitles

Pills should be:

- short
- skimmable
- concept-level

They should not be:

- sentence fragments
- module metadata
- repeated copies of the full title

## 9. Recommended Lesson Recipe

Use this pattern for most lessons:

1. `paragraph`
   A short lead paragraph that answers: what is this and why does it matter?

2. `heading`
   The first real section heading.

3. `paragraph`
   Explanation.

4. `callout` or `key-concept`
   Highlight the key mental model.

5. `heading`
   Next major concept.

6. `bullet-list`, `numbered-list`, `table`, `comparison`, `diagram`, or `code`
   Use the structured format that matches the idea.

7. `heading`
   Final takeaway or practical application.

8. `bullet-list` or `callout`
   Summary, checklist, common mistakes, or what to remember.

This pattern creates rhythm and reduces walls of text.

## 10. Block Types and When to Use Them

### `paragraph`

Use for explanation and narrative.

Rules:

- 2-4 sentences is ideal
- roughly 40-90 words per paragraph is a good default
- avoid giant 200-word blocks
- avoid more than 3 consecutive paragraph blocks without a heading, callout, list, or structured block

### `heading`

Use for major lesson sections.

Rules:

- 2-6 words
- concept-oriented
- not a sentence

Examples:

- `Why Fabric Exists`
- `How OneLake Works`
- `Where Costs Come From`

### `subheading`

Use for smaller subsections under a heading.

Rules:

- keep it shorter than the body text
- do not use it as a long subtitle paragraph

### `callout`

Use for high-value emphasis.

Variants:

- `info`
- `tip`
- `warning`
- `danger`
- `insight`

Good uses:

- `Why it matters`
- `Common mistake`
- `Exam signal`
- `Production note`

### `bullet-list`

Use for:

- takeaways
- characteristics
- symptoms
- decision criteria

### `numbered-list`

Use for:

- step-by-step workflows
- ordered procedures
- sequences

### `table`

Use for:

- feature comparisons
- option matrices
- SKU / license differences
- role / permission breakdowns

Rules:

- headers required
- every row must match header width

### `key-concept`

Use when the lesson introduces a term that deserves a clear reusable definition.

Good for:

- `OneLake`
- `DirectLake`
- `Capacity Unit`
- `Delta Table`

### `comparison`

Use when the user should compare two concepts directly.

Good for:

- `Lakehouse vs Warehouse`
- `Import vs DirectLake`
- `SaaS vs PaaS`

### `diagram`

Use for:

- architecture diagrams
- data flow diagrams
- hierarchy diagrams
- storage layouts

Important:

- do not split ASCII diagrams into 20 paragraph blocks
- keep the whole diagram in one `diagram` block
- add a `title` and `caption` when useful

### `code`

Use for:

- SQL
- PySpark
- DAX
- KQL
- JSON examples

Important:

- `content` must not include markdown code fences
- the `language` field is required

## 11. Validator Hard Rules

The current validator enforces a few non-negotiable rules:

- all text fields must be non-empty
- lesson titles must be `<= 160` characters
- if a lesson title includes `Lesson N:`, the number must match its module order
- code blocks need a `language`
- code block content must not contain triple backticks
- list blocks need at least one item
- table blocks need headers and at least one row
- every table row must match the header width
- markdown links must use a valid target:
  - `https://...`
  - `http://...`
  - `/path`
  - `#anchor`
  - `mailto:...`

Design for the recommended UX rules above, but also make sure the file clears these validation rules before publish.

## 12. Word -> JSON Mapping Rules

When converting from Word, apply these transformations:

| Word content | JSON target | Rule |
| --- | --- | --- |
| `Module F1`, `Estimated Time`, `Welcome to Module F1` | metadata, not body | Do not keep these as standalone paragraph blocks. |
| `Part 1: ...`, `Part 2: ...` | `heading` | Strip the label if needed and keep a clean heading. |
| short concept label | `heading` or `subheading` | Keep it concise. |
| “Why it matters”, “Common mistake”, “Key idea” | `callout.title` | Great source for keyword pills. |
| bullet list in Word | `bullet-list` | Do not flatten into paragraphs. |
| numbered steps in Word | `numbered-list` | Preserve order. |
| side-by-side comparison | `comparison` or `table` | Prefer structure over prose. |
| architecture ASCII art | `diagram` | One block, not many paragraph rows. |
| term + definition | `key-concept` | Use `term`, `definition`, optional `analogy`. |
| code sample | `code` | No markdown fences. |

## 13. Raw Import Anti-Patterns to Remove

These are common DOCX-import leftovers that should be cleaned before publish:

- module code as a paragraph, for example `Module F1`
- module title repeated as the first lesson paragraph
- `Estimated Time: 90 Minutes` as a paragraph
- `Welcome to Module X` as a paragraph
- “This module covers:” followed by a huge paragraph instead of a list
- architecture diagrams split into one paragraph per ASCII line
- one lesson that contains an entire module
- 15+ consecutive paragraph blocks with no structure
- long sentence titles that act like title + subtitle + summary all at once

## 14. Before/After Example

### Bad imported shape

```json
[
  { "type": "paragraph", "content": "Module F1" },
  { "type": "paragraph", "content": "Platform Foundations & Architecture" },
  { "type": "paragraph", "content": "Estimated Time: 90 Minutes" },
  { "type": "paragraph", "content": "Welcome to Module F1" },
  { "type": "paragraph", "content": "This module covers: what Fabric is, the workloads, OneLake, capacity..." }
]
```

### Better authored shape

```json
[
  {
    "type": "paragraph",
    "content": "Microsoft Fabric is a unified analytics platform. In this lesson you will build the architectural mental model that makes the rest of the track easier to understand."
  },
  {
    "type": "heading",
    "content": "Why Fabric Exists"
  },
  {
    "type": "paragraph",
    "content": "Before Fabric, teams had to assemble multiple Azure services and maintain the integration points themselves."
  },
  {
    "type": "callout",
    "variant": "insight",
    "title": "Key idea",
    "content": "The integration is the product: one storage layer, one security model, one billing model."
  },
  {
    "type": "heading",
    "content": "Architecture Stack"
  },
  {
    "type": "diagram",
    "title": "Fabric architecture stack",
    "content": "Workloads -> OneLake -> Capacity -> Entra ID",
    "caption": "Every workload sits on the same storage, compute, and identity foundation."
  }
]
```

## 15. Recommended Module Structure

For most theory tracks:

- module = one broad theme
- lesson = one concept or one practical decision area

Recommended lesson counts:

- 5-8 lessons for a smaller module
- 8-12 lessons for a larger foundational module

If a module exceeds 90 minutes, split it further instead of turning it into one lesson.

## 16. Special Rule for Checkpoint Lessons

If a module includes a checkpoint lesson, make sure the lesson title includes:

`Module Checkpoint`

Example:

- `Lesson 8: Module Checkpoint`
- `Module Checkpoint`

The app detects checkpoint lessons by searching for `module checkpoint` in the title.

## 17. JSON Template You Can Reuse

```json
{
  "topic": "fabric",
  "title": "Microsoft Fabric: <Track Name>",
  "description": "<One sentence describing the track.>",
  "version": "DOCX import YYYY-MM-DD",
  "chapters": [
    {
      "id": "module-F1",
      "number": 1,
      "title": "<Module Title>",
      "description": "<One sentence module description.>",
      "totalMinutes": 24,
      "sections": [
        {
          "id": "module-F1-lesson-01",
          "title": "<Short Lesson Title>",
          "estimatedMinutes": 8,
          "blocks": [
            {
              "type": "paragraph",
              "content": "<Short lead paragraph.>"
            },
            {
              "type": "heading",
              "content": "<Main concept>"
            },
            {
              "type": "paragraph",
              "content": "<Explanation paragraph.>"
            },
            {
              "type": "callout",
              "variant": "insight",
              "title": "<Keyword-worthy phrase>",
              "content": "<High-value takeaway.>"
            },
            {
              "type": "heading",
              "content": "<Second concept>"
            },
            {
              "type": "bullet-list",
              "items": [
                "<Point 1>",
                "<Point 2>",
                "<Point 3>"
              ]
            }
          ]
        },
        {
          "id": "module-F1-lesson-02",
          "title": "<Short Lesson Title>",
          "estimatedMinutes": 8,
          "blocks": []
        },
        {
          "id": "module-F1-lesson-03",
          "title": "<Short Lesson Title>",
          "estimatedMinutes": 8,
          "blocks": []
        }
      ]
    }
  ]
}
```

## 18. Definition of Done Before Upload

Before publish, confirm all of these:

- the file passes the theory validator
- every module has multiple real lessons when the material is broad
- `totalMinutes` matches lesson minute sums
- lesson titles are short and readable
- the title is not doing the job of title + subtitle + summary
- there are 2-3 good keyword pill candidates
- the lesson does not open with metadata junk from DOCX
- diagrams are diagrams, not paragraph spam
- comparisons are comparisons/tables, not prose walls
- code blocks do not contain markdown fences
- there are no duplicate ids
- there are no duplicated `Lesson N: Lesson N:` prefixes

## 19. Copy-Paste Prompt Template for AI Conversion

Use this when converting from Word into StableGrid theory JSON:

```text
Convert the source material into StableGrid theory track JSON.

Output only valid JSON.

Follow these rules:
- Use the schema from docs/theory-json-authoring-guide.md.
- Keep topic as the platform topic, not the track slug.
- Break each module into multiple real lessons. Do not flatten a whole module into one lesson.
- Use short lesson titles. Do not write sentence-length titles.
- Do not include raw DOCX scaffolding as paragraph blocks:
  - Module X
  - Estimated Time
  - Welcome to Module
- Convert parts/sections into heading or subheading blocks.
- Convert key takeaways into bullet-list or numbered-list blocks.
- Convert architecture layouts into diagram blocks.
- Convert term/definition pairs into key-concept blocks.
- Use callouts for “why it matters”, “common mistake”, “exam signal”, or “production note”.
- Make sure each lesson is easy to scan and not just a wall of paragraphs.
- Prefer 2-4 sentence paragraphs.
- Ensure module totalMinutes equals the sum of lesson estimatedMinutes.
- Keep IDs stable using the provided module/lesson numbering pattern.

Additional UX requirements:
- The first screen of a lesson should feel clean and readable.
- Titles should be short enough to wrap well.
- Provide 2-3 good keyword pill candidates through concise concepts, headings, or callout titles.
```

## 20. Practical Recommendation

The fastest reliable workflow is:

1. Write the material in Word.
2. Run the normal pipeline to get normalized JSON.
3. Reshape the normalized JSON using this guide.
4. Preview it.
5. Publish it.

If the normalized JSON still looks like “Word paragraphs pasted into blocks,” it is not ready yet.
