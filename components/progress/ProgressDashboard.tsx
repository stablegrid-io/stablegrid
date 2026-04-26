'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';
import {
  ArrowLeft,
  Clock3,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Lock,
  Zap,
  Brain,
  BookOpen
} from 'lucide-react';
import type { ReadingSession, Topic, TopicProgress } from '@/types/progress';
import { HOME_TOPIC_ORDER, getHomeTopicMeta } from '@/components/home/home/topicMeta';
import type { TrackMetaByTopic } from '@/lib/learn/theoryTrackMeta';
import { CharacterTierHero } from './CharacterTierHero';

/* ── Types ── */

interface ProgressDashboardProps {
  user: User;
  topicProgress: TopicProgress[];
  allSessions: ReadingSession[];
  trackMetaByTopic: TrackMetaByTopic;
  completedModulesByTopic: Record<string, string[]>;
  stats: { totalXp: number; currentStreak: number; questionsCompleted: number };
}

/* ── Topic icon map ── */

const TOPIC_ICON: Record<string, string> = {
  pyspark: '/brand/pyspark-track-star.svg', fabric: '/brand/microsoft-fabric-track.svg',
  airflow: '/brand/apache-airflow-logo.svg', sql: '/brand/sql-logo.svg',
  'python-de': '/brand/python-logo.svg',
};

const APPLE_FONT = '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';
const CARD = 'rounded-[22px] bg-[#181c20] border border-white/[0.06] p-5';
const SECTION_LABEL = 'text-[11px] font-mono font-bold text-on-surface/75 uppercase tracking-[0.18em]';
const SECTION_SUBLABEL = 'text-[13px] text-on-surface-variant/75 leading-relaxed';

/* ── Helpers ── */

const DAY_MS = 86_400_000;
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date): string {
  return startOfDay(d).toISOString().slice(0, 10);
}

function formatHrs(minutes: number): { h: number; m: number; text: string } {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return { h, m, text: h > 0 ? `${h}h ${m}m` : `${m}m` };
}

function formatRelativeDate(iso: string | null | undefined, nowMs: number): string {
  if (!iso) return '';
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return '';
  const days = Math.floor((nowMs - ts) / DAY_MS);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function pctDelta(curr: number, prev: number): number | null {
  if (prev === 0 && curr === 0) return null;
  if (prev === 0) return 100;
  return Math.round(((curr - prev) / prev) * 100);
}

/* ── Component ── */

export function ProgressDashboard({
  user, topicProgress, allSessions, trackMetaByTopic, completedModulesByTopic, stats,
}: ProgressDashboardProps) {
  // All date-formatting depends on the user's locale/timezone which differ
  // between server render and client. Gate such text behind this flag.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  /* ── Core aggregates ── */
  const {
    totalMinutes,
    totalSessions,
    completedSessions,
    totalLessonsEver,
    totalModulesDone,
    totalModules,
    overallPct,
    firstActiveAt,
  } = useMemo(() => {
    const totalSec = allSessions.reduce((s, x) => s + x.activeSeconds, 0);
    const completedCount = allSessions.filter((s) => s.isCompleted).length;
    // Unique lessons across the whole library
    const uniqueLessons = new Set<string>();
    allSessions.forEach((s) => s.sectionsIdsRead.forEach((id) => uniqueLessons.add(`${s.topic}:${s.chapterId}:${id}`)));
    // Modules
    const modulesDone = topicProgress.reduce((s, t) => s + t.theoryChaptersCompleted, 0);
    const modulesTotal = topicProgress.reduce((s, t) => s + t.theoryChaptersTotal, 0);
    // First activity (earliest startedAt)
    const first = allSessions
      .map((s) => s.startedAt)
      .filter(Boolean)
      .sort()[0] ?? null;
    return {
      totalMinutes: Math.round(totalSec / 60),
      totalSessions: allSessions.length,
      completedSessions: completedCount,
      totalLessonsEver: uniqueLessons.size,
      totalModulesDone: modulesDone,
      totalModules: modulesTotal,
      overallPct: modulesTotal > 0 ? Math.round((modulesDone / modulesTotal) * 100) : 0,
      firstActiveAt: first,
    };
  }, [allSessions, topicProgress]);

  /* ── This-week vs last-week trends ── */
  const trends = useMemo(() => {
    const now = Date.now();
    const weekStart = now - 7 * DAY_MS;
    const prevWeekStart = now - 14 * DAY_MS;

    let minThis = 0, minLast = 0;
    let modThis = 0, modLast = 0;
    let sessThis = 0, sessLast = 0;

    allSessions.forEach((s) => {
      const ts = new Date(s.lastActiveAt).getTime();
      const inThis = ts >= weekStart;
      const inLast = ts >= prevWeekStart && ts < weekStart;
      if (inThis) {
        minThis += Math.round(s.activeSeconds / 60);
        sessThis += 1;
      } else if (inLast) {
        minLast += Math.round(s.activeSeconds / 60);
        sessLast += 1;
      }
      if (s.isCompleted && s.completedAt) {
        const cts = new Date(s.completedAt).getTime();
        if (cts >= weekStart) modThis += 1;
        else if (cts >= prevWeekStart && cts < weekStart) modLast += 1;
      }
    });

    return {
      minutesThisWeek: minThis,
      minutesDelta: pctDelta(minThis, minLast),
      sessionsThisWeek: sessThis,
      sessionsDelta: pctDelta(sessThis, sessLast),
      modulesThisWeek: modThis,
      modulesDelta: pctDelta(modThis, modLast),
    };
  }, [allSessions]);

  /* ── Daily focus (last 30 days, minutes per day) ── */
  const dailyFocus = useMemo(() => {
    const now = startOfDay(new Date());
    const dayMap = new Map<string, number>(); // minutes
    allSessions.forEach((s) => {
      const k = dayKey(new Date(s.lastActiveAt));
      dayMap.set(k, (dayMap.get(k) ?? 0) + s.activeSeconds / 60);
    });

    const days: Array<{ key: string; date: Date; minutes: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      days.push({ key: k, date: d, minutes: Math.round(dayMap.get(k) ?? 0) });
    }

    const total = days.reduce((s, d) => s + d.minutes, 0);
    const activeDays = days.filter((d) => d.minutes > 0).length;
    const avgPerActive = activeDays > 0 ? Math.round(total / activeDays) : 0;
    const best = days.reduce((acc, d) => (d.minutes > acc.minutes ? d : acc), days[0]);
    const max = Math.max(...days.map((d) => d.minutes), 1);

    return { days, total, activeDays, avgPerActive, best, max };
  }, [allSessions]);

  /* ── Consistency heatmap (12 weeks × 7 days, minutes per day) ── */
  const heatmap = useMemo(() => {
    const dayMap = new Map<string, number>();
    allSessions.forEach((s) => {
      const k = dayKey(new Date(s.lastActiveAt));
      dayMap.set(k, (dayMap.get(k) ?? 0) + s.activeSeconds / 60);
    });

    const today = startOfDay(new Date());
    const todayDay = today.getDay();
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - ((todayDay + 6) % 7));
    const start = new Date(thisMonday);
    start.setDate(start.getDate() - 11 * 7);

    const weeks: Array<Array<{ key: string; minutes: number; label: string; isFuture: boolean; date: Date }>> = [];
    let max = 1;
    for (let w = 0; w < 12; w++) {
      const week: Array<{ key: string; minutes: number; label: string; isFuture: boolean; date: Date }> = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(date.getDate() + w * 7 + d);
        const k = dayKey(date);
        const isFuture = date > today;
        const mins = isFuture ? 0 : Math.round(dayMap.get(k) ?? 0);
        if (mins > max) max = mins;
        week.push({
          key: k,
          minutes: mins,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          isFuture,
          date,
        });
      }
      weeks.push(week);
    }

    // Month-change indices for labels above columns
    const monthLabels: Array<{ col: number; label: string }> = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstDay = week[0].date;
      if (firstDay.getMonth() !== lastMonth) {
        lastMonth = firstDay.getMonth();
        monthLabels.push({ col: i, label: firstDay.toLocaleDateString('en-US', { month: 'short' }) });
      }
    });

    return { weeks, max, monthLabels };
  }, [allSessions]);

  /* ── Completed sessions stats ── */
  const completedStats = useMemo(() => {
    const completed = allSessions.filter((s) => s.isCompleted);
    const count = completed.length;
    const totalSec = completed.reduce((a, s) => a + s.activeSeconds, 0);
    const nonZero = completed.filter((s) => s.activeSeconds > 0);
    const avgSec = nonZero.length > 0 ? totalSec / nonZero.length : 0;
    const fastestSec = nonZero.length > 0 ? Math.min(...nonZero.map((s) => s.activeSeconds)) : 0;
    const longestSec = nonZero.length > 0 ? Math.max(...nonZero.map((s) => s.activeSeconds)) : 0;

    // Topics touched through completions
    const topicsCompleted = new Set(completed.map((s) => s.topic)).size;

    // Mode breakdown — prefer the persisted sessionMethod (column added 2026-04-23);
    // for legacy rows where it's null, fall back to a duration estimate.
    const modes = { sprint: 0, pomodoro: 0, deep: 0, free: 0 };
    let inferredCount = 0;
    completed.forEach((s) => {
      switch (s.sessionMethod) {
        case 'sprint':      modes.sprint += 1; return;
        case 'pomodoro':    modes.pomodoro += 1; return;
        case 'deep-focus':  modes.deep += 1; return;
        case 'free-read':   modes.free += 1; return;
        default: break;
      }
      inferredCount += 1;
      const min = s.activeSeconds / 60;
      if (min <= 15) modes.sprint += 1;
      else if (min <= 60) modes.pomodoro += 1;
      else modes.deep += 1;
    });

    // Sort by completion recency for the "Recent" list
    const recent = completed
      .slice()
      .sort((a, b) =>
        new Date(b.completedAt ?? b.lastActiveAt).getTime() -
        new Date(a.completedAt ?? a.lastActiveAt).getTime()
      )
      .slice(0, 5);

    return {
      count,
      totalMinutes: Math.round(totalSec / 60),
      avgMinutes: Math.round(avgSec / 60),
      fastestMinutes: Math.round(fastestSec / 60),
      longestMinutes: Math.round(longestSec / 60),
      topicsCompleted,
      modes,
      inferredCount,
      recent,
    };
  }, [allSessions]);

  /* ── Topic mastery (honest per-track breakdown) ── */
  const topicMastery = useMemo(() => {
    // Authoritative completed chapter IDs per topic: union of module_progress
    // (source of truth for the /learn track gallery) and completed reading_sessions.
    const completedByTopic = new Map<string, Set<string>>();
    Object.entries(completedModulesByTopic).forEach(([topicId, ids]) => {
      completedByTopic.set(topicId, new Set(ids));
    });
    allSessions.forEach((s) => {
      if (!s.isCompleted) return;
      const set = completedByTopic.get(s.topic) ?? new Set<string>();
      set.add(s.chapterId);
      completedByTopic.set(s.topic, set);
    });

    return HOME_TOPIC_ORDER
      .map((topicId) => {
        const progress = topicProgress.find((p) => p.topic === topicId);
        const meta = getHomeTopicMeta(topicId as Topic);
        const total = progress?.theoryChaptersTotal ?? 0;
        const minutes = progress?.theoryTotalMinutesRead ?? 0;
        const lastActive = progress?.lastActivityAt ?? null;
        const completedSet = completedByTopic.get(topicId) ?? new Set<string>();
        // Prefer authoritative set size; fall back to topic_progress value
        const completed = Math.max(completedSet.size, progress?.theoryChaptersCompleted ?? 0);

        const tracks = (trackMetaByTopic as Record<string, Array<{ slug: string; moduleCount: number; moduleIds: string[] }>>)[topicId] ?? [];
        const levels = (['junior', 'mid', 'senior'] as const).map((slug) => {
          const track = tracks.find((t) => t.slug === slug);
          if (!track || track.moduleCount === 0) return { slug, status: 'empty' as const, pct: 0, done: 0, total: 0 };
          const done = track.moduleIds.filter((id) => completedSet.has(id)).length;
          const pct = Math.round((done / track.moduleCount) * 100);
          const status: 'complete' | 'progress' | 'available' =
            pct >= 100 ? 'complete' : pct > 0 ? 'progress' : 'available';
          return { slug, status, pct, done, total: track.moduleCount };
        });

        return {
          topicId,
          label: meta?.label ?? topicId,
          total,
          completed,
          pct: total > 0 ? Math.round((completed / total) * 100) : 0,
          minutes,
          lastActive,
          levels,
        };
      })
      .filter((t) => t.total > 0);
  }, [topicProgress, allSessions, trackMetaByTopic, completedModulesByTopic]);

  /* ── Milestones ── */
  const milestones = useMemo(() => {
    const list: Array<{ id: string; label: string; sub: string; earned: boolean; progress?: number }> = [];

    const daysSinceFirst = firstActiveAt && hydrated
      ? Math.max(1, Math.floor((Date.now() - new Date(firstActiveAt).getTime()) / DAY_MS))
      : 0;

    list.push({
      id: 'first-step',
      label: 'First session',
      sub: firstActiveAt ? (hydrated ? `${daysSinceFirst}d ago` : 'Earned') : 'Start to earn',
      earned: allSessions.length > 0,
    });
    list.push({
      id: 'first-chapter',
      label: 'First chapter complete',
      sub: completedSessions > 0 ? 'Earned' : '0 / 1 chapters',
      earned: completedSessions > 0,
    });
    list.push({
      id: 'ten-hours',
      label: '10 hours invested',
      sub: totalMinutes >= 600 ? 'Earned' : `${formatHrs(totalMinutes).text} / 10h`,
      earned: totalMinutes >= 600,
      progress: Math.min(100, (totalMinutes / 600) * 100),
    });
    list.push({
      id: 'five-streak',
      label: '5-day streak',
      sub: stats.currentStreak >= 5 ? 'Active' : `${stats.currentStreak} / 5 days`,
      earned: stats.currentStreak >= 5,
      progress: Math.min(100, (stats.currentStreak / 5) * 100),
    });
    list.push({
      id: 'ten-modules',
      label: '10 modules complete',
      sub: totalModulesDone >= 10 ? 'Earned' : `${totalModulesDone} / 10`,
      earned: totalModulesDone >= 10,
      progress: Math.min(100, (totalModulesDone / 10) * 100),
    });
    list.push({
      id: 'multi-topic',
      label: 'Cross-topic learner',
      sub: topicMastery.length >= 3 ? 'Earned' : `${topicMastery.length} / 3 topics`,
      earned: topicMastery.length >= 3,
      progress: Math.min(100, (topicMastery.length / 3) * 100),
    });
    list.push({
      id: 'fifty-hours',
      label: '50 hours invested',
      sub: totalMinutes >= 3000 ? 'Earned' : `${formatHrs(totalMinutes).text} / 50h`,
      earned: totalMinutes >= 3000,
      progress: Math.min(100, (totalMinutes / 3000) * 100),
    });
    list.push({
      id: 'century',
      label: '100 lessons read',
      sub: totalLessonsEver >= 100 ? 'Earned' : `${totalLessonsEver} / 100`,
      earned: totalLessonsEver >= 100,
      progress: Math.min(100, (totalLessonsEver / 100) * 100),
    });

    return list;
  }, [allSessions, completedSessions, firstActiveAt, stats.currentStreak, totalMinutes, totalModulesDone, topicMastery.length, totalLessonsEver, hydrated]);

  /* ── Hero summary sentence ── */
  const summary = useMemo(() => {
    if (totalSessions === 0) return 'No sessions yet — your first reading session starts the log.';
    const t = formatHrs(totalMinutes).text;
    const streakPart = stats.currentStreak > 0 ? `, ${stats.currentStreak}-day streak active` : '';
    return `${t} invested · ${totalLessonsEver} lesson${totalLessonsEver === 1 ? '' : 's'} · ${totalModulesDone} module${totalModulesDone === 1 ? '' : 's'}${streakPart}.`;
  }, [totalSessions, totalMinutes, totalLessonsEver, totalModulesDone, stats.currentStreak]);

  const totalH = formatHrs(totalMinutes);

  /* ── Render ── */
  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12 space-y-12">

        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>

        {/* ── Character Tier (first section) ── */}
        <CharacterTierHero />

        {/* ── Hero ── */}
        <div
          className="border-b border-white/[0.08] pb-6 space-y-3"
          style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 80ms forwards' }}
        >
          <h1
            className="text-on-surface"
            style={{
              fontFamily: APPLE_FONT,
              fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
              fontWeight: 600,
              letterSpacing: '-0.035em',
              lineHeight: 1.05,
            }}
          >
            Your impact
          </h1>
          <p className="text-[15px] text-on-surface-variant/70 max-w-2xl leading-relaxed tabular-nums">
            {summary}
          </p>
        </div>

        {/* ── KPIs ── */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 80ms forwards' }}
        >
          <Kpi
            label="Time invested"
            value={`${String(totalH.h).padStart(2, '0')}:${String(totalH.m).padStart(2, '0')}`}
            unit="h:m"
            delta={trends.minutesDelta}
            sub={trends.minutesThisWeek > 0 ? `${formatHrs(trends.minutesThisWeek).text} this week` : 'No time this week'}
            rgb="153,247,255"
          />
          <Kpi
            label="Lessons read"
            value={totalLessonsEver.toString()}
            unit="unique lessons"
            delta={null}
            sub={`Across ${topicMastery.length} topic${topicMastery.length === 1 ? '' : 's'}`}
            rgb="191,129,255"
          />
          <Kpi
            label="Modules done"
            value={`${totalModulesDone}`}
            unit={`of ${totalModules}`}
            delta={trends.modulesDelta}
            sub={`${overallPct}% of library`}
            rgb="255,201,101"
          />
          <Kpi
            label="Current streak"
            value={`${stats.currentStreak}`}
            unit={stats.currentStreak === 1 ? 'day' : 'days'}
            delta={null}
            sub={stats.currentStreak > 0 ? 'Keep showing up' : 'Read today to start'}
            rgb="255,113,108"
          />
        </div>

        {/* ── Focus time over days (30d) ── */}
        <section
          className="space-y-4"
          style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 160ms forwards' }}
        >
          <div>
            <h2 className={SECTION_LABEL}>Focus time</h2>
            <p className={SECTION_SUBLABEL + ' mt-1'}>
              Minutes of active learning per day, last 30 days.
            </p>
          </div>
          <div className={CARD}>
            <div className="grid grid-cols-3 gap-4 pb-5 mb-5 border-b border-white/[0.05]">
              <StatBlock
                label="This month"
                value={formatHrs(dailyFocus.total).text}
                rgb="153,247,255"
              />
              <StatBlock
                label="Daily avg"
                value={dailyFocus.avgPerActive > 0 ? `${dailyFocus.avgPerActive}m` : '—'}
                sub={dailyFocus.activeDays > 0 ? `${dailyFocus.activeDays} active day${dailyFocus.activeDays === 1 ? '' : 's'}` : undefined}
                rgb="255,255,255"
                faded
              />
              <StatBlock
                label="Best day"
                value={dailyFocus.best && dailyFocus.best.minutes > 0 ? `${dailyFocus.best.minutes}m` : '—'}
                sub={hydrated && dailyFocus.best && dailyFocus.best.minutes > 0 ? dailyFocus.best.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : undefined}
                rgb="255,201,101"
              />
            </div>
            <FocusAreaChart days={dailyFocus.days} max={dailyFocus.max} />
          </div>
        </section>

        {/* ── Consistency heatmap ── */}
        <section
          className="space-y-4"
          style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 240ms forwards' }}
        >
          <div>
            <h2 className={SECTION_LABEL}>Consistency</h2>
            <p className={SECTION_SUBLABEL + ' mt-1'}>
              Each cell is one day over the last 12 weeks. Deeper cyan means more minutes.
            </p>
          </div>
          <div className={CARD + ' overflow-x-auto'}>
            <div className="flex gap-3 min-w-[560px]">
              {/* Weekday labels */}
              <div className="flex flex-col gap-[3px] pt-[14px] text-[9px] text-on-surface-variant/30 tabular-nums">
                <span style={{ height: 14 }}>Mon</span>
                <span style={{ height: 14 }} />
                <span style={{ height: 14 }}>Wed</span>
                <span style={{ height: 14 }} />
                <span style={{ height: 14 }}>Fri</span>
                <span style={{ height: 14 }} />
                <span style={{ height: 14 }}>Sun</span>
              </div>
              {/* Grid */}
              <div className="flex-1">
                {/* Month labels */}
                <div className="flex gap-[3px] mb-1 text-[10px] text-on-surface-variant/40">
                  {heatmap.weeks.map((_, wi) => {
                    const month = heatmap.monthLabels.find((m) => m.col === wi);
                    return (
                      <div key={wi} className="flex-1 text-left" suppressHydrationWarning>
                        {hydrated && month ? month.label : ''}
                      </div>
                    );
                  })}
                </div>
                {/* Cells */}
                <div className="flex gap-[3px]">
                  {heatmap.weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[3px] flex-1">
                      {week.map((day) => {
                        const intensity = day.minutes / heatmap.max;
                        return (
                          <div
                            key={day.key}
                            className="rounded-[3px]"
                            style={{
                              height: 14,
                              backgroundColor: day.isFuture
                                ? 'transparent'
                                : day.minutes === 0
                                  ? 'rgba(255,255,255,0.035)'
                                  : `rgba(153,247,255,${0.18 + intensity * 0.65})`,
                              boxShadow: day.minutes > 0 ? `0 0 ${Math.round(intensity * 5)}px rgba(153,247,255,${intensity * 0.35})` : 'none',
                            }}
                            title={hydrated && !day.isFuture ? `${day.label} · ${day.minutes}m` : undefined}
                            suppressHydrationWarning
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-on-surface-variant/40">
              <span>0m</span>
              {[0, 0.2, 0.4, 0.7, 1].map((v, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-[3px]"
                  style={{ backgroundColor: v === 0 ? 'rgba(255,255,255,0.035)' : `rgba(153,247,255,${0.18 + v * 0.65})` }}
                />
              ))}
              <span>{heatmap.max}m+</span>
            </div>
          </div>
        </section>

        {/* ── Completed sessions ── */}
        <section
          className="space-y-4"
          style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 320ms forwards' }}
        >
          <div>
            <h2 className={SECTION_LABEL}>Completed sessions</h2>
            <p className={SECTION_SUBLABEL + ' mt-1'}>
              Chapters you&apos;ve read end-to-end. Each one locks a module into your track.
            </p>
          </div>
          <div className={CARD}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-5 mb-5 border-b border-white/[0.05]">
              <StatBlock
                label="Completed"
                value={completedStats.count.toString()}
                sub={completedStats.topicsCompleted > 0 ? `across ${completedStats.topicsCompleted} topic${completedStats.topicsCompleted === 1 ? '' : 's'}` : undefined}
                rgb="153,247,255"
              />
              <StatBlock
                label="Time in chapters"
                value={completedStats.totalMinutes > 0 ? formatHrs(completedStats.totalMinutes).text : '—'}
                sub={completedStats.count > 0 ? 'total active read time' : undefined}
                rgb="255,255,255"
                faded
              />
              <StatBlock
                label="Avg per chapter"
                value={completedStats.avgMinutes > 0 ? `${completedStats.avgMinutes}m` : '—'}
                sub={completedStats.count > 1 ? 'average finish time' : undefined}
                rgb="255,201,101"
              />
              <StatBlock
                label="Fastest · Longest"
                value={completedStats.count > 0 ? `${completedStats.fastestMinutes}m · ${completedStats.longestMinutes}m` : '—'}
                sub={completedStats.count >= 2 ? 'personal range' : undefined}
                rgb="255,113,108"
              />
            </div>

            {/* Session mode distribution */}
            <div className="pb-5 mb-5 border-b border-white/[0.05]">
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <p className="text-[10px] font-mono font-bold text-on-surface-variant/60 uppercase tracking-[0.18em]">
                  By session mode
                </p>
                <p className="text-[10px] text-on-surface-variant/40">
                  {completedStats.inferredCount > 0
                    ? `${completedStats.inferredCount} legacy session${completedStats.inferredCount === 1 ? '' : 's'} estimated by duration`
                    : 'recorded when you started each session'}
                </p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <ModeChip
                  icon={<Zap size={14} />}
                  label="Sprint"
                  hint="focused burst"
                  count={completedStats.modes.sprint}
                  total={completedStats.count}
                  rgb="153,247,255"
                />
                <ModeChip
                  icon={<Clock3 size={14} />}
                  label="Pomodoro"
                  hint="work · break cycles"
                  count={completedStats.modes.pomodoro}
                  total={completedStats.count}
                  rgb="255,113,108"
                />
                <ModeChip
                  icon={<Brain size={14} />}
                  label="Deep focus"
                  hint="long immersion"
                  count={completedStats.modes.deep}
                  total={completedStats.count}
                  rgb="191,129,255"
                />
                <ModeChip
                  icon={<BookOpen size={14} />}
                  label="Free read"
                  hint="no timer"
                  count={completedStats.modes.free}
                  total={completedStats.count}
                  rgb="255,201,101"
                />
              </div>
            </div>

            {completedStats.recent.length > 0 ? (
              <>
                <p className="text-[10px] font-mono font-bold text-on-surface-variant/60 uppercase tracking-[0.18em] mb-3">
                  Recent completions
                </p>
                <ul className="divide-y divide-white/[0.04]">
                  {completedStats.recent.map((s) => {
                    const topicMeta = getHomeTopicMeta(s.topic);
                    return (
                      <li key={s.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                        <Image
                          src={TOPIC_ICON[s.topic] ?? '/brand/pyspark-track-star.svg'}
                          alt={topicMeta.label}
                          width={18}
                          height={18}
                          className="opacity-70 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-on-surface/85 truncate">
                            {topicMeta.label} <span className="text-on-surface-variant/50">· Chapter {s.chapterNumber}</span>
                          </p>
                        </div>
                        <span className="text-[11px] tabular-nums text-on-surface-variant/60 shrink-0">
                          {Math.max(1, Math.round(s.activeSeconds / 60))}m
                        </span>
                        <span
                          className="text-[11px] tabular-nums text-on-surface-variant/40 shrink-0 w-[70px] text-right"
                          suppressHydrationWarning
                        >
                          {hydrated ? formatRelativeDate(s.completedAt ?? s.lastActiveAt, Date.now()) : ''}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <p className="text-[13px] text-on-surface-variant/50 text-center py-4">
                Finish any chapter to see your completions list here.
              </p>
            )}
          </div>
        </section>

        {/* ── Topic mastery ── */}
        <section
          className="space-y-4"
          style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 400ms forwards' }}
        >
          <div>
            <h2 className={SECTION_LABEL}>Topic mastery</h2>
            <p className={SECTION_SUBLABEL + ' mt-1'}>
              Each bar is split into three tracks. Cyan Junior, amber Mid, coral Senior.
            </p>
          </div>
          {topicMastery.length === 0 ? (
            <div className={CARD + ' text-center py-10'}>
              <p className="text-[13px] text-on-surface-variant/50">
                Start reading any topic to see mastery here.
              </p>
              <Link
                href="/learn"
                className="inline-block mt-3 text-[12px] text-primary hover:underline"
              >
                Browse topics →
              </Link>
            </div>
          ) : (
            <div className={CARD + ' divide-y divide-white/[0.04]'}>
              {topicMastery.map((topic) => {
                const tracksTotal = topic.levels.reduce((s, l) => s + l.total, 0);
                const tracksDone = topic.levels.reduce((s, l) => s + l.done, 0);
                return (
                  <Link
                    key={topic.topicId}
                    href={`/learn/${topic.topicId}/theory`}
                    className="flex items-center gap-4 py-3 first:pt-1 last:pb-1 group"
                  >
                    <Image
                      src={TOPIC_ICON[topic.topicId] ?? '/brand/pyspark-track-star.svg'}
                      alt={topic.label}
                      width={22}
                      height={22}
                      className="opacity-70 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3 mb-1.5">
                        <span className="text-[13px] font-medium text-on-surface/85 truncate group-hover:text-on-surface transition-colors">
                          {topic.label}
                        </span>
                        <span className="text-[11px] tabular-nums text-on-surface-variant/55 shrink-0">
                          {tracksDone}/{tracksTotal} · {formatHrs(topic.minutes).text}
                        </span>
                      </div>
                      <TrackSegmentBar levels={topic.levels} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Milestones ── */}
        <section
          className="space-y-4"
          style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 480ms forwards' }}
        >
          <div>
            <h2 className={SECTION_LABEL}>Milestones</h2>
            <p className={SECTION_SUBLABEL + ' mt-1'}>
              Earn these as your hours and modules add up.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {milestones.map((m) => (m.earned ? (
              <EarnedMilestone key={m.id} label={m.label} sub={m.sub} />
            ) : (
              <LockedMilestone key={m.id} label={m.label} sub={m.sub} progress={m.progress} />
            )))}
          </div>
        </section>

        {/* ── Footer note ── */}
        <p className="text-[12px] text-on-surface-variant/65 text-center pt-4 leading-relaxed">
          Time is measured as active seconds within reading sessions. Lessons count unique entries across the library.
        </p>

      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Kpi({
  label, value, unit, delta, sub, rgb,
}: {
  label: string;
  value: string;
  unit: string;
  delta: number | null;
  sub: string;
  rgb: string;
}) {
  const TrendIcon = delta == null ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta == null ? null : delta > 0 ? 'rgba(153,247,255,0.8)' : delta < 0 ? 'rgba(255,113,108,0.8)' : 'rgba(255,255,255,0.3)';

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-mono font-medium text-on-surface-variant/45 uppercase tracking-[0.16em]">
          {label}
        </p>
        {TrendIcon && delta != null && (
          <span className="inline-flex items-center gap-1 text-[10px] tabular-nums" style={{ color: trendColor ?? undefined }}>
            <TrendIcon size={11} />
            {delta > 0 ? '+' : ''}{delta}%
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5" style={{ fontFamily: APPLE_FONT }}>
        <span
          className="tabular-nums"
          style={{
            fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
            fontWeight: 500,
            letterSpacing: '-0.03em',
            color: `rgb(${rgb})`,
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <span className="text-[11px] text-on-surface-variant/35">{unit}</span>
      </div>
      <p className="text-[11px] text-on-surface-variant/40 mt-2 tabular-nums">{sub}</p>
    </div>
  );
}

function StatBlock({
  label, value, sub, rgb, faded,
}: {
  label: string;
  value: string;
  sub?: string;
  rgb: string;
  faded?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-mono font-bold text-on-surface-variant/70 uppercase tracking-[0.18em]">
        {label}
      </p>
      <p
        className="text-[22px] font-semibold tabular-nums mt-1.5 leading-none"
        style={{
          color: faded ? 'rgba(255,255,255,0.9)' : `rgb(${rgb})`,
          fontFamily: APPLE_FONT,
          letterSpacing: '-0.025em',
        }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-on-surface-variant/55 tabular-nums mt-1">
          {sub}
        </p>
      )}
    </div>
  );
}


/* ── Mode chip (completed sessions) ── */

function ModeChip({
  icon, label, hint, count, total, rgb,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  count: number;
  total: number;
  rgb: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const active = count > 0;
  return (
    <div
      className="relative rounded-[12px] p-3 overflow-hidden"
      style={{
        backgroundColor: active ? `rgba(${rgb}, 0.06)` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${active ? `rgba(${rgb}, 0.22)` : 'rgba(255,255,255,0.05)'}`,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5" style={{ color: active ? `rgba(${rgb}, 0.9)` : 'rgba(255,255,255,0.3)' }}>
        {icon}
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.16em]">{label}</span>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span
          className="tabular-nums"
          style={{
            fontFamily: APPLE_FONT,
            fontSize: '1.35rem',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: active ? `rgb(${rgb})` : 'rgba(255,255,255,0.35)',
            lineHeight: 1,
          }}
        >
          {count}
        </span>
        <span className="text-[10px] text-on-surface-variant/40 tabular-nums">{hint}</span>
      </div>
      {/* Share-of-total bar */}
      <div className="h-[3px] rounded-full bg-white/[0.04] mt-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: `rgba(${rgb}, 0.7)`,
            boxShadow: active ? `0 0 5px rgba(${rgb}, 0.35)` : 'none',
          }}
        />
      </div>
    </div>
  );
}

/* ── Tier segment bar ── */

const TIER_COLORS: Record<string, { from: string; to: string; glow: string }> = {
  junior: { from: 'rgba(153,247,255,0.55)', to: 'rgba(153,247,255,0.95)', glow: 'rgba(153,247,255,0.4)' },
  mid:    { from: 'rgba(255,201,101,0.55)', to: 'rgba(255,201,101,0.95)', glow: 'rgba(255,201,101,0.4)' },
  senior: { from: 'rgba(255,113,108,0.55)', to: 'rgba(255,113,108,0.95)', glow: 'rgba(255,113,108,0.4)' },
};

const TIER_LABEL: Record<string, string> = { junior: 'Jr', mid: 'Mid', senior: 'Sr' };

function TrackSegmentBar({
  levels,
}: {
  levels: Array<{ slug: string; status: string; done: number; total: number }>;
}) {
  return (
    <div className="flex items-center gap-[3px]">
      {levels.map((lvl) => {
        const c = TIER_COLORS[lvl.slug] ?? TIER_COLORS.junior;
        const pct = lvl.total > 0 ? (lvl.done / lvl.total) * 100 : 0;
        const isEmpty = lvl.status === 'empty';
        return (
          <div
            key={lvl.slug}
            className="relative flex-1 h-[5px] rounded-full overflow-hidden"
            title={isEmpty ? `${TIER_LABEL[lvl.slug]} — not available` : `${TIER_LABEL[lvl.slug]} — ${lvl.done}/${lvl.total}`}
            style={{
              backgroundColor: isEmpty ? 'transparent' : 'rgba(255,255,255,0.05)',
              backgroundImage: isEmpty
                ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 3px, transparent 3px 6px)'
                : undefined,
            }}
          >
            {!isEmpty && pct > 0 && (
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${c.from}, ${c.to})`,
                  boxShadow: `0 0 6px ${c.glow}`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Milestone cards ── */

function EarnedMilestone({ label, sub }: { label: string; sub: string }) {
  return (
    <div
      className="relative rounded-[16px] p-4 overflow-hidden"
      style={{
        background:
          'radial-gradient(130% 100% at 50% -30%, rgba(153,247,255,0.22) 0%, rgba(153,247,255,0.05) 45%, rgba(24,28,32,1) 90%)',
        border: '1px solid rgba(153,247,255,0.32)',
        boxShadow:
          '0 0 0 1px rgba(153,247,255,0.08), 0 10px 28px -10px rgba(153,247,255,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {/* Top hairline shimmer */}
      <span
        aria-hidden
        className="absolute top-0 left-[12%] right-[12%] h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(153,247,255,0.7) 50%, transparent 100%)',
        }}
      />
      {/* Soft bottom vignette */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-[16px] pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 60% at 50% 120%, rgba(0,0,0,0.35) 0%, transparent 60%)',
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 size={12} style={{ color: 'rgba(153,247,255,0.9)' }} />
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-[0.18em]"
              style={{ color: 'rgba(153,247,255,0.85)' }}
            >
              Earned
            </span>
          </div>
          <p className="text-[13px] font-semibold text-on-surface leading-snug">
            {label}
          </p>
          <p className="text-[11px] mt-1 tabular-nums" style={{ color: 'rgba(153,247,255,0.55)' }}>
            {sub}
          </p>
        </div>

        {/* Medallion */}
        <div
          className="relative shrink-0 flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35) 0%, rgba(153,247,255,0.6) 30%, rgba(70,180,200,1) 75%, rgba(40,120,140,1) 100%)',
            boxShadow:
              '0 0 0 1px rgba(153,247,255,0.4), 0 0 18px rgba(153,247,255,0.45), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.3)',
          }}
        >
          <Trophy size={16} style={{ color: 'rgba(10,20,25,0.85)' }} strokeWidth={2.5} />
          {/* Sheen */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                'linear-gradient(145deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 45%)',
              mixBlendMode: 'screen',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function LockedMilestone({ label, sub, progress }: { label: string; sub: string; progress?: number }) {
  return (
    <div
      className="rounded-[16px] p-4 border"
      style={{
        backgroundColor: '#181c20',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Lock size={12} className="text-on-surface-variant/30" />
        <span className="text-[10px] font-mono font-medium uppercase tracking-[0.18em] text-on-surface-variant/30">
          Locked
        </span>
      </div>
      <p className="text-[13px] font-semibold text-on-surface/70 leading-snug">
        {label}
      </p>
      <p className="text-[11px] text-on-surface-variant/40 mt-1 tabular-nums">
        {sub}
      </p>
      {typeof progress === 'number' && (
        <div className="h-[3px] rounded-full bg-white/[0.05] overflow-hidden mt-3">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: 'rgba(153,247,255,0.4)',
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Focus area chart ── */

function FocusAreaChart({
  days, max,
}: {
  days: Array<{ key: string; date: Date; minutes: number }>;
  max: number;
}) {
  // Dates are formatted via toLocaleDateString, which can differ between server
  // and client timezones. Gate date-dependent text behind a mount flag to avoid
  // hydration mismatch.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const w = 600;
  const h = 140;
  const padX = 4;
  const padY = 10;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const stepX = innerW / Math.max(1, days.length - 1);
  const safeMax = Math.max(max, 10);

  const points = days.map((d, i) => {
    const x = padX + i * stepX;
    const y = padY + innerH - (d.minutes / safeMax) * innerH;
    return { x, y, d };
  });

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const areaPath = `${path} L ${padX + innerW} ${padY + innerH} L ${padX} ${padY + innerH} Z`;

  // X-axis labels: show every ~7 days
  const labelIdx = [0, 7, 14, 21, days.length - 1].filter((i) => i < days.length);

  // Gridlines — 3 horizontal
  const gridYs = [0.25, 0.5, 0.75].map((f) => padY + innerH - f * innerH);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-[140px]"
        preserveAspectRatio="none"
        role="img"
        aria-label="Daily focus time over the last 30 days"
      >
        <defs>
          <linearGradient id="focusArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(153,247,255,0.4)" />
            <stop offset="100%" stopColor="rgba(153,247,255,0)" />
          </linearGradient>
        </defs>
        {/* Gridlines */}
        {gridYs.map((y, i) => (
          <line key={i} x1={padX} x2={w - padX} y1={y} y2={y} stroke="rgba(255,255,255,0.04)" strokeDasharray="2 3" />
        ))}
        {/* Area */}
        <path d={areaPath} fill="url(#focusArea)" />
        {/* Line */}
        <path d={path} fill="none" stroke="rgba(153,247,255,0.85)" strokeWidth={1.5} />
        {/* Dots for days with activity */}
        {points.map((p, i) => {
          if (p.d.minutes === 0) return null;
          const isLast = i === points.length - 1;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={isLast ? 3 : 2}
              fill={isLast ? '#99f7ff' : 'rgba(153,247,255,0.7)'}
              style={isLast ? { filter: 'drop-shadow(0 0 4px rgba(153,247,255,0.6))' } : undefined}
            >
              {hydrated && (
                <title>{p.d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {p.d.minutes}m</title>
              )}
            </circle>
          );
        })}
      </svg>
      <div className="flex justify-between mt-2 text-[10px] text-on-surface-variant/30 tabular-nums">
        {labelIdx.map((i) => (
          <span key={i} suppressHydrationWarning>
            {hydrated ? days[i].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
