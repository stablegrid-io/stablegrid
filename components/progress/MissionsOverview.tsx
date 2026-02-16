'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { ChevronRight, Lock, ShieldAlert, Trophy, Zap } from 'lucide-react';
import { MISSIONS, type MissionDifficulty } from '@/data/missions';
import { formatKwh, getMissionRewardUnits, unitsToKwh } from '@/lib/energy';
import { mergeWithDefaultMissions, type MissionWithProgress } from '@/lib/missions';
import type { UserMissionProgress } from '@/types/missions';

const DIFFICULTY_BADGE: Record<MissionDifficulty, string> = {
  Medium:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-300',
  Hard:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-300',
  Expert:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/30 dark:text-rose-300'
};

const getStatusLabel = (mission: MissionWithProgress) => {
  if (mission.completed) return 'Completed';
  if (mission.status === 'locked') return 'Locked';
  return 'Active';
};

const getStatusClass = (mission: MissionWithProgress) => {
  if (mission.completed) {
    return 'text-success-700 dark:text-success-400';
  }
  if (mission.status === 'locked') {
    return 'text-text-light-tertiary dark:text-text-dark-tertiary';
  }
  return 'text-brand-600 dark:text-brand-400';
};

interface MissionsOverviewProps {
  missionProgress: UserMissionProgress[];
}

export function MissionsOverview({ missionProgress }: MissionsOverviewProps) {
  const missions = mergeWithDefaultMissions(missionProgress);
  const completedCount = missions.filter((mission) => mission.completed).length;
  const activeCount = missions.filter(
    (mission) => mission.status === 'available' && !mission.completed
  ).length;
  const lockedCount = missions.filter((mission) => mission.status === 'locked').length;
  const missionRewardBySlug = new Map(
    MISSIONS.map((mission) => [mission.slug, getMissionRewardUnits(mission.difficulty)])
  );
  const totalEnergyUnits = missionProgress.reduce((sum, mission) => {
    if (mission.state !== 'completed') return sum;
    const storedUnits = Number(mission.energyAwardedUnits ?? 0);
    if (storedUnits > 0) return sum + storedUnits;
    return sum + (missionRewardBySlug.get(mission.missionSlug) ?? 0);
  }, 0);
  const completionPct =
    missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 0;

  const orderedMissions = [...missions].sort((a, b) => {
    const score = (mission: MissionWithProgress) => {
      if (mission.completed) return 0;
      if (mission.status === 'available') return 1;
      return 2;
    };
    return score(a) - score(b);
  });

  return (
    <section className="rounded-xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Missions
          </h2>
          <p className="mt-0.5 text-xs text-neutral-400">
            Completion and unlock progress
          </p>
        </div>
        <Link
          href="/missions"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-500 transition-colors hover:text-brand-600"
        >
          Open missions
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Completed" value={completedCount} icon={Trophy} />
        <StatTile label="Active" value={activeCount} icon={ShieldAlert} />
        <StatTile label="Locked" value={lockedCount} icon={Lock} />
        <StatTile
          label="Energy Generated"
          value={formatKwh(unitsToKwh(totalEnergyUnits), 1)}
          icon={Zap}
        />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>{completionPct}% complete</span>
          <span>
            {completedCount}/{missions.length}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-success-500 to-brand-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {orderedMissions.slice(0, 5).map((mission) => {
          const locked = mission.status === 'locked';
          const row = (
            <div
              className={`flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 transition-colors dark:border-neutral-800 dark:bg-neutral-800/50 ${
                locked
                  ? 'cursor-not-allowed opacity-70'
                  : 'hover:border-neutral-200 dark:hover:border-neutral-700'
              }`}
            >
              <div className="min-w-0 pr-3">
                <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                  {mission.codename}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${DIFFICULTY_BADGE[mission.difficulty]}`}
                  >
                    {mission.difficulty}
                  </span>
                  <span
                    className={`text-xs font-medium ${getStatusClass(mission)}`}
                  >
                    {getStatusLabel(mission)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {mission.duration}
                </p>
                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  {mission.location}
                </p>
              </div>
            </div>
          );

          if (locked) {
            return (
              <div key={mission.slug} className="block">
                {row}
              </div>
            );
          }

          return (
            <Link key={mission.slug} href={`/missions/${mission.slug}`} className="block">
              {row}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function StatTile({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-800/50">
      <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">{value}</p>
    </div>
  );
}
