'use client';

import { BookOpen, Clock3, Code2, Flame, Target } from 'lucide-react';
import type { ProgressPeriod } from '@/components/progress/ProgressTrendChart';
import type { ReadingSession } from '@/types/progress';

interface PracticeHistoryItem {
  created_at?: string;
  total?: number;
  correct?: number;
}

interface WeeklyGoalsProps {
  readingSessions: ReadingSession[];
  practiceHistory: PracticeHistoryItem[];
  period: ProgressPeriod;
}

const PERIOD_LABELS: Record<ProgressPeriod, string> = {
  all: 'All time',
  week: 'Last 7 days',
  month: 'Last 30 days',
  year: 'Last 365 days'
};

const toDateKey = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

export const WeeklyGoals = ({
  readingSessions,
  practiceHistory,
  period
}: WeeklyGoalsProps) => {
  const chaptersCompleted = readingSessions.filter((session) => session.isCompleted).length;
  const questionsAnswered = practiceHistory.reduce(
    (sum, item) => sum + (item.total ?? 0),
    0
  );
  const questionsCorrect = practiceHistory.reduce(
    (sum, item) => sum + (item.correct ?? 0),
    0
  );
  const accuracy =
    questionsAnswered > 0
      ? Math.round((questionsCorrect / questionsAnswered) * 100)
      : 0;

  const readingMinutes = Math.round(
    readingSessions.reduce((sum, session) => sum + (session.activeSeconds ?? 0), 0) / 60
  );

  const activeDays = new Set([
    ...readingSessions
      .map((session) => toDateKey(session.lastActiveAt ?? session.startedAt))
      .filter((value): value is string => Boolean(value)),
    ...practiceHistory
      .map((item) => toDateKey(item.created_at))
      .filter((value): value is string => Boolean(value))
  ]).size;

  const stats = [
    {
      label: 'Chapters',
      value: chaptersCompleted.toString(),
      icon: BookOpen,
      color: 'text-brand-500'
    },
    {
      label: 'Questions',
      value: questionsAnswered.toString(),
      icon: Code2,
      color: 'text-brand-500'
    },
    {
      label: 'Active Days',
      value: activeDays.toString(),
      icon: Flame,
      color: 'text-amber-500'
    },
    {
      label: 'Reading Time',
      value: `${readingMinutes}m`,
      icon: Clock3,
      color: 'text-violet-500'
    },
    {
      label: 'Accuracy',
      value: `${accuracy}%`,
      icon: Target,
      color: 'text-cyan-500'
    }
  ];

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Activity Statistics
        </h2>
        <span className="text-xs text-neutral-400">{PERIOD_LABELS[period]}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/60"
            >
              <div className={`mb-2 inline-flex items-center gap-1.5 ${stat.color}`}>
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium uppercase tracking-[0.08em]">
                  {stat.label}
                </span>
              </div>
              <div className="text-xl font-semibold text-neutral-900 dark:text-white">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
