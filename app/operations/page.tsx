import Link from 'next/link';
import {
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
    <main className="min-h-screen pb-24 pt-8 lg:pb-10">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page header — Stitch Assignments style */}
        <header className="mb-12 relative">
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary" />
          <h1 className="font-headline text-5xl lg:text-6xl font-black tracking-tighter text-on-surface uppercase mb-2">
            OPERATIONS
          </h1>
          <p className="text-on-surface-variant font-mono text-sm tracking-widest uppercase">
            Select a task type · <span className="text-primary">Commence operations</span>
          </p>
        </header>

        {/* 3-column cards — Stitch pattern */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {taskLanes.map((lane) => {
            const Icon = lane.icon;
            const meta = LANE_META[lane.id] ?? { classification: 'ACTIVE', label: 'TASK', serial: 'XX-0000' };
            const accent = `rgb(${lane.accentRgb})`;
            const filledBlocks = Math.round((lane.progressPct / 100) * 10);

            return (
              <Link
                key={lane.id}
                href={lane.href}
                className="group"
              >
                <div
                  className="glass-panel border relative p-8 flex flex-col h-full min-h-[440px] transition-all hover:shadow-[0_0_30px_rgba(153,247,255,0.08)]"
                  style={{ borderColor: `rgba(${lane.accentRgb},0.1)` }}
                >
                  {/* L-bracket corner */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: accent }} />

                  {/* Classification label + icon */}
                  <div className="mb-6 flex justify-between items-start">
                    <div
                      className="font-mono text-[10px] tracking-widest uppercase border px-2 py-0.5"
                      style={{ color: `rgba(${lane.accentRgb},0.6)`, borderColor: `rgba(${lane.accentRgb},0.2)` }}
                    >
                      {meta.classification} {meta.serial.split('-')[1]}
                    </div>
                    <Icon className="h-8 w-8" style={{ color: accent }} />
                  </div>

                  {/* Title + description */}
                  <div className="flex-1">
                    <h3 className="font-headline text-3xl font-bold text-on-surface mb-4 uppercase">
                      {lane.title}
                    </h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed max-w-[90%]">
                      {lane.description}
                    </p>
                  </div>

                  {/* Progress + CTA */}
                  <div className="mt-8 space-y-4">
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-mono text-[10px] uppercase" style={{ color: `rgba(${lane.accentRgb},0.6)` }}>
                        DRILL_PROGRESS
                      </span>
                      <span className="font-mono text-xs" style={{ color: accent }}>
                        {lane.progressPct}%
                      </span>
                    </div>

                    {/* Segmented bar */}
                    <div className="flex gap-1 h-3">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div
                          key={i}
                          className="flex-1 border"
                          style={{
                            backgroundColor: i < filledBlocks ? accent : 'transparent',
                            borderColor: `rgba(${lane.accentRgb},0.1)`
                          }}
                        />
                      ))}
                    </div>

                    {/* CTA */}
                    <button
                      className="w-full mt-6 py-4 font-headline font-black tracking-widest active:scale-[0.98] transition-all uppercase text-sm"
                      style={{
                        backgroundColor: accent,
                        color: '#0c0e10',
                        boxShadow: `0 0 15px rgba(${lane.accentRgb},0.2)`
                      }}
                    >
                      {lane.cta}
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="mt-20 flex justify-between items-center border-t border-primary/10 pt-6">
          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="font-mono text-[8px] text-primary/40 tracking-[0.3em] uppercase">SYSTEM_LOCATION</span>
              <span className="font-mono text-[10px] text-primary tracking-widest uppercase">SGR · STABLE-GRID · OPS-CONSOLE</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-primary/40 uppercase">V2.4.08_BUILD</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
