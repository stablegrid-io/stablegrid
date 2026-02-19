'use client';

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

const MissionCard = memo(function MissionCard({
  mission,
  onOpen
}: {
  mission: MissionDefinition;
  onOpen: (mission: MissionDefinition) => void;
}) {
  const locked = mission.status === 'locked';

  return (
    <button
      type="button"
      onClick={() => { if (!locked) onOpen(mission); }}
      disabled={locked}
      className="group card card-hover flex w-full flex-col gap-4 p-5 text-left disabled:!cursor-not-allowed disabled:!opacity-55"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-light-border bg-light-muted text-lg dark:border-dark-border dark:bg-dark-muted">
            {mission.icon}
          </span>
          <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            {mission.codename}
          </span>
        </div>
        <div className="shrink-0">
          {mission.completed ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-success-300 bg-success-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-success-700 dark:border-success-700/60 dark:bg-success-900/30 dark:text-success-300">
              <CheckCircle2 className="h-3 w-3" />
              Done
            </span>
          ) : locked ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
              <Lock className="h-3 w-3" />
              Locked
            </span>
          ) : (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${DIFFICULTY_BADGE[mission.difficulty] ?? DIFFICULTY_BADGE.Medium}`}>
              {mission.difficulty}
            </span>
          )}
        </div>
      </div>

      <p className="line-clamp-3 text-sm text-text-light-secondary dark:text-text-dark-secondary">
        {mission.tagline}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {mission.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-light-border bg-light-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.07em] text-text-light-secondary dark:border-dark-border dark:bg-dark-muted dark:text-text-dark-secondary"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-light-border/80 pt-3 text-xs text-text-light-tertiary dark:border-dark-border dark:text-text-dark-tertiary">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            {mission.duration}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {mission.location}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400">
          <Zap className="h-3.5 w-3.5" />
          {formatKwh(getMissionRewardKwh(mission.difficulty), 1)}
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

      <aside className="fixed inset-y-0 left-0 z-50 w-full max-w-md overflow-y-auto border-r border-light-border bg-light-bg shadow-2xl dark:border-dark-border dark:bg-[#070d15]">
        <div className="h-1 bg-gradient-to-r from-brand-500 to-transparent" />

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-light-border bg-light-bg/95 px-5 py-4 backdrop-blur dark:border-dark-border dark:bg-[#070d15]/95">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
            Mission Briefing
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-light-border p-2 text-text-light-tertiary transition hover:text-text-light-primary dark:border-dark-border dark:text-text-dark-tertiary dark:hover:text-text-dark-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <section className="rounded-xl border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-[#0c141f]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-light-border bg-light-muted text-xl dark:border-dark-border dark:bg-dark-muted">
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

            <div className="mt-4 rounded-lg border border-light-border bg-light-muted p-3 dark:border-dark-border dark:bg-dark-muted">
              <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
                <ShieldAlert className="h-3.5 w-3.5" />
                Stakes
              </p>
              <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {mission.stakes}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-[#0c141f]">
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

          <section className="rounded-xl border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-[#0c141f]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
              Mission Flow
            </p>
            <div className="mt-3 space-y-3">
              {ACTS.map((act, index) => (
                <div
                  key={act.title}
                  className="rounded-lg border border-light-border bg-light-bg p-3 dark:border-dark-border dark:bg-[#101a27]"
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

          <section className="rounded-xl border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-[#0c141f]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
              Team
            </p>
            <div className="mt-3 space-y-2">
              {TEAM.map((member) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between rounded-lg border border-light-border bg-light-bg px-3 py-2 text-sm dark:border-dark-border dark:bg-[#101a27]"
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

          <section className="rounded-xl border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-[#0c141f]">
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

            {!isLocked && !mission.completed ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  onUpdateMissionState(mission.slug, 'completed');
                  onClose();
                }}
              >
                Mark Complete
              </button>
            ) : null}

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
    <div className="rounded-lg border border-light-border bg-light-bg px-3 py-2 dark:border-dark-border dark:bg-[#101a27]">
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
    <div className="rounded-lg border border-light-border bg-light-bg px-2 py-2 dark:border-dark-border dark:bg-[#101a27]">
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
          headers: { 'Content-Type': 'application/json' },
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
        <header className="flex flex-col gap-3">
          <p className="data-mono text-xs uppercase tracking-[0.35em] text-brand-500/80">
            GridOS Mission Control
          </p>
          <h1 className="text-4xl font-semibold text-text-light-primary dark:text-text-dark-primary md:text-5xl font-display">
            Missions
          </h1>
          <p className="max-w-2xl text-sm text-text-light-secondary dark:text-text-dark-secondary md:text-base">
            Real infrastructure incidents with production-style constraints. Browse fast,
            then open a full briefing only when you decide to run one.
          </p>
        </header>

        <section className="card flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-light-border bg-light-surface px-3 py-2 text-sm font-medium text-text-light-primary transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-primary dark:hover:border-brand-400 dark:hover:text-brand-300"
            >
              <SlidersHorizontal className="h-4 w-4 text-brand-500" />
              Filter Panel
              {filter !== 'all' ? (
                <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-500">
                  1 active
                </span>
              ) : null}
            </button>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
                <span>{stats.active} active</span>
                <span>•</span>
                <span>{stats.locked} locked</span>
                <span>•</span>
                <span>Showing {filteredMissions.length} of {missions.length}</span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  {stats.completed} of {stats.total} completed
                </p>
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${stats.completionPct}%` }}
                  />
                </div>
              </div>
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
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMissions.map((mission) => (
              <MissionCard
                key={mission.slug}
                mission={mission}
                onOpen={handleSelectMission}
              />
            ))}
          </section>
        ) : (
          <section className="card p-10 text-center">
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              No missions match this filter.
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
