import Link from 'next/link';
import type { CSSProperties } from 'react';
import {
  ChevronRight,
  Flag,
  Layers3,
  NotebookPen,
  type LucideIcon
} from 'lucide-react';
import { MISSIONS } from '@/data/missions';
import { NOTEBOOKS } from '@/data/notebooks';
import { createClient } from '@/lib/supabase/server';
import type { Topic } from '@/types/progress';

interface TaskLane {
  id: 'notebooks' | 'missions' | 'flashcards';
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  accentRgb: string;
  progressPct: number;
  progressValue: string;
}

interface UserProgressRow {
  topic_progress: Record<string, unknown> | null;
}

interface UserMissionRow {
  mission_slug: string;
  state: 'not_started' | 'in_progress' | 'completed';
  updated_at: string | null;
}

const TRACK_TOPICS: Topic[] = ['pyspark', 'fabric'];
const TOPIC_ACCENT_RGB_BY_TOPIC: Record<Topic, string> = {
  pyspark: '245,158,11',
  fabric: '34,185,153',
  airflow: '226,77,66'
};
const MISSION_ACCENT_BY_SLUG = new Map(
  MISSIONS.map((mission) => [mission.slug, mission.accentRgb])
);

const toRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

const clampPct = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const toIsoTimestamp = (value: unknown) => {
  if (typeof value !== 'string') return null;
  return Number.isFinite(Date.parse(value)) ? value : null;
};

const resolveLatestPracticeTopic = (
  topicProgress: Record<string, unknown>
): { topic: Topic; updatedAt: string; attempted: number; completionPct: number | null } | null => {
  const candidates = TRACK_TOPICS.map((topic) => {
    const topicStats = toRecord(topicProgress[topic]);
    const updatedAt = toIsoTimestamp(topicStats.lastAttempted);
    if (!updatedAt) {
      return null;
    }

    const attempted = Math.max(0, Math.floor(Number(topicStats.total ?? 0)));
    const completionPctRaw = Number(topicStats.completionPct);
    const completionPct = Number.isFinite(completionPctRaw)
      ? clampPct(completionPctRaw)
      : null;

    return {
      topic,
      updatedAt,
      attempted,
      completionPct
    };
  }).filter(
    (
      candidate
    ): candidate is {
      topic: Topic;
      updatedAt: string;
      attempted: number;
      completionPct: number | null;
    } => candidate !== null
  );

  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
  )[0];
};

export default async function TasksPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const [userProgressResult, userMissionsResult] = user
    ? await Promise.all([
        supabase
          .from('user_progress')
          .select('topic_progress')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('user_missions')
          .select('mission_slug,state,updated_at')
          .eq('user_id', user.id)
          .neq('state', 'not_started')
      ])
    : [{ data: null }, { data: [] }];

  const userProgress = (userProgressResult.data ?? null) as UserProgressRow | null;
  const userMissions = (userMissionsResult.data ?? []) as UserMissionRow[];
  const topicProgress = toRecord(userProgress?.topic_progress);

  const notebooksProgress = toRecord(topicProgress.notebooks);
  const completedNotebookIds = Array.isArray(notebooksProgress.completed_notebook_ids)
    ? notebooksProgress.completed_notebook_ids.filter(
        (value): value is string => typeof value === 'string'
      )
    : [];
  const notebookCompletedCount = Math.max(
    completedNotebookIds.length,
    Math.floor(Number(notebooksProgress.completed_notebooks_count ?? 0))
  );
  const notebookTotalCount = Math.max(
    NOTEBOOKS.length,
    Math.floor(
      Number(
        notebooksProgress.total_notebooks_count ??
          notebooksProgress.notebooks_total ??
          notebooksProgress.total
      )
    ) || 0
  );
  const notebooksProgressPct =
    notebookTotalCount > 0
      ? clampPct((Math.min(notebookCompletedCount, notebookTotalCount) / notebookTotalCount) * 100)
      : 0;

  const latestMission = [...userMissions]
    .sort((left, right) => {
      const leftTimestamp = left.updated_at ? Date.parse(left.updated_at) : 0;
      const rightTimestamp = right.updated_at ? Date.parse(right.updated_at) : 0;
      return rightTimestamp - leftTimestamp;
    })[0];
  const completedMissionCount = userMissions.filter(
    (mission) => mission.state === 'completed'
  ).length;
  const missionsProgressPct =
    MISSIONS.length > 0
      ? clampPct((Math.min(completedMissionCount, MISSIONS.length) / MISSIONS.length) * 100)
      : 0;
  const latestMissionAccent =
    (latestMission ? MISSION_ACCENT_BY_SLUG.get(latestMission.mission_slug) : null) ??
    '245,158,11';

  const latestPracticeTopic = resolveLatestPracticeTopic(topicProgress);
  const flashcardsProgressPct = latestPracticeTopic?.completionPct ?? 0;
  const flashcardsAttempted = latestPracticeTopic?.attempted ?? 0;

  const taskLanes: TaskLane[] = [
    {
      id: 'notebooks',
      title: 'Notebooks',
      description: 'Audit production notebooks and resolve line-level reliability issues.',
      href: '/practice/notebooks',
      cta: notebookCompletedCount > 0 ? 'Resume notebooks' : 'Open notebooks',
      icon: NotebookPen,
      accentRgb: '34,185,153',
      progressPct: notebooksProgressPct,
      progressValue: `${Math.min(notebookCompletedCount, notebookTotalCount)}/${notebookTotalCount} reviewed`
    },
    {
      id: 'missions',
      title: 'Missions',
      description: 'Run incident scenarios and continue the latest active operations drill.',
      href: latestMission ? `/missions/${latestMission.mission_slug}` : '/missions',
      cta:
        latestMission?.state === 'in_progress'
          ? 'Resume mission'
          : latestMission?.state === 'completed'
            ? 'Replay mission'
            : 'Open missions',
      icon: Flag,
      accentRgb: latestMissionAccent,
      progressPct: missionsProgressPct,
      progressValue: `${completedMissionCount}/${MISSIONS.length} completed`
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      description: 'Train high-speed recall and keep your latest theory track fresh.',
      href: latestPracticeTopic ? `/practice/${latestPracticeTopic.topic}` : '/flashcards',
      cta: flashcardsAttempted > 0 ? 'Resume flashcards' : 'Open flashcards',
      icon: Layers3,
      accentRgb: latestPracticeTopic
        ? TOPIC_ACCENT_RGB_BY_TOPIC[latestPracticeTopic.topic]
        : '96,165,250',
      progressPct: flashcardsProgressPct,
      progressValue:
        flashcardsAttempted > 0
          ? `${flashcardsAttempted} attempted`
          : 'No recall attempts yet'
    }
  ];

  const LANE_META: Record<string, { classification: string; label: string; serial: string }> = {
    notebooks: {
      classification: 'CLASSIFIED',
      label: 'INTEL REVIEW',
      serial: `NB-${String(notebookCompletedCount).padStart(4, '0')}`
    },
    missions: {
      classification: 'RESTRICTED',
      label: 'LIVE OPERATION',
      serial: `OP-${String(completedMissionCount).padStart(4, '0')}`
    },
    flashcards: {
      classification: 'ACTIVE DUTY',
      label: 'TRAINING DRILL',
      serial: `TR-${String(flashcardsAttempted).padStart(4, '0')}`
    }
  };

  return (
    <main className="min-h-screen bg-[#06080a] pb-24 pt-8 lg:pb-10">
      {/* Scanline grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
          backgroundSize: '100% 3px'
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4">
        {/* Page header */}
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#1a2420]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-[#2e4a40]">
              OPS-BOARD · TASK-SELECT
            </span>
            <div className="h-px flex-1 bg-[#1a2420]" />
          </div>
          <h1 className="font-mono text-3xl font-black uppercase tracking-[0.06em] text-[#deeee6]">
            Assignments
          </h1>
          <p className="mt-1 font-mono text-xs tracking-[0.12em] text-[#3a5a4a]">
            Select a task type · Commence operations
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {taskLanes.map((lane) => {
            const Icon = lane.icon;
            const meta = LANE_META[lane.id] ?? { classification: 'ACTIVE', label: 'TASK', serial: 'XX-0000' };
            const accent = `rgb(${lane.accentRgb})`;
            const accentDim = `rgba(${lane.accentRgb},0.15)`;
            const accentGlow = `rgba(${lane.accentRgb},0.35)`;
            const filledBlocks = Math.round((lane.progressPct / 100) * 10);

            return (
              <Link
                key={lane.id}
                href={lane.href}
                className="group relative flex flex-col overflow-hidden rounded-none transition-all duration-300 hover:-translate-y-1"
                style={{ '--accent': accent } as CSSProperties}
              >
                {/* Card body */}
                <div
                  className="relative flex flex-1 flex-col overflow-hidden border bg-[#0c0f0e]"
                  style={{
                    borderColor: `rgba(${lane.accentRgb},0.22)`,
                    boxShadow: `0 0 0 1px rgba(${lane.accentRgb},0.08), 0 24px 60px -20px rgba(${lane.accentRgb},0.18), inset 0 1px 0 rgba(255,255,255,0.04)`
                  }}
                >
                  {/* Top accent stripe */}
                  <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${accent}, transparent 80%)` }} />

                  {/* Corner targeting brackets */}
                  <span className="absolute left-2.5 top-2.5 h-5 w-5 border-l-2 border-t-2 transition-all duration-300 group-hover:h-6 group-hover:w-6" style={{ borderColor: accent }} />
                  <span className="absolute right-2.5 top-2.5 h-5 w-5 border-r-2 border-t-2 transition-all duration-300 group-hover:h-6 group-hover:w-6" style={{ borderColor: accent }} />
                  <span className="absolute bottom-2.5 left-2.5 h-5 w-5 border-b-2 border-l-2 transition-all duration-300 group-hover:h-6 group-hover:w-6" style={{ borderColor: accent }} />
                  <span className="absolute bottom-2.5 right-2.5 h-5 w-5 border-b-2 border-r-2 transition-all duration-300 group-hover:h-6 group-hover:w-6" style={{ borderColor: accent }} />

                  {/* Inner glow bg */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `radial-gradient(ellipse at 50% 30%, rgba(${lane.accentRgb},0.07), transparent 65%)` }}
                  />

                  {/* Classification + serial row */}
                  <div className="flex items-center justify-between px-4 pt-4">
                    <span
                      className="font-mono text-[8px] font-bold uppercase tracking-[0.3em]"
                      style={{ color: accent }}
                    >
                      ▶ {meta.classification}
                    </span>
                    <span className="font-mono text-[8px] tracking-[0.2em] text-[#2e4a40]">
                      {meta.serial}
                    </span>
                  </div>

                  {/* Icon hero area */}
                  <div className="flex flex-col items-center justify-center px-6 py-7">
                    <div
                      className="relative flex h-20 w-20 items-center justify-center"
                    >
                      {/* Glow disc behind icon */}
                      <div
                        className="absolute inset-0 rounded-full blur-xl transition-all duration-300 group-hover:scale-125"
                        style={{ backgroundColor: accentGlow }}
                      />
                      {/* Hex ring */}
                      <div
                        className="absolute inset-0 rounded-full border-2"
                        style={{ borderColor: `rgba(${lane.accentRgb},0.3)` }}
                      />
                      <div
                        className="absolute inset-2 rounded-full border"
                        style={{ borderColor: `rgba(${lane.accentRgb},0.15)` }}
                      />
                      <Icon className="relative h-9 w-9" style={{ color: accent }} />
                    </div>

                    {/* Label below icon */}
                    <span
                      className="mt-4 font-mono text-[9px] font-bold uppercase tracking-[0.35em]"
                      style={{ color: `rgba(${lane.accentRgb},0.6)` }}
                    >
                      {meta.label}
                    </span>
                  </div>

                  {/* Title + description */}
                  <div className="px-5 pb-3">
                    <h2 className="font-mono text-xl font-black uppercase tracking-[0.06em] text-[#deeee6]">
                      {lane.title}
                    </h2>
                    <p className="mt-2 font-mono text-[11px] leading-5 tracking-[0.02em] text-[#3a5a4a]">
                      {lane.description}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="mx-5 my-3 h-px" style={{ background: `linear-gradient(90deg, ${accent}30, transparent)` }} />

                  {/* Segmented progress bar */}
                  <div className="px-5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-[#2e4a40]">
                        Completion
                      </span>
                      <span
                        className="font-mono text-[10px] font-bold tabular-nums"
                        style={{ color: accent }}
                      >
                        {lane.progressPct}%
                      </span>
                    </div>
                    <div className="flex gap-[3px]">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div
                          key={i}
                          className="h-1.5 flex-1 transition-all duration-500"
                          style={{
                            backgroundColor: i < filledBlocks
                              ? accent
                              : `rgba(${lane.accentRgb},0.12)`,
                            boxShadow: i < filledBlocks ? `0 0 4px ${accentGlow}` : 'none'
                          }}
                        />
                      ))}
                    </div>
                    <p className="mt-1.5 font-mono text-[9px] tracking-[0.1em] text-[#2a4038]">
                      {lane.progressValue}
                    </p>
                  </div>

                  {/* CTA button */}
                  <div className="p-5 pt-4">
                    <div
                      className="relative flex w-full items-center justify-between overflow-hidden px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-200 group-hover:tracking-[0.24em]"
                      style={{
                        border: `1px solid rgba(${lane.accentRgb},0.4)`,
                        color: accent,
                        background: accentDim
                      }}
                    >
                      <span className="relative z-10">{lane.cta}</span>
                      <ChevronRight className="relative z-10 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      {/* Button sweep on hover */}
                      <div
                        className="absolute inset-0 -translate-x-full transition-transform duration-300 group-hover:translate-x-0"
                        style={{ background: `linear-gradient(90deg, transparent, rgba(${lane.accentRgb},0.1))` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer serial line */}
        <div className="mt-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#111a16]" />
          <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-[#1e3028]">
            SGR · STABLE-GRID · OPS-CONSOLE
          </span>
          <div className="h-px flex-1 bg-[#111a16]" />
        </div>
      </div>
    </main>
  );
}
