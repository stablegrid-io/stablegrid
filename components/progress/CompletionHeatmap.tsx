'use client';

import { useMemo, useState } from 'react';
import type { ReadingSession } from '@/types/progress';

interface CompletionHeatmapProps {
  sessions: ReadingSession[];
}

const levelClasses = [
  'bg-slate-200 dark:bg-slate-800',
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

const DAY_MS = 24 * 60 * 60 * 1000;
const HEATMAP_DAYS = 84;
const DAYS_PER_WEEK = 7;
const WEEK_COLUMNS = HEATMAP_DAYS / DAYS_PER_WEEK;

const toUtcDayKey = (value: Date | string) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const formatDayLabel = (key: string) =>
  new Date(`${key}T00:00:00.000Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });

const formatMonthLabel = (key: string) =>
  new Date(`${key}T00:00:00.000Z`).toLocaleDateString('en-US', {
    month: 'short',
    timeZone: 'UTC'
  });

export const CompletionHeatmap = ({ sessions }: CompletionHeatmapProps) => {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const grid = useMemo(() => {
    const counts = new Map<string, number>();

    sessions.forEach((session) => {
      const key = toUtcDayKey(session.startedAt);
      if (!key) return;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const now = new Date();
    const endUtcMs = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    );
    const startUtcMs = endUtcMs - (HEATMAP_DAYS - 1) * DAY_MS;

    return Array.from({ length: HEATMAP_DAYS }).map((_, index) => {
      const date = new Date(startUtcMs + index * DAY_MS);
      const key = toUtcDayKey(date) ?? '';
      const count = counts.get(key) ?? 0;
      return {
        key,
        label: formatDayLabel(key),
        count,
        level: getLevel(count)
      };
    });
  }, [sessions]);

  const monthLabels = useMemo(() => {
    const labels: Array<string | null> = [];
    let lastRenderedLabel: string | null = null;

    for (let weekIndex = 0; weekIndex < WEEK_COLUMNS; weekIndex += 1) {
      const weekStart = weekIndex * DAYS_PER_WEEK;
      const weekEnd = weekStart + DAYS_PER_WEEK;
      const weekDays = grid.slice(weekStart, weekEnd);
      if (weekDays.length === 0) {
        labels.push(null);
        continue;
      }

      const monthBoundary = weekDays.find((day) =>
        day.key.endsWith('-01')
      );
      const candidate = monthBoundary ? formatMonthLabel(monthBoundary.key) : null;
      const fallback = formatMonthLabel(weekDays[0].key);
      const nextLabel = weekIndex === 0 ? fallback : candidate;

      if (nextLabel && nextLabel !== lastRenderedLabel) {
        labels.push(nextLabel);
        lastRenderedLabel = nextLabel;
      } else {
        labels.push(null);
      }
    }

    return labels;
  }, [grid]);

  return (
    <section className="rounded-[1.5rem] border border-[#d6ddd7] bg-white/72 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-5">
      <h2 className="mb-1 text-sm font-semibold tracking-[-0.02em] text-[#121b18] dark:text-[#f2f7f4]">
        Activity Heatmap
      </h2>
      <p className="mb-4 text-sm leading-6 text-[#6d746f] dark:text-[#7e9589]">
        Last 12 weeks of reading activity.
      </p>

      <div
        className="mb-1 grid gap-1 text-[10px] font-medium text-[#6d746f] dark:text-[#7e9589]"
        style={{ gridTemplateColumns: `repeat(${WEEK_COLUMNS}, minmax(0, 1fr))` }}
      >
        {monthLabels.map((label, index) => (
          <span key={`month-${index}`} className="truncate">
            {label ?? ''}
          </span>
        ))}
      </div>

      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${WEEK_COLUMNS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${DAYS_PER_WEEK}, minmax(0, 1fr))`,
          gridAutoFlow: 'column'
        }}
      >
        {grid.map((day) => (
          <button
            key={day.key}
            type="button"
            onMouseEnter={() => setHoveredDate(day.key)}
            onMouseLeave={() => setHoveredDate(null)}
            onFocus={() => setHoveredDate(day.key)}
            onBlur={() => setHoveredDate(null)}
            className={`mx-auto h-3 w-3 rounded-sm ${levelClasses[day.level]}`}
            title={`${day.label}: ${day.count} sessions`}
            aria-label={`${day.label}: ${day.count} sessions`}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#6d746f] dark:text-[#7e9589]">
        <div className="flex items-center gap-2">
          <span>Less</span>
          {levelClasses.map((className, idx) => (
            <span key={idx} className={`h-3 w-3 rounded-sm ${className}`} />
          ))}
          <span>More</span>
        </div>
        <span>
          {hoveredDate
            ? `${formatDayLabel(hoveredDate)}: ${
                grid.find((day) => day.key === hoveredDate)?.count ?? 0
              } sessions`
            : 'Focus a day'}
        </span>
      </div>
    </section>
  );
};
