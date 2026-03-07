'use client';

import { useMemo } from 'react';
import { addDays, format, isAfter, parseISO, startOfWeek } from 'date-fns';
import { BarChart3 } from 'lucide-react';
import { useProgressStore } from '@/lib/stores/useProgressStore';

export interface ReadingSignal {
  lastActiveAt: string;
  completedAt: string | null;
  isCompleted: boolean;
}

interface WeeklyActivityCardProps {
  readingSignals: ReadingSignal[];
}

export const WeeklyActivityCard = ({ readingSignals }: WeeklyActivityCardProps) => {
  const questionHistory = useProgressStore((state) => state.questionHistory);
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);

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
    const questionActiveDays = chartData
      .filter((day) => day.value > 0)
      .map((day) => day.key);

    const chapterCompletions = readingSignals.filter(
      (session) =>
        session.isCompleted &&
        session.completedAt &&
        isAfter(parseISO(session.completedAt), addDays(weekStart, -1))
    ).length;

    const readingActiveDays = readingSignals
      .filter((session) =>
        isAfter(parseISO(session.lastActiveAt), addDays(weekStart, -1))
      )
      .map((session) => format(parseISO(session.lastActiveAt), 'yyyy-MM-dd'));

    const activeDays = new Set([...questionActiveDays, ...readingActiveDays]).size;

    return {
      activeDays,
      questions,
      chapters: chapterCompletions
    };
  }, [chartData, readingSignals, weekStart]);

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[#ddd3c4] bg-[rgba(255,249,242,0.86)] shadow-[0_18px_48px_-38px_rgba(17,24,39,0.22)] backdrop-blur dark:border-white/10 dark:bg-[rgba(10,18,14,0.74)]">
      <div className="border-b border-[#ece1d2] px-5 py-4 dark:border-white/8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[#121b18] dark:text-[#f2f7f4]">
              <BarChart3 className="h-4 w-4 text-brand-600 dark:text-brand-300" />
              This week
            </h2>
            <p className="mt-1 text-xs text-[#6d746f] dark:text-[#7e9589]">
              Questions answered and chapters completed in the last seven days.
            </p>
          </div>
          <span className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
            {summary.activeDays}/7 active
          </span>
        </div>
      </div>

      <div className="p-5">
        {summary.activeDays === 0 ? (
          <p className="mb-5 text-sm leading-6 text-[#5d655f] dark:text-[#8aa496]">
            No activity yet this week. A short reading block or practice sprint is enough
            to restart momentum.
          </p>
        ) : (
          <div className="mb-5 flex h-20 items-end gap-2">
            {chartData.map((item, index) => {
              const height =
                item.value > 0 ? Math.max((item.value / maxCount) * 72, 8) : 5;
              const isToday = index === chartData.length - 1;
              return (
                <div key={item.key} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-t-[0.7rem] ${
                      isToday
                        ? 'bg-gradient-to-t from-brand-500 to-brand-300'
                        : item.value > 0
                          ? 'bg-[#accfbe] dark:bg-brand-500/45'
                          : 'bg-[#ded4c7] dark:bg-white/8'
                    }`}
                    style={{ height }}
                  />
                  <span
                    className={`text-[10px] font-medium ${
                      isToday
                        ? 'text-brand-700 dark:text-brand-300'
                        : 'text-[#6d746f] dark:text-[#7e9589]'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 border-t border-[#ece1d2] pt-3 dark:border-white/8">
          <SummaryItem label="Active days" value={`${summary.activeDays}/7`} />
          <SummaryItem label="Questions" value={summary.questions.toString()} />
          <SummaryItem label="Chapters" value={summary.chapters.toString()} />
        </div>
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center">
    <div className="text-lg font-semibold text-[#121b18] dark:text-[#f2f7f4]">
      {value}
    </div>
    <div className="text-[11px] text-[#6d746f] dark:text-[#7e9589]">{label}</div>
  </div>
);
