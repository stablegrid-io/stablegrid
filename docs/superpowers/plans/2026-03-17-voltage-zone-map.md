# Voltage Zone Map Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat grid map with 5 horizontal voltage-zone bands (330kV / 110kV / 35kV / 10kV / 0.4kV), decorative fixed substations between zones, and cascade-fault logic that darkens zone bands when both adjacent zones drop below 35% health.

**Architecture:** Add a `voltageZone` field to each asset definition; extend `GridOpsComputedState.map` with a `voltage_zones` array computed in the engine; redesign `GridMapCanvas.tsx` to render zone bands, bus bars, step-down substation boxes, switching points, and cross-zone asset edges. No existing game mechanics change — only the map visualization and the zone-health/cascade data added to computed state.

**Tech Stack:** TypeScript, React, SVG (inline), framer-motion, Tailwind CSS, Next.js App Router.

---

## File Map

| File | Change |
|------|--------|
| `lib/energy.ts` | Add `voltageZone: VoltageZone` to `InfrastructureNode` + assign per asset |
| `lib/grid-ops/types.ts` | Add `VoltageZone`, `GridOpsVoltageZoneView`, `GridOpsInterZoneLineView`; extend `GridOpsComputedState.map` |
| `lib/grid-ops/config.ts` | Add `VOLTAGE_ZONE_DEFINITIONS` constant |
| `lib/grid-ops/engine.ts` | Add `computeVoltageZones()`, call it in `computeGridOpsState` |
| `components/grid-ops/GridMapCanvas.tsx` | Full visual redesign: zone bands, bus bars, substations, SPs, assets repositioned into zones |

---

## Task 1: Add `voltageZone` to asset definitions

**Files:**
- Modify: `lib/energy.ts`

- [ ] **Step 1.1 — Add `VoltageZone` type and field to `InfrastructureNode`**

Open `lib/energy.ts`. Add the union type and field just above `InfrastructureNode`:

```typescript
export type VoltageZone = '330kv' | '110kv' | '35kv' | '10kv' | '0.4kv';

// Inside InfrastructureNode interface, add:
voltageZone: VoltageZone;
```

- [ ] **Step 1.2 — Assign `voltageZone` to each of the 9 assets**

```typescript
// control-center      → voltageZone: '330kv'
// hvdc-interconnector → voltageZone: '330kv'
// smart-transformer   → voltageZone: '110kv'
// frequency-controller→ voltageZone: '110kv'
// ai-grid-optimizer   → voltageZone: '110kv'
// solar-forecasting-array → voltageZone: '35kv'
// battery-storage     → voltageZone: '35kv'
// grid-flywheel       → voltageZone: '10kv'
// demand-response-system  → voltageZone: '0.4kv'
```

Add `voltageZone` to each object literal in the `INFRASTRUCTURE_NODES` array.

- [ ] **Step 1.3 — Verify TypeScript compiles**

```bash
cd /Users/nedasvaitkus/Desktop/grid
PATH="/Users/nedasvaitkus/.nvm/versions/node/v22.17.1/bin:$PATH" npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to `voltageZone`.

- [ ] **Step 1.4 — Commit**

```bash
git add lib/energy.ts
git commit -m "feat(grid-map): add voltageZone field to infrastructure node definitions"
```

---

## Task 2: Add voltage zone types to `lib/grid-ops/types.ts`

**Files:**
- Modify: `lib/grid-ops/types.ts`

- [ ] **Step 2.1 — Add `GridOpsVoltageZoneView` and `GridOpsInterZoneLineView`**

Append to the end of `lib/grid-ops/types.ts`. Start with the import (the file currently has zero imports):

```typescript
import type { VoltageZone } from '@/lib/energy';
```

Then append the zone types:

```typescript
// ─── Voltage Zone Map ─────────────────────────────────────────────────────────

export type VoltageZoneHealth = 'healthy' | 'stressed' | 'dark';

export interface GridOpsVoltageZoneView {
  id: VoltageZone;        // '330kv' | '110kv' | '35kv' | '10kv' | '0.4kv'
  label: string;          // '330 kV'
  sublabel: string;       // 'TRANSMISSION'
  description: string;    // 'Baltic backbone ring'
  color: string;          // primary accent color for this zone e.g. '#00D084'
  health: VoltageZoneHealth;
  health_pct: number;     // 0-100, avg of deployed assets in zone; 100 if no assets yet
  deployed_asset_ids: string[];
}

export interface GridOpsInterZoneLineView {
  id: string;             // '330kv-110kv'
  from_zone: VoltageZone;
  to_zone: VoltageZone;
  label: string;          // '330/110'
  state: 'active' | 'cascade';
  // cascade = both adjacent zones have health_pct < CASCADE_THRESHOLD
}
```

Also import `VoltageZone` from `lib/energy.ts` at the top of the file (or re-export it inline — keep it in `energy.ts` as the single source of truth and import it here).

- [ ] **Step 2.2 — Extend `GridOpsComputedState.map`**

Find the `map` property in `GridOpsComputedState` and add:

```typescript
map: {
  nodes: GridOpsNodeView[];
  edges: GridOpsEdgeView[];
  regions: GridOpsRegionView[];
  voltage_zones: GridOpsVoltageZoneView[];        // ← add
  inter_zone_lines: GridOpsInterZoneLineView[];   // ← add
};
```

- [ ] **Step 2.3 — Verify TypeScript compiles**

```bash
PATH="/Users/nedasvaitkus/.nvm/versions/node/v22.17.1/bin:$PATH" npx tsc --noEmit 2>&1 | head -30
```

Expected: errors only where `voltage_zones` / `inter_zone_lines` are not yet provided (in engine.ts) — that's expected at this stage.

- [ ] **Step 2.4 — Commit**

```bash
git add lib/grid-ops/types.ts
git commit -m "feat(grid-map): add VoltageZoneView and InterZoneLineView types"
```

---

## Task 3: Add zone definitions to `lib/grid-ops/config.ts`

**Files:**
- Modify: `lib/grid-ops/config.ts`

- [ ] **Step 3.1 — Add `VOLTAGE_ZONE_DEFINITIONS`**

Import `VoltageZone` from `lib/energy.ts` at top. Then add before the export of campaign scenarios:

```typescript
import type { VoltageZone } from '@/lib/energy';
import type { GridOpsVoltageZoneView, GridOpsInterZoneLineView } from '@/lib/grid-ops/types';

export const CASCADE_THRESHOLD = 35; // zone health % below which cascade triggers

export const VOLTAGE_ZONE_DEFINITIONS: Array<{
  id: VoltageZone;
  label: string;
  sublabel: string;
  description: string;
  color: string;
}> = [
  { id: '330kv', label: '330 kV', sublabel: 'TRANSMISSION',     description: 'Baltic backbone ring',           color: '#00D084' },
  { id: '110kv', label: '110 kV', sublabel: 'SUB-TRANSMISSION', description: 'Regional control layer',         color: '#2AA9FF' },
  { id: '35kv',  label: '35 kV',  sublabel: 'DISTRIBUTION',     description: 'Feeder ring, prosumer injections',color: '#F5B942' },
  { id: '10kv',  label: '10 kV',  sublabel: 'SECONDARY DIST.',  description: 'Urban feeders, industrial',      color: '#9C6BFF' },
  { id: '0.4kv', label: '0.4 kV', sublabel: 'LOW VOLTAGE',      description: 'Consumer / EV load',             color: '#FF8080' },
];

// Adjacent zone pairs that can cascade-fault
export const INTER_ZONE_LINE_DEFINITIONS: Array<{
  id: string;
  from_zone: VoltageZone;
  to_zone: VoltageZone;
  label: string;
}> = [
  { id: '330kv-110kv', from_zone: '330kv', to_zone: '110kv', label: '330/110' },
  { id: '110kv-35kv',  from_zone: '110kv', to_zone: '35kv',  label: '110/35'  },
  { id: '35kv-10kv',   from_zone: '35kv',  to_zone: '10kv',  label: '35/10'   },
  { id: '10kv-0.4kv',  from_zone: '10kv',  to_zone: '0.4kv', label: '10/0.4'  },
];
```

- [ ] **Step 3.2 — Verify TypeScript compiles cleanly for this file**

```bash
PATH="/Users/nedasvaitkus/.nvm/versions/node/v22.17.1/bin:$PATH" npx tsc --noEmit 2>&1 | grep "config.ts"
```

Expected: no errors in `config.ts`.

- [ ] **Step 3.3 — Commit**

```bash
git add lib/grid-ops/config.ts
git commit -m "feat(grid-map): add VOLTAGE_ZONE_DEFINITIONS and inter-zone line config"
```

---

## Task 4: Compute zone health and cascade state in the engine

**Files:**
- Modify: `lib/grid-ops/engine.ts`

- [ ] **Step 4.1 — Add `computeVoltageZones()` function**

Find `computeGridOpsState` in `lib/grid-ops/engine.ts`. Add this helper function just before it:

```typescript
import {
  CASCADE_THRESHOLD,
  VOLTAGE_ZONE_DEFINITIONS,
  INTER_ZONE_LINE_DEFINITIONS
} from '@/lib/grid-ops/config';
import type {
  GridOpsVoltageZoneView,
  GridOpsInterZoneLineView,
  VoltageZoneHealth
} from '@/lib/grid-ops/types';
import { INFRASTRUCTURE_BY_ID } from '@/lib/energy';

function computeVoltageZones(
  scenarioAssets: GridOpsAssetDefinition[],
  deployedSet: Set<string>,
  healthMap: Record<string, number>  // plain object, NOT Map — matches engine's getAssetHealthMap()
): {
  voltage_zones: GridOpsVoltageZoneView[];
  inter_zone_lines: GridOpsInterZoneLineView[];
} {
  // Build zone health from deployed assets.
  // Use INFRASTRUCTURE_BY_ID to get voltageZone — scenarioAssets doesn't carry the field.
  const zoneHealthAccumulator = new Map<string, { total: number; count: number }>();

  scenarioAssets.forEach((asset) => {
    if (!deployedSet.has(asset.id)) return;
    const zone = INFRASTRUCTURE_BY_ID[asset.id]?.voltageZone;
    if (!zone) return;

    const health = healthMap[asset.id] ?? 100;
    const existing = zoneHealthAccumulator.get(zone) ?? { total: 0, count: 0 };
    existing.total += health;
    existing.count += 1;
    zoneHealthAccumulator.set(zone, existing);
  });

  // Build deployed asset IDs per zone
  const deployedByZone = new Map<string, string[]>();
  scenarioAssets.forEach((asset) => {
    if (!deployedSet.has(asset.id)) return;
    const zone = INFRASTRUCTURE_BY_ID[asset.id]?.voltageZone;
    if (!zone) return;
    const list = deployedByZone.get(zone) ?? [];
    list.push(asset.id);
    deployedByZone.set(zone, list);
  });

  const zoneHealthPct = (zoneId: string): number => {
    const acc = zoneHealthAccumulator.get(zoneId);
    if (!acc || acc.count === 0) return 100; // no assets = full health (unused zone)
    return Math.round(acc.total / acc.count);
  };

  const zoneHealthLabel = (pct: number): VoltageZoneHealth => {
    if (pct <= CASCADE_THRESHOLD) return 'dark';
    if (pct < 70) return 'stressed';
    return 'healthy';
  };

  const voltage_zones: GridOpsVoltageZoneView[] = VOLTAGE_ZONE_DEFINITIONS.map((def) => {
    const pct = zoneHealthPct(def.id);
    return {
      ...def,
      health: zoneHealthLabel(pct),
      health_pct: pct,
      deployed_asset_ids: deployedByZone.get(def.id) ?? []
    };
  });

  const zoneHealthMap = new Map(voltage_zones.map((z) => [z.id, z.health_pct]));

  const inter_zone_lines: GridOpsInterZoneLineView[] = INTER_ZONE_LINE_DEFINITIONS.map((def) => {
    const fromPct = zoneHealthMap.get(def.from_zone) ?? 100;
    const toPct = zoneHealthMap.get(def.to_zone) ?? 100;
    const isCascade = fromPct <= CASCADE_THRESHOLD && toPct <= CASCADE_THRESHOLD;
    return {
      ...def,
      state: isCascade ? 'cascade' : 'active'
    };
  });

  return { voltage_zones, inter_zone_lines };
}
```

- [ ] **Step 4.2 — Call `computeVoltageZones()` inside `computeGridOpsState` and add to returned map**

Find the section in `computeGridOpsState` that builds the `map` object (look for `nodes`, `edges`, `regions`). Add:

```typescript
const { voltage_zones, inter_zone_lines } = computeVoltageZones(
  scenarioAssets,
  deployedSet,
  healthMap  // Record<string, number> built by getAssetHealthMap(incidents) earlier in the function
);

// In the returned object, extend map:
map: {
  nodes,
  edges,
  regions,
  voltage_zones,
  inter_zone_lines,
},
```

- [ ] **Step 4.3 — Verify TypeScript compiles with zero errors**

```bash
PATH="/Users/nedasvaitkus/.nvm/versions/node/v22.17.1/bin:$PATH" npx tsc --noEmit 2>&1 | head -40
```

Expected: zero errors.

- [ ] **Step 4.4 — Commit**

```bash
git add lib/grid-ops/engine.ts
git commit -m "feat(grid-map): compute voltage zone health and cascade state in engine"
```

---

## Task 5: Redesign `GridMapCanvas.tsx` with voltage zone bands

**Files:**
- Modify: `components/grid-ops/GridMapCanvas.tsx`

This is the largest task. Do it in three sub-steps.

### 5a — New layout constants and zone geometry

- [ ] **Step 5a.1 — Replace `EVEN_GRID_SLOT_BY_ID` with zone-based layout**

Add this import at the top of the file (alongside other imports):

```typescript
import { INFRASTRUCTURE_BY_ID } from '@/lib/energy';
```

Then replace the entire `EVEN_LAYOUT_BOUNDS`, `EVEN_LAYOUT_COLUMNS`, `EVEN_LAYOUT_ROWS`, `EVEN_GRID_SLOT_BY_ID`, and `getEvenGridCoordinate` section with:

```typescript
// ─── Voltage zone band geometry ──────────────────────────────────────────────
// Canvas: MAP_WIDTH × MAP_HEIGHT (1000 × 420)
// 5 horizontal bands stacked top-to-bottom: 330kV → 110kV → 35kV → 10kV → 0.4kV

const ZONE_BAND: Record<string, { yCenter: number; yTop: number; yBottom: number; color: string; dimColor: string }> = {
  '330kv': { yCenter:  64, yTop:  12, yBottom: 108, color: '#00D084', dimColor: 'rgba(0,208,132,0.18)' },
  '110kv': { yCenter: 162, yTop: 115, yBottom: 210, color: '#2AA9FF', dimColor: 'rgba(42,169,255,0.14)' },
  '35kv':  { yCenter: 252, yTop: 215, yBottom: 300, color: '#F5B942', dimColor: 'rgba(245,185,66,0.13)' },
  '10kv':  { yCenter: 336, yTop: 302, yBottom: 374, color: '#9C6BFF', dimColor: 'rgba(156,107,255,0.12)' },
  '0.4kv': { yCenter: 396, yTop: 376, yBottom: 416, color: '#FF8080', dimColor: 'rgba(255,107,107,0.10)' },
};

// Fixed x positions for inter-zone step-down substations (decorative, not game edges)
const INTER_ZONE_SUBSTATION_X = [280, 580];   // two 330/110 substations
const INTER_ZONE_SUBSTATION_X_SINGLE: Record<string, number> = {
  '110kv-35kv':  420,
  '35kv-10kv':   540,
  '10kv-0.4kv':  680,
};

// Asset x positions within their zone (T-shaped backbone)
const ASSET_ZONE_X: Record<string, number> = {
  'control-center':          155,
  'hvdc-interconnector':     700,
  'smart-transformer':       280,
  'frequency-controller':    440,
  'ai-grid-optimizer':       590,
  'solar-forecasting-array': 360,
  'battery-storage':         520,
  'grid-flywheel':           540,
  'demand-response-system':  640,
};

// Look up voltageZone from the infrastructure definition (GridOpsNodeView doesn't carry it).
// Falls back to '110kv' for any unknown asset id.
const resolveNodeLayout = (nodes: GridOpsNodeView[]): Record<string, { x: number; y: number }> => {
  return nodes.reduce<Record<string, { x: number; y: number }>>((result, node) => {
    const infraNode = INFRASTRUCTURE_BY_ID[node.id];
    const zone = infraNode?.voltageZone ?? '110kv';
    const band = ZONE_BAND[zone];
    const x = ASSET_ZONE_X[node.id] ?? node.position.x;
    result[node.id] = { x, y: band?.yCenter ?? node.position.y };
    return result;
  }, {});
};
```

- [ ] **Step 5a.2 — Verify TypeScript compiles**

```bash
PATH="/Users/nedasvaitkus/.nvm/versions/node/v22.17.1/bin:$PATH" npx tsc --noEmit 2>&1 | grep "GridMapCanvas"
```

Expected: no errors.

### 5b — Zone band rendering (SVG layer)

- [ ] **Step 5b.1 — Add zone bands, bus bars, step-down substations and SPs to the SVG**

In the `return` of `GridMapCanvas`, just after the circuit-grid-lines SVG and before the atmosphere overlay, insert a new SVG layer:

```tsx
{/* ── Voltage zone bands + fixed infrastructure ── */}
<svg
  className="pointer-events-none absolute inset-0 h-full w-full"
  viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
  preserveAspectRatio="xMidYMid slice"
  aria-hidden
>
  {/* Zone band fills */}
  {Object.entries(ZONE_BAND).map(([zoneId, band]) => {
    const zoneView = state.map.voltage_zones.find((z) => z.id === zoneId);
    const isDark = zoneView?.health === 'dark';
    const isStressed = zoneView?.health === 'stressed';
    return (
      <rect
        key={zoneId}
        x={0}
        y={band.yTop}
        width={MAP_WIDTH}
        height={band.yBottom - band.yTop}
        fill={isDark ? 'rgba(255,77,79,0.06)' : band.dimColor}
        opacity={isDark ? 1 : isStressed ? 0.85 : 0.7}
      />
    );
  })}

  {/* Zone top border lines */}
  {Object.entries(ZONE_BAND).map(([zoneId, band]) => (
    <line key={`border-${zoneId}`} x1={0} y1={band.yTop} x2={MAP_WIDTH} y2={band.yTop}
      stroke={band.color} strokeWidth={0.8} opacity={0.3} />
  ))}

  {/* Zone kV labels */}
  {Object.entries(ZONE_BAND).map(([zoneId, band]) => {
    const def = state.map.voltage_zones.find((z) => z.id === zoneId);
    return (
      <g key={`label-${zoneId}`}>
        <text x={14} y={band.yTop + 16} fill={band.color} fontSize={10} fontFamily="monospace" fontWeight="bold" opacity={0.9}>
          {def?.label ?? zoneId}
        </text>
        <text x={14} y={band.yTop + 27} fill={band.color} fontSize={7} fontFamily="monospace" letterSpacing={1} opacity={0.45}>
          {def?.sublabel}
        </text>
      </g>
    );
  })}

  {/* Bus bars (horizontal lines within each zone) */}
  {Object.entries(ZONE_BAND).map(([zoneId, band]) => {
    const zoneView = state.map.voltage_zones.find((z) => z.id === zoneId);
    const isDark = zoneView?.health === 'dark';
    return (
      <g key={`busbar-${zoneId}`}>
        <line x1={120} y1={band.yCenter} x2={820} y2={band.yCenter}
          stroke={isDark ? 'rgba(255,77,79,0.3)' : band.color}
          strokeWidth={isDark ? 1.5 : 2.8}
          strokeLinecap="round"
          opacity={isDark ? 0.4 : 0.4}
          strokeDasharray={isDark ? '4 6' : undefined}
        />
        {/* Bus bar glow layer */}
        {!isDark && (
          <line x1={120} y1={band.yCenter} x2={820} y2={band.yCenter}
            stroke={band.color} strokeWidth={8} strokeLinecap="round" opacity={0.06} />
        )}
      </g>
    );
  })}

  {/* Switching points (SP) on 330kV and 110kV bus bars */}
  {[240, 420, 660].map((x) => (
    <rect key={`sp-330-${x}`} x={x - 5} y={ZONE_BAND['330kv'].yCenter - 6} width={10} height={12}
      rx={2} fill="#071a14" stroke="rgba(0,208,132,0.55)" strokeWidth={1} />
  ))}
  {[310, 510].map((x) => (
    <rect key={`sp-110-${x}`} x={x - 5} y={ZONE_BAND['110kv'].yCenter - 5} width={10} height={10}
      rx={2} fill="#071a14" stroke="rgba(42,169,255,0.45)" strokeWidth={1} />
  ))}

  {/* Inter-zone step-down substation boxes */}
  {state.map.inter_zone_lines.map((line) => {
    const fromBand = ZONE_BAND[line.from_zone];
    const toBand = ZONE_BAND[line.to_zone];
    if (!fromBand || !toBand) return null;

    // Determine x position
    let xs: number[] = [];
    if (line.id === '330kv-110kv') {
      xs = INTER_ZONE_SUBSTATION_X;
    } else {
      const x = INTER_ZONE_SUBSTATION_X_SINGLE[line.id];
      if (x) xs = [x];
    }

    const isCascade = line.state === 'cascade';
    const boxColor = isCascade ? 'rgba(255,77,79,0.6)' : fromBand.color;
    const lineOpacity = isCascade ? 0.3 : 0.55;

    return xs.map((x) => (
      <g key={`substation-${line.id}-${x}`}>
        {/* Vertical line from upper zone bus bar to box */}
        <line x1={x} y1={fromBand.yCenter} x2={x} y2={fromBand.yBottom - 6}
          stroke={fromBand.color} strokeWidth={1.8} opacity={lineOpacity}
          strokeDasharray={isCascade ? '3 5' : undefined} />
        {/* Box */}
        <rect x={x - 8} y={fromBand.yBottom - 6} width={16} height={toBand.yTop - fromBand.yBottom + 12}
          rx={3} fill="#0a1410" stroke={boxColor} strokeWidth={isCascade ? 1.2 : 1.5}
          strokeDasharray={isCascade ? '3 3' : undefined} />
        {/* Label inside box */}
        <text x={x} y={fromBand.yBottom + 4} textAnchor="middle" fill={fromBand.color}
          fontSize={6.5} fontFamily="monospace" opacity={isCascade ? 0.4 : 0.85}>
          {line.label.split('/')[0]}/
        </text>
        <text x={x} y={fromBand.yBottom + 12} textAnchor="middle" fill={toBand.color}
          fontSize={6.5} fontFamily="monospace" opacity={isCascade ? 0.4 : 0.85}>
          {line.label.split('/')[1]}
        </text>
        {/* Vertical line from box to lower zone bus bar */}
        <line x1={x} y1={toBand.yTop + 6} x2={x} y2={toBand.yCenter}
          stroke={toBand.color} strokeWidth={1.8} opacity={lineOpacity}
          strokeDasharray={isCascade ? '3 5' : undefined} />
        {/* Cascade fault indicator */}
        {isCascade && (
          <text x={x + 12} y={fromBand.yBottom + 8} fill="rgba(255,77,79,0.7)"
            fontSize={6} fontFamily="monospace">FAULT</text>
        )}
      </g>
    ));
  })}

  {/* Zone health overlays (dark zone dimming) */}
  {state.map.voltage_zones
    .filter((z) => z.health === 'dark' && z.deployed_asset_ids.length > 0)
    .map((z) => {
      const band = ZONE_BAND[z.id];
      if (!band) return null;
      return (
        <rect key={`dark-${z.id}`} x={0} y={band.yTop} width={MAP_WIDTH}
          height={band.yBottom - band.yTop}
          fill="rgba(0,0,0,0.45)" />
      );
    })}
</svg>
```

### 5c — Update zone health indicator in the legend

- [ ] **Step 5c.1 — Replace the bottom legend with a zone health strip**

Find the bottom legend `<div>` (the `Active / Stressed / Faulted` pill) and replace it with:

```tsx
<div className="absolute bottom-4 left-4 z-30 flex flex-wrap items-center gap-1.5 rounded-xl border border-[#1a3028] bg-[#060e09]/90 px-3 py-1.5">
  {state.map.voltage_zones.map((zone) => (
    <span key={zone.id} className="inline-flex items-center gap-1 font-mono text-[9px]"
      style={{ color: zone.health === 'dark' ? '#FF4D4F' : zone.health === 'stressed' ? '#F5B942' : zone.color }}>
      <span className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: zone.health === 'dark' ? '#FF4D4F' : zone.health === 'stressed' ? '#F5B942' : zone.color }} />
      {zone.label}
    </span>
  ))}
  <span className="mx-1 h-3 w-px bg-[#1a3028]" />
  <span className="inline-flex items-center gap-1 text-[9px] text-[#c7ddd2]">
    <span className="h-[2px] w-4 bg-[#00D084]" /> Active
  </span>
  <span className="inline-flex items-center gap-1 text-[9px] text-[#c7ddd2]">
    <span className="h-[2px] w-4 bg-[#F5B942]" /> Stressed
  </span>
  <span className="inline-flex items-center gap-1 text-[9px] text-[#c7ddd2]">
    <span className="h-[2px] w-4 bg-[#FF4D4F]" /> Faulted
  </span>
</div>
```

- [ ] **Step 5c.2 — Verify TypeScript compiles with zero errors**

```bash
PATH="/Users/nedasvaitkus/.nvm/versions/node/v22.17.1/bin:$PATH" npx tsc --noEmit 2>&1 | head -40
```

Expected: zero errors.

- [ ] **Step 5c.3 — Start the dev server and visually verify the map**

```bash
PATH="/Users/nedasvaitkus/.nvm/versions/node/v22.17.1/bin:$PATH" npm run dev -- --port 3000 &
```

Open `http://localhost:3000/energy`. Check:
- 5 horizontal colored bands visible
- Bus bars run across each zone
- Step-down substation boxes sit between zones
- SP rectangles visible on 330kV and 110kV bus bars
- Assets appear at correct y-positions (in their voltage zone)
- No TypeScript errors in terminal

- [ ] **Step 5c.4 — Commit**

```bash
git add components/grid-ops/GridMapCanvas.tsx
git commit -m "feat(grid-map): redesign map with 5 voltage zone bands, bus bars, and substations"
```

---

## Task 6: Smoke test cascade fault visibility

- [ ] **Step 6.1 — Manually trigger a cascade state for visual QA**

In `lib/grid-ops/config.ts`, temporarily set `CASCADE_THRESHOLD = 99` to force all zones into cascade state. Reload the game page. Verify:
- All inter-zone lines show dashed red
- Dark zone overlay appears over all zone bands
- Zone health strip at bottom shows all zones in red/dark

After verifying, revert `CASCADE_THRESHOLD` back to `35`.

- [ ] **Step 6.2 — Final commit**

```bash
git add lib/grid-ops/config.ts
git commit -m "feat(grid-map): voltage zone map complete — cascade fault, bus bars, substations"
```

---

## Quick Reference: Asset → Voltage Zone

| Asset | Zone | Rationale |
|-------|------|-----------|
| Control Center | 330kV | Backbone grid command |
| HVDC Interconnector | 330kV | Cross-border transmission |
| Smart Transformer | 110kV | 110/35kV step-down control |
| Frequency Controller | 110kV | Sub-transmission frequency management |
| AI Grid Optimizer | 110kV | Regional predictive balancing |
| Solar Forecasting Array | 35kV | Feeder-level solar injection |
| Battery Storage | 35kV | Distribution-level buffer |
| Grid Flywheel | 10kV | Secondary-distribution frequency response |
| Demand Response System | 0.4kV | Consumer / EV load management |

## Cascade Fault Thresholds

| Constant | Value | Meaning |
|----------|-------|---------|
| `CASCADE_THRESHOLD` | 35% | Both adjacent zones must be below this for cascade |
| `CASCADE_RESTORE_THRESHOLD` | 60% | (future) Either zone must recover above this to restore — not yet wired in |
