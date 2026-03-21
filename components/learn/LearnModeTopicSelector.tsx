'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import { getLearnTopicMeta, learnTopics } from '@/data/learn';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';

type LearnMode = 'theory';

interface LearnModeTopicSelectorProps {
  mode: LearnMode;
  initialCompletedChapterCountByTopic?: Record<string, number>;
  initialChapterCountByTopic?: Record<string, number>;
}

interface TopicEntry {
  id: string;
  title: string;
  description: string;
  functionCount: number;
  chapterCount: number;
  chapterMinutes: number;
  workload: number;
  depth: 'starter' | 'standard' | 'deep';
}

const TRACK_ICON_SRC_BY_TOPIC: Record<string, string> = {
  pyspark: '/brand/pyspark-track-star.svg',
  fabric: '/brand/microsoft-fabric-track.svg',
  airflow: '/brand/apache-airflow-logo.svg'
};

const TRACK_META_BY_TOPIC: Record<string, { classification: string; label: string }> = {
  pyspark: { classification: 'FLAGSHIP', label: 'FLAGSHIP TRACK' },
  fabric: { classification: 'PLATFORM', label: 'PLATFORM TRACK' },
  airflow: { classification: 'ORCHESTRATION', label: 'BEGINNER TRACK' }
};

const getSimpleTrackName = (title: string) => {
  return title.replace(/\s+modules?$/i, '').trim();
};

export function LearnModeTopicSelector({
  mode,
  initialCompletedChapterCountByTopic = {},
  initialChapterCountByTopic = {}
}: LearnModeTopicSelectorProps) {
  const completedChapterCountByTopic = initialCompletedChapterCountByTopic;
  const chapterCountByTopic = initialChapterCountByTopic;

  const topics = useMemo<TopicEntry[]>(() => {
    return learnTopics.map((topic) => {
      const topicMeta = getLearnTopicMeta(topic.id);
      const workload = topic.chapterCount;

      return {
        ...topic,
        chapterMinutes: topicMeta?.chapterMinutes ?? 0,
        workload,
        depth: workload <= 3 ? 'starter' : workload <= 8 ? 'standard' : 'deep'
      };
    });
  }, []);

  const orderedTopics = useMemo(() => {
    return [...topics].sort((left, right) => {
      if (left.workload !== right.workload) {
        return right.workload - left.workload;
      }
      return left.title.localeCompare(right.title);
    });
  }, [topics]);

  return (
    <div className="min-h-screen bg-[#06080a] pb-24 lg:pb-10">
      {/* Scanline grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
          backgroundSize: '100% 3px'
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 py-8">
        {/* Page header */}
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#1a2420]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-[#2e4a40]">
              INTEL-BASE · THEORY-SELECT
            </span>
            <div className="h-px flex-1 bg-[#1a2420]" />
          </div>
          <h1 className="font-mono text-3xl font-black uppercase tracking-[0.06em] text-[#deeee6]">
            Theory
          </h1>
          <p className="mt-1 font-mono text-xs tracking-[0.12em] text-[#3a5a4a]">
            Select a track · Browse categories and chapters
          </p>
        </div>

        {/* Track cards */}
        {orderedTopics.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {orderedTopics.map((topic) => {
              const trackIconSrc =
                TRACK_ICON_SRC_BY_TOPIC[topic.id] ?? '/brand/pyspark-track-star.svg';
              const style = getTheoryTopicStyle(topic.id);
              const meta = TRACK_META_BY_TOPIC[topic.id] ?? {
                classification: 'TRACK',
                label: 'THEORY TRACK'
              };
              const completedTopicChapters = completedChapterCountByTopic[topic.id] ?? 0;
              const totalTopicChapters =
                chapterCountByTopic[topic.id] && chapterCountByTopic[topic.id] > 0
                  ? chapterCountByTopic[topic.id]
                  : topic.chapterCount;
              const topicProgressPct =
                totalTopicChapters > 0
                  ? Math.round((completedTopicChapters / totalTopicChapters) * 100)
                  : 0;
              const filledBlocks = Math.round((topicProgressPct / 100) * 10);
              const accent = `rgb(${style.accentRgb})`;
              const accentDim = `rgba(${style.accentRgb},0.15)`;
              const accentGlow = `rgba(${style.accentRgb},0.35)`;
              const serial = `TK-${String(completedTopicChapters).padStart(4, '0')}`;

              return (
                <Link
                  key={`${mode}-${topic.id}`}
                  href={`/learn/${topic.id}/${mode}`}
                  className="group relative flex flex-col overflow-hidden rounded-none transition-all duration-300 hover:-translate-y-1"
                  style={{ '--accent': accent } as CSSProperties}
                >
                  {/* Card body */}
                  <div
                    className="relative flex flex-1 flex-col overflow-hidden border bg-[#0c0f0e]"
                    style={{
                      borderColor: `rgba(${style.accentRgb},0.22)`,
                      boxShadow: `0 0 0 1px rgba(${style.accentRgb},0.08), 0 24px 60px -20px rgba(${style.accentRgb},0.18), inset 0 1px 0 rgba(255,255,255,0.04)`
                    }}
                  >
                    {/* Top accent stripe */}
                    <div
                      className="h-[3px] w-full"
                      style={{ background: `linear-gradient(90deg, ${accent}, transparent 80%)` }}
                    />

                    {/* Corner targeting brackets */}
                    <span
                      className="absolute left-2.5 top-2.5 h-5 w-5 border-l-2 border-t-2 transition-all duration-300 group-hover:h-6 group-hover:w-6"
                      style={{ borderColor: accent }}
                    />
                    <span
                      className="absolute right-2.5 top-2.5 h-5 w-5 border-r-2 border-t-2 transition-all duration-300 group-hover:h-6 group-hover:w-6"
                      style={{ borderColor: accent }}
                    />
                    <span
                      className="absolute bottom-2.5 left-2.5 h-5 w-5 border-b-2 border-l-2 transition-all duration-300 group-hover:h-6 group-hover:w-6"
                      style={{ borderColor: accent }}
                    />
                    <span
                      className="absolute bottom-2.5 right-2.5 h-5 w-5 border-b-2 border-r-2 transition-all duration-300 group-hover:h-6 group-hover:w-6"
                      style={{ borderColor: accent }}
                    />

                    {/* Inner glow bg */}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{
                        background: `radial-gradient(ellipse at 50% 30%, rgba(${style.accentRgb},0.07), transparent 65%)`
                      }}
                    />

                    {/* Classification + serial row */}
                    <div className="flex items-center justify-between px-4 pt-4">
                      <span
                        className="font-mono text-[8px] font-bold uppercase tracking-[0.3em]"
                        style={{ color: accent }}
                      >
                        ▶ {meta.classification}
                      </span>
                      <span className="font-mono text-[8px] tracking-[0.2em] text-[#2e4a40]">
                        {serial}
                      </span>
                    </div>

                    {/* Icon hero area */}
                    <div className="flex flex-col items-center justify-center px-6 py-7">
                      <div className="relative flex h-20 w-20 items-center justify-center">
                        {/* Glow disc behind icon */}
                        <div
                          className="absolute inset-0 rounded-full blur-xl transition-all duration-300 group-hover:scale-125"
                          style={{ backgroundColor: accentGlow }}
                        />
                        {/* Hex ring */}
                        <div
                          className="absolute inset-0 rounded-full border-2"
                          style={{ borderColor: `rgba(${style.accentRgb},0.3)` }}
                        />
                        <div
                          className="absolute inset-2 rounded-full border"
                          style={{ borderColor: `rgba(${style.accentRgb},0.15)` }}
                        />
                        <Image
                          src={trackIconSrc}
                          alt={`${getSimpleTrackName(topic.title)} logo`}
                          width={36}
                          height={36}
                          className="relative h-9 w-9 object-contain"
                        />
                      </div>

                      {/* Label below icon */}
                      <span
                        className="mt-4 font-mono text-[9px] font-bold uppercase tracking-[0.35em]"
                        style={{ color: `rgba(${style.accentRgb},0.6)` }}
                      >
                        {meta.label}
                      </span>
                    </div>

                    {/* Title + description */}
                    <div className="px-5 pb-3">
                      <h2 className="font-mono text-xl font-black uppercase tracking-[0.06em] text-[#deeee6]">
                        {getSimpleTrackName(topic.title)}
                      </h2>
                      <p className="mt-2 font-mono text-[11px] leading-5 tracking-[0.02em] text-[#3a5a4a]">
                        {topic.description}
                      </p>
                    </div>

                    {/* Divider */}
                    <div
                      className="mx-5 my-3 h-px"
                      style={{ background: `linear-gradient(90deg, ${accent}30, transparent)` }}
                    />

                    {/* Segmented progress bar */}
                    <div className="px-5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-[#2e4a40]">
                          Completion
                        </span>
                        <span
                          className="font-mono text-[10px] font-bold tabular-nums"
                          style={{ color: accent }}
                        >
                          {topicProgressPct}%
                        </span>
                      </div>
                      <div className="flex gap-[3px]">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div
                            key={i}
                            className="h-1.5 flex-1 transition-all duration-500"
                            style={{
                              backgroundColor:
                                i < filledBlocks
                                  ? accent
                                  : `rgba(${style.accentRgb},0.12)`,
                              boxShadow:
                                i < filledBlocks ? `0 0 4px ${accentGlow}` : 'none'
                            }}
                          />
                        ))}
                      </div>
                      <p className="mt-1.5 font-mono text-[9px] tracking-[0.1em] text-[#2a4038]">
                        {completedTopicChapters}/{totalTopicChapters} chapters read
                      </p>
                    </div>

                    {/* CTA button */}
                    <div className="p-5 pt-4">
                      <div
                        className="relative flex w-full items-center justify-between overflow-hidden px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-200 group-hover:tracking-[0.24em]"
                        style={{
                          border: `1px solid rgba(${style.accentRgb},0.4)`,
                          color: accent,
                          background: accentDim
                        }}
                      >
                        <span className="relative z-10">
                          {completedTopicChapters > 0 ? 'Continue track' : 'Begin track'}
                        </span>
                        <ChevronRight className="relative z-10 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        {/* Button sweep on hover */}
                        <div
                          className="absolute inset-0 -translate-x-full transition-transform duration-300 group-hover:translate-x-0"
                          style={{
                            background: `linear-gradient(90deg, transparent, rgba(${style.accentRgb},0.1))`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-[#1a2a22] bg-[#0c0f0e] p-8 text-center">
            <p className="font-mono text-base font-semibold uppercase tracking-[0.1em] text-[#3a5a4a]">
              No theory tracks available yet
            </p>
          </div>
        )}

        {/* Footer serial line */}
        <div className="mt-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#111a16]" />
          <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-[#1e3028]">
            SGR · STABLE-GRID · INTEL-BASE
          </span>
          <div className="h-px flex-1 bg-[#111a16]" />
        </div>
      </div>
    </div>
  );
}
