'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    <div className="min-h-screen pb-24 lg:pb-10">
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header — matches Stitch Theory Hub */}
        <header className="mb-12 border-l-2 border-primary pl-6">
          <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-on-surface uppercase mb-2">
            Theory <span className="text-primary">Hub</span>
          </h1>
          <div className="flex items-center gap-4 font-mono text-xs text-on-surface-variant">
            <span className="bg-primary/10 text-primary px-2 py-0.5 border border-primary/20">
              SYSTEM_READY
            </span>
            <span className="tracking-widest uppercase">
              Select a track to begin deep learning protocols.
            </span>
          </div>
        </header>

        {/* Track cards — 3-column Stitch layout */}
        {orderedTopics.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {orderedTopics.map((topic, index) => {
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
              const borderAccent = `rgba(${style.accentRgb},0.2)`;
              const borderAccentInner = `rgba(${style.accentRgb},0.1)`;

              return (
                <Link
                  key={`${mode}-${topic.id}`}
                  href={`/learn/${topic.id}/${mode}`}
                  className="group h-full"
                >
                  <section
                    className="bg-surface-container-low p-1 relative overflow-hidden transition-all duration-300 h-full"
                    style={{
                      border: `1px solid ${borderAccent}`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 30px rgba(${style.accentRgb},0.15)`; e.currentTarget.style.borderColor = `rgba(${style.accentRgb},0.4)`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = borderAccent; }}
                  >
                    <div className="absolute top-0 right-0 p-2 text-[10px] font-mono" style={{ color: `rgba(${style.accentRgb},0.3)` }}>
                      ID: TR-{String(index + 1).padStart(2, '0')}
                    </div>
                    <div
                      className="p-6 h-full flex flex-col relative bg-surface-container-low"
                      style={{ border: `1px solid ${borderAccentInner}` }}
                    >
                      {/* Icon + badge */}
                      <div className="mb-6 flex justify-between items-start">
                        <div
                          className="w-12 h-12 flex items-center justify-center"
                          style={{ backgroundColor: accentDim, border: `1px solid ${borderAccent}` }}
                        >
                          <Image
                            src={trackIconSrc}
                            alt={`${getSimpleTrackName(topic.title)} logo`}
                            width={28}
                            height={28}
                            className="h-7 w-7 object-contain"
                          />
                        </div>
                        <span
                          className="font-mono text-[10px] px-2 uppercase"
                          style={{ color: accent, border: `1px solid rgba(${style.accentRgb},0.4)` }}
                        >
                          {meta.classification}
                        </span>
                      </div>

                      {/* Title + description */}
                      <h3 className="font-headline text-2xl font-bold mb-3 tracking-tight uppercase">
                        {getSimpleTrackName(topic.title)}
                      </h3>
                      <p className="text-on-surface-variant text-sm font-body mb-8 leading-relaxed">
                        {topic.description}
                      </p>

                      {/* Progress + CTA */}
                      <div className="mt-auto">
                        <div className="flex justify-between items-end mb-2">
                          <span className="font-mono text-[10px] text-on-surface-variant">
                            SYNC STATUS
                          </span>
                          <span className="font-mono text-sm font-bold" style={{ color: accent }}>
                            {topicProgressPct}%
                          </span>
                        </div>

                        {/* Battery bar */}
                        <div className="flex items-center gap-1 mb-8">
                          <div
                            className="w-1.5 h-3"
                            style={{ backgroundColor: `rgba(${style.accentRgb},0.3)` }}
                          />
                          <div
                            className="flex-1 flex gap-0.5 p-1"
                            style={{ border: `2px solid rgba(${style.accentRgb},0.2)`, backgroundColor: 'rgba(0,0,0,0.3)' }}
                          >
                            {Array.from({ length: 10 }, (_, i) => (
                              <div
                                key={i}
                                className="flex-1 h-3"
                                style={{
                                  backgroundColor: i < filledBlocks ? accent : `rgba(${style.accentRgb},0.1)`,
                                  border: i >= filledBlocks ? `1px solid rgba(${style.accentRgb},0.1)` : 'none'
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* CTA */}
                        {completedTopicChapters > 0 ? (
                          <div
                            className="w-full py-4 font-mono text-xs font-bold tracking-widest text-center transition-all duration-300 active:scale-[0.98] uppercase"
                            style={{
                              backgroundColor: accent,
                              color: '#0c0e10'
                            }}
                          >
                            Continue Track
                          </div>
                        ) : (
                          <div
                            className="w-full py-4 font-mono text-xs font-bold tracking-widest text-center transition-all duration-300 active:scale-[0.98] uppercase"
                            style={{
                              border: `1px solid ${accent}`,
                              color: accent
                            }}
                          >
                            Initialize Track
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-outline-variant bg-surface-container-low p-8 text-center">
            <p className="font-mono text-base font-semibold uppercase tracking-widest text-on-surface-variant">
              No theory tracks available yet
            </p>
          </div>
        )}

        {/* Stats bar */}
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {orderedTopics.map((topic) => {
            const completedTopicChapters = completedChapterCountByTopic[topic.id] ?? 0;
            const totalTopicChapters =
              chapterCountByTopic[topic.id] && chapterCountByTopic[topic.id] > 0
                ? chapterCountByTopic[topic.id]
                : topic.chapterCount;
            return (
              <div key={topic.id} className="p-4 border border-outline-variant bg-surface-container-low flex items-center gap-4">
                <Image
                  src={TRACK_ICON_SRC_BY_TOPIC[topic.id] ?? '/brand/pyspark-track-star.svg'}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain opacity-60"
                />
                <div>
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase">
                    {getSimpleTrackName(topic.title)}
                  </div>
                  <div className="text-xl font-headline font-bold">
                    {completedTopicChapters} / {totalTopicChapters}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
