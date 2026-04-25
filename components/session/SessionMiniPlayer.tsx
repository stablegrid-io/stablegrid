'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Brain, ChevronLeft, Clock3, Zap } from 'lucide-react';
import { isTheoryLessonPath, shouldHideNav } from '@/components/navigation/navigation-config';
import {
  formatTheorySessionClock,
  getTheorySessionMethod,
  type TheorySessionMethodId,
  type TheorySessionRuntime
} from '@/lib/learn/theorySession';

const STORAGE_KEY = 'theory-session-runtime:v1:global';
const READING_ROUTE_KEY = 'theory-session-reading-route:v1';

const METHOD_ICONS: Record<TheorySessionMethodId, typeof Zap> = {
  sprint: Zap,
  pomodoro: Clock3,
  'deep-focus': Brain,
  'free-read': BookOpen
};

const METHOD_ACCENTS: Record<TheorySessionMethodId, { color: string; rgb: string }> = {
  sprint: { color: '#99f7ff', rgb: '153,247,255' },
  pomodoro: { color: '#ff716c', rgb: '255,113,108' },
  'deep-focus': { color: '#bf81ff', rgb: '191,129,255' },
  'free-read': { color: '#ffc965', rgb: '255,201,101' }
};

interface SnapshotPayload {
  version: 1;
  runtime: TheorySessionRuntime;
  tipCursor: number;
  savedAt: number;
}

function readSessionFromStorage(): TheorySessionRuntime | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SnapshotPayload;
    if (parsed.version !== 1 || !parsed.runtime) return null;

    return parsed.runtime;
  } catch {
    return null;
  }
}

function readReadingRoute(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.sessionStorage.getItem(READING_ROUTE_KEY) || null;
  } catch {
    return null;
  }
}

export const SessionMiniPlayer = () => {
  const pathname = usePathname();
  const [runtime, setRuntime] = useState<TheorySessionRuntime | null>(null);
  const [readingRoute, setReadingRoute] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // Poll sessionStorage every second
  useEffect(() => {
    const poll = () => {
      setRuntime(readSessionFromStorage());
      setReadingRoute(readReadingRoute());
    };

    poll();
    const interval = window.setInterval(poll, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Determine visibility
  const isActive =
    runtime?.phase === 'focus' ||
    runtime?.phase === 'break' ||
    runtime?.phase === 'paused';
  const isOnLessonPage = isTheoryLessonPath(pathname);
  const isNavHidden = shouldHideNav(pathname);
  const shouldShow = isActive && !isOnLessonPage && !isNavHidden;

  // Animate enter/exit
  useEffect(() => {
    if (shouldShow) {
      // Small delay to trigger enter animation
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
  }, [shouldShow]);

  if (!shouldShow || !runtime?.config) return null;

  const method = getTheorySessionMethod(runtime.config.methodId);
  if (!method) return null;

  const Icon = METHOD_ICONS[method.id];
  const accent = METHOD_ACCENTS[method.id];

  const isPaused = runtime.phase === 'paused';
  const isOnBreak =
    runtime.phase === 'break' ||
    (runtime.phase === 'paused' && runtime.pausedPhase === 'break');

  const timerValue = method.isTimed
    ? formatTheorySessionClock(runtime.remainingSeconds ?? 0)
    : formatTheorySessionClock(runtime.elapsedSeconds);

  const statusLabel = isPaused
    ? 'PAUSED'
    : isOnBreak
      ? 'BREAK'
      : 'FOCUS';

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-[280px] overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0d0f11]/90 shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-3 opacity-0'
      }`}
    >
      {/* Top row: method + timer */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-1.5">
        {/* Method pill */}
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
          style={{ backgroundColor: `rgba(${accent.rgb},0.10)` }}
        >
          <Icon className="h-3 w-3" style={{ color: accent.color }} />
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-wider"
            style={{ color: accent.color }}
          >
            {method.label}
          </span>
        </div>

        {/* Status tag */}
        {isPaused && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
            {statusLabel}
          </span>
        )}

        {/* Timer */}
        <span className="ml-auto font-mono text-sm font-bold tabular-nums text-white/90">
          {timerValue}
        </span>
      </div>

      {/* Bottom row: resume reading link */}
      {readingRoute && (
        <Link
          href={readingRoute}
          className="flex items-center gap-1.5 px-4 pb-3 pt-1 text-xs text-white/50 transition-colors hover:text-white/80"
        >
          <ChevronLeft className="h-3 w-3" />
          <span>Resume reading</span>
        </Link>
      )}

      {/* Accent glow line at bottom */}
      <div
        className="h-[2px] w-full"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(${accent.rgb},0.4) 50%, transparent 100%)`
        }}
      />
    </div>
  );
};
