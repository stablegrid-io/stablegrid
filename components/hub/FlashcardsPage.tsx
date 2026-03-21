'use client';

import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Layers3,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle';
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
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
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
    <main className="min-h-screen bg-[#060809] px-6 pb-16 pt-10">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)', backgroundSize: '100% 3px' }} />
      {/* Ambient glow */}
      <div className="pointer-events-none fixed left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 opacity-[0.04]" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(34,185,154,1), transparent 70%)' }} />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="max-w-4xl">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-[#22b99a]/50 mb-2">
            Flashcard Gallery
          </p>
          <h1 className="font-mono text-[2.25rem] font-bold text-white leading-none tracking-[-0.02em]">
            Flashcards
          </h1>
          <div className="mt-3 h-[1.5px] w-20 bg-gradient-to-r from-[#22b99a] to-transparent" />
          <p className="mt-4 max-w-3xl text-[13px] leading-[1.8] text-[#8ab8ae]">
            Choose a deck before you start a session. Each topic keeps its own
            progress, completion state, and resume point.
          </p>
        </header>

        <section
          className="relative overflow-hidden rounded-[10px] border p-3"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(12,17,14,0.85)', backdropFilter: 'blur(20px)' }}
        >
          <div className="h-[1px] w-full bg-[#1a2420] -mx-3 -mt-3 mb-3 w-[calc(100%+1.5rem)]" />
          <span className="absolute left-3 top-3 h-4 w-4 border-l border-t border-[#1e3028]" />
          <span className="absolute right-3 top-3 h-4 w-4 border-r border-t border-[#1e3028]" />
          <span className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-[#1e3028]" />
          <span className="absolute bottom-3 right-3 h-4 w-4 border-b border-r border-[#1e3028]" />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(true)}
                className="inline-flex items-center gap-2 rounded-[6px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#5a8878] transition-colors hover:border-[#22b99a]/30 hover:text-[#22b99a]"
              >
                <SlidersHorizontal className="h-4 w-4 text-[#22b99a]" />
                Filters
                {filter !== 'all' ? (
                  <span className="rounded-[3px] border border-[#22b99a]/30 bg-[#22b99a]/10 px-2 py-0.5 font-mono text-[9px] uppercase text-[#22b99a]">
                    1 active
                  </span>
                ) : null}
              </button>
              <ViewToggle view={viewMode} onChange={setViewMode} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-[4px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-[#3a5a4a]">
                Showing {filteredTopicRows.length} of {stats.total} decks
              </span>
              <span className="rounded-[4px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-[#3a5a4a]">
                {stats.active} active
              </span>
              <span className="rounded-[4px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-[#3a5a4a]">
                {stats.empty} empty
              </span>
              <span className="rounded-[4px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-[#3a5a4a]">
                Filter: {filterLabel}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="font-mono text-[11px] text-[#3a5a4a]">
              {stats.attemptedCards}/{stats.totalCards} flashcards attempted
            </div>
            <div className="flex items-center gap-3">
              <p className="font-mono text-[11px] text-[#5a8878]">
                {stats.completed} of {stats.total} decks completed
              </p>
              <div className="flex gap-[3px]">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-[5px] w-3 rounded-[2px]" style={{ background: i < Math.round(stats.completionPct / 10) ? '#22b99a' : 'rgba(255,255,255,0.05)' }} />
                ))}
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
          className={`fixed inset-y-0 left-0 z-50 w-[380px] max-w-[94vw] border-r p-4 shadow-2xl transition-transform duration-300 ease-in-out ${
            isFilterPanelOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
          }`}
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(8,12,10,0.98)', backdropFilter: 'blur(20px)' }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#5a8878]">
              Filters
            </h2>
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(false)}
              className="rounded-[6px] border border-[rgba(255,255,255,0.06)] p-1.5 text-[#3a5a4a] transition-colors hover:text-[#22b99a]"
              aria-label="Close filter panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <section
            className="flex h-[calc(100%-2.2rem)] flex-col rounded-[8px] border p-4"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(8,12,10,0.6)' }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-[#22b99a]">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter Panel
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilter('all');
                  setIsFilterPanelOpen(false);
                }}
                className="inline-flex items-center gap-1 rounded-[4px] border border-[rgba(255,255,255,0.06)] px-2.5 py-1.5 font-mono text-[9px] uppercase text-[#3a5a4a] transition-colors hover:border-[#22b99a]/30 hover:text-[#22b99a]"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1">
              <section
                className="rounded-[8px] border p-3"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#5a8878]">
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
                            ? 'border-[#22b99a]/30 bg-[#22b99a]/[0.06]'
                            : 'border-[rgba(255,255,255,0.06)] hover:border-[#22b99a]/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[13px] text-[#8ab8ae]">
                              {option.label}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#4a6878]">
                              {descriptions[option.id]}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 font-mono text-[9px] ${
                              selected
                                ? 'rounded-[3px] border border-[#22b99a]/30 bg-[#22b99a]/10 text-[#22b99a]'
                                : 'rounded-[3px] border border-[rgba(255,255,255,0.06)] text-[#3a5a4a]'
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
          viewMode === 'list' ? (
            <section className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[rgba(8,12,10,0.9)]">
              <div className="grid grid-cols-[2rem_2rem_1fr_auto_auto_auto] items-center gap-4 border-b border-[rgba(255,255,255,0.06)] px-4 py-2.5">
                {['Status', '#', 'Topic', 'Cards', 'Attempted', 'Accuracy'].map((col) => (
                  <span key={col} className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#2a4038]">
                    {col}
                  </span>
                ))}
              </div>
              {filteredTopicRows.map((entry, index) => {
                const style = getTheoryTopicStyle(entry.topic.id);
                const rowContent = (
                  <>
                    <span className="flex items-center">
                      {entry.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-[#22b99a]" />
                      ) : entry.active ? (
                        <Circle className="h-4 w-4 text-[#b99a22]" />
                      ) : (
                        <Circle className="h-4 w-4 text-[#2a4038]" />
                      )}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-[#3a5a4a]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate text-[13px] font-medium text-white">
                      {entry.topic.icon} {entry.topic.name}
                    </span>
                    <span className="font-mono text-[11px] font-medium" style={{ color: `rgb(${style.accentRgb})` }}>
                      {entry.topic.totalQuestions}
                    </span>
                    <span className="text-[13px] text-[#8ab8ae]">
                      {entry.attempted > 0 ? `${entry.attempted}/${entry.topic.totalQuestions}` : '—'}
                    </span>
                    <span className="text-[13px] text-[#8ab8ae]">
                      {entry.accuracyPct !== null ? `${entry.accuracyPct}%` : '—'}
                    </span>
                  </>
                );
                if (entry.isEmpty) {
                  return (
                    <div key={entry.topic.id} className="grid grid-cols-[2rem_2rem_1fr_auto_auto_auto] cursor-not-allowed items-center gap-4 border-b border-[rgba(255,255,255,0.04)] px-4 py-3 opacity-40 last:border-0">
                      {rowContent}
                    </div>
                  );
                }
                return (
                  <Link
                    key={entry.topic.id}
                    href={`/practice/${entry.topic.id}`}
                    className="grid grid-cols-[2rem_2rem_1fr_auto_auto_auto] items-center gap-4 border-b border-[rgba(255,255,255,0.04)] px-4 py-3 transition last:border-0 hover:bg-[rgba(255,255,255,0.02)]"
                  >
                    {rowContent}
                  </Link>
                );
              })}
            </section>
          ) : (
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
                  <div className="h-[1px] w-full -mx-6 -mt-6 mb-6 w-[calc(100%+3rem)]" style={{ background: `linear-gradient(90deg, rgba(${style.accentRgb},0.4), transparent 60%)` }} />
                  <span className="absolute left-3 top-3 h-4 w-4 border-l border-t" style={{ borderColor: `rgba(${style.accentRgb},0.3)` }} />
                  <span className="absolute right-3 top-3 h-4 w-4 border-r border-t" style={{ borderColor: `rgba(${style.accentRgb},0.3)` }} />
                  <span className="absolute bottom-3 left-3 h-4 w-4 border-b border-l" style={{ borderColor: `rgba(${style.accentRgb},0.3)` }} />
                  <span className="absolute bottom-3 right-3 h-4 w-4 border-b border-r" style={{ borderColor: `rgba(${style.accentRgb},0.3)` }} />

                  <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl">
                      <div
                        className="mb-4 inline-flex items-center gap-2 rounded-[3px] border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em]"
                        style={{ borderColor: `rgba(${style.accentRgb},0.3)`, background: `rgba(${style.accentRgb},0.12)`, color: `rgb(${style.accentRgb})` }}
                      >
                        <Layers3 className="h-3.5 w-3.5" />
                        Deck {String(index + 1).padStart(2, '0')}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold text-white">
                          {entry.topic.name}
                        </h2>
                        <span
                          className="rounded-[3px] border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em]"
                          style={{ borderColor: `rgba(${style.accentRgb},0.3)`, background: `rgba(${style.accentRgb},0.12)`, color: `rgb(${style.accentRgb})` }}
                        >
                          {entry.topic.totalQuestions} cards
                        </span>
                      </div>

                      <p className="mt-4 max-w-2xl text-[13px] leading-[1.8] text-[#8ab8ae]">
                        {entry.topic.description}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="rounded-[4px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-[#3a5a4a]">
                          {entry.correct} correct
                        </span>
                      </div>
                    </div>

                    <div
                      className="w-full max-w-sm rounded-[8px] border p-4"
                      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(8,12,10,0.6)' }}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#2a4038]">
                          Deck Progress
                        </span>
                        <span className="font-mono text-xl font-bold text-white">
                          {entry.completionPct}%
                        </span>
                      </div>

                      <div className="flex gap-[3px]">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className="h-[5px] w-3 rounded-[2px]" style={{ background: i < Math.round(entry.completionPct / 10) ? `rgb(${style.accentRgb})` : 'rgba(255,255,255,0.05)' }} />
                        ))}
                      </div>

                      <p className="mt-4 text-[12px] leading-relaxed text-[#5a8878]">
                        {statusCopy}
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(255,255,255,0.05)] pt-5">
                    <div className="flex flex-wrap gap-2">
                      {bottomChips.map((chip) => (
                        <span
                          key={`${entry.topic.id}-${chip}`}
                          className="rounded-[4px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-[#3a5a4a]"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>

                    <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[#8ab8ae] transition-colors group-hover:text-white">
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
                    className="group relative overflow-hidden rounded-[10px] border p-6 transition-all duration-300"
                    style={{ borderColor: `rgba(${style.accentRgb},0.14)`, background: 'rgba(12,17,14,0.85)', backdropFilter: 'blur(20px)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.7)', ...cardVars }}
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
                  className="group relative overflow-hidden rounded-[10px] border p-6 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ borderColor: `rgba(${style.accentRgb},0.14)`, background: 'rgba(12,17,14,0.85)', backdropFilter: 'blur(20px)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.7)', ...cardVars }}
                >
                  {cardInner}
                </Link>
              );
            })}
          </section>
          )
        ) : (
          <section className="rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[rgba(12,17,14,0.85)] p-10 text-center">
            <p className="text-[14px] font-medium text-[#8ab8ae]">
              No flashcard decks match this filter
            </p>
            <p className="mt-1 text-[12px] text-[#3a5a4a]">
              Adjust the status filter to widen the gallery.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
