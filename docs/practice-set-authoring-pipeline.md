# Practice Set Authoring Pipeline

**Purpose:** Step-by-step pipeline for Claude when creating practice sets. Follow this sequence exactly. Do not skip steps. Output all files to `/mnt/user-data/outputs/practice_sets/[MODULE_PREFIX]/`.

---

## Step 0 — Receive the Request

The user provides:
- A module prefix (e.g., `PS7`, `PSI3`, `SQ6`, `AF5`)
- Optionally: specific tasks or concepts to focus on

From the prefix, determine:
- **Track level:** `PS` = junior PySpark, `PSI` = mid PySpark, `PSS` = senior PySpark, `SQ` = junior SQL, `SQI` = mid SQL, `F` = junior Fabric, `FI` = mid Fabric, `AF` = junior Airflow, `AFI` = mid Airflow, `PY` = junior Python, `PYI` = mid Python, etc.
- **Scenario company:** PySpark/Fabric = NordGrid, Airflow = SaulėGrid, SQL = HydroAlpes, Python = CelticWind

---

## Step 1 — Read the Theory Module

**Action:** Search project knowledge for the module JSON and concept plan.

```
Search: "[MODULE_PREFIX] module lessons"
Search: "[TRACK] concept plan module [N]"
```

Read the full module JSON. Extract:
1. Module title and objective
2. All lesson titles and descriptions
3. Key concepts taught per lesson
4. Code patterns shown
5. Scenario entities used (which tables, columns, regions)

**Output of this step:** A mental list of 8–15 testable concepts from the module.

---

## Step 2 — Design the Task Sequence

Using the Practice Set Creation Rules, design the task list:

| Step | Action |
|------|--------|
| 2a | Filter testable concepts to 5–7 (junior/mid) or 4–6 (senior). Not every lesson produces a task. |
| 2b | Assign task types based on level and module phase (see rules: §2.4 Phase Alignment). |
| 2c | Order tasks simplest → hardest. |
| 2d | Ensure the final task is a synthesis combining ≥3 module concepts. |
| 2e | Verify no task requires knowledge from a later module. |

**Present the task plan to the user before proceeding.** Format:

```
Practice Set: [MODULE_PREFIX] — [Module Title]
Level: [Junior / Mid-Level / Senior]
Tasks: [N] | Estimated Duration: [X] minutes

Task 1: [Title] — [type: write-the-code / diagnostic / etc.]
  Tests: [concept from lesson N]
  Grading: [output match / template / combined]

Task 2: ...
...

Task N (synthesis): [Title]
  Tests: [concept A + concept B + concept C]
  Grading: [assertion suite / combined]

Datasets needed:
  - [name].csv — [rows] rows, [description of characteristics]
  - [name].csv — [rows] rows, [description]
```

**Wait for user approval before proceeding to Step 3.**

---

## Step 3 — Create the Data Directory

**Output path:** `/mnt/user-data/outputs/practice_sets/[MODULE_PREFIX]/[MODULE_PREFIX]_data/`

### 3a — Create CSV Files

For each dataset identified in Step 2:

1. Hand-author the CSV with deliberate rows (never use random generation).
2. Follow size limits: 10–30 rows junior, 30–100 mid, 50–200 senior.
3. Use exact scenario column names from the theory module (meter_id, daily_kw, region, date, etc.).
4. Embed the specific characteristics tasks require (skew, nulls, duplicates, edge values).
5. Use realistic but scannable values — the student should see the pattern at a glance.

### 3b — Create the Data README

**Output path:** `/mnt/user-data/outputs/practice_sets/[MODULE_PREFIX]/[MODULE_PREFIX]_data/README.md`

---

## Step 4 — Create the Practice Set JSON

**Output path:** `/mnt/user-data/outputs/practice_sets/[MODULE_PREFIX]/[MODULE_PREFIX]_Practice.json`

### JSON Schema

```json
{
  "module_id": "module-PS7",
  "module_title": "Joins — Combining DataFrames",
  "track": "pyspark",
  "level": "junior",
  "scenario": "NordGrid Energy",
  "estimated_minutes": 55,
  "task_count": 6,
  "datasets": [...],
  "tasks": [...]
}
```

### Task Object Fields — Required

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | `module-[MODULE_ID]-task-[NN]` |
| `title` | string | 3–10 words, describes goal not technique |
| `type` | string | `write-the-code`, `output-prediction`, `concept-identification`, `synthesis-pipeline`, `diagnostic-analysis`, `fix-implementation`, `refactoring`, `diagnostic-workflow`, `trade-off-analysis`, `design-review`, `root-cause-analysis`, `design-artifact`, `architectural-synthesis` |
| `estimated_minutes` | int | Per-task estimate |
| `description` | object | `{context, task, validation_hint}` — all three required |
| `datasets_used` | array | Names from the top-level `datasets` array |
| `grading` | object | See grading structures below |

### Task Object Fields — Conditional

| Field | When Required | Description |
|-------|--------------|-------------|
| `scaffold` | All code tasks | Starter code with `# YOUR SOLUTION BELOW/ABOVE` markers |
| `evidence` | All diagnostic/review tasks (mid/senior) | Object with `{type, content}` |
| `template_fields` | All template-graded tasks | Array of field definitions |

### Template Field Structure

```json
{
  "template_fields": [
    {
      "id": "root_cause",
      "label": "Root cause",
      "type": "single_select",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": "Option A"
    },
    {
      "id": "skewed_key",
      "label": "Skewed key value",
      "type": "short_text",
      "correct": "NORTH",
      "accept_synonyms": ["north", "NORTH", "'NORTH'"]
    }
  ]
}
```

### Grading Structures

**Output match:**
```json
{
  "mechanism": "output_match",
  "expected_row_count": 14,
  "expected_columns": ["meter_id", "daily_kw", "region", "customer_type"]
}
```

**Assertion suite (partial credit):**
```json
{
  "mechanism": "assertion_suite",
  "assertions": [
    {"check": "row_count", "expected": 14},
    {"check": "columns_present", "expected": ["meter_id", "customer_type"]}
  ],
  "partial_credit": true
}
```

**Structured template:**
```json
{
  "mechanism": "template",
  "weight": 0.6
}
```

**Combined (mid/senior):**
```json
{
  "mechanism": "combined",
  "template_weight": 0.6,
  "code_weight": 0.4
}
```

---

## Step 5 — Self-Review Checklist

Before presenting files, run every check:

### All Levels
- [ ] Every task uses scenario data (NordGrid/SaulėGrid/HydroAlpes/CelticWind)?
- [ ] Every task specification is unambiguous?
- [ ] Every task solvable using only this module's theory?
- [ ] Final task synthesizes ≥3 module concepts?
- [ ] Task count within range for level?
- [ ] Total duration within range for level?
- [ ] All CSV column names match theory module exactly?
- [ ] Data README exists and documents all files?

### Junior-Specific
- [ ] No task solvable by copying theory code verbatim?
- [ ] Foundation modules (1–2) lean toward prediction/identification?

### Mid-Specific
- [ ] Every diagnostic task requires reading evidence before answering?
- [ ] Dropdown distractors are plausible?
- [ ] Evidence is realistic?

### Senior-Specific
- [ ] Tasks require reasoning that only matters at scale?
- [ ] Trade-off options genuinely compete?
- [ ] Acceptable answer ranges documented?

---

## Step 6 — Output Files

Create all files in the practice set directory:

```
practice_sets/
  PS7/
    PS7_Practice.json
    PS7_data/
      readings.csv
      meters_ref.csv
      README.md
```

### File Creation Order

1. Create the data directory
2. Create each CSV file
3. Create the data README
4. Create the practice JSON
5. Present all files to the user

---

## Quick Reference — What Goes Where

| Content | File | Format |
|---------|------|--------|
| Task definitions, descriptions, scaffolds | `[PREFIX]_Practice.json` | JSON |
| Test data | `[PREFIX]_data/[name].csv` | CSV with headers |
| Data documentation | `[PREFIX]_data/README.md` | Markdown |
| Grading logic | Inside `[PREFIX]_Practice.json` → `tasks[].grading` | JSON |
| Evidence (plans, metrics, logs) | Inside `[PREFIX]_Practice.json` → `tasks[].evidence` | JSON |
| Starter scaffolds | Inside `[PREFIX]_Practice.json` → `tasks[].scaffold` | JSON |
