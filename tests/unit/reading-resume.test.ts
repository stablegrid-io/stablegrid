import { describe, expect, it } from 'vitest';
import {
  parseLessonIdFromRoute,
  resolveResumeLessonId
} from '@/lib/learn/readingResume';

describe('parseLessonIdFromRoute', () => {
  it('returns the lesson query param when present', () => {
    expect(
      parseLessonIdFromRoute(
        '/theory/junior?chapter=module-PS1&lesson=module-PS1-lesson-05'
      )
    ).toBe('module-PS1-lesson-05');
  });

  it('returns null when there is no query string', () => {
    expect(parseLessonIdFromRoute('/theory/junior')).toBeNull();
  });

  it('returns null when the lesson param is missing', () => {
    expect(parseLessonIdFromRoute('/theory/junior?chapter=module-PS1')).toBeNull();
  });

  it('returns null for null/undefined input', () => {
    expect(parseLessonIdFromRoute(null)).toBeNull();
    expect(parseLessonIdFromRoute(undefined)).toBeNull();
  });

  it('returns null when the lesson param is empty or whitespace-only', () => {
    expect(parseLessonIdFromRoute('/x?lesson=')).toBeNull();
    expect(parseLessonIdFromRoute('/x?lesson=   ')).toBeNull();
  });
});

describe('resolveResumeLessonId', () => {
  const base = {
    currentLessonId: null as string | null,
    lastVisitedRoute: null as string | null,
    sectionsIdsRead: [] as string[]
  };

  it('prefers currentLessonId when present', () => {
    expect(
      resolveResumeLessonId({
        ...base,
        currentLessonId: 'lesson-cursor',
        lastVisitedRoute: '/theory/junior?lesson=lesson-route',
        sectionsIdsRead: ['lesson-read-A', 'lesson-read-B']
      })
    ).toBe('lesson-cursor');
  });

  it('falls back to lesson parsed from lastVisitedRoute when currentLessonId is null', () => {
    expect(
      resolveResumeLessonId({
        ...base,
        currentLessonId: null,
        lastVisitedRoute: '/theory/junior?chapter=module-PS1&lesson=lesson-route',
        sectionsIdsRead: ['lesson-read-A']
      })
    ).toBe('lesson-route');
  });

  it('falls back to the last entry of sectionsIdsRead when both cursor sources are empty', () => {
    expect(
      resolveResumeLessonId({
        ...base,
        currentLessonId: null,
        lastVisitedRoute: null,
        sectionsIdsRead: ['lesson-A', 'lesson-B', 'lesson-C']
      })
    ).toBe('lesson-C');
  });

  it('returns null when no source has data', () => {
    expect(
      resolveResumeLessonId({
        currentLessonId: null,
        lastVisitedRoute: null,
        sectionsIdsRead: []
      })
    ).toBeNull();
  });

  it('regression: checkpoint in sectionsIdsRead but lesson-5 in cursor → returns lesson-5', () => {
    // Mirrors the production bug: user read checkpoint > 30s, then jumped back
    // to lesson 5. NextUp card must show lesson 5, not the checkpoint.
    expect(
      resolveResumeLessonId({
        currentLessonId: 'module-PS1-lesson-05',
        lastVisitedRoute:
          '/theory/junior?chapter=module-PS1&lesson=module-PS1-lesson-05',
        sectionsIdsRead: [
          'module-PS1-lesson-01',
          'module-PS1-lesson-02',
          'module-PS1-checkpoint'
        ]
      })
    ).toBe('module-PS1-lesson-05');
  });
});
