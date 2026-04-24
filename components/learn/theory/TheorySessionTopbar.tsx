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
    <div className="flex items-center gap-3">
      {/* Method pill */}
      <div className="flex items-center gap-2 rounded-full px-3 py-1" style={{ backgroundColor: `rgba(${accent.rgb},0.08)` }}>
        <Icon className="h-3 w-3" style={{ color: accent.color }} />
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: accent.color }}>
          {session.method.label}
        </span>
      </div>

      {/* Timer */}
      <span className="font-mono text-sm font-bold tabular-nums text-on-surface">
        {timerLabel}
      </span>

      {/* Controls */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          aria-label={isPaused ? 'Resume session' : 'Pause session'}
          onClick={isPaused ? session.resume : session.pause}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          aria-label="Stop session"
          onClick={session.stop}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-error"
        >
          <Square className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
