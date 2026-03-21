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

const methodAccentMap: Record<TheorySessionMethodId, { color: string; rgb: string }> = {
  sprint: { color: '#99f7ff', rgb: '153,247,255' },
  pomodoro: { color: '#ff716c', rgb: '255,113,108' },
  'deep-focus': { color: '#bf81ff', rgb: '191,129,255' },
  'free-read': { color: '#ffc965', rgb: '255,201,101' },
};

export const TheorySessionTopbar = ({ session }: TheorySessionTopbarProps) => {
  if (!session.method || !session.config) {
    return null;
  }

  const Icon = methodIconMap[session.method.id];
  const accent = methodAccentMap[session.method.id];
  const isPaused = session.phase === 'paused';
  const phaseLabel = isPaused
    ? session.pausedPhase === 'break'
      ? 'BREAK_PAUSED'
      : 'FOCUS_PAUSED'
    : session.isOnBreak
      ? 'BREAK'
      : session.method.isTimed
        ? 'FOCUS'
        : 'FREE_READ';
  const timerLabel = session.method.isTimed
    ? formatTheorySessionClock(session.remainingSeconds ?? 0)
    : formatTheorySessionClock(session.elapsedSeconds);

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {/* Method icon */}
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center border"
          style={{ borderColor: `rgba(${accent.rgb},0.3)`, backgroundColor: `rgba(${accent.rgb},0.1)` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: accent.color }} />
        </div>

        {/* Method label */}
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface">
          {session.method.label}
        </span>

      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Timer display */}
        <div
          className="border px-3 py-1 text-right"
          style={{ borderColor: `rgba(${accent.rgb},0.2)`, backgroundColor: `rgba(${accent.rgb},0.05)` }}
        >
          <div
            className="font-mono text-[8px] uppercase tracking-[0.2em]"
            style={{ color: `rgba(${accent.rgb},0.5)` }}
          >
            {session.method.isTimed ? phaseLabel : 'ELAPSED'}
          </div>
          <div className="font-mono text-sm font-bold text-on-surface">
            {timerLabel}
          </div>
        </div>

        {/* Pause/Resume */}
        <button
          type="button"
          aria-label={isPaused ? 'Resume session' : 'Pause session'}
          onClick={isPaused ? session.resume : session.pause}
          className="flex h-8 w-8 items-center justify-center border border-outline-variant/30 text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>

        {/* Stop */}
        <button
          type="button"
          aria-label="Stop session"
          onClick={session.stop}
          className="flex h-8 w-8 items-center justify-center border border-outline-variant/30 text-on-surface-variant transition-colors hover:border-error/40 hover:text-error"
        >
          <Square className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );
};
