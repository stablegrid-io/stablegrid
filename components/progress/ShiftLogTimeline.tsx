'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ClipboardCheck, Wrench } from 'lucide-react';
import type { ShiftLogEntry } from '@/types/progress';

type ShiftFilter = 'all' | 'learning' | 'practice' | 'mission';

interface ShiftLogTimelineProps {
  entries: ShiftLogEntry[];
}

const FILTER_STORAGE_KEY = 'stablegrid.shift-log.filter';
const PAGE_SIZE = 8;

const filterOptions: Array<{ id: ShiftFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'learning', label: 'Learning' },
  { id: 'practice', label: 'Practice' },
  { id: 'mission', label: 'Missions' }
];

const iconByCategory = {
  learning: BookOpen,
  practice: ClipboardCheck,
  mission: Wrench
} as const;

const getDayLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  const today = new Date();
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const rowDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayDelta = Math.round((now - rowDay) / (24 * 60 * 60 * 1000));

  if (dayDelta === 0) return 'Today';
  if (dayDelta === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
};

const formatTime = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  });
};

export function ShiftLogTimeline({ entries }: ShiftLogTimelineProps) {
  const [filter, setFilter] = useState<ShiftFilter>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(FILTER_STORAGE_KEY);
      if (
        stored === 'all' ||
        stored === 'learning' ||
        stored === 'practice' ||
        stored === 'mission'
      ) {
        setFilter(stored);
      }
    } catch {
      // Ignore storage read failures.
    }
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(FILTER_STORAGE_KEY, filter);
    } catch {
      // Ignore storage write failures.
    }
  }, [filter]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter]);

  const filteredEntries = useMemo(() => {
    if (filter === 'all') return entries;
    return entries.filter((entry) => entry.category === filter);
  }, [entries, filter]);

  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const hasMore = filteredEntries.length > visibleEntries.length;

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, ShiftLogEntry[]>();
    visibleEntries.forEach((entry) => {
      const groupKey = getDayLabel(entry.occurredAt);
      const list = groups.get(groupKey) ?? [];
      list.push(entry);
      groups.set(groupKey, list);
    });
    return Array.from(groups.entries());
  }, [visibleEntries]);

  return (
    <section
      id="shift-log"
      aria-labelledby="shift-log-heading"
      className="rounded-2xl border border-[#d6e5dd] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:border-[#284739] dark:bg-[#0f1914]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="shift-log-heading"
            className="text-sm font-semibold uppercase tracking-[0.11em] text-slate-700 dark:text-slate-200"
          >
            Shift Log
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Operational evidence timeline for promotion review.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Shift log filters">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={filter === option.id}
              onClick={() => setFilter(option.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                filter === option.id
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-[#cddfd5] text-slate-600 hover:border-emerald-500 hover:text-emerald-700 dark:border-[#304f41] dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {groupedEntries.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-[#caded1] bg-[#f6faf8] px-4 py-6 text-sm text-slate-600 dark:border-[#2f4d3f] dark:bg-[#122019] dark:text-slate-300">
          No worker record yet. Complete a lesson, practice run, or mission to create your first shift log entry.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {groupedEntries.map(([dayLabel, dayEntries]) => (
            <div key={dayLabel}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                {dayLabel}
              </h3>
              <ul className="space-y-2">
                {dayEntries.map((entry) => {
                  const EntryIcon = iconByCategory[entry.category];
                  return (
                    <li key={entry.id}>
                      <Link
                        href={entry.route}
                        className="flex items-start gap-3 rounded-lg border border-[#d8e5dd] bg-[#fbfdfc] px-3 py-2.5 transition hover:border-emerald-400 dark:border-[#2c4a3c] dark:bg-[#14231b] dark:hover:border-emerald-500"
                      >
                        <EntryIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {entry.action}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {entry.detail}
                          </p>
                        </div>
                        <time
                          dateTime={entry.occurredAt}
                          className="shrink-0 text-xs text-slate-500 dark:text-slate-400"
                        >
                          {formatTime(entry.occurredAt)}
                        </time>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="rounded-lg border border-[#cbddd3] px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-[#315142] dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-300"
          >
            Load more entries
          </button>
        </div>
      ) : null}
    </section>
  );
}
