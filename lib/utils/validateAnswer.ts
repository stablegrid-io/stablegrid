import type { Question } from '@/lib/types';
import type { PyodideRunResult } from '@/lib/hooks/usePyodide';

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

export async function validateAnswer(
  question: Question,
  answer: string,
  runPython?: (code: string) => Promise<PyodideRunResult>
): Promise<boolean> {
  if (!answer.trim()) {
    return false;
  }

  const expected = collectExpectedAnswers(question);

  if (question.type === 'multiple-choice') {
    return expected.some((choice) =>
      normalizeText(choice) === normalizeText(answer)
    );
  }

  if (question.type === 'free-text') {
    const normalizedAnswer = normalizeText(answer);
    return expected.some((choice) =>
      normalizedAnswer.includes(normalizeText(choice))
    );
  }

  const normalizedAnswer = normalizeCode(answer);
  const matches = expected.some((choice) =>
    normalizedAnswer.includes(normalizeCode(choice))
  );

  if (!matches) {
    return false;
  }

  if (question.topic === 'python' && runPython) {
    const result = await runPython(answer);
    return result.success;
  }

  return true;
}
