# StableGrid Theory Beta Prelaunch Checklist

Use this checklist for the first public launch where Theory is the only complete learning mode.

## Launch scope (freeze before QA)

In scope:
- Auth: `/login`, `/signup`, password reset/update
- Theory entry: `/learn`, `/learn/theory`, `/learn/[topic]/theory`, `/learn/[topic]/theory/[category]`
- Theory progress persistence: `/api/learn/module-progress`
- Basic user-facing pages: `/`, `/progress`, `/settings`

Out of scope for this launch:
- Missions depth (`/missions/*`)
- Practice depth (`/practice/*`, `/flashcards`) unless explicitly declared beta-ready
- Revenue-critical paid conversion paths unless Stripe flows are actively enabled

## Go / no-go release gate

Ship only when all `P0` items are complete and evidenced. `P1` items can be open only with documented owner and date.

## P0 checklist (release blockers)

### QA-P0-001 Scope and messaging are explicit
- [x] Product copy labels this release as `Theory Beta` anywhere launch expectations are set.
- [x] No UI copy claims Missions/Flashcards/Tasks are already available unless true.

Acceptance criteria:
- Landing + app entry points use one consistent scope statement.
- No dead-end CTA exists for unfinished learning modes.

Evidence:
- Screenshot of landing hero and authenticated home/learn entry.

### QA-P0-002 Navigation has no dead ends
- [x] Top and bottom nav route users only to working experiences.
- [x] `/learn` consistently redirects to `/learn/theory`.

Acceptance criteria:
- All primary nav items load successfully (HTTP 200) and render valid content.
- Broken routes and placeholder pages are not linked from primary navigation.

Evidence:
- Route smoke checklist with screenshot per nav target.

### QA-P0-003 Auth and route protection policy is intentional
- [x] Access policy for Theory is defined: public read vs auth-required.
- [x] Middleware and server behavior match that policy.

Acceptance criteria:
- Anonymous access behavior is deterministic (no mixed redirect behavior).
- Protected surfaces never leak user-scoped data.
- Auth routes still redirect authenticated users away from `/login` and `/signup`.

Evidence:
- Manual verification notes for signed-out and signed-in flows.
- Middleware behavior verified in `middleware.ts`.

### QA-P0-004 Theory progress is correct and durable
- [x] Lesson/module completion writes to persistence and survives refresh + relogin.
- [x] Resume state (current lesson, last route) is restored consistently.

Acceptance criteria:
- Completing module checkpoints unlocks next module when rules are met.
- Progress remains correct after browser refresh and new session login.
- Topic-scoped progress does not bleed across other topics.

Evidence:
- Pass results for `tests/e2e/theory-module-completion.spec.ts`.
- Pass results for `tests/integration/module-progress-route.test.ts`.

### QA-P0-005 Critical automated suites are green
- [x] CI-equivalent core checks pass in production-ready branch.

Acceptance criteria:
- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run test:run` passes.
- `npm run test:e2e:key` passes.
- `npm run test:e2e:theory` passes.

Evidence:
- Command logs with timestamp and commit SHA.

### QA-P0-006 Analytics event pipeline is working
- [x] Client emits core funnel events.
- [x] `/api/analytics/events` accepts valid payloads.

Acceptance criteria:
- `signup_completed`, `chapter_started`, `first_chapter_started`, `chapter_completed`, and `first_chapter_completed` are observed for real beta sessions.
- Unknown event names are rejected with `400`.
- Missing analytics table fails soft with `202` (no user-facing break).

Evidence:
- API response samples for success and validation failure.
- Funnel output from `npm run report:funnel`.

### QA-P0-007 Error states are handled on core theory flow
- [x] Core pages render non-broken fallback states on fetch/persistence failure.
- [x] User can recover with retry or safe navigation action.

Acceptance criteria:
- No blank pages or infinite loading in theory routes.
- Expected fallback UI appears when progress endpoint fails.

Evidence:
- Screenshot + console/network logs from forced-failure test.

## P1 checklist (should be done before broad launch)

### QA-P1-001 Mobile and accessibility baseline
- [x] Keyboard navigation reaches all primary actions in auth + theory flows.
- [x] Focus states are visible and logical.
- [x] Reading UI remains usable at narrow viewport and zoomed text.

Acceptance criteria:
- Core journey (login -> start chapter -> next lesson -> return later) is usable on mobile viewport.
- Contrast and focus visibility meet baseline accessibility expectations.

Evidence:
- Mobile viewport screenshots/video.
- Accessibility quick-pass notes with defects listed.

### QA-P1-002 Performance budget compliance
- [x] Budget checks run against production build.

Acceptance criteria:
- Meets budgets in `docs/performance-budget.md`.
- No severe regression vs previous baseline in theory route transitions.

Evidence:
- `npm run perf:lighthouse` output.
- `npm run test:perf:e2e` output.

### QA-P1-003 Legal and trust basics
- [x] Privacy and Terms are reachable from public/auth surfaces.
- [x] Support/contact path exists for beta users.

Acceptance criteria:
- User can find legal and support pages in <=2 clicks from landing and from authenticated app shell.
- Data deletion/export endpoints are not publicly exposed without auth.

Evidence:
- Route screenshots and endpoint behavior notes.

### QA-P1-004 Operational readiness
- [x] Launch owner, on-call contact, and rollback steps are documented.
- [x] Incident log path exists (where errors/issues are triaged).

Acceptance criteria:
- Team can disable unstable features quickly without full rollback.
- Team can identify affected users/sessions from logs/analytics.

Evidence:
- Ops notes + env toggle verification.
- If `/energy` is in scope, verify `docs/grid-ops-scene-runbook.md`.

## Suggested execution order

1. Freeze scope and copy (`QA-P0-001`, `QA-P0-002`).
2. Run auth + progress correctness checks (`QA-P0-003`, `QA-P0-004`).
3. Run automated gates (`QA-P0-005`).
4. Verify analytics and funnel visibility (`QA-P0-006`).
5. Run failure-state checks and capture evidence (`QA-P0-007`).
6. Close P1 basics and assign owners/dates for any deferred items.

## Launch decision template

Use this block at release time:

```text
Launch decision: GO / NO-GO
Date:
Commit SHA:
P0 status: x/y complete
Open P0 items:
Open P1 items with owner/date:
Rollback owner:
```
