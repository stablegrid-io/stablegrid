import { describe, expect, it } from 'vitest';
import { validateAnswer } from '@/lib/validators/answerValidator';
import type { Question } from '@/lib/types';

const baseQuestion: Question = {
  id: 'q-1',
  topic: 'pyspark',
  difficulty: 'easy',
  type: 'free-text',
  question: 'What clause groups rows?',
  correctAnswer: 'GROUP BY',
  explanation: 'GROUP BY aggregates rows by key.',
  xpReward: 10,
  tags: ['aggregation']
};

describe('validateAnswer', () => {
  it('returns false for empty answers', () => {
    expect(validateAnswer(baseQuestion, '')).toBe(false);
    expect(validateAnswer(baseQuestion, '   ')).toBe(false);
  });

  it('matches answers case-insensitively', () => {
    expect(validateAnswer(baseQuestion, 'group by')).toBe(true);
    expect(validateAnswer(baseQuestion, 'GrOuP By')).toBe(true);
  });

  it('ignores punctuation and extra whitespace', () => {
    expect(validateAnswer(baseQuestion, 'GROUP,   BY!!!')).toBe(true);
  });

  it('supports array correct answers and alternates', () => {
    const question: Question = {
      ...baseQuestion,
      correctAnswer: ['inner join', 'join'],
      alternateAnswers: ['equi join']
    };
    expect(validateAnswer(question, 'JOIN')).toBe(true);
    expect(validateAnswer(question, 'equi   join')).toBe(true);
    expect(validateAnswer(question, 'left join')).toBe(false);
  });
});
