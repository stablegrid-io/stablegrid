'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, CheckCircle } from 'lucide-react';
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

const TRACK_ACCENT_CYCLE = [
  { color: '#99f7ff', rgb: '153,247,255' },   // Beginner — cyan/blue
  { color: '#ffc965', rgb: '255,201,101' },   // Intermediate — yellow/amber
  { color: '#ff716c', rgb: '255,113,108' },   // Senior — red
  { color: '#bf81ff', rgb: '191,129,255' },   // Additional — purple
];

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

  const totalModules = tracks.reduce((sum, t) => sum + t.chapterCount, 0);
  const totalMinutes = tracks.reduce((sum, t) => sum + (t.totalMinutes ?? 0), 0);

  return (
    <div className="relative min-h-screen pb-24 lg:pb-10" style={accentVars}>
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

        {/* Header */}
        <header className="mb-12 max-w-5xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8" style={{ backgroundColor: accentColor }} />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: accentColor }}>
              {topicStyle.eyebrow ?? `${doc.topic} Track`} / Core Selection
            </span>
          </div>
          <h1 className="font-headline font-bold text-5xl lg:text-6xl tracking-tighter uppercase text-on-surface mb-4">
            {doc.topic.replace(/-/g, ' ')} <span className="text-primary opacity-50">MODULES</span>
          </h1>
          <p className="font-mono text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            System access granted. Select a specialized track to initialize neural mapping.
            Each track groups the course into an intentional progression.
          </p>
        </header>

        {/* Track cards */}
        <div className="grid grid-cols-1 gap-8 max-w-6xl">
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
                  chapterProgressById[left.id]?.lastActiveAt ?? '';
                const rightUpdatedAt =
                  liveModuleProgressById[right.id]?.updatedAt ??
                  chapterProgressById[right.id]?.lastActiveAt ?? '';
                return new Date(rightUpdatedAt || 0).getTime() - new Date(leftUpdatedAt || 0).getTime();
              })
              .find((chapter) => {
                const mp = liveModuleProgressById[chapter.id];
                const cp = chapterProgressById[chapter.id];
                return Boolean(mp?.lastVisitedRoute || mp?.currentLessonId || cp?.lastVisitedRoute || cp?.currentLessonId);
              });

            const segmentCount = 10;
            const filledSegments = Math.round((progressPct / 100) * segmentCount);
            const isStarted = progressPct > 0;
            const isComplete = progressPct >= 100;
            const ta = TRACK_ACCENT_CYCLE[trackIndex % TRACK_ACCENT_CYCLE.length];
            const trackCode = track.slug.replace(/[^a-z]/gi, '').substring(0, 2).toUpperCase();

            return (
              <Link
                key={track.slug}
                href={`/learn/${doc.topic}/theory/${track.slug}`}
                className="group"
              >
                <section
                  className="relative bg-surface-container-low p-1 overflow-hidden transition-all duration-300"
                  style={{ borderLeft: `4px solid ${ta.color}` }}
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: `rgba(${ta.rgb},0.05)` }}
                  />
                  <div
                    className="absolute -right-20 -top-20 w-64 h-64 blur-[100px] pointer-events-none"
                    style={{ backgroundColor: `rgba(${ta.rgb},0.1)` }}
                  />

                  <div className="relative bg-surface p-8 flex flex-col md:flex-row gap-10 border border-outline-variant/20">
                    {/* Left: Track Info */}
                    <div className="flex-1 space-y-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="font-mono text-[10px] px-2 py-0.5 border"
                              style={{
                                backgroundColor: `rgba(${ta.rgb},0.2)`,
                                color: ta.color,
                                borderColor: `rgba(${ta.rgb},0.3)`
                              }}
                            >
                              L-{String(trackIndex + 1).padStart(2, '0')}
                            </span>
                            <span
                              className="font-mono text-[10px] tracking-widest uppercase"
                              style={{ color: `rgba(${ta.rgb},0.7)` }}
                            >
                              {track.eyebrow}
                            </span>
                          </div>
                          <h2 className="font-headline font-bold text-3xl lg:text-4xl text-on-surface uppercase tracking-tight">
                            {track.title || track.label}
                          </h2>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-2xl" style={{ color: ta.color }}>
                            {String(track.chapterCount).padStart(2, '0')}
                          </span>
                          <span className="font-mono text-[10px] text-on-surface-variant uppercase">
                            MODULES LOADED
                          </span>
                        </div>
                      </div>

                      <p className="text-on-surface-variant font-body text-sm leading-relaxed max-w-md">
                        {track.description}
                      </p>

                      {/* Status chips */}
                      <div className="flex gap-4">
                        <div
                          className="flex items-center gap-2 px-3 py-1 border"
                          style={{
                            backgroundColor: `rgba(${ta.rgb},0.1)`,
                            borderColor: `rgba(${ta.rgb},0.2)`
                          }}
                        >
                          <CheckCircle className="h-3.5 w-3.5" style={{ color: ta.color }} />
                          <span className="font-mono text-[10px] font-bold uppercase" style={{ color: ta.color }}>
                            {completedModules}/{track.chapterCount} COMPLETE
                          </span>
                        </div>
                        <div className="flex items-center gap-2 border border-outline-variant px-3 py-1 opacity-60">
                          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                            {isComplete ? 'CLEARED' : 'OPEN'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Progress & Action */}
                    <div className="w-full md:w-80 flex flex-col justify-between border-l border-outline-variant/20 pl-0 md:pl-10 space-y-6 md:space-y-0">
                      <div>
                        <div className="flex justify-between items-end mb-3">
                          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                            PROGRESS STATUS
                          </span>
                          <span className="font-mono text-xl" style={{ color: ta.color }}>
                            {progressPct}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="flex-1 flex gap-0.5 p-1 bg-black/30" style={{ border: `2px solid ${ta.color}33` }}>
                            {Array.from({ length: segmentCount }, (_, i) => (
                              <div
                                key={i}
                                className="flex-1 h-3"
                                style={{
                                  backgroundColor: i < filledSegments ? ta.color : 'rgba(255,255,255,0.05)',
                                  border: i >= filledSegments ? `1px solid ${ta.color}1a` : 'none'
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* CTA */}
                      <div
                        className="w-full font-mono font-bold py-4 px-6 flex items-center justify-between transition-colors"
                        style={{
                          backgroundColor: ta.color,
                          color: '#0c0e10'
                        }}
                      >
                        <span>
                          {isComplete ? 'REVIEW' : isStarted ? 'RESUME' : 'BEGIN'} TRACK [{trackCode}-{String(trackIndex + 1).padStart(2, '0')}]
                        </span>
                        {isStarted && !isComplete ? (
                          <Zap className="h-4 w-4" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
};
