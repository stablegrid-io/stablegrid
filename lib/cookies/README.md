# Cookie consent registry guide

Use `cookie-config.ts` as the single audit list for all cookie/storage-backed services.
Authenticated users also sync consent records through `/api/cookies/consent` into
`public.cookie_consents` (Supabase), while local cookie/localStorage remains the
first-party runtime source.

## Add a new service safely

1. Add one entry to `COOKIE_SERVICE_REGISTRY`.
2. Pick exactly one category: `necessary`, `analytics`, `marketing`, or `preferences`.
3. Set `requiresConsent` to `false` only for technically necessary services and to
   `true` for every optional category.
4. Implement `loader()` so optional scripts run only after consent.
5. Implement `cleanup()` for optional first-party identifiers where possible.
6. Add plain-English purpose text and expiry details.
7. Update `app/privacy/page.tsx` only if the public disclosure needs additional wording.

## Required fields per service

- `name`
- `provider`
- `category`
- `purpose`
- `expiry`
- `type`
- `legalBasis`
- `requiresConsent`
- `loader`
- `cleanup` (recommended for optional first-party storage)

Never inject optional trackers directly in page HTML or layout files. Route all optional
script loading through the consent gate in `consent-gate.ts`.
