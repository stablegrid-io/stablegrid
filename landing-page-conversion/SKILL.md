---
name: landing-page-conversion
description: Plan, audit, and implement high-converting landing pages using measurable CRO heuristics (offer clarity, form friction, social proof, CTA focus, mobile UX, and speed). Use when Codex needs to create a new landing page, critique or redesign an existing page, prioritize A/B tests, improve signup/demo/purchase conversion, or map section-level copy and UX changes to business impact.
---

# Landing Page Conversion

Build or optimize landing pages for conversion-first outcomes, not aesthetic-only changes.

## Workflow

1. Define conversion objective and traffic context.
- Confirm one primary conversion action (`book_demo`, `start_trial`, `download_guide`, `buy_now`).
- Confirm audience intent source (paid, organic, email, referral, direct).
- Confirm value proposition in one sentence.

2. Audit the page with measurable checks.
- Run the 5-second clarity test on hero headline/subheadline.
- Count form fields and mark non-essential fields for removal.
- Check CTA focus (single primary CTA, repeated consistently).
- Check proof quality (specific outcomes, real identity, relevance to objections).
- Check mobile friction (tap target size, spacing, keyboard types, thumb reach, scroll depth).
- Check performance baseline (mobile LCP/load perception, image weight, script bloat).

3. Rewrite structure and copy for reduced friction.
- Keep structure simple: hero -> problem/value -> proof -> how it works/features -> risk reversal -> final CTA.
- Convert vague claims into quantified outcomes.
- Keep sentences short and concrete; remove jargon and filler.
- Align CTA copy with user intent stage (`start trial` vs `contact sales`).

4. Prioritize implementation in impact order.
- Prioritize: form length -> headline clarity -> CTA clarity -> proof placement -> mobile fixes -> speed fixes.
- Recommend a minimal change set first; avoid large redesigns before low-effort high-impact fixes.

5. Deliver implementation-ready output.
- Provide section-by-section copy recommendations.
- Provide component-level UI/UX changes (layout, hierarchy, states, accessibility).
- Provide an experiment backlog with hypothesis, primary metric, and stopping criteria.

## Output Contract

When asked to build or improve a landing page, produce:

1. `Conversion Diagnosis`
- Top blockers ranked by estimated impact and effort.

2. `Revised Page Blueprint`
- Ordered sections with intent for each section.
- Primary CTA and optional secondary CTA policy.

3. `Copy Drafts`
- Hero headline/subheadline options.
- CTA labels.
- Proof snippets and risk-reversal copy.

4. `Implementation Checklist`
- Mobile-first interaction checks.
- Page-speed quick wins.
- Analytics and event tracking requirements.

5. `Test Plan`
- 3-5 experiments in sequence.
- Success metric, minimum duration, and no-peeking rule.

## Guardrails

- Keep one page to one primary intent and one primary CTA.
- Reject manipulative dark patterns or false urgency.
- Avoid adding fields, sections, or animations without conversion rationale.
- Keep optional style changes secondary to clarity and friction reduction.
- Preserve message match between ad/source intent and landing page hero.

## References

Load [references/lovable-conversion-principles.md](references/lovable-conversion-principles.md) when you need concrete CRO benchmarks, copy formulas, mobile/performance thresholds, and test sequencing guidance.

## Example User Requests

- "Audit this SaaS landing page and tell me why demo conversions are low."
- "Rewrite this hero and CTA for paid search traffic."
- "Give me a high-impact CRO plan for a page with only 600 weekly visitors."
- "Create a full landing page outline and copy for a B2B trial offer."
