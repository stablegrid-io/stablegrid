'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import type { PracticeSet } from '@/data/operations/practice-sets';
import type { ServerPracticeModuleProgress } from '@/lib/practice/serverPracticeProgress';

export interface PracticeTrackSummary {
  slug: 'junior' | 'mid' | 'senior';
  label: string;
  eyebrow: string;
  sets: PracticeSet[];
}

interface PracticeTrackEditorialProps {
  topic: string;
  tracks: PracticeTrackSummary[];
  progressByModule: Record<string, ServerPracticeModuleProgress>;
}

interface LockGate {
  unlocked: boolean;
  reason?: string;
}

const TIER_HEADERS: Record<string, { headline: string }> = {
  junior: { headline: 'JUNIOR' },
  mid: { headline: 'MID' },
  senior: { headline: 'SENIOR' }
};

const computeGate = (
  trackSlug: string,
  trackStats: { tasksSolved: number; totalTasks: number }[],
  trackBySlug: Record<string, number>,
  kwh: number
): LockGate => {
  if (trackSlug === 'junior') return { unlocked: true };
  if (trackSlug === 'mid') {
    const required = 500;
    if (kwh >= required) return { unlocked: true };
    const away = required - kwh;
    return {
      unlocked: false,
      reason: `${away.toLocaleString()} kWh away. Reach ${required.toLocaleString()} kWh total processing power to unlock.`
    };
  }
  if (trackSlug === 'senior') {
    const midIdx = trackBySlug.mid;
    const midStats = midIdx !== undefined ? trackStats[midIdx] : undefined;
    const midDone =
      midStats !== undefined &&
      midStats.totalTasks > 0 &&
      midStats.tasksSolved >= midStats.totalTasks;
    const required = 1200;
    if (midDone && kwh >= required) return { unlocked: true };
    if (!midDone) {
      return {
        unlocked: false,
        reason: `Requires Mid completion and ${required.toLocaleString()} kWh.`
      };
    }
    const away = required - kwh;
    return {
      unlocked: false,
      reason: `${away.toLocaleString()} kWh away. Reach ${required.toLocaleString()} kWh to unlock.`
    };
  }
  return { unlocked: true };
};

const stripModulePrefix = (title: string): string =>
  title
    .replace(/^practice set\s*\d+\s*[—–-]\s*/i, '')
    .replace(/^module\s*\d+\s*[—–-]\s*/i, '')
    .trim();

const padNumber = (n: number) => n.toString().padStart(2, '0');

export const PracticeTrackEditorial = ({
  topic,
  tracks,
  progressByModule
}: PracticeTrackEditorialProps) => {
  const xp = useProgressStore((s) => s.xp);

  const trackStats = useMemo(
    () =>
      tracks.map((track) => {
        let tasksSolved = 0;
        let totalTasks = 0;
        for (const set of track.sets) {
          totalTasks += set.tasks.length;
          tasksSolved += progressByModule[set.metadata.moduleId]?.tasksSolved ?? 0;
        }
        return { tasksSolved, totalTasks };
      }),
    [tracks, progressByModule]
  );

  const trackBySlug = useMemo(
    () =>
      tracks.reduce<Record<string, number>>((acc, track, i) => {
        acc[track.slug] = i;
        return acc;
      }, {}),
    [tracks]
  );

  return (
    <main className="bg-surface min-h-[calc(100dvh-4rem)]">
      <div className="max-w-[1200px] mx-auto px-12 py-16">
        {/* Header */}
        <header className="mb-16">
          <h1 className="font-h1 text-h1 text-on-surface mb-3">Practice</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
            Apply what you&apos;ve read. Each set takes 15&ndash;25 minutes and pays kWh on completion.
          </p>
          <div className="border-b border-on-surface mt-8" />
        </header>

        {/* Tiers */}
        <div className="flex flex-col gap-20">
          {tracks.map((track) => {
            const gate = computeGate(track.slug, trackStats, trackBySlug, xp);
            const tierMeta = TIER_HEADERS[track.slug] ?? {
              headline: track.label.toUpperCase()
            };

            return (
              <section key={track.slug} aria-label={track.label}>
                {/* Tier header — name + ruled line, screenshot-style. */}
                <div className="flex items-center gap-4 pb-4">
                  <h2
                    className={`font-ui-label text-[24px] sm:text-[28px] uppercase tracking-wider ${
                      gate.unlocked
                        ? 'text-on-surface'
                        : 'text-on-surface-variant/40'
                    }`}
                  >
                    {tierMeta.headline}
                  </h2>
                  <span
                    aria-hidden
                    className={`flex-1 h-px ${
                      gate.unlocked
                        ? 'bg-on-surface/30'
                        : 'bg-on-surface-variant/15'
                    }`}
                  />
                </div>

                {/* Body */}
                {gate.unlocked ? (
                  <ul className="flex flex-col">
                    {track.sets.map((set) => {
                      const moduleProgress = progressByModule[set.metadata.moduleId];
                      const tasksSolved = moduleProgress?.tasksSolved ?? 0;
                      const currentTaskId = moduleProgress?.currentTaskId ?? null;
                      const setTitle = stripModulePrefix(set.title);
                      const moduleSlug = set.metadata.moduleId.replace(/^module-/, '');
                      const href = `/practice/modules/${track.slug}?practice=module-${moduleSlug}`;

                      return (
                        <PracticeSetRow
                          key={set.metadata.moduleId}
                          modulePrefix={moduleSlug}
                          title={setTitle}
                          tasks={set.tasks}
                          tasksSolved={tasksSolved}
                          currentTaskId={currentTaskId}
                          href={href}
                        />
                      );
                    })}
                  </ul>
                ) : (
                  <LockedBanner
                    reason={gate.reason ?? 'Locked.'}
                    label={`REQUIRES ${tierMeta.headline} TIER`}
                  />
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
};

interface PracticeSetRowProps {
  modulePrefix: string;
  title: string;
  tasks: PracticeSet['tasks'];
  tasksSolved: number;
  currentTaskId: string | null;
  href: string;
}

const PracticeSetRow = ({
  modulePrefix,
  title,
  tasks,
  tasksSolved,
  currentTaskId,
  href
}: PracticeSetRowProps) => {
  const totalTasks = tasks.length;

  return (
    <li className="border-b border-surface-dim">
      <Link
        href={href}
        className="grid grid-cols-[64px_1fr_auto_auto] items-center gap-6 py-5 w-full text-left hover:bg-surface-container-low transition-colors"
      >
        <span className="font-data-mono uppercase tabular-nums text-[13px] pl-2 text-on-surface-variant">
          {modulePrefix}
        </span>
        <span className="font-serif text-[18px] text-on-surface leading-snug truncate">
          {title}
        </span>
        <span className="font-data-mono tabular-nums text-on-surface-variant text-[13px] pr-4">
          {totalTasks} task{totalTasks === 1 ? '' : 's'}
        </span>
        <span className="flex items-center gap-1.5 pr-2">
          {tasks.map((task, taskIdx) => {
            const taskComplete = taskIdx < tasksSolved;
            const taskCurrent = !taskComplete && task.id === currentTaskId;
            return (
              <TaskSquare
                key={task.id}
                isComplete={taskComplete}
                isCurrent={taskCurrent}
              />
            );
          })}
        </span>
      </Link>
    </li>
  );
};

const TaskSquare = ({
  isComplete,
  isCurrent
}: {
  isComplete: boolean;
  isCurrent: boolean;
}) => {
  if (isComplete) {
    return (
      <span aria-label="Solved" className="block w-5 h-5 bg-on-surface" />
    );
  }
  if (isCurrent) {
    return (
      <span
        aria-label="In progress"
        className="block w-5 h-5 border-2 border-primary"
      />
    );
  }
  return (
    <span
      aria-label="Not started"
      className="block w-5 h-5 border border-surface-dim"
    />
  );
};

const LockedBanner = ({ reason, label }: { reason: string; label: string }) => (
  <div className="border-b border-surface-dim bg-surface-container-low p-10 mt-0 flex flex-col items-center justify-center gap-3 text-center">
    <Lock className="h-6 w-6 text-on-surface-variant/40" strokeWidth={1.5} />
    <span className="font-data-mono uppercase tracking-[0.18em] text-[11px] text-on-surface-variant/60">
      {label}
    </span>
    <p className="font-body-lg text-on-surface-variant/60 text-[13px] max-w-md">
      {reason}
    </p>
  </div>
);
