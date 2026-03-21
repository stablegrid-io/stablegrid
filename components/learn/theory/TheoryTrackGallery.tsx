'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, CheckCircle, Lock } from 'lucide-react';
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
  { color: '#99f7ff', rgb: '153,247,255' },
  { color: '#ff716c', rgb: '255,113,108' },
  { color: '#ffc965', rgb: '255,201,101' },
  { color: '#bf81ff', rgb: '191,129,255' },
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
            {doc.title.replace(/\s+modules?$/i, '')} <span className="text-primary opacity-50">MODULES</span>
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
                        {isComplete ? (
                          <div className="flex items-center gap-2 border border-outline-variant px-3 py-1 opacity-60">
                            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                              CLEARED
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 border border-outline-variant px-3 py-1">
                            <Lock className="h-3.5 w-3.5 text-on-surface-variant" />
                            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                              LOCKED
                            </span>
                          </div>
                        )}
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
                        <div className="flex gap-1 h-3">
                          {Array.from({ length: segmentCount }, (_, i) => (
                            <div
                              key={i}
                              className="flex-1"
                              style={{
                                backgroundColor: i < filledSegments ? ta.color : 'rgba(255,255,255,0.05)'
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Last active module */}
                      <div className="bg-surface-container p-4 border-t border-b border-outline-variant/30">
                        <span className="font-mono text-[10px] text-on-surface-variant block mb-1">
                          LAST ACTIVE MODULE
                        </span>
                        <div className="font-mono text-xs font-bold truncate" style={{ color: ta.color }}>
                          {mostRecentModule ? mostRecentModule.title.toUpperCase() : 'MODULE 01'}
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

        {/* System Footer */}
        <div className="mt-16 pt-8 border-t border-outline-variant/10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
          <div className="space-y-2">
            <span className="font-mono text-[10px] text-primary uppercase tracking-[0.3em]">
              Module Integrity
            </span>
            <div className="h-1 w-full bg-surface-container-highest relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-[85%] bg-primary shadow-[0_0_8px_rgba(0,242,255,0.5)]" />
            </div>
            <div className="flex justify-between font-mono text-[9px] text-on-surface-variant uppercase">
              <span>Active Nodes: {totalModules}</span>
              <span>Status: Stable</span>
            </div>
          </div>
          <div className="space-y-2 opacity-50">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-[0.3em]">
              Sync Latency
            </span>
            <div className="h-1 w-full bg-surface-container-highest relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-[12%] bg-on-surface-variant" />
            </div>
            <div className="flex justify-between font-mono text-[9px] text-on-surface-variant uppercase">
              <span>MS: 0.35s</span>
              <span>Buffer: 1024kb</span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-6">
            <div className="text-right">
              <div className="text-[10px] font-mono text-on-surface-variant">SESSION TIME</div>
              <div className="text-lg font-mono text-primary leading-none">--:--:--</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
