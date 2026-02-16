'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Code2 } from 'lucide-react';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { getHomeTopicMeta } from '@/components/home/home/topicMeta';
import { formatUnitsAsKwh } from '@/lib/energy';

interface QuestionLookup {
  [id: string]: string;
}

interface QuestionAttempt {
  questionId: string;
  topic: string;
  correct: boolean;
  timestamp: number;
  xp: number;
}

export const RecentQuestionsCard = () => {
  const questionHistory = useProgressStore((state) => state.questionHistory);
  const [lookup, setLookup] = useState<QuestionLookup>({});

  const recentAttempts = useMemo(() => {
    const deduped = new Map<string, QuestionAttempt>();
    [...questionHistory]
      .sort((left, right) => right.timestamp - left.timestamp)
      .forEach((attempt) => {
        if (!deduped.has(attempt.questionId)) {
          deduped.set(attempt.questionId, attempt);
        }
      });
    return Array.from(deduped.values()).slice(0, 4);
  }, [questionHistory]);

  useEffect(() => {
    let active = true;

    if (recentAttempts.length === 0) {
      setLookup({});
      return () => {
        active = false;
      };
    }

    const neededIds = new Set(recentAttempts.map((attempt) => attempt.questionId));

    void import('@/data/questions/index.json').then((module) => {
      if (!active) return;

      const result: QuestionLookup = {};
      const groups = (module.default as { questions?: Record<string, Array<{ id: string; question: string }>> })
        .questions;

      Object.values(groups ?? {}).forEach((questions) => {
        questions.forEach((question) => {
          if (neededIds.has(question.id)) {
            result[question.id] = question.question;
          }
        });
      });

      setLookup(result);
    });

    return () => {
      active = false;
    };
  }, [recentAttempts]);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
          <Code2 className="h-4 w-4 text-neutral-500" />
          Recent Questions
        </h2>
        <Link
          href="/progress"
          className="text-xs font-medium text-brand-500 transition-colors hover:text-brand-600"
        >
          View all
        </Link>
      </div>

      {recentAttempts.length === 0 ? (
        <div className="px-5 py-6 text-sm text-neutral-500 dark:text-neutral-400">
          No recent answers yet. Start a practice session to populate this panel.
        </div>
      ) : (
        <div>
          {recentAttempts.map((attempt, index) => {
            const topicMeta = getHomeTopicMeta(attempt.topic);
            const questionText =
              lookup[attempt.questionId] ?? `Question ${attempt.questionId}`;

            return (
              <div
                key={`${attempt.questionId}-${attempt.timestamp}`}
                className={`flex items-start gap-3 px-5 py-3 ${
                  index < recentAttempts.length - 1
                    ? 'border-b border-neutral-100 dark:border-neutral-800'
                    : ''
                }`}
              >
                <div
                  className={`mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    attempt.correct
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                  }`}
                >
                  {attempt.correct ? '✓' : '✕'}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-5 text-neutral-800 dark:text-neutral-200">
                    {questionText}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        color: topicMeta.color,
                        border: `1px solid ${topicMeta.softBorder}`,
                        backgroundColor: topicMeta.softBg
                      }}
                    >
                      {topicMeta.label}
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {attempt.correct ? `+${formatUnitsAsKwh(attempt.xp)}` : '0 kWh'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
