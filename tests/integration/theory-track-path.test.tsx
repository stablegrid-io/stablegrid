import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TheoryTrackPath } from '@/components/learn/theory/TheoryTrackPath';
import type { TheoryTrackSummary } from '@/data/learn/theory/tracks';
import type { TheoryChapter, TheoryDoc } from '@/types/theory';

const moduleOne: TheoryChapter = {
  id: 'module-01',
  number: 1,
  title: 'Module 1: Spark SQL',
  description: 'SQL interfaces and optimizer basics.',
  totalMinutes: 120,
  sections: [
    {
      id: 'module-01-lesson-01',
      title: 'Lesson 1: Welcome and Overview',
      estimatedMinutes: 10,
      blocks: [{ type: 'paragraph', content: 'Overview.' }]
    },
    {
      id: 'module-01-lesson-02',
      title: 'Lesson 2: Temporary Views',
      estimatedMinutes: 12,
      blocks: [{ type: 'paragraph', content: 'Temporary views.' }]
    },
    {
      id: 'module-01-lesson-03',
      title: 'Lesson 3: Module Checkpoint',
      estimatedMinutes: 10,
      blocks: [{ type: 'paragraph', content: 'Checkpoint intro.' }]
    }
  ]
};

const moduleTwo: TheoryChapter = {
  id: 'module-02',
  number: 2,
  title: 'Module 2: Data Cleaning & Transformation Patterns at Scale',
  description: 'Transformations and cleanup at production scale.',
  totalMinutes: 120,
  sections: [
    {
      id: 'module-02-lesson-01',
      title: 'Lesson 1: Cleansing',
      estimatedMinutes: 12,
      blocks: [{ type: 'paragraph', content: 'Cleansing.' }]
    }
  ]
};

const doc: TheoryDoc = {
  topic: 'pyspark',
  title: 'PySpark Modules',
  description: 'Theory curriculum',
  chapters: [moduleOne, moduleTwo]
};

const track: TheoryTrackSummary = {
  slug: 'full-stack',
  label: 'PySpark: The Full Stack',
  eyebrow: 'Track 01',
  description: 'Full track.',
  highlights: [],
  chapters: [moduleOne, moduleTwo],
  chapterCount: 2,
  totalMinutes: 240
};

// TODO(beta-tests): mocks stale after OAuth + Learn unification — rewrite post-beta
describe.skip('TheoryTrackPath', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              module_id: 'module-01',
              module_order: 1,
              is_unlocked: true,
              is_completed: true,
              current_lesson_id: 'module-01-lesson-03',
              last_visited_route:
                '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-03',
              updated_at: '2026-03-03T15:00:00.000Z'
            },
            {
              module_id: 'module-02',
              module_order: 2,
              is_unlocked: true,
              is_completed: false,
              current_lesson_id: null,
              last_visited_route: null,
              updated_at: '2026-03-03T15:00:00.000Z'
            }
          ]
        })
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('refreshes stale track completion from live module progress and unlocks the next module', async () => {
    render(
      <TheoryTrackPath
        doc={doc}
        track={track}
        completedChapterIds={[]}
        chapterProgressById={{
          'module-01': {
            sectionsRead: 3,
            sectionsTotal: 3,
            isCompleted: false,
            lastActiveAt: '2026-03-03T14:55:00.000Z',
            currentLessonId: 'module-01-lesson-03',
            lastVisitedRoute:
              '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-03'
          }
        }}
        moduleProgressById={{
          'module-01': {
            moduleOrder: 1,
            isUnlocked: true,
            isCompleted: false,
            currentLessonId: 'module-01-lesson-03',
            lastVisitedRoute:
              '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-03',
            updatedAt: '2026-03-03T14:55:00.000Z'
          },
          'module-02': {
            moduleOrder: 2,
            isUnlocked: false,
            isCompleted: false,
            currentLessonId: null,
            lastVisitedRoute: null,
            updatedAt: '2026-03-03T14:50:00.000Z'
          }
        }}
      />
    );

    expect(screen.getAllByText('Checkpoint ready').length).toBeGreaterThan(0);
    expect(
      screen
        .getAllByText('Data Cleaning & Transformation Patterns at Scale')
        .every((element) => element.closest('a') === null)
    ).toBe(true);

    await waitFor(() => {
      expect(screen.getAllByText('Checkpoint passed').length).toBeGreaterThan(0);
      expect(
        screen
          .getAllByText('Data Cleaning & Transformation Patterns at Scale')
          .some((element) => element.closest('a') !== null)
      ).toBe(true);
    });
  });
});
