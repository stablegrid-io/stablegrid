# PJAirflow Senior-Level Project — Data Directory README

The senior-level project has **no code scaffolds, no reference Python files,
and no CSV data files**. This is by design, not omission.

Per Project Creation Rules §7.1:

> The senior project has no write-the-code chapters. The senior student
> proved they can write code across 10 modules. Code tasks would be a
> regression to a level below the project's purpose. Every chapter is
> either a structured diagnostic template, a design artefact, or a
> recommendation template.

All evidence the student consumes (pipeline inventories, scheduler metrics,
governance topology, incident summaries, architecture option descriptions,
policy excerpts) is embedded inline in the project JSON under each chapter's
`evidence` field. All grading is performed by comparing the student's
option selections against deterministic reference values.

---

## What would normally live here

For junior/mid level projects, this directory would contain:
- CSV data files the student's code reads
- Python scaffold files (`# YOUR SOLUTION BELOW`)
- Reference completion files used as fallbacks
- Test fixture Python files the assertion harness loads

None of these exist at senior level because the chapters are design
artefacts, not implementation exercises.

---

## What is in the project

- `../PJAirflow_Senior_Project.json` — 5 chapters, 51 grading units, all
  checkable by deterministic option equality
- `../PJAirflow_Senior_coverage.md` — module matrix + checkability
  verification
- `../PJAirflow_Senior_hints_audit.md` — §4.5 and §11.3 self-check log

The project can be graded entirely from student option selections and the
reference JSON — no filesystem, no fixtures, no code execution.
