'use client';

import Link from 'next/link';
import { memo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PulseCompanionOverlay } from '@/components/mascot/PulseCompanionOverlay';
import { GridStabilityMap } from '@/components/energy/GridRestorationMap';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { usePulseMascotStore } from '@/lib/stores/usePulseMascotStore';
import {
  DEFAULT_DEPLOYED_NODE_IDS,
  formatKwh,
  getAvailableBudgetUnits,
  getGridStabilityPct,
  getSpentInfrastructureUnits,
  getStabilityTier,
  unitsToKwh
} from '@/lib/energy';

const PULSE_MODEL_URL = process.env.NEXT_PUBLIC_PULSE_MODEL_URL;

function buildWavePath(t: number, width = 280, height = 40) {
  const points: string[] = [];
  const steps = 80;

  for (let i = 0; i <= steps; i += 1) {
    const x = (i / steps) * width;
    const phase = (i / steps) * Math.PI * 6 + t;
    let y = Math.sin(phase) * 10;
    y += Math.sin(phase * 2.1 + 0.3) * 2.5;
    y += Math.sin(phase * 0.5 + t * 0.3) * 1.5;

    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${(height / 2 - y).toFixed(1)}`);
  }

  return points.join(' ');
}

const FrequencyMonitor = memo(function FrequencyMonitor() {
  const path = buildWavePath(0.25, 280, 40);

  return (
    <div className="flex items-center gap-3">
      <svg width={280} height={40} className="overflow-visible">
        <line
          x1={0}
          y1={20}
          x2={280}
          y2={20}
          className="stroke-light-border dark:stroke-[#1a2c42]"
          strokeWidth={1}
          strokeDasharray="3 6"
        />
        <path d={path} fill="none" stroke="#64a0dc" strokeWidth={1.6} strokeLinecap="round" />
      </svg>
      <div className="shrink-0 text-right">
        <div className="font-mono text-xs font-extrabold text-[#64a0dc]">50.000 Hz</div>
        <div className="mt-0.5 text-[9px] font-bold tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
          GRID FREQ
        </div>
      </div>
    </div>
  );
});

export default function EnergyLabPage() {
  const totalUnits = useProgressStore((state) => state.xp);
  const storeNodeIds = useProgressStore((state) => state.deployedNodeIds);
  const pulseMood = usePulseMascotStore((state) => state.mood);
  const pulseMotion = usePulseMascotStore((state) => state.motion);
  const pulseBaseAction = usePulseMascotStore((state) => state.action);
  const deployedNodeIds = storeNodeIds.length > 0 ? storeNodeIds : DEFAULT_DEPLOYED_NODE_IDS;

  const earnedKwh = unitsToKwh(totalUnits);
  const spentKwh = unitsToKwh(getSpentInfrastructureUnits(deployedNodeIds));
  const availableKwh = unitsToKwh(getAvailableBudgetUnits(totalUnits, deployedNodeIds));
  const stability = getGridStabilityPct(deployedNodeIds);
  const tier = getStabilityTier(stability);

  return (
    <main className="min-h-screen bg-[#09111e] px-4 pb-12 pt-8 sm:px-6">
      <PulseCompanionOverlay
        mood={pulseMood}
        motion={pulseMotion}
        action={pulseBaseAction}
        size={170}
        modelUrl={PULSE_MODEL_URL}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <section className="sticky top-16 z-20 rounded-xl border border-[#3a6080]/45 bg-[#0d1a2b]/92 px-4 py-2.5 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <p className="mr-auto text-[11px] font-bold uppercase tracking-[0.18em] text-[#64a0dc]">
              StableGrid Operations Center
            </p>
            <FrequencyMonitor />
            <Link href="/" className="btn btn-secondary border-[#3a6080] text-[#c6dcec]">
              <ArrowLeft className="h-4 w-4" />
              Back Home
            </Link>
          </div>
        </section>

        <header className="mt-2">
          <p className="data-mono text-xs uppercase tracking-[0.35em] text-[#64a0dc]">
            Learning -&gt; Infrastructure -&gt; Stability
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-[#d8eaf8] md:text-5xl font-display">
            Infrastructure Deployment Map
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-[#8aaece] md:text-base">
            Complete chapters, practice, and missions to earn kWh deployment budget. Spend it to
            deploy equipment that stabilizes renewable variability across the Iberian simulation.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatPill label="Budget" value={formatKwh(availableKwh, 2)} />
            <StatPill label="Earned" value={formatKwh(earnedKwh, 2)} />
            <StatPill label="Spent" value={formatKwh(spentKwh, 2)} />
            <StatPill label="Stability" value={`${stability}% ${tier.label}`} />
          </div>
        </header>

        <section>
          <GridStabilityMap />
        </section>
      </div>
    </main>
  );
}

const StatPill = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-lg border border-[#3a6080]/35 bg-[#0d1a2b]/75 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6f93b2]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-[#d8eaf8]">{value}</p>
    </div>
  );
};
