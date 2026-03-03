'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import {
  Activity,
  Calendar,
  Clock3,
  Flame,
  ListChecks,
  Trophy,
  Zap
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type {
  ReadingHistoryEntry,
  ReadingSession,
  Topic,
  TopicProgress
} from '@/types/progress';
import type { UserMissionProgress } from '@/types/missions';
import { unitsToKwh } from '@/lib/energy';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { ReadingHistoryList } from '@/components/progress/ReadingHistoryList';

interface ProgressDashboardProps {
  userId: string;
  userEmail: string;
  topicProgress: TopicProgress[];
  readingSessions: ReadingSession[];
  readingHistory: ReadingHistoryEntry[];
  missionProgress: UserMissionProgress[];
  practiceHistory: Array<{
    topic?: string;
    question_id?: string;
    correct?: number;
    total?: number;
    created_at?: string;
  }>;
}

interface PracticeSession {
  topic: Topic;
  correct: number;
  total: number;
  createdAt: string;
}

interface BestSession {
  accuracy: number;
  topic: Topic;
  completedAt: string;
  sampleSize: number;
}

interface DashboardContract {
  currentStreakDays: number;
  totalKwh: number;
  sessionsCompleted: number;
  overallAccuracyPct: number | null;
  weekKwh: number;
  weekKwhDelta: number;
  weekStudyMinutes: number;
  bestSession: BestSession | null;
  activeDaysLast7: number;
  trendKwhLast14Days: Array<{ day: string; kwh: number }>;
  hasKwhData: boolean;
  hasAnyActivity: boolean;
  answeredQuestions: number;
}

const TOPIC_LABEL: Record<Topic, string> = {
  pyspark: 'PySpark',
  fabric: 'Microsoft Fabric'
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_ACCURACY_ATTEMPTS = 10;
const MIN_BEST_SESSION_ATTEMPTS = 5;

const parseTopic = (value: string | undefined): Topic | null => {
  if (value === 'pyspark' || value === 'fabric') {
    return value;
  }
  return null;
};

const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const toDayKey = (value: string | number | Date | null | undefined) => {
  if (value == null) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return startOfDay(date).toISOString().slice(0, 10);
};

const startOfWeekMonday = (value: Date) => {
  const day = value.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return startOfDay(new Date(value.getTime() + mondayOffset * DAY_MS));
};

const formatRelativeDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const days = Math.floor(diffMs / DAY_MS);

  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const formatMinutes = (minutes: number) => {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return '0m';
  }

  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const remaining = total % 60;

  if (hours === 0) {
    return `${remaining}m`;
  }

  return `${hours}h ${String(remaining).padStart(2, '0')}m`;
};

const formatSignedKwh = (value: number) => {
  if (!Number.isFinite(value) || value === 0) {
    return '0.00';
  }

  return `${value > 0 ? '+' : ''}${value.toFixed(2)}`;
};

const computeCurrentStreak = (activeDaySet: Set<string>, today: Date) => {
  const todayKey = toDayKey(today);
  const yesterdayKey = toDayKey(new Date(today.getTime() - DAY_MS));

  let cursor = today;
  if (!todayKey || !activeDaySet.has(todayKey)) {
    if (!yesterdayKey || !activeDaySet.has(yesterdayKey)) {
      return 0;
    }
    cursor = new Date(today.getTime() - DAY_MS);
  }

  let streak = 0;
  while (true) {
    const key = toDayKey(cursor);
    if (!key || !activeDaySet.has(key)) {
      break;
    }
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  return streak;
};

const MetricCard = ({
  title,
  value,
  unit,
  subtext,
  icon: Icon,
  orderClassName = '',
  guidance
}: {
  title: string;
  value: string;
  unit?: string;
  subtext: string;
  icon: LucideIcon;
  orderClassName?: string;
  guidance?: string;
}) => (
  <article
    className={`rounded-2xl border border-light-border bg-light-surface p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface ${orderClassName}`}
  >
    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
      <Icon className="h-4 w-4 text-brand-500" />
      <span>{title}</span>
    </div>
    <div className="flex items-end gap-2">
      <span className="text-4xl font-bold tracking-tight text-text-light-primary dark:text-text-dark-primary">
        {value}
      </span>
      {unit ? (
        <span className="mb-1 text-lg text-text-light-tertiary dark:text-text-dark-tertiary">
          {unit}
        </span>
      ) : null}
    </div>
    <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
      {subtext}
    </p>
    {guidance ? (
      <p className="mt-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
        {guidance}
      </p>
    ) : null}
  </article>
);

export const ProgressDashboard = ({
  userId,
  userEmail,
  topicProgress,
  readingSessions,
  readingHistory,
  missionProgress,
  practiceHistory
}: ProgressDashboardProps) => {
  void missionProgress;

  const xp = useProgressStore((state) => state.xp);
  const streakFromStore = useProgressStore((state) => state.streak);
  const energyEvents = useProgressStore((state) => state.energyEvents);
  const setUserId = useProgressStore((state) => state.setUserId);
  const syncProgress = useProgressStore((state) => state.syncProgress);

  useEffect(() => {
    setUserId(userId);
    void syncProgress(userId);
  }, [setUserId, syncProgress, userId]);

  const metrics = useMemo<DashboardContract>(() => {
    const now = new Date();
    const today = startOfDay(now);
    const thisWeekStart = startOfWeekMonday(today);
    const previousWeekStart = new Date(thisWeekStart.getTime() - 7 * DAY_MS);
    const previousWeekEnd = new Date(thisWeekStart.getTime() - DAY_MS);

    const practiceSessions: PracticeSession[] = practiceHistory
      .map((item) => {
        const topic = parseTopic(item.topic);
        const createdAt = item.created_at;
        const total = Number(item.total ?? 0);
        const correct = Number(item.correct ?? 0);

        if (!topic || !createdAt || !Number.isFinite(total) || total <= 0) {
          return null;
        }

        return {
          topic,
          createdAt,
          total,
          correct: Math.max(0, Math.min(total, Number.isFinite(correct) ? correct : 0))
        };
      })
      .filter((item): item is PracticeSession => Boolean(item));

    const dayKwhMap = new Map<string, number>();
    energyEvents
      .filter((event) => event.units > 0)
      .forEach((event) => {
        const key = toDayKey(event.timestamp);
        if (!key) return;
        const kwh = unitsToKwh(event.units);
        dayKwhMap.set(key, (dayKwhMap.get(key) ?? 0) + kwh);
      });

    const trendKwhLast14Days = Array.from({ length: 14 }).map((_, index) => {
      const day = new Date(today.getTime() - (13 - index) * DAY_MS);
      const key = toDayKey(day) as string;
      return {
        day: `${day.getMonth() + 1}/${day.getDate()}`,
        kwh: Number((dayKwhMap.get(key) ?? 0).toFixed(2))
      };
    });

    const hasKwhData = trendKwhLast14Days.some((entry) => entry.kwh > 0);

    let weekKwh = 0;
    let weekKwhDelta = 0;

    dayKwhMap.forEach((value, key) => {
      const day = new Date(key);
      if (day >= thisWeekStart && day <= today) {
        weekKwh += value;
      }
      if (day >= previousWeekStart && day <= previousWeekEnd) {
        weekKwhDelta -= value;
      }
    });

    weekKwhDelta += weekKwh;

    const readingCompleted = readingSessions.filter((session) => session.isCompleted).length;
    const sessionsCompleted = readingCompleted + practiceSessions.length;

    const weekStudyMinutes = Math.round(
      readingSessions.reduce((sum, session) => {
        const key = toDayKey(session.lastActiveAt ?? session.startedAt);
        if (!key) return sum;
        const day = new Date(key);
        if (day < thisWeekStart || day > today) {
          return sum;
        }
        return sum + (session.activeSeconds ?? 0) / 60;
      }, 0)
    );

    const activeDaySet = new Set<string>();
    readingSessions.forEach((session) => {
      const key = toDayKey(session.lastActiveAt ?? session.startedAt);
      if (key) activeDaySet.add(key);
    });
    practiceSessions.forEach((session) => {
      const key = toDayKey(session.createdAt);
      if (key) activeDaySet.add(key);
    });

    const currentStreakDays = Math.max(computeCurrentStreak(activeDaySet, today), streakFromStore);

    const activeDaysLast7 = Array.from({ length: 7 }).reduce<number>(
      (count, _, index) => {
        const day = new Date(today.getTime() - index * DAY_MS);
        const key = toDayKey(day);
        if (key && activeDaySet.has(key)) {
          return count + 1;
        }
        return count;
      },
      0
    );

    const practiceTotals = practiceSessions.reduce(
      (accumulator, session) => {
        accumulator.correct += session.correct;
        accumulator.total += session.total;
        return accumulator;
      },
      { correct: 0, total: 0 }
    );

    const topicTotals = topicProgress.reduce(
      (accumulator, entry) => {
        accumulator.correct += entry.practiceQuestionsCorrect ?? 0;
        accumulator.total += entry.practiceQuestionsAttempted ?? 0;
        return accumulator;
      },
      { correct: 0, total: 0 }
    );

    const answeredQuestions = Math.max(practiceTotals.total, topicTotals.total);
    const answeredCorrect =
      practiceTotals.total >= topicTotals.total ? practiceTotals.correct : topicTotals.correct;

    const overallAccuracyPct =
      answeredQuestions >= MIN_ACCURACY_ATTEMPTS
        ? Math.round((answeredCorrect / Math.max(1, answeredQuestions)) * 100)
        : null;

    const bestPracticeSession = [...practiceSessions]
      .filter((session) => session.total >= MIN_BEST_SESSION_ATTEMPTS)
      .map((session) => ({
        accuracy: Math.round((session.correct / session.total) * 100),
        topic: session.topic,
        completedAt: session.createdAt,
        sampleSize: session.total
      }))
      .sort((left, right) => {
        if (right.accuracy !== left.accuracy) {
          return right.accuracy - left.accuracy;
        }
        return new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime();
      })[0];

    const bestReadingSession = [...readingSessions]
      .filter((session) => (session.sectionsTotal ?? 0) >= MIN_BEST_SESSION_ATTEMPTS)
      .map((session) => ({
        accuracy: Math.round(
          ((session.sectionsRead ?? 0) / Math.max(1, session.sectionsTotal ?? 1)) * 100
        ),
        topic: session.topic,
        completedAt: session.lastActiveAt ?? session.startedAt,
        sampleSize: session.sectionsTotal ?? 0
      }))
      .sort((left, right) => {
        if (right.accuracy !== left.accuracy) {
          return right.accuracy - left.accuracy;
        }
        return new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime();
      })[0];

    const bestSession = bestPracticeSession ?? bestReadingSession ?? null;

    return {
      currentStreakDays,
      totalKwh: unitsToKwh(xp),
      sessionsCompleted,
      overallAccuracyPct,
      weekKwh,
      weekKwhDelta,
      weekStudyMinutes,
      bestSession,
      activeDaysLast7,
      trendKwhLast14Days,
      hasKwhData,
      hasAnyActivity: activeDaySet.size > 0,
      answeredQuestions
    };
  }, [energyEvents, practiceHistory, readingSessions, streakFromStore, topicProgress, xp]);

  const userName = useMemo(() => {
    const base = userEmail.split('@')[0] ?? 'Learner';
    return base.trim().length > 0 ? base : 'Learner';
  }, [userEmail]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
      <header className="mb-6 rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-500">
              Progress Dashboard
            </p>
            <h1 className="mt-1 text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {userName}
            </h1>
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {metrics.currentStreakDays} day streak · {metrics.totalKwh.toFixed(2)} kWh earned ·{' '}
              {metrics.overallAccuracyPct ?? 0}% accuracy
            </p>
            <p className="mt-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              {metrics.hasAnyActivity
                ? 'Study today to protect your streak.'
                : 'Complete your first session to start your streak.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/learn"
              className="rounded-lg border border-brand-500 bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              Continue Learning
            </Link>
            <Link
              href="/practice"
              className="rounded-lg border border-light-border px-3 py-2 text-sm font-medium text-text-light-primary transition hover:border-brand-400 hover:text-brand-600 dark:border-dark-border dark:text-text-dark-primary dark:hover:border-brand-600 dark:hover:text-brand-300"
            >
              Complete a 10-minute session
            </Link>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Current Streak"
          value={String(metrics.currentStreakDays)}
          unit="days"
          subtext={
            metrics.currentStreakDays > 0
              ? 'Keep momentum today'
              : 'No active streak yet'
          }
          guidance={
            metrics.currentStreakDays === 0
              ? 'Complete a session today to start your streak.'
              : undefined
          }
          icon={Flame}
          orderClassName="order-1"
        />

        <MetricCard
          title="Total kWh Earned"
          value={metrics.totalKwh.toFixed(2)}
          unit="kWh"
          subtext="All-time earned"
          guidance={
            metrics.totalKwh <= 0
              ? 'Complete a session to start generating kWh.'
              : undefined
          }
          icon={Zap}
          orderClassName="order-2"
        />

        <MetricCard
          title="This Week kWh"
          value={metrics.weekKwh.toFixed(2)}
          unit="kWh"
          subtext={`${formatSignedKwh(metrics.weekKwhDelta)} vs last week`}
          guidance={
            metrics.weekKwh <= 0
              ? 'No activity this week yet.'
              : undefined
          }
          icon={Calendar}
          orderClassName="order-3 lg:order-5"
        />

        <MetricCard
          title="Overall Accuracy"
          value={
            metrics.overallAccuracyPct == null ? '—' : String(metrics.overallAccuracyPct)
          }
          unit={metrics.overallAccuracyPct == null ? undefined : '%'}
          subtext={
            metrics.overallAccuracyPct == null
              ? 'Not enough attempts yet'
              : `${metrics.answeredQuestions} answered`
          }
          guidance={
            metrics.overallAccuracyPct == null
              ? 'Answer at least 10 questions to unlock accuracy stats.'
              : undefined
          }
          icon={Activity}
          orderClassName="order-4"
        />

        <MetricCard
          title="Sessions Completed"
          value={String(metrics.sessionsCompleted)}
          subtext="Reading + practice sessions"
          guidance={
            metrics.sessionsCompleted === 0
              ? 'Complete your first session to start tracking volume.'
              : undefined
          }
          icon={ListChecks}
          orderClassName="order-5 lg:order-3"
        />

        <MetricCard
          title="Study Time This Week"
          value={formatMinutes(metrics.weekStudyMinutes)}
          subtext="Tracked active reading time"
          guidance={
            metrics.weekStudyMinutes === 0
              ? 'No active study time recorded this week.'
              : undefined
          }
          icon={Clock3}
          orderClassName="order-6"
        />

        <MetricCard
          title="Best Session"
          value={metrics.bestSession ? `${metrics.bestSession.accuracy}%` : '—'}
          subtext={
            metrics.bestSession
              ? `${TOPIC_LABEL[metrics.bestSession.topic]} · ${formatRelativeDate(metrics.bestSession.completedAt)}`
              : 'No qualifying session yet'
          }
          guidance={
            metrics.bestSession
              ? `${metrics.bestSession.sampleSize} questions/steps in session`
              : `Need at least ${MIN_BEST_SESSION_ATTEMPTS} questions/steps in a session.`
          }
          icon={Trophy}
          orderClassName="order-7"
        />

        <MetricCard
          title="7-Day Consistency"
          value={`${metrics.activeDaysLast7}/7`}
          subtext="Active days in the last week"
          guidance={
            metrics.activeDaysLast7 === 0
              ? 'Show up once to begin your consistency trend.'
              : undefined
          }
          icon={Calendar}
          orderClassName="order-8"
        />
      </section>

      <section className="mt-4 rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              kWh Earned Last 14 Days
            </h2>
            <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              Last 14 days
            </p>
          </div>
        </div>

        {metrics.hasKwhData ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.trendKwhLast14Days}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={36} />
                <Tooltip
                  formatter={(value: unknown) => {
                    if (Array.isArray(value)) {
                      const first = Number(value[0] ?? 0);
                      return `${first.toFixed(2)} kWh`;
                    }
                    return `${Number(value ?? 0).toFixed(2)} kWh`;
                  }}
                  labelFormatter={(label) => `Day ${label}`}
                />
                <Bar dataKey="kwh" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-light-border px-4 py-6 text-sm text-text-light-secondary dark:border-dark-border dark:text-text-dark-secondary">
            No kWh trend yet. Complete a session to start charting momentum.
          </div>
        )}
      </section>

      <section className="mt-4">
        <ReadingHistoryList entries={readingHistory} />
      </section>
    </div>
  );
};
