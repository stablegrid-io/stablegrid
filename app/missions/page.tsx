'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Lock,
  MapPin,
  ShieldAlert,
  X,
  Zap
} from 'lucide-react';
import { MISSIONS, type MissionDefinition } from '@/data/missions';
import { mergeWithDefaultMissions } from '@/lib/missions';
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

function MissionCard({
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
      onClick={() => {
        if (!locked) {
          onOpen(mission);
        }
      }}
      disabled={locked}
      className="group relative w-full overflow-hidden rounded-2xl border border-light-border/90 bg-light-surface p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 dark:border-dark-border dark:bg-[#0a1019] dark:hover:shadow-black/30 disabled:!cursor-not-allowed disabled:!opacity-[0.55]"
      style={{
        borderColor: `rgba(${mission.accentRgb}, 0.22)`
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(140deg, rgba(255,255,255,0.98), rgba(248,250,255,0.96) 65%), radial-gradient(circle at top right, rgba(' +
            mission.accentRgb +
            ', 0.16), transparent 58%)'
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          background:
            'linear-gradient(145deg, rgba(8,12,20,0.96), rgba(7,10,16,0.95) 70%), radial-gradient(circle at top right, rgba(' +
            mission.accentRgb +
            ', 0.24), transparent 60%)'
        }}
      />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl border text-xl"
            style={{
              borderColor: `rgba(${mission.accentRgb}, 0.28)`,
              backgroundColor: `rgba(${mission.accentRgb}, 0.12)`
            }}
          >
            {mission.icon}
          </div>

          <div className="flex items-center gap-2">
            {mission.completed ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-success-300 bg-success-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-success-700 dark:border-success-700/60 dark:bg-success-900/30 dark:text-success-300">
                <CheckCircle2 className="h-3 w-3" />
                Done
              </span>
            ) : mission.status === 'locked' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
                <Lock className="h-3 w-3" />
                Locked
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{
                  borderColor: `rgba(${mission.accentRgb}, 0.35)`,
                  backgroundColor: `rgba(${mission.accentRgb}, 0.12)`,
                  color: mission.accentColor
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: mission.accentColor }}
                />
                Open
              </span>
            )}
          </div>
        </div>

        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-light-primary dark:text-[#f5f8ff]">
          {mission.codename}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-text-light-secondary dark:text-[#9bb1c7]">
          {mission.tagline}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {mission.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.07em]"
              style={{
                borderColor: `rgba(${mission.accentRgb}, 0.28)`,
                backgroundColor: `rgba(${mission.accentRgb}, 0.1)`,
                color: mission.accentColor
              }}
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-light-border/80 pt-3 text-xs text-text-light-tertiary dark:border-dark-border dark:text-text-dark-tertiary">
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
          <span
            className="inline-flex items-center gap-1 font-semibold"
            style={{ color: mission.accentColor }}
          >
            <Zap className="h-3.5 w-3.5" />
            {mission.xp.toLocaleString()} XP
          </span>
        </div>
      </div>
    </button>
  );
}

function MissionDrawer({
  mission,
  onClose,
  onUpdateMissionState
}: {
  mission: MissionDefinition;
  onClose: () => void;
  onUpdateMissionState: (missionSlug: string, state: MissionState) => void;
}) {
  const isLocked = mission.status === 'locked';

  return (
    <>
      <button
        type="button"
        aria-label="Close mission details"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
      />

      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-light-border bg-light-bg shadow-2xl dark:border-dark-border dark:bg-[#070d15]">
        <div
          className="h-1"
          style={{
            background: `linear-gradient(90deg, ${mission.accentColor}, transparent)`
          }}
        />

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
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl border text-xl"
                  style={{
                    borderColor: `rgba(${mission.accentRgb}, 0.32)`,
                    backgroundColor: `rgba(${mission.accentRgb}, 0.12)`
                  }}
                >
                  {mission.icon}
                </div>
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: mission.accentColor }}
                  >
                    Operation
                  </p>
                  <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                    {mission.codename}
                  </h2>
                </div>
              </div>
              <span
                className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{
                  borderColor: `rgba(${mission.accentRgb}, 0.35)`,
                  backgroundColor: `rgba(${mission.accentRgb}, 0.12)`,
                  color: mission.accentColor
                }}
              >
                {mission.difficulty}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
              {mission.summary}
            </p>

            <div
              className="mt-4 rounded-lg border p-3"
              style={{
                borderColor: `rgba(${mission.accentRgb}, 0.26)`,
                backgroundColor: `rgba(${mission.accentRgb}, 0.08)`
              }}
            >
              <p
                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: mission.accentColor }}
              >
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
              <MetaItem label="XP" value={`${mission.xp.toLocaleString()} XP`} />
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
              <RewardCell label="XP" value={`${mission.xp.toLocaleString()}`} />
              <RewardCell label="Badge" value={mission.rewardBadge} />
              <RewardCell label="Title" value={mission.rewardTitle} />
            </div>
          </section>

          <div className="flex items-center gap-2 pt-2">
            {mission.workspaceTaskId && !isLocked ? (
              <Link
                href={`/workspace/${mission.workspaceTaskId}`}
                className="btn btn-primary flex-1"
                onClick={() => onUpdateMissionState(mission.slug, 'in_progress')}
              >
                {mission.completed ? 'Replay Mission' : 'Accept Mission'}
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
}

function MetaItem({ label, value }: { label: string; value: string }) {
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
}

function RewardCell({ label, value }: { label: string; value: string }) {
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
}

export default function MissionsPage() {
  const [filter, setFilter] = useState<MissionFilter>('all');
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
            xpAwarded: row.xp_awarded
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
        await fetch('/api/missions/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            missionSlug,
            state,
            unlocked: true
          }),
          keepalive: true
        });
      } catch {
        // Ignore network failures and keep optimistic state.
      }
    },
    []
  );

  const filteredMissions = useMemo(() => {
    return missions.filter((mission) => {
      if (filter === 'available') {
        return mission.status === 'available' && !mission.completed;
      }
      if (filter === 'completed') {
        return mission.completed;
      }
      return true;
    });
  }, [filter, missions]);

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
    <main className="min-h-screen bg-light-bg px-6 pb-16 pt-10 dark:bg-[#060b12]">
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
            <div className="flex items-center gap-4">
              <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                {stats.completed} of {stats.total} completed
              </p>
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-success-500 to-brand-500"
                  style={{ width: `${stats.completionPct}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
                <span>{stats.active} active</span>
                <span>•</span>
                <span>{stats.locked} locked</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {FILTERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFilter(option.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                    filter === option.id
                      ? 'bg-text-light-primary text-white dark:bg-white dark:text-dark-bg'
                      : 'border border-light-border bg-light-surface text-text-light-tertiary hover:text-text-light-primary dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-tertiary dark:hover:text-text-dark-primary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {filteredMissions.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMissions.map((mission) => (
              <MissionCard
                key={mission.slug}
                mission={mission}
                onOpen={setSelectedMission}
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
          onClose={() => setSelectedMission(null)}
          onUpdateMissionState={updateMissionState}
        />
      )}
    </main>
  );
}
