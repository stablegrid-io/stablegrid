'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  Cpu,
  Search,
  SlidersHorizontal,
  Sparkles,
  X
} from 'lucide-react';
import { getLearnTopicMeta, learnTopics } from '@/data/learn';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import { getChapterCompletions } from '@/lib/progress';
import type { Topic } from '@/types/progress';

type LearnMode = 'theory';
type DepthFilter = 'all' | 'starter' | 'standard' | 'deep';
type SortOption = 'recommended' | 'name-asc' | 'workload-desc' | 'workload-asc';

interface LearnModeTopicSelectorProps {
  mode: LearnMode;
}

interface TopicEntry {
  id: string;
  title: string;
  description: string;
  functionCount: number;
  chapterCount: number;
  chapterMinutes: number;
  workload: number;
  depth: Exclude<DepthFilter, 'all'>;
}

const TOPIC_ICON_MAP: Record<string, typeof Sparkles> = {
  pyspark: Sparkles,
  fabric: Cpu
};

const MODE_META: Record<
  LearnMode,
  {
    statLabel: 'chapters';
    workloadLabel: string;
  }
> = {
  theory: {
    statLabel: 'chapters',
    workloadLabel: 'chapter depth'
  }
};

const SORT_OPTIONS: Array<{ id: SortOption; label: string }> = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'workload-desc', label: 'Most workload' },
  { id: 'workload-asc', label: 'Least workload' },
  { id: 'name-asc', label: 'Name A-Z' }
];

const DEPTH_FILTER_OPTIONS: Array<{ id: DepthFilter; label: string }> = [
  { id: 'all', label: 'All depth' },
  { id: 'starter', label: 'Starter' },
  { id: 'standard', label: 'Standard' },
  { id: 'deep', label: 'Deep' }
];

const DEPTH_FILTER_DESCRIPTION: Record<DepthFilter, string> = {
  all: 'Show every topic regardless of workload.',
  starter: 'Smaller paths with lighter scope.',
  standard: 'Balanced topic depth for regular sessions.',
  deep: 'High-volume tracks with advanced coverage.'
};

const SORT_DESCRIPTION: Record<SortOption, string> = {
  recommended: 'Prioritizes heavier topics first.',
  'workload-desc': 'Sort by workload from high to low.',
  'workload-asc': 'Sort by workload from low to high.',
  'name-asc': 'Alphabetical topic ordering.'
};

export function LearnModeTopicSelector({ mode }: LearnModeTopicSelectorProps) {
  const meta = MODE_META[mode];
  const [query, setQuery] = useState('');
  const [depthFilter, setDepthFilter] = useState<DepthFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [completedChapterCountByTopic, setCompletedChapterCountByTopic] = useState<
    Record<string, number>
  >({});

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

  const filteredTopics = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    const filtered = topics.filter((topic) => {
      const matchesQuery =
        loweredQuery.length === 0 ||
        topic.title.toLowerCase().includes(loweredQuery) ||
        topic.description.toLowerCase().includes(loweredQuery);
      const matchesDepth = depthFilter === 'all' || topic.depth === depthFilter;

      return matchesQuery && matchesDepth;
    });

    return [...filtered].sort((left, right) => {
      if (sortBy === 'name-asc') {
        return left.title.localeCompare(right.title);
      }
      if (sortBy === 'workload-asc') {
        return left.workload - right.workload;
      }
      if (sortBy === 'workload-desc') {
        return right.workload - left.workload;
      }
      if (left.workload !== right.workload) {
        return right.workload - left.workload;
      }
      return left.title.localeCompare(right.title);
    });
  }, [depthFilter, query, sortBy, topics]);

  const totalWorkload = topics.reduce((sum, topic) => sum + topic.workload, 0);
  const visibleWorkload = filteredTopics.reduce((sum, topic) => sum + topic.workload, 0);
  const activeFilterCount = [
    query.trim().length > 0,
    depthFilter !== 'all',
    sortBy !== 'recommended'
  ].filter(Boolean).length;

  useEffect(() => {
    if (mode !== 'theory') return;
    let cancelled = false;

    const load = async () => {
      const results = await Promise.all(
        learnTopics.map(async (topic) => {
          const completions = await getChapterCompletions(topic.id as Topic);
          return [topic.id, completions.size] as const;
        })
      );

      if (cancelled) return;

      setCompletedChapterCountByTopic(
        results.reduce<Record<string, number>>((accumulator, [topicId, count]) => {
          accumulator[topicId] = count;
          return accumulator;
        }, {})
      );
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  const resetFilters = () => {
    setQuery('');
    setDepthFilter('all');
    setSortBy('recommended');
  };

  return (
    <div className="min-h-screen bg-light-bg pb-20 dark:bg-dark-bg lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/learn"
            className="mb-8 inline-flex items-center gap-2 text-sm text-text-light-tertiary transition-colors hover:text-brand-500 dark:text-text-dark-tertiary"
          >
            <ArrowLeft className="h-4 w-4" />
            All Topics
          </Link>

          <section className="mb-5 rounded-2xl border border-light-border bg-light-surface p-3 dark:border-dark-border dark:bg-dark-surface">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative block flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light-tertiary dark:text-text-dark-tertiary" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search theory topics"
                  className="input pl-9"
                />
              </label>

              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-light-border bg-light-bg px-3 py-2 text-sm font-medium text-text-light-primary transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:hover:border-brand-400 dark:hover:text-brand-300"
              >
                <SlidersHorizontal className="h-4 w-4 text-brand-500" />
                Filters
                {activeFilterCount > 0 ? (
                  <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-500">
                    {activeFilterCount} active
                  </span>
                ) : null}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 dark:border-dark-border dark:bg-dark-bg">
                Showing {filteredTopics.length} of {topics.length} topics
              </span>
              <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 dark:border-dark-border dark:bg-dark-bg">
                {visibleWorkload}/{totalWorkload} {meta.statLabel}
              </span>
              <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 dark:border-dark-border dark:bg-dark-bg">
                Depth:{' '}
                {DEPTH_FILTER_OPTIONS.find((option) => option.id === depthFilter)?.label}
              </span>
              <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 dark:border-dark-border dark:bg-dark-bg">
                Sort: {SORT_OPTIONS.find((option) => option.id === sortBy)?.label}
              </span>
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 font-medium text-brand-600 transition-colors hover:bg-brand-500/15 dark:text-brand-300"
                >
                  Reset filters
                </button>
              ) : null}
            </div>
          </section>

          <section>
            {filteredTopics.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {filteredTopics.map((topic) => {
                  const Icon = TOPIC_ICON_MAP[topic.id] ?? Sparkles;
                  const style = getTheoryTopicStyle(topic.id);
                  const depthLabel =
                    topic.depth === 'starter'
                      ? 'Starter'
                      : topic.depth === 'standard'
                        ? 'Standard'
                        : 'Deep';
                  const completedTopicChapters =
                    completedChapterCountByTopic[topic.id] ?? 0;
                  const topicProgressPct =
                    topic.chapterCount > 0
                      ? Math.round((completedTopicChapters / topic.chapterCount) * 100)
                      : 0;

                  return (
                    <Link
                      key={`${mode}-${topic.id}`}
                      href={`/learn/${topic.id}/${mode}`}
                      className="group relative overflow-hidden rounded-[28px] border border-light-border bg-light-surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(var(--topic-accent),0.4)] hover:shadow-[0_24px_70px_-36px_rgba(var(--topic-accent),0.45)] dark:border-dark-border dark:bg-dark-surface"
                      style={{ '--topic-accent': style.accentRgb } as React.CSSProperties}
                    >
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background: `radial-gradient(circle at 100% 0%, rgba(${style.accentRgb}, 0.18), transparent 34%), linear-gradient(180deg, rgba(${style.accentRgb}, 0.1), transparent 54%)`
                        }}
                      />
                      <div
                        className="pointer-events-none absolute -right-10 top-16 h-40 w-40 rounded-full blur-3xl"
                        style={{ backgroundColor: `rgba(${style.accentRgb}, 0.12)` }}
                      />

                      <div className="relative flex h-full flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-4">
                            <span
                              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${style.iconWrapClass}`}
                            >
                              <Icon className={`h-6 w-6 ${style.iconClass}`} />
                            </span>

                            <div className="min-w-0">
                              <p
                                className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${style.accentTextClass}`}
                              >
                                {style.eyebrow}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="truncate text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                                  {topic.title}
                                </span>
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${style.badgeClass}`}
                                >
                                  {depthLabel}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                              {topicProgressPct}%
                            </div>
                            <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                              {completedTopicChapters}/{topic.chapterCount} read
                            </div>
                          </div>
                        </div>

                        <p className="mt-5 max-w-xl text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
                          {topic.description}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full border border-light-border bg-light-bg px-3 py-1.5 text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
                            {topic.chapterCount} chapters
                          </span>
                          <span className="rounded-full border border-light-border bg-light-bg px-3 py-1.5 text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
                            {topic.chapterMinutes} min
                          </span>
                          <span className="rounded-full border border-light-border bg-light-bg px-3 py-1.5 text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
                            {topic.functionCount} reference entries
                          </span>
                        </div>

                        <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
                          {style.highlights.map((highlight) => (
                            <div
                              key={`${topic.id}-${highlight}`}
                              className="rounded-2xl border border-light-border/80 bg-light-bg/80 px-3.5 py-3 text-xs leading-5 text-text-light-secondary dark:border-dark-border dark:bg-dark-bg/60 dark:text-text-dark-secondary"
                            >
                              {highlight}
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 border-t border-light-border/80 pt-5 dark:border-dark-border">
                          <div className="mb-3 flex items-center justify-between gap-3 text-sm">
                            <span className="text-text-light-secondary dark:text-text-dark-secondary">
                              Category gallery and chapter progression
                            </span>
                            <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                              {completedTopicChapters}/{topic.chapterCount}
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${style.progressClass}`}
                              style={{ width: `${topicProgressPct}%` }}
                            />
                          </div>

                          <div className="mt-5 flex items-center justify-between gap-3">
                            <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                              Open the topic gallery
                            </span>
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-text-light-primary transition-transform group-hover:translate-x-0.5 dark:text-text-dark-primary">
                              Browse categories
                              <ChevronRight className="h-4 w-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-light-border bg-light-surface p-8 text-center dark:border-dark-border dark:bg-dark-surface">
                <p className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
                  No topics match your filters
                </p>
                <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  Adjust search, depth, or sorting to widen the results.
                </p>
              </div>
            )}
          </section>

          {isFilterPanelOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px]"
              aria-label="Close filter panel backdrop"
              onClick={() => setIsFilterPanelOpen(false)}
            />
          ) : null}

          <aside
            className={`fixed inset-y-0 left-0 z-50 w-[420px] max-w-[94vw] border-r border-light-border bg-light-bg/95 p-4 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-in-out dark:border-dark-border dark:bg-[#02060f]/95 ${
              isFilterPanelOpen
                ? 'translate-x-0'
                : '-translate-x-full pointer-events-none'
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(false)}
                className="rounded-md p-1.5 text-text-light-secondary transition-colors hover:bg-light-surface hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:bg-dark-surface dark:hover:text-text-dark-primary"
                aria-label="Close filter panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <section className="flex h-[calc(100%-2.2rem)] flex-col rounded-2xl border border-light-border bg-light-surface/95 p-4 dark:border-dark-border dark:bg-dark-surface/95">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filter Panel
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 rounded-md border border-light-border px-2.5 py-1.5 text-xs font-medium text-text-light-secondary transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-brand-400 dark:hover:text-brand-300"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto pr-1 scrollbar-slim">
                <section className="rounded-xl border border-light-border p-3 dark:border-dark-border">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
                    Search
                  </p>
                  <label className="mt-2 block">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light-tertiary dark:text-text-dark-tertiary" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="e.g. Spark, SQL, pipelines..."
                        className="input pl-9"
                      />
                    </div>
                  </label>
                </section>

                <section className="rounded-xl border border-light-border p-3 dark:border-dark-border">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
                    {meta.workloadLabel}
                  </p>
                  <div className="mt-2 space-y-2">
                    {DEPTH_FILTER_OPTIONS.map((option) => {
                      const selected = depthFilter === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setDepthFilter(option.id)}
                          aria-pressed={selected}
                          className={`w-full rounded-lg border p-2.5 text-left transition ${
                            selected
                              ? 'border-brand-500/40 bg-brand-500/10'
                              : 'border-light-border hover:border-brand-500/40 dark:border-dark-border'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                                {option.label}
                              </p>
                              <p className="mt-0.5 text-[11px] text-text-light-secondary dark:text-text-dark-secondary">
                                {DEPTH_FILTER_DESCRIPTION[option.id]}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                selected
                                  ? 'border border-brand-500/40 bg-brand-500/10 text-brand-500'
                                  : 'border border-light-border text-text-light-secondary dark:border-dark-border dark:text-text-dark-secondary'
                              }`}
                            >
                              {selected ? 'Applied' : 'Use'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-xl border border-light-border p-3 dark:border-dark-border">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
                    Sort by
                  </p>
                  <div className="mt-2 space-y-2">
                    {SORT_OPTIONS.map((option) => {
                      const selected = sortBy === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSortBy(option.id)}
                          aria-pressed={selected}
                          className={`w-full rounded-lg border p-2.5 text-left transition ${
                            selected
                              ? 'border-brand-500/40 bg-brand-500/10'
                              : 'border-light-border hover:border-brand-500/40 dark:border-dark-border'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                                {option.label}
                              </p>
                              <p className="mt-0.5 text-[11px] text-text-light-secondary dark:text-text-dark-secondary">
                                {SORT_DESCRIPTION[option.id]}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                selected
                                  ? 'border border-brand-500/40 bg-brand-500/10 text-brand-500'
                                  : 'border border-light-border text-text-light-secondary dark:border-dark-border dark:text-text-dark-secondary'
                              }`}
                            >
                              {selected ? 'Applied' : 'Use'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
