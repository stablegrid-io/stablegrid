import { beforeEach, describe, expect, it, vi } from 'vitest';

interface StoredModuleProgressRow {
  id: string;
  user_id: string;
  topic: string;
  module_id: string;
  module_order: number;
  is_unlocked: boolean;
  is_completed: boolean;
  current_lesson_id: string | null;
  last_visited_route: string | null;
  completed_at: string | null;
  updated_at: string;
}

interface StoredReadingSessionRow {
  user_id: string;
  topic: string;
  chapter_id: string;
  chapter_number: number;
  sections_total: number;
  sections_read: number;
  sections_ids_read: string[];
  completed_lesson_ids?: string[];
  lesson_seconds_by_id?: Record<string, number>;
  is_completed: boolean;
  completed_at: string | null;
  current_lesson_id?: string | null;
  last_visited_route?: string | null;
  last_active_at: string;
}

const createClientMock = vi.fn();
const revalidatePathMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock
}));

const makeSupabaseClient = (rowsRef: StoredModuleProgressRow[]) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    })
  },
  from: vi.fn((table: string) => {
    if (table !== 'module_progress') {
      throw new Error(`Unexpected table: ${table}`);
    }

    return {
      select: vi.fn(() => ({
        eq: vi.fn((_userColumn: string, userId: string) => ({
          eq: vi.fn((_topicColumn: string, topic: string) => ({
            order: vi.fn(async () => ({
              data: rowsRef
                .filter((row) => row.user_id === userId && row.topic === topic)
                .sort((left, right) => left.module_order - right.module_order),
              error: null
            }))
          }))
        }))
      })),
      upsert: vi.fn(async (incomingRows: Omit<StoredModuleProgressRow, 'id'>[]) => {
        incomingRows.forEach((incomingRow) => {
          const existingIndex = rowsRef.findIndex(
            (row) =>
              row.user_id === incomingRow.user_id &&
              row.topic === incomingRow.topic &&
              row.module_id === incomingRow.module_id
          );

          if (existingIndex >= 0) {
            rowsRef[existingIndex] = {
              ...rowsRef[existingIndex],
              ...incomingRow
            };
            return;
          }

          rowsRef.push({
            id: `row-${rowsRef.length + 1}`,
            ...incomingRow
          });
        });

        return { error: null };
      })
    };
  })
});

const makeFallbackSupabaseClient = (rowsRef: StoredReadingSessionRow[]) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    })
  },
  from: vi.fn((table: string) => {
    if (table === 'module_progress') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(async () => ({
                data: null,
                error: {
                  message: 'relation "public.module_progress" does not exist'
                }
              }))
            }))
          }))
        })),
        upsert: vi.fn(async () => ({
          error: {
            message: 'relation "public.module_progress" does not exist'
          }
        }))
      };
    }

    if (table !== 'reading_sessions') {
      throw new Error(`Unexpected table: ${table}`);
    }

    const buildReadingSessionsQuery = (selectColumns: string) => {
      const filters: Record<string, string> = {};
      const selectedColumns = selectColumns
        .split(',')
        .map((column) => column.trim())
        .filter(Boolean);
      const applyFilters = () =>
        rowsRef.filter((row) =>
          Object.entries(filters).every(([column, value]) => {
            if (column === 'user_id') return row.user_id === value;
            if (column === 'topic') return row.topic === value;
            if (column === 'chapter_id') return row.chapter_id === value;
            return true;
          })
        );
      const pickColumns = (row: StoredReadingSessionRow) =>
        selectedColumns.reduce<Record<string, unknown>>((accumulator, column) => {
          accumulator[column] = (row as unknown as Record<string, unknown>)[column];
          return accumulator;
        }, {});

      const query: any = {};
      query.eq = vi.fn((column: string, value: string) => {
        filters[column] = value;
        return query;
      });
      query.maybeSingle = vi.fn(async () => {
        const row = applyFilters()[0];
        return {
          data: row ? pickColumns(row) : null,
          error: null
        };
      });
      query.then = (
        resolve: (value: { data: Record<string, unknown>[]; error: null }) => unknown,
        reject?: (reason: unknown) => unknown
      ) =>
        Promise.resolve({
          data: applyFilters().map((row) => pickColumns(row)),
          error: null
        }).then(resolve, reject);

      return query;
    };

    return {
      select: vi.fn((columns: string) => buildReadingSessionsQuery(columns)),
      upsert: vi.fn(async (incoming: StoredReadingSessionRow | StoredReadingSessionRow[]) => {
        const incomingRows = Array.isArray(incoming) ? incoming : [incoming];
        incomingRows.forEach((incomingRow) => {
          const existingIndex = rowsRef.findIndex(
            (row) =>
              row.user_id === incomingRow.user_id &&
              row.topic === incomingRow.topic &&
              row.chapter_id === incomingRow.chapter_id
          );

          if (existingIndex >= 0) {
            rowsRef[existingIndex] = {
              ...rowsRef[existingIndex],
              ...incomingRow
            };
            return;
          }

          rowsRef.push({
            ...incomingRow
          });
        });

        return { error: null };
      })
    };
  })
});

const post = async (payload: Record<string, unknown>) => {
  const { POST } = await import('@/app/api/learn/module-progress/route');
  return POST(
    new Request('http://localhost/api/learn/module-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  );
};

describe('module-progress route', () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
  });

  it('persists current lesson and route with touch action', async () => {
    const rows: StoredModuleProgressRow[] = [];
    createClientMock.mockReturnValue(makeSupabaseClient(rows));

    const response = await post({
      topic: 'pyspark',
      action: 'touch',
      moduleId: 'module-01',
      currentLessonId: 'module-01-lesson-02',
      lastVisitedRoute:
        '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-02'
    });

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      data: StoredModuleProgressRow[];
    };
    const moduleOne = payload.data.find((row) => row.module_id === 'module-01');

    expect(moduleOne?.is_unlocked).toBe(true);
    expect(moduleOne?.current_lesson_id).toBe('module-01-lesson-02');
    expect(moduleOne?.last_visited_route).toContain('lesson=module-01-lesson-02');
  });

  it('unlocks module 2 when module 1 is completed', async () => {
    const rows: StoredModuleProgressRow[] = [];
    createClientMock.mockReturnValue(makeSupabaseClient(rows));

    const response = await post({
      topic: 'pyspark',
      action: 'complete',
      moduleId: 'module-01'
    });

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      data: StoredModuleProgressRow[];
    };
    const moduleOne = payload.data.find((row) => row.module_id === 'module-01');
    const moduleTwo = payload.data.find((row) => row.module_id === 'module-02');

    expect(moduleOne?.is_completed).toBe(true);
    expect(moduleTwo?.is_unlocked).toBe(true);
  });

  it('rejects completion for a locked module', async () => {
    const rows: StoredModuleProgressRow[] = [];
    createClientMock.mockReturnValue(makeSupabaseClient(rows));

    const response = await post({
      topic: 'pyspark',
      action: 'complete',
      moduleId: 'module-02'
    });

    expect(response.status).toBe(409);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toMatch(/locked/i);
  });

  it('falls back to reading_sessions storage when module_progress is unavailable', async () => {
    const readingRows: StoredReadingSessionRow[] = [];
    createClientMock.mockReturnValue(makeFallbackSupabaseClient(readingRows));

    const response = await post({
      topic: 'pyspark',
      action: 'complete',
      moduleId: 'module-01'
    });

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      data: StoredModuleProgressRow[];
      storage: string;
      warning?: string;
    };

    expect(payload.storage).toBe('reading_sessions_fallback');
    expect(payload.warning).toMatch(/fallback/i);

    const moduleOne = payload.data.find((row) => row.module_id === 'module-01');
    const moduleTwo = payload.data.find((row) => row.module_id === 'module-02');
    expect(moduleOne?.is_completed).toBe(true);
    expect(moduleTwo?.is_unlocked).toBe(true);

    const savedModuleOne = readingRows.find((row) => row.chapter_id === 'module-01');
    expect(savedModuleOne?.is_completed).toBe(true);
  });

  it('does not wipe lesson arrays when marking module incomplete in fallback mode', async () => {
    const readingRows: StoredReadingSessionRow[] = [
      {
        user_id: 'user-1',
        topic: 'pyspark',
        chapter_id: 'module-01',
        chapter_number: 1,
        sections_total: 4,
        sections_read: 3,
        sections_ids_read: [
          'module-01-lesson-01',
          'module-01-lesson-02',
          'module-01-lesson-03'
        ],
        completed_lesson_ids: [
          'module-01-lesson-01',
          'module-01-lesson-02',
          'module-01-lesson-03'
        ],
        is_completed: true,
        completed_at: '2026-02-23T12:00:00.000Z',
        current_lesson_id: 'module-01-lesson-03',
        last_visited_route:
          '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-03',
        last_active_at: '2026-02-23T12:00:00.000Z'
      }
    ];
    createClientMock.mockReturnValue(makeFallbackSupabaseClient(readingRows));

    const response = await post({
      topic: 'pyspark',
      action: 'incomplete',
      moduleId: 'module-01'
    });

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      data: StoredModuleProgressRow[];
      storage: string;
    };
    expect(payload.storage).toBe('reading_sessions_fallback');

    const savedModuleOne = readingRows.find((row) => row.chapter_id === 'module-01');
    expect(savedModuleOne?.is_completed).toBe(false);
    expect(savedModuleOne?.sections_ids_read).toEqual([
      'module-01-lesson-01',
      'module-01-lesson-02',
      'module-01-lesson-03'
    ]);
    expect(savedModuleOne?.completed_lesson_ids).toEqual([
      'module-01-lesson-01',
      'module-01-lesson-02',
      'module-01-lesson-03'
    ]);
  });

  it('preserves resume state without counting a touched lesson as read in fallback mode', async () => {
    const readingRows: StoredReadingSessionRow[] = [];
    createClientMock.mockReturnValue(makeFallbackSupabaseClient(readingRows));

    const response = await post({
      topic: 'pyspark',
      action: 'touch',
      moduleId: 'module-01',
      currentLessonId: 'module-01-lesson-03',
      lastVisitedRoute:
        '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-03'
    });

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      data: StoredModuleProgressRow[];
      storage: string;
    };
    expect(payload.storage).toBe('reading_sessions_fallback');

    const savedModuleOne = readingRows.find((row) => row.chapter_id === 'module-01');
    expect(savedModuleOne?.sections_read).toBe(0);
    expect(savedModuleOne?.sections_ids_read).toEqual([]);
    expect(savedModuleOne?.completed_lesson_ids).toEqual([]);
    expect(savedModuleOne?.current_lesson_id).toBe('module-01-lesson-03');
    expect(savedModuleOne?.last_visited_route).toContain('lesson=module-01-lesson-03');
  });

  it('preserves existing read lessons when touch updates the resume route in fallback mode', async () => {
    const readingRows: StoredReadingSessionRow[] = [
      {
        user_id: 'user-1',
        topic: 'pyspark',
        chapter_id: 'module-01',
        chapter_number: 1,
        sections_total: 4,
        sections_read: 1,
        sections_ids_read: ['module-01-lesson-01'],
        completed_lesson_ids: ['module-01-lesson-01'],
        is_completed: false,
        completed_at: null,
        current_lesson_id: 'module-01-lesson-01',
        last_visited_route:
          '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-01',
        last_active_at: '2026-02-23T12:00:00.000Z'
      }
    ];
    createClientMock.mockReturnValue(makeFallbackSupabaseClient(readingRows));

    const touchResponse = await post({
      topic: 'pyspark',
      action: 'touch',
      moduleId: 'module-01',
      currentLessonId: 'module-01-lesson-03',
      lastVisitedRoute:
        '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-03'
    });
    expect(touchResponse.status).toBe(200);

    const savedModuleOne = readingRows.find((row) => row.chapter_id === 'module-01');
    expect(savedModuleOne?.sections_read).toBe(1);
    expect(savedModuleOne?.sections_ids_read).toEqual(['module-01-lesson-01']);
    expect(savedModuleOne?.completed_lesson_ids).toEqual(['module-01-lesson-01']);
    expect(savedModuleOne?.current_lesson_id).toBe('module-01-lesson-03');
    expect(savedModuleOne?.last_visited_route).toContain('lesson=module-01-lesson-03');
  });

  it('preserves lesson_seconds_by_id when touch updates resume state in fallback mode', async () => {
    const readingRows: StoredReadingSessionRow[] = [
      {
        user_id: 'user-1',
        topic: 'pyspark',
        chapter_id: 'module-01',
        chapter_number: 1,
        sections_total: 4,
        sections_read: 1,
        sections_ids_read: ['module-01-lesson-01'],
        completed_lesson_ids: ['module-01-lesson-01'],
        lesson_seconds_by_id: {
          'module-01-lesson-01': 30
        },
        is_completed: false,
        completed_at: null,
        current_lesson_id: 'module-01-lesson-01',
        last_visited_route:
          '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-01',
        last_active_at: '2026-02-23T12:00:00.000Z'
      }
    ];
    createClientMock.mockReturnValue(makeFallbackSupabaseClient(readingRows));

    const touchResponse = await post({
      topic: 'pyspark',
      action: 'touch',
      moduleId: 'module-01',
      currentLessonId: 'module-01-lesson-03',
      lastVisitedRoute:
        '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-03'
    });
    expect(touchResponse.status).toBe(200);

    const savedModuleOne = readingRows.find((row) => row.chapter_id === 'module-01');
    expect(savedModuleOne?.lesson_seconds_by_id).toEqual({
      'module-01-lesson-01': 30
    });
    expect(savedModuleOne?.completed_lesson_ids).toEqual(['module-01-lesson-01']);
  });
});
