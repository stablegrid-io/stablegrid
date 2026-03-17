import {
  Activity,
  ArrowLeftRight,
  BatteryCharging,
  Cpu,
  Gauge,
  PlugZap,
  Radar,
  RefreshCcw,
  Sun,
  type LucideIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GridOpsAssetView, GridOpsComputedState, GridOpsNodeView, GridOpsRegionStatus } from '@/lib/grid-ops/types';
import { AssetHealthBar } from './AssetHealthBar';

interface GridMapCanvasProps {
  state: GridOpsComputedState;
  highlightedAssetId: string | null;
  deployingAssetId: string | null;
  className?: string;
}

type EdgeVisualState = 'inactive' | 'active' | 'stressed' | 'faulted';
type NodeOperationalState = 'active' | 'stressed' | 'faulted' | 'locked' | 'upgradable';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 420;
const GRAPH_INSET_LEFT = 60;
const GRAPH_INSET_RIGHT = 60;
const GRAPH_INSET_TOP = 58;
const GRAPH_INSET_BOTTOM = 84;
const SAFE_PADDING = 60;

const GRID_LINE_X_STEP = MAP_WIDTH / 35;
const GRID_LINE_Y_STEP = MAP_HEIGHT / 21;

const EVEN_LAYOUT_BOUNDS = {
  left: 120,
  right: 900,
  top: 96,
  bottom: 318
} as const;

const EVEN_LAYOUT_COLUMNS = 6;
const EVEN_LAYOUT_ROWS = 4;

const EVEN_GRID_SLOT_BY_ID: Record<string, { col: number; row: number }> = {
  'control-center': { col: 0, row: 2 },
  'smart-transformer': { col: 1, row: 1 },
  'solar-forecasting-array': { col: 2, row: 1 },
  'battery-storage': { col: 3, row: 2 },
  'frequency-controller': { col: 4, row: 1 },
  'ai-grid-optimizer': { col: 5, row: 2 },
  'demand-response-system': { col: 5, row: 3 },
  'grid-flywheel': { col: 3, row: 3 },
  'hvdc-interconnector': { col: 4, row: 3 }
};

const TOKENS = {
  gridBgDark: '#071A14',
  accentGreen: '#00D084',
  accentBlue: '#2AA9FF',
  accentAmber: '#F5B942',
  accentRed: '#FF4D4F',
  accentPurple: '#9C6BFF',
  muted: '#2E3F3A'
} as const;

const CATEGORY_STYLE: Record<
  GridOpsAssetView['category'],
  {
    color: string;
    strokeDash?: string;
    size: number;
    ringWidth: number;
    doubleRing?: boolean;
  }
> = {
  monitoring: {
    color: TOKENS.accentGreen,
    strokeDash: '1 6',
    size: 72,
    ringWidth: 2.4
  },
  control: {
    color: TOKENS.accentBlue,
    size: 64,
    ringWidth: 2.8
  },
  forecasting: {
    color: TOKENS.accentAmber,
    size: 62,
    ringWidth: 1.8,
    doubleRing: true
  },
  flexibility: {
    color: TOKENS.accentPurple,
    strokeDash: '8 5',
    size: 60,
    ringWidth: 2.3
  },
  reinforcement: {
    color: '#90a6a0',
    strokeDash: '2 4 8 3',
    size: 58,
    ringWidth: 2.2
  }
};

const OUTER_STATE_STYLE: Record<
  NodeOperationalState,
  { color: string; dash?: string; glow: string }
> = {
  active: {
    color: TOKENS.accentGreen,
    glow: '0 0 0 5px rgba(0,208,132,0.13), 0 10px 24px rgba(0,0,0,0.28)'
  },
  stressed: {
    color: TOKENS.accentAmber,
    dash: '7 6',
    glow: '0 0 0 5px rgba(245,185,66,0.12), 0 10px 24px rgba(0,0,0,0.28)'
  },
  faulted: {
    color: TOKENS.accentRed,
    dash: '4 6',
    glow: '0 0 0 5px rgba(255,77,79,0.12), 0 10px 24px rgba(0,0,0,0.28)'
  },
  locked: {
    color: '#5b6864',
    glow: '0 10px 20px rgba(0,0,0,0.25)'
  },
  upgradable: {
    color: TOKENS.accentBlue,
    dash: '2 4',
    glow: '0 0 0 5px rgba(42,169,255,0.12), 0 10px 24px rgba(0,0,0,0.28)'
  }
};

const EDGE_STYLES: Record<EdgeVisualState, { color: string; width: number; dash?: string }> = {
  inactive: {
    color: 'rgba(76,95,89,0.48)',
    width: 1.7
  },
  active: {
    color: 'rgba(0,208,132,0.85)',
    width: 2.6
  },
  stressed: {
    color: 'rgba(245,185,66,0.9)',
    width: 2.8,
    dash: '8 9'
  },
  faulted: {
    color: 'rgba(255,77,79,0.92)',
    width: 2.9,
    dash: '4 7'
  }
};

const getRegionFill = (status: GridOpsRegionStatus | undefined): string => {
  switch (status) {
    case 'dark':       return 'rgba(255,77,79,0.22)';
    case 'threatened': return 'rgba(245,185,66,0.18)';
    case 'active':     return 'rgba(0,208,132,0.15)';
    default:           return 'rgba(46,63,58,0.0)'; // inactive — no glow
  }
};

const getRegionAnimation = (status: GridOpsRegionStatus | undefined) => {
  if (status === 'dark') {
    return { opacity: [0.4, 0.7, 0.45], scale: [0.88, 1.06, 0.9] };
  }
  if (status === 'threatened') {
    return { opacity: [0.3, 0.55, 0.32], scale: [0.86, 1.05, 0.88] };
  }
  return { opacity: [0.14, 0.34, 0.18], scale: [0.84, 1.08, 0.86] };
};

const NODE_ICON_BY_ID: Record<string, LucideIcon> = {
  'control-center': Radar,
  'smart-transformer': Gauge,
  'solar-forecasting-array': Sun,
  'battery-storage': BatteryCharging,
  'frequency-controller': Activity,
  'demand-response-system': PlugZap,
  'grid-flywheel': RefreshCcw,
  'hvdc-interconnector': ArrowLeftRight,
  'ai-grid-optimizer': Cpu
};

const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

const toGraphX = (value: number) =>
  GRAPH_INSET_LEFT + (value / MAP_WIDTH) * (MAP_WIDTH - GRAPH_INSET_LEFT - GRAPH_INSET_RIGHT);

const toGraphY = (value: number) =>
  GRAPH_INSET_TOP + (value / MAP_HEIGHT) * (MAP_HEIGHT - GRAPH_INSET_TOP - GRAPH_INSET_BOTTOM);

const toGraphPercentX = (value: number) => toPercent(toGraphX(value), MAP_WIDTH);
const toGraphPercentY = (value: number) => toPercent(toGraphY(value), MAP_HEIGHT);

const getShortLabel = (asset: GridOpsAssetView | null) => {
  if (!asset) {
    return 'Unknown';
  }

  const name = asset.name
    .replace(/\(.*?\)/g, '')
    .replace(/\bSystem\b/gi, '')
    .replace(/\bArray\b/gi, '')
    .trim();

  const words = name.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).join(' ');
};

const getLabelOffset = (x: number, y: number) => {
  if (x > 840) {
    return { x: -16, y: 0, align: 'right' as const };
  }

  if (x < 170) {
    return { x: 16, y: 0, align: 'left' as const };
  }

  if (y < 100) {
    return { x: 0, y: 18, align: 'center' as const };
  }

  if (y > 320) {
    return { x: 0, y: -18, align: 'center' as const };
  }

  return x < MAP_WIDTH * 0.55
    ? { x: 16, y: 0, align: 'left' as const }
    : { x: -16, y: 0, align: 'right' as const };
};

const intersects = (
  left: { x1: number; y1: number; x2: number; y2: number },
  right: { x1: number; y1: number; x2: number; y2: number }
) => left.x1 < right.x2 && left.x2 > right.x1 && left.y1 < right.y2 && left.y2 > right.y1;

const snapToGrid = (value: number, step: number) => Math.round(value / step) * step;

const getEvenGridCoordinate = ({
  column,
  row
}: {
  column: number;
  row: number;
}) => {
  const clampedCol = Math.max(0, Math.min(EVEN_LAYOUT_COLUMNS - 1, column));
  const clampedRow = Math.max(0, Math.min(EVEN_LAYOUT_ROWS - 1, row));

  const xRatio = clampedCol / (EVEN_LAYOUT_COLUMNS - 1);
  const yRatio = clampedRow / (EVEN_LAYOUT_ROWS - 1);

  const rawX = EVEN_LAYOUT_BOUNDS.left + xRatio * (EVEN_LAYOUT_BOUNDS.right - EVEN_LAYOUT_BOUNDS.left);
  const rawY = EVEN_LAYOUT_BOUNDS.top + yRatio * (EVEN_LAYOUT_BOUNDS.bottom - EVEN_LAYOUT_BOUNDS.top);

  return {
    x: Math.max(SAFE_PADDING, Math.min(MAP_WIDTH - SAFE_PADDING, snapToGrid(rawX, GRID_LINE_X_STEP))),
    y: Math.max(SAFE_PADDING, Math.min(MAP_HEIGHT - SAFE_PADDING, snapToGrid(rawY, GRID_LINE_Y_STEP)))
  };
};

const resolveNodeLayout = (nodes: GridOpsNodeView[]) =>
  nodes.reduce<Record<string, { x: number; y: number }>>((result, node, index) => {
    const slot = EVEN_GRID_SLOT_BY_ID[node.id];

    if (slot) {
      result[node.id] = getEvenGridCoordinate({ column: slot.col, row: slot.row });
      return result;
    }

    // Fallback for unknown/extra nodes: distribute across the same grid bands.
    const fallbackColumn = index % EVEN_LAYOUT_COLUMNS;
    const fallbackRow = Math.min(EVEN_LAYOUT_ROWS - 1, Math.floor(index / EVEN_LAYOUT_COLUMNS));
    result[node.id] = getEvenGridCoordinate({ column: fallbackColumn, row: fallbackRow });
    return result;
  }, {});

const getEdgeState = ({
  energized,
  unstable,
  risk
}: {
  energized: boolean;
  unstable: boolean;
  risk: number;
}): EdgeVisualState => {
  if (!energized) {
    return 'inactive';
  }

  if (unstable && risk >= 68) {
    return 'faulted';
  }

  if (unstable) {
    return 'stressed';
  }

  return 'active';
};

const getTooltipPlacement = (position: { x: number; y: number }) => {
  const horizontal =
    position.x > MAP_WIDTH * 0.72
      ? 'left'
      : position.x < MAP_WIDTH * 0.28
        ? 'right'
        : 'center';
  const vertical = position.y > MAP_HEIGHT * 0.7 ? 'top' : 'bottom';
  return { horizontal, vertical };
};

function NodeTooltip({
  node,
  asset,
  position,
  placement
}: {
  node: GridOpsNodeView;
  asset: GridOpsAssetView;
  position: { x: number; y: number };
  placement: ReturnType<typeof getTooltipPlacement>;
}) {
  const horizontalTransform =
    placement.horizontal === 'left'
      ? '-100%'
      : placement.horizontal === 'right'
        ? '0%'
        : '-50%';

  const verticalTransform = placement.vertical === 'top' ? '-100%' : '0%';

  const xOffset = placement.horizontal === 'left' ? -16 : placement.horizontal === 'right' ? 16 : 0;
  const yOffset = placement.vertical === 'top' ? -16 : 16;

  return (
    <motion.div
      className="pointer-events-none absolute z-40 w-[280px] max-w-[calc(100vw-2rem)] rounded-xl border border-brand-500/40 bg-[#0f1d17]/97 p-3 text-brand-50 shadow-[0_20px_44px_rgba(0,0,0,0.45)]"
      style={{
        left: toGraphPercentX(position.x),
        top: toGraphPercentY(position.y),
        transform: `translate(calc(${horizontalTransform} + ${xOffset}px), calc(${verticalTransform} + ${yOffset}px))`
      }}
      initial={{ opacity: 0, y: placement.vertical === 'top' ? 8 : -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: placement.vertical === 'top' ? 6 : -6, scale: 0.98 }}
      transition={{ duration: 0.16 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-300/90">
            {asset.category}
          </p>
          <h4 className="mt-0.5 text-sm font-semibold text-brand-50">{asset.name}</h4>
        </div>
        <span className="rounded-full border border-brand-400/40 bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-200">
          {asset.status}
        </span>
      </div>

      <p className="mt-2 text-xs text-brand-100/85">{asset.description}</p>

      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
        <span className="rounded-md border border-brand-500/20 bg-black/20 px-2 py-1">+{asset.effects.stability}% stability</span>
        <span className="rounded-md border border-brand-500/20 bg-black/20 px-2 py-1">+{asset.effects.riskMitigation} risk damp</span>
        <span className="rounded-md border border-brand-500/20 bg-black/20 px-2 py-1">+{asset.effects.forecast}% forecast</span>
        <span className="rounded-md border border-brand-500/20 bg-black/20 px-2 py-1">{asset.cost_kwh.toFixed(2)} kWh</span>
      </div>

      {asset.synergy_hint ? (
        <p className="mt-2 rounded-md bg-brand-500/15 px-2 py-1 text-[11px] text-brand-100">
          {asset.synergy_hint}
        </p>
      ) : null}

      {asset.locked_reason ? <p className="mt-1 text-[11px] text-amber-300">{asset.locked_reason}</p> : null}
      <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[#95b9aa]">{node.state} state</p>
    </motion.div>
  );
}

function NodeMicroIndicator({
  asset,
  show
}: {
  asset: GridOpsAssetView;
  show: boolean;
}) {
  if (!show) {
    return null;
  }

  if (asset.category === 'flexibility') {
    const fill = Math.min(96, Math.max(18, 36 + asset.effects.riskMitigation * 3));
    return (
      <div className="mt-1.5 flex w-[66px] items-center gap-1">
        <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#9eb8af]">BAT</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#233631]">
          <div className="h-full rounded-full bg-[#9C6BFF]" style={{ width: `${fill}%` }} />
        </div>
      </div>
    );
  }

  if (asset.category === 'forecasting') {
    const confidence = Math.min(99, Math.max(42, 42 + asset.effects.forecast * 2));
    return (
      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#f7d58a]">
        {confidence}% fcst
      </p>
    );
  }

  if (asset.category === 'control') {
    return (
      <div className="mt-1.5 h-3 w-[54px] overflow-hidden rounded bg-[#152721]">
        <svg className="h-full w-full" viewBox="0 0 54 12" preserveAspectRatio="none" aria-hidden>
          <polyline
            points="0,8 6,7 11,4 18,5 24,8 30,6 37,3 44,5 54,7"
            fill="none"
            stroke="#7fc8ff"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    );
  }

  if (asset.category === 'monitoring') {
    return (
      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8fe0bd]">
        sync online
      </p>
    );
  }

  return (
    <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#b8cbca]">
      flow route
    </p>
  );
}

// ── Stability atmosphere helper ────────────────────────────────────────────────
// Returns a CSS style that overlays a color/filter on the grid map based on
// the current stability percentage. Transitions smoothly between tiers (2s ease).
function getAtmosphereStyle(pct: number): React.CSSProperties {
  if (pct < 25) {
    return {
      background:
        'radial-gradient(ellipse at 50% 50%,transparent 30%,rgba(248,113,113,0.18) 80%,rgba(220,38,38,0.28) 100%)',
      filter: 'saturate(0.72)'
    };
  }
  if (pct < 50) {
    return {
      background:
        'radial-gradient(ellipse at 50% 50%,transparent 35%,rgba(251,146,60,0.10) 75%,rgba(245,158,11,0.18) 100%)',
      filter: 'saturate(0.88)'
    };
  }
  if (pct < 75) {
    return {
      background:
        'radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(100,116,139,0.06) 80%)',
      filter: 'saturate(1.0)'
    };
  }
  if (pct < 90) {
    return {
      background:
        'radial-gradient(ellipse at 50% 50%,rgba(34,197,94,0.04) 0%,transparent 45%,rgba(34,197,94,0.08) 100%)',
      filter: 'saturate(1.1)'
    };
  }
  return {
    background:
      'radial-gradient(ellipse at 50% 50%,rgba(34,185,153,0.10) 0%,transparent 40%,rgba(245,185,66,0.12) 100%)',
    filter: 'saturate(1.25) brightness(1.04)'
  };
}

export function GridMapCanvas({
  state,
  highlightedAssetId,
  deployingAssetId,
  className
}: GridMapCanvasProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState(1200);
  const hoverDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapFrameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (hoverDelayTimerRef.current) {
        clearTimeout(hoverDelayTimerRef.current);
      }
      if (hideDelayTimerRef.current) {
        clearTimeout(hideDelayTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const frame = mapFrameRef.current;
    if (!frame) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setViewportWidth(entry.contentRect.width);
    });

    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const detailLevel = viewportWidth < 860 ? 0 : viewportWidth < 1120 ? 1 : 2;

  const nodeById = useMemo(
    () => new Map(state.map.nodes.map((node) => [node.id, node])),
    [state.map.nodes]
  );

  const assetById = useMemo(
    () => new Map(state.assets.map((asset) => [asset.id, asset])),
    [state.assets]
  );

  const nodeLayoutById = useMemo(() => resolveNodeLayout(state.map.nodes), [state.map.nodes]);

  const regionCenters = useMemo(() => {
    const accumulator = new Map<string, { x: number; y: number; count: number }>();

    state.map.nodes.forEach((node) => {
      const resolved = nodeLayoutById[node.id] ?? node.position;
      const bucket = accumulator.get(node.position.regionId);
      if (!bucket) {
        accumulator.set(node.position.regionId, {
          x: resolved.x,
          y: resolved.y,
          count: 1
        });
        return;
      }

      bucket.x += resolved.x;
      bucket.y += resolved.y;
      bucket.count += 1;
    });

    return Array.from(accumulator.entries()).reduce<Record<string, { x: number; y: number }>>(
      (result, [regionId, value]) => {
        result[regionId] = {
          x: value.x / value.count,
          y: value.y / value.count
        };
        return result;
      },
      {}
    );
  }, [nodeLayoutById, state.map.nodes]);

  const activeFocusNodeId = hoveredNodeId ?? highlightedAssetId;

  const connectedNodeIds = useMemo(() => {
    if (!activeFocusNodeId) {
      return new Set<string>();
    }

    const related = new Set<string>([activeFocusNodeId]);
    state.map.edges.forEach((edge) => {
      if (edge.from === activeFocusNodeId) {
        related.add(edge.to);
      }
      if (edge.to === activeFocusNodeId) {
        related.add(edge.from);
      }
    });

    return related;
  }, [activeFocusNodeId, state.map.edges]);

  const nodeStressById = useMemo(() => {
    const stressMap = new Map<string, { unstable: boolean; faulted: boolean }>();

    state.map.nodes.forEach((node) => {
      stressMap.set(node.id, { unstable: false, faulted: false });
    });

    state.map.edges.forEach((edge) => {
      if (!edge.unstable) {
        return;
      }

      const from = stressMap.get(edge.from);
      const to = stressMap.get(edge.to);
      if (from) {
        from.unstable = true;
        if (state.simulation.blackout_risk_pct >= 68) {
          from.faulted = true;
        }
      }
      if (to) {
        to.unstable = true;
        if (state.simulation.blackout_risk_pct >= 68) {
          to.faulted = true;
        }
      }
    });

    return stressMap;
  }, [state.map.edges, state.map.nodes, state.simulation.blackout_risk_pct]);

  const labelVisibility = useMemo(() => {
    if (detailLevel === 0) {
      return new Set<string>();
    }

    const occupied: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    const visible = new Set<string>();

    const orderedNodes = [...state.map.nodes].sort((left, right) => {
      const leftAsset = assetById.get(left.id);
      const rightAsset = assetById.get(right.id);

      const leftScore =
        (leftAsset?.status === 'deployed' ? 3 : leftAsset?.status === 'available' ? 2 : 1) +
        (left.id === activeFocusNodeId ? 2 : 0);
      const rightScore =
        (rightAsset?.status === 'deployed' ? 3 : rightAsset?.status === 'available' ? 2 : 1) +
        (right.id === activeFocusNodeId ? 2 : 0);

      return rightScore - leftScore;
    });

    orderedNodes.forEach((node) => {
      const position = nodeLayoutById[node.id] ?? node.position;
      const offset = getLabelOffset(position.x, position.y);
      const asset = assetById.get(node.id) ?? null;
      const label = getShortLabel(asset);

      const width = Math.min(120, Math.max(62, label.length * 6.2));
      const height = 18;

      let centerX = position.x;
      let centerY = position.y + offset.y;

      if (offset.align === 'left') {
        centerX = position.x + offset.x + width * 0.5;
      }

      if (offset.align === 'right') {
        centerX = position.x + offset.x - width * 0.5;
      }

      const box = {
        x1: centerX - width * 0.5,
        y1: centerY - height * 0.5,
        x2: centerX + width * 0.5,
        y2: centerY + height * 0.5
      };

      if (
        box.x1 < SAFE_PADDING - 10 ||
        box.x2 > MAP_WIDTH - SAFE_PADDING + 10 ||
        box.y1 < SAFE_PADDING - 14 ||
        box.y2 > MAP_HEIGHT - SAFE_PADDING + 8
      ) {
        return;
      }

      if (detailLevel < 2 && !connectedNodeIds.has(node.id) && node.id !== activeFocusNodeId) {
        return;
      }

      const collides = occupied.some((other) => intersects(other, box));
      if (!collides || node.id === activeFocusNodeId) {
        visible.add(node.id);
        occupied.push(box);
      }
    });

    return visible;
  }, [activeFocusNodeId, assetById, connectedNodeIds, detailLevel, nodeLayoutById, state.map.nodes]);

  const hoveredNode = hoveredNodeId ? nodeById.get(hoveredNodeId) ?? null : null;
  const hoveredAsset = hoveredNodeId ? assetById.get(hoveredNodeId) ?? null : null;

  const handleNodeMouseEnter = (nodeId: string) => {
    if (hideDelayTimerRef.current) {
      clearTimeout(hideDelayTimerRef.current);
      hideDelayTimerRef.current = null;
    }

    if (hoverDelayTimerRef.current) {
      clearTimeout(hoverDelayTimerRef.current);
    }

    hoverDelayTimerRef.current = setTimeout(() => {
      setHoveredNodeId(nodeId);
    }, 110);
  };

  const handleNodeMouseLeave = () => {
    if (hoverDelayTimerRef.current) {
      clearTimeout(hoverDelayTimerRef.current);
      hoverDelayTimerRef.current = null;
    }

    if (hideDelayTimerRef.current) {
      clearTimeout(hideDelayTimerRef.current);
    }

    hideDelayTimerRef.current = setTimeout(() => {
      setHoveredNodeId(null);
    }, 80);
  };

  const recommendedAssetId = state.recommendation.next_best_action.target_asset_id;

  return (
    <section
      ref={mapFrameRef}
      className={`relative h-[74vh] min-h-[640px] w-full overflow-hidden rounded-2xl border border-[#1a3028] bg-[radial-gradient(circle_at_18%_20%,rgba(0,208,132,0.10),transparent_36%),radial-gradient(circle_at_80%_76%,rgba(42,169,255,0.08),transparent_40%),linear-gradient(180deg,#060e09,#030a06)] ${className ?? ''}`}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.28]"
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {Array.from({ length: 22 }).map((_, index) => (
          <line
            key={`h-${index}`}
            x1={0}
            y1={index * (MAP_HEIGHT / 21)}
            x2={MAP_WIDTH}
            y2={index * (MAP_HEIGHT / 21)}
            stroke="rgba(0,208,132,0.14)"
            strokeWidth="0.6"
          />
        ))}
        {Array.from({ length: 36 }).map((_, index) => (
          <line
            key={`v-${index}`}
            x1={index * (MAP_WIDTH / 35)}
            y1={0}
            x2={index * (MAP_WIDTH / 35)}
            y2={MAP_HEIGHT}
            stroke="rgba(0,208,132,0.12)"
            strokeWidth="0.6"
          />
        ))}
        {/* Circuit-board intersection dots */}
        {Array.from({ length: 22 }).flatMap((_, r) =>
          Array.from({ length: 36 }).map((_, c) => (
            <circle
              key={`dot-${r}-${c}`}
              cx={c * (MAP_WIDTH / 35)}
              cy={r * (MAP_HEIGHT / 21)}
              r="0.9"
              fill="rgba(0,208,132,0.22)"
            />
          ))
        )}
      </svg>

      {/* Stability atmosphere overlay — reacts to stability tier */}
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-[2000ms] ease-in-out"
        style={getAtmosphereStyle(state.simulation.stability_pct)}
      />

      <div className="relative h-full w-full">
        {state.map.regions.map((region) => {
          const center = regionCenters[region.id];
          // Show glow for active/threatened/dark; skip inactive and regions without a center
          if (!center || region.status === 'inactive') {
            return null;
          }

          return (
            <motion.div
              key={region.id}
              className="pointer-events-none absolute h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{
                left: toGraphPercentX(center.x),
                top: toGraphPercentY(center.y),
                background: getRegionFill(region.status)
              }}
              initial={{ opacity: 0.2, scale: 0.8 }}
              animate={getRegionAnimation(region.status)}
              transition={{
                duration: region.status === 'dark' ? 2.4 : region.status === 'threatened' ? 3.0 : 4.2,
                repeat: Number.POSITIVE_INFINITY
              }}
            />
          );
        })}

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {state.map.edges.map((edge) => {
            const fromNode = nodeById.get(edge.from);
            const toNode = nodeById.get(edge.to);
            if (!fromNode || !toNode) {
              return null;
            }

            const fromAsset = assetById.get(edge.from) ?? null;
            const toAsset = assetById.get(edge.to) ?? null;
            const from = nodeLayoutById[edge.from] ?? fromNode.position;
            const to = nodeLayoutById[edge.to] ?? toNode.position;

            const isFocused =
              !activeFocusNodeId || edge.from === activeFocusNodeId || edge.to === activeFocusNodeId;
            const dimmed = Boolean(activeFocusNodeId && !isFocused);

            const visualState = getEdgeState({
              energized: edge.energized,
              unstable: edge.unstable,
              risk: state.simulation.blackout_risk_pct
            });

            const isBackbone =
              fromAsset?.category === 'reinforcement' ||
              toAsset?.category === 'reinforcement' ||
              (fromAsset?.category === 'control' && toAsset?.category === 'control');

            const edgeStyle = EDGE_STYLES[visualState];
            const edgeWidth = edgeStyle.width + (isBackbone ? 0.7 : 0);

            return (
              <g key={edge.id} opacity={dimmed ? 0.22 : 1}>
                <line
                  x1={toGraphX(from.x)}
                  y1={toGraphY(from.y)}
                  x2={toGraphX(to.x)}
                  y2={toGraphY(to.y)}
                  stroke={edgeStyle.color}
                  strokeWidth={edgeWidth}
                  strokeLinecap="round"
                  strokeDasharray={edgeStyle.dash}
                />

                {visualState === 'active' ? (
                  <motion.line
                    x1={toGraphX(from.x)}
                    y1={toGraphY(from.y)}
                    x2={toGraphX(to.x)}
                    y2={toGraphY(to.y)}
                    stroke="rgba(162,255,219,0.95)"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeDasharray="5 22"
                    animate={{ strokeDashoffset: [0, -96] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.8, ease: 'linear' }}
                  />
                ) : null}

                {/* Backbone second particle — slower overlay for depth */}
                {visualState === 'active' && isBackbone ? (
                  <motion.line
                    x1={toGraphX(from.x)}
                    y1={toGraphY(from.y)}
                    x2={toGraphX(to.x)}
                    y2={toGraphY(to.y)}
                    stroke="rgba(162,255,219,0.42)"
                    strokeWidth={1.2}
                    strokeLinecap="round"
                    strokeDasharray="3 32"
                    animate={{ strokeDashoffset: [0, -140] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3.6, ease: 'linear' }}
                  />
                ) : null}

                {visualState === 'stressed' ? (
                  <motion.line
                    x1={toGraphX(from.x)}
                    y1={toGraphY(from.y)}
                    x2={toGraphX(to.x)}
                    y2={toGraphY(to.y)}
                    stroke="rgba(245,185,66,0.85)"
                    strokeWidth={edgeWidth + 0.35}
                    strokeLinecap="round"
                    strokeDasharray="10 10"
                    animate={{ strokeDashoffset: [0, -60] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: 'linear' }}
                  />
                ) : null}

                {visualState === 'faulted' ? (
                  <motion.line
                    x1={toGraphX(from.x)}
                    y1={toGraphY(from.y)}
                    x2={toGraphX(to.x)}
                    y2={toGraphY(to.y)}
                    stroke="rgba(255,77,79,0.95)"
                    strokeWidth={edgeWidth + 0.2}
                    strokeLinecap="round"
                    strokeDasharray="5 8"
                    animate={{ opacity: [1, 0.35, 1] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.6 }}
                  />
                ) : null}
              </g>
            );
          })}
        </svg>

        {state.map.nodes.map((node) => {
          const asset = assetById.get(node.id) ?? null;
          if (!asset) {
            return null;
          }

          const position = nodeLayoutById[node.id] ?? node.position;
          const offset = getLabelOffset(position.x, position.y);
          const categoryStyle = CATEGORY_STYLE[asset.category];
          const Icon = NODE_ICON_BY_ID[node.id] ?? Cpu;

          const isConnected = connectedNodeIds.has(node.id);
          const isFocused = !activeFocusNodeId || isConnected;
          const highlighted = activeFocusNodeId === node.id;
          const deploying = deployingAssetId === node.id;
          const recommended = recommendedAssetId === node.id;

          const stress = nodeStressById.get(node.id) ?? { unstable: false, faulted: false };
          const operationalState: NodeOperationalState =
            asset.status === 'locked'
              ? 'locked'
              : stress.faulted
                ? 'faulted'
                : stress.unstable
                  ? 'stressed'
                  : asset.status === 'available'
                    ? 'upgradable'
                    : 'active';

          const outerStyle = OUTER_STATE_STYLE[operationalState];
          const nodeSize = node.id === 'control-center' ? categoryStyle.size + 6 : categoryStyle.size;
          const labelVisible = labelVisibility.has(node.id) || hoveredNodeId === node.id;
          const showMicro = detailLevel > 1 || hoveredNodeId === node.id || highlighted;

          // Incident health — undefined means healthy
          const nodeHealthPct = (node as GridOpsNodeView & { health_pct?: number }).health_pct;
          const isNodeOffline = nodeHealthPct !== undefined && nodeHealthPct <= 20;

          return (
            <motion.div
              key={node.id}
              className="absolute z-20"
              style={{
                left: toGraphPercentX(position.x),
                top: toGraphPercentY(position.y),
                transform: 'translate(-50%, -50%)',
                opacity: isFocused ? (isNodeOffline ? 0.45 : 1) : 0.26,
                filter: isNodeOffline ? 'grayscale(0.7)' : undefined
              }}
              animate={
                deploying
                  ? {
                      scale: [1, 1.15, 1.04, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(0,208,132,0.45)',
                        '0 0 0 16px rgba(0,208,132,0)',
                        '0 0 0 0 rgba(0,208,132,0)'
                      ]
                    }
                  : { scale: highlighted ? 1.08 : 1 }
              }
              transition={{ duration: deploying ? 0.9 : 0.25 }}
              onMouseEnter={() => handleNodeMouseEnter(node.id)}
              onMouseLeave={handleNodeMouseLeave}
            >
              <button
                type="button"
                aria-label={`${asset.name} node`}
                className="relative block rounded-full"
                style={{ width: `${nodeSize}px`, height: `${nodeSize}px` }}
              >
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden>
                  {/* Deploy ripple — radiates outward when node is being deployed */}
                  {deploying ? (
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      stroke="rgba(0,208,132,0.75)"
                      strokeWidth="1.5"
                      initial={{ r: 46, opacity: 0.85 }}
                      animate={{ r: 74, opacity: 0 }}
                      transition={{ duration: 1.0, repeat: 2, ease: 'easeOut' }}
                    />
                  ) : null}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={outerStyle.color}
                    strokeWidth="2.8"
                    strokeDasharray={outerStyle.dash}
                    opacity={operationalState === 'locked' ? 0.6 : 0.95}
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="36"
                    fill="none"
                    stroke={categoryStyle.color}
                    strokeWidth={categoryStyle.ringWidth}
                    strokeDasharray={categoryStyle.strokeDash}
                    opacity={asset.status === 'locked' ? 0.4 : 0.82}
                  />
                  {categoryStyle.doubleRing ? (
                    <circle
                      cx="50"
                      cy="50"
                      r="30"
                      fill="none"
                      stroke={categoryStyle.color}
                      strokeWidth="1.2"
                      opacity={0.65}
                    />
                  ) : null}
                  <circle
                    cx="50"
                    cy="50"
                    r="26"
                    fill="#08140f"
                    stroke={TOKENS.muted}
                    strokeWidth="1.1"
                  />
                </svg>

                {asset.category === 'monitoring' ? (
                  <motion.span
                    className="pointer-events-none absolute inset-[16%] rounded-full border border-dashed border-[#00D084]/60"
                    animate={{ rotate: [0, 360] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 5.5, ease: 'linear' }}
                  />
                ) : null}

                {asset.category === 'control' ? (
                  <motion.span
                    className="pointer-events-none absolute inset-[18%] rounded-full border border-[#2AA9FF]/55"
                    animate={{ rotate: [0, 360] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 6.8, ease: 'linear' }}
                  />
                ) : null}

                {asset.category === 'forecasting' ? (
                  <motion.span
                    className="pointer-events-none absolute inset-[14%] rounded-full border border-[#F5B942]/50"
                    animate={{ rotate: [360, 0] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 7.5, ease: 'linear' }}
                  />
                ) : null}

                {operationalState === 'active' ? (
                  <motion.span
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{
                      boxShadow: `${outerStyle.glow}, 0 0 0 8px ${categoryStyle.color}1e`
                    }}
                    animate={{ opacity: [0.60, 1, 0.65] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.8 }}
                  />
                ) : null}

                {operationalState === 'stressed' ? (
                  <motion.span
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{ boxShadow: outerStyle.glow }}
                    animate={{ opacity: [0.45, 0.95, 0.4], x: [0, -0.5, 0.5, 0], y: [0, 0.5, -0.5, 0] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2 }}
                  />
                ) : null}

                {operationalState === 'faulted' ? (
                  <motion.span
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{ boxShadow: outerStyle.glow }}
                    animate={{ opacity: [1, 0.25, 1] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.55 }}
                  />
                ) : null}

                <Icon
                  className="absolute left-1/2 top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2"
                  style={{ color: asset.status === 'locked' ? '#72817d' : categoryStyle.color }}
                />

                {recommended ? (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(42,169,255,0.8)]" />
                ) : null}
              </button>

              {/* Health bar — shown below node when there's an active incident */}
              {nodeHealthPct !== undefined && nodeHealthPct < 100 && (
                <div
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2"
                  style={{ top: `${nodeSize + 2}px`, width: `${nodeSize}px` }}
                >
                  <AssetHealthBar healthPct={nodeHealthPct} />
                </div>
              )}

              <div className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2">
                <NodeMicroIndicator asset={asset} show={showMicro} />
              </div>

              {labelVisible ? (
                <div
                  className="pointer-events-none absolute max-w-[120px] text-[10px] font-semibold text-[#d1e5da]"
                  style={{
                    left: offset.align === 'center' ? '50%' : offset.align === 'right' ? 'auto' : '100%',
                    right: offset.align === 'right' ? '100%' : 'auto',
                    top: '50%',
                    transform:
                      offset.align === 'center'
                        ? `translate(-50%, calc(-50% + ${offset.y}px))`
                        : `translate(${offset.x}px, -50%)`,
                    textAlign:
                      offset.align === 'center'
                        ? 'center'
                        : offset.align === 'right'
                          ? 'right'
                          : 'left'
                  }}
                >
                  {getShortLabel(asset)}
                </div>
              ) : null}
            </motion.div>
          );
        })}

        {hoveredNode && hoveredAsset ? (
          <NodeTooltip
            node={hoveredNode}
            asset={hoveredAsset}
            position={nodeLayoutById[hoveredNode.id] ?? hoveredNode.position}
            placement={getTooltipPlacement(nodeLayoutById[hoveredNode.id] ?? hoveredNode.position)}
          />
        ) : null}
      </div>

      <div className="absolute bottom-4 left-4 z-30 inline-flex flex-wrap items-center gap-2 rounded-full border border-[#2d5242] bg-[#081711]/88 px-3 py-1.5 text-[11px]">
        <span className="inline-flex items-center gap-1.5 text-[#c7ddd2]">
          <span className="h-[2px] w-5 bg-[#00D084]" />
          Active
        </span>
        <span className="inline-flex items-center gap-1.5 text-[#c7ddd2]">
          <span className="h-[2px] w-5 bg-[#F5B942]" />
          Stressed
        </span>
        <span className="inline-flex items-center gap-1.5 text-[#c7ddd2]">
          <span className="h-[2px] w-5 bg-[#FF4D4F]" />
          Faulted
        </span>
      </div>
    </section>
  );
}
