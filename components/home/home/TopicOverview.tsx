'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { TopicProgress } from '@/types/progress';
import { getHomeTopicMeta, HOME_TOPIC_ORDER } from '@/components/home/home/topicMeta';

interface TopicOverviewProps {
  topicProgress: TopicProgress[];
}

export const TopicOverview = ({ topicProgress }: TopicOverviewProps) => {
  const progressMap = Object.fromEntries(topicProgress.map((item) => [item.topic, item]));

  const topics = HOME_TOPIC_ORDER.map((topicId) => {
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
    const activityScore = chaptersCompleted * 10 + practiceAttempted;

    return {
      topicId,
      meta,
      chaptersCompleted,
      chaptersTotal,
      theoryPct,
      practiceAttempted,
      practiceTotal,
      practicePct,
      accuracy,
      activityScore
    };
  }).sort((left, right) => right.activityScore - left.activityScore);

  const activeTopics = topics.filter(
    (topic) => topic.theoryPct > 0 || topic.practicePct > 0
  );
  const visibleTopics = (activeTopics.length > 0 ? activeTopics : topics).slice(0, 4);

  return (
    <div className="overflow-hidden rounded-[1.85rem] border border-[#ddd3c4] bg-[rgba(255,249,242,0.86)] shadow-[0_20px_56px_-44px_rgba(17,24,39,0.25)] backdrop-blur dark:border-white/10 dark:bg-[rgba(10,18,14,0.74)]">
      <div className="flex items-center justify-between border-b border-[#ece1d2] px-5 py-4 dark:border-white/8">
        <div>
          <h2 className="text-sm font-semibold text-[#121b18] dark:text-[#f2f7f4]">
            Topic progress
          </h2>
          <p className="mt-0.5 text-xs text-[#6d746f] dark:text-[#7e9589]">
            The topics with the clearest next step right now.
          </p>
        </div>
        <Link
          href="/stats"
          className="text-xs font-medium text-brand-700 transition-colors hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
        >
          View stats
        </Link>
      </div>

      <div className="space-y-3 px-5 py-5">
        {visibleTopics.map((topic) => {
          const status =
            topic.accuracy !== null
              ? `${topic.accuracy}% accuracy`
              : topic.theoryPct > 0
                ? 'Theory in progress'
                : 'Not started';

          return (
            <Link
              key={topic.topicId}
              href={`/learn/${topic.topicId}/theory`}
              className="group block rounded-[1.35rem] border border-[#e4dbce] bg-[rgba(255,255,255,0.74)] p-4 transition-all hover:-translate-y-0.5 hover:border-brand-500/30 hover:shadow-[0_18px_40px_-30px_rgba(34,185,153,0.18)] dark:border-white/8 dark:bg-[rgba(255,255,255,0.03)] dark:hover:border-white/15"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border text-base"
                    style={{
                      backgroundColor: topic.meta.softBg,
                      borderColor: topic.meta.softBorder
                    }}
                  >
                    {topic.meta.icon}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[#121b18] dark:text-[#f2f7f4]">
                      {topic.meta.label}
                    </span>
                    <span className="block text-xs text-[#6d746f] dark:text-[#7e9589]">
                      {topic.chaptersCompleted}/{topic.chaptersTotal} chapters completed
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#f1ede5] px-2 py-1 text-[11px] text-[#56635c] dark:bg-white/5 dark:text-[#8aa496]">
                    {status}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#6d746f] transition-transform group-hover:translate-x-0.5 dark:text-[#7e9589]" />
                </div>
              </div>

              <div className="space-y-2.5">
                <ProgressRow
                  label="Theory"
                  value={`${topic.chaptersCompleted}/${topic.chaptersTotal}`}
                  percentage={topic.theoryPct}
                  color={topic.meta.color}
                />
                <ProgressRow
                  label="Practice"
                  value={`${topic.practiceAttempted}/${topic.practiceTotal}`}
                  percentage={topic.practicePct}
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
    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#6d746f] dark:text-[#7e9589]">
      {label}
    </span>
    <div className="w-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 100 }}>
      <div style={{ width: `${percentage}%`, height: '100%', background: '#fff', borderRadius: 100, opacity: 0.85, transition: 'width 1.5s cubic-bezier(.16,1,.3,1)' }} />
    </div>
    <span className="text-[10px] text-[#6d746f] dark:text-[#7e9589]">{value}</span>
  </div>
);
