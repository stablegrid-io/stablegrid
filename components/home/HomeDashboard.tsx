'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import type { ReadingSession, Topic, TopicProgress } from '@/types/progress';
import type { ReadingSignal } from '@/components/home/home/WeeklyActivityCard';
import type { TrackMetaByTopic } from '@/lib/learn/theoryTrackMeta';
import { computeLevel, computeLessonsLeft, LEVEL_THRESHOLDS } from '@/lib/level';
import WindTurbine from '@/components/home/WindTurbine';

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

  return (
    <div className="relative overflow-hidden h-[calc(100dvh-3.5rem)]">

      <div
        className="relative h-full mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] items-center px-6 lg:px-16 xl:px-24 pb-16 lg:pb-0"
        style={{ maxWidth: 1360 }}
      >

        {/* ── Left: operator card ── */}
        <div className="flex flex-col justify-center" style={{ maxWidth: 420 }}>
          <h1
            className="text-on-surface"
            style={{
              ...anim(0),
              fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
              marginBottom: 20,
            }}
          >
            {(() => {
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
              const dayIndex = Math.floor(Date.now() / 86400000) % lines.length;
              return lines[dayIndex];
            })()}
          </h1>
          <div
            style={{
              ...anim(80),
              background: '#111416',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 22,
              padding: '36px 32px 32px',
            }}
          >
            {/* Level row */}
            <div className="flex items-center justify-between" style={{ marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontWeight: 500, marginBottom: 6 }}>
                  Operator
                </div>
                <div className="flex items-baseline" style={{ gap: 4 }}>
                  <span className="text-on-surface" style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>
                    Level {level}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="tabular-nums text-on-surface" style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {kWh}
                </div>
                <div style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontWeight: 500, marginTop: 6 }}>
                  kWh stored
                </div>
              </div>
            </div>

            {/* Progress to next level */}
            <div style={{ marginBottom: 28 }}>
              <div className="flex items-baseline justify-between" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
                  {remaining > 0 ? `${remaining.toLocaleString()} kWh to level ${level + 1}` : 'Max level'}
                </span>
                <span className="font-mono tabular-nums" style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  {pct}%
                </span>
              </div>
              <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 100 }}>
                <div
                  style={{
                    width: `${Math.max(pct, 1)}%`, height: '100%', borderRadius: 100,
                    background: 'rgba(255,255,255,0.6)',
                    transition: 'width 1.5s cubic-bezier(.16,1,.3,1)',
                  }}
                />
              </div>
            </div>

            {/* CTA */}
            <Link
              href={resumeHref}
              className="block w-full text-center font-mono font-bold uppercase transition-all hover:bg-white/[0.08] active:scale-[0.98]"
              style={{
                padding: '16px 0', borderRadius: 14, fontSize: 12,
                letterSpacing: '0.12em',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              Continue Learning
            </Link>
          </div>
        </div>

        {/* ── Right: wind turbine ── */}
        <div
          className="hidden lg:flex items-center justify-center relative min-h-0"
          style={anim(200)}
        >
          <WindTurbine size="compact" scale={1.30} background="transparent" />
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
