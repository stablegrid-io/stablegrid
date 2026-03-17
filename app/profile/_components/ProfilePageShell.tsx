'use client';

import dynamic from 'next/dynamic';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { getLevelProgress } from '@/lib/energy';
import { CharacterStatCard } from './CharacterStatCard';
import { LevelProgressBar } from './LevelProgressBar';
import { EquipmentGrid } from './EquipmentGrid';

const CharacterViewer = dynamic(
  () => import('./CharacterViewer').then((m) => m.CharacterViewer),
  {
    ssr: false,
    loading: () => (
      <div className="h-[340px] w-full animate-pulse rounded-2xl bg-[#0a1612]" />
    )
  }
);

interface Props {
  serverXp: number;
  serverStreak: number;
}

export function ProfilePageShell({ serverXp, serverStreak }: Props) {
  // Prefer live Zustand store (fresher after in-session actions)
  const storeXp = useProgressStore((s) => s.xp);
  const storeStreak = useProgressStore((s) => s.streak);
  const deployedNodeIds = useProgressStore((s) => s.deployedNodeIds);

  const xp = storeXp > 0 ? storeXp : serverXp;
  const streak = storeStreak > 0 ? storeStreak : serverStreak;

  const { current, next, progressPct, unitsNeededForNext } = getLevelProgress(xp);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-50">Character</h1>
        <p className="mt-0.5 text-sm text-brand-200/55">Your grid engineer identity</p>
      </div>

      {/* Hero row: 3D viewer + identity panel */}
      <div className="grid gap-4 md:grid-cols-[340px_1fr]">
        {/* 3D rotating engineer */}
        <CharacterViewer tier={current.tier} />

        {/* Identity + stats panel */}
        <div className="flex flex-col justify-center space-y-5 rounded-2xl border border-white/10 bg-[#080e0c]/90 p-6">
          {/* Tier + title */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.20em] text-brand-300/55">
              {current.tier.toUpperCase()} TIER
            </p>
            <p className="mt-1 text-3xl font-bold leading-none text-brand-50">{current.title}</p>
            <p className="mt-1 text-sm text-brand-200/55">Level {current.level}</p>
          </div>

          {/* XP progress bar */}
          <LevelProgressBar
            current={current}
            next={next}
            progressPct={progressPct}
            unitsNeededForNext={unitsNeededForNext}
          />

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <CharacterStatCard
              label="XP Earned"
              value={xp.toLocaleString()}
              unit="units"
            />
            <CharacterStatCard
              label="Streak"
              value={streak.toString()}
              unit="days"
            />
            <CharacterStatCard
              label="Nodes"
              value={deployedNodeIds.length.toString()}
              unit="deployed"
            />
          </div>
        </div>
      </div>

      {/* Equipment / deployed nodes */}
      <EquipmentGrid deployedNodeIds={deployedNodeIds} />
    </div>
  );
}
