import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TheorySessionPicker } from '@/components/learn/theory/TheorySessionPicker';
import { useTheorySessionTimer } from '@/lib/hooks/useTheorySessionTimer';
import { formatTheorySessionDuration } from '@/lib/learn/theorySession';

const SessionHarness = () => {
  const session = useTheorySessionTimer();

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          session.start({
            methodId: 'pomodoro',
            focusMinutes: 15,
            breakMinutes: 3,
            rounds: 2
          })
        }
      >
        Start short session
      </button>
      <button type="button" onClick={session.skipBreak}>
        Skip break
      </button>
      <div>Phase: {session.phase}</div>
      <div>Completed rounds: {session.completedRounds}</div>
      <div>Remaining: {session.remainingSeconds ?? -1}</div>
      <div>Focus elapsed: {session.focusElapsedSeconds}</div>
      <div>Break elapsed: {session.breakElapsedSeconds}</div>
      <div>Total elapsed: {session.elapsedSeconds}</div>
      <div>Tip: {session.breakTip ?? 'none'}</div>
      {session.summary ? (
        <>
          <div>Summary total: {session.summary.totalElapsedSeconds}</div>
          <div>Summary focus: {session.summary.focusElapsedSeconds}</div>
          <div>Summary break: {session.summary.breakElapsedSeconds}</div>
        </>
      ) : null}
    </div>
  );
};

describe('Theory session experience', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lets the user choose an approach and starts it with saved settings', async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    const configsByMethod = {
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

    render(
      <TheorySessionPicker
        isOpen
        configsByMethod={configsByMethod}
        lessonTitle="SparkSession and Cluster Roles"
        lessonDurationMinutes={30}
        onStart={onStart}
        onOpenSettings={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: /session tracker/i })).toBeInTheDocument();
    expect(screen.getByText(/pomodoro/i)).toBeInTheDocument();
    expect(screen.getByText(`${formatTheorySessionDuration(115 * 60)} total`)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /deep focus/i }));

    expect(screen.getByText(/long chapters and deep systems content/i)).toBeInTheDocument();
    expect(screen.getByText(`${formatTheorySessionDuration(130 * 60)} total`)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /start session/i }));

    expect(onStart).toHaveBeenCalledWith(configsByMethod['deep-focus']);
  });

  it('focuses the first approach and dismisses with Escape', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <TheorySessionPicker
        isOpen
        configsByMethod={{
          pomodoro: {
            methodId: 'pomodoro',
            focusMinutes: 25,
            breakMinutes: 5,
            rounds: 4
          },
          'deep-focus': {
            methodId: 'deep-focus',
            focusMinutes: 50,
            breakMinutes: 10,
            rounds: 2
          },
          sprint: {
            methodId: 'sprint',
            focusMinutes: 15,
            breakMinutes: 0,
            rounds: 1
          },
          'free-read': {
            methodId: 'free-read',
            focusMinutes: 0,
            breakMinutes: 0,
            rounds: 1
          }
        }}
        lessonTitle="SparkSession and Cluster Roles"
        lessonDurationMinutes={30}
        onStart={vi.fn()}
        onOpenSettings={vi.fn()}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByRole('button', { name: /pomodoro/i })).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('moves through focus, break, and completion phases', async () => {
    vi.useFakeTimers();

    render(<SessionHarness />);

    fireEvent.click(screen.getByRole('button', { name: /start short session/i }));

    expect(screen.getByText('Phase: focus')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(15 * 60_000);
    });

    expect(screen.getByText('Phase: break')).toBeInTheDocument();
    expect(screen.getByText('Completed rounds: 1')).toBeInTheDocument();
    expect(screen.queryByText('Tip: none')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3 * 60_000);
    });

    expect(screen.getByText('Phase: focus')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(15 * 60_000);
    });

    expect(screen.getByText('Phase: complete')).toBeInTheDocument();
    expect(screen.getByText('Summary total: 1980')).toBeInTheDocument();
    expect(screen.getByText('Summary focus: 1800')).toBeInTheDocument();
    expect(screen.getByText('Summary break: 180')).toBeInTheDocument();
  });
});
