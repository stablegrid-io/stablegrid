'use client';

import type { Question } from '@/lib/types';

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeCode = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/;+/g, ';')
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

  if (question.type === 'multiple-choice') {
    return expected.some(
      (choice) => normalizeText(choice) === normalizeText(answer)
    );
  }

  if (question.type === 'free-text') {
    const normalizedAnswer = normalizeText(answer);
    return expected.some((choice) =>
      normalizedAnswer.includes(normalizeText(choice)) ||
      normalizeText(choice).includes(normalizedAnswer)
    );
  }

  const normalizedAnswer = normalizeCode(answer);
  return expected.some((choice) =>
    normalizedAnswer.includes(normalizeCode(choice))
  );
}
