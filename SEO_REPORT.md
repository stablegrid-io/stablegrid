# SEO Implementation Report

Implementation of `SEO_PLAN.md`. Build passes, prod server smoke-tested, output verified.

---

## ⚠️ Critical finding — surface this first

**The middleware blocks Googlebot from `/theory` and every `/learn/*` route.**

`middleware.ts:10` lists `/theory` and `/learn` in `PROTECTED_ROUTES`. Unauthenticated requests (which is what Googlebot is) get a 307 redirect to `/login`. Verified live:

```
$ curl -sI http://localhost:3000/learn/pyspark/theory
HTTP/1.1 307 Temporary Redirect
location: /login
```

This means:
- The 34 `/learn/.../theory[/...]` URLs in `sitemap.xml` will 307 → `/login` for crawlers and never get indexed.
- The Course + Breadcrumb JSON-LD I added to those pages is invisible to Google.
- The `Theory Hub` (`/theory`) is also gated.

Only **public** indexable surface today: `/`, `/topics`, `/cheat-sheets`, `/privacy`, `/terms`, `/support`, `/not-sure-yet`. That's 7 pages — not the ~40 the sitemap claims.

**This is a product decision, not a bug.** Three options for the human:

1. **Make `/theory` and `/learn/[topic]/theory[/level]` public** — remove from `PROTECTED_ROUTES`. Keep the deep query-param session pages (`?chapter=`, `?practice=`, `?capstone=`) gated by checking auth in those handlers if needed. Recommended for SEO.
2. **Allow Googlebot/Bingbot through middleware** by user-agent — legitimate cloaking when content matches what auth users see. Still no help for human visitors clicking from a SERP.
3. **Accept Learn isn't in Google.** Drop those URLs from the sitemap, lean on `/topics` as the only deep-content entry point.

I did **not** modify the middleware — that's outside SEO scope and explicitly out-of-bounds per `SEO_PLAN.md` ("Don't modify pricing, copy claims, or product features for SEO reasons").

---

## What changed

### New files

| File | Purpose |
|---|---|
| [app/robots.ts](app/robots.ts) | Allow `/`, disallow `/api/`, `/admin/`, auth pages, all auth-gated routes; point to sitemap. |
| [app/sitemap.ts](app/sitemap.ts) | Generates 41 URLs from `learnTopics` + `TOPIC_TRACK_CONFIGS` — no hardcoded slugs. |
| [app/not-found.tsx](app/not-found.tsx) | Server-rendered 404 with `noindex`, links back to `/` and `/topics`. Returns HTTP 404 (verified). |
| [lib/seo/jsonLd.tsx](lib/seo/jsonLd.tsx) | `OrganizationJsonLd`, `CourseJsonLd`, `BreadcrumbJsonLd` helpers. ISO 8601 duration converter for `courseWorkload`. |

### Modified

| File | Change |
|---|---|
| [app/layout.tsx](app/layout.tsx) | Title default + template, stronger description, `keywords`, `alternates.canonical`, full `robots`/`googleBot` directives. Mounted `<OrganizationJsonLd />` in body. |
| [app/page.tsx](app/page.tsx) | Added `metadata` with `alternates.canonical: '/'` (uses root default title). |
| [app/topics/page.tsx](app/topics/page.tsx) | New title without trailing `stablegrid` (template adds it), canonical, OG override. |
| [app/cheat-sheets/page.tsx](app/cheat-sheets/page.tsx) | New file — server wrapper with metadata. Old `'use client'` content moved to `CheatSheetsClient.tsx`. |
| [app/cheat-sheets/CheatSheetsClient.tsx](app/cheat-sheets/CheatSheetsClient.tsx) | Renamed from old `page.tsx`; default export renamed `CheatSheetsClient`. |
| [app/privacy/page.tsx](app/privacy/page.tsx) | Title `Privacy Policy`, canonical. |
| [app/terms/page.tsx](app/terms/page.tsx) | Title `Terms of Service`, canonical. |
| [app/support/page.tsx](app/support/page.tsx) | Title `Support`, canonical. |
| [app/theory/page.tsx](app/theory/page.tsx) | Cleaned title, stronger description, canonical. *(Currently auth-gated — see critical finding.)* |
| [app/learn/[topic]/theory/page.tsx](app/learn/[topic]/theory/page.tsx) | `generateMetadata` now uses real topic data (`getLearnTopicMeta`), proper title `${topic} — Junior to Senior`, canonical. Renders `<CourseJsonLd>` + `<BreadcrumbJsonLd>` server-side. |
| [app/learn/[topic]/theory/[category]/page.tsx](app/learn/[topic]/theory/[category]/page.tsx) | `generateMetadata` reads `searchParams` and emits `noindex` when `?chapter`, `?lesson`, `?practice`, `?capstone` is present (so reading sessions don't dilute the index). Track view emits Breadcrumb JSON-LD. |
| [app/home/page.tsx](app/home/page.tsx) | `robots: { index: false, follow: false }`, cleaner title. |
| [app/settings/page.tsx](app/settings/page.tsx) | `robots: noindex/nofollow`. |
| [app/grid/page.tsx](app/grid/page.tsx) | `robots: noindex/nofollow`. |
| [app/stats/page.tsx](app/stats/page.tsx) | `robots: noindex/nofollow`. |
| [app/onboarding/page.tsx](app/onboarding/page.tsx) | `robots: noindex/nofollow`. |
| [app/profile/page.tsx](app/profile/page.tsx) | `robots: noindex/nofollow` (page is just a redirect). |
| [app/workspace/[taskId]/page.tsx](app/workspace/[taskId]/page.tsx) | Added metadata with `robots: noindex/nofollow`. |
| [app/operations/page.tsx](app/operations/page.tsx) | `robots: noindex/nofollow`. |
| [app/practice/page.tsx](app/practice/page.tsx) | `robots: noindex/nofollow`. |
| [app/(auth)/login/page.tsx](<app/(auth)/login/page.tsx>) | `robots: noindex/nofollow`. |
| [app/(auth)/signup/page.tsx](<app/(auth)/signup/page.tsx>) | `robots: noindex/nofollow`. |
| [data/learn/theory/tracks.ts](data/learn/theory/tracks.ts) | `TOPIC_TRACK_CONFIGS` is now `export`ed (was internal). One word change; needed by sitemap. |

---

## What was already correct (not touched)

- `metadataBase: new URL('https://stablegrid.io')` — already in root layout.
- OG image `public/og-image.png` (1200×630, 297 KB) — already present and referenced.
- Full favicon suite (svg, 32, 180, 512, apple-touch-icon, dark variants).
- `next/font/google` for JetBrains Mono + Inter with `display: swap`.
- Heading hierarchy on the landing page — one H1 (`Understanding data is your edge.`), four well-formed H2s.
- Decorative hero images already use `alt=""` correctly.
- Existing per-page metadata on `/privacy`, `/terms`, `/support`.
- Admin pages already had `noindex` set (kept untouched).
- Build pipeline (`npm run build` runs content validation + Next build).

---

## Verification (results)

Run from `npm start` against the production build:

| Check | Result |
|---|---|
| `npm run build` | ✅ Passes. 41 URLs in sitemap output. All 5 tracked topics generated junior/mid/senior pages SSG. |
| `curl /robots.txt` | ✅ Returns rules + sitemap line. |
| `curl /sitemap.xml` | ✅ 41 URLs, all `https://stablegrid.io`-prefixed, no broken entries. |
| Per-page titles unique on `/`, `/topics`, `/cheat-sheets`, `/privacy`, `/terms`, `/support` | ✅ Confirmed via `curl … \| grep '<title>'` |
| Per-page canonicals match URL | ✅ All public pages emit `<link rel="canonical" href="https://stablegrid.io{path}"/>` |
| Per-page descriptions unique | ✅ |
| Organization JSON-LD on `/` | ✅ `"@type":"Organization"` present in body. |
| 404 page returns HTTP 404 | ✅ |
| 404 page has `noindex` | ✅ |
| `/home` 307 → `/login` (anonymous) | ✅ Middleware-redirect, but page metadata also emits noindex if reached. |
| **Learn pages reachable to crawlers** | ❌ Middleware redirects to `/login`. **See critical finding above.** |

I did **not** run Lighthouse — that needs a real browser, not curl. The structural pieces (single H1, valid HTML, server-rendered titles, sitemap) all set up Lighthouse to score 100, but the human should run it as the final gate.

I did **not** validate the JSON-LD via [validator.schema.org](https://validator.schema.org/) — that's a manual paste step. The schemas only emit fields backed by real data (no fake ratings, no invented instructors), so I expect zero errors. The Course schema includes `courseWorkload` as ISO 8601 duration when total minutes is known.

**Minor cosmetic issue:** the 404 page renders two `<meta name="robots">` tags (one inherited from root layout, one from page metadata). Both say `noindex` — no SEO impact — but it's slightly redundant. Likely a Next.js metadata-merge quirk, not worth chasing.

---

## What couldn't be done from code (human follow-ups)

1. **Resolve the middleware/Learn-indexability decision** (see critical finding). Until this is decided, only 7 pages are actually crawlable.
2. **Google Search Console** — domain verification (DNS or HTML file) and sitemap submission.
3. **Bing Webmaster Tools** — same.
4. **Schema.org validator pass** — paste rendered HTML from `/`, `/learn/pyspark/theory`, `/learn/pyspark/theory/junior` into <https://validator.schema.org/> once the middleware decision is made.
5. **Lighthouse SEO + Performance audit** — run from Chrome DevTools, target SEO=100, Performance ≥90 desktop / ≥75 mobile.
6. **OG card preview** — drop `/`, `/topics`, `/cheat-sheets` into <https://www.opengraph.xyz/>; the existing `og-image.png` may want a refresh once branding stabilises.
7. **Backlinks** — Hacker News, Product Hunt, Reddit (r/dataengineering, r/MicrosoftFabric), LinkedIn announcements.
8. **Blog scaffold** — deferred. The plan included an MDX `/blog` route; you opted out. Pick this back up when there's actual content to publish.
9. **Social profiles in Organization schema** — `lib/seo/jsonLd.tsx:24` has an empty `sameAs` placeholder. Add LinkedIn / Twitter / GitHub URLs when those exist.

---

## Recommended next 7 days for the human

In order:

1. **Decide the middleware question** (option 1, 2, or 3 above). Without this, ~85% of the SEO work I did is dormant.
2. **Verify the domain in Google Search Console** and submit `https://stablegrid.io/sitemap.xml`. Repeat for Bing Webmaster Tools.
3. **Run Lighthouse on `/`, `/topics`, `/cheat-sheets`** in Chrome DevTools. SEO score should be 100; if not, the report will say exactly what's missing.
4. **Validate JSON-LD on each schema-emitting page** via <https://validator.schema.org/>. Fix any warnings (none expected).
5. **First backlink push**: 1 LinkedIn post + 1 well-written HN "Show HN" or r/dataengineering post linking to `/topics`. One real backlink from each is worth more than a hundred submitted-to-directory links.
