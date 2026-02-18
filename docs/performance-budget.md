# stablegrid.io Performance Budget

## Core budgets
- LCP: `< 1.2s`
- TTI: `< 2.0s`
- TBT: `< 50ms`
- Initial script budget: `< 200KB` (Lighthouse budget, route entry)
- Route transition target: `< 500ms` (Playwright smoke gate)

## Run locally
1. Build and start production:
   - `npm run build`
   - `npm run start`
2. Run Lighthouse assertions:
   - `npm run perf:lighthouse`
3. Run route performance smoke:
   - `npm run test:perf:e2e`

## CI gates
- `npm run lint`
- `npm run test:run`
- `npm run test:e2e`
- `npm run test:perf:e2e`
- `npm run perf:lighthouse`
