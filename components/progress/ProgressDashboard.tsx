'use client';

import { useMemo, useState } from 'react';
import { CompletionHeatmap } from '@/components/progress/CompletionHeatmap';
import { MissionsOverview } from '@/components/progress/MissionsOverview';
import { OverallStats } from '@/components/progress/OverallStats';
import {
  ProgressTrendChart,
  type ProgressPeriod
} from '@/components/progress/ProgressTrendChart';
import { TopicProgressCard } from '@/components/progress/TopicProgressCard';
import type { ReadingSession, TopicProgress } from '@/types/progress';
import type { UserMissionProgress } from '@/types/missions';
import { useProgressStore } from '@/lib/stores/useProgressStore';

interface ProgressDashboardProps {
  topicProgress: TopicProgress[];
  readingSessions: ReadingSession[];
  missionProgress: UserMissionProgress[];
  practiceHistory: Array<{
    topic?: string;
    question_id?: string;
    correct?: number;
    total?: number;
    created_at?: string;
  }>;
}

const ALL_TOPICS = ['pyspark', 'sql', 'python', 'fabric'] as const;

const getPeriodStart = (period: ProgressPeriod): Date | null => {
  const now = new Date();
  if (period === 'week') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === 'month') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (period === 'year') return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  return null;
};

const getActivityDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export const ProgressDashboard = ({
  topicProgress,
  readingSessions,
  missionProgress,
  practiceHistory
}: ProgressDashboardProps) => {
  const [period, setPeriod] = useState<ProgressPeriod>('all');
  const questionHistory = useProgressStore((state) => state.questionHistory);

  const resolvedPracticeHistory = useMemo(() => {
    if (practiceHistory.length > 0) return practiceHistory;

    return questionHistory.map((entry) => ({
      topic: entry.topic,
      question_id: entry.questionId,
      correct: entry.correct ? 1 : 0,
      total: 1,
      created_at: new Date(entry.timestamp).toISOString()
    }));
  }, [practiceHistory, questionHistory]);

  const periodStart = useMemo(() => getPeriodStart(period), [period]);

  const filteredReadingSessions = useMemo(() => {
    if (!periodStart) return readingSessions;
    return readingSessions.filter((session) => {
      const activityDate = getActivityDate(session.lastActiveAt ?? session.startedAt);
      return activityDate ? activityDate >= periodStart : false;
    });
  }, [periodStart, readingSessions]);

  const filteredPracticeHistory = useMemo(() => {
    if (!periodStart) return resolvedPracticeHistory;
    return resolvedPracticeHistory.filter((item) => {
      const activityDate = getActivityDate(item.created_at);
      return activityDate ? activityDate >= periodStart : false;
    });
  }, [periodStart, resolvedPracticeHistory]);

  const totalChaptersCompleted = filteredReadingSessions.filter(
    (session) => session.isCompleted
  ).length;
  const totalMinutesRead = Math.round(
    filteredReadingSessions.reduce((sum, session) => sum + (session.activeSeconds ?? 0), 0) / 60
  );
  const totalQuestionsCorrect = filteredPracticeHistory.reduce(
    (sum, item) => sum + (item.correct ?? 0),
    0
  );
  const totalQuestionsAttempted = filteredPracticeHistory.reduce(
    (sum, item) => sum + (item.total ?? 0),
    0
  );
  const overallAccuracy =
    totalQuestionsAttempted > 0
      ? Math.round((totalQuestionsCorrect / totalQuestionsAttempted) * 100)
      : 0;

  const topicProgressForPeriod = useMemo(() => {
    if (period === 'all') {
      return topicProgress;
    }

    return topicProgress.map((topicEntry) => {
      const sessionsForTopic = filteredReadingSessions.filter(
        (session) => session.topic === topicEntry.topic
      );
      const practiceForTopic = filteredPracticeHistory.filter(
        (item) => item.topic === topicEntry.topic
      );

      const minutesRead = Math.round(
        sessionsForTopic.reduce((sum, session) => sum + (session.activeSeconds ?? 0), 0) / 60
      );
      const sectionsTotal = sessionsForTopic.reduce(
        (sum, session) => sum + (session.sectionsTotal ?? 0),
        0
      );
      const sectionsRead = sessionsForTopic.reduce(
        (sum, session) => sum + (session.sectionsRead ?? 0),
        0
      );
      const chaptersCompleted = sessionsForTopic.filter((session) => session.isCompleted).length;
      const questionsAttempted = practiceForTopic.reduce(
        (sum, item) => sum + (item.total ?? 0),
        0
      );
      const questionsCorrect = practiceForTopic.reduce(
        (sum, item) => sum + (item.correct ?? 0),
        0
      );

      const sessionDates = sessionsForTopic
        .map((session) => session.lastActiveAt ?? session.startedAt)
        .filter(Boolean)
        .sort();

      return {
        ...topicEntry,
        theoryChaptersCompleted: chaptersCompleted,
        theorySectionsTotal: sectionsTotal,
        theorySectionsRead: sectionsRead,
        theoryTotalMinutesRead: minutesRead,
        practiceQuestionsAttempted: questionsAttempted,
        practiceQuestionsCorrect: questionsCorrect,
        firstActivityAt: sessionDates[0] ?? null,
        lastActivityAt: sessionDates[sessionDates.length - 1] ?? null
      };
    });
  }, [filteredPracticeHistory, filteredReadingSessions, period, topicProgress]);

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 dark:bg-neutral-950 lg:pb-8">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Progress</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Your learning journey across all topics
          </p>
        </div>

        <div className="mb-6 inline-flex overflow-hidden rounded-lg border border-neutral-200 text-xs dark:border-neutral-700">
          {[
            { value: 'all' as const, label: 'All Time' },
            { value: 'week' as const, label: 'This Week' },
            { value: 'month' as const, label: 'This Month' },
            { value: 'year' as const, label: 'This Year' }
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              className={`px-3 py-2 font-medium transition-colors ${
                period === option.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <OverallStats
          chaptersCompleted={totalChaptersCompleted}
          minutesRead={totalMinutesRead}
          questionsCorrect={totalQuestionsCorrect}
          overallAccuracy={overallAccuracy}
        />

        <div className="mt-6">
          <ProgressTrendChart
            readingSessions={readingSessions}
            practiceHistory={resolvedPracticeHistory}
            period={period}
          />
        </div>

        <div className="mt-6">
          <MissionsOverview missionProgress={missionProgress} />
        </div>

        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">
            Topic Breakdown
          </h2>
          <div className="space-y-3">
            {ALL_TOPICS.map((topic) => {
              const progress =
                topicProgressForPeriod.find((entry) => entry.topic === topic) ?? null;
              return <TopicProgressCard key={topic} topic={topic} progress={progress} />;
            })}
          </div>
        </div>

        <div className="mt-6">
          <CompletionHeatmap sessions={filteredReadingSessions} />
        </div>
      </div>
    </div>
  );
};
