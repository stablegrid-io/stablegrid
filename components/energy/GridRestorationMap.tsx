'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';

type MapNodeDef = {
  id: string;
  name: string;
  kwhRequired: number;
  pos: { x: number; y: number };
  connects: string[];
  icon: string;
  reward: string;
};

type MapNodeState = MapNodeDef & {
  active: boolean;
  locked: boolean;
};

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 420;

const MAP_NODES: MapNodeDef[] = [
  {
    id: 'control',
    name: 'Control Center',
    kwhRequired: 0,
    pos: { x: 90, y: 205 },
    connects: ['sub1'],
    icon: '🎛️',
    reward: 'Base operations'
  },
  {
    id: 'sub1',
    name: 'Substation Alpha',
    kwhRequired: 2,
    pos: { x: 220, y: 135 },
    connects: ['tower1'],
    icon: '⚡',
    reward: 'PySpark basics chapter'
  },
  {
    id: 'tower1',
    name: 'Tower T-01',
    kwhRequired: 10,
    pos: { x: 350, y: 95 },
    connects: ['switch'],
    icon: '📡',
    reward: 'JOIN operations'
  },
  {
    id: 'switch',
    name: 'Switchyard',
    kwhRequired: 30,
    pos: { x: 490, y: 150 },
    connects: ['tower2', 'data'],
    icon: '🔀',
    reward: 'Window functions chapter'
  },
  {
    id: 'tower2',
    name: 'Tower T-02',
    kwhRequired: 50,
    pos: { x: 350, y: 280 },
    connects: ['sub2'],
    icon: '📡',
    reward: 'Aggregate operations'
  },
  {
    id: 'data',
    name: 'Data Center',
    kwhRequired: 90,
    pos: { x: 620, y: 115 },
    connects: ['city'],
    icon: '🗄️',
    reward: 'Mission 002: Data Pipeline'
  },
  {
    id: 'sub2',
    name: 'Substation Beta',
    kwhRequired: 150,
    pos: { x: 490, y: 325 },
    connects: ['industrial'],
    icon: '⚡',
    reward: 'Performance tuning'
  },
  {
    id: 'city',
    name: 'City Load',
    kwhRequired: 220,
    pos: { x: 760, y: 155 },
    connects: ['solar'],
    icon: '🏙️',
    reward: 'Advanced SQL practice'
  },
  {
    id: 'industrial',
    name: 'Industrial Load',
    kwhRequired: 280,
    pos: { x: 620, y: 300 },
    connects: ['battery'],
    icon: '🏭',
    reward: 'Optimization strategies'
  },
  {
    id: 'solar',
    name: 'Solar Farm',
    kwhRequired: 340,
    pos: { x: 900, y: 145 },
    connects: ['battery'],
    icon: '☀️',
    reward: 'Mission 003: Ghost Regulator'
  },
  {
    id: 'battery',
    name: 'Battery Storage',
    kwhRequired: 400,
    pos: { x: 900, y: 275 },
    connects: [],
    icon: '🔋',
    reward: 'Grid mastery badge'
  }
];

const MAP_NODE_BY_ID: Record<string, MapNodeDef> = MAP_NODES.reduce(
  (accumulator, node) => {
    accumulator[node.id] = node;
    return accumulator;
  },
  {} as Record<string, MapNodeDef>
);

type RestorationToastProps = {
  node: MapNodeDef | null;
};

const RestorationToast = memo(function RestorationToast({ node }: RestorationToastProps) {
  if (!node) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 animate-[mapToastIn_0.35s_ease] rounded-xl border border-emerald-300/40 bg-emerald-950/85 px-4 py-2.5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <div className="text-xl">{node.icon}</div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-emerald-300">
            Node online
          </p>
          <p className="text-xs text-emerald-100">{node.name}</p>
        </div>
      </div>
    </div>
  );
});

type GridRestorationMapProps = {
  kwh: number;
  ghostActive?: boolean;
};

export const GridRestorationMap = memo(function GridRestorationMap({
  kwh,
  ghostActive = false
}: GridRestorationMapProps) {
  const [tick, setTick] = useState(0);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [restoredNodeId, setRestoredNodeId] = useState<string | null>(null);
  const previousActiveIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let frame = 0;
    const loop = () => {
      setTick((value) => value + 0.015);
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const nodes = useMemo<MapNodeState[]>(() => {
    return MAP_NODES.map((node) => {
      const parent = MAP_NODES.find((candidate) => candidate.connects.includes(node.id));
      const locked = parent ? kwh < parent.kwhRequired : false;
      const active = kwh >= node.kwhRequired;
      return { ...node, active, locked };
    });
  }, [kwh]);

  useEffect(() => {
    const activeIds = new Set(nodes.filter((node) => node.active).map((node) => node.id));
    const previousActive = previousActiveIdsRef.current;
    const newlyRestoredId = Array.from(activeIds).find((id) => !previousActive.has(id));
    previousActiveIdsRef.current = activeIds;

    if (!newlyRestoredId) return;
    if (newlyRestoredId === 'control') return;

    setRestoredNodeId(newlyRestoredId);
    const timeoutId = window.setTimeout(() => setRestoredNodeId(null), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [nodes]);

  const activeCount = nodes.filter((node) => node.active).length;
  const lockedCount = nodes.filter((node) => node.locked).length;
  const nextNode = nodes.find((node) => !node.active && !node.locked) ?? null;
  const hoveredNode = hoveredNodeId ? MAP_NODE_BY_ID[hoveredNodeId] ?? null : null;
  const restoredNode = restoredNodeId ? MAP_NODE_BY_ID[restoredNodeId] ?? null : null;

  return (
    <article className="rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface/90">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)]" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-light-tertiary dark:text-text-dark-tertiary">
            Grid Restoration Map
          </p>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
          Online {activeCount} · Locked {lockedCount}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-[#0b0f14] via-[#0e1319] to-[#090c10] shadow-[0_12px_38px_rgba(0,0,0,0.42)]">
        <RestorationToast node={restoredNode} />

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          {Array.from({ length: 21 }).map((_, index) => (
            <line
              key={`h-${index}`}
              x1={0}
              y1={index * (MAP_HEIGHT / 20)}
              x2={MAP_WIDTH}
              y2={index * (MAP_HEIGHT / 20)}
              stroke="#10b981"
              strokeWidth="0.7"
            />
          ))}
          {Array.from({ length: 48 }).map((_, index) => (
            <line
              key={`v-${index}`}
              x1={index * (MAP_WIDTH / 47)}
              y1={0}
              x2={index * (MAP_WIDTH / 47)}
              y2={MAP_HEIGHT}
              stroke="#10b981"
              strokeWidth="0.7"
            />
          ))}
        </svg>

        <div className="absolute left-3 top-3 z-10 rounded-lg border border-emerald-500/20 bg-dark-surface/90 px-3 py-2 backdrop-blur-sm">
          <p className="text-[11px] font-bold text-emerald-100">Grid Status</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-emerald-900/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500"
                style={{ width: `${(activeCount / MAP_NODES.length) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-extrabold text-emerald-300">
              {Math.round((activeCount / MAP_NODES.length) * 100)}%
            </span>
          </div>
        </div>

        {ghostActive ? (
          <div className="absolute right-3 top-3 z-10 rounded-md border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-300">
            Ghost signature
          </div>
        ) : null}

        <div className="relative aspect-[2.35/1] w-full overflow-hidden">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            {nodes.flatMap((node) =>
              node.connects.map((targetId, index) => {
                const target = MAP_NODE_BY_ID[targetId];
                if (!target) return [];

                const active = Boolean(node.active && kwh >= target.kwhRequired);
                return (
                  <g key={`${node.id}-${targetId}`}>
                    <line
                      x1={node.pos.x}
                      y1={node.pos.y}
                      x2={target.pos.x}
                      y2={target.pos.y}
                      stroke={active ? 'rgba(16,185,129,0.38)' : 'rgba(64,64,64,0.7)'}
                      strokeWidth={active ? 3 : 1.8}
                      strokeLinecap="round"
                    />
                    {active ? (
                      <line
                        x1={node.pos.x}
                        y1={node.pos.y}
                        x2={target.pos.x}
                        y2={target.pos.y}
                        stroke="rgba(52,211,153,0.85)"
                        strokeWidth={2.8}
                        strokeLinecap="round"
                        strokeDasharray="10 80"
                        strokeDashoffset={-((tick * 140) % 140) - index * 18}
                      />
                    ) : null}
                  </g>
                );
              })
            )}
          </svg>

          {nodes.flatMap((node) =>
            node.connects.map((targetId, index) => {
              const target = MAP_NODE_BY_ID[targetId];
              if (!target) return [];
              const active = Boolean(node.active && kwh >= target.kwhRequired);
              if (!active) return [];

              const phase = (tick * 0.45 + index * 0.23) % 1;
              const x = node.pos.x + (target.pos.x - node.pos.x) * phase;
              const y = node.pos.y + (target.pos.y - node.pos.y) * phase;
              return (
                <span
                  key={`particle-${node.id}-${targetId}-${index}`}
                  className="pointer-events-none absolute z-[5] h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.95)]"
                  style={{
                    left: `${(x / MAP_WIDTH) * 100}%`,
                    top: `${(y / MAP_HEIGHT) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              );
            })
          )}

          {nodes.map((node) => {
            const isActive = node.active;
            const isLocked = node.locked;
            const isNext = !isActive && !isLocked;
            const isHovered = hoveredNodeId === node.id;

            return (
              <button
                key={node.id}
                type="button"
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="absolute z-10 h-[54px] w-[54px] -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-200"
                style={{
                  left: `${(node.pos.x / MAP_WIDTH) * 100}%`,
                  top: `${(node.pos.y / MAP_HEIGHT) * 100}%`,
                  borderColor: isActive ? '#34d399' : isNext ? '#f59e0b' : '#2a2a2a',
                  background: isActive ? 'rgba(6, 95, 70, 0.86)' : 'rgba(23, 23, 23, 0.94)',
                  boxShadow: isActive
                    ? '0 0 0 6px rgba(16,185,129,0.16), 0 10px 24px rgba(0,0,0,0.35)'
                    : isHovered && isNext
                      ? '0 0 0 6px rgba(245,158,11,0.18), 0 8px 20px rgba(0,0,0,0.4)'
                      : '0 6px 14px rgba(0,0,0,0.45)',
                  transform: `translate(-50%, -50%) scale(${isHovered ? 1.06 : 1})`,
                  cursor: 'default'
                }}
                aria-label={`${node.name} ${isActive ? 'online' : 'locked'}`}
              >
                <span className={`text-[24px] ${isActive ? '' : 'opacity-65 grayscale'}`}>{node.icon}</span>
                {isActive ? (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                ) : null}
                {isNext ? (
                  <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border border-[#3b2407] bg-amber-400/90 text-[9px] font-bold text-[#271600]">
                    ⚡
                  </span>
                ) : null}
              </button>
            );
          })}

          {hoveredNode ? (
            <div
              className="pointer-events-none absolute z-20 max-w-[220px] rounded-lg border border-emerald-500/30 bg-dark-surface/95 px-3 py-2 shadow-xl backdrop-blur-sm"
              style={{
                left: `${(hoveredNode.pos.x / MAP_WIDTH) * 100}%`,
                top: `${(hoveredNode.pos.y / MAP_HEIGHT) * 100}%`,
                transform: 'translate(28px, -18px)'
              }}
            >
              <p className="text-xs font-bold text-emerald-100">{hoveredNode.name}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-300/85">
                Unlocks: {hoveredNode.reward}
              </p>
              <p className="mt-1 text-[10px] font-semibold text-emerald-200/85">
                Requires {hoveredNode.kwhRequired} kWh
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="rounded-lg border border-light-border bg-light-bg px-3 py-2 dark:border-dark-border dark:bg-dark-bg">
          {nextNode ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
                Next restoration
              </p>
              <p className="mt-1 text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                {nextNode.icon} {nextNode.name}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-[width] duration-500"
                  style={{ width: `${Math.min((kwh / nextNode.kwhRequired) * 100, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-text-light-secondary dark:text-text-dark-secondary">
                {Math.max(0, nextNode.kwhRequired - kwh).toFixed(2)} kWh to unlock · {nextNode.reward}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                All nodes restored
              </p>
              <p className="mt-1 text-[11px] text-text-light-secondary dark:text-text-dark-secondary">
                Grid synchronization complete.
              </p>
            </>
          )}
        </div>

        <div className="rounded-lg border border-emerald-400/25 bg-emerald-50 px-3 py-2 text-right dark:bg-emerald-900/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">
            Energy available
          </p>
          <p className="font-mono text-lg font-black text-emerald-700 dark:text-emerald-200">
            {kwh.toFixed(2)} kWh
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes mapToastIn {
          from {
            opacity: 0;
            transform: translate(-50%, -10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </article>
  );
});
