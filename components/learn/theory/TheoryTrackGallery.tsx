'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Layers3 } from 'lucide-react';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import { useTheoryModuleProgressSnapshots } from '@/lib/hooks/useTheoryModuleProgressSnapshots';
import { summarizeTrackLessonProgress } from '@/lib/learn/theoryTrackProgress';
import type { TheoryDoc } from '@/types/theory';
import type { TheoryTrackSummary } from '@/data/learn/theory/tracks';
import type {
  ServerTheoryChapterProgressSnapshot,
  ServerTheoryModuleProgressSnapshot
} from '@/lib/learn/serverTheoryProgress';

interface TheoryTrackGalleryProps {
  doc: TheoryDoc;
  tracks: TheoryTrackSummary[];
  completedChapterIds: string[];
  chapterProgressById?: Record<string, ServerTheoryChapterProgressSnapshot>;
  moduleProgressById?: Record<string, ServerTheoryModuleProgressSnapshot>;
}

export const TheoryTrackGallery = ({
  doc,
  tracks,
  completedChapterIds,
  chapterProgressById = {},
  moduleProgressById = {}
}: TheoryTrackGalleryProps) => {
  const {
    completedChapterIds: liveCompletedChapterIds,
    moduleProgressById: liveModuleProgressById
  } = useTheoryModuleProgressSnapshots({
    topic: doc.topic,
    initialCompletedChapterIds: completedChapterIds,
    initialModuleProgressById: moduleProgressById
  });
  const topicStyle = getTheoryTopicStyle(doc.topic);
  const accentVars = { '--theory-accent': topicStyle.accentRgb } as CSSProperties;

  return (
    <div className="min-h-screen bg-light-bg pb-24 dark:bg-dark-bg lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl" style={accentVars}>
          <Link
            href="/learn/theory"
            className="mb-8 inline-flex items-center gap-2 text-sm text-text-light-tertiary transition-colors hover:text-[rgb(var(--theory-accent))] dark:text-text-dark-tertiary"
          >
            <ArrowLeft className="h-4 w-4" />
            All Topics
          </Link>

          <header className="mb-10 max-w-3xl">
            <p
              className={`mb-2 text-xs font-medium uppercase tracking-[0.24em] ${topicStyle.accentTextClass}`}
            >
              Track Gallery
            </p>
            <h1 className="mb-3 text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {doc.title}
            </h1>
            <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
              Choose a guided path before you open modules. Each track groups the same
              course into a more intentional progression.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-6">
            {tracks.map((track) => {
              const { completedModules, progressPct } = summarizeTrackLessonProgress({
                chapters: track.chapters,
                completedChapterIds: liveCompletedChapterIds,
                chapterProgressById
              });
              const mostRecentModule = [...track.chapters]
                .sort((left, right) => {
                  const leftUpdatedAt =
                    liveModuleProgressById[left.id]?.updatedAt ??
                    chapterProgressById[left.id]?.lastActiveAt ??
                    '';
                  const rightUpdatedAt =
                    liveModuleProgressById[right.id]?.updatedAt ??
                    chapterProgressById[right.id]?.lastActiveAt ??
                    '';
                  return new Date(rightUpdatedAt || 0).getTime() - new Date(leftUpdatedAt || 0).getTime();
                })
                .find((chapter) => {
                  const moduleProgress = liveModuleProgressById[chapter.id];
                  const chapterProgress = chapterProgressById[chapter.id];
                  return Boolean(
                    moduleProgress?.lastVisitedRoute ||
                      moduleProgress?.currentLessonId ||
                      chapterProgress?.lastVisitedRoute ||
                      chapterProgress?.currentLessonId
                  );
                });

              return (
                <Link
                  key={track.slug}
                  href={`/learn/${doc.topic}/theory/${track.slug}`}
                  className="group relative overflow-hidden rounded-[32px] border border-light-border bg-light-surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(var(--theory-accent),0.4)] hover:shadow-[0_30px_90px_-44px_rgba(var(--theory-accent),0.42)] dark:border-dark-border dark:bg-dark-surface"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(var(--theory-accent),0.18),transparent_32%),linear-gradient(180deg,rgba(var(--theory-accent),0.08),transparent_46%)]" />
                  <div className="pointer-events-none absolute -right-12 top-10 h-44 w-44 rounded-full bg-[rgba(var(--theory-accent),0.1)] blur-3xl" />

                  <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl">
                      <div
                        className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${topicStyle.badgeClass}`}
                      >
                        <Layers3 className="h-3.5 w-3.5" />
                        {track.eyebrow}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-3xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                          {track.label}
                        </h2>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${topicStyle.badgeClass}`}
                        >
                          {track.chapterCount} modules
                        </span>
                      </div>

                      <p className="mt-4 max-w-2xl text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
                        {track.description}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-light-border bg-light-bg px-3 py-1.5 text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
                          {completedModules}/{track.chapterCount} modules complete
                        </span>
                      </div>
                    </div>

                    <div className="w-full max-w-sm rounded-3xl border border-[rgba(var(--theory-accent),0.18)] bg-light-bg/85 p-5 dark:bg-dark-bg/70">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-light-tertiary dark:text-text-dark-tertiary">
                          Track Progress
                        </span>
                        <span className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                          {progressPct}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                        <div
                          className="h-full rounded-full bg-[rgb(var(--theory-accent))] transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <p className="mt-4 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        {mostRecentModule
                          ? `Resume at ${mostRecentModule.title}.`
                          : 'Start from Module 1.'}
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-light-border/80 pt-5 dark:border-dark-border">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-light-border bg-light-bg px-3 py-1 text-xs text-text-light-tertiary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-tertiary">
                        {track.totalMinutes} min
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-2 text-sm font-medium text-text-light-primary transition-transform group-hover:translate-x-0.5 dark:text-text-dark-primary">
                      Open track
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
