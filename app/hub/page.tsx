'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import questionsData from '@/data/questions/index.json';
import { TopicSelector } from '@/components/TopicSelector';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import type { TopicInfo, PracticeTopic } from '@/lib/types';

const topics: TopicInfo[] = Object.entries(questionsData.topics).map(
  ([id, value]) => ({
    id: id as PracticeTopic,
    name: value.name,
    icon: value.icon,
    description: value.description,
    totalQuestions: value.totalQuestions
  })
);

export default function HubPage() {
  const { topicProgress } = useProgressStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'new' | 'in-progress' | 'completed'
  >('all');

  const filteredTopics = useMemo(() => {
    return topics.filter((topic) => {
      if (
        searchQuery &&
        !topic.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      const progress = topicProgress[topic.id]?.total ?? 0;
      const completion = topic.totalQuestions
        ? progress / topic.totalQuestions
        : 0;
      const isCompleted = completion >= 1;
      const isInProgress = completion > 0 && completion < 1;
      const isNew = completion === 0;

      if (statusFilter === 'completed' && !isCompleted) return false;
      if (statusFilter === 'in-progress' && !isInProgress) return false;
      if (statusFilter === 'new' && !isNew) return false;

      return true;
    });
  }, [searchQuery, statusFilter, topicProgress]);

  return (
    <main className="min-h-screen px-6 pb-16 pt-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-4">
            <p className="data-mono text-xs uppercase tracking-[0.4em] text-brand-500/80">
              Gridlock Practice Deck
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-semibold text-text-light-primary dark:text-text-dark-primary md:text-5xl font-display">
                  Data Analytics Flashcards
                </h1>
                <p className="mt-2 max-w-2xl text-base text-text-light-secondary dark:text-text-dark-secondary md:text-lg">
                  One question at a time. Build streaks, earn XP, and sharpen your data
                  instincts with a focused practice loop.
                </p>
              </div>
            </div>
          </header>

          <div className="card space-y-4 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light-tertiary dark:text-text-dark-tertiary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search topics..."
                  className="input pl-10"
                />
              </div>
              <Link href="/practice/setup" className="btn btn-secondary">
                Advanced Filters
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              <span className="text-xs uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
                Show
              </span>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status-filter"
                  checked={statusFilter === 'all'}
                  onChange={() => setStatusFilter('all')}
                  className="h-4 w-4 accent-brand-500"
                />
                <span>All</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status-filter"
                  checked={statusFilter === 'new'}
                  onChange={() => setStatusFilter('new')}
                  className="h-4 w-4 accent-brand-500"
                />
                <span>New</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status-filter"
                  checked={statusFilter === 'in-progress'}
                  onChange={() => setStatusFilter('in-progress')}
                  className="h-4 w-4 accent-brand-500"
                />
                <span>In Progress</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status-filter"
                  checked={statusFilter === 'completed'}
                  onChange={() => setStatusFilter('completed')}
                  className="h-4 w-4 accent-brand-500"
                />
                <span>Completed</span>
              </label>
            </div>
          </div>
        </div>

        {filteredTopics.length > 0 ? (
          <TopicSelector topics={filteredTopics} />
        ) : (
          <div className="card p-12 text-center text-sm text-text-light-secondary dark:text-text-dark-secondary">
            No topics match your filters.
            <div className="mt-4">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="btn btn-secondary"
                type="button"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
