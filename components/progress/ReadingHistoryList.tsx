'use client';

import Link from 'next/link';
import { BookOpen, CheckCircle2, Clock } from 'lucide-react';
import type { ReadingHistoryEntry } from '@/types/progress';

const TOPIC_LABELS: Record<string, string> = {
  pyspark: 'PySpark',
  'pyspark-data-engineering-track': 'PySpark Data Engineering',
  sql: 'SQL',
  python: 'Python',
  fabric: 'Microsoft Fabric',
  'fabric-data-engineering-track': 'Fabric Data Engineering',
  'fabric-business-intelligence-track': 'Fabric Business Intelligence',
  airflow: 'Apache Airflow'
};

interface ReadingHistoryListProps {
  entries: ReadingHistoryEntry[];
}

export const ReadingHistoryList = ({ entries }: ReadingHistoryListProps) => {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-100 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <BookOpen className="mx-auto mb-3 h-8 w-8 text-neutral-300 dark:text-neutral-600" />
        <p className="text-sm font-medium text-neutral-500">No lesson history yet</p>
        <p className="mt-1 text-xs text-neutral-400">
          Spend 30 seconds on a lesson to log it here
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">
        Recent Reading
      </h2>
      <div className="overflow-hidden rounded-xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        {entries.map((entry, index) => {
          const href = `/learn/${entry.topic}/theory/all?chapter=${encodeURIComponent(
            entry.chapterId
          )}&lesson=${encodeURIComponent(entry.lessonId)}`;

          return (
            <Link
              key={entry.id}
              href={href}
              className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                index < entries.length - 1
                  ? 'border-b border-neutral-100 dark:border-neutral-800'
                  : ''
              }`}
            >
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-brand-500" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                  {(TOPIC_LABELS[entry.topic] ?? entry.topic)} · M{entry.chapterNumber} · L
                  {entry.lessonOrder}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-neutral-400">
                  <span>{entry.chapterTitle}</span>
                  <span>·</span>
                  <span>{entry.lessonTitle}</span>
                </div>
              </div>

              <div className="hidden flex-shrink-0 items-center gap-1 text-xs text-neutral-400 sm:flex">
                <Clock className="h-3 w-3" />
                <span>{formatRelative(entry.readAt)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
