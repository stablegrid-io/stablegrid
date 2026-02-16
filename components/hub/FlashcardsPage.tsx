'use client';

import { useMemo, useState } from 'react';
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
    <main className="min-h-screen bg-light-bg px-6 pb-16 pt-10 dark:bg-[#060b12]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="flex flex-col gap-3">
          <p className="data-mono text-xs uppercase tracking-[0.35em] text-brand-500/80">
            DataGridLab Flashcard Deck
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
            <div className="flex items-center gap-4">
              <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                {stats.completed} of {stats.total} completed
              </p>
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${stats.completionPct}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
                <span>{stats.active} active</span>
                <span>•</span>
                <span>{stats.fresh} new</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {FILTERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFilter(option.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                    filter === option.id
                      ? 'bg-text-light-primary text-white dark:bg-white dark:text-dark-bg'
                      : 'border border-light-border bg-light-surface text-text-light-tertiary hover:text-text-light-primary dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-tertiary dark:hover:text-text-dark-primary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

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
