---
name: codex-cookie-skill
description: Implement, refactor, audit, and simplify website cookie consent flows with category-based consent, equal Accept/Reject controls, consent-gated optional scripts, persistent user choices, and withdrawal handling. Use when Codex needs to add or improve cookie banners and preferences modals, gate analytics/marketing/optional embeds behind consent, create a centralized cookie/service inventory, verify that optional trackers do not load before opt-in, or draft implementation-ready cookie-policy disclosures.
---

# Cookie Consent Implementer

## Overview

Implement minimal, transparent, and maintainable consent experiences.
Default all non-essential categories to denied, expose a first-layer reject path, and load optional services only after explicit user permission.

## Apply These Principles

1. Default all non-essential categories to `false`.
2. Keep strictly necessary cookies enabled and non-toggleable.
3. Make `Accept all` and `Reject all` equally prominent.
4. Provide category-level controls in a second-layer preferences modal.
5. Avoid implied consent patterns (scrolling, inactivity, continued browsing).
6. Use short, plain-language UI copy.
7. Provide a persistent way to reopen consent settings from any page.
8. Keep the implementation small, dependency-light, and easy to audit.

## Deliver This Baseline

Produce these elements in code:
- First-layer consent banner with `Accept all`, `Reject all`, `Manage preferences`.
- Preferences modal with per-category toggles and always-on Necessary row.
- Persistent `Cookie settings` reopen entry (footer or equivalent persistent surface).
- Centralized cookie/service registry.
- Consent-aware optional script loading.
- Consent persistence with timestamp and source.
- Withdrawal/update behavior with best-effort cleanup for known first-party optional cookies.
- Short maintainer notes describing limitations and extension points.

## Use This Consent Taxonomy

Use these categories unless the codebase already has an approved taxonomy:
- `necessary`
- `analytics`
- `preferences`
- `marketing`

Apply these rules:
- Keep `necessary` always enabled and not user-toggleable.
- Default all optional categories to `false`.
- Add new categories only when clearly required by product behavior.

## Implement UX Contract

Banner requirements:
- Show actions: `Accept all`, `Reject all`, `Manage preferences`.
- Keep `Accept all` and `Reject all` visually equivalent.
- Avoid hidden reject paths and deceptive contrast hierarchy.
- Keep first-layer copy concise.

Recommended first-layer copy:
- Title: `Cookies`
- Body: `We use necessary cookies to make this site work. With your permission, we’d also like to use analytics, preferences, and marketing cookies. You can accept, reject, or choose by category.`

Preferences modal requirements:
- Show each optional category with one-sentence explanation.
- Default each optional toggle to off.
- Include an always-on Necessary row.
- Include `Save choices`, `Reject all`, `Accept all` actions.
- Include link to cookie/privacy policy page.

## Implement Technical Structure

Prefer framework-native state and UI if the repository already uses a framework. Otherwise use minimal vanilla JavaScript.

Recommended files:
- `cookie-config.(js|ts)` for cookie/service registry and metadata.
- `cookie-consent.(js|ts|tsx|vue)` for banner, modal, and consent state.
- `consent-gate.(js|ts)` for optional service loading orchestration.
- `cookie-policy.(md|mdx|cms)` for user-facing disclosure text.

## Persist Consent Record

Store a compact first-party consent record, for example:

```json
{
  "version": 1,
  "timestamp": "2026-03-09T12:00:00.000Z",
  "source": "banner|preferences",
  "consent": {
    "necessary": true,
    "analytics": false,
    "preferences": false,
    "marketing": false
  }
}
```

Persist only first-party consent state required for behavior and auditing.

## Maintain Central Service Registry

Track each optional service in one inventory with fields such as:
- `id`
- `name`
- `provider`
- `category`
- `purpose`
- `expiry`
- `partyType` (`first-party` or `third-party`)
- `requiresConsent`
- `loader()`
- `cleanup()` when feasible

Example:

```ts
export const cookieServices = [
  {
    id: "google-analytics",
    name: "Google Analytics",
    provider: "Google",
    category: "analytics",
    purpose: "Measures traffic and site usage.",
    expiry: "varies",
    partyType: "third-party",
    requiresConsent: true,
    loader: () => {
      // Load script only after analytics consent is true.
    },
    cleanup: () => {
      // Perform best-effort cleanup for known first-party cookies.
    }
  }
];
```

## Enforce Script Gating

Apply these rules:
- Do not place optional trackers in base HTML if they execute before consent.
- Register optional services in the central registry.
- Load optional services only after matching consent exists.
- Support late loading after mid-session preference updates.

## Handle Consent Lifecycle

First visit:
- Load only necessary functionality.
- Show consent banner.

`Accept all`:
- Enable all optional categories.
- Persist decision with timestamp/source.
- Load matching optional services.

`Reject all`:
- Persist all optional categories as denied.
- Avoid loading optional services.

`Save choices`:
- Persist chosen categories.
- Load newly allowed categories only.

Later visits:
- Apply persisted choices immediately.
- Avoid re-showing banner unless consent version/policy changes.

Withdrawal:
- Prevent future optional loading.
- Attempt cleanup of known optional first-party cookies where feasible.
- Keep reopen path visible for re-consent.

Emit consent change event:
- Dispatch custom event `consent:updated`.
- Include current consent payload in event detail.

## Meet Accessibility Baseline

Require:
- Full keyboard operation.
- Visible focus states.
- Semantic buttons, dialog markup, and labels.
- ESC close behavior for modal where appropriate.
- Appropriate ARIA attributes for dialog and toggles.
- No motion-dependent interaction.

## Avoid These Patterns

Never ship:
- Single `OK` button banners.
- Hidden or second-class reject flow.
- Pre-enabled optional toggles.
- Vague, bundled purpose text.
- Optional tracking before consent.
- Consent by scrolling/continued browsing.
- Manipulative button hierarchy.
- Forced acceptance for general site access.

## Execute In Existing Codebases

1. Inspect current analytics/tag-manager/embed loading paths.
2. Classify services into strictly necessary vs optional categories.
3. Replace unconditional optional loading with consent-gated loaders.
4. Add banner, modal, and persistent settings reopen entry.
5. Add or update cookie policy and service inventory text.
6. Verify first visit, accept all, reject all, selective opt-in, revisit, and withdrawal.
7. Confirm no optional pre-consent requests or cookies.

## Run This Checklist Before Finishing

- [ ] Prevent optional scripts from running before consent.
- [ ] Expose `Reject all` on first layer.
- [ ] Keep `Accept all` and `Reject all` equally prominent.
- [ ] Default optional categories to off.
- [ ] Keep `necessary` clearly always on.
- [ ] Provide persistent reopen entry.
- [ ] Persist consent choice with timestamp/source.
- [ ] Maintain central cookie/service inventory.
- [ ] Use plain, specific copy.
- [ ] Keep site functional with necessary-only mode.

## Output Requirements

When applying this skill:
- Modify actual code instead of describing hypothetical implementation.
- Keep implementation minimal and maintainable.
- Add comments only where they prevent future mistakes.
- Document unavoidable limitations briefly and directly.

## Boundaries

Provide implementation guidance, not jurisdiction-specific legal advice.
