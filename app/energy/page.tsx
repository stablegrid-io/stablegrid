'use client';

import Link from 'next/link';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PulseCompanionOverlay } from '@/components/mascot/PulseCompanionOverlay';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { usePulseMascotStore } from '@/lib/stores/usePulseMascotStore';
import {
  formatKwh,
  getEnergyTier,
  getNextEnergyTier,
  getTierProgressPct,
  kwhToUnits,
  unitsToKwh
} from '@/lib/energy';
import type { PulseAction } from '@/types/mascot';

const PULSE_MODEL_URL = process.env.NEXT_PUBLIC_PULSE_MODEL_URL;

type GridNodeDef = {
  id: 'kettle' | 'workspace' | 'office' | 'server' | 'apartment' | 'grid';
  label: string;
  icon: string;
  kwhRequired: number;
  copy: string;
};

const GRID_NODES: GridNodeDef[] = [
  {
    id: 'kettle',
    label: 'Kettle',
    icon: '☕',
    kwhRequired: 0,
    copy: 'Black start begins with a small, obedient load.'
  },
  {
    id: 'workspace',
    label: 'Workspace',
    icon: '🖥️',
    kwhRequired: 2,
    copy: 'Operators restore stability from dashboards and telemetry.'
  },
  {
    id: 'office',
    label: 'Office Lighting',
    icon: '💡',
    kwhRequired: 10,
    copy: 'Lighting confirms continuity across your operating floor.'
  },
  {
    id: 'server',
    label: 'Server Rack',
    icon: '🗄️',
    kwhRequired: 50,
    copy: 'Compute comes online and the data plane holds.'
  },
  {
    id: 'apartment',
    label: 'Apartment',
    icon: '🏠',
    kwhRequired: 150,
    copy: 'Residential load returns with stable downstream delivery.'
  },
  {
    id: 'grid',
    label: 'Mini-Grid',
    icon: '⚡',
    kwhRequired: 400,
    copy: 'Neighborhood-level capacity restored.'
  }
];

const GRID_POSITIONS: Record<GridNodeDef['id'], [number, number]> = {
  kettle: [50, 80],
  workspace: [130, 40],
  office: [130, 120],
  server: [220, 40],
  apartment: [220, 120],
  grid: [310, 80]
};

const GRID_EDGES: Array<[GridNodeDef['id'], GridNodeDef['id']]> = [
  ['kettle', 'workspace'],
  ['kettle', 'office'],
  ['workspace', 'server'],
  ['office', 'server'],
  ['server', 'grid'],
  ['office', 'apartment'],
  ['apartment', 'grid']
];

function buildWavePath(t: number, width = 280, height = 40, anomaly = false) {
  const points: string[] = [];
  const steps = 80;

  for (let i = 0; i <= steps; i += 1) {
    const x = (i / steps) * width;
    const phase = (i / steps) * Math.PI * 6 + t;
    let y = Math.sin(phase) * 10;
    y += Math.sin(phase * 2.1 + 0.3) * 2.5;
    y += Math.sin(phase * 0.5 + t * 0.3) * 1.5;

    if (anomaly && i > 40 && i < 55) {
      y += Math.sin(i * 2.3 + t * 4) * 8 * Math.sin(((i - 40) / 15) * Math.PI);
    }

    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${(height / 2 - y).toFixed(1)}`);
  }

  return points.join(' ');
}

const RollingKwh = memo(function RollingKwh({
  value,
  color,
  decimals = 2
}: {
  value: number;
  color: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(value);
  const previousRef = useRef(value);

  useEffect(() => {
    const previous = previousRef.current;
    if (Math.abs(value - previous) < 0.001) return;
    previousRef.current = value;

    const start = performance.now();
    const duration = 800;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(previous + (value - previous) * ease);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span style={{ color, fontVariantNumeric: 'tabular-nums' }}>
      {display.toFixed(decimals)}
    </span>
  );
});

const FrequencyMonitor = memo(function FrequencyMonitor({ anomaly }: { anomaly: boolean }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let frame = 0;
    const loop = () => {
      setTick((value) => value + 0.04);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const path = useMemo(() => buildWavePath(tick, 280, 40, anomaly), [anomaly, tick]);
  const frequency = useMemo(
    () =>
      (
        50 +
        Math.sin(tick * 0.3) * 0.03 +
        (anomaly ? Math.sin(tick * 2.1) * 0.08 : 0)
      ).toFixed(3),
    [anomaly, tick]
  );

  return (
    <div className="flex items-center gap-3">
      <svg width={280} height={40} className="overflow-visible">
        <line
          x1={0}
          y1={20}
          x2={280}
          y2={20}
          className="stroke-[#cfd8e6]/40 dark:stroke-[#1e3a4a]"
          strokeWidth={1}
          strokeDasharray="3 6"
        />
        <path
          d={path}
          fill="none"
          stroke={anomaly ? '#f87171' : '#64a0dc'}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
        {anomaly ? (
          <rect x={140} y={0} width={52} height={40} fill="rgba(248,113,113,0.06)" rx={2} />
        ) : null}
      </svg>
      <div className="shrink-0 text-right">
        <div
          className={`font-mono text-xs font-extrabold ${
            anomaly ? 'animate-[ghostFlicker_1.2s_ease-in-out_infinite] text-rose-400' : 'text-sky-500'
          }`}
        >
          {frequency} Hz
        </div>
        <div className="mt-0.5 text-[9px] font-bold tracking-[0.12em] text-text-light-tertiary dark:text-[#2d4d66]">
          GRID FREQ
        </div>
      </div>
    </div>
  );
});

const FlowLine = memo(function FlowLine({
  active,
  x1,
  y1,
  x2,
  y2,
  speed
}: {
  active: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  speed: number;
}) {
  const length = Math.hypot(x2 - x1, y2 - y1);

  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={active ? '#64a0dc' : '#25374a'}
        strokeWidth={active ? 2.4 : 1.4}
        opacity={active ? 0.55 : 0.35}
      />
      {active ? (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          className="energy-flow-line"
          style={{
            strokeDasharray: `10 ${length * 0.45}`,
            animationDuration: `${speed}s`
          }}
        />
      ) : null}
    </g>
  );
});

const NodeCard = memo(function NodeCard({
  node,
  kwh
}: {
  node: GridNodeDef & { unlocked: boolean };
  kwh: number;
}) {
  const [flash, setFlash] = useState(false);
  const previousUnlockedRef = useRef(node.unlocked);
  const progress = node.kwhRequired === 0 ? 100 : Math.min((kwh / node.kwhRequired) * 100, 100);
  const nearUnlock = !node.unlocked && progress > 70;

  useEffect(() => {
    if (node.unlocked && !previousUnlockedRef.current) {
      setFlash(true);
      const timeout = window.setTimeout(() => setFlash(false), 1200);
      previousUnlockedRef.current = node.unlocked;
      return () => window.clearTimeout(timeout);
    }
    previousUnlockedRef.current = node.unlocked;
    return undefined;
  }, [node.unlocked]);

  return (
    <article
      className={`relative overflow-hidden rounded-xl border p-3 transition-all duration-300 ${
        node.unlocked
          ? 'border-sky-400/40 bg-sky-100/60 dark:border-sky-500/30 dark:bg-sky-500/10'
          : nearUnlock
            ? 'border-amber-400/35 bg-amber-50/50 dark:border-amber-400/30 dark:bg-amber-400/10'
            : 'border-light-border bg-white/70 dark:border-dark-border dark:bg-white/5'
      }`}
    >
      {flash ? (
        <span className="pointer-events-none absolute inset-0 animate-[energizeFlash_1.2s_ease-out] bg-amber-300/25 dark:bg-amber-300/20" />
      ) : null}

      {node.unlocked ? <span className="node-pulse absolute right-1.5 top-1.5" /> : null}

      <div className="mb-1.5 flex items-center gap-2">
        <span className={`${node.unlocked ? '' : 'opacity-40 grayscale'} text-base`}>{node.icon}</span>
        <span className="text-xs font-semibold text-text-light-primary dark:text-[#d8eaf8]">{node.label}</span>
      </div>

      {node.unlocked ? (
        <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.1em] text-sky-500">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          ONLINE
        </p>
      ) : (
        <div>
          {nearUnlock ? (
            <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-sky-500 via-amber-400 to-sky-500 transition-[width] duration-700"
                style={{ width: `${progress}%` }}
              >
                <span className="energy-shimmer absolute inset-0" />
              </div>
            </div>
          ) : null}
          <p className="text-[10px] font-medium text-text-light-tertiary dark:text-[#2d4d66]">
            {nearUnlock
              ? `${(node.kwhRequired - kwh).toFixed(2)} kWh to unlock`
              : `Locked · ${node.kwhRequired} kWh`}
          </p>
        </div>
      )}
    </article>
  );
});

const GridTopology = memo(function GridTopology({
  nodes,
  kwh
}: {
  nodes: Array<GridNodeDef & { unlocked: boolean }>;
  kwh: number;
}) {
  const nodeById = useMemo(
    () =>
      nodes.reduce<Record<string, GridNodeDef & { unlocked: boolean }>>((acc, node) => {
        acc[node.id] = node;
        return acc;
      }, {}),
    [nodes]
  );

  return (
    <svg viewBox="0 0 340 160" className="mx-auto h-56 w-full max-w-[480px]">
      {GRID_EDGES.map(([from, to], index) => {
        const [x1, y1] = GRID_POSITIONS[from];
        const [x2, y2] = GRID_POSITIONS[to];
        const active = nodeById[from]?.unlocked && nodeById[to]?.unlocked;

        return (
          <FlowLine
            key={`${from}-${to}`}
            active={Boolean(active)}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            speed={0.9 + index * 0.2}
          />
        );
      })}

      {nodes.map((node) => {
        const [cx, cy] = GRID_POSITIONS[node.id];
        const progress = node.kwhRequired === 0 ? 1 : Math.min(kwh / node.kwhRequired, 1);

        return (
          <g key={node.id}>
            {node.unlocked ? (
              <circle cx={cx} cy={cy} r={18} className="fill-sky-500/15 stroke-sky-500/70" strokeWidth={1.25}>
                <animate attributeName="r" values="18;30;18" dur="2.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.32;1" dur="2.6s" repeatCount="indefinite" />
              </circle>
            ) : null}

            <circle
              cx={cx}
              cy={cy}
              r={13}
              fill={node.unlocked ? '#142030' : '#0a1520'}
              stroke={node.unlocked ? '#64a0dc' : '#1e3040'}
              strokeWidth={node.unlocked ? 2.2 : 1.5}
            />
            <text
              x={cx}
              y={cy + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={node.unlocked ? 13 : 11}
              fill={node.unlocked ? '#d8eaf8' : '#2d4d66'}
            >
              {node.icon}
            </text>

            {!node.unlocked && progress > 0.1 ? (
              <circle
                cx={cx}
                cy={cy}
                r={16}
                fill="none"
                stroke="#f0a032"
                strokeWidth={3}
                strokeDasharray={2 * Math.PI * 16}
                strokeDashoffset={(2 * Math.PI * 16) * (1 - progress)}
                strokeLinecap="round"
                transform={`rotate(-90,${cx},${cy})`}
                opacity={0.55}
              />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
});

export default function EnergyLabPage() {
  const totalUnits = useProgressStore((state) => state.xp);
  const dailyXP = useProgressStore((state) => state.dailyXP);
  const addXP = useProgressStore((state) => state.addXP);
  const pulseMood = usePulseMascotStore((state) => state.mood);
  const pulseMotion = usePulseMascotStore((state) => state.motion);
  const pulseBaseAction = usePulseMascotStore((state) => state.action);

  const [injecting, setInjecting] = useState(false);
  const [ghostActive, setGhostActive] = useState(false);
  const [companionAction, setCompanionAction] = useState<PulseAction>(pulseBaseAction);
  const companionTimeoutsRef = useRef<number[]>([]);

  const lifetimeKwh = unitsToKwh(totalUnits);
  const todayUnits = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return dailyXP[today] ?? 0;
  }, [dailyXP]);

  const currentTier = getEnergyTier(lifetimeKwh);
  const nextTier = getNextEnergyTier(lifetimeKwh);
  const tierProgress = getTierProgressPct(lifetimeKwh);

  const nodes = useMemo(
    () =>
      GRID_NODES.map((node) => ({
        ...node,
        unlocked: lifetimeKwh >= node.kwhRequired
      })),
    [lifetimeKwh]
  );

  const clearCompanionTimeouts = useCallback(() => {
    companionTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    companionTimeoutsRef.current = [];
  }, []);

  const queueCompanionTransition = useCallback(
    (callback: () => void, delayMs: number) => {
      const timeoutId = window.setTimeout(callback, delayMs);
      companionTimeoutsRef.current.push(timeoutId);
    },
    []
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setGhostActive(true);
      window.setTimeout(() => setGhostActive(false), 2200);
    }, 18000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!injecting) {
      setCompanionAction(pulseBaseAction);
    }
  }, [injecting, pulseBaseAction]);

  useEffect(() => () => clearCompanionTimeouts(), [clearCompanionTimeouts]);

  const injectEnergy = useCallback(() => {
    if (injecting) return;
    setInjecting(true);
    clearCompanionTimeouts();
    setCompanionAction('wave');

    const gainKwh = Math.round((0.02 + Math.random() * 0.08) * 100) / 100;
    const gainUnits = kwhToUnits(gainKwh);
    const projectedKwh = lifetimeKwh + gainKwh;
    const unlockedNode = GRID_NODES.find(
      (node) => lifetimeKwh < node.kwhRequired && projectedKwh >= node.kwhRequired
    );

    addXP(gainUnits, {
      source: 'manual',
      label: unlockedNode
        ? `Node unlocked: ${unlockedNode.label}`
        : 'Flashcard verified — Frequency hold improved'
    });

    if (unlockedNode) {
      queueCompanionTransition(() => {
        setCompanionAction('celebrate');
      }, 260);
      queueCompanionTransition(() => {
        setCompanionAction('idle');
      }, 2200);
    } else {
      queueCompanionTransition(() => {
        setCompanionAction('idle');
      }, 900);
    }

    window.setTimeout(() => setInjecting(false), 650);
  }, [
    addXP,
    clearCompanionTimeouts,
    injecting,
    lifetimeKwh,
    queueCompanionTransition
  ]);

  return (
    <main className="min-h-screen bg-light-bg px-4 pb-12 pt-8 dark:bg-[#060b12] sm:px-6">
      <style jsx global>{`
        @keyframes tierFlow {
          from {
            background-position: 200% center;
          }
          to {
            background-position: -200% center;
          }
        }
        @keyframes energyDashFlow {
          from {
            stroke-dashoffset: 340;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes eventSlideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes kwhPop {
          0% {
            opacity: 0;
            transform: scale(0.85);
          }
          70% {
            transform: scale(1.08);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes ghostFlicker {
          0%,
          100% {
            opacity: 1;
          }
          45%,
          55% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.62;
          }
        }
        @keyframes nodePulse {
          0% {
            opacity: 0.8;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(3.4);
          }
        }
        @keyframes energizeFlash {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        .energy-flow-line {
          stroke: #64a0dc;
          stroke-width: 3;
          stroke-linecap: round;
          animation-name: energyDashFlow;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: stroke-dashoffset;
        }
        .energy-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
          animation: tierFlow 1.1s linear infinite;
          will-change: transform;
        }
        .node-pulse {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #64a0dc;
          box-shadow: 0 0 12px rgba(100, 160, 220, 0.8);
          will-change: transform, opacity;
        }
        .node-pulse::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: #64a0dc;
          animation: nodePulse 2s ease-out infinite;
          will-change: transform, opacity;
        }
      `}</style>

      <PulseCompanionOverlay
        mood={pulseMood}
        motion={pulseMotion}
        action={companionAction}
        size={170}
        modelUrl={PULSE_MODEL_URL}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <section className="sticky top-16 z-20 rounded-xl border border-light-border bg-white/90 px-4 py-2.5 backdrop-blur dark:border-dark-border dark:bg-[#09111e]/90">
          <div className="flex flex-wrap items-center gap-3">
            <p className="mr-auto text-[11px] font-bold uppercase tracking-[0.18em] text-sky-500">
              Energy Lab · Project Rebuild
            </p>
            <FrequencyMonitor anomaly={ghostActive} />
            <Link href="/" className="btn btn-secondary">
              <ArrowLeft className="h-4 w-4" />
              Back Home
            </Link>
          </div>
        </section>

        <header className="mt-2">
          <p className="data-mono text-xs uppercase tracking-[0.35em] text-brand-500/80">Energy Lab</p>
          <h1 className="mt-2 text-4xl font-semibold text-text-light-primary dark:text-[#d8eaf8] md:text-5xl font-display">
            Your Grid
          </h1>
          <p className="mt-1 text-sm text-text-light-secondary dark:text-[#3a6080] md:text-base">
            Generated energy from flashcards, missions, and chapter completions.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-[#0e1826cc]">
            <div className="mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-text-light-tertiary dark:text-[#2d4d66]">
                    ENERGY BALANCE
                  </p>
                  <div className="mt-1 font-mono text-4xl font-black leading-none text-text-light-primary dark:text-[#d8eaf8]">
                    <RollingKwh value={lifetimeKwh} color="currentColor" />{' '}
                    <span className="text-lg font-semibold text-text-light-tertiary dark:text-[#3a6080]">kWh</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold tracking-[0.12em] text-text-light-tertiary dark:text-[#2d4d66]">
                    TODAY
                  </p>
                  <div className="mt-1 font-mono text-sm font-bold text-sky-500">
                    +<RollingKwh value={unitsToKwh(todayUnits)} color="#0ea5e9" /> kWh
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-light-border bg-light-bg p-4 dark:border-dark-border dark:bg-[#0b1522]">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-text-light-tertiary dark:text-[#2d4d66]">
                  Tier {currentTier.id} · {currentTier.title}
                </span>
                <span className="font-mono text-[11px] font-bold text-sky-500">{Math.round(tierProgress)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                <div
                  className="relative h-full transition-[width] duration-700"
                  style={{
                    width: `${tierProgress}%`,
                    willChange: 'width',
                    background:
                      'linear-gradient(90deg,#1e6ebe,#64a0dc,#f0a032,#64a0dc,#1e6ebe)',
                    backgroundSize: '200% 100%',
                    animation: 'tierFlow 2s linear infinite'
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-text-light-secondary dark:text-[#3a6080]">
                {nextTier
                  ? `${formatKwh(nextTier.minKwh - lifetimeKwh, 2)} to unlock ${nextTier.title}.`
                  : 'Top tier unlocked.'}
              </p>
            </div>

            <button
              type="button"
              onClick={injectEnergy}
              disabled={injecting}
              className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
                injecting
                  ? 'bg-sky-500/50'
                  : 'bg-gradient-to-br from-sky-600 to-sky-400 shadow-[0_8px_26px_rgba(14,165,233,0.28)] hover:brightness-105'
              }`}
            >
              {injecting ? 'Injecting verified kWh…' : 'Inject Energy (Simulate Learning)'}
            </button>
          </article>

          <article className="rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-[#0e1826cc]">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-light-tertiary dark:text-[#2d4d66]">
                Grid Topology
              </p>
              {ghostActive ? (
                <span className="ml-auto animate-[ghostFlicker_1.2s_ease-in-out_infinite] text-[10px] font-bold uppercase tracking-[0.12em] text-rose-400">
                  Ghost signature
                </span>
              ) : null}
            </div>

            <div className="mb-3">
              <GridTopology nodes={nodes} kwh={lifetimeKwh} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {nodes.map((node) => (
                <NodeCard key={node.id} node={node} kwh={lifetimeKwh} />
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-light-border bg-light-surface px-6 py-5 dark:border-dark-border dark:bg-[#070e1acc]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-light-tertiary dark:text-[#2d4d66]">
            Classified · Project Rebuild Log
          </p>
          <p className="mt-2 max-w-3xl text-sm italic leading-relaxed text-text-light-secondary dark:text-[#3a6080]">
            &quot;Spain did not fail like a storm. It failed like a corrupted dataset.
            Signals arrived late, events inverted, and frequency looked perfect right
            before collapse. Only verified output holds. Only clean energy restores.&quot;
          </p>
          <p className="mt-2 text-xs text-text-light-tertiary dark:text-[#2d4d66]">
            — ENTSO-E Internal Brief, 16/02/2026
          </p>
        </section>
      </div>
    </main>
  );
}
