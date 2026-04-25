# PJAirflow Mid-Level Project — Dataset README

Unlike junior-level (which uses CSV data files), the mid-level project's
evidence is presented as inline tables, log excerpts, and code excerpts
inside the project JSON's per-chapter `evidence` field. The files in this
directory are Python artefacts: the code the student edits and the fixtures
the grader uses.

---

## scaffold_chapter_3.py — the broken Bronze DAG

The current production Bronze DAG. The student edits it in place to:
1. Add `from airflow.datasets import Dataset` to the imports
2. Declare `SILVER_DATASET = Dataset("saulegrid://bronze/meters")` at module level
3. Add `outlets=[SILVER_DATASET]` to the `@task` decorator on `load_bronze`
4. Delete the TriggerDagRunOperator block and the `loaded >> trigger_silver` line

The scaffold is intentionally close to the reference — the student is
diagnosing and fixing, not rebuilding. The gap between scaffold and
reference is exactly the 4 edits above.

## reference_chapter_3.py — the fixed Bronze DAG

Used as the fallback input for Chapter 4 if the student's Chapter 3
produced a DAG that cannot be loaded. The grader feeds this into the
DagBag before running the student's Chapter 4 function against the
fixtures.

## scaffold_chapter_4.py — the prevention test starter

Empty `find_orphaned_consumers(dag_bag)` function signature. The student
implements the body. The function takes a DagBag and returns a sorted
list of orphaned consumer dag_ids.

## reference_chapter_4.py — the prevention test reference

Correct implementation. Verified against all three grading fixtures:
- valid DagBag → returns `[]`
- broken DagBag → returns `['fixture_silver']`
- cron-scheduled DAG (in the broken bag) → must NOT appear in the return

## ref_silver_consumer_dag.py / ref_gold_consumer_dag.py

Read-only reference files. Shown to the student in the Chapter 2 evidence
panels and available for inspection when working on Chapter 3. The student
does not edit these — the Friday migration correctly wired the consumer
sides, and editing them would undo Rokas's valid work.

---

## test_fixture_valid_dagbag.py

A correctly linked three-DAG bag:
- `fixture_bronze` — cron schedule, task with `outlets=[Dataset("saulegrid://bronze/meters")]`
- `fixture_silver` — schedule=[bronze dataset], task with `outlets=[Dataset("saulegrid://silver/meters")]`
- `fixture_gold` — schedule=[silver dataset]

Expected `find_orphaned_consumers(dag_bag)` return: `[]`

Tests: A4_2 (correctly-linked-returns-empty)

## test_fixture_broken_dagbag.py

A deliberately broken three-DAG bag:
- `fixture_bronze` — cron schedule, task with NO outlets (the bug)
- `fixture_silver` — schedule=[bronze dataset] → ORPHANED
- `fixture_gold_cron` — cron schedule, no outlets (must NOT be flagged)

Expected `find_orphaned_consumers(dag_bag)` return: `['fixture_silver']`

Tests: A4_3 (broken-flags-silver) and A4_4 (cron-ignored)

---

## Scenario Continuity

All references use SaulėGrid's mid-level entities: 1,200,000 meters,
10 regions, three-layer Bronze-Silver-Gold pipeline, `sftp_saulegrid_meters`
Connection, Europe/Vilnius timezone, VERT regulatory extracts. Column and
entity names match the Airflow Junior-Level Track and companion tracks.
