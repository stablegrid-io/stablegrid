'use client';

import { useMemo, useState } from 'react';
import type { PracticeTopic, Question, QuestionDifficulty } from '@/lib/types';

export type QuestionFilterStatus =
  | 'all'
  | 'new'
  | 'attempted'
  | 'correct'
  | 'incorrect'
  | 'bookmarked';

export interface QuestionFilters {
  search: string;
  difficulties: QuestionDifficulty[];
  topics: PracticeTopic[];
  status: QuestionFilterStatus;
  tags: string[];
}

interface UseQuestionFiltersOptions {
  completedQuestionIds?: string[];
  incorrectQuestionIds?: string[];
  bookmarkedQuestionIds?: string[];
}

const defaultFilters: QuestionFilters = {
  search: '',
  difficulties: [],
  topics: [],
  status: 'all',
  tags: []
};

const EMPTY_IDS: string[] = [];

export const useQuestionFilters = (
  questions: Question[],
  options: UseQuestionFiltersOptions = {}
) => {
  const [filters, setFilters] = useState<QuestionFilters>(defaultFilters);

  const completedQuestionIds = options.completedQuestionIds ?? EMPTY_IDS;
  const incorrectQuestionIds = options.incorrectQuestionIds ?? EMPTY_IDS;
  const bookmarkedQuestionIds = options.bookmarkedQuestionIds ?? EMPTY_IDS;

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          question.question.toLowerCase().includes(searchLower) ||
          question.tags.some((tag) => tag.toLowerCase().includes(searchLower));

        if (!matchesSearch) {
          return false;
        }
      }

      if (
        filters.difficulties.length > 0 &&
        !filters.difficulties.includes(question.difficulty)
      ) {
        return false;
      }

      if (filters.topics.length > 0 && !filters.topics.includes(question.topic)) {
        return false;
      }

      if (filters.status !== 'all') {
        const isCompleted = completedQuestionIds.includes(question.id);
        const isIncorrect = incorrectQuestionIds.includes(question.id);
        const isBookmarked = bookmarkedQuestionIds.includes(question.id);
        const isNew = !isCompleted;

        switch (filters.status) {
          case 'new':
            if (!isNew) return false;
            break;
          case 'attempted':
            if (!isCompleted) return false;
            break;
          case 'correct':
            if (!isCompleted || isIncorrect) return false;
            break;
          case 'incorrect':
            if (!isIncorrect) return false;
            break;
          case 'bookmarked':
            if (!isBookmarked) return false;
            break;
          default:
            break;
        }
      }

      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((tag) =>
          question.tags.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }, [
    questions,
    filters,
    completedQuestionIds,
    incorrectQuestionIds,
    bookmarkedQuestionIds
  ]);

  const updateFilter = (key: keyof QuestionFilters, value: QuestionFilters[keyof QuestionFilters]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (
    key: 'difficulties' | 'topics' | 'tags',
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: (prev[key] as string[]).includes(value)
        ? (prev[key] as string[]).filter((item) => item !== value)
        : [...(prev[key] as string[]), value]
    }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.difficulties.length > 0 ||
    filters.topics.length > 0 ||
    filters.status !== 'all' ||
    filters.tags.length > 0;

  return {
    filters,
    filteredQuestions,
    updateFilter,
    toggleArrayFilter,
    clearFilters,
    hasActiveFilters
  };
};
