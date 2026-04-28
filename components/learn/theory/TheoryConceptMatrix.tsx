'use client';

import { useState } from 'react';
import { Check, ChevronDown, Lock } from 'lucide-react';
import type { TheoryTrackSummary } from '@/data/learn/theory/tracks';

export interface ConceptMatrixTier {
  color: string;
  rgb: string;
  label: string;
}

interface TheoryConceptMatrixProps {
  tracks: TheoryTrackSummary[];
  tiers: ConceptMatrixTier[];
  completedChapterIds: string[];
  trackProgressPct: number[];
}

export function TheoryConceptMatrix({
  tracks,
  tiers,
  completedChapterIds,
  trackProgressPct,
}: TheoryConceptMatrixProps) {
  const [expanded, setExpanded] = useState(true);

  const totalConcepts = tracks.reduce((s, t) => s + t.chapters.length, 0);
  const masteredCount = tracks.reduce(
    (s, t) =>
      s + t.chapters.filter((c) => completedChapterIds.includes(c.id)).length,
    0,
  );
  const allMastered = totalConcepts > 0 && masteredCount === totalConcepts;

  return (
    <div
      className="relative mb-8 rounded-[22px] overflow-hidden"
      style={{
        background: '#181c20',
        border: '1px solid rgba(255,255,255,0.06)',
        opacity: 0,
        animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) forwards',
      }}
    >
      <div className="absolute top-0 left-0 z-10 pointer-events-none">
        <div
          className="absolute top-0 left-0 w-4 h-[1px]"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
        />
        <div
          className="absolute top-0 left-0 w-[1px] h-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
        />
      </div>
      <div className="absolute bottom-0 right-0 z-10 pointer-events-none">
        <div
          className="absolute bottom-0 right-0 w-4 h-[1px]"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-[1px] h-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
        />
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-white/[0.02]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono font-bold text-[11px] tracking-[0.22em] uppercase text-on-surface shrink-0">
            Concept Mastery
          </span>
          <span className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant/35 shrink-0">
            {masteredCount} / {totalConcepts}
          </span>
          {allMastered && (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono font-bold text-[9px] tracking-[0.18em] uppercase shrink-0"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: 'rgba(255,255,255,0.92)',
              }}
            >
              All Mastered
            </span>
          )}
        </div>
        <ChevronDown
          className="h-4 w-4 text-on-surface-variant/50 transition-transform duration-300 shrink-0"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-6 pt-1 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
            {tracks.map((track, i) => {
              const tier = tiers[i] ?? tiers[0];
              const prevPct = i > 0 ? trackProgressPct[i - 1] ?? 0 : 100;
              const isLocked = track.chapters.length === 0 || prevPct < 100;
              const trackComplete = (trackProgressPct[i] ?? 0) >= 100;

              return (
                <div key={track.slug} className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="font-mono font-bold text-[10px] tracking-[0.2em] uppercase"
                      style={{
                        color: isLocked
                          ? 'rgba(255,255,255,0.25)'
                          : tier.color,
                      }}
                    >
                      {tier.label}
                    </span>
                    {!isLocked && (
                      <span
                        className="font-mono text-[10px] tracking-widest uppercase"
                        style={{
                          color: trackComplete
                            ? tier.color
                            : 'rgba(255,255,255,0.35)',
                        }}
                      >
                        {
                          track.chapters.filter((c) =>
                            completedChapterIds.includes(c.id),
                          ).length
                        }
                        /{track.chapters.length}
                      </span>
                    )}
                    {isLocked && (
                      <Lock className="h-3 w-3 text-white/[0.15]" />
                    )}
                  </div>

                  <div
                    aria-hidden="true"
                    className="h-px w-full mb-2"
                    style={{
                      background: isLocked
                        ? 'rgba(255,255,255,0.04)'
                        : `linear-gradient(to right, rgba(${tier.rgb},0.35), transparent)`,
                    }}
                  />

                  <ul className="space-y-0.5">
                    {track.chapters.map((chapter) => {
                      const isComplete =
                        !isLocked &&
                        completedChapterIds.includes(chapter.id);
                      return (
                        <li
                          key={chapter.id}
                          className="flex items-center gap-2.5 py-1"
                        >
                          <div
                            className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[3px] transition-colors"
                            style={{
                              background: isComplete
                                ? `rgba(${tier.rgb},0.18)`
                                : 'rgba(255,255,255,0.03)',
                              border: isComplete
                                ? `1px solid rgba(${tier.rgb},0.5)`
                                : '1px solid rgba(255,255,255,0.08)',
                            }}
                          >
                            {isComplete && (
                              <Check
                                className="h-[9px] w-[9px]"
                                style={{ color: tier.color }}
                                strokeWidth={3.5}
                              />
                            )}
                          </div>
                          <span
                            className="text-[12.5px] leading-tight truncate"
                            style={{
                              color: isLocked
                                ? 'rgba(255,255,255,0.18)'
                                : isComplete
                                  ? 'rgba(255,255,255,0.88)'
                                  : 'rgba(255,255,255,0.42)',
                              fontWeight: isComplete ? 500 : 400,
                            }}
                            title={chapter.title}
                          >
                            {chapter.title}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
