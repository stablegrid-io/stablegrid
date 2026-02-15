'use client';

import Link from 'next/link';
import { BookOpen, ChevronRight, Clock } from 'lucide-react';
import type { ReadingSession } from '@/types/progress';
import { getHomeTopicMeta } from '@/components/home/home/topicMeta';

const CHAPTER_TITLES: Record<string, Record<number, string>> = {
  pyspark: {
    1: 'What is Apache Spark?',
    2: 'Spark Architecture Deep Dive',
    3: 'Lazy Evaluation, DAG and Catalyst',
    4: 'Shuffles — The Performance Killer',
    5: 'Memory Management',
    6: 'Joins Deep Dive',
    7: 'Data Skew — The Silent Killer',
    8: 'Adaptive Query Execution',
    9: 'Data Formats and Storage Optimization',
    10: 'Delta Lake — ACID Transactions',
    11: 'UDFs and Pandas UDFs',
    12: 'Structured Streaming',
    13: 'The Optimization Playbook'
  },
  sql: {},
  python: {},
  fabric: {}
};

interface ContinueReadingProps {
  sessions: ReadingSession[];
}

export const ContinueReading = ({ sessions }: ContinueReadingProps) => {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
          <BookOpen className="h-4 w-4 text-neutral-500" />
          Continue Reading
        </h2>
        <Link
          href="/learn"
          className="text-xs font-medium text-brand-500 transition-colors hover:text-brand-600"
        >
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {sessions.map((session, index) => {
          const meta = getHomeTopicMeta(session.topic);
          const title =
            CHAPTER_TITLES[session.topic]?.[session.chapterNumber] ??
            `Chapter ${session.chapterNumber}`;
          const pct =
            session.sectionsTotal > 0
              ? Math.round((session.sectionsRead / session.sectionsTotal) * 100)
              : 0;
          const minutes = Math.round(session.activeSeconds / 60);
          const isPrimary = index === 0;
          const isCompleted = session.isCompleted || pct >= 100;

          return (
            <Link
              key={session.id}
              href={`/learn/${session.topic}/theory`}
              className="group flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 hover:border-neutral-200 hover:bg-neutral-50 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/40"
              style={
                isPrimary
                  ? {
                      borderColor: meta.softBorder,
                      backgroundColor: meta.softBg
                    }
                  : undefined
              }
            >
              <span className="flex-shrink-0 text-xl">{meta.icon}</span>

              <div className="min-w-0 flex-1">
                <div className="mb-0.5 text-xs text-neutral-400">
                  {meta.label} · Ch. {session.chapterNumber}
                  {isCompleted ? (
                    <span className="ml-2 font-medium text-emerald-500">✓ Complete</span>
                  ) : null}
                </div>
                <div className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                  {title}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isCompleted ? '#10b981' : meta.color
                      }}
                    />
                  </div>
                  <span className="flex-shrink-0 text-xs text-neutral-400">
                    {session.sectionsRead}/{session.sectionsTotal}
                  </span>
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-3">
                {minutes > 0 ? (
                  <div className="hidden items-center gap-1 text-xs text-neutral-400 sm:flex">
                    <Clock className="h-3 w-3" />
                    {minutes}m
                  </div>
                ) : null}
                <ChevronRight
                  className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${
                    isPrimary ? 'text-brand-500' : 'text-neutral-400'
                  }`}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
