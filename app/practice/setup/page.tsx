'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { useQuestionFilters } from '@/lib/hooks/useQuestionFilters';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import type { PracticeTopic, Question, QuestionDifficulty } from '@/lib/types';

const TOPICS: PracticeTopic[] = ['pyspark', 'fabric'];

export default function PracticeSetupPage() {
  const router = useRouter();
  const { completedQuestions } = useProgressStore();
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    filters,
    filteredQuestions,
    updateFilter,
    toggleArrayFilter,
    clearFilters,
    hasActiveFilters
  } = useQuestionFilters(allQuestions, {
    completedQuestionIds: completedQuestions
  });

  useEffect(() => {
    const loadAllQuestions = async () => {
      setIsLoading(true);
      const all: Question[] = [];
      const tagSet = new Set<string>();

      for (const topic of TOPICS) {
        try {
          const topicModule = await import(`@/data/questions/${topic}.json`);
          const payload = topicModule.default ?? topicModule;
          const questions: Question[] = payload.questions ?? payload[topic] ?? [];
          questions.forEach((question) => {
            all.push(question);
            question.tags?.forEach((tag) => tagSet.add(tag));
          });
        } catch (error) {
          console.error(`Failed to load ${topic} questions`, error);
        }
      }

      setAllQuestions(all);
      setAvailableTags(Array.from(tagSet).sort());
      setIsLoading(false);
    };

    void loadAllQuestions();
  }, []);

  const handleStartPractice = () => {
    if (filteredQuestions.length === 0) return;
    sessionStorage.setItem(
      'practice-questions',
      JSON.stringify(filteredQuestions)
    );
    router.push('/practice/session');
  };

  const averageDifficulty = useMemo(() => {
    if (filteredQuestions.length === 0) return '—';
    const mapping: Record<QuestionDifficulty, number> = {
      easy: 1,
      medium: 2,
      hard: 3
    };
    const avg =
      filteredQuestions.reduce((sum, question) => sum + mapping[question.difficulty], 0) /
      filteredQuestions.length;
    if (avg < 1.5) return 'Easy';
    if (avg < 2.5) return 'Medium';
    return 'Hard';
  }, [filteredQuestions]);

  const uniqueTopicCount = useMemo(
    () => new Set(filteredQuestions.map((question) => question.topic)).size,
    [filteredQuestions]
  );

  return (
    <main className="min-h-screen px-6 pb-16 pt-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold text-text-light-primary dark:text-text-dark-primary md:text-4xl">
            Practice Setup
          </h1>
          <p className="text-base text-text-light-secondary dark:text-text-dark-secondary">
            Customize your session by topic, difficulty, and tags.
          </p>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
          <div className="flex flex-col">
            <FilterPanel
              filters={filters}
              onUpdateFilter={updateFilter}
              onToggleArrayFilter={toggleArrayFilter}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
              resultCount={filteredQuestions.length}
              availableTopics={TOPICS}
              availableTags={availableTags}
            />
          </div>

          <div className="space-y-6">
            {isLoading ? (
              <Card className="p-6 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Loading question bank...
              </Card>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="p-4">
                    <p className="text-caption mb-2">Total Questions</p>
                    <p className="text-2xl font-semibold">{filteredQuestions.length}</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-caption mb-2">Avg Difficulty</p>
                    <p className="text-2xl font-semibold">{averageDifficulty}</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-caption mb-2">Topics</p>
                    <p className="text-2xl font-semibold">{uniqueTopicCount}</p>
                  </Card>
                </div>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-title">Question Preview</h2>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="btn btn-ghost text-xs"
                        type="button"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>

                  {filteredQuestions.length > 0 ? (
                    <div className="mt-4 space-y-4">
                      {filteredQuestions.slice(0, 5).map((question) => (
                        <div
                          key={question.id}
                          className="rounded-lg border border-light-border bg-light-muted p-4 dark:border-dark-border dark:bg-dark-muted"
                        >
                          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
                            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                              {question.topic}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 ${
                                question.difficulty === 'easy'
                                  ? 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400'
                                  : question.difficulty === 'medium'
                                    ? 'bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400'
                                    : 'bg-error-50 text-error-700 dark:bg-error-900/20 dark:text-error-400'
                              }`}
                            >
                              {question.difficulty}
                            </span>
                          </div>
                          <p className="text-sm text-text-light-primary dark:text-text-dark-primary">
                            {question.question}
                          </p>
                        </div>
                      ))}
                      {filteredQuestions.length > 5 && (
                        <p className="text-center text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                          +{filteredQuestions.length - 5} more questions
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      No questions match your filters.
                    </div>
                  )}
                </Card>

                <div className="flex gap-3">
                  <button
                    onClick={handleStartPractice}
                    disabled={filteredQuestions.length === 0}
                    className="btn btn-primary flex-1"
                    type="button"
                  >
                    Start Practice Session ({filteredQuestions.length})
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
