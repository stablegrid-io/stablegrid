'use client';

import Link from 'next/link';
import { Play, Target } from 'lucide-react';
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
  const pct =
    goalPerDay > 0 ? Math.min(100, Math.round((questionsToday / goalPerDay) * 100)) : 0;
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
    <div className="overflow-hidden rounded-[1.75rem] border border-[#ddd3c4] bg-[rgba(255,249,242,0.86)] shadow-[0_18px_48px_-38px_rgba(17,24,39,0.22)] backdrop-blur dark:border-white/10 dark:bg-[rgba(10,18,14,0.74)]">
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#121b18] dark:text-[#f2f7f4]">
              Practice today
            </h2>
            <p className="mt-0.5 text-xs text-[#6d746f] dark:text-[#7e9589]">
              {done
                ? `Goal reached. ${questionsToday} questions answered today.`
                : `${questionsToday} of ${goalPerDay} questions answered today`}
            </p>
          </div>
          <span className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold text-brand-700 dark:text-brand-300">
            {pct}%
          </span>
        </div>

        <Target
          className={`mb-4 h-5 w-5 ${
            done ? 'text-amber-500' : 'text-brand-600 dark:text-brand-300'
          }`}
        />

        <div className="mb-5 w-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 100 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#fff', borderRadius: 100, opacity: 0.85, transition: 'width 1.5s cubic-bezier(.16,1,.3,1)' }} />
        </div>

        {weakestTopic && !done ? (
          <div className="mb-4 rounded-[1.15rem] border border-[#ebe2d5] bg-[rgba(255,255,255,0.72)] p-3 text-xs dark:border-white/8 dark:bg-[rgba(255,255,255,0.03)]">
            <span className="mr-1">{getHomeTopicMeta(weakestTopic.topic).icon}</span>
            <span className="text-[#6d746f] dark:text-[#7e9589]">
              Recommended topic:{' '}
            </span>
            <span className="font-medium text-[#28312d] dark:text-[#dbe7e0]">
              {getHomeTopicMeta(weakestTopic.topic).label}
            </span>
            <span className="text-[#6d746f] dark:text-[#7e9589]">
              {' '}
              because it currently has the lowest accuracy.
            </span>
          </div>
        ) : (
          <div className="mb-4 rounded-[1.15rem] border border-[#ebe2d5] bg-[rgba(255,255,255,0.72)] p-3 text-xs text-[#6d746f] dark:border-white/8 dark:bg-[rgba(255,255,255,0.03)] dark:text-[#7e9589]">
            {done
              ? 'You have met today’s practice goal. Run another short sprint if you want extra review.'
              : 'A short practice sprint is enough to keep recall fresh today.'}
          </div>
        )}

        <Link
          href={practiceHref}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#121b18] py-3 text-sm font-medium text-white transition-colors hover:bg-[#0b120f] dark:bg-brand-400 dark:text-[#08110b] dark:hover:bg-brand-300"
        >
          <Play className="h-3.5 w-3.5" />
          {done ? 'Practice again' : 'Start practice'}
        </Link>
      </div>
    </div>
  );
};
