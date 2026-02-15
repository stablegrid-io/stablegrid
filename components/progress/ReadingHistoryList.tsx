'use client';

import Link from 'next/link';
import { BookOpen, CheckCircle2, Clock } from 'lucide-react';
import type { ReadingSession } from '@/types/progress';

const TOPIC_LABELS: Record<string, string> = {
  pyspark: 'PySpark',
  sql: 'SQL',
  python: 'Python',
  fabric: 'Microsoft Fabric'
};

interface ReadingHistoryListProps {
  sessions: ReadingSession[];
}

export const ReadingHistoryList = ({ sessions }: ReadingHistoryListProps) => {
  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-100 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <BookOpen className="mx-auto mb-3 h-8 w-8 text-neutral-300 dark:text-neutral-600" />
        <p className="text-sm font-medium text-neutral-500">No reading sessions yet</p>
        <p className="mt-1 text-xs text-neutral-400">
          Start a theory chapter to track your progress
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
        {sessions.map((session, index) => {
          const minutesRead = Math.round(session.activeSeconds / 60);
          const sectionPct =
            session.sectionsTotal > 0
              ? Math.round((session.sectionsRead / session.sectionsTotal) * 100)
              : 0;

          return (
            <Link
              key={session.id}
              href={`/learn/${session.topic}/theory`}
              className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                index < sessions.length - 1
                  ? 'border-b border-neutral-100 dark:border-neutral-800'
                  : ''
              }`}
            >
              <div className="flex-shrink-0">
                {session.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-neutral-200 dark:border-neutral-700">
                    <div
                      className="h-2 w-2 rounded-full bg-brand-500"
                      style={{ opacity: sectionPct / 100 }}
                    />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                  {(TOPIC_LABELS[session.topic] ?? session.topic)} · Ch. {session.chapterNumber}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-neutral-400">
                  <span>
                    {session.sectionsRead}/{session.sectionsTotal} sections
                  </span>
                  {minutesRead > 0 ? (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {minutesRead}m
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="w-20 flex-shrink-0">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-neutral-400">{sectionPct}%</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      session.isCompleted ? 'bg-emerald-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${sectionPct}%` }}
                  />
                </div>
              </div>

              <div className="hidden flex-shrink-0 text-xs text-neutral-400 sm:block">
                {formatRelative(session.lastActiveAt)}
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
