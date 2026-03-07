'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Code2, ExternalLink } from 'lucide-react';
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
      const groups = (
        module.default as {
          questions?: Record<string, Array<{ id: string; question: string }>>;
        }
      ).questions;

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
    <div className="overflow-hidden rounded-[1.75rem] border border-[#ddd3c4] bg-[rgba(255,249,242,0.86)] shadow-[0_18px_48px_-38px_rgba(17,24,39,0.22)] backdrop-blur dark:border-white/10 dark:bg-[rgba(10,18,14,0.74)]">
      <div className="flex items-center justify-between border-b border-[#ece1d2] px-5 py-4 dark:border-white/8">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[#121b18] dark:text-[#f2f7f4]">
          <Code2 className="h-4 w-4 text-brand-600 dark:text-brand-300" />
          Recent practice
        </h2>
        <Link
          href="/progress"
          className="text-xs font-medium text-brand-700 transition-colors hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
        >
          View progress
        </Link>
      </div>

      {recentAttempts.length === 0 ? (
        <div className="px-5 py-6">
          <p className="text-sm text-[#6d746f] dark:text-[#7e9589]">
            No recent answers yet. Start a practice session and the most recent question
            outcomes will surface here.
          </p>
          <Link
            href="/practice/setup"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-700 transition-colors hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
          >
            Start practice
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[#ece1d2] dark:divide-white/8">
          {recentAttempts.map((attempt) => {
            const topicMeta = getHomeTopicMeta(attempt.topic);
            const questionText =
              lookup[attempt.questionId] ?? `Question ${attempt.questionId}`;

            return (
              <div
                key={`${attempt.questionId}-${attempt.timestamp}`}
                className="flex items-start gap-3 px-5 py-4"
              >
                <div
                  className={`mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    attempt.correct
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400'
                      : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                  }`}
                >
                  {attempt.correct ? '✓' : '✕'}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-6 text-[#28312d] dark:text-[#dbe7e0]">
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
                    <span className="text-[11px] text-[#6d746f] dark:text-[#7e9589]">
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
