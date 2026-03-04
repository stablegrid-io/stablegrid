# Theory Beta P1 Closeout - 2026-03-04

Checklist reference: `docs/theory-beta-prelaunch-checklist.md`

## Summary

- `P1 complete`: 4/4
- `Open P1 items`: none

## QA-P1-001 Mobile and accessibility baseline

Status: `Complete`

Evidence:
- `tests/e2e/theory-mobile-accessibility.spec.ts` (keyboard login + mobile theory navigation + focus visibility)
- `STABLEGRID_E2E_EMAIL=... STABLEGRID_E2E_PASSWORD=... npx playwright test tests/e2e/theory-mobile-accessibility.spec.ts` (executed with existing `codex-home-*` account credentials; no account creation)

## QA-P1-002 Performance budget compliance

Status: `Complete`

Evidence:
- `npm run test:perf:e2e` -> passed
- `npm run perf:lighthouse` -> passed
- Lighthouse reports:
  - `https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1772658756501-78808.report.html`
  - `https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1772658757445-15831.report.html`
  - `https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1772658758502-27158.report.html`
  - `https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1772658759767-42270.report.html`

## QA-P1-003 Legal and trust basics

Status: `Complete`

Evidence:
- Public legal/support pages:
  - `app/privacy/page.tsx`
  - `app/terms/page.tsx`
  - `app/support/page.tsx`
- Reachability from public/auth/app-shell surfaces:
  - `components/home/landing/LandingFooter.tsx`
  - `components/auth/LoginForm.tsx`
  - `components/auth/SignupForm.tsx`
  - `components/layout/UserMenu.tsx`
- Automated checks:
  - `tests/e2e/legal-trust-baseline.spec.ts` -> passed
  - `tests/integration/login-form.test.tsx` -> passed
  - `tests/integration/signup-form.test.tsx` -> passed
- Endpoint protection:
  - unauthenticated requests to `/api/gdpr/export`, `/api/gdpr/delete-account`, `/api/gdpr/delete-reason` return `401`

## QA-P1-004 Operational readiness

Status: `Complete`

Evidence:
- `docs/theory-beta-ops-readiness.md` (owner, on-call, rollback, kill switch)
- `docs/theory-beta-incident-log.md` (triage path + baseline entry)

## Command transcript

- `npm run test:run -- tests/integration/login-form.test.tsx tests/integration/signup-form.test.tsx` -> passed (8/8)
- `STABLEGRID_E2E_EMAIL=... STABLEGRID_E2E_PASSWORD=... npx playwright test tests/e2e/legal-trust-baseline.spec.ts tests/e2e/theory-mobile-accessibility.spec.ts` -> passed (4/4)
- `npm run test:perf:e2e` -> passed (1/1)
- `npm run perf:lighthouse` -> passed
