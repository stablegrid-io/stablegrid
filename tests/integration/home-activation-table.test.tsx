import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeActivationTable } from '@/components/home/activation-table/HomeActivationTable';
import type { HomeActivationTableProps } from '@/components/home/activation-table/HomeActivationTable';
import {
  ACTIVATION_PHASE_DURATIONS_MS,
  HOME_ACTIVATION_MODE_KEY,
  HOME_ACTIVATION_SEEN_KEY
} from '@/components/home/activation-table/state/activationTimings';

const fullSequenceTotalMs = Object.values(ACTIVATION_PHASE_DURATIONS_MS.full).reduce(
  (sum, value) => sum + value,
  0
);
const shortSequenceTotalMs = Object.values(ACTIVATION_PHASE_DURATIONS_MS.short).reduce(
  (sum, value) => sum + value,
  0
);

const advanceThroughSequence = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
  for (let step = 0; step < 8; step += 1) {
    await act(async () => {
      vi.runOnlyPendingTimers();
    });
  }
};

const createMatchMedia = (prefersReducedMotion: boolean) =>
  vi.fn().mockImplementation((query: string) => ({
    matches: prefersReducedMotion && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  }));

const buildProps = (): HomeActivationTableProps => ({
  featureEnabled: true,
  data: {
    greeting: {
      title: 'Welcome back, Nedas',
      subtitle: 'PySpark · Chapter 7 · 62% complete · Active today'
    },
    categories: [
      {
        kind: 'theory',
        label: 'Theory',
        title: 'PySpark',
        summary: 'Resume the active chapter and keep continuity.',
        statLine: '4 sections still open in this chapter.',
        accentRgb: '245,158,11',
        progress: {
          valuePct: 67,
          label: 'Chapter progress',
          valueLabel: '8/12 sections'
        },
        primaryAction: { label: 'Resume chapter', href: '/learn/pyspark/theory' }
      },
      {
        kind: 'tasks',
        label: 'Tasks',
        title: 'Task Deck',
        summary: 'Notebooks, missions, and flashcards are ready for your next execution block.',
        statLine: '3 recap entries available',
        primaryAction: { label: 'Open tasks', href: '/tasks' }
      },
      {
        kind: 'grid',
        label: 'Grid',
        title: 'Substation Relay',
        summary: 'Unlock threshold reached. Deploy this node to stabilize your grid.',
        statLine: '35.64 kWh currently available',
        progress: {
          valuePct: 84,
          label: 'Unlock progress'
        },
        primaryAction: { label: 'Deploy node', href: '/energy' }
      }
    ]
  }
});

describe('HomeActivationTable', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMatchMedia(false)
    });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 16)
    );
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => {
      window.clearTimeout(handle);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('runs full first-visit sequence and lands in ready', async () => {
    render(<HomeActivationTable {...buildProps()} />);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId('home-activation-table')).toHaveAttribute('data-mode', 'full');
    expect(screen.getByTestId('home-activation-table')).toHaveAttribute('data-phase', 'loading');
    expect(screen.getByTestId('learning-station-loader')).toBeInTheDocument();
    expect(screen.getByTestId('learning-station-progress-fill')).toBeInTheDocument();

    await advanceThroughSequence(fullSequenceTotalMs + 260);

    expect(screen.getByTestId('home-activation-table')).toHaveAttribute('data-phase', 'ready');
    expect(window.sessionStorage.getItem(HOME_ACTIVATION_SEEN_KEY)).toBe('1');
    expect(window.sessionStorage.getItem(HOME_ACTIVATION_MODE_KEY)).toBe('short');
  });

  it('uses short sequence on repeat visit in session', async () => {
    window.sessionStorage.setItem(HOME_ACTIVATION_SEEN_KEY, '1');
    window.sessionStorage.setItem(HOME_ACTIVATION_MODE_KEY, 'short');
    render(<HomeActivationTable {...buildProps()} />);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId('home-activation-table')).toHaveAttribute('data-mode', 'short');

    await advanceThroughSequence(shortSequenceTotalMs + 220);

    expect(screen.getByTestId('home-activation-table')).toHaveAttribute('data-phase', 'ready');
  });

  it('bypasses heavy motion when reduced-motion is enabled', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMatchMedia(true)
    });

    render(<HomeActivationTable {...buildProps()} />);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByTestId('home-activation-table')).toHaveAttribute('data-mode', 'skip');
    expect(screen.getByTestId('home-activation-table')).toHaveAttribute('data-phase', 'ready');
  });

  it('renders semantic table layout cards after reveal', async () => {
    render(<HomeActivationTable {...buildProps()} />);
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    await advanceThroughSequence(fullSequenceTotalMs + 260);

    expect(screen.getByTestId('activation-greeting')).toBeInTheDocument();
    const theoryCard = screen.getByTestId('activation-category-theory');
    const tasksCard = screen.getByTestId('activation-category-tasks');
    const gridCard = screen.getByTestId('activation-category-grid');
    expect(theoryCard).toBeInTheDocument();
    expect(tasksCard).toBeInTheDocument();
    expect(gridCard).toBeInTheDocument();

    expect(within(theoryCard).getAllByRole('link')).toHaveLength(1);
    expect(within(tasksCard).getAllByRole('link')).toHaveLength(1);
    expect(within(gridCard).getAllByRole('link')).toHaveLength(1);
    expect(within(theoryCard).getByTestId('activation-progress-theory')).toHaveAttribute(
      'aria-valuenow',
      '67'
    );
    expect(within(gridCard).getByTestId('activation-progress-grid')).toHaveAttribute(
      'aria-valuenow',
      '84'
    );
    expect(within(tasksCard).queryByTestId('activation-progress-tasks')).not.toBeInTheDocument();
  });

  it('focuses primary CTA and keeps decorative layer non-blocking', async () => {
    render(<HomeActivationTable {...buildProps()} />);
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    await advanceThroughSequence(fullSequenceTotalMs + 260);

    const primaryCta = screen.getByTestId('activation-primary-cta');
    expect(primaryCta).toBeInTheDocument();
    expect(primaryCta).toHaveFocus();

    expect(screen.queryByTestId('learning-station-loader')).not.toBeInTheDocument();
  });
});
