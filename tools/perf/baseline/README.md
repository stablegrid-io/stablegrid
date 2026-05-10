# Perf baseline

Pre-optimization snapshots so future PRs can prove they don't regress
bundle size or cold-load behavior.

## What lives here

- `analyze-client.html` — webpack bundle treemap for the **client** build
  (`@next/bundle-analyzer` output, `client` server)
- `analyze-nodejs.html` — same, for the **server** (Node) build
- `analyze-edge.html` — same, for the **edge** runtime (if any pages opt in)
- `cold-home.har` / `cold-theory.har` / `cold-practice.har` — HAR captures
  of the first paint of `/home`, `/theory`, and a representative practice
  session route on a cold cache. Captured at Slow 4G + 4× CPU throttle.
- `lighthouse-*.json` — Lighthouse JSON reports from `npm run perf:lighthouse`.

These are **frozen** baselines from the start of the perf overhaul. Don't
overwrite them unless you're explicitly establishing a new floor (e.g.
after Phase 4 lands and the new shape is the new baseline).

## Refreshing the bundle reports

```bash
# Stop the dev server first — it competes for .next/ access.
npm run analyze
# Reports land at .next/analyze/{client,nodejs,edge}.html
cp .next/analyze/client.html tools/perf/baseline/analyze-client.html
cp .next/analyze/nodejs.html tools/perf/baseline/analyze-nodejs.html
# edge.html is only emitted if at least one route opts into the edge runtime
[ -f .next/analyze/edge.html ] && cp .next/analyze/edge.html tools/perf/baseline/analyze-edge.html
```

## Capturing a HAR

1. Open Chrome / Edge in an **incognito** window so cookies don't warm caches.
2. DevTools → Network → enable "Preserve log" + "Disable cache".
3. Throttling → "Slow 4G" + CPU 4× slowdown (Performance tab).
4. Hard reload the route (`Cmd+Shift+R`).
5. Right-click any row → "Save all as HAR with content" → save here.

## Refreshing Lighthouse JSON

```bash
npm run perf:lighthouse
# JSON reports land at .lighthouseci/ — copy the relevant ones here.
```

## Why these matter

The Lighthouse CI in [`.lighthouserc.json`](../../../.lighthouserc.json)
already enforces budgets (LCP < 1.2s, TBT < 50ms, etc.) and Playwright
perf assertions in [`playwright.perf.config.ts`](../../../playwright.perf.config.ts)
gate PRs. These baseline files serve a different purpose: **proving the
direction is right** when individual phase PRs land. Compare the new
analyze output to the baseline; if a chunk grew unexpectedly, that's
the smoking gun.
