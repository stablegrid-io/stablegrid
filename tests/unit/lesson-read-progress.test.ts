import { describe, it, expect } from 'vitest';
import {
  sanitizeLessonSecondsById,
  seedLessonSecondsFromCompletedLessons,
  getReadLessonIds,
  MIN_LESSON_READ_SECONDS,
} from '@/lib/learn/lessonReadProgress';

describe('sanitizeLessonSecondsById', () => {
  const ordered = ['L1', 'L2', 'L3'];
  const idSet = new Set(ordered);

  it('filters to only known lesson IDs from orderedLessonIds', () => {
    const result = sanitizeLessonSecondsById({ L1: 60, UNKNOWN: 100 }, ordered, idSet);
    expect(result).toEqual({ L1: 60 });
    expect(result).not.toHaveProperty('UNKNOWN');
  });

  it('floors numeric values', () => {
    const result = sanitizeLessonSecondsById({ L1: 30.9 }, ordered, idSet);
    expect(result.L1).toBe(30);
  });

  it('converts string numeric values', () => {
    const result = sanitizeLessonSecondsById({ L1: '45' }, ordered, idSet);
    expect(result.L1).toBe(45);
  });

  it('excludes NaN values', () => {
    const result = sanitizeLessonSecondsById({ L1: NaN }, ordered, idSet);
    expect(result).toEqual({});
  });

  it('excludes null and undefined values', () => {
    const result = sanitizeLessonSecondsById({ L1: null, L2: undefined }, ordered, idSet);
    expect(result).toEqual({});
  });

  it('excludes non-numeric string values', () => {
    const result = sanitizeLessonSecondsById({ L1: 'abc' }, ordered, idSet);
    expect(result).toEqual({});
  });

  it('excludes zero and negative values', () => {
    const result = sanitizeLessonSecondsById({ L1: 0, L2: -5 }, ordered, idSet);
    expect(result).toEqual({});
  });

  it('returns empty object for null input', () => {
    expect(sanitizeLessonSecondsById(null, ordered, idSet)).toEqual({});
  });

  it('returns empty object for array input', () => {
    expect(sanitizeLessonSecondsById([1, 2, 3], ordered, idSet)).toEqual({});
  });

  it('returns empty object for non-object input', () => {
    expect(sanitizeLessonSecondsById('string', ordered, idSet)).toEqual({});
  });
});

describe('seedLessonSecondsFromCompletedLessons', () => {
  it('sets completed lessons below threshold to MIN_LESSON_READ_SECONDS', () => {
    const result = seedLessonSecondsFromCompletedLessons({ L1: 10 }, ['L1']);
    expect(result.L1).toBe(MIN_LESSON_READ_SECONDS);
  });

  it('preserves existing seconds above threshold', () => {
    const result = seedLessonSecondsFromCompletedLessons({ L1: 60 }, ['L1']);
    expect(result.L1).toBe(60);
  });

  it('adds missing completed lesson IDs at threshold', () => {
    const result = seedLessonSecondsFromCompletedLessons({}, ['L1', 'L2']);
    expect(result.L1).toBe(MIN_LESSON_READ_SECONDS);
    expect(result.L2).toBe(MIN_LESSON_READ_SECONDS);
  });

  it('does not modify the original object', () => {
    const original = { L1: 10 };
    const result = seedLessonSecondsFromCompletedLessons(original, ['L1']);
    expect(result.L1).toBe(MIN_LESSON_READ_SECONDS);
    expect(original.L1).toBe(10); // unchanged
  });

  it('handles empty completedLessonIds', () => {
    const result = seedLessonSecondsFromCompletedLessons({ L1: 60 }, []);
    expect(result).toEqual({ L1: 60 });
  });
});

describe('getReadLessonIds', () => {
  const ordered = ['L1', 'L2', 'L3', 'L4'];

  it('returns lesson IDs with seconds >= MIN_LESSON_READ_SECONDS', () => {
    const result = getReadLessonIds({ L1: 30, L2: 29, L3: 60, L4: 0 }, ordered);
    expect(result).toEqual(['L1', 'L3']);
  });

  it('returns empty array when no lessons meet threshold', () => {
    const result = getReadLessonIds({ L1: 10, L2: 20 }, ordered);
    expect(result).toEqual([]);
  });

  it('returns all lessons when all meet threshold', () => {
    const result = getReadLessonIds({ L1: 30, L2: 30, L3: 30, L4: 30 }, ordered);
    expect(result).toEqual(['L1', 'L2', 'L3', 'L4']);
  });

  it('treats missing lesson IDs as 0 seconds', () => {
    const result = getReadLessonIds({}, ordered);
    expect(result).toEqual([]);
  });
});

describe('MIN_LESSON_READ_SECONDS', () => {
  it('is 30', () => {
    expect(MIN_LESSON_READ_SECONDS).toBe(30);
  });
});
