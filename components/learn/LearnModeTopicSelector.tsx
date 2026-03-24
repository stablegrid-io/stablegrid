'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { getLearnTopicMeta, learnTopics } from '@/data/learn';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import { CATEGORY_COLORS, type CategoryName } from '@/components/home/orbitalMapData';

type LearnMode = 'theory';
type TopicFilter = 'all' | 'in-progress' | 'completed' | 'untouched';

const TOPIC_FILTERS: Array<{ id: TopicFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'untouched', label: 'Untouched' },
];

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
  airflow: '/brand/apache-airflow-logo.svg',
  kafka: '/brand/apache-kafka-logo.svg',
  sql: '/brand/sql-logo.svg',
  docker: '/brand/docker-logo.svg',
  dbt: '/brand/dbt-logo.svg',
  databricks: '/brand/databricks-logo.svg',
  'data-modeling': '/brand/data-modeling-logo.svg',
  'python-de': '/brand/python-logo.svg',
  'cloud-infra': '/brand/cloud-infra-logo.svg',
  'data-quality': '/brand/data-quality-logo.svg',
  iceberg: '/brand/apache-iceberg-logo.svg',
  'git-cicd': '/brand/git-logo.svg',
  flink: '/brand/apache-flink-logo.svg',
  snowflake: '/brand/snowflake-logo.svg',
  terraform: '/brand/terraform-logo.svg',
  'spark-streaming': '/brand/spark-streaming-logo.svg',
  governance: '/brand/governance-logo.svg',
};

const TRACK_META_BY_TOPIC: Record<string, { classification: string; category: string; label: string }> = {
  pyspark:          { classification: 'PROCESSING',      category: 'Processing',      label: 'PROCESSING' },
  fabric:           { classification: 'PLATFORM',        category: 'Platforms',        label: 'PLATFORM' },
  airflow:          { classification: 'ORCHESTRATION',   category: 'Orchestration',    label: 'ORCHESTRATION' },
  kafka:            { classification: 'ORCHESTRATION',   category: 'Orchestration',    label: 'ORCHESTRATION' },
  sql:              { classification: 'FOUNDATIONS',      category: 'Foundations',      label: 'FOUNDATIONS' },
  docker:           { classification: 'INFRASTRUCTURE',  category: 'Infrastructure',   label: 'INFRASTRUCTURE' },
  dbt:              { classification: 'PROCESSING',      category: 'Processing',       label: 'PROCESSING' },
  databricks:       { classification: 'PLATFORM',        category: 'Platforms',         label: 'PLATFORM' },
  'data-modeling':  { classification: 'STORAGE',         category: 'Storage',           label: 'STORAGE' },
  'python-de':      { classification: 'FOUNDATIONS',     category: 'Foundations',       label: 'FOUNDATIONS' },
  'cloud-infra':    { classification: 'INFRASTRUCTURE',  category: 'Infrastructure',    label: 'INFRASTRUCTURE' },
  'data-quality':   { classification: 'STORAGE',         category: 'Storage',           label: 'STORAGE' },
  iceberg:          { classification: 'STORAGE',         category: 'Storage',           label: 'STORAGE' },
  'git-cicd':       { classification: 'INFRASTRUCTURE',  category: 'Infrastructure',    label: 'INFRASTRUCTURE' },
  flink:            { classification: 'ORCHESTRATION',   category: 'Orchestration',     label: 'ORCHESTRATION' },
  snowflake:        { classification: 'PLATFORM',        category: 'Platforms',         label: 'PLATFORM' },
  terraform:        { classification: 'INFRASTRUCTURE',  category: 'Infrastructure',    label: 'INFRASTRUCTURE' },
  'spark-streaming':{ classification: 'PROCESSING',      category: 'Processing',        label: 'PROCESSING' },
  governance:       { classification: 'FOUNDATIONS',     category: 'Foundations',        label: 'FOUNDATIONS' },
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

  const [topicFilter, setTopicFilter] = useState<TopicFilter>('all');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const topicStatuses = useMemo(() => {
    const statuses: Record<string, 'completed' | 'in-progress' | 'untouched'> = {};
    for (const t of orderedTopics) {
      const completed = completedChapterCountByTopic[t.id] ?? 0;
      const total = chapterCountByTopic[t.id] ?? 0;
      if (total > 0 && completed >= total) statuses[t.id] = 'completed';
      else if (completed > 0) statuses[t.id] = 'in-progress';
      else statuses[t.id] = 'untouched';
    }
    return statuses;
  }, [orderedTopics, completedChapterCountByTopic, chapterCountByTopic]);

  const filteredTopics = useMemo(() => {
    let result = orderedTopics;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (TRACK_META_BY_TOPIC[t.id]?.category ?? '').toLowerCase().includes(q) ||
        (TRACK_META_BY_TOPIC[t.id]?.classification ?? '').toLowerCase().includes(q)
      );
    }
    if (themeFilter !== 'all') {
      result = result.filter((t) => (TRACK_META_BY_TOPIC[t.id]?.category ?? 'Other') === themeFilter);
    }
    if (topicFilter !== 'all') {
      result = result.filter((t) => topicStatuses[t.id] === topicFilter);
    }
    return result;
  }, [orderedTopics, topicFilter, topicStatuses, themeFilter, searchQuery]);

  const filterCounts = useMemo(() => ({
    all: orderedTopics.length,
    'in-progress': orderedTopics.filter((t) => topicStatuses[t.id] === 'in-progress').length,
    completed: orderedTopics.filter((t) => topicStatuses[t.id] === 'completed').length,
    untouched: orderedTopics.filter((t) => topicStatuses[t.id] === 'untouched').length,
  }), [orderedTopics, topicStatuses]);

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

        {/* Filters */}
        <div className="mb-10 inline-flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl overflow-hidden">
          {/* Row 0: Search */}
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/30 w-14">
              Search
            </span>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-on-surface-variant/25" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks..."
                className="h-7 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] pl-8 pr-3 text-[12px] font-medium text-on-surface outline-none transition-all placeholder:text-on-surface-variant/25 focus:border-white/[0.12] focus:bg-white/[0.05]"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 h-px bg-white/[0.04]" />

          {/* Row 1: Theme */}
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/30 w-14">
              Topic
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setThemeFilter('all')}
                className={`rounded-lg px-3 py-1 text-[12px] font-medium transition-all duration-200 ${
                  themeFilter === 'all'
                    ? 'bg-white/[0.1] text-on-surface'
                    : 'text-on-surface-variant/40 hover:text-on-surface-variant/70 hover:bg-white/[0.04]'
                }`}
              >
                All
              </button>
              {['Foundations', 'Infrastructure', 'Orchestration', 'Platforms', 'Processing', 'Storage'].map((theme) => {
                const isActive = themeFilter === theme;
                return (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => setThemeFilter(isActive ? 'all' : theme)}
                    className={`rounded-lg px-3 py-1 text-[12px] font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white/[0.1] text-on-surface'
                        : 'text-on-surface-variant/40 hover:text-on-surface-variant/70 hover:bg-white/[0.04]'
                    }`}
                  >
                    {theme}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 h-px bg-white/[0.04]" />

          {/* Row 2: Progress */}
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/30 w-14">
              Status
            </span>
            <div className="flex items-center gap-0.5">
              {TOPIC_FILTERS.map((opt) => {
                const isActive = topicFilter === opt.id;
                const count = filterCounts[opt.id];
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTopicFilter(opt.id)}
                    className={`rounded-lg px-3 py-1 text-[12px] font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white/[0.1] text-on-surface'
                        : 'text-on-surface-variant/40 hover:text-on-surface-variant/70 hover:bg-white/[0.04]'
                    }`}
                  >
                    {opt.label}
                    {count > 0 && opt.id !== 'all' && (
                      <span className={`ml-1 text-[10px] ${
                        isActive ? 'text-on-surface-variant/50' : 'text-on-surface-variant/20'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Track cards — 3-column layout */}
        {filteredTopics.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {filteredTopics.map((topic, index) => {
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
              const hasContent = totalTopicChapters > 0;
              const accent = `rgb(${style.accentRgb})`;
              const accentDim = `rgba(${style.accentRgb},0.15)`;
              const borderAccent = `rgba(${style.accentRgb},0.2)`;
              const borderAccentInner = `rgba(${style.accentRgb},0.1)`;

              const Wrapper = hasContent ? Link : 'div';
              const wrapperProps = hasContent
                ? { href: `/learn/${topic.id}/${mode}` as const }
                : {};

              return (
                <Wrapper
                  key={`${mode}-${topic.id}`}
                  {...(wrapperProps as Record<string, string>)}
                  className={`group h-full ${hasContent ? '' : 'cursor-default'}`}
                >
                  <section
                    className="bg-surface-container-low p-1 relative overflow-hidden transition-all duration-300 h-full"
                    style={{
                      border: `1px solid ${borderAccent}`,
                    }}
                    onMouseEnter={(e) => { if (hasContent) { e.currentTarget.style.boxShadow = `0 0 30px rgba(${style.accentRgb},0.15)`; e.currentTarget.style.borderColor = `rgba(${style.accentRgb},0.4)`; } }}
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
                        {(() => {
                          const catRgb = CATEGORY_COLORS[meta.category as CategoryName] ?? style.accentRgb;
                          return (
                            <span
                              className="font-mono text-[10px] px-2 py-0.5 uppercase"
                              style={{ color: `rgb(${catRgb})`, border: `1px solid rgba(${catRgb},0.3)`, backgroundColor: `rgba(${catRgb},0.06)` }}
                            >
                              {meta.category}
                            </span>
                          );
                        })()}
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
                        {hasContent ? (
                          <>
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
                          </>
                        ) : (
                          <>
                            {/* Under construction animation */}
                            <div className="mb-4">
                              <div className="flex justify-between items-end mb-2">
                                <span className="font-mono text-[10px] text-on-surface-variant/40">
                                  BUILD STATUS
                                </span>
                                <span className="font-mono text-[10px] text-on-surface-variant/30 animate-pulse">
                                  COMPILING...
                                </span>
                              </div>
                              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                                <div
                                  className="absolute inset-y-0 left-0 w-1/3 rounded-full animate-[shimmer_2s_ease-in-out_infinite]"
                                  style={{ backgroundColor: `rgba(${style.accentRgb},0.25)` }}
                                />
                              </div>
                            </div>

                            {/* Construction CTA */}
                            <div
                              className="w-full py-4 font-mono text-[10px] font-bold tracking-widest text-center uppercase opacity-40"
                              style={{
                                border: `1px dashed rgba(${style.accentRgb},0.3)`,
                                color: `rgba(${style.accentRgb},0.5)`
                              }}
                            >
                              Under Construction
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </section>
                </Wrapper>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.02] px-8 py-16 text-center">
            <p className="text-[14px] font-medium text-on-surface-variant/50">
              {topicFilter === 'all' && themeFilter === 'all' && !searchQuery ? 'No theory tracks available yet' : 'No tracks match the current filters'}
            </p>
            {(topicFilter !== 'all' || themeFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => { setTopicFilter('all'); setThemeFilter('all'); setSearchQuery(''); }}
                className="mt-3 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-[12px] font-medium text-on-surface-variant/60 transition-all hover:bg-white/[0.07]"
              >
                Clear filters
              </button>
            )}
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
