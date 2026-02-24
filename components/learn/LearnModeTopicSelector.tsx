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

const TOPIC_STYLE_MAP: Record<string, { iconClass: string; badgeClass: string }> = {
  pyspark: { iconClass: 'text-warning-600 dark:text-warning-400', badgeClass: 'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-800 dark:bg-warning-900/20 dark:text-warning-300' },
  fabric:  { iconClass: 'text-fuchsia-600 dark:text-fuchsia-400', badgeClass: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-800 dark:bg-fuchsia-900/20 dark:text-fuchsia-300' },
};

const MODE_META: Record<
  LearnMode,
  {
    badge: string;
    title: string;
    description: string;
    cta: string;
    statLabel: 'chapters';
    workloadLabel: string;
  }
> = {
  theory: {
    badge: 'Theory Library',
    title: 'Pick a theory topic',
    description:
      'Choose a topic, filter by depth, and jump into chapter categories.',
    cta: 'Open Theory',
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
  const [completedChapters, setCompletedChapters] = useState(0);

  const topics = useMemo<TopicEntry[]>(() => {
    return learnTopics.map((topic) => {
      const topicMeta = getLearnTopicMeta(topic.id);
      const chapterMinutes = topicMeta?.chapterMinutes ?? 0;
      const workload = topic.chapterCount;

      const depth =
        workload <= 3
          ? 'starter'
          : workload <= 8
            ? 'standard'
            : 'deep';

      return {
        ...topic,
        chapterMinutes,
        workload,
        depth
      };
    });
  }, [mode]);

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

    const sorted = [...filtered];
    sorted.sort((left, right) => {
      if (sortBy === 'name-asc') {
        return left.title.localeCompare(right.title);
      }
      if (sortBy === 'workload-asc') {
        return left.workload - right.workload;
      }
      if (sortBy === 'workload-desc') {
        return right.workload - left.workload;
      }

      // Recommended: deeper topics first, then alphabetical.
      if (left.workload !== right.workload) {
        return right.workload - left.workload;
      }
      return left.title.localeCompare(right.title);
    });

    return sorted;
  }, [depthFilter, query, sortBy, topics]);

  const totalWorkload = topics.reduce((sum, topic) => sum + topic.workload, 0);
  const visibleWorkload = filteredTopics.reduce((sum, topic) => sum + topic.workload, 0);
  const maxWorkload = Math.max(...topics.map((topic) => topic.workload), 1);
  const activeFilterCount = [
    query.trim().length > 0,
    depthFilter !== 'all',
    sortBy !== 'recommended'
  ].filter(Boolean).length;

  const totalChapters = useMemo(
    () => topics.reduce((sum, topic) => sum + topic.chapterCount, 0),
    [topics]
  );
  const completionPct = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  useEffect(() => {
    if (mode !== 'theory') return;
    let cancelled = false;
    const load = async () => {
      const results = await Promise.all(
        learnTopics.map((topic) => getChapterCompletions(topic.id as Topic))
      );
      if (cancelled) return;
      const total = results.reduce((sum, set) => sum + set.size, 0);
      setCompletedChapters(total);
    };
    void load();
    return () => { cancelled = true; };
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

          <header className="mb-7 max-w-2xl">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-brand-500">
              {meta.badge}
            </p>
            <h1 className="mb-3 text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {meta.title}
            </h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              {meta.description}
            </p>
          </header>

          <section className="card mb-4 flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-light-border bg-light-surface px-3 py-2 text-sm font-medium text-text-light-primary transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-primary dark:hover:border-brand-400 dark:hover:text-brand-300"
              >
                <SlidersHorizontal className="h-4 w-4 text-brand-500" />
                Filter Panel
                {activeFilterCount > 0 ? (
                  <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-500">
                    {activeFilterCount} active
                  </span>
                ) : null}
              </button>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
                    <span>Showing {filteredTopics.length} of {topics.length}</span>
                    <span>·</span>
                    <span>{visibleWorkload}/{totalWorkload} {meta.statLabel}</span>
                  </div>
                <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                      {completedChapters} of {totalChapters} chapters completed
                    </p>
                    <div className="h-1.5 w-40 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                  </div>
              </div>
            </div>
          </section>

          <section>
            {filteredTopics.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredTopics.map((topic) => {
                  const Icon = TOPIC_ICON_MAP[topic.id] ?? Sparkles;
                  const style = TOPIC_STYLE_MAP[topic.id] ?? TOPIC_STYLE_MAP.pyspark;
                  const depthLabel =
                    topic.depth === 'starter'
                      ? 'Starter'
                      : topic.depth === 'standard'
                        ? 'Standard'
                        : 'Deep';
                  const workloadPct = Math.max(
                    6,
                    Math.round((topic.workload / maxWorkload) * 100)
                  );

                  return (
                    <Link
                      key={`${mode}-${topic.id}`}
                      href={`/learn/${topic.id}/${mode}`}
                      className="group card card-hover flex flex-col gap-4 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${style.badgeClass}`}>
                            <Icon className={`h-4 w-4 ${style.iconClass}`} />
                          </span>
                          <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                            {topic.title}
                          </span>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                          <span className="rounded-full border border-light-border bg-light-bg px-2 py-0.5 text-[10px] font-medium text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
                            {topic.workload} {meta.statLabel}
                          </span>
                          <span className="rounded-full border border-light-border bg-light-bg px-2 py-0.5 text-[10px] font-medium text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
                              {topic.chapterMinutes} min
                            </span>
                        </div>
                      </div>

                      <p className="line-clamp-3 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        {topic.description}
                      </p>

                      <div className="mt-auto">
                        <div className="mb-1 flex items-center justify-between text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
                          <span>{depthLabel} workload</span>
                          <span>{topic.workload}</span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{ width: `${workloadPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-light-border/80 pt-3 dark:border-dark-border">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${style.badgeClass}`}>
                          {depthLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400">
                          {meta.cta}
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
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
              isFilterPanelOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
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
