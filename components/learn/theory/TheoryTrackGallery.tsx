'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
  const accentRgb = topicStyle.accentRgb;
  const accentColor = `rgb(${accentRgb})`;
  const accentVars = { '--theory-accent': accentRgb } as CSSProperties;

  return (
    <div className="relative min-h-screen pb-24 lg:pb-10" style={accentVars}>
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

        {/* Page header — Stitch Journey Manifest style */}
        <header className="mb-12 relative overflow-hidden glass-panel border border-primary/20 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative z-10">
            <div className="space-y-4">
              <h2 className="font-mono text-xs tracking-[0.3em] text-primary">JOURNEY_MANIFEST</h2>
              <h1 className="font-headline text-4xl lg:text-5xl font-black text-on-surface tracking-tighter">
                {doc.title}
              </h1>
              <p className="max-w-xl text-sm text-on-surface-variant">
                Select a guided track before opening modules. Each track groups the course into an intentional progression.
              </p>
            </div>
          </div>
          {/* L-bracket corners */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />
        </header>

        {/* Track cards */}
        <div className="grid grid-cols-1 gap-5">
          {tracks.map((track, trackIndex) => {
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

            const segmentCount = 16;
            const filledSegments = Math.round((progressPct / 100) * segmentCount);
            const isStarted = progressPct > 0;
            const isComplete = progressPct >= 100;

            return (
              <Link
                key={track.slug}
                href={`/learn/${doc.topic}/theory/${track.slug}`}
                className="group relative block overflow-hidden glass-panel transition-all duration-200"
                style={{
                  border: `1px solid rgba(${accentRgb},${isStarted ? '0.35' : '0.1'})`,
                }}
              >
                {/* Top accent stripe */}
                <div
                  className="h-[2px] w-full"
                  style={{
                    background: `linear-gradient(90deg, rgba(${accentRgb},${isStarted ? '0.7' : '0.25'}), transparent 60%)`
                  }}
                />

                {/* Corner brackets */}
                <span className="absolute left-3 top-3 h-4 w-4 border-l border-t" style={{ borderColor: `rgba(${accentRgb},0.3)` }} />
                <span className="absolute right-3 top-3 h-4 w-4 border-r border-t" style={{ borderColor: `rgba(${accentRgb},0.3)` }} />
                <span className="absolute bottom-3 left-3 h-4 w-4 border-b border-l" style={{ borderColor: `rgba(${accentRgb},0.15)` }} />
                <span className="absolute bottom-3 right-3 h-4 w-4 border-b border-r" style={{ borderColor: `rgba(${accentRgb},0.15)` }} />

                <div className="relative flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-stretch lg:gap-8">

                  {/* Left: track index + info */}
                  <div className="flex flex-1 flex-col gap-4">

                    {/* Track number + eyebrow */}
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center border font-mono text-[11px] font-black"
                        style={{
                          borderColor: `rgba(${accentRgb},0.45)`,
                          background: `rgba(${accentRgb},0.08)`,
                          color: accentColor
                        }}
                      >
                        {String(trackIndex + 1).padStart(2, '0')}
                      </div>
                      <span
                        className="font-mono text-[9px] font-bold uppercase tracking-[0.4em]"
                        style={{ color: `rgba(${accentRgb},0.6)` }}
                      >
                        {track.eyebrow}
                      </span>
                    </div>

                    {/* Title + module count */}
                    <div>
                      <div className="flex flex-wrap items-baseline gap-3">
                        <h2 className="font-headline text-xl font-bold uppercase tracking-tight text-on-surface leading-tight">
                          {track.title || track.label}
                        </h2>
                        <span
                          className="border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em]"
                          style={{
                            borderColor: `rgba(${accentRgb},0.3)`,
                            color: `rgba(${accentRgb},0.7)`
                          }}
                        >
                          {track.chapterCount} modules
                        </span>
                      </div>
                      {track.subtitle && (
                        <p className="mt-1.5 font-mono text-[11px] font-semibold text-on-surface-variant">
                          {track.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <p className="max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                      {track.description}
                    </p>

                    {/* Footer chips */}
                    <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-outline-variant/20 pt-4">
                      <span className="border border-outline-variant/30 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">
                        {track.totalMinutes} min
                      </span>
                      <span
                        className="border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em]"
                        style={{
                          borderColor: `rgba(${accentRgb},0.2)`,
                          color: `rgba(${accentRgb},0.6)`
                        }}
                      >
                        {completedModules}/{track.chapterCount} complete
                      </span>
                      {isComplete && (
                        <span className="border border-success-700/30 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-success-400">
                          ✓ Cleared
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: progress panel */}
                  <div
                    className="flex w-full flex-shrink-0 flex-col justify-between border p-5 lg:w-64"
                    style={{
                      borderColor: `rgba(${accentRgb},0.15)`,
                      background: `rgba(${accentRgb},0.04)`
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-mono text-[8px] font-bold uppercase tracking-[0.35em] text-on-surface-variant">
                          Track Progress
                        </p>
                        <span
                          className="font-mono text-lg font-black tabular-nums"
                          style={{ color: progressPct > 0 ? accentColor : 'rgba(255,255,255,0.2)' }}
                        >
                          {progressPct}%
                        </span>
                      </div>

                      {/* Segmented progress bar */}
                      <div className="flex gap-[3px]">
                        {Array.from({ length: segmentCount }).map((_, i) => (
                          <div
                            key={i}
                            className="h-[5px] flex-1 transition-all duration-500"
                            style={{
                              background: i < filledSegments
                                ? accentColor
                                : `rgba(${accentRgb},0.1)`,
                              boxShadow: i < filledSegments
                                ? `0 0 4px rgba(${accentRgb},0.5)`
                                : 'none'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Resume line */}
                    <div className="mt-4 border-t pt-4" style={{ borderColor: `rgba(${accentRgb},0.12)` }}>
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant mb-1">
                        {mostRecentModule ? 'Last active' : 'Entry point'}
                      </p>
                      <p className="font-mono text-[11px] font-semibold text-on-surface leading-tight">
                        {mostRecentModule ? mostRecentModule.title : 'Module 01'}
                      </p>
                    </div>

                    {/* CTA */}
                    <div className="mt-4">
                      <div
                        className="flex items-center justify-between border px-3 py-2 transition-all duration-200 group-hover:opacity-100"
                        style={{
                          borderColor: `rgba(${accentRgb},0.4)`,
                          background: `rgba(${accentRgb},0.08)`,
                          opacity: 0.7
                        }}
                      >
                        <span
                          className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]"
                          style={{ color: accentColor }}
                        >
                          {isStarted ? 'Resume track' : 'Begin track'}
                        </span>
                        <ArrowRight
                          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                          style={{ color: accentColor }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
