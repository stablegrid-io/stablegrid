'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, ChevronRight, Clock } from 'lucide-react';
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
  if (sessions.length === 0) {
    return (
      <div className="overflow-hidden rounded-[1.85rem] border border-[#ddd3c4] bg-[rgba(255,249,242,0.86)] shadow-[0_20px_56px_-44px_rgba(17,24,39,0.25)] backdrop-blur dark:border-white/10 dark:bg-[rgba(10,18,14,0.74)]">
        <div className="border-b border-[#ece1d2] px-5 py-4 dark:border-white/8">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[#121b18] dark:text-[#f2f7f4]">
            <BookOpen className="h-4 w-4 text-brand-600 dark:text-brand-300" />
            Active reading
          </h2>
        </div>

        <div className="px-5 py-6">
          <p className="text-lg font-semibold text-[#121b18] dark:text-[#f2f7f4]">
            No chapters in progress.
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#5d655f] dark:text-[#8aa496]">
            Open the theory path and your active chapters will appear here for quick
            return.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/learn/theory" className="btn btn-primary rounded-xl px-5 py-3">
              Open theory
            </Link>
            <Link
              href="/learn/pyspark/theory"
              className="btn btn-secondary rounded-xl px-5 py-3"
            >
              Start PySpark
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.85rem] border border-[#ddd3c4] bg-[rgba(255,249,242,0.86)] shadow-[0_20px_56px_-44px_rgba(17,24,39,0.25)] backdrop-blur dark:border-white/10 dark:bg-[rgba(10,18,14,0.74)]">
      <div className="flex items-center justify-between border-b border-[#ece1d2] px-5 py-4 dark:border-white/8">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[#121b18] dark:text-[#f2f7f4]">
          <BookOpen className="h-4 w-4 text-brand-600 dark:text-brand-300" />
          Active reading
        </h2>
        <Link
          href="/learn"
          className="text-xs font-medium text-brand-700 transition-colors hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
        >
          View all
        </Link>
      </div>

      <div className="space-y-3 px-5 py-5">
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
              className="group flex items-center gap-4 rounded-[1.4rem] border border-[#e4dbce] bg-[rgba(255,255,255,0.74)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/30 hover:shadow-[0_18px_40px_-30px_rgba(34,185,153,0.22)] dark:border-white/8 dark:bg-[rgba(255,255,255,0.03)]"
              style={
                isPrimary
                  ? {
                      borderColor: meta.softBorder,
                      background: `linear-gradient(135deg, ${meta.softBg}, rgba(255,255,255,0.76))`
                    }
                  : undefined
              }
            >
              <span className="flex-shrink-0 text-xl">{meta.icon}</span>

              <div className="min-w-0 flex-1">
                <div className="mb-0.5 text-xs text-[#6d746f] dark:text-[#7e9589]">
                  {meta.label} · Ch. {session.chapterNumber}
                  {isCompleted ? (
                    <span className="ml-2 font-medium text-brand-600 dark:text-brand-300">
                      ✓ Complete
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-base font-semibold text-[#121b18] dark:text-[#f2f7f4]">
                  {title}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e7ddd0] dark:bg-white/8">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isCompleted ? '#10b981' : meta.color
                      }}
                    />
                  </div>
                  <span className="flex-shrink-0 text-xs text-[#6d746f] dark:text-[#7e9589]">
                    {session.sectionsRead}/{session.sectionsTotal}
                  </span>
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-3">
                {minutes > 0 ? (
                  <div className="hidden items-center gap-1 text-xs text-[#6d746f] dark:text-[#7e9589] sm:flex">
                    <Clock className="h-3 w-3" />
                    {minutes}m
                  </div>
                ) : null}
                {isPrimary ? (
                  <span className="hidden items-center gap-2 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white sm:inline-flex">
                    Open
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-[#6d746f] transition-transform group-hover:translate-x-0.5 dark:text-[#7e9589]" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
