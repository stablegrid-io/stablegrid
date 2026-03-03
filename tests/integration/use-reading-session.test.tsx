import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useReadingSession } from '@/lib/hooks/useReadingSession';
import { MIN_LESSON_READ_SECONDS } from '@/lib/learn/lessonReadProgress';
import type { TheoryChapter } from '@/types/theory';

interface StoredReadingSessionRow {
  id: string;
  user_id: string;
  topic: string;
  chapter_id: string;
  chapter_number: number;
  sections_total: number;
  sections_read: number;
  sections_ids_read: string[];
  completed_lesson_ids: string[];
  lesson_seconds_by_id: Record<string, number>;
  current_lesson_id: string | null;
  last_visited_route: string | null;
  active_seconds: number;
  is_completed: boolean;
  completed_at: string | null;
  xp_awarded?: boolean | null;
}

interface StoredReadingHistoryRow {
  user_id: string;
  topic: string;
  chapter_id: string;
  chapter_number: number;
  lesson_id: string;
  lesson_order: number;
  read_at: string;
  source_session_id: string | null;
}

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn()
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: createClientMock
}));

const chapter: TheoryChapter = {
  id: 'module-01',
  number: 1,
  title: 'Module 1',
  description: 'Reading session test module',
  totalMinutes: 20,
  sections: [
    {
      id: 'module-01-lesson-01',
      title: 'Lesson 1: Intro',
      estimatedMinutes: 10,
      blocks: [{ type: 'paragraph', content: 'Lesson 1 content.' }]
    },
    {
      id: 'module-01-lesson-02',
      title: 'Lesson 2: Transformations',
      estimatedMinutes: 10,
      blocks: [{ type: 'paragraph', content: 'Lesson 2 content.' }]
    }
  ]
};

const routeForLesson = (lessonId: string | null) =>
  lessonId
    ? `/learn/pyspark/theory/all?chapter=${chapter.id}&lesson=${lessonId}`
    : `/learn/pyspark/theory/all?chapter=${chapter.id}`;

const makeSupabaseClient = (
  sessionState: { current: StoredReadingSessionRow | null },
  historyRowsRef: StoredReadingHistoryRow[] = [],
  options?: {
    deferReadingSessionUpdates?: boolean;
  }
) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    })
  },
  from: vi.fn((table: string) => {
    if (table === 'reading_sessions') {
      return {
        select: vi.fn(() => {
          const filters: Record<string, string> = {};
          const query: any = {};

          query.eq = vi.fn((column: string, value: string) => {
            filters[column] = value;
            return query;
          });

          query.maybeSingle = vi.fn(async () => {
            const row = sessionState.current;
            const matches =
              row &&
              filters.user_id === row.user_id &&
              filters.topic === row.topic &&
              filters.chapter_id === row.chapter_id;

            return {
              data: matches ? { ...row } : null,
              error: null
            };
          });

          return query;
        }),
        insert: vi.fn((payload: Omit<StoredReadingSessionRow, 'id' | 'active_seconds' | 'is_completed' | 'completed_at'>) => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => {
              sessionState.current = {
                id: 'session-1',
                active_seconds: 0,
                is_completed: false,
                completed_at: null,
                xp_awarded: false,
                ...payload
              };

              return {
                data: { id: 'session-1' },
                error: null
              };
            })
          }))
        })),
        update: vi.fn((payload: Partial<StoredReadingSessionRow>) => ({
          eq: vi.fn(async (column: string, value: string) => {
            if (options?.deferReadingSessionUpdates) {
              return new Promise<{ error: null }>(() => {
                void column;
                void value;
                void payload;
              });
            }

            if (column === 'id' && sessionState.current?.id === value) {
              sessionState.current = {
                ...sessionState.current,
                ...payload
              };
            }

            return { error: null };
          })
        }))
      };
    }

    if (table === 'topic_progress') {
      return {
        upsert: vi.fn(async () => ({ error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null }))
          }))
        }))
      };
    }

    if (table === 'reading_lesson_history') {
      return {
        upsert: vi.fn(async (incomingRows: StoredReadingHistoryRow[]) => {
          incomingRows.forEach((incomingRow) => {
            const exists = historyRowsRef.some(
              (row) =>
                row.user_id === incomingRow.user_id &&
                row.topic === incomingRow.topic &&
                row.chapter_id === incomingRow.chapter_id &&
                row.lesson_id === incomingRow.lesson_id
            );

            if (!exists) {
              historyRowsRef.push(incomingRow);
            }
          });

          return { error: null };
        })
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  })
});

const ReadingSessionHarness = ({
  currentLessonId
}: {
  currentLessonId: string | null;
}) => {
  const { completedLessonIds, isHydrated } = useReadingSession({
    topic: 'pyspark',
    chapter,
    currentLessonId,
    lastVisitedRoute: routeForLesson(currentLessonId)
  });

  return (
    <div>
      <div data-testid="hydrated">{String(isHydrated)}</div>
      <div data-testid="completed-count">{completedLessonIds.length}</div>
      <div data-testid="completed-ids">{completedLessonIds.join(',')}</div>
    </div>
  );
};

const flushAsyncEffects = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('useReadingSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    createClientMock.mockReset();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('marks lessons as read only after 30 seconds of visible reading', async () => {
    const sessionState = { current: null as StoredReadingSessionRow | null };
    const historyRows: StoredReadingHistoryRow[] = [];
    createClientMock.mockReturnValue(makeSupabaseClient(sessionState, historyRows));

    const { rerender, unmount } = render(
      <ReadingSessionHarness currentLessonId="module-01-lesson-01" />
    );

    await flushAsyncEffects();

    expect(sessionState.current?.id).toBe('session-1');
    expect(screen.getByTestId('hydrated')).toHaveTextContent('true');
    expect(screen.getByTestId('completed-count')).toHaveTextContent('0');
    expect(sessionState.current?.sections_read).toBe(0);

    await act(async () => {
      vi.advanceTimersByTime((MIN_LESSON_READ_SECONDS - 1) * 1000);
    });

    expect(screen.getByTestId('completed-count')).toHaveTextContent('0');
    expect(sessionState.current?.completed_lesson_ids).toEqual([]);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId('completed-count')).toHaveTextContent('1');
    expect(screen.getByTestId('completed-ids')).toHaveTextContent('module-01-lesson-01');
    expect(sessionState.current?.sections_read).toBe(1);
    expect(sessionState.current?.completed_lesson_ids).toEqual(['module-01-lesson-01']);
    expect(sessionState.current?.lesson_seconds_by_id).toMatchObject({
      'module-01-lesson-01': MIN_LESSON_READ_SECONDS
    });
    expect(historyRows).toEqual([
      expect.objectContaining({
        lesson_id: 'module-01-lesson-01',
        lesson_order: 1,
        source_session_id: 'session-1'
      })
    ]);

    rerender(<ReadingSessionHarness currentLessonId="module-01-lesson-02" />);

    await flushAsyncEffects();

    expect(sessionState.current?.completed_lesson_ids).toEqual(['module-01-lesson-01']);
    expect(sessionState.current?.lesson_seconds_by_id).toMatchObject({
      'module-01-lesson-01': MIN_LESSON_READ_SECONDS
    });

    await act(async () => {
      vi.advanceTimersByTime((MIN_LESSON_READ_SECONDS - 1) * 1000);
    });

    expect(screen.getByTestId('completed-count')).toHaveTextContent('1');

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId('completed-count')).toHaveTextContent('2');
    expect(historyRows).toEqual([
      expect.objectContaining({ lesson_id: 'module-01-lesson-01' }),
      expect.objectContaining({ lesson_id: 'module-01-lesson-02', lesson_order: 2 })
    ]);

    unmount();

    await flushAsyncEffects();

    expect(sessionState.current?.completed_lesson_ids).toEqual([
      'module-01-lesson-01',
      'module-01-lesson-02'
    ]);
    expect(sessionState.current?.current_lesson_id).toBe('module-01-lesson-02');
  });

  it('hydrates legacy completed lessons into the new timed read map', async () => {
    const sessionState = {
      current: {
        id: 'session-1',
        user_id: 'user-1',
        topic: 'pyspark',
        chapter_id: chapter.id,
        chapter_number: chapter.number,
        sections_total: chapter.sections.length,
        sections_read: 1,
        sections_ids_read: ['module-01-lesson-01'],
        completed_lesson_ids: ['module-01-lesson-01'],
        lesson_seconds_by_id: {},
        current_lesson_id: 'module-01-lesson-02',
        last_visited_route: routeForLesson('module-01-lesson-02'),
        active_seconds: 12,
        is_completed: false,
        completed_at: null,
        xp_awarded: false
      } satisfies StoredReadingSessionRow
    };
    createClientMock.mockReturnValue(makeSupabaseClient(sessionState));

    render(<ReadingSessionHarness currentLessonId="module-01-lesson-02" />);

    await flushAsyncEffects();

    expect(screen.getByTestId('hydrated')).toHaveTextContent('true');
    expect(screen.getByTestId('completed-count')).toHaveTextContent('1');
    expect(screen.getByTestId('completed-ids')).toHaveTextContent('module-01-lesson-01');

    expect(sessionState.current?.lesson_seconds_by_id).toEqual({
      'module-01-lesson-01': MIN_LESSON_READ_SECONDS
    });
  });

  it('restores a read lesson after refresh even if the server write is interrupted', async () => {
    const sessionState = { current: null as StoredReadingSessionRow | null };
    createClientMock.mockImplementation(() =>
      makeSupabaseClient(sessionState, [], {
        deferReadingSessionUpdates: true
      })
    );

    const firstView = render(
      <ReadingSessionHarness currentLessonId="module-01-lesson-01" />
    );

    await flushAsyncEffects();

    await act(async () => {
      vi.advanceTimersByTime(MIN_LESSON_READ_SECONDS * 1000);
    });

    expect(screen.getByTestId('completed-count')).toHaveTextContent('1');
    expect(sessionState.current?.completed_lesson_ids).toEqual([]);

    firstView.unmount();
    await flushAsyncEffects();

    render(<ReadingSessionHarness currentLessonId="module-01-lesson-01" />);

    await flushAsyncEffects();

    expect(screen.getByTestId('hydrated')).toHaveTextContent('true');
    expect(screen.getByTestId('completed-count')).toHaveTextContent('1');
    expect(screen.getByTestId('completed-ids')).toHaveTextContent('module-01-lesson-01');
  });
});
