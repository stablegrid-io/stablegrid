'use client';

import { useMemo, useState } from 'react';
import {
  addDays,
  differenceInCalendarDays,
  endOfWeek,
  format,
  parseISO,
  startOfWeek
} from 'date-fns';
import type { ActivityDay } from '@/lib/hooks/useDashboardData';

interface ActivityHeatmapProps {
  data: ActivityDay[];
}

const levelClasses = [
  'bg-light-surface dark:bg-dark-surface',
  'bg-brand-200/60 dark:bg-brand-900/30',
  'bg-brand-400/70 dark:bg-brand-700/70',
  'bg-brand-500/80 dark:bg-brand-600/80',
  'bg-brand-600/90 dark:bg-brand-500/90'
];

export const ActivityHeatmap = ({ data }: ActivityHeatmapProps) => {
  const [hoveredDay, setHoveredDay] = useState<ActivityDay | null>(null);
  const cellSize = 12;
  const gapPx = 4;
  const monthRowHeight = 16;

  const { weeks, monthMarkers, gridWidth, dayLabelsOffset } = useMemo(() => {
    if (data.length === 0) {
      return {
        weeks: [] as ActivityDay[][],
        monthMarkers: [] as { label: string; index: number }[],
        gridWidth: 0,
        dayLabelsOffset: monthRowHeight + gapPx
      };
    }

    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const startDate = startOfWeek(parseISO(sorted[0].date), { weekStartsOn: 0 });
    const endDate = endOfWeek(parseISO(sorted[sorted.length - 1].date), {
      weekStartsOn: 0
    });
    const totalDays = differenceInCalendarDays(endDate, startDate) + 1;
    const totalWeeks = Math.ceil(totalDays / 7);

    const lookup = new Map<string, ActivityDay>();
    sorted.forEach((day) => lookup.set(day.date, day));

    const weeksGrid: ActivityDay[][] = Array.from({ length: totalWeeks }, () =>
      Array.from({ length: 7 }, () => ({
        date: '',
        count: 0,
        level: 0
      }))
    );

    for (let i = 0; i < totalDays; i += 1) {
      const date = addDays(startDate, i);
      const weekIndex = Math.floor(i / 7);
      const dayIndex = i % 7;
      const key = format(date, 'yyyy-MM-dd');
      const entry = lookup.get(key) ?? { date: key, count: 0, level: 0 };
      weeksGrid[weekIndex][dayIndex] = entry;
    }

    const markers: { label: string; index: number }[] = [];
    let lastMonth = '';
    for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex += 1) {
      const weekStartDate = addDays(startDate, weekIndex * 7);
      const monthLabel = format(weekStartDate, 'MMM');
      if (monthLabel !== lastMonth) {
        markers.push({ label: monthLabel, index: weekIndex });
        lastMonth = monthLabel;
      }
    }

    const columnWidth = cellSize + gapPx;
    const width = totalWeeks * columnWidth - gapPx;

    return {
      weeks: weeksGrid,
      monthMarkers: markers,
      gridWidth: Math.max(width, 0),
      dayLabelsOffset: monthRowHeight + gapPx
    };
  }, [data, gapPx, cellSize, monthRowHeight]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const columnWidth = cellSize + gapPx;

  return (
    <div className="card p-6">
      <h3 className="mb-4 text-lg font-semibold">Activity</h3>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div
            className="flex flex-col gap-1 text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary"
            style={{ paddingTop: dayLabelsOffset }}
          >
            {dayLabels.map((label) => (
              <span
                key={label}
                className="leading-3"
                style={{ height: cellSize }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="overflow-x-auto pb-2">
            <div style={{ width: gridWidth }} className="space-y-1">
              <div
                className="relative text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary"
                style={{ height: monthRowHeight }}
              >
                {monthMarkers.map((marker) => (
                  <span
                    key={`month-${marker.index}-${marker.label}`}
                    className="absolute leading-4"
                    style={{ left: marker.index * columnWidth }}
                  >
                    {marker.label}
                  </span>
                ))}
              </div>

              <div className="flex gap-1">
                {weeks.map((week, weekIndex) => (
                  <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
                    {week.map((day, dayIndex) => (
                      <div
                        key={`${weekIndex}-${dayIndex}-${day.date}`}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`rounded-sm border border-light-border/40 dark:border-dark-border/40 ${
                          levelClasses[day.level]
                        } cursor-pointer transition-all hover:border-brand-400 hover:ring-1 hover:ring-brand-400`}
                        title={`${format(parseISO(day.date), 'MMM d')}: ${day.count} questions`}
                        style={{ width: cellSize, height: cellSize }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          <div className="flex items-center gap-2">
            <span>Less</span>
            {levelClasses.map((className, index) => (
              <div
                key={`legend-${index}`}
                className={`h-3 w-3 rounded-sm ${className}`}
              />
            ))}
            <span>More</span>
          </div>
          {hoveredDay && (
            <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              {format(parseISO(hoveredDay.date), 'MMM d, yyyy')}: {hoveredDay.count}{' '}
              questions
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
