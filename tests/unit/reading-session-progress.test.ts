import { describe, it, expect } from 'vitest';
import {
  getReadLessonIdsFromSessionSnapshot,
  getReadLessonCountFromSessionSnapshot,
} from '@/lib/learn/readingSessionProgress';

describe('getReadLessonIdsFromSessionSnapshot', () => {
  const ordered = ['L1', 'L2', 'L3', 'L4', 'L5'];

  it('includes lessons with >= 30 seconds in lesson_seconds_by_id', () => {
    const result = getReadLessonIdsFromSessionSnapshot(
      { lesson_seconds_by_id: { L1: 30, L2: 60, L3: 10 } },
      ordered,
    );
    expect(result).toEqual(['L1', 'L2']);
  });

  it('excludes lessons at exactly 29 seconds', () => {
    const result = getReadLessonIdsFromSessionSnapshot(
      { lesson_seconds_by_id: { L1: 29 } },
      ordered,
    );
    expect(result).toEqual([]);
  });

  it('includes lessons at exactly 30 seconds', () => {
    const result = getReadLessonIdsFromSessionSnapshot(
      { lesson_seconds_by_id: { L1: 30 } },
      ordered,
    );
    expect(result).toEqual(['L1']);
  });

  it('handles string numeric values ("30") as valid', () => {
    const result = getReadLessonIdsFromSessionSnapshot(
      { lesson_seconds_by_id: { L1: '30' as unknown as number } },
      ordered,
    );
    expect(result).toEqual(['L1']);
  });

  it('excludes NaN / null / undefined values', () => {
    const result = getReadLessonIdsFromSessionSnapshot(
      { lesson_seconds_by_id: { L1: NaN, L2: null as any, L3: undefined as any, L4: 'abc' as any } },
      ordered,
    );
    expect(result).toEqual([]);
  });

  it('falls back to completed_lesson_ids when lesson_seconds_by_id is empty', () => {
    const result = getReadLessonIdsFromSessionSnapshot(
      { lesson_seconds_by_id: {}, completed_lesson_ids: ['L2', 'L3'] },
      ordered,
    );
    expect(result).toEqual(['L2', 'L3']);
  });

  it('falls back to sections_ids_read when no completed_lesson_ids', () => {
    const result = getReadLessonIdsFromSessionSnapshot(
      { sections_ids_read: ['L1', 'L4'] },
      ordered,
    );
    expect(result).toEqual(['L1', 'L4']);
  });

  it('deduplicates lesson IDs in fallback', () => {
    const result = getReadLessonIdsFromSessionSnapshot(
      { completed_lesson_ids: ['L1', 'L1', 'L2'], sections_ids_read: ['L2', 'L3'] },
      ordered,
    );
    expect(result).toEqual(['L1', 'L2', 'L3']);
  });

  it('filters to orderedLessonIds when provided', () => {
    const result = getReadLessonIdsFromSessionSnapshot(
      { lesson_seconds_by_id: { L1: 60, L2: 45, UNKNOWN: 100 } },
      ordered,
    );
    expect(result).toEqual(['L1', 'L2']);
    expect(result).not.toContain('UNKNOWN');
  });

  it('returns unfiltered timed IDs when orderedLessonIds is empty', () => {
    const result = getReadLessonIdsFromSessionSnapshot(
      { lesson_seconds_by_id: { L1: 60, UNKNOWN: 100 } },
      [],
    );
    expect(result).toContain('L1');
    expect(result).toContain('UNKNOWN');
  });

  it('preserves order from orderedLessonIds', () => {
    const result = getReadLessonIdsFromSessionSnapshot(
      { lesson_seconds_by_id: { L3: 60, L1: 45 } },
      ordered,
    );
    expect(result).toEqual(['L1', 'L3']); // ordered per orderedLessonIds
  });
});

describe('getReadLessonCountFromSessionSnapshot', () => {
  const ordered = ['L1', 'L2', 'L3', 'L4', 'L5'];

  it('counts from timed lessons when available', () => {
    const count = getReadLessonCountFromSessionSnapshot(
      { lesson_seconds_by_id: { L1: 30, L2: 60, L3: 10 } },
      ordered,
    );
    expect(count).toBe(2);
  });

  it('falls back to sections_read when no lesson IDs found', () => {
    const count = getReadLessonCountFromSessionSnapshot(
      { sections_read: 3 },
      [],
    );
    expect(count).toBe(3);
  });

  it('clamps count to sectionsTotal when provided', () => {
    const count = getReadLessonCountFromSessionSnapshot(
      { lesson_seconds_by_id: { L1: 30, L2: 60, L3: 45, L4: 90, L5: 120 } },
      ordered,
      3, // only 3 sections total
    );
    expect(count).toBe(3);
  });

  it('clamps sections_read fallback to sectionsTotal', () => {
    const count = getReadLessonCountFromSessionSnapshot(
      { sections_read: 10 },
      [],
      5,
    );
    expect(count).toBe(5);
  });

  it('returns 0 when sections_read is NaN', () => {
    const count = getReadLessonCountFromSessionSnapshot(
      { sections_read: NaN },
      [],
    );
    expect(count).toBe(0);
  });

  it('returns 0 for completely empty snapshot', () => {
    const count = getReadLessonCountFromSessionSnapshot({}, []);
    expect(count).toBe(0);
  });
});
