'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import type { ReadingSession } from '@/types/progress';
import { getHomeTopicMeta } from '@/components/home/home/topicMeta';

interface NextStepBannerProps {
  session: ReadingSession | null;
}

export const NextStepBanner = ({ session }: NextStepBannerProps) => {
  if (!session) {
    return null;
  }

  const meta = getHomeTopicMeta(session.topic);
  const completion =
    session.sectionsTotal > 0
      ? Math.round((session.sectionsRead / session.sectionsTotal) * 100)
      : 0;

  return (
    <div
      className="flex items-center gap-4 rounded-2xl border px-5 py-4"
      style={{
        borderColor: meta.softBorder,
        background: `linear-gradient(135deg, ${meta.softBg}, rgba(107,127,255,0.05))`
      }}
    >
      <div
        className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl text-white"
        style={{
          background: `linear-gradient(135deg, ${meta.color}, #6b7fff)`,
          boxShadow: '0 8px 20px rgba(107, 127, 255, 0.25)'
        }}
      >
        {meta.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
          Continue: {meta.label} · Chapter {session.chapterNumber}
        </p>
        <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-300">
          You&apos;re {completion}% through this chapter. Finish the remaining
          sections to complete it.
        </p>
      </div>
      <Link
        href={`/learn/${session.topic}/theory`}
        className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
      >
        <Play className="h-3.5 w-3.5" />
        Continue
      </Link>
    </div>
  );
};
