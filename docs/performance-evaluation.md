# stableGrid.io — Performance Evaluation

**Date:** 2026-03-28
**Framework:** Next.js 14.2.3 (App Router)
**Hosting:** Vercel (assumed)

---

## Executive Summary

| Metric | Score | Status |
|--------|-------|--------|
| Shared JS (all pages) | 87.5 KB | Good |
| Largest page bundle | 734 KB (`/learn/[topic]/theory/[category]`) | Needs attention |
| Static pages | 14 | Good |
| SSG pages | 4 | Good |
| Dynamic (server-rendered) pages | 22 | Acceptable |
| API routes | 36 | Fine |
| Middleware | 75.6 KB | Acceptable |
| Public assets | 28 MB (26 MB transmission line) | Heavy |
| Theory JSON data | 6.2 MB total | Heavy |
| Build output | 573 MB | Normal for Next.js |

**Overall: B+** — Good foundation with specific areas that need optimization.

---

## Bundle Analysis

### Shared JS (loaded on every page)
```
87.5 KB total
  ├ chunks/7023 (framework)     31.6 KB
  ├ chunks/fd9d1056 (runtime)   53.7 KB
  └ other shared chunks          2.19 KB
```
**Verdict:** Good. Under 90 KB shared baseline is solid for a React/Next.js app.

### Largest JS Chunks
| Chunk | Size | Contents |
|-------|------|----------|
| `5250-*.js` | 1,752 KB | Theory reader (largest — contains full reading experience) |
| `vendor-viz` | 328 KB | Recharts + D3 (lazy-loaded on admin pages) |
| `vendor-supabase` | 172 KB | Supabase client SDK |
| `vendor-react` | 140 KB | React + ReactDOM |
| `5274-*.js` | 128 KB | Unknown app chunk |

### Per-Page First Load JS (critical pages)

| Page | First Load JS | Verdict |
|------|--------------|---------|
| `/` (landing) | ~87.5 KB (shared only) | Excellent |
| `/home` (dashboard) | 106 KB | Good |
| `/learn/theory` (hub) | 598 KB | Needs attention |
| `/learn/[topic]/theory` | 116 KB | Good |
| `/learn/[topic]/theory/[category]` | **734 KB** | Critical — too heavy |
| `/login` | 160 KB | Acceptable |
| `/signup` | 165 KB | Acceptable |
| `/admin/spending` | **224 KB** | Heavy (recharts inline) |
| `/admin/feedback` | 107 KB | Good |
| `/profile` | 175 KB | Acceptable |

---

## Rendering Strategy

| Strategy | Count | Pages |
|----------|-------|-------|
| Static (○) | 14 | login, signup, privacy, terms, hub, support, etc. |
| SSG (●) | 4 | `/learn/[topic]`, `/learn/[topic]/theory`, `/learn/[topic]/theory/[category]` |
| Dynamic (ƒ) | 22 | home, admin/*, profile, settings, onboarding, etc. |

**Verdict:** Good split. Marketing/legal pages are static. User-specific pages are dynamic. Theory content is SSG with params.

---

## Assets

### Transmission Line Sequence (Landing Page)
- **80 JPG frames** at 26 MB total (~325 KB per frame)
- Used for scroll-driven hero animation
- Loaded progressively via `requestIdleCallback`
- Static `<img>` fallback for first frame (LCP optimization)
- **Not WebP** — converting would save ~40-60% (~10-15 MB)

### Theory JSON Content
| File | Size |
|------|------|
| airflow-mid.json | 1,088 KB |
| airflow-senior.json | 856 KB |
| pyspark-senior.json | 668 KB |
| fabric.json | 644 KB |
| pyspark.json | 628 KB |
| fabric-senior.json | 608 KB |
| pyspark-mid.json | 604 KB |
| airflow.json | 748 KB |
| sql.json | 80 KB |
| All others | 4 KB each (placeholder) |
| **Total** | **~6.2 MB** |

**Verdict:** Server-side `theoryTrackMeta.ts` prevents this from hitting the client bundle. Content is read server-side only. Good.

### Fonts
- 3 Google Fonts via `next/font` (self-hosted, no external requests)
- All use `display: 'swap'` (prevents FOIT)
- Space Grotesk: 4 weights (400, 500, 600, 700)
- JetBrains Mono: 3 weights (400, 500, 700)
- Inter: default weights

**Verdict:** Good. Consider reducing to 2-3 weights per font to shave ~20-40 KB.

---

## Optimizations In Place

### Already Implemented
| Optimization | Status | Impact |
|-------------|--------|--------|
| `next/font` self-hosted fonts | Done | Eliminates Google Fonts network requests |
| `display: 'swap'` on all fonts | Done | Prevents Flash of Invisible Text |
| `optimizePackageImports` | Done | Tree-shakes lucide-react, recharts, framer-motion, date-fns |
| Vendor chunk splitting | Done | react, supabase, viz, editor in separate chunks |
| Dynamic imports (`next/dynamic`) | Done | HomeDashboard, CodeEditor, GridFlowSection, admin charts |
| Viewport-triggered lazy load | Done | GridFlowSection loads on scroll via IntersectionObserver |
| Suspense streaming | Done | Home page + Theory Hub with skeleton fallbacks |
| Server-side theory metadata | Done | ~1 KB instead of 6.2 MB in client bundle |
| Static `<img>` fallback for hero | Done | LCP improvement for canvas-based sequence |
| Security headers (CSP, HSTS, etc.) | Done | 6 security headers configured |
| Direct import for LandingPage | Done | Removed `dynamic()` from LCP-critical path |
| Lazy-loaded recharts (admin) | Done | Charts load via `dynamic()` with SSR disabled |

### Missing / Recommended
| Optimization | Priority | Est. Impact | Effort |
|-------------|----------|-------------|--------|
| Convert transmission frames to WebP | High | -10-15 MB assets, faster load | Low |
| Split 734 KB theory reader page | High | -300-400 KB First Load JS | Medium |
| Add `loading` prop to dynamic imports | Medium | Better perceived performance | Low |
| Memoize animated components in HomeDashboard | Medium | Fewer re-renders, better INP | Low |
| Font weight reduction (fewer weights) | Low | -20-40 KB | Low |
| CSS custom property cleanup (globals.css has 484 lines) | Low | Marginal | Low |
| Image optimization with `next/image` where possible | Low | Automatic WebP/AVIF, responsive | Low |
| ISR for `/learn/theory` (currently ƒ dynamic) | Medium | Could be static with revalidate | Medium |

---

## Dependency Weight

| Package | node_modules size | In client bundle? | Notes |
|---------|-------------------|-------------------|-------|
| monaco-editor | 73 MB | Lazy-loaded via `dynamic()` | Only on workspace/editor pages |
| lucide-react | 30 MB | Tree-shaken | `optimizePackageImports` active |
| recharts | 8.1 MB | Lazy-loaded | 328 KB vendor-viz chunk, admin only |
| @supabase | 6.0 MB | 172 KB chunk | Always loaded (auth required) |
| framer-motion | 3.0 MB | Tree-shaken | `optimizePackageImports` active |
| zustand | 43 KB | Minimal | Lightweight state management |

**Verdict:** Heavy packages are properly isolated. Monaco (73 MB installed) only ships to editor pages. Recharts is lazy-loaded. Good dependency hygiene.

---

## Critical Issues (Top 3)

### 1. `/learn/[topic]/theory/[category]` — 734 KB First Load
The theory reader page ships 734 KB of JS on first load. This is the heaviest user-facing page and the core product experience. Likely includes the full reading layout, progress tracking, reading mode styles, and navigation.

**Fix:** Code-split the reading mode controls, progress sync, and navigation into lazy-loaded chunks. The initial load should only include the content renderer.

### 2. Transmission Line Assets — 26 MB of JPGs
80 unoptimized JPG frames. WebP conversion would cut this by 40-60%.

**Fix:** `cwebp -q 80 *.jpg` or a build script. Consider reducing to 40 frames for mobile.

### 3. `/learn/theory` and `/theory` — 598 KB First Load
The Theory Hub pages are 598 KB. They're dynamic (`ƒ`) but could potentially be ISR with periodic revalidation since theory content doesn't change frequently.

**Fix:** Consider `export const revalidate = 3600` for hourly ISR, or investigate what's driving the 598 KB bundle.

---

## Performance Score Estimate

| Core Web Vital | Estimated | Target | Status |
|----------------|-----------|--------|--------|
| LCP (Largest Contentful Paint) | ~2.0-2.8s | < 2.5s | Borderline |
| FID/INP (Interaction to Next Paint) | ~100-180ms | < 200ms | Good |
| CLS (Cumulative Layout Shift) | ~0.02-0.05 | < 0.1 | Good |
| FCP (First Contentful Paint) | ~1.0-1.5s | < 1.8s | Good |
| TTFB (Time to First Byte) | ~200-400ms | < 800ms | Good |

**Note:** These are estimates based on bundle analysis, not real Lighthouse data. Run `npx lighthouse http://localhost:3000 --view` for actual measurements.

---

## Recommendations Priority Matrix

```
                    HIGH IMPACT
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    │  WebP conversion  │  Split theory     │
    │  (26MB → ~12MB)   │  reader bundle    │
    │                   │  (734KB → ~350KB) │
    │                   │                   │
LOW ├───────────────────┼───────────────────┤ HIGH
EFFORT                  │                   EFFORT
    │                   │                   │
    │  Font weight      │  ISR for theory   │
    │  reduction        │  hub pages        │
    │                   │                   │
    └───────────────────┼───────────────────┘
                        │
                    LOW IMPACT
```
