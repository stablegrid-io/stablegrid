'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Zap, MapPin, Cpu } from 'lucide-react';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import { getTrackConceptMeta } from '@/data/learn/theory/trackConceptMeta';
import { TOPIC_CATEGORY_MAP, CATEGORY_COLORS, type CategoryName } from '@/components/home/orbitalMapData';
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

        <Link
          href="/theory"
          className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-on-surface-variant/50 transition-colors hover:text-on-surface-variant"
        >
          <ArrowLeft className="h-4 w-4" />
          Theory Hub
        </Link>

        {/* Header */}
        <header className="mb-12 max-w-5xl">
          <h1 className="font-headline font-bold text-5xl lg:text-6xl tracking-tighter uppercase text-on-surface mb-3">
            {doc.topic.replace(/-/g, ' ')}
          </h1>
          {(() => {
            const cat = TOPIC_CATEGORY_MAP[doc.topic] ?? 'Theory';
            const catRgb = CATEGORY_COLORS[cat as CategoryName] ?? accentRgb;
            return (
              <div className="flex items-center gap-3">
                <div className="h-px w-8" style={{ backgroundColor: `rgb(${catRgb})` }} />
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: `rgb(${catRgb})` }}>
                  {cat}
                </span>
              </div>
            );
          })()}
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

            const conceptMeta = getTrackConceptMeta(doc.topic, track.slug);
            const filledBars = Math.round((progressPct / 100) * 12);

            return (
              <Link
                key={track.slug}
                href={`/learn/${doc.topic}/theory/${track.slug}`}
                className="group block"
              >
                <section
                  className="relative overflow-hidden rounded-2xl border backdrop-blur-2xl transition-all duration-500 hover:scale-[1.01]"
                  style={{
                    background: '#050507',
                    borderColor: `rgba(${ta.rgb},0.15)`,
                    boxShadow: `0 0 30px rgba(${ta.rgb},0.04)`,
                  }}
                >
                  {/* Top accent gradient */}
                  <div className="absolute top-0 inset-x-0 h-[2px]" style={{
                    background: `linear-gradient(90deg, transparent 5%, rgba(${ta.rgb},0.8), transparent 95%)`,
                  }} />

                  {/* Ambient glow */}
                  <div className="absolute inset-0 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500" style={{
                    background: `radial-gradient(ellipse at top left, rgba(${ta.rgb},0.08), transparent 50%)`,
                  }} />

                  <div className="relative p-8 lg:p-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-8">

                      {/* Left: Info */}
                      <div className="flex-1 space-y-5">
                        {/* Eyebrow */}
                        <div className="flex items-center gap-3">
                          <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: `rgba(${ta.rgb},0.2)`, boxShadow: `0 0 12px rgba(${ta.rgb},0.15)` }}>
                            <Zap className="h-3 w-3" style={{ color: ta.color }} />
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: ta.color }}>
                            {track.eyebrow ?? 'Theory Track'}
                          </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-on-surface group-hover:text-white transition-colors duration-300">
                          {track.title || track.label}
                        </h2>

                        {/* Tagline */}
                        {conceptMeta && (
                          <p className="max-w-xl text-[13px] leading-relaxed text-on-surface-variant/60">
                            {conceptMeta.tagline}
                          </p>
                        )}

                        {/* Stats row */}
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ border: `1px solid rgba(${ta.rgb},0.12)`, background: `rgba(${ta.rgb},0.05)` }}>
                            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: `rgba(${ta.rgb},0.5)` }}>Modules</span>
                            <span className="text-[13px] font-bold text-white">{track.chapterCount}</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ border: `1px solid rgba(${ta.rgb},0.12)`, background: `rgba(${ta.rgb},0.05)` }}>
                            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: `rgba(${ta.rgb},0.5)` }}>Duration</span>
                            <span className="text-[13px] font-bold text-white">
                              {conceptMeta?.estimatedDuration ?? `${Math.round(track.totalMinutes / 60)}h`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ border: `1px solid rgba(${ta.rgb},0.12)`, background: `rgba(${ta.rgb},0.05)` }}>
                            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: `rgba(${ta.rgb},0.5)` }}>Format</span>
                            <span className="text-[13px] font-bold text-white">Pure Theory</span>
                          </div>
                        </div>

                        {/* Concept meta */}
                        {conceptMeta && (
                          <div className="flex flex-wrap gap-x-5 gap-y-2">
                            <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/50">
                              <MapPin className="h-3 w-3 shrink-0" style={{ color: `rgba(${ta.rgb},0.7)` }} />
                              <span>{conceptMeta.scenario}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/50">
                              <Cpu className="h-3 w-3 shrink-0" style={{ color: `rgba(${ta.rgb},0.7)` }} />
                              <span>{conceptMeta.targetTechnology}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Progress */}
                      <div className="w-full lg:w-72 shrink-0 space-y-3">
                        <div className="rounded-xl p-4" style={{ border: `1px solid rgba(${ta.rgb},0.15)`, background: `rgba(${ta.rgb},0.04)` }}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: `rgba(${ta.rgb},0.6)` }}>Progress</span>
                            <span className="text-xl font-bold" style={{ color: ta.color }}>
                              {progressPct}<span className="text-[11px] font-normal text-on-surface-variant/30">%</span>
                            </span>
                          </div>

                          <div className="flex gap-[3px]">
                            {Array.from({ length: 12 }, (_, i) => (
                              <div
                                key={i}
                                className="flex-1 h-2 rounded-[2px]"
                                style={{
                                  backgroundColor: i < filledBars
                                    ? `rgba(${ta.rgb},${0.5 + (i / 12) * 0.4})`
                                    : `rgba(${ta.rgb},0.06)`,
                                  boxShadow: i === filledBars - 1 && filledBars > 0
                                    ? `0 0 6px rgba(${ta.rgb},0.4)` : 'none',
                                }}
                              />
                            ))}
                          </div>

                          <div className="mt-3 flex justify-between text-[10px] text-on-surface-variant/40">
                            <span>{completedModules} completed</span>
                            <span>{track.chapterCount - completedModules} remaining</span>
                          </div>
                        </div>

                        {/* CTA */}
                        <div
                          className="rounded-xl py-3 px-4 flex items-center justify-between text-[12px] font-semibold transition-all duration-300 group-hover:scale-[1.02]"
                          style={{
                            background: `rgba(${ta.rgb},0.12)`,
                            border: `1px solid rgba(${ta.rgb},0.25)`,
                            color: ta.color,
                          }}
                        >
                          <span>{isComplete ? 'Review track' : isStarted ? 'Continue' : 'Start track'}</span>
                          {isStarted && !isComplete ? (
                            <Zap className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowRight className="h-3.5 w-3.5" />
                          )}
                        </div>
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
