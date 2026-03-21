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
    <div className="relative min-h-screen overflow-hidden bg-[#060809] pb-24 lg:pb-10" style={accentVars}>
      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
          backgroundSize: '100% 3px'
        }}
      />
      {/* Tactical dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(250,250,250,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(250,250,250,0.03) 1px, transparent 1px)',
          backgroundSize: '42px 42px'
        }}
      />
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 opacity-[0.05] blur-[1px]"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${accentColor}, transparent 70%)` }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">

        {/* Page header */}
        <header className="mb-10">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.45em]" style={{ color: `rgba(${accentRgb},0.5)` }}>
            // Route Select · Track Gallery
          </p>
          <h1 className="mt-2 font-mono text-[clamp(1.4rem,3vw,2rem)] font-black uppercase tracking-[0.15em] text-white" style={{ textShadow: `0 0 40px rgba(${accentRgb},0.25)` }}>
            {doc.title}
          </h1>
          <div className="mt-2 h-px w-32" style={{ background: `linear-gradient(90deg, rgba(${accentRgb},0.7), transparent)` }} />
          <p className="mt-3 max-w-xl font-mono text-[11px] text-white/35">
            Select a guided track before opening modules. Each track groups the course into an intentional progression.
          </p>
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
                className="group relative block overflow-hidden border transition-all duration-200"
                style={{
                  background: 'rgba(8,10,9,0.92)',
                  borderColor: isStarted
                    ? `rgba(${accentRgb},0.35)`
                    : 'rgba(255,255,255,0.07)',
                  boxShadow: isStarted
                    ? `0 0 40px -16px rgba(${accentRgb},0.2), inset 0 1px 0 rgba(255,255,255,0.03)`
                    : 'inset 0 1px 0 rgba(255,255,255,0.02)'
                }}
              >
                {/* Top accent stripe */}
                <div
                  className="h-[2px] w-full transition-opacity duration-200"
                  style={{
                    background: `linear-gradient(90deg, rgba(${accentRgb},${isStarted ? '0.7' : '0.25'}), transparent 60%)`,
                    opacity: 1
                  }}
                />

                {/* Corner brackets */}
                <span className="absolute left-3 top-3 h-4 w-4 border-l border-t transition-colors duration-200" style={{ borderColor: `rgba(${accentRgb},0.3)` }} />
                <span className="absolute right-3 top-3 h-4 w-4 border-r border-t transition-colors duration-200" style={{ borderColor: `rgba(${accentRgb},0.3)` }} />
                <span className="absolute bottom-3 left-3 h-4 w-4 border-b border-l" style={{ borderColor: `rgba(${accentRgb},0.15)` }} />
                <span className="absolute bottom-3 right-3 h-4 w-4 border-b border-r" style={{ borderColor: `rgba(${accentRgb},0.15)` }} />

                {/* Ambient glow */}
                <div
                  className="pointer-events-none absolute right-0 top-0 h-[200px] w-[200px] translate-x-1/3 -translate-y-1/3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 blur-[50px]"
                  style={{ background: accentColor }}
                />

                {/* Tactical grid texture */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.025]"
                  style={{
                    backgroundImage:
                      `linear-gradient(rgba(${accentRgb},0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(${accentRgb},0.8) 1px, transparent 1px)`,
                    backgroundSize: '28px 28px'
                  }}
                />

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
                        <h2 className="font-mono text-[1.15rem] font-black uppercase tracking-[0.06em] text-white leading-tight">
                          {track.title || track.label}
                        </h2>
                        <span
                          className="border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em]"
                          style={{
                            borderColor: `rgba(${accentRgb},0.3)`,
                            color: `rgba(${accentRgb},0.7)`,
                            background: `rgba(${accentRgb},0.06)`
                          }}
                        >
                          {track.chapterCount} modules
                        </span>
                      </div>
                      {track.subtitle && (
                        <p className="mt-1.5 font-mono text-[11px] font-semibold text-white/50">
                          {track.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <p className="max-w-2xl text-[12px] leading-relaxed text-white/35">
                      {track.description}
                    </p>

                    {/* Footer chips */}
                    <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <span
                        className="border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30"
                        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
                      >
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
                        <span
                          className="border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em]"
                          style={{ borderColor: 'rgba(74,200,120,0.3)', color: 'rgba(74,200,120,0.8)' }}
                        >
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
                    {/* Progress header */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-mono text-[8px] font-bold uppercase tracking-[0.35em] text-white/25">
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
                            className="h-[5px] flex-1 rounded-[1px] transition-all duration-500"
                            style={{
                              background: i < filledSegments
                                ? accentColor
                                : 'rgba(255,255,255,0.05)',
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
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/20 mb-1">
                        {mostRecentModule ? 'Last active' : 'Entry point'}
                      </p>
                      <p className="font-mono text-[11px] font-semibold text-white/60 leading-tight">
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
