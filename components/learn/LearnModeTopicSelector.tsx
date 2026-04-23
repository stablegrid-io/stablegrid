'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ArrowUpDown } from 'lucide-react';
import { getLearnTopicMeta, learnTopics } from '@/data/learn';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import { CATEGORY_COLORS, type CategoryName } from '@/components/home/orbitalMapData';

type LearnMode = 'theory';
type TopicFilter = 'all' | 'in-progress' | 'completed' | 'untouched' | 'under-construction';
type SortOption = 'modules-desc' | 'modules-asc' | 'name-asc' | 'name-desc' | 'progress-desc' | 'progress-asc';

const SORT_OPTIONS: Array<{ id: SortOption; label: string }> = [
  { id: 'name-asc', label: 'A \u2192 Z' },
  { id: 'name-desc', label: 'Z \u2192 A' },
  { id: 'progress-desc', label: 'Most progress' },
  { id: 'progress-asc', label: 'Least progress' },
];

const TOPIC_FILTERS: Array<{ id: TopicFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'untouched', label: 'Untouched' },
  { id: 'under-construction', label: 'Under Construction' },
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
  sql: '/brand/sql-logo.png',
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
      // Under construction (no chapters) always last
      const leftHas = left.chapterCount > 0 ? 0 : 1;
      const rightHas = right.chapterCount > 0 ? 0 : 1;
      if (leftHas !== rightHas) return leftHas - rightHas;
      if (left.workload !== right.workload) {
        return right.workload - left.workload;
      }
      return left.title.localeCompare(right.title);
    });
  }, [topics]);

  const [topicFilter, setTopicFilter] = useState<TopicFilter>('all');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  const topicStatuses = useMemo(() => {
    const statuses: Record<string, 'completed' | 'in-progress' | 'untouched' | 'under-construction'> = {};
    for (const t of orderedTopics) {
      const completed = completedChapterCountByTopic[t.id] ?? 0;
      const total = chapterCountByTopic[t.id] ?? t.chapterCount ?? 0;
      if (total === 0) statuses[t.id] = 'under-construction';
      else if (completed >= total) statuses[t.id] = 'completed';
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

    // Sort — under construction always last
    result = [...result].sort((a, b) => {
      const aUC = (chapterCountByTopic[a.id] ?? a.chapterCount) === 0 ? 1 : 0;
      const bUC = (chapterCountByTopic[b.id] ?? b.chapterCount) === 0 ? 1 : 0;
      if (aUC !== bUC) return aUC - bUC;

      const aTotal = chapterCountByTopic[a.id] ?? a.chapterCount;
      const bTotal = chapterCountByTopic[b.id] ?? b.chapterCount;

      const aCompleted = completedChapterCountByTopic[a.id] ?? 0;
      const bCompleted = completedChapterCountByTopic[b.id] ?? 0;
      const aPct = aTotal > 0 ? aCompleted / aTotal : 0;
      const bPct = bTotal > 0 ? bCompleted / bTotal : 0;

      switch (sortBy) {
        case 'modules-desc': return bTotal - aTotal || a.title.localeCompare(b.title);
        case 'modules-asc': return aTotal - bTotal || a.title.localeCompare(b.title);
        case 'name-asc': return a.title.localeCompare(b.title);
        case 'name-desc': return b.title.localeCompare(a.title);
        case 'progress-desc': return bPct - aPct || a.title.localeCompare(b.title);
        case 'progress-asc': return aPct - bPct || a.title.localeCompare(b.title);
        default: return 0;
      }
    });

    return result;
  }, [orderedTopics, topicFilter, topicStatuses, themeFilter, searchQuery, sortBy, completedChapterCountByTopic, chapterCountByTopic]);

  const filterCounts = useMemo(() => {
    // Apply theme + search filters first, then count statuses
    let base = orderedTopics;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      base = base.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (TRACK_META_BY_TOPIC[t.id]?.category ?? '').toLowerCase().includes(q) ||
        (TRACK_META_BY_TOPIC[t.id]?.classification ?? '').toLowerCase().includes(q)
      );
    }
    if (themeFilter !== 'all') {
      base = base.filter((t) => (TRACK_META_BY_TOPIC[t.id]?.category ?? 'Other') === themeFilter);
    }
    return {
      all: base.length,
      'in-progress': base.filter((t) => topicStatuses[t.id] === 'in-progress').length,
      completed: base.filter((t) => topicStatuses[t.id] === 'completed').length,
      untouched: base.filter((t) => topicStatuses[t.id] === 'untouched').length,
      'under-construction': base.filter((t) => topicStatuses[t.id] === 'under-construction').length,
    };
  }, [orderedTopics, topicStatuses, themeFilter, searchQuery]);

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <div className="relative w-full px-4 py-8 sm:px-6 lg:px-10 xl:px-14">
        {/* Page header — matches Stitch Theory Hub */}
        <header className="mb-10 border-l-2 border-primary pl-6" style={{ opacity: 0, animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0ms forwards' }}>
          <h1 className="text-5xl font-extrabold tracking-tighter text-on-surface uppercase mb-2">
            Theory <span className="text-primary">Hub</span>
          </h1>
        </header>

        {/* Filter toolbar — translucent material, fitted segmented groups */}
        <section
          aria-label="Filter tracks"
          className="mb-10 overflow-hidden"
          style={{
            borderRadius: 18,
            background: 'rgba(255,255,255,0.028)',
            backdropFilter: 'blur(40px) saturate(160%)',
            WebkitBackdropFilter: 'blur(40px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.18)',
            opacity: 0,
            animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 80ms forwards',
          }}
        >
          {/* Toolbar: Search · count · divider · sort */}
          <div
            className="flex items-center gap-3 px-2.5 py-2.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            {/* Search field */}
            <div className="relative flex-1 min-w-0">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
                strokeWidth={1.75}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks"
                className="h-9 w-full pl-9 pr-14 text-[13px] font-normal text-white outline-none transition-all placeholder:text-white/35"
                style={{
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                }}
              />
              <kbd
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] tabular-nums text-white/40"
                style={{
                  padding: '2px 6px',
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                ⌘K
              </kbd>
            </div>

            {/* Count */}
            <div className="hidden sm:flex items-baseline gap-1 shrink-0 pl-1">
              <span className="font-mono text-[15px] tabular-nums text-white/85 leading-none">
                {filteredTopics.length}
              </span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/35 font-semibold">
                {filteredTopics.length === 1 ? 'track' : 'tracks'}
              </span>
            </div>

            {/* Divider */}
            <div
              className="hidden md:block shrink-0 h-5 w-px"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />

            {/* Sort — fitted segmented */}
            <div className="hidden md:inline-flex items-center gap-1.5 shrink-0 pr-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-white/40" strokeWidth={1.75} />
              <div
                className="inline-flex items-center gap-px p-0.5"
                style={{
                  borderRadius: 9,
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {SORT_OPTIONS.map((opt) => {
                  const isActive = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSortBy(opt.id)}
                      className="font-mono px-2.5 py-1 text-[9.5px] tracking-[0.16em] uppercase font-semibold whitespace-nowrap transition-all"
                      style={{
                        borderRadius: 7,
                        color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
                        background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                        boxShadow: isActive
                          ? 'inset 0 0.5px 0 rgba(255,255,255,0.14), 0 1px 2px rgba(0,0,0,0.3)'
                          : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filter rows — fitted segmented groups */}
          <div className="flex flex-col gap-1.5 p-2">
            {/* Topic group */}
            <div className="flex flex-wrap items-center gap-1.5">
              <div
                className="inline-flex flex-wrap items-center gap-px p-0.5"
                style={{
                  borderRadius: 9,
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {(['all', 'Foundations', 'Infrastructure', 'Orchestration', 'Platforms', 'Processing', 'Storage'] as const).map((theme) => {
                  const isActive = themeFilter === theme || (theme === 'all' && themeFilter === 'all');
                  const label = theme === 'all' ? 'All' : theme;
                  const catRgb = theme === 'all' ? '255,255,255' : CATEGORY_COLORS[theme as CategoryName] ?? '153,247,255';
                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => setThemeFilter(theme === 'all' ? 'all' : isActive ? 'all' : theme)}
                      className="font-mono px-3 py-1 text-[10px] tracking-[0.16em] uppercase font-semibold whitespace-nowrap transition-all"
                      style={{
                        borderRadius: 7,
                        color: isActive
                          ? theme === 'all' ? 'rgba(255,255,255,0.95)' : `rgb(${catRgb})`
                          : 'rgba(255,255,255,0.5)',
                        background: isActive
                          ? theme === 'all' ? 'rgba(255,255,255,0.1)' : `rgba(${catRgb},0.14)`
                          : 'transparent',
                        boxShadow: isActive
                          ? theme === 'all'
                            ? 'inset 0 0.5px 0 rgba(255,255,255,0.14), 0 1px 2px rgba(0,0,0,0.3)'
                            : `inset 0 0.5px 0 rgba(${catRgb},0.22), 0 1px 2px rgba(0,0,0,0.3)`
                          : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status group */}
            <div className="flex flex-wrap items-center gap-1.5">
              <div
                className="inline-flex flex-wrap items-center gap-px p-0.5"
                style={{
                  borderRadius: 9,
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {TOPIC_FILTERS.map((opt) => {
                  const isActive = topicFilter === opt.id;
                  const count = filterCounts[opt.id];
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTopicFilter(opt.id)}
                      className="font-mono inline-flex items-center gap-1.5 px-3 py-1 text-[10px] tracking-[0.16em] uppercase font-semibold whitespace-nowrap transition-all"
                      style={{
                        borderRadius: 7,
                        color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                        background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                        boxShadow: isActive
                          ? 'inset 0 0.5px 0 rgba(255,255,255,0.14), 0 1px 2px rgba(0,0,0,0.3)'
                          : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                      }}
                    >
                      {opt.label}
                      {count > 0 && opt.id !== 'all' && (
                        <span
                          className="tabular-nums font-medium text-[9px] leading-none"
                          style={{
                            padding: '2px 5px',
                            borderRadius: 99,
                            background: isActive ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.06)',
                            color: isActive ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
                          }}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort — mobile fallback */}
            <div className="md:hidden flex flex-wrap items-center gap-1.5">
              <div
                className="inline-flex flex-wrap items-center gap-px p-0.5"
                style={{
                  borderRadius: 9,
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {SORT_OPTIONS.map((opt) => {
                  const isActive = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSortBy(opt.id)}
                      className="font-mono px-3 py-1 text-[10px] tracking-[0.16em] uppercase font-semibold whitespace-nowrap transition-all"
                      style={{
                        borderRadius: 7,
                        color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                        background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                        boxShadow: isActive
                          ? 'inset 0 0.5px 0 rgba(255,255,255,0.14), 0 1px 2px rgba(0,0,0,0.3)'
                          : 'none',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Track cards */}
        <div>
        {filteredTopics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
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
              const borderAccent = 'rgba(255,255,255,0.06)';
              const borderAccentInner = 'rgba(255,255,255,0.04)';

              const wrapperClassName = `group h-full ${hasContent ? '' : 'cursor-default'}`;
              const wrapperKey = `${mode}-${topic.id}`;
              const staggerDelay = index * 80;
              const catRgb = CATEGORY_COLORS[meta.category as CategoryName] ?? style.accentRgb;
              const cardInner = (
                <div
                  style={{
                    opacity: 0,
                    animation: `fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay + 100}ms forwards`,
                  }}
                  className="h-full"
                >
                  <section
                    className="bg-[#181c20] relative overflow-hidden transition-all duration-300 h-full rounded-[22px] flex flex-col"
                    style={{
                      border: `1px solid ${borderAccent}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = borderAccent;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Top accent line */}
                    <div
                      className="absolute top-0 left-0 right-0 transition-all duration-300"
                      style={{ height: 2, background: `linear-gradient(90deg, transparent 5%, rgba(${catRgb}, 0.5), transparent 95%)` }}
                    />

                    {/* Banner with logo */}
                    <div className="relative h-32 overflow-hidden shrink-0 flex items-center justify-center">
                      <Image
                        src={trackIconSrc}
                        alt={`${getSimpleTrackName(topic.title)} logo`}
                        width={72}
                        height={72}
                        className="h-16 w-16 object-contain transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>

                    <div
                      className="px-6 pb-6 pt-5 flex flex-col relative flex-1"
                    >
                      {/* Category badge */}
                      <div className="mb-5">
                        <span
                          className="font-mono text-[10px] px-2 py-0.5 uppercase rounded-full"
                          style={{ color: `rgb(${catRgb})`, border: `1px solid rgba(${catRgb},0.3)`, backgroundColor: `rgba(${catRgb},0.06)` }}
                        >
                          {meta.category}
                        </span>
                      </div>

                      {/* Title + description */}
                      <h3 className="text-2xl font-bold mb-3 tracking-tight uppercase">
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
                              <span className="font-mono text-[10px] text-on-surface-variant/35 uppercase tracking-widest">
                                Progress
                              </span>
                              <span className="font-mono text-sm font-bold" style={{ color: '#f0f0f3' }}>
                                {topicProgressPct}%
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="mb-8 w-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 100 }}>
                              <div style={{ width: `${topicProgressPct}%`, height: '100%', background: '#fff', borderRadius: 100, opacity: 0.85, transition: 'width 1.5s cubic-bezier(.16,1,.3,1)' }} />
                            </div>

                            {/* CTA */}
                            {completedTopicChapters > 0 ? (
                              <div
                                className="w-full py-4 font-mono text-xs font-bold tracking-widest text-center transition-all duration-300 active:scale-[0.98] uppercase rounded-[14px]"
                                style={{
                                  backgroundColor: 'rgba(255,255,255,0.08)',
                                  border: '1px solid rgba(255,255,255,0.12)',
                                  color: 'rgba(255,255,255,0.8)',
                                }}
                              >
                                Continue Track
                              </div>
                            ) : (
                              <div
                                className="w-full py-4 font-mono text-xs font-bold tracking-widest text-center transition-all duration-300 active:scale-[0.98] uppercase rounded-[14px]"
                                style={{
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  color: '#f0f0f3'
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
                              className="w-full py-4 font-mono text-[10px] font-bold tracking-widest text-center uppercase opacity-40 rounded-[14px]"
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
                </div>
              );

              return hasContent ? (
                <Link key={wrapperKey} href={`/learn/${topic.id}/${mode}`} className={wrapperClassName}>
                  {cardInner}
                </Link>
              ) : (
                <div key={wrapperKey} className={wrapperClassName}>
                  {cardInner}
                </div>
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
          </div>

      </div>
    </div>
  );
}
