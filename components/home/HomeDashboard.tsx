'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DoorOpen, DoorClosed } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { ReadingSession, Topic, TopicProgress } from '@/types/progress';
import type { ReadingSignal } from '@/components/home/home/WeeklyActivityCard';
import type { TrackMetaByTopic } from '@/lib/learn/theoryTrackMeta';
import { computeLevel, computeLessonsLeft, LEVEL_THRESHOLDS } from '@/lib/level';
import BessContainer from '@/components/home/BessContainer';

/* ── Types ── */
interface HomeDashboardProps {
  user: User;
  topicProgress: TopicProgress[];
  recentSessions: ReadingSession[];
  completedSessions: ReadingSession[];
  latestTheorySession: ReadingSession | null;
  lastClockedInAt: string | null;
  latestTaskAction: {
    title: string; summary: string; statLine: string;
    actionLabel: string; actionHref: string; topicId: Topic;
    accentRgb?: string; progressPct?: number;
  };
  readingSignals: ReadingSignal[];
  trackMetaByTopic: TrackMetaByTopic;
  stats: { totalXp: number; currentStreak: number; questionsCompleted: number; overallAccuracy: number };
  resumeContext?: { chapterTitle: string; lessonTitle: string } | null;
}

/* ── Dashboard ── */
export const HomeDashboard = ({
  user,
  topicProgress,
  recentSessions,
  completedSessions: _completedSessions,
  latestTheorySession,
  lastClockedInAt: _lastClockedInAt,
  latestTaskAction: _latestTaskAction,
  readingSignals: _readingSignals,
  trackMetaByTopic: _trackMetaByTopic,
  stats,
  resumeContext: _resumeContext,
}: HomeDashboardProps) => {

  const firstName = (
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ?? 'Operator'
  ).split(' ')[0];

  const { level, pct, remaining } = useMemo(() => computeLevel(stats.totalXp), [stats.totalXp]);
  const [doorsOpen, setDoorsOpen] = useState(false);

  // Battery fill: total kWh as fraction of next level threshold
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const batteryFill = nextThreshold > 0 ? Math.min(1, stats.totalXp / nextThreshold) : 1;
  const TOTAL_CELLS = 42;
  const litCells = Math.floor(batteryFill * TOTAL_CELLS);
  const lessonsLeft = useMemo(() => computeLessonsLeft(topicProgress), [topicProgress]);
  const kWh = stats.totalXp.toLocaleString();

  const resumeHref = useMemo(() => {
    const ls = latestTheorySession ?? recentSessions[0] ?? null;
    if (!ls) return '/learn';
    const chId = ls.chapterId ?? '';
    const prefix = chId.replace(/\d+$/, '');
    const track = prefix.endsWith('S') ? 'senior' : prefix.endsWith('I') ? 'mid' : 'junior';
    const params = new URLSearchParams();
    params.set('chapter', chId);
    const last = ls.sectionsIdsRead?.[ls.sectionsIdsRead.length - 1];
    if (last) params.set('lesson', last);
    return `/learn/${ls.topic}/theory/${track}?${params.toString()}`;
  }, [latestTheorySession, recentSessions]);

  const anim = (delay: number) =>
    ({ opacity: 0, animation: `homeFadeUp .7s cubic-bezier(.16,1,.3,1) ${delay}ms forwards` }) as const;

  const greetingLine = useMemo(() => {
    const name = <span style={{ color: '#99f7ff' }}>{firstName}</span>;
    const lines = [
      <>Another day, another pipeline, {name}.</>,
      <>Your DAG won't fix itself, {name}.</>,
      <>SELECT motivation FROM {name}.</>,
      <>No schema drift today, {name}.</>,
      <>Pipelines don't build themselves, {name}.</>,
      <>Time to DROP bad habits, {name}.</>,
      <>Let's avoid a full reshuffle, {name}.</>,
      <>Don't let your data go stale, {name}.</>,
      <>Zero null values in your future, {name}.</>,
      <>Your uptime is impressive, {name}.</>,
    ];
    return lines[Math.floor(Date.now() / 86400000) % lines.length];
  }, [firstName]);

  return (
    <div className="relative overflow-hidden h-[calc(100dvh-3.5rem)]">
      <div
        className="relative h-full mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-center px-6 lg:px-16 xl:px-24"
        style={{ maxWidth: 1280 }}
      >

        {/* ── Left: title + operator panel ── */}
        <div className="flex flex-col justify-center" style={{ maxWidth: 400 }}>
          <h1
            className="text-on-surface"
            style={{
              ...anim(0),
              fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
              marginBottom: 24,
            }}
          >
            {greetingLine}
          </h1>

          {/* Operator panel */}
          <div
            style={{
              ...anim(100),
              background: '#111416',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 22,
              padding: '28px 28px 24px',
            }}
          >
            {/* Stats */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontWeight: 500, marginBottom: 4 }}>Level</div>
                <div className="tabular-nums text-on-surface" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>{level}</div>
              </div>
              <div className="text-right">
                <div className="tabular-nums" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: '#99f7ff' }}>
                  {kWh}
                </div>
                <div style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontWeight: 500, marginTop: 2 }}>
                  kWh stored
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 20 }}>
              <div className="flex items-baseline justify-between" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
                  {remaining > 0 ? `${remaining.toLocaleString()} kWh to level ${level + 1}` : 'Max level'}
                </span>
                <span className="font-mono tabular-nums" style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  {pct}%
                </span>
              </div>
              <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 100 }}>
                <div style={{ width: `${Math.max(pct, 1)}%`, height: '100%', borderRadius: 100, background: 'rgba(255,255,255,0.6)', transition: 'width 1.5s cubic-bezier(.16,1,.3,1)' }} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href={resumeHref}
                className="flex-1 block text-center font-mono font-bold uppercase transition-all hover:bg-white/[0.08] active:scale-[0.98]"
                style={{
                  padding: '14px 0', borderRadius: 14, fontSize: 11,
                  letterSpacing: '0.1em',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                Continue Learning
              </Link>
              <button
                onClick={() => setDoorsOpen((v) => !v)}
                className="flex items-center gap-2 font-mono uppercase transition-all hover:bg-white/[0.06] active:scale-[0.97]"
                style={{
                  padding: '14px 16px', borderRadius: 14, fontSize: 11,
                  letterSpacing: '0.1em', fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {doorsOpen ? <DoorClosed className="w-3.5 h-3.5" /> : <DoorOpen className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: battery ── */}
        <div className="hidden lg:flex items-center justify-center" style={anim(200)}>
          <div className="relative w-full" style={{ maxWidth: 600 }}>
            <BessContainer fill={batteryFill} doorsOpen={doorsOpen} kWh={stats.totalXp} level={level} pct={pct} />

            {/* Info panel — visible when doors open */}
            {doorsOpen && (
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-4 z-10"
                style={{
                  background: 'rgba(17,20,22,0.92)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: '14px 18px',
                  width: 320,
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 10 }}>
                  BESS Energy Storage
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 12 }}>
                  Your battery stores kWh earned by reading lessons, completing modules, and finishing tracks. Cells light up as you learn.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'Lesson read', value: '+5 kWh', sub: '×1.5 mid · ×3 senior' },
                    { label: 'Module complete', value: '+25 kWh', sub: '×1.5 mid · ×3 senior' },
                    { label: 'Track complete', value: '+200 kWh', sub: '×1.5 mid · ×3 senior' },
                  ].map((r) => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{r.label}</span>
                      <span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#99f7ff' }}>{r.value}</span>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginLeft: 4 }}>{r.sub}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Cells</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{litCells}/{TOTAL_CELLS} charged</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <style jsx global>{`
        @keyframes homeFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
