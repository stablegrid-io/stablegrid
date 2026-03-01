'use client';

import {
  BookOpen,
  Brain,
  Clock3,
  Pause,
  Play,
  Square,
  Zap
} from 'lucide-react';
import {
  formatTheorySessionClock,
  type TheorySessionMethodId
} from '@/lib/learn/theorySession';
import { useTheorySessionTimer } from '@/lib/hooks/useTheorySessionTimer';

interface TheorySessionTopbarProps {
  session: ReturnType<typeof useTheorySessionTimer>;
}

const methodIconMap = {
  pomodoro: Clock3,
  'deep-focus': Brain,
  sprint: Zap,
  'free-read': BookOpen
} satisfies Record<TheorySessionMethodId, typeof Clock3>;

export const TheorySessionTopbar = ({ session }: TheorySessionTopbarProps) => {
  if (!session.method || !session.config) {
    return null;
  }

  const Icon = methodIconMap[session.method.id];
  const isPaused = session.phase === 'paused';
  const phaseLabel = isPaused
    ? session.pausedPhase === 'break'
      ? 'Break paused'
      : 'Focus paused'
    : session.isOnBreak
      ? 'Break'
      : session.method.isTimed
        ? 'Focus'
        : 'Free read';
  const timerLabel = session.method.isTimed
    ? formatTheorySessionClock(session.remainingSeconds ?? 0)
    : formatTheorySessionClock(session.elapsedSeconds);

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-light-border bg-light-surface text-text-light-primary dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-primary">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
              {session.method.label}
            </span>
            <span className="text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
              {phaseLabel}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1.5">
            {session.method.isTimed ? (
              Array.from({ length: session.roundCount }, (_, index) => {
                const roundNumber = index + 1;
                const isCompleted = roundNumber <= session.completedRounds;
                const isActive = roundNumber === session.activeRound && session.phase !== 'complete';

                return (
                  <span
                    key={`round-${roundNumber}`}
                    className={`h-2 rounded-full transition-all ${
                      isActive
                        ? 'w-7 bg-text-light-primary dark:bg-text-dark-primary'
                        : isCompleted
                          ? 'w-2 bg-text-light-primary dark:bg-text-dark-primary'
                          : 'w-2 bg-light-border dark:bg-dark-border'
                    }`}
                  />
                );
              })
            ) : (
              <span className="h-2 w-8 rounded-full border border-dashed border-light-border dark:border-dark-border" />
            )}
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="rounded-full border border-light-border bg-light-surface px-3 py-1 text-right dark:border-dark-border dark:bg-dark-surface">
          <div className="text-[10px] uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
            {session.method.isTimed ? phaseLabel : 'Elapsed'}
          </div>
          <div className="font-mono text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            {timerLabel}
          </div>
        </div>

        <button
          type="button"
          aria-label={isPaused ? 'Resume session' : 'Pause session'}
          onClick={isPaused ? session.resume : session.pause}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-light-border text-text-light-secondary transition-colors hover:border-text-light-primary hover:text-text-light-primary dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-text-dark-primary dark:hover:text-text-dark-primary"
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>

        <button
          type="button"
          aria-label="Stop session"
          onClick={session.stop}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-light-border text-text-light-secondary transition-colors hover:border-text-light-primary hover:text-text-light-primary dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-text-dark-primary dark:hover:text-text-dark-primary"
        >
          <Square className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );
};
