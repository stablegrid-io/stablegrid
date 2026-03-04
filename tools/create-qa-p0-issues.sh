#!/usr/bin/env bash

set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI is not installed."
  exit 1
fi

if ! gh auth status -h github.com >/dev/null 2>&1; then
  echo "Error: gh is not authenticated. Run: gh auth login"
  exit 1
fi

create_issue() {
  local title="$1"
  local body="$2"
  gh issue create --title "$title" --body "$body"
}

create_issue "[QA-P0-001] Align launch messaging to Theory Beta scope" "$(cat <<'EOF'
## Owner
- Owner: @TBD
- Target Date: YYYY-MM-DD

## Scope
Launch copy must clearly position the current release as **Theory Beta** and avoid implying full Missions/Flashcards/Tasks availability.

## Acceptance Criteria
- Landing and app entry copy explicitly communicate Theory Beta scope.
- Auth and onboarding surfaces do not market unavailable learning modes.
- No CTA points users to unfinished mode experiences.
- QA screenshot evidence is attached for landing + auth + learn entry.

## Notes
Related checklist item: QA-P0-001 (`docs/theory-beta-prelaunch-checklist.md`)
EOF
)"

create_issue "[QA-P0-002] Enforce theory-only navigation for beta launch" "$(cat <<'EOF'
## Owner
- Owner: @TBD
- Target Date: YYYY-MM-DD

## Scope
Primary navigation must reflect launch scope and avoid exposing unfinished mode pathways.

## Acceptance Criteria
- Top and bottom nav expose only launch-approved surfaces.
- `/learn` route resolves into Theory-first path without ambiguous options.
- No dead-end links exist in primary nav.
- Route smoke evidence attached for all primary nav targets.

## Notes
Related checklist item: QA-P0-002 (`docs/theory-beta-prelaunch-checklist.md`)
EOF
)"

create_issue "[QA-P0-003] Define and enforce auth policy for Theory and app routes" "$(cat <<'EOF'
## Owner
- Owner: @TBD
- Target Date: YYYY-MM-DD

## Scope
Document and implement the intended auth policy for Theory and adjacent surfaces, then verify route gating consistency.

## Acceptance Criteria
- Single source of truth documents access policy (public vs auth-required) by route family.
- Middleware and server-side route behavior match the policy.
- Anonymous users cannot access protected user-scoped data.
- Redirect behavior is deterministic across direct URL, refresh, and back navigation.

## Notes
Related checklist item: QA-P0-003 (`docs/theory-beta-prelaunch-checklist.md`)
EOF
)"

create_issue "[QA-P0-004] Verify Theory progress durability end-to-end" "$(cat <<'EOF'
## Owner
- Owner: @TBD
- Target Date: YYYY-MM-DD

## Scope
Validate module/lesson progress correctness and persistence across refresh and relogin for Theory.

## Acceptance Criteria
- Module completion unlocks next module according to rules.
- Progress persists after refresh and re-authentication.
- Resume state restores current lesson/last route accurately.
- E2E theory suite runs in CI with credentials/seeding strategy (no manual-only gap).

## Notes
Related checklist item: QA-P0-004 (`docs/theory-beta-prelaunch-checklist.md`)
EOF
)"

create_issue "[QA-P0-005] Restore green release gates (lint + test + e2e key/theory)" "$(cat <<'EOF'
## Owner
- Owner: @TBD
- Target Date: YYYY-MM-DD

## Scope
Bring required prelaunch quality gates back to green.

## Acceptance Criteria
- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run test:run` passes.
- `npm run test:e2e:key` passes.
- `npm run test:e2e:theory` passes (not skipped).

## Known Failures (current pass)
- Lint: `app/api/test/e2e-seed-module-read/route.ts` line 51.
- Integration tests: stale login/signup redirect expectations.
- E2E key tests: stale login copy assertion + missing function selector expectations.

## Notes
Related checklist item: QA-P0-005 (`docs/theory-beta-prelaunch-checklist.md`)
EOF
)"

create_issue "[QA-P0-006] Lock analytics funnel contract for Theory beta" "$(cat <<'EOF'
## Owner
- Owner: @TBD
- Target Date: YYYY-MM-DD

## Scope
Ensure product event contract remains reliable for launch analytics and reporting.

## Acceptance Criteria
- Unknown event names return HTTP 400 from `/api/analytics/events`.
- Valid core events are accepted and persisted.
- `npm run report:funnel` produces usable step data in target environments.
- Core events present in real beta sessions: `signup_completed`, `chapter_started`, `first_chapter_started`, `chapter_completed`, `first_chapter_completed`.

## Notes
Related checklist item: QA-P0-006 (`docs/theory-beta-prelaunch-checklist.md`)
EOF
)"

create_issue "[QA-P0-007] Validate Theory error-state handling and recovery" "$(cat <<'EOF'
## Owner
- Owner: @TBD
- Target Date: YYYY-MM-DD

## Scope
Run forced-failure checks for theory progress read/write and verify recovery UX.

## Acceptance Criteria
- Theory routes do not blank-screen on progress API/read failures.
- User-facing fallback state is actionable and non-blocking.
- Retry or safe recovery path works after transient error.
- Evidence bundle includes screenshot, console log, and network trace.

## Notes
Related checklist item: QA-P0-007 (`docs/theory-beta-prelaunch-checklist.md`)
EOF
)"

echo "Created 7 QA-P0 issues."
