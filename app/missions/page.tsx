'use client';

import type { CSSProperties } from 'react';
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Lock,
  MapPin,
  ShieldAlert,
  SlidersHorizontal,
  X,
  Zap
} from 'lucide-react';
import { MISSIONS, type MissionDefinition } from '@/data/missions';
import { createMissionProgressRequestKey } from '@/lib/api/requestKeys';
import { formatKwh, getMissionRewardKwh } from '@/lib/energy';
import { mergeWithDefaultMissions } from '@/lib/missions';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import type { MissionState, UserMissionProgress } from '@/types/missions';

type MissionFilter = 'all' | 'available' | 'completed';

const FILTERS: Array<{ id: MissionFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'completed', label: 'Completed' }
];

const ACTS = [
  {
    title: 'The Alarm',
    duration: '10–15 min',
    description: 'Read the incident timeline, alerts, and constraints before touching production.'
  },
  {
    title: 'The Investigation',
    duration: '30–40 min',
    description: 'Query operational datasets and isolate the exact fault path.'
  },
  {
    title: 'The Fix',
    duration: '20–30 min',
    description: 'Ship the remediation and validate against strict checks.'
  },
  {
    title: 'The Debrief',
    duration: '10 min',
    description: 'Deliver incident metrics and close out the report for leadership.'
  }
];

const TEAM = [
  { name: 'Lena Kovač', role: 'Head of Grid Intelligence' },
  { name: 'Mario Bauer', role: 'Senior DevOps Engineer' },
  { name: 'Sara Okonkwo', role: 'Data Scientist' },
  { name: 'Alert System', role: 'Automated Incident Feed' }
];

const DIFFICULTY_BADGE: Record<string, string> = {
  Easy:   'border-success-200 bg-success-50 text-success-700 dark:border-success-700/60 dark:bg-success-900/30 dark:text-success-300',
  Medium: 'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-700/60 dark:bg-warning-900/30 dark:text-warning-300',
  Hard:   'border-error-200 bg-error-50 text-error-700 dark:border-error-700/60 dark:bg-error-900/30 dark:text-error-300',
  Expert: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-700/60 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
};

const DRAWER_SHELL_DARK = 'dark:border-white/10 dark:bg-[#0a0a0a]';
const DRAWER_PANEL_DARK = 'dark:border-white/10 dark:bg-[#101010]';
const DRAWER_INSET_DARK = 'dark:border-white/10 dark:bg-[#141414]';
const DRAWER_CARD_DARK = 'dark:border-white/10 dark:bg-[#0d0d0d]';

const MissionCard = memo(function MissionCard({
  mission,
  index,
  onOpen
}: {
  mission: MissionDefinition;
  index: number;
  onOpen: (mission: MissionDefinition) => void;
}) {
  const locked = mission.status === 'locked';
  const accentRgb = mission.accentRgb;
  const cardVars = {
    '--mission-accent': accentRgb
  } as CSSProperties;
  const progressValue = mission.completed ? 100 : 0;
  const statusValue = locked ? 'Locked' : mission.completed ? '100%' : 'Ready';
  const statusCopy = locked
    ? 'This incident unlocks after earlier operations are completed.'
    : mission.completed
      ? 'Mission completed. Open the briefing to replay the incident anytime.'
      : 'Mission ready. Open the briefing to review the stakes, timeline, and reward.';
  const ctaLabel = locked
    ? 'Locked'
    : mission.completed
      ? 'Replay mission'
      : 'Open briefing';
  const bottomChips = [
    mission.duration,
    mission.location,
    formatKwh(getMissionRewardKwh(mission.difficulty), 1)
  ];

  return (
    <button
      type="button"
      onClick={() => { if (!locked) onOpen(mission); }}
      disabled={locked}
      className="group relative overflow-hidden rounded-[32px] border border-light-border bg-light-surface p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(var(--mission-accent),0.42)] hover:shadow-[0_30px_90px_-44px_rgba(var(--mission-accent),0.42)] disabled:!cursor-not-allowed disabled:!opacity-100 dark:border-dark-border dark:bg-dark-surface"
      style={cardVars}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(var(--mission-accent),0.18),transparent_32%),linear-gradient(180deg,rgba(var(--mission-accent),0.08),transparent_46%)]" />
      <div className="pointer-events-none absolute -right-12 top-10 h-44 w-44 rounded-full bg-[rgba(var(--mission-accent),0.1)] blur-3xl" />

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(var(--mission-accent),0.34)] bg-[rgba(var(--mission-accent),0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--mission-accent))]"
          >
            <span className="text-sm leading-none">{mission.icon}</span>
            Mission {String(index + 1).padStart(2, '0')}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-semibold text-text-light-primary dark:text-text-dark-primary">
              {mission.codename}
            </h2>
            <span className="rounded-full border border-[rgba(var(--mission-accent),0.34)] bg-[rgba(var(--mission-accent),0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--mission-accent))]">
              {mission.difficulty}
            </span>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
            {mission.summary}
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-light-border bg-light-bg px-3 py-1.5 text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
              {mission.tagline}
            </span>
          </div>
        </div>

        <div className="w-full max-w-sm rounded-3xl border border-[rgba(var(--mission-accent),0.18)] bg-light-bg/85 p-5 dark:bg-dark-bg/70">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-light-tertiary dark:text-text-dark-tertiary">
              Mission Status
            </span>
            <span className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
              {statusValue}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
            <div
              className="h-full rounded-full bg-[rgb(var(--mission-accent))] transition-all duration-500"
              style={{ width: `${progressValue}%` }}
            />
          </div>

          <p className="mt-4 text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
            {statusCopy}
          </p>
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-light-border/80 pt-5 dark:border-dark-border">
        <div className="flex flex-wrap gap-2">
          {bottomChips.map((chip) => (
            <span
              key={`${mission.slug}-${chip}`}
              className="rounded-full border border-light-border bg-light-bg px-3 py-1 text-xs text-text-light-tertiary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-tertiary"
            >
              {chip}
            </span>
          ))}
        </div>

        <span className="inline-flex items-center gap-2 text-sm font-medium text-text-light-primary transition-transform group-hover:translate-x-0.5 dark:text-text-dark-primary">
          {ctaLabel}
          {!locked ? <ChevronRight className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </span>
      </div>
    </button>
  );
});

const MissionDrawer = memo(function MissionDrawer({
  mission,
  onClose,
  onUpdateMissionState
}: {
  mission: MissionDefinition;
  onClose: () => void;
  onUpdateMissionState: (missionSlug: string, state: MissionState) => void;
}) {
  const isLocked = mission.status === 'locked';
  const missionPath = `/missions/${mission.slug}`;

  return (
    <>
      <button
        type="button"
        aria-label="Close mission details"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
      />

      <aside className={`fixed inset-y-0 left-0 z-50 w-full max-w-md overflow-y-auto border-r border-light-border bg-light-bg shadow-2xl ${DRAWER_SHELL_DARK}`}>
        <div className="h-1 bg-gradient-to-r from-brand-500 to-transparent" />

        <div className={`sticky top-0 z-10 flex items-center justify-between border-b border-light-border bg-light-bg/95 px-5 py-4 backdrop-blur ${DRAWER_SHELL_DARK} dark:bg-[#0a0a0a]/95`}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
            Mission Briefing
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-light-border p-2 text-text-light-tertiary transition hover:text-text-light-primary dark:border-white/10 dark:text-text-dark-tertiary dark:hover:text-text-dark-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <section className={`rounded-xl border border-light-border bg-light-surface p-4 ${DRAWER_PANEL_DARK}`}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border border-light-border bg-light-muted text-xl ${DRAWER_INSET_DARK}`}>
                  {mission.icon}
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
                    Operation
                  </p>
                  <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                    {mission.codename}
                  </h2>
                </div>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${DIFFICULTY_BADGE[mission.difficulty] ?? DIFFICULTY_BADGE.Medium}`}>
                {mission.difficulty}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
              {mission.summary}
            </p>

            <div className={`mt-4 rounded-lg border border-light-border bg-light-muted p-3 ${DRAWER_CARD_DARK}`}>
              <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
                <ShieldAlert className="h-3.5 w-3.5" />
                Stakes
              </p>
              <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {mission.stakes}
              </p>
            </div>
          </section>

          <section className={`rounded-xl border border-light-border bg-light-surface p-4 ${DRAWER_PANEL_DARK}`}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <MetaItem label="Duration" value={mission.duration} />
              <MetaItem
                label="Energy"
                value={formatKwh(getMissionRewardKwh(mission.difficulty), 1)}
              />
              <MetaItem label="Location" value={mission.location} />
              <MetaItem label="Status" value={mission.completed ? 'Completed' : mission.status} />
            </div>
          </section>

          <section className={`rounded-xl border border-light-border bg-light-surface p-4 ${DRAWER_PANEL_DARK}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
              Mission Flow
            </p>
            <div className="mt-3 space-y-3">
              {ACTS.map((act, index) => (
                <div
                  key={act.title}
                  className={`rounded-lg border border-light-border bg-light-bg p-3 ${DRAWER_INSET_DARK}`}
                >
                  <p className="text-[10px] uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
                    Act {index + 1} · {act.duration}
                  </p>
                  <p className="mt-1 text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                    {act.title}
                  </p>
                  <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    {act.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className={`rounded-xl border border-light-border bg-light-surface p-4 ${DRAWER_PANEL_DARK}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
              Team
            </p>
            <div className="mt-3 space-y-2">
              {TEAM.map((member) => (
                <div
                  key={member.name}
                  className={`flex items-center justify-between rounded-lg border border-light-border bg-light-bg px-3 py-2 text-sm ${DRAWER_INSET_DARK}`}
                >
                  <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                    {member.name}
                  </span>
                  <span className="text-text-light-tertiary dark:text-text-dark-tertiary">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className={`rounded-xl border border-light-border bg-light-surface p-4 ${DRAWER_PANEL_DARK}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
              Rewards
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <RewardCell
                label="Energy"
                value={formatKwh(getMissionRewardKwh(mission.difficulty), 1)}
              />
              <RewardCell label="Badge" value={mission.rewardBadge} />
              <RewardCell label="Title" value={mission.rewardTitle} />
            </div>
          </section>

          <div className="flex items-center gap-2 pt-2">
            {!isLocked ? (
              <Link
                href={missionPath}
                className="btn btn-primary flex-1"
                onClick={() => onUpdateMissionState(mission.slug, 'in_progress')}
              >
                {mission.completed ? 'Replay Mission' : 'Start Mission'}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                disabled={isLocked}
                className="btn btn-primary flex-1 disabled:!cursor-not-allowed"
              >
                {isLocked ? 'Locked' : mission.completed ? 'Review Mission' : 'Open Mission'}
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            <Link href={`/missions/${mission.slug}`} className="btn btn-secondary">
              Full Brief
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
});

const MetaItem = memo(function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={`rounded-lg border border-light-border bg-light-bg px-3 py-2 ${DRAWER_INSET_DARK}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
        {value}
      </p>
    </div>
  );
});

const RewardCell = memo(function RewardCell({ label, value }: { label: string; value: string }) {
  return (
    <div className={`rounded-lg border border-light-border bg-light-bg px-2 py-2 ${DRAWER_INSET_DARK}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
        {label}
      </p>
      <p className="mt-1 text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
        {value}
      </p>
    </div>
  );
});

export default function MissionsPage() {
  const addXP = useProgressStore((state) => state.addXP);
  const [filter, setFilter] = useState<MissionFilter>('all');
  const deferredFilter = useDeferredValue(filter);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<MissionDefinition | null>(
    null
  );
  const [missions, setMissions] = useState<MissionDefinition[]>(
    mergeWithDefaultMissions([])
  );

  const loadMissionProgress = useCallback(async () => {
    try {
      const response = await fetch('/api/missions/progress', {
        method: 'GET',
        cache: 'no-store'
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as {
        data?: Array<{
          mission_slug: string;
          state: MissionState;
          unlocked: boolean;
          started_at: string | null;
          completed_at: string | null;
          xp_awarded: number;
        }>;
      };

      const progressRows: UserMissionProgress[] = Array.isArray(payload.data)
        ? payload.data.map((row) => ({
            missionSlug: row.mission_slug,
            state: row.state,
            unlocked: row.unlocked,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            energyAwardedUnits: row.xp_awarded
          }))
        : [];

      setMissions(mergeWithDefaultMissions(progressRows));
    } catch {
      // Keep static fallback if request fails.
    }
  }, []);

  const updateMissionState = useCallback(
    async (missionSlug: string, state: MissionState) => {
      setMissions((previous) =>
        previous.map((mission) => {
          if (mission.slug !== missionSlug) return mission;

          if (state === 'completed') {
            return { ...mission, completed: true, status: 'available' };
          }
          if (state === 'in_progress') {
            return { ...mission, completed: false, status: 'available' };
          }
          return { ...mission, completed: false };
        })
      );

      try {
        const response = await fetch('/api/missions/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': createMissionProgressRequestKey({
              missionSlug,
              state,
              unlocked: true
            })
          },
          body: JSON.stringify({
            missionSlug,
            state,
            unlocked: true
          }),
          keepalive: true
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          reward_awarded_units?: number;
        };
        const rewardUnits = Number(payload.reward_awarded_units ?? 0);

        if (state === 'completed' && rewardUnits > 0) {
          const mission = MISSIONS.find((item) => item.slug === missionSlug);
          addXP(rewardUnits, {
            source: 'mission',
            label: mission
              ? `Mission complete: ${mission.codename}`
              : 'Mission complete'
          });
        }
      } catch {
        // Ignore network failures and keep optimistic state.
      }
    },
    [addXP]
  );

  const filteredMissions = useMemo(() => {
    return missions.filter((mission) => {
      if (deferredFilter === 'available') {
        return mission.status === 'available' && !mission.completed;
      }
      if (deferredFilter === 'completed') {
        return mission.completed;
      }
      return true;
    });
  }, [deferredFilter, missions]);

  const handleSelectMission = useCallback((mission: MissionDefinition) => {
    setSelectedMission(mission);
  }, []);

  const handleCloseMission = useCallback(() => {
    setSelectedMission(null);
  }, []);

  const stats = useMemo(() => {
    const completed = missions.filter((mission) => mission.completed).length;
    const active = missions.filter(
      (mission) => mission.status === 'available' && !mission.completed
    ).length;
    const locked = missions.filter((mission) => mission.status === 'locked').length;
    const total = missions.length;

    return {
      total,
      completed,
      active,
      locked,
      completionPct: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [missions]);

  useEffect(() => {
    void loadMissionProgress();
  }, [loadMissionProgress]);

  useEffect(() => {
    if (!selectedMission) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedMission(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedMission]);

  return (
    <main className="min-h-screen bg-light-bg px-6 pb-16 pt-10 dark:bg-dark-bg">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="max-w-4xl">
          <p className="data-mono mb-2 text-xs uppercase tracking-[0.32em] text-brand-500/80">
            Mission Gallery
          </p>
          <h1 className="text-4xl font-semibold text-text-light-primary dark:text-text-dark-primary md:text-5xl font-display">
            Missions
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-8 text-text-light-secondary dark:text-text-dark-secondary md:text-base">
            Real infrastructure incidents with production-style constraints. Browse
            fast, then open a full briefing only when you decide to run one.
          </p>
        </header>

        <section className="rounded-2xl border border-light-border bg-light-surface p-3 dark:border-dark-border dark:bg-dark-surface">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-light-border bg-light-bg px-3 py-2 text-sm font-medium text-text-light-primary transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:hover:border-brand-400 dark:hover:text-brand-300"
            >
              <SlidersHorizontal className="h-4 w-4 text-brand-500" />
              Filters
              {filter !== 'all' ? (
                <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-500">
                  1 active
                </span>
                ) : null}
              </button>

              <div className="flex flex-wrap items-center gap-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 dark:border-dark-border dark:bg-dark-bg">
                  Showing {filteredMissions.length} of {missions.length} missions
                </span>
                <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 dark:border-dark-border dark:bg-dark-bg">
                  {stats.active} available
                </span>
                <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 dark:border-dark-border dark:bg-dark-bg">
                  {stats.locked} locked
                </span>
                <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 dark:border-dark-border dark:bg-dark-bg">
                  Filter: {FILTERS.find((option) => option.id === filter)?.label ?? 'All'}
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {stats.completed}/{stats.total} missions completed
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  Completion
                </p>
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all duration-500"
                    style={{ width: `${stats.completionPct}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  {stats.completionPct}%
                </p>
              </div>
            </div>
          </section>

        {isFilterPanelOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px]"
            aria-label="Close filter panel backdrop"
            onClick={() => setIsFilterPanelOpen(false)}
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[380px] max-w-[94vw] border-r border-light-border bg-light-bg/95 p-4 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-in-out dark:border-dark-border dark:bg-[#02060f]/95 ${
            isFilterPanelOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
          }`}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
              Filters
            </h2>
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(false)}
              className="rounded-md p-1.5 text-text-light-secondary transition-colors hover:bg-light-surface hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:bg-dark-surface dark:hover:text-text-dark-primary"
              aria-label="Close filter panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <section className="flex h-[calc(100%-2.2rem)] flex-col rounded-2xl border border-light-border bg-light-surface/95 p-4 dark:border-dark-border dark:bg-dark-surface/95">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter Panel
              </div>
              <button
                type="button"
                onClick={() => { setFilter('all'); setIsFilterPanelOpen(false); }}
                className="inline-flex items-center gap-1 rounded-md border border-light-border px-2.5 py-1.5 text-xs font-medium text-text-light-secondary transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-brand-400 dark:hover:text-brand-300"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1">
              <section className="rounded-xl border border-light-border p-3 dark:border-dark-border">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
                  Status
                </p>
                <div className="mt-2 space-y-2">
                  {FILTERS.map((option) => {
                    const selected = filter === option.id;
                    const descriptions: Record<MissionFilter, string> = {
                      all: 'Show all missions regardless of status.',
                      available: 'Only missions you can start right now.',
                      completed: 'Missions you\'ve already finished.'
                    };
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setFilter(option.id)}
                        aria-pressed={selected}
                        className={`w-full rounded-lg border p-2.5 text-left transition ${
                          selected
                            ? 'border-brand-500/40 bg-brand-500/10'
                            : 'border-light-border hover:border-brand-500/40 dark:border-dark-border'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                              {option.label}
                            </p>
                            <p className="mt-0.5 text-[11px] text-text-light-secondary dark:text-text-dark-secondary">
                              {descriptions[option.id]}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              selected
                                ? 'border border-brand-500/40 bg-brand-500/10 text-brand-500'
                                : 'border border-light-border text-text-light-secondary dark:border-dark-border dark:text-text-dark-secondary'
                            }`}
                          >
                            {selected ? 'Applied' : 'Use'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </section>
        </aside>

        {filteredMissions.length > 0 ? (
          <section className="grid grid-cols-1 gap-6">
            {filteredMissions.map((mission, index) => (
              <MissionCard
                key={mission.slug}
                mission={mission}
                index={index}
                onOpen={handleSelectMission}
              />
            ))}
          </section>
        ) : (
          <section className="rounded-[28px] border border-light-border bg-light-surface p-10 text-center dark:border-dark-border dark:bg-dark-surface">
            <p className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
              No missions match this filter
            </p>
            <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Adjust the status filter to widen the gallery.
            </p>
          </section>
        )}
      </div>

      {selectedMission && (
        <MissionDrawer
          mission={selectedMission}
          onClose={handleCloseMission}
          onUpdateMissionState={updateMissionState}
        />
      )}
    </main>
  );
}
