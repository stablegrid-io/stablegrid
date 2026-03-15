import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeEntryExperience } from '@/components/home/entry/HomeEntryExperience';
import { ENTRY_PHASE_DURATIONS_MS, ENTRY_SESSION_KEY } from '@/components/home/entry/motionTokens';
import type { HomeEntryExperienceProps } from '@/components/home/entry/HomeEntryExperience';

const fullSequenceTotalMs = Object.values(ENTRY_PHASE_DURATIONS_MS.full).reduce(
  (sum, value) => sum + value,
  0
);
const shortSequenceTotalMs = Object.values(ENTRY_PHASE_DURATIONS_MS.short).reduce(
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

const buildProps = (): HomeEntryExperienceProps => ({
  featureEnabled: true,
  map: {
    metrics: [
      {
        id: 'progress',
        label: 'Progress',
        value: '18%',
        status: 'improving',
        detail: 'Fabric chapter is live',
        actionLabel: 'Resume',
        actionHref: '/learn/fabric/theory'
      }
    ],
    links: [
      { from: 'start', to: 'current' },
      { from: 'current', to: 'next' }
    ],
    recommendedNodeId: 'next',
    nodes: [
      {
        id: 'start',
        label: 'Control Center',
        shortLabel: 'Control Center',
        description: 'Start point',
        detail: 'Completed',
        state: 'completed',
        kind: 'mission',
        position: { x: 16, y: 58 },
        mobileOrder: 1,
        actions: [{ label: 'Open route', href: '/theory' }]
      },
      {
        id: 'current',
        label: 'PySpark cluster',
        shortLabel: 'PySpark',
        description: 'Current route',
        detail: 'In progress',
        state: 'in_progress',
        kind: 'topic',
        position: { x: 40, y: 36 },
        mobileOrder: 2,
        actions: [{ label: 'Continue theory', href: '/learn/pyspark/theory' }]
      },
      {
        id: 'next',
        label: 'Chapter 7',
        shortLabel: 'Ch.7',
        description: 'Recommended next lesson',
        detail: 'Recommended',
        state: 'recommended',
        kind: 'chapter',
        position: { x: 72, y: 52 },
        mobileOrder: 3,
        actions: [{ label: 'Resume chapter', href: '/learn/fabric/theory' }]
      }
    ]
  }
});

describe('HomeEntryExperience', () => {
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

  it('runs full sequence on first visit and ends ready', async () => {
    render(<HomeEntryExperience {...buildProps()} />);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId('home-entry-experience')).toHaveAttribute('data-mode', 'full');

    await advanceThroughSequence(fullSequenceTotalMs + 320);

    expect(screen.getByTestId('home-entry-experience')).toHaveAttribute('data-phase', 'ready');
    expect(window.sessionStorage.getItem(ENTRY_SESSION_KEY)).toBe('full-seen');
  });

  it('uses short sequence on repeat visit in session', async () => {
    window.sessionStorage.setItem(ENTRY_SESSION_KEY, 'full-seen');
    render(<HomeEntryExperience {...buildProps()} />);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId('home-entry-experience')).toHaveAttribute('data-mode', 'short');

    await advanceThroughSequence(shortSequenceTotalMs + 220);

    expect(screen.getByTestId('home-entry-experience')).toHaveAttribute('data-phase', 'ready');
  });

  it('bypasses heavy animation in reduced-motion mode', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMatchMedia(true)
    });

    render(<HomeEntryExperience {...buildProps()} />);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId('home-entry-experience')).toHaveAttribute('data-mode', 'skip');
    expect(screen.getByTestId('home-entry-experience')).toHaveAttribute('data-phase', 'ready');
  });

  it('focuses recommended route node when reveal is ready and disables entry layer interaction', async () => {
    render(<HomeEntryExperience {...buildProps()} />);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    await advanceThroughSequence(fullSequenceTotalMs + 420);
    expect(screen.getByTestId('home-entry-experience')).toHaveAttribute('data-phase', 'ready');

    const recommendedNodes = screen.getAllByTestId('learning-grid-node-next');
    expect(recommendedNodes.length).toBeGreaterThan(0);
    expect(
      recommendedNodes.some((node) => node === document.activeElement)
    ).toBe(true);
    const entryScene = screen.queryByTestId('entry-scene');
    if (entryScene) {
      expect(entryScene).toHaveClass('pointer-events-none');
      expect(entryScene).toHaveAttribute('aria-hidden');
    }

    const workspaceReveal = screen.getByTestId('workspace-reveal');
    expect(workspaceReveal).toHaveAttribute('data-ready', 'true');
    expect(workspaceReveal).toHaveClass('pointer-events-auto');
  });
});
