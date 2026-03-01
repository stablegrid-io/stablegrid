'use client';

import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Layers3,
  SlidersHorizontal,
  X
} from 'lucide-react';
import questionsData from '@/data/questions/index.json';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import type { TopicInfo, PracticeTopic } from '@/lib/types';

const ALLOWED_TOPICS: PracticeTopic[] = ['pyspark', 'fabric'];
type FlashcardFilter = 'all' | 'available' | 'completed';

const FILTERS: Array<{ id: FlashcardFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'completed', label: 'Completed' }
];

const topics: TopicInfo[] = ALLOWED_TOPICS.flatMap((id) => {
  const value = (
    questionsData.topics as Record<string, Omit<TopicInfo, 'id'> | undefined>
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

  const topicRows = useMemo(() => {
    return topics.map((topic) => {
      const stats = topicProgress[topic.id] ?? {
        correct: 0,
        total: 0,
        lastAttempted: null
      };
      const attempted = stats.total;
      const correct = stats.correct;
      const isEmpty = topic.totalQuestions === 0;
      const completionPct =
        topic.totalQuestions > 0
          ? Math.min(100, Math.round((attempted / topic.totalQuestions) * 100))
          : 0;
      const accuracyPct =
        attempted > 0 ? Math.round((correct / Math.max(attempted, 1)) * 100) : null;
      const completed = !isEmpty && completionPct >= 100;
      const active = attempted > 0 && !completed;

      return {
        topic,
        attempted,
        correct,
        isEmpty,
        completionPct,
        accuracyPct,
        completed,
        active
      };
    });
  }, [topicProgress]);

  const filteredTopicRows = useMemo(() => {
    return topicRows.filter((entry) => {
      if (filter === 'available') {
        return !entry.completed;
      }
      if (filter === 'completed') {
        return entry.completed;
      }
      return true;
    });
  }, [filter, topicRows]);

  const stats = useMemo(() => {
    const total = topicRows.length;
    const completed = topicRows.filter((entry) => entry.completed).length;
    const active = topicRows.filter((entry) => entry.active).length;
    const empty = topicRows.filter((entry) => entry.isEmpty).length;
    const totalCards = topicRows.reduce(
      (sum, entry) => sum + entry.topic.totalQuestions,
      0
    );
    const attemptedCards = topicRows.reduce((sum, entry) => sum + entry.attempted, 0);
    const completionPct =
      totalCards > 0 ? Math.round((attemptedCards / totalCards) * 100) : 0;

    return {
      total,
      completed,
      active,
      empty,
      totalCards,
      attemptedCards,
      completionPct
    };
  }, [topicRows]);

  const filterLabel = FILTERS.find((option) => option.id === filter)?.label ?? 'All';

  return (
    <main className="min-h-screen bg-light-bg px-6 pb-16 pt-10 dark:bg-dark-bg">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="max-w-4xl">
          <p className="data-mono mb-2 text-xs uppercase tracking-[0.32em] text-brand-500/80">
            Flashcard Gallery
          </p>
          <h1 className="text-4xl font-semibold text-text-light-primary dark:text-text-dark-primary md:text-5xl font-display">
            Flashcards
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-8 text-text-light-secondary dark:text-text-dark-secondary md:text-base">
            Choose a deck before you start a session. Each topic keeps its own
            progress, completion state, and resume point.
          </p>
        </header>

        <section className="rounded-2xl border border-light-border bg-light-surface p-3 dark:border-dark-border dark:bg-dark-surface">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-light-border bg-light-bg px-3 py-2 text-sm font-medium text-text-light-primary transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:hover:border-brand-400 dark:hover:text-brand-300"
            >
              <SlidersHorizontal className="h-4 w-4 text-brand-500" />
              Filters
              {filter !== 'all' ? (
                <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-500">
                  1 active
                </span>
              ) : null}
            </button>

            <div className="flex flex-wrap items-center gap-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 dark:border-dark-border dark:bg-dark-bg">
                Showing {filteredTopicRows.length} of {stats.total} decks
              </span>
              <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 dark:border-dark-border dark:bg-dark-bg">
                {stats.active} active
              </span>
              <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 dark:border-dark-border dark:bg-dark-bg">
                {stats.empty} empty
              </span>
              <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 dark:border-dark-border dark:bg-dark-bg">
                Filter: {filterLabel}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {stats.attemptedCards}/{stats.totalCards} flashcards attempted
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                {stats.completed} of {stats.total} decks completed
              </p>
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-500"
                  style={{ width: `${stats.completionPct}%` }}
                />
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
                onClick={() => {
                  setFilter('all');
                  setIsFilterPanelOpen(false);
                }}
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
                      all: 'Show every flashcard deck regardless of progress.',
                      available: 'Only decks that are still in progress or untouched.',
                      completed: 'Decks where every card has already been attempted.'
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

        {filteredTopicRows.length > 0 ? (
          <section className="grid grid-cols-1 gap-6">
            {filteredTopicRows.map((entry, index) => {
              const style = getTheoryTopicStyle(entry.topic.id);
              const cardVars = {
                '--deck-accent': style.accentRgb
              } as CSSProperties;
              const statusCopy = entry.isEmpty
                ? 'No flashcards are published for this deck yet.'
                : entry.active
                  ? `Resume after ${entry.attempted} of ${entry.topic.totalQuestions} cards attempted.`
                  : entry.completed
                    ? 'Deck completed. Reopen anytime for spaced repetition.'
                    : 'Start your first flashcard session.'
              const ctaLabel = entry.isEmpty
                ? 'Deck coming soon'
                : entry.completed
                  ? 'Review deck'
                  : entry.active
                    ? 'Continue deck'
                    : 'Open deck';
              const bottomChips = [
                `${entry.topic.totalQuestions} cards`,
                entry.attempted > 0
                  ? `${entry.attempted}/${entry.topic.totalQuestions} attempted`
                  : null,
                entry.accuracyPct !== null ? `${entry.accuracyPct}% accuracy` : null
              ].filter((value): value is string => Boolean(value));

              const cardInner = (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(var(--deck-accent),0.18),transparent_32%),linear-gradient(180deg,rgba(var(--deck-accent),0.08),transparent_46%)]" />
                  <div className="pointer-events-none absolute -right-12 top-10 h-44 w-44 rounded-full bg-[rgba(var(--deck-accent),0.1)] blur-3xl" />

                  <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl">
                      <div
                        className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${style.badgeClass}`}
                      >
                        <Layers3 className="h-3.5 w-3.5" />
                        Deck {String(index + 1).padStart(2, '0')}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-3xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                          {entry.topic.name}
                        </h2>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${style.badgeClass}`}
                        >
                          {entry.topic.totalQuestions} cards
                        </span>
                      </div>

                      <p className="mt-4 max-w-2xl text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
                        {entry.topic.description}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-light-border bg-light-bg px-3 py-1.5 text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
                          {entry.correct} correct
                        </span>
                      </div>
                    </div>

                    <div className="w-full max-w-sm rounded-3xl border border-[rgba(var(--deck-accent),0.18)] bg-light-bg/85 p-5 dark:bg-dark-bg/70">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-light-tertiary dark:text-text-dark-tertiary">
                          Deck Progress
                        </span>
                        <span className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                          {entry.completionPct}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                        <div
                          className="h-full rounded-full bg-[rgb(var(--deck-accent))] transition-all duration-500"
                          style={{ width: `${entry.completionPct}%` }}
                        />
                      </div>

                      <p className="mt-4 text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
                        {statusCopy}
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-light-border/80 pt-5 dark:border-dark-border">
                    <div className="flex flex-wrap gap-2">
                      {bottomChips.map((chip) => (
                        <span
                          key={`${entry.topic.id}-${chip}`}
                          className="rounded-full border border-light-border bg-light-bg px-3 py-1 text-xs text-text-light-tertiary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-tertiary"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>

                    <span className="inline-flex items-center gap-2 text-sm font-medium text-text-light-primary transition-transform group-hover:translate-x-0.5 dark:text-text-dark-primary">
                      {ctaLabel}
                      {!entry.isEmpty ? <ArrowRight className="h-4 w-4" /> : null}
                    </span>
                  </div>
                </>
              );

              if (entry.isEmpty) {
                return (
                  <article
                    key={entry.topic.id}
                    className="group relative overflow-hidden rounded-[32px] border border-light-border bg-light-surface p-6 dark:border-dark-border dark:bg-dark-surface"
                    style={cardVars}
                  >
                    {cardInner}
                  </article>
                );
              }

              return (
                <Link
                  key={entry.topic.id}
                  href={`/practice/${entry.topic.id}`}
                  aria-label={`Open ${entry.topic.name} flashcards`}
                  className="group relative overflow-hidden rounded-[32px] border border-light-border bg-light-surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(var(--deck-accent),0.4)] hover:shadow-[0_30px_90px_-44px_rgba(var(--deck-accent),0.42)] dark:border-dark-border dark:bg-dark-surface"
                  style={cardVars}
                >
                  {cardInner}
                </Link>
              );
            })}
          </section>
        ) : (
          <section className="rounded-[28px] border border-light-border bg-light-surface p-10 text-center dark:border-dark-border dark:bg-dark-surface">
            <p className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
              No flashcard decks match this filter
            </p>
            <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Adjust the status filter to widen the gallery.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
