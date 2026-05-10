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
  const timerLabel = session.method.isTimed
    ? formatTheorySessionClock(session.remainingSeconds ?? 0)
    : formatTheorySessionClock(session.elapsedSeconds);

  return (
    <div className="flex items-center gap-3">
      {/* Method label — sharp-cornered hairline-bordered slot in the
          editorial accent, replaces the previous rounded-pill with a
          per-method salmon/lavender/vermillion fill. */}
      <div
        className="flex items-center gap-2 px-2.5 py-1"
        style={{
          border: '1px solid var(--rm-accent)',
          color: 'var(--rm-accent)',
        }}
      >
        <Icon className="h-3 w-3" strokeWidth={1.75} />
        <span className="font-data-mono text-[10px] font-bold uppercase tracking-[0.18em]">
          {session.method.label}
        </span>
      </div>

      {/* Timer */}
      <span
        className="font-data-mono text-[13px] font-semibold tabular-nums"
        style={{ color: 'var(--rm-text)' }}
      >
        {timerLabel}
      </span>

      {/* Controls — sharp 28x28 squares; hover brightens to the rm text
          color, matching the editorial back / focus buttons in the
          surrounding theory topbar. */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={isPaused ? 'Resume session' : 'Pause session'}
          onClick={isPaused ? session.resume : session.pause}
          className="flex h-7 w-7 items-center justify-center transition-colors"
          style={{ color: 'var(--rm-text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--rm-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--rm-text-secondary)';
          }}
        >
          {isPaused ? (
            <Play className="h-3.5 w-3.5" strokeWidth={1.75} />
          ) : (
            <Pause className="h-3.5 w-3.5" strokeWidth={1.75} />
          )}
        </button>
        <button
          type="button"
          aria-label="Stop session"
          onClick={session.stop}
          className="flex h-7 w-7 items-center justify-center transition-colors"
          style={{ color: 'var(--rm-text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--rm-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--rm-text-secondary)';
          }}
        >
          <Square className="h-3 w-3" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
};
