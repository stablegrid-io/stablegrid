'use client';

import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import {
  DEFAULT_DEPLOYED_NODE_IDS,
  INFRASTRUCTURE_BY_ID,
  INFRASTRUCTURE_NODES,
  formatKwh,
  getAvailableBudgetUnits,
  getGridStabilityPct,
  getSpentInfrastructureUnits,
  getStabilityTier,
  unitsToKwh,
  type InfrastructureNode
} from '@/lib/energy';

type DeploymentToast = {
  nodeId: string;
  previousStability: number;
  nextStability: number;
};

type MapNodeState = InfrastructureNode & {
  active: boolean;
  ready: boolean;
  locked: boolean;
  affordable: boolean;
};

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 420;

const buildFrequencyPath = (time: number, width = 220, height = 52) => {
  const points: string[] = [];
  const steps = 64;

  for (let index = 0; index <= steps; index += 1) {
    const x = (index / steps) * width;
    const phase = (index / steps) * Math.PI * 8 + time;
    const wobble = Math.sin(phase) * 9 + Math.sin(phase * 0.46 + time * 0.4) * 2.2;
    const y = height / 2 - wobble;
    points.push(`${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  return points.join(' ');
};

const buildForecastPath = (offset = 0, width = 220, height = 52) => {
  const points: string[] = [];
  const steps = 32;

  for (let index = 0; index <= steps; index += 1) {
    const x = (index / steps) * width;
    const normalized = index / steps;
    const base = Math.max(0, Math.sin((normalized + offset) * Math.PI));
    const variance = Math.sin((normalized + offset) * Math.PI * 3) * 0.08;
    const y = height - (base + variance) * (height - 6) - 3;
    points.push(`${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  return points.join(' ');
};

const IndicatorTile = memo(function IndicatorTile({
  title,
  value,
  detail,
  active,
  children
}: {
  title: string;
  value: string;
  detail: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{
        borderColor: active ? 'rgba(100,160,220,0.36)' : 'rgba(58,96,128,0.35)',
        background: active ? 'rgba(12,24,38,0.88)' : 'rgba(8,16,28,0.76)'
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8fb6d8]">{title}</p>
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: active ? '#4ade80' : '#3a6080' }}
        >
          {active ? 'online' : 'locked'}
        </span>
      </div>
      <div className="text-sm font-semibold text-[#d8eaf8]">{value}</div>
      <p className="mt-0.5 text-[11px] text-[#6e90ae]">{detail}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
});

const DeploymentToastBanner = memo(function DeploymentToastBanner({
  toast
}: {
  toast: DeploymentToast | null;
}) {
  if (!toast) {
    return null;
  }

  const node = INFRASTRUCTURE_BY_ID[toast.nodeId];
  if (!node) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-xl border border-[#64a0dc]/45 bg-[#0c1c2e]/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9dc2e1]">
        Infrastructure deployed
      </p>
      <p className="mt-1 text-sm font-semibold text-[#d8eaf8]">{node.name}</p>
      <p className="mt-1 text-[11px] text-[#86a9c8]">
        Grid stability: {toast.previousStability}% -&gt; {toast.nextStability}%
      </p>
    </div>
  );
});

export const GridStabilityMap = memo(function GridStabilityMap() {
  const totalEarnedUnits = useProgressStore((state) => state.xp);
  const storeNodeIds = useProgressStore((state) => state.deployedNodeIds);
  const lastDeployedNodeId = useProgressStore((state) => state.lastDeployedNodeId);
  const deployInfrastructure = useProgressStore((state) => state.deployInfrastructure);

  const deployedNodeIds = storeNodeIds.length > 0 ? storeNodeIds : DEFAULT_DEPLOYED_NODE_IDS;
  const [tick, setTick] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [toast, setToast] = useState<DeploymentToast | null>(null);
  const previousStabilityRef = useRef(getGridStabilityPct(deployedNodeIds));

  useEffect(() => {
    let frame = 0;
    const loop = () => {
      setTick((value) => value + 0.016);
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const totalEarnedKwh = unitsToKwh(totalEarnedUnits);
  const spentUnits = getSpentInfrastructureUnits(deployedNodeIds);
  const spentKwh = unitsToKwh(spentUnits);
  const availableUnits = getAvailableBudgetUnits(totalEarnedUnits, deployedNodeIds);
  const availableKwh = unitsToKwh(availableUnits);

  const nodes = useMemo<MapNodeState[]>(() => {
    return INFRASTRUCTURE_NODES.map((node, index) => {
      const active = deployedNodeIds.includes(node.id);
      const affordable = availableKwh >= node.kwhRequired;
      const previousNode = INFRASTRUCTURE_NODES[index - 1];
      const prerequisiteMet = index === 0 || deployedNodeIds.includes(previousNode.id);
      const ready = !active && prerequisiteMet && affordable;
      const locked = !active && !ready;
      return {
        ...node,
        active,
        ready,
        locked,
        affordable
      };
    });
  }, [availableKwh, deployedNodeIds]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((node) => node.id === selectedNodeId) ?? null;
  }, [nodes, selectedNodeId]);

  useEffect(() => {
    if (selectedNodeId && nodes.some((node) => node.id === selectedNodeId)) {
      return;
    }

    const nextCandidate = nodes.find((node) => node.ready) ?? nodes.find((node) => !node.active) ?? nodes[0];
    setSelectedNodeId(nextCandidate?.id ?? null);
  }, [nodes, selectedNodeId]);

  const stabilityPct = getGridStabilityPct(deployedNodeIds);
  const stabilityTier = getStabilityTier(stabilityPct);

  useEffect(() => {
    const previousStability = previousStabilityRef.current;
    if (!lastDeployedNodeId) {
      previousStabilityRef.current = stabilityPct;
      return;
    }

    if (stabilityPct <= previousStability) {
      previousStabilityRef.current = stabilityPct;
      return;
    }

    setToast({
      nodeId: lastDeployedNodeId,
      previousStability,
      nextStability: stabilityPct
    });
    previousStabilityRef.current = stabilityPct;

    const timeoutId = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [lastDeployedNodeId, stabilityPct]);

  const activeCount = nodes.filter((node) => node.active).length;
  const nextNode = nodes.find((node) => !node.active) ?? null;
  const batteryActive = deployedNodeIds.includes('battery-storage');
  const frequencyActive = deployedNodeIds.includes('frequency-controller');
  const solarActive = deployedNodeIds.includes('solar-forecasting-array');
  const demandActive = deployedNodeIds.includes('demand-response-system');

  const batteryChargePct = batteryActive
    ? Math.round(55 + Math.sin(tick * 0.45) * 32)
    : 0;
  const batteryCharging = Math.sin(tick * 0.35) > 0;
  const frequencyValue = frequencyActive
    ? 50 + Math.sin(tick * 2.2) * 0.04
    : 50;

  const handleDeploy = () => {
    if (!selectedNode || !selectedNode.ready) {
      return;
    }

    deployInfrastructure(selectedNode.id);
  };

  return (
    <article
      className="rounded-2xl border p-5"
      style={{
        borderColor: 'rgba(58,96,128,0.45)',
        background: 'linear-gradient(180deg, rgba(9,17,30,0.96), rgba(7,13,24,0.98))'
      }}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#64a0dc]">
            Infrastructure Command Map
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[#d8eaf8]">Deploy assets to stabilize the Iberian grid</h2>
          <p className="mt-1 text-xs text-[#6e90ae]">
            Stability = 100% - 40% variability + deployed infrastructure benefits
          </p>
        </div>
        <div className="rounded-lg border border-[#64a0dc]/35 bg-[#0f1e32]/80 px-3 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8fb6d8]">Grid stability</p>
          <p className="text-xl font-black text-[#d8eaf8]">{stabilityPct}%</p>
          <p className="text-[11px] font-semibold" style={{ color: stabilityTier.color }}>
            {stabilityTier.label}
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-[#3a6080]/35 bg-[radial-gradient(circle_at_24%_16%,rgba(100,160,220,0.14),transparent_42%),linear-gradient(180deg,#0a1525,#09111e)] shadow-[0_12px_34px_rgba(0,0,0,0.45)]">
        <DeploymentToastBanner toast={toast} />

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          {Array.from({ length: 24 }).map((_, index) => (
            <line
              key={`h-${index}`}
              x1={0}
              y1={index * (MAP_HEIGHT / 23)}
              x2={MAP_WIDTH}
              y2={index * (MAP_HEIGHT / 23)}
              stroke="#64a0dc"
              strokeWidth="0.7"
            />
          ))}
          {Array.from({ length: 40 }).map((_, index) => (
            <line
              key={`v-${index}`}
              x1={index * (MAP_WIDTH / 39)}
              y1={0}
              x2={index * (MAP_WIDTH / 39)}
              y2={MAP_HEIGHT}
              stroke="#64a0dc"
              strokeWidth="0.7"
            />
          ))}
        </svg>

        <div className="absolute left-3 top-3 z-10 rounded-lg border border-[#64a0dc]/30 bg-[#0b1a2c]/88 px-3 py-2 backdrop-blur-sm">
          <p className="text-[11px] font-bold text-[#c7deef]">Infrastructure status</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[#102840]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#64a0dc] to-[#4ade80]"
                style={{ width: `${(activeCount / nodes.length) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-[#9cc0db]">
              {activeCount}/{nodes.length}
            </span>
          </div>
        </div>

        <div className="relative aspect-[2.35/1] w-full overflow-hidden">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            {nodes.flatMap((node) =>
              node.connects.map((targetId, index) => {
                const target = INFRASTRUCTURE_BY_ID[targetId];
                if (!target) return [];

                const active = node.active && deployedNodeIds.includes(targetId);
                return (
                  <g key={`${node.id}-${targetId}`}>
                    <line
                      x1={node.position.x}
                      y1={node.position.y}
                      x2={target.position.x}
                      y2={target.position.y}
                      stroke={active ? 'rgba(100,160,220,0.45)' : 'rgba(58,96,128,0.42)'}
                      strokeWidth={active ? 3 : 1.8}
                      strokeLinecap="round"
                    />
                    {active ? (
                      <line
                        x1={node.position.x}
                        y1={node.position.y}
                        x2={target.position.x}
                        y2={target.position.y}
                        stroke="rgba(100,160,220,0.92)"
                        strokeWidth={2.6}
                        strokeLinecap="round"
                        strokeDasharray="12 64"
                        strokeDashoffset={-((tick * 130) % 130) - index * 9}
                      />
                    ) : null}
                  </g>
                );
              })
            )}
          </svg>

          {nodes.flatMap((node) =>
            node.connects.map((targetId, index) => {
              const target = INFRASTRUCTURE_BY_ID[targetId];
              if (!target) return [];
              const active = node.active && deployedNodeIds.includes(targetId);
              if (!active) return [];

              const phase = (tick * 0.52 + index * 0.21) % 1;
              const x = node.position.x + (target.position.x - node.position.x) * phase;
              const y = node.position.y + (target.position.y - node.position.y) * phase;
              const isBatteryEdge =
                node.id === 'battery-storage' || targetId === 'battery-storage';

              let color = '#64a0dc';
              if (isBatteryEdge) {
                color = batteryCharging ? '#4ade80' : '#f0a032';
              }

              return (
                <span
                  key={`particle-${node.id}-${targetId}-${index}`}
                  className="pointer-events-none absolute z-[5] h-1.5 w-1.5 rounded-full"
                  style={{
                    left: `${(x / MAP_WIDTH) * 100}%`,
                    top: `${(y / MAP_HEIGHT) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}`
                  }}
                />
              );
            })
          )}

          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedNodeId(node.id)}
                className="absolute z-10 h-[56px] w-[56px] -translate-x-1/2 -translate-y-1/2 rounded-full border text-[22px] font-bold transition-all duration-200"
                style={{
                  left: `${(node.position.x / MAP_WIDTH) * 100}%`,
                  top: `${(node.position.y / MAP_HEIGHT) * 100}%`,
                  borderColor: node.active
                    ? '#64a0dc'
                    : node.ready
                      ? '#f0a032'
                      : '#3a6080',
                  color: node.active ? '#d8eaf8' : node.ready ? '#f0a032' : '#6e90ae',
                  background: node.active
                    ? 'rgba(17,47,77,0.92)'
                    : 'rgba(9,17,30,0.94)',
                  boxShadow: node.active
                    ? '0 0 0 6px rgba(100,160,220,0.20), 0 10px 22px rgba(0,0,0,0.4)'
                    : node.ready
                      ? '0 0 0 6px rgba(240,160,50,0.18), 0 8px 18px rgba(0,0,0,0.45)'
                      : '0 8px 18px rgba(0,0,0,0.42)',
                  transform: `translate(-50%, -50%) scale(${isSelected ? 1.08 : 1})`
                }}
                aria-label={node.name}
              >
                {node.icon}
                {node.active ? (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#4ade80] shadow-[0_0_8px_rgba(74,222,128,0.95)]" />
                ) : null}
                {node.ready ? (
                  <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border border-[#5b3508] bg-[#f0a032] text-[9px] font-bold text-[#2f1a04]">
                    !
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_280px]">
        <div className="rounded-xl border border-[#3a6080]/35 bg-[#0b1a2c]/72 p-4">
          {selectedNode ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8fb6d8]">
                    Selected infrastructure
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-[#d8eaf8]">{selectedNode.name}</h3>
                </div>
                <div
                  className="rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{
                    borderColor: selectedNode.active
                      ? 'rgba(74,222,128,0.4)'
                      : selectedNode.ready
                        ? 'rgba(240,160,50,0.4)'
                        : 'rgba(58,96,128,0.45)',
                    color: selectedNode.active
                      ? '#4ade80'
                      : selectedNode.ready
                        ? '#f0a032'
                        : '#6e90ae'
                  }}
                >
                  {selectedNode.active ? 'deployed' : selectedNode.ready ? 'ready' : 'locked'}
                </div>
              </div>

              <p className="mt-2 text-sm text-[#8aaece]">{selectedNode.function}</p>
              <p className="mt-1 text-[12px] text-[#6f93b2]">Unlocks: {selectedNode.unlocks}</p>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <MetricCell label="Cost" value={formatKwh(selectedNode.kwhRequired, 1)} />
                <MetricCell
                  label="Stability"
                  value={`+${selectedNode.stabilityImpactPct}%`}
                />
                <MetricCell
                  label="Budget left"
                  value={formatKwh(Math.max(0, availableKwh - selectedNode.kwhRequired), 2)}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeploy}
                  disabled={!selectedNode.ready}
                  className="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed"
                  style={{
                    background: selectedNode.ready ? '#64a0dc' : 'rgba(58,96,128,0.45)',
                    color: selectedNode.ready ? '#09111e' : '#9ab8d4'
                  }}
                >
                  {selectedNode.active ? 'Already deployed' : 'Deploy infrastructure'}
                </button>
                {!selectedNode.active && !selectedNode.affordable ? (
                  <span className="text-[11px] text-[#f0a032]">
                    Need {formatKwh(Math.max(0, selectedNode.kwhRequired - availableKwh), 2)} more
                  </span>
                ) : null}
              </div>
            </>
          ) : null}
        </div>

        <div className="rounded-xl border border-[#3a6080]/35 bg-[#0b1a2c]/72 p-4 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8fb6d8]">
            Deployment budget
          </p>
          <p className="text-2xl font-black text-[#d8eaf8]">{formatKwh(availableKwh, 2)}</p>
          <p className="mt-1 text-[11px] text-[#6f93b2]">Earned {formatKwh(totalEarnedKwh, 2)} · Spent {formatKwh(spentKwh, 2)}</p>
          <p className="mt-2 text-[11px] text-[#8aaece]">
            {nextNode
              ? `Next target: ${nextNode.name} (${formatKwh(nextNode.kwhRequired, 1)})`
              : 'All infrastructure deployed'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <IndicatorTile
          title="Battery"
          value={batteryActive ? `${batteryChargePct}% charge` : 'Offline'}
          detail={batteryCharging ? 'Charging with midday surplus' : 'Discharging for evening peak'}
          active={batteryActive}
        >
          <div className="h-1.5 overflow-hidden rounded-full bg-[#102840]">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${batteryActive ? batteryChargePct : 0}%`,
                background: batteryCharging ? '#4ade80' : '#f0a032'
              }}
            />
          </div>
        </IndicatorTile>

        <IndicatorTile
          title="Frequency"
          value={`${frequencyValue.toFixed(3)} Hz`}
          detail="Nominal target 50.000 Hz"
          active={frequencyActive}
        >
          <svg width={220} height={52} className="w-full overflow-visible">
            <line
              x1={0}
              y1={26}
              x2={220}
              y2={26}
              stroke="rgba(100,160,220,0.28)"
              strokeWidth={1}
              strokeDasharray="4 6"
            />
            <path
              d={buildFrequencyPath(tick * 1.5)}
              fill="none"
              stroke={frequencyActive ? '#64a0dc' : '#3a6080'}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </svg>
        </IndicatorTile>

        <IndicatorTile
          title="Solar forecasting"
          value={solarActive ? 'Forecast locked' : 'Offline'}
          detail="Prediction versus observed generation"
          active={solarActive}
        >
          <svg width={220} height={52} className="w-full overflow-visible">
            <path
              d={buildForecastPath(0.04)}
              fill="none"
              stroke="rgba(100,160,220,0.85)"
              strokeWidth={1.6}
            />
            <path
              d={buildForecastPath(0.11)}
              fill="none"
              stroke={solarActive ? '#4ade80' : '#3a6080'}
              strokeWidth={1.3}
              strokeDasharray="5 4"
            />
          </svg>
        </IndicatorTile>

        <IndicatorTile
          title="Demand response"
          value={demandActive ? 'Load shifted' : 'Offline'}
          detail="Scheduled versus actual EV charging"
          active={demandActive}
        >
          <div className="space-y-1.5 text-[11px]">
            <LoadRow
              label="Scheduled"
              pct={demandActive ? 72 : 0}
              color="rgba(100,160,220,0.85)"
            />
            <LoadRow
              label="Actual"
              pct={demandActive ? 58 + Math.round(Math.sin(tick) * 8) : 0}
              color={demandActive ? '#4ade80' : '#3a6080'}
            />
          </div>
        </IndicatorTile>
      </div>
    </article>
  );
});

const MetricCell = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-lg border border-[#3a6080]/35 bg-[#0a1728] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6f93b2]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-[#d8eaf8]">{value}</p>
    </div>
  );
};

const LoadRow = ({
  label,
  pct,
  color
}: {
  label: string;
  pct: number;
  color: string;
}) => {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[#8aaece]">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#102840]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

export const GridRestorationMap = GridStabilityMap;
