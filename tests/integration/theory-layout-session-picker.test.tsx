import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TheoryLayout } from '@/components/learn/theory/TheoryLayout';
import { formatTheorySessionDuration } from '@/lib/learn/theorySession';
import type { TheoryDoc } from '@/types/theory';

const replaceMock = vi.fn();
const pushMock = vi.fn();
const addXPMock = vi.fn();
const markChapterCompleteMock = vi.fn();
const fetchMock = vi.fn();
let currentSearchQuery = 'chapter=module-01&lesson=module-01-lesson-03';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: (href: string) => {
      replaceMock(href);
      const [, query = ''] = href.split('?');
      currentSearchQuery = query;
    },
    push: pushMock
  }),
  usePathname: () => '/learn/pyspark/theory/all',
  useSearchParams: () => new URLSearchParams(currentSearchQuery)
}));

vi.mock('@/lib/hooks/useReadingSession', () => ({
  useReadingSession: () => ({
    sessionId: 'session-1',
    isCompleted: false,
    activeSeconds: 0,
    completedLessonIds: [],
    markChapterComplete: markChapterCompleteMock,
    markChapterIncomplete: vi.fn()
  })
}));

vi.mock('@/lib/stores/useProgressStore', () => ({
  useProgressStore: (
    selector: (state: { addXP: typeof addXPMock }) => unknown
  ) => selector({ addXP: addXPMock })
}));

const doc: TheoryDoc = {
  topic: 'pyspark',
  title: 'PySpark Modules',
  description: 'Theory curriculum',
  chapters: [
    {
      id: 'module-01',
      number: 1,
      title: 'Module 1: Foundations',
      description: 'Module one',
      totalMinutes: 60,
      sections: [
        {
          id: 'module-01-lesson-01',
          title: 'Lesson 1: Intro',
          estimatedMinutes: 20,
          blocks: [{ type: 'paragraph', content: 'Intro' }]
        },
        {
          id: 'module-01-lesson-02',
          title: 'Lesson 2: Setup',
          estimatedMinutes: 20,
          blocks: [{ type: 'paragraph', content: 'Setup' }]
        },
        {
          id: 'module-01-lesson-03',
          title: 'Lesson 3: Wrap',
          estimatedMinutes: 20,
          blocks: [{ type: 'paragraph', content: 'Wrap' }]
        }
      ]
    },
    {
      id: 'module-02',
      number: 2,
      title: 'Module 2: DataFrames',
      description: 'Module two',
      totalMinutes: 40,
      sections: [
        {
          id: 'module-02-lesson-01',
          title: 'Lesson 1: Reads',
          estimatedMinutes: 20,
          blocks: [{ type: 'paragraph', content: 'Reads' }]
        },
        {
          id: 'module-02-lesson-02',
          title: 'Lesson 2: Writes',
          estimatedMinutes: 20,
          blocks: [{ type: 'paragraph', content: 'Writes' }]
        }
      ]
    }
  ]
};

describe('TheoryLayout session picker', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    pushMock.mockReset();
    addXPMock.mockReset();
    markChapterCompleteMock.mockReset();
    fetchMock.mockReset();
    currentSearchQuery = 'chapter=module-01&lesson=module-01-lesson-03';

    vi.stubGlobal(
      'fetch',
      fetchMock.mockImplementation(async () => ({
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
              completed_at: '2026-02-24T10:00:00.000Z',
              updated_at: '2026-02-24T10:00:00.000Z'
            },
            {
              module_id: 'module-02',
              module_order: 2,
              is_unlocked: true,
              is_completed: false,
              current_lesson_id: null,
              last_visited_route: null,
              completed_at: null,
              updated_at: '2026-02-24T10:00:00.000Z'
            }
          ]
        })
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not reopen the session picker when navigating to the next module inside the reader', async () => {
    const user = userEvent.setup();

    render(<TheoryLayout doc={doc} />);

    expect(
      await screen.findByRole('dialog', { name: /session picker/i })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /continue without session/i })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /session picker/i })
      ).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    await user.click(screen.getByRole('button', { name: /next module/i }));

    expect(
      await screen.findByRole('heading', { name: /reads/i })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('dialog', { name: /session picker/i })
    ).not.toBeInTheDocument();
  });

  it('keeps the selected session draft when the picker is reopened in the next module', async () => {
    const user = userEvent.setup();

    render(<TheoryLayout doc={doc} />);

    expect(
      await screen.findByRole('dialog', { name: /session picker/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /pomodoro/i }));
    await user.click(screen.getByRole('button', { name: /increase focus/i }));

    expect(
      screen.getAllByText(`${formatTheorySessionDuration(135 * 60)} total`).length
    ).toBeGreaterThan(0);

    await user.click(
      screen.getByRole('button', { name: /continue without session/i })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /session picker/i })
      ).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    await user.click(screen.getByRole('button', { name: /next module/i }));

    expect(
      await screen.findByRole('heading', { name: /reads/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: /session picker/i })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^session$/i }));

    expect(
      await screen.findByRole('dialog', { name: /session picker/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pomodoro/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(
      screen.getAllByText(`${formatTheorySessionDuration(135 * 60)} total`).length
    ).toBeGreaterThan(0);
  });
});
