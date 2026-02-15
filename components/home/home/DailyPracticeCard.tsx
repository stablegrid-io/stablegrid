'use client';

import Link from 'next/link';
import { Play, Zap } from 'lucide-react';
import type { TopicProgress } from '@/types/progress';
import { getHomeTopicMeta } from '@/components/home/home/topicMeta';

interface DailyPracticeCardProps {
  questionsToday: number;
  goalPerDay: number;
  topicProgress: TopicProgress[];
}

export const DailyPracticeCard = ({
  questionsToday,
  goalPerDay,
  topicProgress
}: DailyPracticeCardProps) => {
  const pct = Math.min(100, Math.round((questionsToday / goalPerDay) * 100));
  const done = questionsToday >= goalPerDay;

  const weakestTopic = topicProgress
    .filter((topic) => topic.practiceQuestionsAttempted > 5)
    .sort((left, right) => {
      const leftAcc =
        left.practiceQuestionsAttempted > 0
          ? left.practiceQuestionsCorrect / left.practiceQuestionsAttempted
          : 1;
      const rightAcc =
        right.practiceQuestionsAttempted > 0
          ? right.practiceQuestionsCorrect / right.practiceQuestionsAttempted
          : 1;
      return leftAcc - rightAcc;
    })[0];

  const practiceHref = weakestTopic
    ? `/practice/${weakestTopic.topic}`
    : '/practice/setup';

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Daily Practice
          </h2>
          <p className="mt-0.5 text-xs text-neutral-400">
            {done
              ? `Goal reached. ${questionsToday} questions today.`
              : `${questionsToday} of ${goalPerDay} questions today`}
          </p>
        </div>
        <Zap className={`h-5 w-5 ${done ? 'text-amber-400' : 'text-brand-500'}`} />
      </div>

      <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            done ? 'bg-amber-400' : 'bg-brand-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {weakestTopic && !done ? (
        <div className="mb-4 rounded-lg bg-neutral-50 p-3 text-xs dark:bg-neutral-800/50">
          <span className="mr-1">{getHomeTopicMeta(weakestTopic.topic).icon}</span>
          <span className="text-neutral-400">Focus area: </span>
          <span className="font-medium capitalize text-neutral-700 dark:text-neutral-300">
            {getHomeTopicMeta(weakestTopic.topic).label}
          </span>
          <span className="text-neutral-400"> — lowest accuracy</span>
        </div>
      ) : null}

      <Link
        href={practiceHref}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
      >
        <Play className="h-3.5 w-3.5" />
        {done ? 'Keep practicing' : 'Start Practice'}
      </Link>
    </div>
  );
};
