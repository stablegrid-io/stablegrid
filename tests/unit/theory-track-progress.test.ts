import { describe, expect, it } from 'vitest';
import { summarizeTrackLessonProgress } from '@/lib/learn/theoryTrackProgress';

const chapters = [
  {
    id: 'module-01',
    sections: [{ id: 'm01-l01' }, { id: 'm01-l02' }, { id: 'm01-l03' }]
  },
  {
    id: 'module-02',
    sections: [{ id: 'm02-l01' }, { id: 'm02-l02' }]
  }
];

describe('theory track progress', () => {
  it('counts partial lesson progress before any module is completed', () => {
    const summary = summarizeTrackLessonProgress({
      chapters,
      completedChapterIds: [],
      chapterProgressById: {
        'module-01': {
          sectionsRead: 2,
          sectionsTotal: 3,
          isCompleted: false,
          lastActiveAt: '2026-03-02T10:00:00.000Z',
          currentLessonId: 'm01-l02',
          lastVisitedRoute: '/learn/pyspark/theory/all?chapter=module-01&lesson=m01-l02'
        }
      }
    });

    expect(summary.completedLessons).toBe(2);
    expect(summary.totalLessons).toBe(5);
    expect(summary.completedModules).toBe(0);
    expect(summary.progressPct).toBe(40);
  });

  it('treats completed modules as fully read even when reading snapshots lag behind', () => {
    const summary = summarizeTrackLessonProgress({
      chapters,
      completedChapterIds: ['module-01'],
      chapterProgressById: {
        'module-01': {
          sectionsRead: 1,
          sectionsTotal: 3,
          isCompleted: false,
          lastActiveAt: '2026-03-02T10:05:00.000Z',
          currentLessonId: 'm01-l01',
          lastVisitedRoute: '/learn/pyspark/theory/all?chapter=module-01&lesson=m01-l01'
        }
      }
    });

    expect(summary.completedLessons).toBe(3);
    expect(summary.totalLessons).toBe(5);
    expect(summary.completedModules).toBe(1);
    expect(summary.progressPct).toBe(60);
  });
});
