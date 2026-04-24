'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowRight, BookOpen, Clock3, Brain, Zap, FlaskConical, X } from 'lucide-react';
import { isTheoryLessonPath, isPracticeSessionPath, shouldHideNav } from '@/components/navigation/navigation-config';

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

const METHOD_CONFIG: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  sprint: { label: 'Sprint', icon: Zap, color: '153,247,255' },
  pomodoro: { label: 'Pomodoro', icon: Clock3, color: '255,113,108' },
  'deep-focus': { label: 'Deep Focus', icon: Brain, color: '191,129,255' },
  'free-read': { label: 'Free Read', icon: BookOpen, color: '255,201,101' },
};

function readTheorySession(): { active: boolean; method: string; label: string; icon: typeof Zap; color: string; time: string; route: string; paused: boolean } | null {
  try {
    const raw = window.sessionStorage.getItem(THEORY_STORAGE_KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw) as TheorySnapshot;
    const phase = snap.runtime?.phase;
    if (phase !== 'focus' && phase !== 'break' && phase !== 'paused') return null;

    const methodId = snap.runtime?.config?.methodId ?? 'free-read';
    const mc = METHOD_CONFIG[methodId] ?? METHOD_CONFIG['free-read'];
    const route = window.sessionStorage.getItem(THEORY_ROUTE_KEY) ?? '/theory';

    const seconds = snap.runtime?.remainingSeconds ?? snap.runtime?.elapsedSeconds ?? 0;
    const m = Math.floor(Math.abs(seconds) / 60);
    const s = Math.abs(seconds) % 60;
    const time = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    return { active: true, method: methodId, label: mc.label, icon: mc.icon, color: mc.color, time, route, paused: phase === 'paused' };
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

function readPracticeSession(): { active: boolean; modulePrefix: string; taskIndex: number; totalTasks: number; checked: number; route: string } | null {
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
      route: snap.route,
    };
  } catch {
    return null;
  }
}

// ── Unified Mini Player ──────────────────────────────────────────────────────

export function UnifiedMiniPlayer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams ? `?${searchParams.toString()}` : '';
  const [theory, setTheory] = useState<ReturnType<typeof readTheorySession>>(null);
  const [practice, setPractice] = useState<ReturnType<typeof readPracticeSession>>(null);
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

  // Hide on pages where the full UI is showing
  const isOnTheoryPage = isTheoryLessonPath(pathname);
  const isOnPracticePage = isPracticeSessionPath(pathname, search);
  if (shouldHideNav(pathname)) return null;

  // Hide ALL mini-players when user is in any active session page (theory or practice)
  const isInAnySession = isOnTheoryPage || isOnPracticePage;
  const showTheory = theory?.active && !isInAnySession && !theoryDismissed;
  const showPractice = practice?.active && !isInAnySession && !practiceDismissed;

  if (!showTheory && !showPractice) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
      style={{ animation: 'fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
    >
      {/* Theory session card */}
      {showTheory && theory && (
        <div
          className="relative rounded-[22px] border px-4 py-3 min-w-[220px]"
          style={{
            background: 'rgba(24,28,32,0.95)',
            backdropFilter: 'blur(24px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
            borderColor: `rgba(${theory.color},0.15)`,
            boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 20px rgba(${theory.color},0.04)`,
          }}
        >
          <button
            type="button"
            onClick={() => setTheoryDismissed(true)}
            className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-md text-white/15 transition-colors hover:bg-white/[0.06] hover:text-white/40"
          >
            <X className="h-3 w-3" />
          </button>
          <div className="flex items-center gap-2.5 mb-2 pr-5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: `rgba(${theory.color},0.15)` }}>
              <theory.icon className="h-3 w-3" style={{ color: `rgb(${theory.color})` }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: `rgb(${theory.color})` }}>
                {theory.label} {theory.paused ? '· Paused' : ''}
              </p>
            </div>
            <span className="font-mono text-[12px] font-bold tabular-nums text-white/80">{theory.time}</span>
          </div>
          <Link
            href={theory.route}
            className="flex items-center justify-between rounded-[14px] py-1.5 px-2.5 text-[10px] font-semibold text-white transition-all hover:scale-[1.02] hover:bg-white/[0.16]"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.22)',
            }}
          >
            <span>Resume reading</span>
            <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        </div>
      )}

      {/* Practice session card */}
      {showPractice && practice && (() => {
        const isCapstone = practice.modulePrefix.startsWith('capstone-');
        const route = practice.route.toLowerCase();
        const accent = route.includes('/senior') ? '255,113,108'
          : route.includes('/mid') ? '255,201,101'
          : '153,247,255';
        const sessionLabel = isCapstone ? 'Project' : 'Practice';
        const resumeLabel = isCapstone ? 'Resume project' : 'Resume practice';
        return (
          <div
            className="relative rounded-[22px] border px-4 py-3 min-w-[220px]"
            style={{
              background: 'rgba(24,28,32,0.95)',
              backdropFilter: 'blur(24px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
              borderColor: `rgba(${accent},0.15)`,
              boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 20px rgba(${accent},0.04)`,
            }}
          >
            <button
              type="button"
              onClick={() => setPracticeDismissed(true)}
              className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-md text-white/15 transition-colors hover:bg-white/[0.06] hover:text-white/40"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="flex items-center gap-2.5 mb-2 pr-5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: `rgba(${accent},0.15)` }}>
                <FlaskConical className="h-3 w-3" style={{ color: `rgb(${accent})` }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: `rgb(${accent})` }}>
                  {sessionLabel} — {practice.modulePrefix}
                </p>
                <p className="text-[9px] text-white/25">Task {practice.taskIndex + 1}/{practice.totalTasks}</p>
              </div>
            </div>
            <Link
              href={practice.route}
              className="flex items-center justify-between rounded-[14px] py-1.5 px-2.5 text-[10px] font-semibold text-white transition-all hover:scale-[1.02] hover:bg-white/[0.16]"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.22)',
              }}
            >
              <span>{resumeLabel}</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        );
      })()}
    </div>
  );
}
