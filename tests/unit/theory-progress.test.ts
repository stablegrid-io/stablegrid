import { describe, expect, it } from 'vitest';
import {
  getCanonicalTheoryStats,
  summarizeTheoryProgressFromSessions
} from '@/lib/learn/theoryProgress';

describe('theory progress summaries', () => {
  it('ignores stale chapter ids that are no longer part of the theory course', () => {
    const stats = getCanonicalTheoryStats('pyspark');
    expect(stats.modules.length).toBeGreaterThanOrEqual(2);

    const [firstModule, secondModule] = stats.modules;
    const summary = summarizeTheoryProgressFromSessions('pyspark', [
      {
        chapter_id: firstModule.id,
        is_completed: true,
        active_seconds: 180,
        sections_read: 1,
        completed_at: '2026-02-25T10:00:00.000Z'
      },
      {
        chapter_id: 'legacy-module-99',
        is_completed: true,
        active_seconds: 999,
        sections_read: 999,
        completed_at: '2026-02-25T11:00:00.000Z'
      },
      {
        chapter_id: secondModule.id,
        is_completed: false,
        active_seconds: 90,
        sections_read: secondModule.sectionCount + 5,
        last_active_at: '2026-02-25T11:30:00.000Z'
      }
    ]);

    expect(summary.chapterTotal).toBe(stats.chapterTotal);
    expect(summary.sectionTotal).toBe(stats.sectionTotal);
    expect(summary.chapterCompleted).toBe(1);
    expect(summary.completedChapterIds).toEqual(new Set([firstModule.id]));
    expect(summary.sectionRead).toBe(
      firstModule.sectionCount + secondModule.sectionCount
    );
    expect(summary.totalSeconds).toBe(270);
  });

  it('uses the most recent row when duplicate reading sessions exist for a module', () => {
    const stats = getCanonicalTheoryStats('fabric');
    expect(stats.modules.length).toBeGreaterThan(0);

    const [firstModule] = stats.modules;
    const summary = summarizeTheoryProgressFromSessions('fabric', [
      {
        chapter_id: firstModule.id,
        is_completed: true,
        active_seconds: 300,
        sections_read: firstModule.sectionCount,
        completed_at: '2026-02-24T09:00:00.000Z'
      },
      {
        chapter_id: firstModule.id,
        is_completed: false,
        active_seconds: 120,
        sections_read: 1,
        last_active_at: '2026-02-24T10:00:00.000Z'
      }
    ]);

    expect(summary.chapterCompleted).toBe(0);
    expect(summary.completedChapterIds.size).toBe(0);
    expect(summary.sectionRead).toBe(1);
    expect(summary.totalSeconds).toBe(120);
  });

  it('derives lesson counts from timed lesson progress before falling back to stale section counters', () => {
    const stats = getCanonicalTheoryStats('fabric');
    const [firstModule] = stats.modules;

    const summary = summarizeTheoryProgressFromSessions('fabric', [
      {
        chapter_id: firstModule.id,
        is_completed: false,
        active_seconds: 95,
        sections_read: 0,
        completed_lesson_ids: [],
        lesson_seconds_by_id: {
          [firstModule.lessonIds[0]]: 30
        },
        last_active_at: '2026-03-03T09:00:00.000Z'
      }
    ]);

    expect(summary.chapterCompleted).toBe(0);
    expect(summary.sectionRead).toBe(1);
    expect(summary.totalSeconds).toBe(95);
  });
});
