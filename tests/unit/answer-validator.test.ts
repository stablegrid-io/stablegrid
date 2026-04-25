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

  it('handles numeric correctAnswer', () => {
    const question: Question = { ...baseQuestion, correctAnswer: '42' };
    expect(validateAnswer(question, '42')).toBe(true);
    expect(validateAnswer(question, '43')).toBe(false);
  });

  it('returns false for answers containing only punctuation', () => {
    expect(validateAnswer(baseQuestion, '!!!')).toBe(false);
    expect(validateAnswer(baseQuestion, '...')).toBe(false);
  });

  it('matches alternate answers when correctAnswer does not match', () => {
    const question: Question = {
      ...baseQuestion,
      correctAnswer: 'primary answer',
      alternateAnswers: ['alternate one', 'alternate two'],
    };
    expect(validateAnswer(question, 'alternate two')).toBe(true);
    expect(validateAnswer(question, 'alternate three')).toBe(false);
  });

  it('handles special SQL characters in answers', () => {
    const question: Question = { ...baseQuestion, correctAnswer: 'SELECT *' };
    expect(validateAnswer(question, 'select *')).toBe(true);
    expect(validateAnswer(question, 'SELECT   *')).toBe(true);
  });

  it('handles answer with leading/trailing whitespace', () => {
    expect(validateAnswer(baseQuestion, '  GROUP BY  ')).toBe(true);
  });
});
