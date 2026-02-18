'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GridStabilityMap } from '@/components/energy/GridRestorationMap';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import {
  DEFAULT_DEPLOYED_NODE_IDS,
  formatKwh,
  getAvailableBudgetUnits,
  getGridStabilityPct,
  getSpentInfrastructureUnits,
  getStabilityTier,
  unitsToKwh
} from '@/lib/energy';

export default function EnergyLabPage() {
  const totalUnits = useProgressStore((state) => state.xp);
  const storeNodeIds = useProgressStore((state) => state.deployedNodeIds);
  const deployedNodeIds = storeNodeIds.length > 0 ? storeNodeIds : DEFAULT_DEPLOYED_NODE_IDS;

  const earnedKwh = unitsToKwh(totalUnits);
  const spentKwh = unitsToKwh(getSpentInfrastructureUnits(deployedNodeIds));
  const availableKwh = unitsToKwh(getAvailableBudgetUnits(totalUnits, deployedNodeIds));
  const stability = getGridStabilityPct(deployedNodeIds);
  const tier = getStabilityTier(stability);

  return (
    <main className="min-h-screen bg-light-bg px-4 pb-12 pt-8 text-text-light-primary dark:bg-[#070b09] dark:text-[#e5efe9] sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <section className="sticky top-16 z-20 rounded-xl border border-[#d5e3dc] bg-[#f6faf8] px-4 py-2.5 backdrop-blur dark:border-[#203128] dark:bg-[#0d1115] dark:backdrop-blur-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="mr-auto text-[11px] font-bold uppercase tracking-[0.18em] text-[#405748] dark:text-[#d4e2da]">
              StableGrid Operations Center
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-light-border bg-white px-4 py-2 text-sm font-medium text-text-light-primary transition-colors hover:border-emerald-400 dark:border-[#2a3a32] dark:bg-[#0e1411] dark:text-[#d4e2da] dark:hover:border-[#4ade80] dark:hover:text-[#eef7f1]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back Home
            </Link>
          </div>
        </section>

        <header className="mt-2">
          <p className="data-mono text-xs uppercase tracking-[0.35em] text-[#4d6d59] dark:text-[#8eb89f]">
            Learning -&gt; Infrastructure -&gt; Stability
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-[#13261d] dark:text-[#e5efe9] md:text-5xl font-display">
            Infrastructure Deployment Map
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-[#4e6558] dark:text-[#95ab9e] md:text-base">
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
    <div className="rounded-lg border border-[#d5e3dc] bg-[#f6faf8] px-3 py-2 dark:border-[#24372d] dark:bg-[#11181b]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5f7a6a] dark:text-[#7f9f8d]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-[#1e3328] dark:text-[#d4e2da]">{value}</p>
    </div>
  );
};
