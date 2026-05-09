'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowRight, X } from 'lucide-react';
import {
  isTheoryLessonPath,
  isPracticeSessionPath,
  shouldHideNav
} from '@/components/navigation/navigation-config';

// ── Theory session reader ────────────────────────────────────────────────────

const THEORY_STORAGE_KEY = 'theory-session-runtime:v1:global';
const THEORY_ROUTE_KEY = 'theory-session-reading-route:v1';

interface TheorySnapshot {
  runtime: {
    phase: string;
    config?: { methodId?: string };
    elapsedSeconds?: number;
    remainingSeconds?: number | null;
  };
}

const METHOD_LABELS: Record<string, string> = {
  sprint: 'Sprint',
  pomodoro: 'Pomodoro',
  'deep-focus': 'Deep Focus',
  'free-read': 'Free Read'
};

interface TheoryCard {
  active: true;
  label: string;
  time: string;
  route: string;
  paused: boolean;
}

function readTheorySession(): TheoryCard | null {
  try {
    const raw = window.sessionStorage.getItem(THEORY_STORAGE_KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw) as TheorySnapshot;
    const phase = snap.runtime?.phase;
    if (phase !== 'focus' && phase !== 'break' && phase !== 'paused') return null;

    const methodId = snap.runtime?.config?.methodId ?? 'free-read';
    const label = METHOD_LABELS[methodId] ?? METHOD_LABELS['free-read'];
    const route = window.sessionStorage.getItem(THEORY_ROUTE_KEY) ?? '/theory';

    const seconds = snap.runtime?.remainingSeconds ?? snap.runtime?.elapsedSeconds ?? 0;
    const m = Math.floor(Math.abs(seconds) / 60);
    const s = Math.abs(seconds) % 60;
    const time = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    return { active: true, label, time, route, paused: phase === 'paused' };
  } catch {
    return null;
  }
}

// ── Practice session reader ──────────────────────────────────────────────────

const PRACTICE_SESSION_KEY = 'practice-session:v1';

interface PracticeSnapshot {
  moduleId: string;
  route: string;
  state: {
    phase: string;
    currentTaskIndex: number;
    taskStates: Array<{ checked: boolean; allCorrect: boolean }>;
  };
}

interface PracticeCard {
  active: true;
  modulePrefix: string;
  taskIndex: number;
  totalTasks: number;
  checked: number;
  route: string;
}

function readPracticeSession(): PracticeCard | null {
  try {
    const raw = window.sessionStorage.getItem(PRACTICE_SESSION_KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw) as PracticeSnapshot;
    if (snap.state.phase !== 'session') return null;
    return {
      active: true,
      modulePrefix: snap.moduleId.replace('module-', ''),
      taskIndex: snap.state.currentTaskIndex,
      totalTasks: snap.state.taskStates.length,
      checked: snap.state.taskStates.filter((t) => t.checked).length,
      route: snap.route
    };
  } catch {
    return null;
  }
}

// ── Card primitives ──────────────────────────────────────────────────────────

const CardShell = ({
  onDismiss,
  children
}: {
  onDismiss: () => void;
  children: React.ReactNode;
}) => (
  <article className="relative bg-surface border border-on-surface min-w-[260px] max-w-[320px] px-4 py-4">
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Dismiss"
      className="absolute top-3 right-3 h-5 w-5 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
    >
      <X className="h-3.5 w-3.5" strokeWidth={1.75} />
    </button>
    {children}
  </article>
);

const ResumeLink = ({ href, label }: { href: string; label: string }) => (
  <Link
    href={href}
    className="flex items-center justify-between border border-on-surface px-3 py-2 hover:bg-surface-container-low transition-colors"
  >
    <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface">
      {label}
    </span>
    <ArrowRight className="h-3.5 w-3.5 text-on-surface" strokeWidth={1.75} />
  </Link>
);

// ── Unified Mini Player ──────────────────────────────────────────────────────

export function UnifiedMiniPlayer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams ? `?${searchParams.toString()}` : '';
  const [theory, setTheory] = useState<TheoryCard | null>(null);
  const [practice, setPractice] = useState<PracticeCard | null>(null);
  const [theoryDismissed, setTheoryDismissed] = useState(false);
  const [practiceDismissed, setPracticeDismissed] = useState(false);

  useEffect(() => {
    const poll = () => {
      setTheory(readTheorySession());
      setPractice(readPracticeSession());
    };
    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, []);

  const isOnTheoryPage = isTheoryLessonPath(pathname);
  const isOnPracticePage = isPracticeSessionPath(pathname, search);
  if (shouldHideNav(pathname)) return null;

  const isInAnySession = isOnTheoryPage || isOnPracticePage;
  const showTheory = theory?.active && !isInAnySession && !theoryDismissed;
  const showPractice = practice?.active && !isInAnySession && !practiceDismissed;

  if (!showTheory && !showPractice) return null;

  return (
    <div
      className="fixed right-3 lg:right-6 z-40 flex flex-col gap-3 max-w-[calc(100vw-1.5rem)] bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-6"
      style={{ animation: 'fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
    >
      {showTheory && theory && (
        <CardShell onDismiss={() => setTheoryDismissed(true)}>
          <header className="flex items-baseline justify-between gap-3 pr-6 mb-3">
            <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
              {theory.label}
              {theory.paused ? ' · Paused' : ''}
            </span>
            <span className="font-data-mono tabular-nums text-[12px] text-on-surface">
              {theory.time}
            </span>
          </header>
          <ResumeLink href={theory.route} label="Resume reading" />
        </CardShell>
      )}

      {showPractice && practice && (() => {
        const isCapstone = practice.modulePrefix.startsWith('capstone-');
        const sessionLabel = isCapstone ? 'Project' : 'Practice';
        const resumeLabel = isCapstone ? 'Resume project' : 'Resume practice';
        return (
          <CardShell onDismiss={() => setPracticeDismissed(true)}>
            <header className="pr-6 mb-3">
              <p className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface mb-1">
                {sessionLabel} · {practice.modulePrefix}
              </p>
              <p className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant tabular-nums">
                Task {practice.taskIndex + 1}/{practice.totalTasks}
                {practice.checked > 0 ? ` · ${practice.checked} checked` : ''}
              </p>
            </header>
            <ResumeLink href={practice.route} label={resumeLabel} />
          </CardShell>
        );
      })()}
    </div>
  );
}
