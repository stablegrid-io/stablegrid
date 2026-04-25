# Design Journal — Chapter 5 Binding Specification

This file is **authoring documentation**, not student-facing. It defines
exactly how the design journal panel pre-populates Chapter 5's five
sections from graded fields in Chapters 1–4, and how the Chapter 5 rubric
evaluates consistency.

The grading engine uses this binding to:

1. Pre-populate the Chapter 5 template fields before the student opens the
   chapter (content is editable — the student may refine).
2. Detect contradictions between Chapter 5 edits and the journal source,
   surfacing them as rubric deductions.

---

## Journal entries produced by each chapter

| Entry ID | Source chapter | Source field(s) | What it records |
|---|---|---|---|
| `je_risk_1` | Ch1 | `risk_1_selection` + `risk_1_supporting_evidence` | The first identified risk with its evidence |
| `je_risk_2` | Ch1 | `risk_2_selection` + `risk_2_supporting_evidence` | The second identified risk with its evidence |
| `je_risk_3` | Ch1 | `risk_3_selection` + `risk_3_supporting_evidence` | The third identified risk with its evidence |
| `je_risk_ranking` | Ch1 | `most_critical_of_the_three` | Which risk is #1 priority |
| `je_chosen_option` | Ch2 | `architecture_option_selected` | Which of A, B, C was recommended |
| `je_criteria_justification` | Ch2 | `justification_cost`, `justification_regulatory_isolation`, `justification_onboarding_speed`, `justification_team_autonomy` | Per-criterion rationale |
| `je_accepted_tradeoffs` | Ch2 | `tradeoff_1`, `tradeoff_2` | The two trade-offs consciously accepted |
| `je_wave_1_pipelines` | Ch3 | `wave_1_assignments` | Which pipelines are in Wave 1 (days 1–30) |
| `je_wave_2_pipelines` | Ch3 | `wave_2_assignments` | Wave 2 (days 31–60) |
| `je_wave_3_pipelines` | Ch3 | `wave_3_assignments` | Wave 3 (days 61–90) |
| `je_policy_gap_1` | Ch4 | `gap_1_description` + `gap_1_policy_addition` | First governance gap identified with its policy text |
| `je_policy_gap_2` | Ch4 | `gap_2_description` + `gap_2_policy_addition` | Second gap + policy |
| `je_policy_gap_3` | Ch4 | `gap_3_description` + `gap_3_policy_addition` | Third gap + policy |

## Chapter 5 section pre-population

| Ch5 section | Pre-populated from | How the student is expected to edit |
|---|---|---|
| Situation | `je_risk_1`, `je_risk_2`, `je_risk_3` | Condense the three risks into 3–5 sentences framing the acquisition challenge |
| Options Considered | `je_chosen_option` + the non-chosen options from the Ch2 brief | Summarise the three options briefly; note which was recommended |
| Recommendation | `je_chosen_option`, `je_criteria_justification`, `je_accepted_tradeoffs` | Restate the recommendation with the strongest 2–3 justifications and the accepted trade-offs |
| Timeline | `je_wave_1_pipelines`, `je_wave_2_pipelines`, `je_wave_3_pipelines` | Describe each wave's scope and the rationale for its contents |
| Risks | `je_risk_ranking`, `je_policy_gap_1`, `je_policy_gap_2`, `je_policy_gap_3` | List the top-ranked risk and the three governance gaps as residual risks requiring active mitigation |

## Consistency rubric (applied by Ch5 grading)

Each Ch5 section is graded against its journal source with these rules:

- **Direct contradiction** (e.g., Ch5 Recommendation says Option B but
  `je_chosen_option` = Option A, with no acknowledgement of the change) →
  full deduction on that section's rubric criterion.
- **Partial omission** (e.g., Ch5 Timeline mentions only Wave 1 and Wave 3,
  skipping Wave 2) → half deduction.
- **Factual drift** (e.g., Ch5 Situation lists a risk that was not in
  `je_risk_1/2/3`) → half deduction.
- **Acknowledged change** (e.g., Ch5 Recommendation switches from A to B
  with the phrase "on reflection, Option B better addresses the capacity
  risk identified in Chapter 1") → no deduction; the change is legitimate.

## Fallback behaviour

If a chapter did not complete (student abandoned or assertion failures
prevented journal entry writes), the corresponding `je_*` entry is absent
and the Chapter 5 section is pre-populated with a `[missing — chapter N
not graded]` placeholder. The student may still author the section; the
rubric evaluates what the student wrote on its own merits (without a
source to compare against) but no consistency bonus is awarded.

## Panel display

The student-visible design journal panel on the right of the chapter view
shows a condensed view of the journal entries:

```
DESIGN JOURNAL

─ Audit ─
  Risk #1 (top):   {je_risk_1.label} [supported by: {je_risk_1.evidence}]
  Risk #2:         {je_risk_2.label}
  Risk #3:         {je_risk_3.label}

─ Architecture ─
  Recommendation:  {je_chosen_option.label}
  Key trade-off:   {je_accepted_tradeoffs[0]}

─ Migration ─
  Wave 1 (30d):    {count(je_wave_1_pipelines)} pipelines
  Wave 2 (60d):    {count(je_wave_2_pipelines)} pipelines
  Wave 3 (90d):    {count(je_wave_3_pipelines)} pipelines

─ Governance ─
  Gap 1: {je_policy_gap_1.description_short}
  Gap 2: {je_policy_gap_2.description_short}
  Gap 3: {je_policy_gap_3.description_short}
```

The panel is read-only within any chapter — entries cannot be edited in
Ch5 once written in earlier chapters. This is per §7.3.
