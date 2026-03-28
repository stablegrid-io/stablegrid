'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { ArrowRight, Zap, BookOpen, Clock, Clock3, Target, TrendingUp, Brain } from 'lucide-react';
import type { ReadingSession, Topic, TopicProgress } from '@/types/progress';
import type { ReadingSignal } from '@/components/home/home/WeeklyActivityCard';
import { HOME_TOPIC_ORDER, getHomeTopicMeta } from '@/components/home/home/topicMeta';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import { OrbitalMap } from '@/components/home/OrbitalMap';
import { buildOrbitalTopics } from '@/components/home/orbitalMapData';
import type { TrackMetaByTopic } from '@/lib/learn/theoryTrackMeta';

/* ── Types ── */
interface HomeDashboardProps {
  user: User;
  topicProgress: TopicProgress[];
  recentSessions: ReadingSession[];
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
}

interface TopicSnapshot {
  topicId: Topic;
  label: string;
  theoryPct: number;
  theoryCompleted: number;
  theoryTotal: number;
  accentRgb: string;
}

/* ── Animation hooks ── */
const useCountUp = (target: number, duration = 1200, delay = 0) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);
  return value;
};

const useFillAnimation = (targetPct: number, delay = 0) => {
  const [fill, setFill] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setFill(targetPct), 80 + delay);
    return () => clearTimeout(timer);
  }, [targetPct, delay]);
  return fill;
};

const useStaggeredReveal = (count: number, staggerMs = 60) => {
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    if (revealed >= count) return;
    const timer = setTimeout(() => setRevealed((r) => r + 1), staggerMs);
    return () => clearTimeout(timer);
  }, [revealed, count, staggerMs]);
  return revealed;
};

/* ── Weekly velocity ── */
const computeWeeklyVelocity = (signals: ReadingSignal[]): number[] => {
  const weeks: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
  const now = Date.now();
  for (const signal of signals) {
    const ts = Date.parse(signal.lastActiveAt);
    if (!Number.isFinite(ts)) continue;
    const weeksAgo = Math.floor((now - ts) / (7 * 24 * 60 * 60 * 1000));
    if (weeksAgo >= 0 && weeksAgo < 8) weeks[7 - weeksAgo]++;
  }
  return weeks;
};

/* ── Interactive Sparkline ── */
const VelocitySparkline = ({ data, accentRgb }: { data: number[]; accentRgb: string }) => {
  const max = Math.max(...data, 1);
  const w = 200; const h = 48;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const revealed = useFillAnimation(100, 200);
  const points = data.map((v, i) => ({ x: (i / (data.length - 1)) * w, y: h - (v / max) * (h - 8) - 4, value: v }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
        <defs>
          <linearGradient id="vel-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`rgba(${accentRgb},0.2)`} />
            <stop offset="100%" stopColor={`rgba(${accentRgb},0)`} />
          </linearGradient>
          <clipPath id="vel-reveal"><rect x="0" y="0" width={`${revealed}%`} height={h} /></clipPath>
        </defs>
        <g clipPath="url(#vel-reveal)">
          <path d={areaD} fill="url(#vel-grad)" />
          <path d={pathD} fill="none" stroke={`rgb(${accentRgb})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {points.map((p, i) => (
          <rect key={i} x={p.x - w / data.length / 2} y={0} width={w / data.length} height={h} fill="transparent"
            onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)} />
        ))}
        {hoverIndex !== null && (
          <>
            <line x1={points[hoverIndex].x} y1={0} x2={points[hoverIndex].x} y2={h} stroke={`rgba(${accentRgb},0.15)`} strokeWidth="1" />
            <circle cx={points[hoverIndex].x} cy={points[hoverIndex].y} r="4" fill={`rgb(${accentRgb})`} style={{ filter: `drop-shadow(0 0 6px rgba(${accentRgb},0.5))` }} />
          </>
        )}
        {hoverIndex === null && points.length > 0 && (
          <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill={`rgb(${accentRgb})`} />
        )}
      </svg>
      {hoverIndex !== null && (
        <div className="pointer-events-none absolute -top-10 -translate-x-1/2 rounded-xl border border-white/[0.08] bg-[#1a1d20]/95 px-3 py-1.5 text-[11px] font-medium text-on-surface shadow-[0_12px_24px_-10px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
          style={{ left: `${(hoverIndex / (data.length - 1)) * 100}%` }}>
          <span style={{ color: `rgb(${accentRgb})` }}>{points[hoverIndex].value}</span>
          <span className="text-on-surface-variant/40 ml-1">sessions</span>
        </div>
      )}
    </div>
  );
};

/* ── Animated stat card ── */
const StatCard = ({ icon: Icon, label, value, suffix = '', delay = 0, accentRgb }: {
  icon: typeof Clock; label: string; value: number; suffix?: string; delay?: number; accentRgb?: string;
}) => {
  const animated = useCountUp(value, 1000, delay);
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]">
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: accentRgb ? `radial-gradient(ellipse at center, rgba(${accentRgb},0.04), transparent 70%)` : undefined }} />
      <div className="relative">
        <Icon className="h-4 w-4 text-on-surface-variant/20 mb-2 transition-colors group-hover:text-on-surface-variant/40" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/30">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-on-surface">{animated}{suffix}</p>
      </div>
    </div>
  );
};

const TRACK_LEVEL_COLORS: Record<string, string> = { junior: '153,247,255', mid: '255,201,101', senior: '255,113,108' };

/* ── Track level battery ── */
const TrackLevelBattery = ({ label, completed, total, color, delay }: {
  label: string; completed: number; total: number; color: string; delay: number;
}) => {
  const animatedCompleted = useCountUp(completed, 800, delay);
  const fillPct = total > 0 ? (completed / total) * 100 : 0;
  const animatedFill = useFillAnimation(fillPct, delay + 200);

  return (
    <div className="group relative flex-1 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.1]">
      {/* Fill from bottom */}
      <div
        className="absolute inset-x-0 bottom-0 transition-all duration-[1.4s]"
        style={{
          height: `${animatedFill}%`,
          background: `linear-gradient(to top, rgba(${color},0.15), rgba(${color},0.04))`,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
      {/* Glow edge */}
      {animatedFill > 0 && animatedFill < 100 && (
        <div
          className="absolute inset-x-0 h-px transition-all duration-[1.4s]"
          style={{
            bottom: `${animatedFill}%`,
            background: `rgba(${color},0.4)`,
            boxShadow: `0 0 10px rgba(${color},0.25)`,
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 h-[2px] transition-all duration-[1.4s]"
        style={{
          width: `${animatedFill}%`,
          background: `rgb(${color})`,
          boxShadow: `0 0 8px rgba(${color},0.4)`,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      <div className="relative p-4 flex flex-col items-center text-center min-h-[120px] justify-center">
        <div className="h-2 w-2 rounded-full mb-2" style={{ backgroundColor: `rgb(${color})`, boxShadow: `0 0 8px rgba(${color},0.4)` }} />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/40">{label}</p>
        <p className="text-2xl font-bold mt-1 tracking-tight" style={{ color: `rgb(${color})` }}>
          {animatedCompleted}
        </p>
        <p className="text-[10px] text-on-surface-variant/25 mt-0.5">of {total} modules</p>
      </div>
    </div>
  );
};

/* ── Session mode battery cell ── */
const SessionModeCell = ({ label, Icon, color, count, delay }: {
  label: string; Icon: typeof Zap; color: string; count: number; delay: number;
}) => {
  const maxSessions = 10;
  const fillPct = Math.min(100, (count / maxSessions) * 100);
  const animatedFill = useFillAnimation(fillPct, delay);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition-all hover:bg-white/[0.05]">
      <div className="absolute inset-x-0 bottom-0 transition-all duration-[1.2s]"
        style={{
          height: `${animatedFill}%`,
          background: `linear-gradient(to top, rgba(${color},0.12), rgba(${color},0.03))`,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }} />
      {animatedFill > 0 && (
        <div className="absolute inset-x-0 h-px transition-all duration-[1.2s]"
          style={{
            bottom: `${animatedFill}%`,
            background: `rgba(${color},0.3)`,
            boxShadow: `0 0 8px rgba(${color},0.2)`,
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }} />
      )}
      <div className="relative text-center">
        <div className="mx-auto flex h-9 w-9 items-center justify-center border" style={{ borderColor: `rgba(${color},0.3)`, backgroundColor: `rgba(${color},0.08)` }}>
          <Icon className="h-4 w-4" style={{ color: `rgb(${color})` }} />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mt-2" style={{ color: `rgba(${color},0.7)` }}>{label}</p>
        <p className="text-lg font-bold text-on-surface mt-1">{count}</p>
        <p className="text-[9px] text-on-surface-variant/25 mt-0.5">sessions</p>
      </div>
    </div>
  );
};

/* ── Session mode batteries ── */
const SessionModeBatteries = ({ sprintCount, pomodoroCount, deepFocusCount, totalHours }: {
  sprintCount: number; pomodoroCount: number; deepFocusCount: number; totalHours: number;
}) => (
  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.1] animate-[fadeIn_1s_ease]">
    <div className="flex items-center justify-between mb-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/30">Session modes</p>
      <p className="text-[11px] text-on-surface-variant/30">{Math.round(totalHours * 10) / 10}h total</p>
    </div>
    <div className="grid grid-cols-3 gap-2">
      <SessionModeCell label="Sprint" Icon={Zap} color="153,247,255" count={sprintCount} delay={600} />
      <SessionModeCell label="Pomodoro" Icon={Clock3} color="255,113,108" count={pomodoroCount} delay={750} />
      <SessionModeCell label="Deep Focus" Icon={Brain} color="191,129,255" count={deepFocusCount} delay={900} />
    </div>
  </div>
);

/* ── Main Dashboard ── */
export const HomeDashboard = ({
  user, topicProgress, recentSessions, latestTheorySession,
  lastClockedInAt: _lastClockedInAt, latestTaskAction: _latestTaskAction,
  readingSignals, trackMetaByTopic, stats: _stats
}: HomeDashboardProps) => {
  const topicSnapshots = useMemo<TopicSnapshot[]>(() => {
    const progressMap = new Map(topicProgress.map((item) => [item.topic, item]));
    return HOME_TOPIC_ORDER.map((topicId) => {
      const progress = progressMap.get(topicId);
      const meta = getHomeTopicMeta(topicId);
      const style = getTheoryTopicStyle(topicId);
      const theoryTotal = progress?.theoryChaptersTotal && progress.theoryChaptersTotal > 0 ? progress.theoryChaptersTotal : meta.fallbackChapters;
      const theoryCompleted = progress?.theoryChaptersCompleted ?? 0;
      const theoryPct = theoryTotal > 0 ? Math.round((theoryCompleted / theoryTotal) * 100) : 0;
      return { topicId, label: meta.label, theoryPct, theoryCompleted, theoryTotal, accentRgb: style.accentRgb };
    });
  }, [topicProgress]);

  const activeTopics = topicSnapshots.filter((t) => t.theoryTotal > 0);
  const orbitalTopics = useMemo(() => buildOrbitalTopics(topicProgress, trackMetaByTopic), [topicProgress, trackMetaByTopic]);

  const overallProgress = useMemo(() => {
    const total = topicSnapshots.reduce((sum, s) => sum + s.theoryTotal, 0);
    const completed = topicSnapshots.reduce((sum, s) => sum + s.theoryCompleted, 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [topicSnapshots]);

  const latestSession = latestTheorySession ?? recentSessions[0] ?? null;
  const currentTopic = latestSession
    ? topicSnapshots.find((s) => s.topicId === latestSession.topic) ?? topicSnapshots[0]
    : topicSnapshots.find((s) => s.theoryPct > 0 && s.theoryPct < 100) ?? topicSnapshots[0];

  const weeklyVelocity = useMemo(() => computeWeeklyVelocity(readingSignals), [readingSignals]);
  const totalHours = topicProgress.reduce((sum, p) => sum + (p.theoryTotalMinutesRead ?? 0), 0) / 60;
  const progressFill = useFillAnimation(currentTopic?.theoryPct ?? 0, 400);

  const userDisplayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ?? 'Operator';

  const resumeHref = latestSession ? `/learn/${latestSession.topic}/theory` : currentTopic ? `/learn/${currentTopic.topicId}/theory` : '/learn/theory';

  const skillTags = topicSnapshots
    .filter((s) => s.theoryCompleted > 0)
    .flatMap((s) => {
      const tags: string[] = [];
      if (s.theoryCompleted >= 3) tags.push(s.label.toUpperCase());
      if (s.theoryPct >= 50) tags.push(`${s.label.toUpperCase()}_ADV`);
      if (s.theoryPct >= 100) tags.push(`${s.label.toUpperCase()}_MASTERY`);
      return tags;
    }).slice(0, 6);

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">

          {/* Left: Orbital Constellation */}
          <div className="flex flex-col items-center justify-center">
            <div className="mb-6 self-start">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant/40 animate-[fadeIn_0.6s_ease]">
                Status: {overallProgress > 0 ? 'Deep dive active' : 'Awaiting initialization'}
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-on-surface lg:text-5xl animate-[fadeIn_0.8s_ease]" style={{ fontFamily: 'var(--font-headline)' }}>
                {userDisplayName}
              </h1>
              <p className="mt-2 max-w-lg text-[13px] text-on-surface-variant/50 animate-[fadeIn_1s_ease]">
                Traversing {activeTopics.length} theory tracks across the data engineering curriculum.
              </p>
            </div>

            <div className="w-full">
              <OrbitalMap topics={orbitalTopics} overallPct={overallProgress} />
            </div>

            <Link href={resumeHref}
              className="mt-6 self-stretch group flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/8 px-6 py-4 transition-all duration-300 hover:bg-primary/12 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(153,247,255,0.08)] animate-[fadeIn_1.4s_ease]">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-[13px] font-semibold text-on-surface">Resume session</span>
              </div>
              <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
            </Link>

          </div>

          {/* Right: Stats Panel */}
          <div className="space-y-4">

            {currentTopic && currentTopic.theoryTotal > 0 && (
              <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.1] animate-[fadeIn_0.4s_ease]">
                <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top right, rgba(${currentTopic.accentRgb},0.04), transparent 60%)` }} />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/30">Current focus</p>
                      <h2 className="mt-1 text-lg font-bold tracking-tight text-on-surface">{currentTopic.label}</h2>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110" style={{ backgroundColor: `rgba(${currentTopic.accentRgb},0.1)` }}>
                      <BookOpen className="h-4 w-4" style={{ color: `rgb(${currentTopic.accentRgb})` }} />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {(() => {
                      const tracksMeta = trackMetaByTopic[currentTopic.topicId] ?? [];
                      if (tracksMeta.length === 0) return null;

                      let remainingCompleted = currentTopic.theoryCompleted;
                      const trackData = tracksMeta.map((tm) => {
                        const completed = Math.min(tm.moduleCount, Math.max(0, remainingCompleted));
                        remainingCompleted = Math.max(0, remainingCompleted - tm.moduleCount);
                        return { ...tm, completed };
                      });

                      return trackData.map((td, i) => {
                        const levelColor = TRACK_LEVEL_COLORS[td.slug] ?? '153,247,255';
                        return (
                          <TrackLevelBattery
                            key={td.slug}
                            label={td.label.replace('-Level Track', '')}
                            completed={td.completed}
                            total={td.moduleCount}
                            color={levelColor}
                            delay={300 + i * 150}
                          />
                        );
                      });
                    })()}
                  </div>

                </div>
              </div>
            )}

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04] animate-[fadeIn_0.6s_ease]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/30">Learning velocity</p>
                  <p className="mt-1 text-[13px] text-on-surface-variant/50">Sessions per week</p>
                </div>
                <TrendingUp className="h-4 w-4 text-on-surface-variant/20" />
              </div>
              <div className="mt-3">
                <VelocitySparkline data={weeklyVelocity} accentRgb={currentTopic?.accentRgb ?? '153,247,255'} />
              </div>
            </div>


            {/* Session modes */}
            <SessionModeBatteries
              sprintCount={recentSessions.filter((s) => s.activeSeconds > 0 && s.activeSeconds <= 900).length}
              pomodoroCount={recentSessions.filter((s) => s.activeSeconds > 900 && s.activeSeconds <= 2700).length}
              deepFocusCount={recentSessions.filter((s) => s.activeSeconds > 2700).length}
              totalHours={totalHours}
            />

            {skillTags.length > 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-2xl animate-[fadeIn_1.2s_ease]">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/30 mb-3">Skills unlocked</p>
                <div className="flex flex-wrap gap-2">
                  {skillTags.map((tag) => (
                    <span key={tag} className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-on-surface-variant/50 transition-colors hover:bg-white/[0.07] hover:text-on-surface-variant/70">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
