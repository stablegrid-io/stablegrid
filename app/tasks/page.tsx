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
  fabric: '34,185,153'
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

  return (
    <main className="min-h-screen bg-light-bg pb-20 dark:bg-dark-bg lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {taskLanes.map((lane) => {
              const Icon = lane.icon;
              const laneStyle = {
                '--task-accent': lane.accentRgb
              } as CSSProperties;

              return (
                <Link
                  key={lane.id}
                  href={lane.href}
                  className="group relative overflow-hidden rounded-[28px] border border-light-border bg-light-surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(var(--task-accent),0.4)] hover:shadow-[0_24px_70px_-36px_rgba(var(--task-accent),0.45)] dark:border-dark-border dark:bg-dark-surface"
                  style={laneStyle}
                >
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(circle at 100% 0%, rgba(var(--task-accent), 0.18), transparent 34%), linear-gradient(180deg, rgba(var(--task-accent), 0.1), transparent 54%)'
                    }}
                  />
                  <div
                    className="pointer-events-none absolute -right-10 top-16 h-40 w-40 rounded-full blur-3xl"
                    style={{ backgroundColor: 'rgba(var(--task-accent),0.12)' }}
                  />

                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-4">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[rgba(var(--task-accent),0.4)] bg-[rgba(var(--task-accent),0.12)] text-[rgb(var(--task-accent))]">
                          <Icon className="h-7 w-7" />
                        </span>

                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--task-accent))]">
                            Task
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="truncate text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                              {lane.title}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                          {lane.progressPct}%
                        </div>
                        <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                          {lane.progressValue}
                        </div>
                      </div>
                    </div>

                    <p className="mt-5 max-w-xl text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
                      {lane.description}
                    </p>

                    <div className="mt-6 border-t border-light-border/80 pt-5 dark:border-dark-border">
                      <div className="flex items-center gap-4">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                          <div
                            className="h-full rounded-full bg-[rgb(var(--task-accent))] transition-all duration-500"
                            style={{ width: `${lane.progressPct}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                          {lane.progressValue}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-end">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-text-light-primary transition-transform group-hover:translate-x-0.5 dark:text-text-dark-primary">
                          {lane.cta}
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        </div>
      </div>
    </main>
  );
}
