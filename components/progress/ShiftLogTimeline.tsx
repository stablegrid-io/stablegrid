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
      className="rounded-[1.5rem] border border-[#d6ddd7] bg-white/72 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="shift-log-heading"
            className="text-sm font-semibold tracking-[-0.02em] text-[#121b18] dark:text-[#f2f7f4]"
          >
            Shift Log
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#6d746f] dark:text-[#7e9589]">
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
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                filter === option.id
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-[#d5ddd7] bg-white/70 text-[#56635c] hover:border-brand-500/30 hover:text-brand-700 dark:border-white/10 dark:bg-white/5 dark:text-[#9db6aa] dark:hover:border-brand-400/30 dark:hover:text-brand-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {groupedEntries.length === 0 ? (
        <div className="mt-4 rounded-[18px] border border-dashed border-[#d6ddd7] bg-white/60 px-4 py-6 text-sm leading-6 text-[#627068] dark:border-white/10 dark:bg-white/4 dark:text-[#8aa496]">
          No worker record yet. Complete a lesson, practice run, or mission to create your first shift log entry.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {groupedEntries.map(([dayLabel, dayEntries]) => (
            <div key={dayLabel}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#4e5f57] dark:text-[#8aa496]">
                {dayLabel}
              </h3>
              <ul className="space-y-2">
                {dayEntries.map((entry) => {
                  const EntryIcon = iconByCategory[entry.category];
                  return (
                    <li key={entry.id}>
                      <Link
                        href={entry.route}
                        className="flex items-start gap-3 rounded-[18px] border border-[#d6ddd7] bg-white/74 px-3.5 py-3 transition-colors hover:border-brand-500/30 dark:border-white/10 dark:bg-white/4 dark:hover:border-brand-400/25"
                      >
                        <EntryIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#121b18] dark:text-[#f2f7f4]">
                            {entry.action}
                          </p>
                          <p className="mt-0.5 text-xs text-[#6d746f] dark:text-[#7e9589]">
                            {entry.detail}
                          </p>
                        </div>
                        <time
                          dateTime={entry.occurredAt}
                          className="shrink-0 text-xs text-[#6d746f] dark:text-[#7e9589]"
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
            className="rounded-full border border-[#d5ddd7] bg-white/70 px-3.5 py-2 text-sm font-medium text-[#56635c] transition-colors hover:border-brand-500/30 hover:text-brand-700 dark:border-white/10 dark:bg-white/5 dark:text-[#9db6aa] dark:hover:border-brand-400/30 dark:hover:text-brand-300"
          >
            Load more entries
          </button>
        </div>
      ) : null}
    </section>
  );
}
