'use client';

import Link from 'next/link';
import { BookOpen, Code2 } from 'lucide-react';
import type { TopicProgress } from '@/types/progress';

const TOPIC_META: Record<
  string,
  { label: string; icon: string; color: string; hasPractice: boolean }
> = {
  pyspark: { label: 'PySpark', icon: '⚡', color: '#f59e0b', hasPractice: true },
  sql: { label: 'SQL', icon: '🗄️', color: '#6b7fff', hasPractice: true },
  python: { label: 'Python', icon: '🐍', color: '#10b981', hasPractice: true },
  fabric: {
    label: 'Microsoft Fabric',
    icon: '🏗️',
    color: '#06b6d4',
    hasPractice: true
  },
  airflow: {
    label: 'Apache Airflow',
    icon: '🌀',
    color: '#e24d42',
    hasPractice: false
  }
};

interface TopicProgressCardProps {
  topic: string;
  progress: TopicProgress | null;
}

export const TopicProgressCard = ({ topic, progress }: TopicProgressCardProps) => {
  const meta = TOPIC_META[topic];
  if (!meta) return null;

  const chaptersTotal = progress?.theoryChaptersTotal ?? 0;
  const chaptersCompleted = progress?.theoryChaptersCompleted ?? 0;
  const theoryPct =
    chaptersTotal > 0 ? Math.round((chaptersCompleted / chaptersTotal) * 100) : 0;

  const questionsTotal = progress?.practiceQuestionsTotal ?? 0;
  const questionsAttempted = progress?.practiceQuestionsAttempted ?? 0;
  const questionsCorrect = progress?.practiceQuestionsCorrect ?? 0;
  const practicePct =
    questionsTotal > 0 ? Math.round((questionsAttempted / questionsTotal) * 100) : 0;
  const accuracy =
    questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 0;

  const minutesRead = progress?.theoryTotalMinutesRead ?? 0;
  const isStarted = Boolean(progress?.firstActivityAt);
  const overallPct = meta.hasPractice ? Math.round((theoryPct + practicePct) / 2) : theoryPct;

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-5 transition-all duration-200 hover:border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
      <div className="mb-5 flex items-center gap-3">
        <span className="text-2xl">{meta.icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {meta.label}
          </h3>
          <p className="mt-0.5 text-xs text-neutral-400">
            {isStarted
              ? `${minutesRead}m read · last active ${formatRelative(progress?.lastActivityAt)}`
              : 'Not started yet'}
          </p>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold" style={{ color: meta.color }}>
            {overallPct}%
          </div>
          <div className="text-xs text-neutral-400">overall</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <BookOpen className="h-3.5 w-3.5" />
              Theory
            </div>
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              {chaptersCompleted}/{chaptersTotal}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${theoryPct}%`, backgroundColor: meta.color }}
            />
          </div>
          <div className="mt-1 text-xs text-neutral-400">
            {chaptersCompleted === 0
              ? 'Start reading'
              : chaptersCompleted === chaptersTotal
                ? 'All chapters done'
                : `${chaptersTotal - chaptersCompleted} chapters left`}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <Code2 className="h-3.5 w-3.5" />
              Practice
            </div>
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              {meta.hasPractice ? (questionsAttempted > 0 ? `${accuracy}% acc` : '—') : 'Theory only'}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-700"
              style={{ width: `${meta.hasPractice ? practicePct : 0}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-neutral-400">
            {meta.hasPractice
              ? questionsAttempted === 0
                ? 'No questions yet'
                : `${questionsCorrect}/${questionsAttempted} correct`
              : 'This track currently focuses on theory.'}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
        <Link
          href={`/learn/${topic}/theory`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-neutral-50 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          <BookOpen className="h-3.5 w-3.5" />
          {chaptersCompleted === 0 ? 'Start Theory' : 'Continue Reading'}
        </Link>
        {meta.hasPractice ? (
          <Link
            href={`/practice/${topic}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-neutral-50 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <Code2 className="h-3.5 w-3.5" />
            Practice
          </Link>
        ) : null}
      </div>
    </div>
  );
};

function formatRelative(dateStr?: string | null): string {
  if (!dateStr) return 'just now';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
