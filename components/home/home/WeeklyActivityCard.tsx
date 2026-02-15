'use client';

import { useMemo } from 'react';
import { addDays, format, isAfter, parseISO, startOfWeek } from 'date-fns';
import { BarChart3 } from 'lucide-react';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import type { ReadingSession } from '@/types/progress';

interface WeeklyActivityCardProps {
  readingHistory: ReadingSession[];
}

export const WeeklyActivityCard = ({ readingHistory }: WeeklyActivityCardProps) => {
  const questionHistory = useProgressStore((state) => state.questionHistory);
  const weekStart = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    []
  );

  const chartData = useMemo(() => {
    const countByDay = new Map<string, number>();

    questionHistory.forEach((entry) => {
      const attemptedAt = new Date(entry.timestamp);
      if (!isAfter(attemptedAt, addDays(weekStart, -1))) return;
      const key = format(attemptedAt, 'yyyy-MM-dd');
      countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
    });

    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      const key = format(date, 'yyyy-MM-dd');
      return {
        key,
        label: format(date, 'EEEEE'),
        value: countByDay.get(key) ?? 0
      };
    });
  }, [questionHistory, weekStart]);

  const maxCount = Math.max(...chartData.map((item) => item.value), 1);

  const summary = useMemo(() => {
    const questions = chartData.reduce((sum, day) => sum + day.value, 0);
    const questionActiveDays = chartData.filter((day) => day.value > 0).map((day) => day.key);

    const chapterCompletions = readingHistory.filter(
      (session) =>
        session.isCompleted &&
        session.completedAt &&
        isAfter(parseISO(session.completedAt), addDays(weekStart, -1))
    ).length;

    const readingActiveDays = readingHistory
      .filter((session) => isAfter(parseISO(session.lastActiveAt), addDays(weekStart, -1)))
      .map((session) => format(parseISO(session.lastActiveAt), 'yyyy-MM-dd'));

    const activeDays = new Set([...questionActiveDays, ...readingActiveDays]).size;

    return {
      activeDays,
      questions,
      chapters: chapterCompletions
    };
  }, [chartData, readingHistory, weekStart]);

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
          <BarChart3 className="h-4 w-4 text-neutral-500" />
          This Week
        </h2>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
          {summary.questions} questions
        </span>
      </div>

      <div className="mb-4 flex h-16 items-end gap-2">
        {chartData.map((item, index) => {
          const height = item.value > 0 ? Math.max((item.value / maxCount) * 56, 6) : 4;
          const isToday = index === chartData.length - 1;
          return (
            <div key={item.key} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`w-full rounded-sm ${
                  isToday
                    ? 'bg-gradient-to-t from-brand-500 to-brand-400'
                    : item.value > 0
                    ? 'bg-brand-200 dark:bg-brand-700/60'
                    : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
                style={{ height }}
              />
              <span
                className={`text-[10px] font-medium ${
                  isToday
                    ? 'text-brand-500'
                    : 'text-neutral-400 dark:text-neutral-500'
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <SummaryItem label="Active days" value={`${summary.activeDays}/7`} />
        <SummaryItem label="Questions" value={summary.questions.toString()} />
        <SummaryItem label="Chapters" value={summary.chapters.toString()} />
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center">
    <div className="text-lg font-semibold text-neutral-900 dark:text-white">{value}</div>
    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{label}</div>
  </div>
);
