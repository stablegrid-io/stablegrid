'use client';

import type { Question } from '@/lib/types';

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toArray = (value: string | string[]) =>
  Array.isArray(value) ? value : [value];

const collectExpectedAnswers = (question: Question) => {
  const base = toArray(question.correctAnswer);
  const alternates = question.alternateAnswers ?? [];
  return [...base, ...alternates].filter(Boolean);
};

export function validateAnswer(question: Question, answer: string): boolean {
  if (!answer.trim()) {
    return false;
  }

  const expected = collectExpectedAnswers(question);
  return expected.some(
    (choice) => normalizeText(choice) === normalizeText(answer)
  );
}
