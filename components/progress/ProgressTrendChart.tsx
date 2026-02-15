'use client';

import { useMemo } from 'react';
import { eachDayOfInterval, format, startOfDay, subDays } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { ReadingSession } from '@/types/progress';

export type ProgressPeriod = 'all' | 'week' | 'month' | 'year';

interface PracticeHistoryItem {
  question_id?: string;
  correct?: number;
  created_at?: string;
}

interface ProgressTrendChartProps {
  readingSessions: ReadingSession[];
  practiceHistory: PracticeHistoryItem[];
  period: ProgressPeriod;
}

const getStartDate = (
  period: ProgressPeriod,
  readingSessions: ReadingSession[],
  practiceHistory: PracticeHistoryItem[]
) => {
  const end = startOfDay(new Date());

  if (period === 'week') return subDays(end, 6);
  if (period === 'month') return subDays(end, 29);
  if (period === 'year') return subDays(end, 364);

  const candidates: Date[] = [];

  readingSessions.forEach((session) => {
    const raw = session.completedAt ?? session.startedAt;
    if (!raw) return;
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) candidates.push(startOfDay(date));
  });

  practiceHistory.forEach((item) => {
    if (!item.created_at) return;
    const date = new Date(item.created_at);
    if (!Number.isNaN(date.getTime())) candidates.push(startOfDay(date));
  });

  if (candidates.length === 0) return subDays(end, 6);
  return candidates.reduce((min, date) => (date < min ? date : min), candidates[0]);
};

export const ProgressTrendChart = ({
  readingSessions,
  practiceHistory,
  period
}: ProgressTrendChartProps) => {
  const data = useMemo(() => {
    const end = startOfDay(new Date());
    const start = getStartDate(period, readingSessions, practiceHistory);
    const days = eachDayOfInterval({ start, end });

    const chaptersByDay = new Map<string, Set<string>>();
    const uniqueCorrectByDay = new Map<string, Set<string>>();
    const fallbackCorrectByDay = new Map<string, number>();

    readingSessions.forEach((session) => {
      if (!session.isCompleted || !session.completedAt) return;
      const date = new Date(session.completedAt);
      if (Number.isNaN(date.getTime())) return;
      const key = format(date, 'yyyy-MM-dd');
      const uniqueChapterKey = `${session.topic}:${session.chapterId}`;
      const chapterSet = chaptersByDay.get(key) ?? new Set<string>();
      chapterSet.add(uniqueChapterKey);
      chaptersByDay.set(key, chapterSet);
    });

    practiceHistory.forEach((entry) => {
      if (!entry.created_at) return;
      const date = new Date(entry.created_at);
      if (Number.isNaN(date.getTime())) return;
      const key = format(date, 'yyyy-MM-dd');
      const correct = entry.correct ?? 0;
      if (correct <= 0) return;

      if (entry.question_id) {
        const questionSet = uniqueCorrectByDay.get(key) ?? new Set<string>();
        questionSet.add(entry.question_id);
        uniqueCorrectByDay.set(key, questionSet);
        return;
      }

      fallbackCorrectByDay.set(
        key,
        (fallbackCorrectByDay.get(key) ?? 0) + correct
      );
    });

    return days.map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const uniqueChapters = chaptersByDay.get(key)?.size ?? 0;
      const uniqueCorrect = uniqueCorrectByDay.get(key)?.size ?? 0;
      const fallbackCorrect = fallbackCorrectByDay.get(key) ?? 0;

      return {
        date: format(day, period === 'year' ? 'MMM' : 'MMM d'),
        chaptersCompleted: uniqueChapters,
        correctAnswers: uniqueCorrect + fallbackCorrect
      };
    });
  }, [period, practiceHistory, readingSessions]);

  const periodLabel =
    period === 'week'
      ? 'Last 7 days'
      : period === 'month'
        ? 'Last 30 days'
        : period === 'year'
          ? 'Last 12 months'
          : 'All time';
  const isAllTime = period === 'all';

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Learning Trend
        </h2>
        <p className="mt-1 text-xs text-neutral-400">
          {isAllTime
            ? `Unique activity by day · ${periodLabel}`
            : `Unique daily chapters completed vs correct answers · ${periodLabel}`}
        </p>
      </div>

      <div className="h-72 w-full">
        {isAllTime ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                minTickGap={20}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 12
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="chaptersCompleted"
                name="Chapters Completed"
                fill="#6b7fff"
                radius={[4, 4, 0, 0]}
                maxBarSize={26}
              />
              <Bar
                dataKey="correctAnswers"
                name="Correct Answers"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={26}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                minTickGap={20}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 12
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="chaptersCompleted"
                name="Chapters Completed"
                stroke="#6b7fff"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="correctAnswers"
                name="Correct Answers"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
