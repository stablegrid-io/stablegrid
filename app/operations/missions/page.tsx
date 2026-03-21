'use client';

import type { CSSProperties } from 'react';
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Lock,
  MapPin,
  ShieldAlert,
  SlidersHorizontal,
  X,
  Zap
} from 'lucide-react';
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle';
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

const DIFFICULTY_BADGE: Record<string, { border: string; bg: string; text: string }> = {
  Easy:   { border: 'rgba(34,185,154,0.3)',  bg: 'rgba(34,185,154,0.07)',  text: '#22b99a' },
  Medium: { border: 'rgba(230,160,40,0.3)',  bg: 'rgba(230,160,40,0.07)',  text: '#e6a028' },
  Hard:   { border: 'rgba(220,60,60,0.3)',   bg: 'rgba(220,60,60,0.07)',   text: '#dc3c3c' },
  Expert: { border: 'rgba(180,80,220,0.3)',  bg: 'rgba(180,80,220,0.07)',  text: '#b450dc' },
};

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
      className="group relative overflow-hidden rounded-[10px] border text-left transition-all duration-300 hover:-translate-y-0.5 disabled:!cursor-not-allowed disabled:!opacity-100"
      style={{
        ...cardVars,
        background: 'rgba(12,17,14,0.85)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.06)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.7)'
      }}
    >
      {/* Top accent stripe */}
      <div className="h-[1px] w-full" style={{ background: `linear-gradient(90deg, rgba(var(--mission-accent),0.4), transparent 60%)` }} />

      {/* Corner brackets */}
      <span className="absolute left-3 top-3 h-4 w-4 border-l border-t" style={{ borderColor: `rgba(var(--mission-accent),0.3)` }} />
      <span className="absolute right-3 top-3 h-4 w-4 border-r border-t" style={{ borderColor: `rgba(var(--mission-accent),0.3)` }} />
      <span className="absolute bottom-3 left-3 h-4 w-4 border-b border-l" style={{ borderColor: `rgba(var(--mission-accent),0.3)` }} />
      <span className="absolute bottom-3 right-3 h-4 w-4 border-b border-r" style={{ borderColor: `rgba(var(--mission-accent),0.3)` }} />

      <div className="p-6">
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-[3px] border px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em]"
              style={{
                borderColor: `rgba(var(--mission-accent),0.34)`,
                background: `rgba(var(--mission-accent),0.08)`,
                color: `rgb(var(--mission-accent))`
              }}
            >
              <span className="text-sm leading-none">{mission.icon}</span>
              Mission {String(index + 1).padStart(2, '0')}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[2.25rem] font-bold leading-none tracking-[-0.02em] text-white">
                {mission.codename}
              </h2>
              <span
                className="rounded-[3px] border px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em]"
                style={{
                  borderColor: `rgba(var(--mission-accent),0.34)`,
                  background: `rgba(var(--mission-accent),0.08)`,
                  color: `rgb(var(--mission-accent))`
                }}
              >
                {mission.difficulty}
              </span>
            </div>

            <p className="mt-4 max-w-2xl text-[13px] leading-[1.75] text-[#8ab8ae]">
              {mission.summary}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span
                className="rounded-[3px] border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#3a5a4a]"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
              >
                {mission.tagline}
              </span>
            </div>
          </div>

          <div
            className="w-full max-w-sm rounded-[8px] border p-5"
            style={{
              background: 'rgba(8,12,10,0.7)',
              borderColor: `rgba(var(--mission-accent),0.14)`
            }}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#3a5a4a]">
                Mission Status
              </span>
              <span className="text-xl font-bold text-white">
                {statusValue}
              </span>
            </div>

            {/* Segmented progress bar */}
            <div className="flex gap-[3px]">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[6px] flex-1 rounded-[2px]"
                  style={{
                    background: i < Math.round(progressValue / 10)
                      ? `rgb(var(--mission-accent))`
                      : 'rgba(255,255,255,0.06)'
                  }}
                />
              ))}
            </div>

            <p className="mt-4 text-[13px] leading-[1.75] text-[#8ab8ae]">
              {statusCopy}
            </p>
          </div>
        </div>

        <div
          className="relative mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex flex-wrap gap-2">
            {bottomChips.map((chip) => (
              <span
                key={`${mission.slug}-${chip}`}
                className="rounded-[4px] border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#3a5a4a]"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
              >
                {chip}
              </span>
            ))}
          </div>

          <span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#8ab8ae] transition-transform group-hover:translate-x-0.5">
            {ctaLabel}
            {!locked ? <ChevronRight className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </span>
        </div>
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
  const missionPath = `/operations/missions/${mission.slug}`;
  const diffStyle = DIFFICULTY_BADGE[mission.difficulty] ?? DIFFICULTY_BADGE.Medium;

  return (
    <>
      <button
        type="button"
        aria-label="Close mission details"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
      />

      <aside
        className="fixed inset-y-0 left-0 z-50 w-full max-w-md overflow-y-auto border-r shadow-2xl"
        style={{
          background: 'rgba(8,12,10,0.98)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(255,255,255,0.06)'
        }}
      >
        {/* Top gradient stripe */}
        <div className="h-[2px] bg-gradient-to-r from-[#22b99a] to-transparent" />

        <div
          className="sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4 backdrop-blur"
          style={{
            background: 'rgba(8,12,10,0.97)',
            borderColor: 'rgba(255,255,255,0.06)'
          }}
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#2a4038]">
            Mission Briefing
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[4px] border p-2 text-[#3a5a4a] transition hover:text-[#8ab8ae]"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <section
            className="relative overflow-hidden rounded-[8px] border p-4"
            style={{
              background: 'rgba(12,17,14,0.85)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(255,255,255,0.06)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.7)'
            }}
          >
            <div className="h-[1px] w-full mb-3" style={{ background: 'linear-gradient(90deg, rgba(34,185,154,0.4), transparent 60%)' }} />
            <span className="absolute left-3 top-3 h-4 w-4 border-l border-t" style={{ borderColor: 'rgba(34,185,154,0.3)' }} />
            <span className="absolute right-3 top-3 h-4 w-4 border-r border-t" style={{ borderColor: 'rgba(34,185,154,0.3)' }} />
            <span className="absolute bottom-3 left-3 h-4 w-4 border-b border-l" style={{ borderColor: 'rgba(34,185,154,0.3)' }} />
            <span className="absolute bottom-3 right-3 h-4 w-4 border-b border-r" style={{ borderColor: 'rgba(34,185,154,0.3)' }} />

            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-[4px] border text-xl"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}
                >
                  {mission.icon}
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#2a4038]">
                    Operation
                  </p>
                  <h2 className="text-lg font-bold text-white">
                    {mission.codename}
                  </h2>
                </div>
              </div>
              <span
                className="rounded-[3px] border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em]"
                style={{
                  borderColor: diffStyle.border,
                  background: diffStyle.bg,
                  color: diffStyle.text
                }}
              >
                {mission.difficulty}
              </span>
            </div>

            <p className="text-[13px] leading-[1.75] text-[#8ab8ae]">
              {mission.summary}
            </p>

            <div
              className="mt-4 rounded-[4px] border p-3"
              style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <p className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.25em] text-[#2a4038]">
                <ShieldAlert className="h-3.5 w-3.5" />
                Stakes
              </p>
              <p className="mt-1 text-[13px] leading-[1.75] text-[#8ab8ae]">
                {mission.stakes}
              </p>
            </div>
          </section>

          <section
            className="rounded-[8px] border p-4"
            style={{
              background: 'rgba(12,17,14,0.85)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(255,255,255,0.06)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.7)'
            }}
          >
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

          <section
            className="rounded-[8px] border p-4"
            style={{
              background: 'rgba(12,17,14,0.85)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(255,255,255,0.06)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.7)'
            }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#2a4038]">
              Mission Flow
            </p>
            <div className="mt-3 space-y-3">
              {ACTS.map((act, index) => (
                <div
                  key={act.title}
                  className="rounded-[4px] border p-3"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#2a4038]">
                    Act {index + 1} · {act.duration}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {act.title}
                  </p>
                  <p className="mt-1 text-[13px] leading-[1.75] text-[#8ab8ae]">
                    {act.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            className="rounded-[8px] border p-4"
            style={{
              background: 'rgba(12,17,14,0.85)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(255,255,255,0.06)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.7)'
            }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#2a4038]">
              Team
            </p>
            <div className="mt-3 space-y-2">
              {TEAM.map((member) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between rounded-[4px] border px-3 py-2 text-sm"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
                >
                  <span className="font-medium text-white">
                    {member.name}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#3a5a4a]">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section
            className="rounded-[8px] border p-4"
            style={{
              background: 'rgba(12,17,14,0.85)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(255,255,255,0.06)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.7)'
            }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#2a4038]">
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

            <Link href={`/operations/missions/${mission.slug}`} className="btn btn-secondary">
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
    <div
      className="rounded-[4px] border px-3 py-2"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#2a4038]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-white">
        {value}
      </p>
    </div>
  );
});

const RewardCell = memo(function RewardCell({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[4px] border px-2 py-2"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#2a4038]">
        {label}
      </p>
      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#8ab8ae]">
        {value}
      </p>
    </div>
  );
});

export default function MissionsPage() {
  const addXP = useProgressStore((state) => state.addXP);
  const [filter, setFilter] = useState<MissionFilter>('all');
  const deferredFilter = useDeferredValue(filter);
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
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
    <main className="min-h-screen bg-[#060809] px-6 pb-16 pt-10">
      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
          backgroundSize: '100% 3px'
        }}
      />
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 opacity-[0.04]"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(34,185,154,1), transparent 70%)' }}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="max-w-4xl">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.35em] text-[#2a4038]">
            Mission Gallery
          </p>
          <h1 className="text-[2.25rem] font-bold leading-none tracking-[-0.02em] text-white">
            Missions
          </h1>
          <p className="mt-3 max-w-3xl text-[13px] leading-[1.75] text-[#8ab8ae] md:text-[13px]">
            Real infrastructure incidents with production-style constraints. Browse
            fast, then open a full briefing only when you decide to run one.
          </p>
        </header>

        <section
          className="rounded-[10px] border p-3"
          style={{
            background: 'rgba(12,17,14,0.85)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(255,255,255,0.06)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.7)'
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-[4px] border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#8ab8ae] transition-colors hover:border-[#22b99a]/40 hover:text-[#22b99a]"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
              >
                <SlidersHorizontal className="h-4 w-4 text-[#22b99a]" />
                Filters
                {filter !== 'all' ? (
                  <span
                    className="rounded-[3px] border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#22b99a]"
                    style={{ borderColor: 'rgba(34,185,154,0.4)', background: 'rgba(34,185,154,0.1)' }}
                  >
                    1 active
                  </span>
                ) : null}
              </button>
              <ViewToggle view={viewMode} onChange={setViewMode} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-[4px] border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#3a5a4a]"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
              >
                Showing {filteredMissions.length} of {missions.length} missions
              </span>
              <span
                className="rounded-[4px] border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#3a5a4a]"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
              >
                {stats.active} available
              </span>
              <span
                className="rounded-[4px] border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#3a5a4a]"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
              >
                {stats.locked} locked
              </span>
              <span
                className="rounded-[4px] border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#3a5a4a]"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
              >
                Filter: {FILTERS.find((option) => option.id === filter)?.label ?? 'All'}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#3a5a4a]">
              {stats.completed}/{stats.total} missions completed
            </div>
            <div className="flex items-center gap-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#3a5a4a]">
                Completion
              </p>
              {/* Segmented completion progress bar */}
              <div className="flex gap-[3px]">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[6px] w-4 rounded-[2px]"
                    style={{
                      background: i < Math.round(stats.completionPct / 10)
                        ? '#22b99a'
                        : 'rgba(255,255,255,0.06)'
                    }}
                  />
                ))}
              </div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8ab8ae]">
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
          className={`fixed inset-y-0 left-0 z-50 w-[380px] max-w-[94vw] border-r p-4 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-in-out ${
            isFilterPanelOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
          }`}
          style={{
            background: 'rgba(8,12,10,0.98)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(255,255,255,0.06)'
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#2a4038]">
              Filters
            </h2>
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(false)}
              className="rounded-[4px] p-1.5 text-[#3a5a4a] transition-colors hover:text-[#8ab8ae]"
              aria-label="Close filter panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <section
            className="flex h-[calc(100%-2.2rem)] flex-col rounded-[10px] border p-4"
            style={{
              background: 'rgba(12,17,14,0.85)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(255,255,255,0.06)'
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-[#22b99a]">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter Panel
              </div>
              <button
                type="button"
                onClick={() => { setFilter('all'); setIsFilterPanelOpen(false); }}
                className="inline-flex items-center gap-1 rounded-[4px] border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#3a5a4a] transition-colors hover:border-[#22b99a]/40 hover:text-[#22b99a]"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1">
              <section
                className="rounded-[8px] border p-3"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#2a4038]">
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
                        className="w-full rounded-[4px] border p-2.5 text-left transition"
                        style={{
                          borderColor: selected ? 'rgba(34,185,154,0.3)' : 'rgba(255,255,255,0.06)',
                          background: selected ? 'rgba(34,185,154,0.06)' : 'transparent'
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white">
                              {option.label}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#8ab8ae]">
                              {descriptions[option.id]}
                            </p>
                          </div>
                          <span
                            className="rounded-[3px] border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]"
                            style={{
                              borderColor: selected ? 'rgba(34,185,154,0.4)' : 'rgba(255,255,255,0.06)',
                              background: selected ? 'rgba(34,185,154,0.1)' : 'rgba(255,255,255,0.02)',
                              color: selected ? '#22b99a' : '#3a5a4a'
                            }}
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
          viewMode === 'gallery' ? (
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
            <section
              className="overflow-hidden rounded-[10px] border"
              style={{
                background: 'rgba(12,17,14,0.85)',
                backdropFilter: 'blur(20px)',
                borderColor: 'rgba(255,255,255,0.06)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.7)'
              }}
            >
              {/* Header row */}
              <div
                className="grid grid-cols-[2rem_2rem_1fr_auto_auto_auto] items-center gap-4 border-b px-4 py-2.5"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                {['Status', '#', 'Title', 'Difficulty', 'Duration', 'Reward'].map((col) => (
                  <span key={col} className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#2a4038] first:col-span-1">
                    {col}
                  </span>
                ))}
              </div>
              {filteredMissions.map((mission, index) => {
                const locked = mission.status === 'locked';
                const difficultyColor =
                  mission.difficulty === 'Medium' ? '#e6a028' :
                  mission.difficulty === 'Hard' ? '#dc3c3c' :
                  '#b450dc';
                return (
                  <button
                    key={mission.slug}
                    type="button"
                    onClick={() => { if (!locked) handleSelectMission(mission); }}
                    disabled={locked}
                    className="grid w-full grid-cols-[2rem_2rem_1fr_auto_auto_auto] items-center gap-4 border-b px-4 py-3 text-left transition last:border-0 hover:bg-white/[0.02] disabled:cursor-not-allowed"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <span className="flex items-center">
                      {mission.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-[#22b99a]" />
                      ) : locked ? (
                        <Lock className="h-4 w-4 text-[#2a4038]" />
                      ) : (
                        <Circle className="h-4 w-4 text-[#2a4038]" />
                      )}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#3a5a4a] tabular-nums">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate text-sm font-medium text-white">
                      {mission.icon} {mission.codename}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: difficultyColor }}>
                      {mission.difficulty}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#3a5a4a]">
                      {mission.duration}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#3a5a4a]">
                      {formatKwh(getMissionRewardKwh(mission.difficulty), 1)}
                    </span>
                  </button>
                );
              })}
            </section>
          )
        ) : (
          <section
            className="rounded-[10px] border p-10 text-center"
            style={{
              background: 'rgba(12,17,14,0.85)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(255,255,255,0.06)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.7)'
            }}
          >
            <p className="text-base font-bold text-white">
              No missions match this filter
            </p>
            <p className="mt-1 text-[13px] leading-[1.75] text-[#8ab8ae]">
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
