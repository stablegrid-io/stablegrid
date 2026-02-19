'use client';

import { useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import questionsData from '@/data/questions/index.json';
import { TopicSelector } from '@/components/TopicSelector';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import type { TopicInfo, PracticeTopic } from '@/lib/types';

const ALLOWED_TOPICS: PracticeTopic[] = ['pyspark', 'sql', 'python', 'fabric'];
type FlashcardFilter = 'all' | 'available' | 'completed';

const FILTERS: Array<{ id: FlashcardFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'completed', label: 'Completed' }
];

const topics: TopicInfo[] = ALLOWED_TOPICS.flatMap((id) => {
  const value = (
    questionsData.topics as Record<
      string,
      Omit<TopicInfo, 'id'> | undefined
    >
  )[id];
  if (!value) {
    return [];
  }

  return [
    {
      id,
      name: value.name,
      icon: value.icon,
      description: value.description,
      totalQuestions: value.totalQuestions
    }
  ];
});

export default function FlashcardsPage() {
  const { topicProgress } = useProgressStore();
  const [filter, setFilter] = useState<FlashcardFilter>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const topicStatuses = useMemo(() => {
    return topics.map((topic) => {
      const attempts = topicProgress[topic.id]?.total ?? 0;
      const completionRatio = topic.totalQuestions > 0
        ? attempts / topic.totalQuestions
        : 0;
      const completed = completionRatio >= 1;
      const active = attempts > 0 && !completed;

      return {
        topic,
        completed,
        active
      };
    });
  }, [topicProgress]);

  const filteredTopics = useMemo(() => {
    return topicStatuses
      .filter((entry) => {
        if (filter === 'available') {
          return !entry.completed;
        }
        if (filter === 'completed') {
          return entry.completed;
        }
        return true;
      })
      .map((entry) => entry.topic);
  }, [filter, topicStatuses]);

  const stats = useMemo(() => {
    const total = topicStatuses.length;
    const completed = topicStatuses.filter((entry) => entry.completed).length;
    const active = topicStatuses.filter((entry) => entry.active).length;
    const fresh = topicStatuses.filter(
      (entry) => !entry.completed && !entry.active
    ).length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      active,
      fresh,
      completionPct
    };
  }, [topicStatuses]);

  return (
    <main className="min-h-screen bg-light-bg px-6 pb-16 pt-10 dark:bg-dark-bg">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="flex flex-col gap-3">
          <p className="data-mono text-xs uppercase tracking-[0.35em] text-brand-500/80">
            stablegrid.io Flashcard Deck
          </p>
          <h1 className="text-4xl font-semibold text-text-light-primary dark:text-text-dark-primary md:text-5xl font-display">
            Flashcards
          </h1>
          <p className="max-w-2xl text-sm text-text-light-secondary dark:text-text-dark-secondary md:text-base">
            Topic-based drills for SQL, Python, PySpark, and Microsoft Fabric.
            Build consistency with focused question sessions.
          </p>
        </header>

        <section className="card flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-light-border bg-light-surface px-3 py-2 text-sm font-medium text-text-light-primary transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-primary dark:hover:border-brand-400 dark:hover:text-brand-300"
            >
              <SlidersHorizontal className="h-4 w-4 text-brand-500" />
              Filter Panel
              {filter !== 'all' ? (
                <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-500">
                  1 active
                </span>
              ) : null}
            </button>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
                <span>{stats.active} active</span>
                <span>•</span>
                <span>{stats.fresh} new</span>
                <span>•</span>
                <span>Showing {filteredTopics.length} of {topics.length}</span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  {stats.completed} of {stats.total} completed
                </p>
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${stats.completionPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
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
          className={`fixed inset-y-0 left-0 z-50 w-[380px] max-w-[94vw] border-r border-light-border bg-light-bg/95 p-4 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-in-out dark:border-dark-border dark:bg-[#02060f]/95 ${
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
                onClick={() => { setFilter('all'); setIsFilterPanelOpen(false); }}
                className="inline-flex items-center gap-1 rounded-md border border-light-border px-2.5 py-1.5 text-xs font-medium text-text-light-secondary transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-brand-400 dark:hover:text-brand-300"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1">
              <section className="rounded-xl border border-light-border p-3 dark:border-dark-border">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
                  Status
                </p>
                <div className="mt-2 space-y-2">
                  {FILTERS.map((option) => {
                    const selected = filter === option.id;
                    const descriptions: Record<FlashcardFilter, string> = {
                      all: 'Show all flashcard topics regardless of progress.',
                      available: 'Only topics you haven\'t fully completed.',
                      completed: 'Topics where you\'ve answered all questions.'
                    };
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setFilter(option.id)}
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
                              {descriptions[option.id]}
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

        {filteredTopics.length > 0 ? (
          <TopicSelector topics={filteredTopics} />
        ) : (
          <section className="card p-10 text-center">
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              No flashcard topics match this filter.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
