'use client';

import { useMemo } from 'react';
import type { GridOpsComputedState, GridOpsNodeView } from '@/lib/grid-ops/types';

export interface VoltageZoneMapProps {
  state: GridOpsComputedState;
  highlightedAssetId: string | null;
  deployingAssetId: string | null;
  className?: string;
}

// ─── Layout constants ──────────────────────────────────────────────────────────
const SVG_W = 1000;
const SVG_H = 636;
const LABEL_COL_W = 134;
const BUS_X_START = LABEL_COL_W + 8;
const BUS_X_END = 974;
const NODE_R = 25;

// ─── Voltage zone definitions ──────────────────────────────────────────────────
const ZONES = [
  { id: '330kv',  kv: '330 kV', type: 'TRANSMISSION',    subtitle: 'Baltic backbone ring',            color: '#22d3a0', top: 0,   height: 120, busY: 54  },
  { id: '110kv',  kv: '110 kV', type: 'SUB-TRANSMISSION', subtitle: 'Regional control layer',         color: '#60a5fa', top: 122, height: 120, busY: 176 },
  { id: '35kv',   kv: '35 kV',  type: 'DISTRIBUTION',    subtitle: 'Feeder ring, prosumer injections', color: '#fbbf24', top: 244, height: 120, busY: 298 },
  { id: '10kv',   kv: '10 kV',  type: 'SECONDARY DIST.', subtitle: 'Urban feeders, industrial',       color: '#a78bfa', top: 366, height: 120, busY: 420 },
  { id: '0.4kv',  kv: '0.4 kV', type: 'LOW VOLTAGE',     subtitle: 'Consumer / EV load',              color: '#f87171', top: 488, height: 120, busY: 542 },
] as const;

type ZoneId = (typeof ZONES)[number]['id'];

const zoneById = Object.fromEntries(ZONES.map(z => [z.id, z])) as Record<ZoneId, (typeof ZONES)[number]>;

// ─── Asset layout config ───────────────────────────────────────────────────────
interface AssetLayout {
  zoneId: ZoneId;
  x: number;
  line1: string;
  line2: string;
}

const ASSET_LAYOUT: Record<string, AssetLayout> = {
  'control-center':           { zoneId: '330kv', x: 262,  line1: 'Control', line2: 'Center' },
  'hvdc-interconnector':      { zoneId: '330kv', x: 842,  line1: 'HVDC',    line2: 'Intercon.' },
  'smart-transformer':        { zoneId: '110kv', x: 382,  line1: 'Smart',   line2: 'Trans.' },
  'frequency-controller':     { zoneId: '110kv', x: 592,  line1: 'Freq',    line2: 'Contrl.' },
  'ai-grid-optimizer':        { zoneId: '110kv', x: 792,  line1: 'AI Grid', line2: 'Optim.' },
  'solar-forecasting-array':  { zoneId: '35kv',  x: 452,  line1: 'Solar',   line2: 'Forecast' },
  'battery-storage':          { zoneId: '35kv',  x: 652,  line1: 'Battery', line2: 'Storage' },
  'grid-flywheel':            { zoneId: '10kv',  x: 652,  line1: 'Grid',    line2: 'Flywheel' },
  'demand-response-system':   { zoneId: '0.4kv', x: 732,  line1: 'Demand',  line2: 'Response' },
};

// ─── Step-down substations ─────────────────────────────────────────────────────
const STEP_DOWNS = [
  { id: 'sd-330-110-a', from: '330kv' as ZoneId, to: '110kv' as ZoneId, x: 342 },
  { id: 'sd-330-110-b', from: '330kv' as ZoneId, to: '110kv' as ZoneId, x: 842 },
  { id: 'sd-110-35',    from: '110kv' as ZoneId, to: '35kv'  as ZoneId, x: 542 },
  { id: 'sd-35-10',     from: '35kv'  as ZoneId, to: '10kv'  as ZoneId, x: 652 },
  { id: 'sd-10-04',     from: '10kv'  as ZoneId, to: '0.4kv' as ZoneId, x: 732 },
];

// ─── Node visual state ─────────────────────────────────────────────────────────
type NodeViz = 'inactive' | 'active' | 'stabilized' | 'optimized' | 'warning' | 'critical' | 'offline';

function getNodeViz(node: GridOpsNodeView | undefined): NodeViz {
  if (!node?.isDeployed) return 'inactive';
  if (node.health_pct !== undefined) {
    if (node.health_pct <= 20) return 'offline';
    if (node.health_pct <= 50) return 'critical';
    if (node.health_pct <= 75) return 'warning';
  }
  if (node.state === 'optimized') return 'optimized';
  if (node.state === 'stabilized') return 'stabilized';
  return 'active';
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function VoltageZoneMap({ state, highlightedAssetId, deployingAssetId, className }: VoltageZoneMapProps) {
  const nodeById = useMemo(() => {
    const m: Record<string, GridOpsNodeView> = {};
    state.map.nodes.forEach(n => { m[n.id] = n; });
    return m;
  }, [state.map.nodes]);

  const hasDarkRegion = useMemo(
    () => state.map.regions.some(r => r.status === 'dark'),
    [state.map.regions]
  );

  const stability = state.simulation.stability_pct;
  const cascadeZoneIds = useMemo<Set<ZoneId>>(() => {
    const set = new Set<ZoneId>();
    if (hasDarkRegion || stability < 30) {
      // Highlight the right side of 35kV zone as dark when stability is critical
      set.add('35kv');
    }
    return set;
  }, [hasDarkRegion, stability]);

  return (
    <div className={`relative overflow-hidden bg-[#070a08] ${className ?? ''}`}>
      <style>{`
        @keyframes vzm-pulse { 0%,100%{opacity:.55} 50%{opacity:1} }
        @keyframes vzm-ripple { 0%{r:${NODE_R}px;opacity:.8} 100%{r:${NODE_R * 2.4}px;opacity:0} }
        .vzm-pulse { animation: vzm-pulse 2.6s ease-in-out infinite; }
        .vzm-ripple { animation: vzm-ripple 1s ease-out infinite; }
      `}</style>

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full"
        style={{ display: 'block' }}
        aria-label="Voltage zone grid map"
      >
        <defs>
          {ZONES.map(z => (
            <filter key={`glow-${z.id}`} id={`glow-${z.id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}
          <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Zone background bands ─────────────────────────────────────────── */}
        {ZONES.map(z => (
          <rect key={`bg-${z.id}`} x={0} y={z.top} width={SVG_W} height={z.height}
            fill={z.color} fillOpacity={0.04} />
        ))}

        {/* ── Zone separator lines ──────────────────────────────────────────── */}
        {ZONES.slice(0, -1).map(z => (
          <line key={`sep-${z.id}`} x1={0} y1={z.top + z.height} x2={SVG_W} y2={z.top + z.height}
            stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
        ))}

        {/* ── Label column divider ──────────────────────────────────────────── */}
        <line x1={LABEL_COL_W} y1={0} x2={LABEL_COL_W} y2={SVG_H - 22}
          stroke="rgba(255,255,255,0.06)" strokeWidth={1} />

        {/* ── Zone labels ───────────────────────────────────────────────────── */}
        {ZONES.map(z => (
          <g key={`lbl-${z.id}`}>
            <text x={8} y={z.top + 22} fill={z.color} fontSize={13} fontFamily="ui-monospace,monospace" fontWeight="700">{z.kv}</text>
            <text x={8} y={z.top + 36} fill={z.color} fillOpacity={0.6} fontSize={7.5} fontFamily="ui-monospace,monospace" fontWeight="600" letterSpacing={0.8}>{z.type}</text>
            <text x={8} y={z.top + 49} fill={z.color} fillOpacity={0.32} fontSize={6.5} fontFamily="ui-monospace,monospace" fontStyle="italic">{z.subtitle}</text>
          </g>
        ))}

        {/* ── Bus bars ──────────────────────────────────────────────────────── */}
        {ZONES.map(z => {
          const isActive = [...Object.entries(ASSET_LAYOUT)]
            .some(([id, cfg]) => cfg.zoneId === z.id && nodeById[id]?.isDeployed);
          return (
            <line key={`bus-${z.id}`}
              x1={BUS_X_START} y1={z.busY} x2={BUS_X_END} y2={z.busY}
              stroke={z.color}
              strokeWidth={isActive ? 2 : 1.5}
              strokeOpacity={isActive ? 0.65 : 0.28}
              filter={isActive ? `url(#glow-${z.id})` : undefined}
            />
          );
        })}

        {/* ── Step-down substation connections ─────────────────────────────── */}
        {STEP_DOWNS.map(sd => {
          const upper = zoneById[sd.from];
          const lower = zoneById[sd.to];
          const midY = Math.round((upper.busY + lower.busY) / 2);
          const BOX = 11;
          const HALF = BOX / 2;
          return (
            <g key={sd.id}>
              {/* SP marker on upper bus */}
              <rect x={sd.x - 4} y={upper.busY - 4} width={8} height={8}
                fill="#0d1810" stroke={upper.color} strokeOpacity={0.45} strokeWidth={1} />
              {/* Upper vertical line */}
              <line x1={sd.x} y1={upper.busY + 4} x2={sd.x} y2={midY - HALF}
                stroke="rgba(160,200,180,0.22)" strokeWidth={1.5} strokeDasharray="4 3" />
              {/* Step-down box */}
              <rect x={sd.x - HALF} y={midY - HALF} width={BOX} height={BOX}
                fill="#0b1510" stroke="rgba(160,200,180,0.38)" strokeWidth={1} />
              {/* Lower vertical line */}
              <line x1={sd.x} y1={midY + HALF} x2={sd.x} y2={lower.busY - 4}
                stroke="rgba(160,200,180,0.22)" strokeWidth={1.5} strokeDasharray="4 3" />
              {/* SP marker on lower bus */}
              <rect x={sd.x - 4} y={lower.busY - 4} width={8} height={8}
                fill="#0d1810" stroke={lower.color} strokeOpacity={0.45} strokeWidth={1} />
            </g>
          );
        })}

        {/* ── Switching-point markers on bus bars (at each asset junction) ─── */}
        {Object.entries(ASSET_LAYOUT).map(([id, cfg]) => {
          const z = zoneById[cfg.zoneId];
          return (
            <rect key={`sp-${id}`}
              x={cfg.x - 3.5} y={z.busY - 3.5} width={7} height={7}
              fill="#111a14" stroke={z.color} strokeOpacity={0.35} strokeWidth={1} />
          );
        })}

        {/* ── Dark zone cascade overlay ─────────────────────────────────────── */}
        {cascadeZoneIds.has('35kv') && (() => {
          const z = zoneById['35kv'];
          return (
            <g>
              <rect x={720} y={z.top + 4} width={250} height={z.height - 8}
                fill="rgba(180,20,20,0.1)" stroke="rgba(239,68,68,0.3)" strokeWidth={1} />
              <text x={734} y={z.top + 32} fill="#ef4444" fontSize={10}
                fontFamily="ui-monospace,monospace" fontWeight="700" letterSpacing={1.2}>
                DARK ZONE
              </text>
              <text x={734} y={z.top + 46} fill="#ef4444" fillOpacity={0.55} fontSize={8}
                fontFamily="ui-monospace,monospace">
                cascade fault
              </text>
            </g>
          );
        })()}

        {/* ── Asset nodes ───────────────────────────────────────────────────── */}
        {Object.entries(ASSET_LAYOUT).map(([id, cfg]) => {
          const z = zoneById[cfg.zoneId];
          const node = nodeById[id];
          const viz = getNodeViz(node);
          const deployed = node?.isDeployed ?? false;
          const highlighted = highlightedAssetId === id;
          const deploying = deployingAssetId === id;

          const cx = cfg.x;
          const cy = z.busY;

          // Color logic
          const ringColor = (() => {
            if (viz === 'warning') return '#f59e0b';
            if (viz === 'critical' || viz === 'offline') return '#ef4444';
            return z.color;
          })();
          const fillOpacity = deployed ? 0.92 : 0.5;
          const strokeOpacity = deployed ? (viz === 'inactive' ? 0.4 : 0.85) : 0.25;
          const textFill = deployed ? '#e8f4ec' : 'rgba(120,160,130,0.45)';
          const labelFill = deployed ? z.color : `${z.color}55`;

          return (
            <g key={id} transform={`translate(${cx},${cy})`}>
              {/* Deploy ripple */}
              {deploying && (
                <circle r={NODE_R} fill="none" stroke={z.color} strokeWidth={2} className="vzm-ripple" />
              )}

              {/* Highlight ring */}
              {highlighted && (
                <circle r={NODE_R + 9} fill="none"
                  stroke={z.color} strokeWidth={1.5} strokeOpacity={0.5}
                  strokeDasharray="5 3" className="vzm-pulse" />
              )}

              {/* Outer glow for active nodes */}
              {deployed && viz !== 'offline' && (
                <circle r={NODE_R + 4} fill="none"
                  stroke={ringColor} strokeWidth={4} strokeOpacity={0.1}
                  className="vzm-pulse" />
              )}

              {/* Main node circle */}
              <circle r={NODE_R}
                fill={deployed ? '#0c1a12' : '#09100c'}
                fillOpacity={fillOpacity}
                stroke={ringColor}
                strokeWidth={deployed ? 1.5 : 1}
                strokeOpacity={strokeOpacity}
                strokeDasharray={!deployed ? '4 3' : undefined}
              />

              {/* Inner ring for deployed nodes */}
              {deployed && (
                <circle r={NODE_R - 7} fill="none"
                  stroke={ringColor} strokeWidth={0.75} strokeOpacity={0.3} />
              )}

              {/* Node text labels */}
              <text y={-4} textAnchor="middle" fill={textFill}
                fontSize={7.5} fontFamily="ui-monospace,monospace" fontWeight={deployed ? '700' : '400'}>
                {cfg.line1}
              </text>
              <text y={6} textAnchor="middle" fill={textFill} fillOpacity={0.75}
                fontSize={7} fontFamily="ui-monospace,monospace">
                {cfg.line2}
              </text>

              {/* Below-node name label */}
              <text y={NODE_R + 13} textAnchor="middle"
                fill={labelFill} fontSize={7.5} fontFamily="ui-monospace,monospace">
                {cfg.line1}
              </text>
              <text y={NODE_R + 23} textAnchor="middle"
                fill={labelFill} fillOpacity={0.8} fontSize={7} fontFamily="ui-monospace,monospace">
                {cfg.line2}
              </text>

              {/* Health bar (incident damage) */}
              {node?.health_pct !== undefined && deployed && (
                <g transform={`translate(${-NODE_R}, ${NODE_R + 4})`}>
                  <rect width={NODE_R * 2} height={3} fill="rgba(15,25,15,0.9)" />
                  <rect
                    width={Math.max(0, NODE_R * 2 * (node.health_pct / 100))} height={3}
                    fill={node.health_pct <= 30 ? '#ef4444' : node.health_pct <= 60 ? '#f59e0b' : '#22d3a0'}
                  />
                </g>
              )}
            </g>
          );
        })}

        {/* ── Legend ────────────────────────────────────────────────────────── */}
        <g transform={`translate(${LABEL_COL_W + 8}, ${SVG_H - 16})`} fontSize={7.5}
          fontFamily="ui-monospace,monospace" fill="rgba(140,180,155,0.5)">
          {/* Bus bar */}
          <line x1={0} y1={7} x2={22} y2={7} stroke="#22d3a0" strokeWidth={1.8} strokeOpacity={0.55} />
          <text x={26} y={11}>Bus bar</text>
          {/* SP */}
          <rect x={92} y={3} width={7} height={7} fill="#0d1810" stroke="rgba(160,200,180,0.45)" strokeWidth={1} />
          <text x={103} y={11}>SP (switching point)</text>
          {/* Step-down */}
          <rect x={232} y={3} width={7} height={7} fill="#0b1510" stroke="rgba(160,200,180,0.38)" strokeWidth={1} />
          <text x={243} y={11}>Step-down substation</text>
          {/* Dark zone */}
          <rect x={384} y={2} width={12} height={9} fill="rgba(180,20,20,0.2)" stroke="rgba(239,68,68,0.4)" strokeWidth={1} />
          <text x={400} y={11}>Dark zone (cascade)</text>
        </g>
      </svg>
    </div>
  );
}
