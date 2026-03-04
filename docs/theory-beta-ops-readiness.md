# Theory Beta Operational Readiness

Last updated: 2026-03-04

## Ownership

- Launch owner: `@sadenis23`
- Primary on-call: `support@stablegrid.io`
- Escalation path: open GitHub issue with label `incident` in `sadenis23/stablegrid`

## Rollback and kill-switch playbook

### 1) Route-level rollback (fast)

- Revert deployment to previous stable commit in hosting platform.
- Validate these routes first: `/`, `/learn/theory`, `/learn/pyspark/theory`, `/login`.

### 2) Grid scene kill switch (targeted)

- Set `NEXT_PUBLIC_GRID_SCENE_DISABLE=true`.
- Redeploy.
- Validate `/energy` renders fallback mode and app shell remains usable.
- Reference: `docs/grid-ops-scene-runbook.md`.

### 3) Auth/session incident rollback

- Confirm Supabase auth status and callback health (`/auth/callback`).
- If callback regression persists, temporarily direct users to `/login` and freeze new release rollout while retaining previous stable deployment.

## Monitoring and triage inputs

- Product funnel health: `npm run report:funnel`
- Application quality gates:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test:run`
  - `npm run test:e2e:key`
  - `npm run test:e2e:theory`
- E2E account policy:
  - Use `STABLEGRID_E2E_EMAIL` + `STABLEGRID_E2E_PASSWORD` for existing accounts.
  - Keep `ALLOW_E2E_USER_CREATION=false` unless a temporary QA exception is approved.

## Incident log path

- Active incident log: `docs/theory-beta-incident-log.md`
- Every incident entry must include:
  - Timestamp (UTC)
  - Detection source
  - User impact
  - Mitigation
  - Follow-up owner
