import { beforeEach, describe, expect, it, vi } from 'vitest';

interface ReadingSessionRow {
  user_id: string;
  topic: string;
  chapter_id: string;
  sections_read: number;
  sections_total: number;
  sections_ids_read?: string[] | null;
  completed_lesson_ids?: string[] | null;
  lesson_seconds_by_id?: Record<string, unknown> | null;
  is_completed: boolean;
  last_active_at: string | null;
  current_lesson_id: string | null;
  last_visited_route: string | null;
}

interface ModuleProgressRow {
  user_id: string;
  topic: string;
  module_id: string;
  module_order: number;
  is_unlocked: boolean;
  is_completed: boolean;
  current_lesson_id: string | null;
  last_visited_route: string | null;
  updated_at: string | null;
}

const createClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock
}));

const makeSupabaseClient = ({
  readingRows,
  moduleRows,
  moduleRowsError = null
}: {
  readingRows: ReadingSessionRow[];
  moduleRows: ModuleProgressRow[];
  moduleRowsError?: { message: string } | null;
}) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } }
    })
  },
  from: vi.fn((table: string) => {
    if (table === 'reading_sessions') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((_userColumn: string, userId: string) => ({
            eq: vi.fn(async (_topicColumn: string, topic: string) => ({
              data: readingRows.filter(
                (row) => row.user_id === userId && row.topic === topic
              ),
              error: null
            }))
          }))
        }))
      };
    }

    if (table === 'module_progress') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((_userColumn: string, userId: string) => ({
            eq: vi.fn((_topicColumn: string, topic: string) => ({
              order: vi.fn(async () => ({
                data: moduleRows.filter(
                  (row) => row.user_id === userId && row.topic === topic
                ),
                error: moduleRowsError
              }))
            }))
          }))
        }))
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  })
});

// TODO(beta-tests): mocks stale after OAuth + Learn unification — rewrite post-beta
describe.skip('loadServerTheoryProgress', () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
  });

  it('keeps completion strictly module-based when module_progress rows are sparse', async () => {
    createClientMock.mockReturnValue(
      makeSupabaseClient({
        readingRows: [
          {
            user_id: 'user-1',
            topic: 'pyspark',
            chapter_id: 'module-01',
            sections_read: 4,
            sections_total: 4,
            is_completed: true,
            last_active_at: '2026-03-02T09:00:00.000Z',
            current_lesson_id: 'module-01-lesson-04',
            last_visited_route:
              '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-04'
          },
          {
            user_id: 'user-1',
            topic: 'pyspark',
            chapter_id: 'module-03',
            sections_read: 2,
            sections_total: 4,
            is_completed: false,
            last_active_at: '2026-03-02T10:00:00.000Z',
            current_lesson_id: 'module-03-lesson-02',
            last_visited_route:
              '/learn/pyspark/theory/all?chapter=module-03&lesson=module-03-lesson-02'
          }
        ],
        moduleRows: [
          {
            user_id: 'user-1',
            topic: 'pyspark',
            module_id: 'module-01',
            module_order: 1,
            is_unlocked: true,
            is_completed: true,
            current_lesson_id: 'module-01-lesson-04',
            last_visited_route:
              '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-04',
            updated_at: '2026-03-02T09:00:00.000Z'
          },
          {
            user_id: 'user-1',
            topic: 'pyspark',
            module_id: 'module-03',
            module_order: 3,
            is_unlocked: true,
            is_completed: false,
            current_lesson_id: 'module-03-lesson-02',
            last_visited_route:
              '/learn/pyspark/theory/all?chapter=module-03&lesson=module-03-lesson-02',
            updated_at: '2026-03-02T10:00:00.000Z'
          }
        ]
      })
    );

    const { loadServerTheoryProgress } = await import('@/lib/learn/serverTheoryProgress');
    const progress = await loadServerTheoryProgress('pyspark');

    expect(progress.totalChapterCount).toBe(30);
    expect(progress.completedChapterIds).toEqual(['module-01']);
    expect(progress.moduleProgressById['module-02']).toEqual({
      moduleOrder: 2,
      isUnlocked: true,
      isCompleted: false,
      currentLessonId: null,
      lastVisitedRoute: null,
      updatedAt: null
    });
    expect(progress.moduleProgressById['module-03']).toMatchObject({
      moduleOrder: 3,
      isUnlocked: true,
      isCompleted: false,
      currentLessonId: 'module-03-lesson-02'
    });
  });

  it('falls back to reading_sessions when module_progress has no rows', async () => {
    createClientMock.mockReturnValue(
      makeSupabaseClient({
        readingRows: [
          {
            user_id: 'user-1',
            topic: 'pyspark',
            chapter_id: 'module-01',
            sections_read: 4,
            sections_total: 4,
            is_completed: true,
            last_active_at: '2026-03-02T09:00:00.000Z',
            current_lesson_id: 'module-01-lesson-04',
            last_visited_route:
              '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-04'
          }
        ],
        moduleRows: []
      })
    );

    const { loadServerTheoryProgress } = await import('@/lib/learn/serverTheoryProgress');
    const progress = await loadServerTheoryProgress('pyspark');

    expect(progress.totalChapterCount).toBe(30);
    expect(progress.completedChapterIds).toEqual(['module-01']);
    expect(progress.chapterProgressById['module-01']).toMatchObject({
      sectionsRead: 4,
      isCompleted: true
    });
    expect(progress.moduleProgressById).toEqual({});
  });

  it('builds chapter lesson counts from timed lesson progress on the server', async () => {
    createClientMock.mockReturnValue(
      makeSupabaseClient({
        readingRows: [
          {
            user_id: 'user-1',
            topic: 'pyspark',
            chapter_id: 'module-01',
            sections_read: 0,
            sections_total: 4,
            completed_lesson_ids: [],
            lesson_seconds_by_id: {
              'module-01-lesson-01': 30,
              'module-01-lesson-02': 12
            },
            is_completed: false,
            last_active_at: '2026-03-03T09:00:00.000Z',
            current_lesson_id: 'module-01-lesson-02',
            last_visited_route:
              '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-02'
          }
        ],
        moduleRows: []
      })
    );

    const { loadServerTheoryProgress } = await import('@/lib/learn/serverTheoryProgress');
    const progress = await loadServerTheoryProgress('pyspark');

    expect(progress.totalChapterCount).toBe(30);
    expect(progress.chapterProgressById['module-01']).toMatchObject({
      sectionsRead: 1,
      sectionsTotal: 4,
      isCompleted: false
    });
  });
});
