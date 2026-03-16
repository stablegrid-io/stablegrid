import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface ReadingSessionRow {
  user_id: string;
  topic: string;
  chapter_id: string;
  sections_read: number;
  sections_total: number;
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

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('notFound');
  })
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock
}));

const makeSupabaseClient = ({
  readingRows,
  moduleRows
}: {
  readingRows: ReadingSessionRow[];
  moduleRows: ModuleProgressRow[];
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
                error: null
              }))
            }))
          }))
        }))
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  })
});

describe('learn theory pages progress parity', () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    createClientMock.mockReturnValue(
      makeSupabaseClient({
        readingRows: [
          {
            user_id: 'user-1',
            topic: 'fabric',
            chapter_id: 'module-01',
            sections_read: 1,
            sections_total: 1,
            is_completed: false,
            last_active_at: '2026-03-02T09:00:00.000Z',
            current_lesson_id: 'module-01-lesson-01',
            last_visited_route:
              '/learn/fabric/theory/all?chapter=module-01&lesson=module-01-lesson-01'
          }
        ],
        moduleRows: [
          {
            user_id: 'user-1',
            topic: 'fabric',
            module_id: 'module-01',
            module_order: 1,
            is_unlocked: true,
            is_completed: true,
            current_lesson_id: 'module-01-lesson-01',
            last_visited_route:
              '/learn/fabric/theory/all?chapter=module-01&lesson=module-01-lesson-01',
            updated_at: '2026-03-02T09:00:00.000Z'
          }
        ]
      })
    );
  });

  afterEach(() => {
    cleanup();
  });

  it('keeps topic-card completion counts aligned with the deeper learn pages', async () => {
    const { default: LearnTheoryTopicsPage } = await import('@/app/learn/theory/page');
    render(await LearnTheoryTopicsPage());

    // LearnModeTopicSelector strips trailing "Modules" via getSimpleTrackName(),
    // so 'Microsoft Fabric Modules' renders as 'Microsoft Fabric' on the card.
    const fabricCard = screen.getByText('Microsoft Fabric').closest('a');
    expect(fabricCard).not.toBeNull();
    // The fabric topic now has 28 modules total (20 from full-stack track + 8 from data-engineering-track)
    expect(within(fabricCard as HTMLElement).getByText('1/28 read')).toBeInTheDocument();

    cleanup();

    const { default: LearnTopicTheoryPage } = await import('@/app/learn/[topic]/theory/page');
    render(
      await LearnTopicTheoryPage({
        params: { topic: 'fabric' }
      })
    );

    // The fabric topic now renders a TheoryTrackGallery (track-level view).
    // The full-stack track covers all 20 modules; with module-01 complete, verify parity.
    expect(screen.getByText('1/20 modules complete')).toBeInTheDocument();
  });
});
