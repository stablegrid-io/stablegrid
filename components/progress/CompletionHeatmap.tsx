'use client';

import { useMemo, useState } from 'react';
import { eachDayOfInterval, format, parseISO, subDays } from 'date-fns';
import type { ReadingSession } from '@/types/progress';

interface CompletionHeatmapProps {
  sessions: ReadingSession[];
}

const levelClasses = [
  'bg-neutral-200 dark:bg-neutral-800',
  'bg-brand-200 dark:bg-brand-900/40',
  'bg-brand-300 dark:bg-brand-800/70',
  'bg-brand-400 dark:bg-brand-700/80',
  'bg-brand-500 dark:bg-brand-600'
];

const getLevel = (count: number) => {
  if (count <= 0) return 0;
  if (count < 2) return 1;
  if (count < 4) return 2;
  if (count < 6) return 3;
  return 4;
};

export const CompletionHeatmap = ({ sessions }: CompletionHeatmapProps) => {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const grid = useMemo(() => {
    const start = subDays(new Date(), 83);
    const days = eachDayOfInterval({ start, end: new Date() });
    const counts = new Map<string, number>();

    sessions.forEach((session) => {
      const key = format(parseISO(session.startedAt), 'yyyy-MM-dd');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return days.map((date) => {
      const key = format(date, 'yyyy-MM-dd');
      const count = counts.get(key) ?? 0;
      return {
        key,
        label: format(date, 'MMM d, yyyy'),
        count,
        level: getLevel(count)
      };
    });
  }, [sessions]);

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">
        Reading Consistency
      </h2>

      <div className="grid grid-cols-[repeat(21,minmax(0,1fr))] gap-1">
        {grid.map((day) => (
          <button
            key={day.key}
            type="button"
            onMouseEnter={() => setHoveredDate(day.key)}
            onMouseLeave={() => setHoveredDate(null)}
            className={`h-3 w-3 rounded-sm ${levelClasses[day.level]}`}
            title={`${day.label}: ${day.count} sessions`}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <span>Less</span>
          {levelClasses.map((className, idx) => (
            <span key={idx} className={`h-3 w-3 rounded-sm ${className}`} />
          ))}
          <span>More</span>
        </div>
        <span>
          {hoveredDate
            ? `${format(parseISO(hoveredDate), 'MMM d, yyyy')}: ${
                grid.find((day) => day.key === hoveredDate)?.count ?? 0
              } sessions`
            : 'Hover a day'}
        </span>
      </div>
    </div>
  );
};
