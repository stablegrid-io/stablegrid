import { describe, expect, it } from 'vitest';
import {
  mutateModuleProgressRows,
  normalizeModuleProgressChain,
  type ModuleProgressRowLike
} from '@/lib/learn/moduleProgress';

const canonicalModules = [
  { id: 'module-01', order: 1 },
  { id: 'module-02', order: 2 },
  { id: 'module-03', order: 3 }
];

const baseRows: ModuleProgressRowLike[] = [
  {
    module_id: 'module-01',
    module_order: 1,
    is_unlocked: true,
    is_completed: false,
    current_lesson_id: null,
    last_visited_route: null,
    completed_at: null
  },
  {
    module_id: 'module-02',
    module_order: 2,
    is_unlocked: false,
    is_completed: false,
    current_lesson_id: null,
    last_visited_route: null,
    completed_at: null
  },
  {
    module_id: 'module-03',
    module_order: 3,
    is_unlocked: false,
    is_completed: false,
    current_lesson_id: null,
    last_visited_route: null,
    completed_at: null
  }
];

describe('module progress chain normalization', () => {
  it('unlocks only the first module when nothing is completed', () => {
    const nowIso = '2026-02-23T12:00:00.000Z';

    const normalized = normalizeModuleProgressChain({
      canonicalModules,
      existingRows: baseRows,
      userId: 'user-1',
      topic: 'pyspark',
      nowIso
    });

    expect(normalized.map((row) => row.module_id)).toEqual([
      'module-01',
      'module-02',
      'module-03'
    ]);
    expect(normalized.map((row) => row.is_unlocked)).toEqual([true, false, false]);
    expect(normalized.map((row) => row.is_completed)).toEqual([false, false, false]);
    expect(normalized.every((row) => row.updated_at === nowIso)).toBe(true);
  });

  it('unlocks the next module when the previous one is completed and preserves lesson route', () => {
    const nowIso = '2026-02-23T13:00:00.000Z';
    const rows: ModuleProgressRowLike[] = [
      {
        ...baseRows[0],
        is_completed: true,
        completed_at: '2026-02-22T10:00:00.000Z'
      },
      {
        ...baseRows[1],
        current_lesson_id: 'module-02-lesson-02',
        last_visited_route:
          '/learn/pyspark/theory/all?chapter=module-02&lesson=module-02-lesson-02'
      },
      baseRows[2]
    ];

    const normalized = normalizeModuleProgressChain({
      canonicalModules,
      existingRows: rows,
      userId: 'user-1',
      topic: 'pyspark',
      nowIso
    });

    expect(normalized.map((row) => row.is_unlocked)).toEqual([true, true, false]);
    expect(normalized[0].completed_at).toBe('2026-02-22T10:00:00.000Z');
    expect(normalized[1].current_lesson_id).toBe('module-02-lesson-02');
    expect(normalized[1].last_visited_route).toContain('chapter=module-02');
  });

  it('only bumps updated_at for rows changed by mutation or unlock-chain recompute', () => {
    const oldTs = '2026-02-20T08:00:00.000Z';
    const nowIso = '2026-02-23T15:00:00.000Z';
    const rowsWithTimestamps: ModuleProgressRowLike[] = baseRows.map((row) => ({
      ...row,
      updated_at: oldTs
    }));

    const completedRows = mutateModuleProgressRows({
      rows: rowsWithTimestamps,
      moduleId: 'module-01',
      mutation: { type: 'complete' },
      nowIso
    });

    const normalized = normalizeModuleProgressChain({
      canonicalModules,
      existingRows: completedRows,
      userId: 'user-1',
      topic: 'pyspark',
      nowIso
    });

    expect(normalized[0].updated_at).toBe(nowIso);
    expect(normalized[1].updated_at).toBe(nowIso);
    expect(normalized[2].updated_at).toBe(oldTs);
  });
});

describe('module progress row mutation', () => {
  it('supports complete, incomplete, and touch mutations', () => {
    const nowIso = '2026-02-23T14:00:00.000Z';

    const completed = mutateModuleProgressRows({
      rows: baseRows,
      moduleId: 'module-02',
      mutation: { type: 'complete' },
      nowIso
    });
    expect(completed[1].is_completed).toBe(true);
    expect(completed[1].completed_at).toBe(nowIso);

    const touched = mutateModuleProgressRows({
      rows: completed,
      moduleId: 'module-02',
      mutation: {
        type: 'touch',
        currentLessonId: 'module-02-lesson-03',
        lastVisitedRoute:
          '/learn/pyspark/theory/all?chapter=module-02&lesson=module-02-lesson-03'
      },
      nowIso
    });
    expect(touched[1].current_lesson_id).toBe('module-02-lesson-03');
    expect(touched[1].last_visited_route).toContain('lesson=module-02-lesson-03');

    const incomplete = mutateModuleProgressRows({
      rows: touched,
      moduleId: 'module-02',
      mutation: { type: 'incomplete' },
      nowIso
    });
    expect(incomplete[1].is_completed).toBe(false);
    expect(incomplete[1].completed_at).toBeNull();
    expect(incomplete[1].current_lesson_id).toBe('module-02-lesson-03');
  });
});
