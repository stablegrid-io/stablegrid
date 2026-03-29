'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FlaskConical, ArrowRight } from 'lucide-react';
import { isPracticeSessionPath, shouldHideNav } from '@/components/navigation/navigation-config';

const PRACTICE_SESSION_KEY = 'practice-session:v1';
const ACCENT = '245,158,11';

interface PersistedSession {
  moduleId: string;
  route: string;
  state: {
    phase: string;
    currentTaskIndex: number;
    taskStates: Array<{ checked: boolean; allCorrect: boolean }>;
  };
  savedAt: string;
}

export function PracticeSessionMiniPlayer() {
  const pathname = usePathname();
  const [session, setSession] = useState<PersistedSession | null>(null);

  useEffect(() => {
    const check = () => {
      try {
        const raw = window.sessionStorage.getItem(PRACTICE_SESSION_KEY);
        if (!raw) { setSession(null); return; }
        const snap = JSON.parse(raw) as PersistedSession;
        if (snap.state.phase !== 'session') { setSession(null); return; }
        setSession(snap);
      } catch {
        setSession(null);
      }
    };

    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  // Hide on practice session pages (full UI is already showing)
  if (isPracticeSessionPath(pathname)) return null;
  // Hide on landing/auth pages
  if (shouldHideNav(pathname)) return null;
  // Hide when no active session
  if (!session) return null;

  const { currentTaskIndex, taskStates } = session.state;
  const totalTasks = taskStates.length;
  const completedTasks = taskStates.filter((t) => t.checked).length;
  const modulePrefix = session.moduleId.replace('module-', '');

  return (
    <div
      className="fixed bottom-6 right-6 z-50 rounded-2xl border px-5 py-4 min-w-[240px]"
      style={{
        background: 'rgba(10,12,14,0.92)',
        backdropFilter: 'blur(24px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
        borderColor: `rgba(${ACCENT},0.15)`,
        boxShadow: `0 8px 30px rgba(0,0,0,0.4), 0 0 30px rgba(${ACCENT},0.04)`,
        animation: 'fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      {/* Bottom accent glow */}
      <div className="absolute bottom-0 inset-x-4 h-[2px] rounded-t-full" style={{
        background: `linear-gradient(90deg, transparent, rgba(${ACCENT},0.5), transparent)`,
      }} />

      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `rgba(${ACCENT},0.15)` }}>
          <FlaskConical className="h-3.5 w-3.5" style={{ color: `rgb(${ACCENT})` }} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: `rgb(${ACCENT})` }}>
            Practice — {modulePrefix}
          </p>
          <p className="text-[10px] text-white/30">
            Task {currentTaskIndex + 1} of {totalTasks} · {completedTasks} checked
          </p>
        </div>
      </div>

      {/* Progress segments */}
      <div className="flex gap-[3px] mb-3">
        {taskStates.map((ts, i) => (
          <div
            key={i}
            className="flex-1 h-[3px] rounded-full"
            style={{
              background: ts.checked
                ? ts.allCorrect
                  ? 'rgba(34,197,94,0.7)'
                  : 'rgba(239,68,68,0.7)'
                : i === currentTaskIndex
                  ? `rgb(${ACCENT})`
                  : 'rgba(255,255,255,0.06)',
              boxShadow: i === currentTaskIndex ? `0 0 6px rgba(${ACCENT},0.5)` : 'none',
            }}
          />
        ))}
      </div>

      <Link
        href={session.route}
        className="flex items-center justify-between rounded-lg py-2 px-3 text-[11px] font-semibold transition-all hover:scale-[1.02]"
        style={{
          background: `rgba(${ACCENT},0.1)`,
          border: `1px solid rgba(${ACCENT},0.2)`,
          color: `rgb(${ACCENT})`,
        }}
      >
        <span>Resume practice</span>
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
