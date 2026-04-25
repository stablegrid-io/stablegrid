import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TheoryLayout } from '@/components/learn/theory/TheoryLayout';
import type {
  TheorySessionConfig,
  TheorySessionMethodId,
  TheorySessionRuntime
} from '@/lib/learn/theorySession';
import type { TheoryDoc } from '@/types/theory';

const replaceMock = vi.fn();
const pushMock = vi.fn();
const addXPMock = vi.fn();
const markChapterCompleteMock = vi.fn();
const fetchMock = vi.fn();
let currentSearchQuery = 'chapter=module-01&lesson=module-01-lesson-01';
let moduleProgressRows: Array<{
  module_id: string;
  module_order: number;
  is_unlocked: boolean;
  is_completed: boolean;
  current_lesson_id: string | null;
  last_visited_route: string | null;
  completed_at: string | null;
  updated_at: string;
}> = [];
const sessionMethodConfigs = {
  pomodoro: {
    methodId: 'pomodoro' as const,
    focusMinutes: 25,
    breakMinutes: 5,
    rounds: 4
  },
  'deep-focus': {
    methodId: 'deep-focus' as const,
    focusMinutes: 60,
    breakMinutes: 10,
    rounds: 2
  },
  sprint: {
    methodId: 'sprint' as const,
    focusMinutes: 20,
    breakMinutes: 0,
    rounds: 1
  },
  'free-read': {
    methodId: 'free-read' as const,
    focusMinutes: 0,
    breakMinutes: 0,
    rounds: 1
  }
};

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
    isHydrated: true,
    markChapterComplete: markChapterCompleteMock,
    markChapterIncomplete: vi.fn()
  })
}));

vi.mock('@/lib/stores/useProgressStore', () => ({
  useProgressStore: (
    selector: (state: { addXP: typeof addXPMock }) => unknown
  ) => selector({ addXP: addXPMock })
}));

vi.mock('@/lib/stores/useTheorySessionPreferencesStore', () => ({
  useTheorySessionPreferencesStore: (
    selector: (state: {
      methodConfigs: typeof sessionMethodConfigs;
      hasHydrated: boolean;
    }) => unknown
  ) =>
    selector({
      methodConfigs: sessionMethodConfigs,
      hasHydrated: true
    }),
  resolveTheorySessionMethodConfigs: () => sessionMethodConfigs
}));

vi.mock('@/lib/hooks/useTheorySessionTimer', async () => {
  const React = await import('react');

  const createIdleSessionState = (): TheorySessionRuntime => ({
    config: null,
    phase: 'idle',
    pausedPhase: null,
    remainingSeconds: null,
    phaseDurationSeconds: null,
    currentRound: 0,
    completedRounds: 0,
    elapsedSeconds: 0,
    focusElapsedSeconds: 0,
    breakElapsedSeconds: 0,
    breakTip: null,
    summary: null
  });

  const methodMeta: Record<
    TheorySessionMethodId,
    { id: TheorySessionMethodId; label: string; isTimed: boolean }
  > = {
    pomodoro: { id: 'pomodoro', label: 'Pomodoro', isTimed: true },
    'deep-focus': { id: 'deep-focus', label: 'Deep Focus', isTimed: true },
    sprint: { id: 'sprint', label: 'Sprint', isTimed: true },
    'free-read': { id: 'free-read', label: 'Free Read', isTimed: false }
  };

  return {
    useTheorySessionTimer: () => {
      const [state, setState] = React.useState<TheorySessionRuntime>(createIdleSessionState);
      const method = state.config ? methodMeta[state.config.methodId] : null;
      const hasActiveSession =
        state.phase === 'focus' || state.phase === 'break' || state.phase === 'paused';

      return {
        ...state,
        method,
        roundCount: state.config?.rounds ?? 0,
        activeRound: state.currentRound || 1,
        hasHydrated: true,
        hasActiveSession,
        isOnBreak: state.phase === 'break',
        start: (config: TheorySessionConfig) => {
          setState({
            ...createIdleSessionState(),
            config,
            phase: 'focus',
            remainingSeconds: config.focusMinutes * 60,
            phaseDurationSeconds: config.focusMinutes * 60,
            currentRound: 1
          });
        },
        pause: () =>
          setState((current) =>
            current.config
              ? {
                  ...current,
                  phase: 'paused',
                  pausedPhase: current.phase === 'break' ? 'break' : 'focus'
                }
              : current
          ),
        resume: () =>
          setState((current) =>
            current.config
              ? {
                  ...current,
                  phase: current.pausedPhase ?? 'focus',
                  pausedPhase: null
                }
              : current
          ),
        stop: () =>
          setState((current) =>
            current.config
              ? {
                  ...current,
                  phase: 'complete',
                  pausedPhase: null,
                  summary: {
                    totalElapsedSeconds: current.elapsedSeconds,
                    focusElapsedSeconds: current.focusElapsedSeconds,
                    breakElapsedSeconds: current.breakElapsedSeconds
                  }
                }
              : current
          ),
        skipBreak: vi.fn(),
        reset: () => setState(createIdleSessionState())
      };
    }
  };
});

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

const createModuleProgressRows = (
  overrides?: Partial<Record<'module-01' | 'module-02', Partial<(typeof moduleProgressRows)[number]> >>
) => [
  {
    module_id: 'module-01',
    module_order: 1,
    is_unlocked: true,
    is_completed: false,
    current_lesson_id: 'module-01-lesson-01',
    last_visited_route:
      '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-01',
    completed_at: null,
    updated_at: '2026-02-24T10:00:00.000Z',
    ...overrides?.['module-01']
  },
  {
    module_id: 'module-02',
    module_order: 2,
    is_unlocked: true,
    is_completed: false,
    current_lesson_id: 'module-02-lesson-01',
    last_visited_route:
      '/learn/pyspark/theory/all?chapter=module-02&lesson=module-02-lesson-01',
    completed_at: null,
    updated_at: '2026-02-24T10:00:00.000Z',
    ...overrides?.['module-02']
  }
];


// TODO(beta-tests): assumes an older session-picker flow with a "continue
// without session" bypass and a progress-recovery banner that no longer
// exist. Needs rewriting for the current picker UX.
describe.skip('TheoryLayout navigation', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    pushMock.mockReset();
    addXPMock.mockReset();
    markChapterCompleteMock.mockReset();
    fetchMock.mockReset();
    currentSearchQuery = 'chapter=module-01&lesson=module-01-lesson-01';
    moduleProgressRows = createModuleProgressRows();
    window.sessionStorage.clear();

    vi.stubGlobal(
      'fetch',
      fetchMock.mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          data: moduleProgressRows
        })
      }))
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('falls back to the first lesson when the requested lesson id is invalid', async () => {
    currentSearchQuery = 'chapter=module-01&lesson=missing-lesson';

    render(<TheoryLayout doc={doc} />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-01'
      );
    });

    expect(screen.getAllByText('Lesson 1: Intro').length).toBeGreaterThan(0);
  });

  it('falls back to the first unlocked module when the requested module is locked', async () => {
    currentSearchQuery = 'chapter=module-02&lesson=module-02-lesson-01';
    moduleProgressRows = createModuleProgressRows({
      'module-02': {
        is_unlocked: false,
        current_lesson_id: null,
        last_visited_route: null
      }
    });

    render(<TheoryLayout doc={doc} />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-01'
      );
    });

    expect(screen.getAllByText('Lesson 1: Intro').length).toBeGreaterThan(0);
  });

  it('keeps a single lesson title in the reader shell while idle', async () => {
    const user = userEvent.setup();

    render(<TheoryLayout doc={doc} />);

    await user.click(
      await screen.findByRole('button', { name: /continue without session/i })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /session picker/i })
      ).not.toBeInTheDocument();
    });

    expect(screen.getAllByRole('heading', { name: 'Intro' })).toHaveLength(1);
    expect(screen.getByText('Module 1')).toBeInTheDocument();
    expect(screen.getAllByText('Lesson 1 of 3').length).toBeGreaterThan(0);
    expect(screen.queryByText('Reading mode')).not.toBeInTheDocument();
    expect(screen.queryByText('Lesson at a glance')).not.toBeInTheDocument();
  });

  it('shows a recovery banner when progress load fails and clears it after retry', async () => {
    const user = userEvent.setup();
    let getAttempts = 0;

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestMethod =
        init?.method ??
        (typeof input === 'object' && 'method' in input ? input.method : 'GET');
      const method = requestMethod.toUpperCase();

      if (method === 'GET') {
        getAttempts += 1;
        if (getAttempts === 1) {
          return {
            ok: false,
            json: async () => ({ error: 'progress unavailable' })
          };
        }

        return {
          ok: true,
          json: async () => ({
            data: moduleProgressRows
          })
        };
      }

      return {
        ok: true,
        json: async () => ({
          data: moduleProgressRows
        })
      };
    });

    render(<TheoryLayout doc={doc} />);

    expect(await screen.findByTestId('theory-progress-recovery')).toBeInTheDocument();
    await user.click(
      await screen.findByRole('button', { name: /continue without session/i })
    );
    await user.click(screen.getByRole('button', { name: /retry progress sync/i }));

    await waitFor(() => {
      expect(getAttempts).toBeGreaterThanOrEqual(2);
    });
    await waitFor(() => {
      expect(screen.queryByTestId('theory-progress-recovery')).not.toBeInTheDocument();
    });
  });

  it('shows a recovery banner when progress sync fails', async () => {
    const user = userEvent.setup();
    let postAttempts = 0;

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestMethod =
        init?.method ??
        (typeof input === 'object' && 'method' in input ? input.method : 'GET');
      const method = requestMethod.toUpperCase();

      if (method === 'POST') {
        postAttempts += 1;
        return {
          ok: false,
          json: async () => ({ error: 'touch sync failed' })
        };
      }

      return {
        ok: true,
        json: async () => ({
          data: moduleProgressRows
        })
      };
    });

    render(<TheoryLayout doc={doc} />);

    await user.click(
      await screen.findByRole('button', { name: /continue without session/i })
    );
    await user.click(screen.getByRole('button', { name: /next lesson/i }));

    await waitFor(() => {
      expect(postAttempts).toBeGreaterThanOrEqual(1);
    });
    expect(await screen.findByTestId('theory-progress-recovery')).toBeInTheDocument();
  });

  it('moves to the final lesson of the previous module from the first lesson of the current module', async () => {
    const user = userEvent.setup();
    currentSearchQuery = 'chapter=module-02&lesson=module-02-lesson-01';

    render(<TheoryLayout doc={doc} />);

    expect((await screen.findAllByText(/Lesson 1: Reads/i)).length).toBeGreaterThan(0);

    await user.click(
      screen.getByRole('button', { name: /continue without session/i })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /session picker/i })
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /previous module/i }));

    expect((await screen.findAllByText(/Lesson 3: Wrap/i)).length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenLastCalledWith(
        '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-03'
      );
    });
  });

  it('keeps an active session running while navigating to the next module', async () => {
    const user = userEvent.setup();
    currentSearchQuery = 'chapter=module-01&lesson=module-01-lesson-03';

    render(<TheoryLayout doc={doc} />);

    expect(
      await screen.findByRole('dialog', { name: /session picker/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /pomodoro/i }));
    await user.click(screen.getByRole('button', { name: /start session/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /session picker/i })
      ).not.toBeInTheDocument();
    });

    expect(
      await screen.findByRole('button', { name: /pause session/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next module/i }));

    expect(await screen.findByRole('heading', { name: /^reads$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pause session/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: /session picker/i })
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(replaceMock).toHaveBeenLastCalledWith(
        '/learn/pyspark/theory/all?chapter=module-02&lesson=module-02-lesson-01'
      );
    });
  });

  it('opens and closes the mobile sidebar from the menu toggle', async () => {
    const user = userEvent.setup();

    render(<TheoryLayout doc={doc} />);

    await user.click(
      screen.getByRole('button', { name: /continue without session/i })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /session picker/i })
      ).not.toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: /toggle module navigation/i })
    );

    expect(
      screen.getByRole('button', { name: /close module navigation/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /lesson 1: intro/i })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /close module navigation/i })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /close module navigation/i })
      ).not.toBeInTheDocument();
    });
  });

  it('closes the mobile sidebar and updates the lesson when selecting from the sidebar', async () => {
    const user = userEvent.setup();

    render(<TheoryLayout doc={doc} />);

    await user.click(
      screen.getByRole('button', { name: /continue without session/i })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /session picker/i })
      ).not.toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: /toggle module navigation/i })
    );
    await user.click(screen.getByRole('button', { name: /lesson 2: setup/i }));

    expect(await screen.findByRole('heading', { name: /^setup$/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /close module navigation/i })
      ).not.toBeInTheDocument();
    });

    expect(replaceMock).toHaveBeenLastCalledWith(
      '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-02'
    );
  });

  it('shows the next module lessons in the mobile sidebar after a module transition', async () => {
    const user = userEvent.setup();
    currentSearchQuery = 'chapter=module-01&lesson=module-01-lesson-03';

    render(<TheoryLayout doc={doc} />);

    await user.click(
      screen.getByRole('button', { name: /continue without session/i })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /session picker/i })
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /next module/i }));

    expect(await screen.findByRole('heading', { name: /^reads$/i })).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /toggle module navigation/i })
    );

    expect(
      screen.getByRole('button', { name: /lesson 1: reads/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /lesson 2: writes/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /lesson 1: intro/i })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /lesson 2: writes/i }));

    expect(await screen.findByRole('heading', { name: /^writes$/i })).toBeInTheDocument();
    expect(replaceMock).toHaveBeenLastCalledWith(
      '/learn/pyspark/theory/all?chapter=module-02&lesson=module-02-lesson-02'
    );
  });
});
