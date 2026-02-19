'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { TopicProgress } from '@/types/progress';
import {
  getHomeTopicMeta,
  HOME_TOPIC_ORDER
} from '@/components/home/home/topicMeta';

interface TopicOverviewProps {
  topicProgress: TopicProgress[];
}

export const TopicOverview = ({ topicProgress }: TopicOverviewProps) => {
  const progressMap = Object.fromEntries(topicProgress.map((item) => [item.topic, item]));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Topics</h2>
        <Link
          href="/progress"
          className="text-xs font-medium text-brand-500 transition-colors hover:text-brand-600"
        >
          View progress
        </Link>
      </div>

      <div className="space-y-2.5">
        {HOME_TOPIC_ORDER.map((topicId) => {
          const meta = getHomeTopicMeta(topicId);
          const progress = progressMap[topicId];

          const chaptersTotal =
            progress?.theoryChaptersTotal && progress.theoryChaptersTotal > 0
              ? progress.theoryChaptersTotal
              : meta.fallbackChapters;
          const chaptersCompleted = progress?.theoryChaptersCompleted ?? 0;
          const theoryPct =
            chaptersTotal > 0
              ? Math.min(100, Math.round((chaptersCompleted / chaptersTotal) * 100))
              : 0;

          const practiceTotal =
            progress?.practiceQuestionsTotal && progress.practiceQuestionsTotal > 0
              ? progress.practiceQuestionsTotal
              : meta.fallbackQuestions;
          const practiceAttempted = progress?.practiceQuestionsAttempted ?? 0;
          const practiceCorrect = progress?.practiceQuestionsCorrect ?? 0;
          const practicePct =
            practiceTotal > 0
              ? Math.min(100, Math.round((practiceAttempted / practiceTotal) * 100))
              : 0;
          const accuracy =
            practiceAttempted > 0
              ? Math.round((practiceCorrect / practiceAttempted) * 100)
              : null;

          return (
            <Link
              key={topicId}
              href={`/learn/${topicId}/theory`}
              className="group block rounded-xl border border-neutral-100 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{meta.icon}</span>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {meta.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {accuracy !== null ? `${accuracy}% acc` : '—'}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <ProgressRow
                  label="Theory"
                  value={`${chaptersCompleted}/${chaptersTotal}`}
                  percentage={theoryPct}
                  color={meta.color}
                />
                <ProgressRow
                  label="Practice"
                  value={`${practiceAttempted}/${practiceTotal}`}
                  percentage={practicePct}
                  color="#10b981"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const ProgressRow = ({
  label,
  value,
  percentage,
  color
}: {
  label: string;
  value: string;
  percentage: number;
  color: string;
}) => (
  <div className="grid grid-cols-[46px_1fr_auto] items-center gap-2">
    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500">
      {label}
    </span>
    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${percentage}%`, backgroundColor: color }}
      />
    </div>
    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{value}</span>
  </div>
);
