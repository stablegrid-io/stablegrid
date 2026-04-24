'use client';

import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
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
      className="relative overflow-hidden rounded-[1.75rem] border px-5 py-5"
      style={{
        borderColor: meta.softBorder,
        background: `linear-gradient(135deg, ${meta.softBg}, rgba(255,249,242,0.82) 55%, rgba(34,185,153,0.08))`
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(circle at 100% 0%, rgba(34,185,153,0.12), transparent 26%), linear-gradient(90deg, rgba(245,158,11,0.1), transparent 38%)'
        }}
      />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center">
        <div
          className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-xl text-white"
          style={{
            background: `linear-gradient(135deg, ${meta.color}, #10b981)`,
            boxShadow: '0 8px 20px rgba(34,185,153, 0.25)'
          }}
        >
          {meta.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-[#0f8a5c] dark:text-brand-300">
            Continue learning
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-[#121b18] dark:text-[#f2f7f4]">
            Resume {meta.label} chapter {session.chapterNumber}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d655f] dark:text-[#8aa496]">
            You have completed {session.sectionsRead} of {session.sectionsTotal} sections.
            Open the chapter and finish the remaining work.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="rounded-full border border-[#d9cfbf] bg-[rgba(255,255,255,0.7)] px-3 py-2 text-xs font-medium text-[#47544f] dark:border-white/10 dark:bg-[rgba(255,255,255,0.03)] dark:text-[#8aa496]">
            {completion}% complete
          </div>
          <Link
            href={`/learn/${session.topic}/theory`}
            className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-[#121b18] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0b120f] dark:bg-brand-400 dark:text-[#08110b] dark:hover:bg-brand-300"
          >
            <Play className="h-3.5 w-3.5" />
            Open chapter
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
