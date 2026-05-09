'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import type { ReadingSession, Topic, TopicProgress } from '@/types/progress';
import type { ReadingSignal } from '@/components/home/home/WeeklyActivityCard';
import type { TrackMetaByTopic } from '@/lib/learn/theoryTrackMeta';
import { useProgressStore } from '@/lib/stores/useProgressStore';

interface HomeDashboardProps {
  user: User;
  displayName: string | null;
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
  learnHref: string;
  learnLabel: string;
  practiceHref: string;
  practiceLabel: string;
  gridHint: { componentName: string; costKwh: number } | null;
}

const formatRelativeTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '—';
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface ActivityRow {
  key: string;
  icon: string;
  label: string;
  timestamp: string | null;
  highlight?: boolean;
}

const CellIllustration = () => (
  <div className="grid grid-cols-4 grid-rows-4 border-t border-l border-on-surface w-[96px] h-[96px] shrink-0">
    <div className="border-b border-r border-on-surface bg-on-surface" />
    <div className="border-b border-r border-on-surface bg-on-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-primary flex items-center justify-center">
      <span className="material-symbols-outlined text-[16px] text-on-primary">brightness_5</span>
    </div>
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
  </div>
);

/* ── Generation chart ─────────────────────────────────────────────────────────
 * Reads `energyEvents` from the progress store and renders a cumulative kWh
 * line for the selected range. Range tabs at the top right switch between:
 *   - Today  (06:00 → 22:00, hours on the X axis)
 *   - 7d     (last 7 days, calendar days on the X axis)
 *   - 30d    (last 30 days, calendar days on the X axis)
 *   - All    (lifetime: from first event to now, calendar days)
 *
 * Multi-day views still show the cumulative kWh curve (lifetime accrual within
 * the selected window) — same metaphor as Today, just zoomed out, so the user
 * can see how the streak builds up over time.
 */

const CHART_VIEWBOX_W = 200;
const CHART_VIEWBOX_H = 100;
const CHART_TOP_PAD = 4;
const CHART_BOTTOM_PAD = 3;
const CHART_DAY_START_HOUR = 6;
const CHART_DAY_END_HOUR = 22;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type ChartRange = 'today' | '7d' | '30d' | 'all';
const RANGE_TABS: { id: ChartRange; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: 'all', label: 'All' }
];

const formatHourLabel = (hour: number) =>
  `${String(hour).padStart(2, '0')}:00`;

const formatDayLabel = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const startOfLocalDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const HEADLINE_BY_RANGE: Record<ChartRange, string> = {
  today: 'Generation today',
  '7d': 'Generation · last 7 days',
  '30d': 'Generation · last 30 days',
  all: 'Generation · all time'
};

const EMPTY_BY_RANGE: Record<ChartRange, string> = {
  today: 'No generation yet today',
  '7d': 'No generation in the last 7 days',
  '30d': 'No generation in the last 30 days',
  all: 'No generation logged yet'
};

interface ChartPoint {
  x: number;
  y: number;
  timestamp: number;
  units: number;
  cumulative: number;
  label?: string;
}

const formatPointTooltipTime = (range: ChartRange, ts: number) => {
  const d = new Date(ts);
  if (range === 'today') {
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const SOURCE_LABELS: Record<string, string> = {
  'flashcard-correct': 'Flashcard correct',
  'streak-milestone': 'Streak milestone',
  'chapter-complete': 'Chapter complete',
  'lesson-read': 'Lesson read',
  'practice-task': 'Practice task',
  'practice-module-complete': 'Practice module',
  'track-complete': 'Track complete',
  mission: 'Mission',
  'infrastructure-deploy': 'Infrastructure',
  manual: 'Manual credit'
};

const ChartTooltip = ({
  point,
  range,
  total
}: {
  point: ChartPoint;
  range: ChartRange;
  total: number;
}) => {
  // Flip horizontally so the tooltip stays inside the plot area near edges.
  const xPct = (point.x / CHART_VIEWBOX_W) * 100;
  const flipsLeft = xPct > 60;
  const yPct = (point.y / CHART_VIEWBOX_H) * 100;
  const sharePct = total > 0 ? Math.round((point.cumulative / total) * 100) : 0;

  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 min-w-[10rem] border border-on-surface/15 bg-surface px-3 py-2 shadow-[0_12px_24px_-12px_rgba(0,0,0,0.35)]"
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: `translate(${flipsLeft ? 'calc(-100% - 10px)' : '10px'}, -50%)`
      }}
    >
      <div className="font-data-mono text-[9px] uppercase tracking-[0.18em] text-on-surface-variant">
        {formatPointTooltipTime(range, point.timestamp)}
      </div>
      <div className="mt-1 font-serif text-[18px] leading-none tabular-nums text-primary">
        +{point.units.toLocaleString()}
        <span className="text-[11px] text-on-surface-variant ml-1">kWh</span>
      </div>
      {point.label && (
        <div className="mt-1 font-body text-[12px] text-on-surface leading-snug">
          {point.label}
        </div>
      )}
      <div className="mt-2 pt-2 border-t border-surface-dim flex items-center justify-between gap-3 font-data-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">
        <span>Cumulative</span>
        <span className="tabular-nums text-on-surface">
          {point.cumulative.toLocaleString()} kWh
          <span className="text-on-surface-variant ml-1">· {sharePct}%</span>
        </span>
      </div>
    </div>
  );
};

const GenerationChart = () => {
  const energyEvents = useProgressStore((state) => state.energyEvents);
  const [range, setRange] = useState<ChartRange>('today');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const {
    totalKwh,
    points,
    hasEvents,
    axisLabels
  } = useMemo<{
    totalKwh: number;
    points: ChartPoint[];
    hasEvents: boolean;
    axisLabels: { left: string; mid: string; right: string };
  }>(() => {
    const now = Date.now();
    const sortedEvents = [...energyEvents].sort((a, b) => a.timestamp - b.timestamp);

    if (range === 'today') {
      const startOfDay = startOfLocalDay(now);
      const endOfDay = startOfDay + MS_PER_DAY;
      const today = sortedEvents.filter(
        (event) => event.timestamp >= startOfDay && event.timestamp < endOfDay
      );
      const total = today.reduce((sum, event) => sum + event.units, 0);
      const labels = {
        left: formatHourLabel(CHART_DAY_START_HOUR),
        mid: formatHourLabel(
          CHART_DAY_START_HOUR + Math.floor((CHART_DAY_END_HOUR - CHART_DAY_START_HOUR) / 2)
        ),
        right: formatHourLabel(CHART_DAY_END_HOUR)
      };
      if (today.length === 0) {
        return { totalKwh: 0, points: [], hasEvents: false, axisLabels: labels };
      }
      const windowStartMin = CHART_DAY_START_HOUR * 60;
      const windowEndMin = CHART_DAY_END_HOUR * 60;
      const minutesInWindow = windowEndMin - windowStartMin;
      let cumulative = 0;
      const series = today.map<ChartPoint>((event) => {
        cumulative += event.units;
        const minute = (event.timestamp - startOfDay) / 60000;
        const clamped = Math.max(windowStartMin, Math.min(windowEndMin, minute));
        const x = ((clamped - windowStartMin) / minutesInWindow) * CHART_VIEWBOX_W;
        const y =
          CHART_VIEWBOX_H -
          (cumulative / total) * (CHART_VIEWBOX_H - CHART_TOP_PAD - CHART_BOTTOM_PAD) -
          CHART_BOTTOM_PAD;
        return {
          x,
          y,
          timestamp: event.timestamp,
          units: event.units,
          cumulative,
          label: event.label ?? SOURCE_LABELS[event.source] ?? event.source
        };
      });
      return { totalKwh: total, points: series, hasEvents: true, axisLabels: labels };
    }

    // Multi-day ranges
    const todayStart = startOfLocalDay(now);
    const lifetimeStart = sortedEvents.length > 0
      ? startOfLocalDay(sortedEvents[0].timestamp)
      : todayStart;
    const startTs = (() => {
      if (range === '7d') return todayStart - 6 * MS_PER_DAY;
      if (range === '30d') return todayStart - 29 * MS_PER_DAY;
      return lifetimeStart;
    })();
    const endTs = todayStart + MS_PER_DAY;
    const inRange = sortedEvents.filter(
      (event) => event.timestamp >= startTs && event.timestamp < endTs
    );
    const total = inRange.reduce((sum, event) => sum + event.units, 0);
    const labels = {
      left: formatDayLabel(startTs),
      mid: formatDayLabel((startTs + (endTs - MS_PER_DAY)) / 2),
      right: formatDayLabel(endTs - MS_PER_DAY)
    };
    if (inRange.length === 0) {
      return { totalKwh: 0, points: [], hasEvents: false, axisLabels: labels };
    }
    const spanMs = endTs - startTs;
    let cumulative = 0;
    const series = inRange.map<ChartPoint>((event) => {
      cumulative += event.units;
      const x = ((event.timestamp - startTs) / spanMs) * CHART_VIEWBOX_W;
      const y =
        CHART_VIEWBOX_H -
        (cumulative / total) * (CHART_VIEWBOX_H - CHART_TOP_PAD - CHART_BOTTOM_PAD) -
        CHART_BOTTOM_PAD;
      return {
        x,
        y,
        timestamp: event.timestamp,
        units: event.units,
        cumulative,
        label: event.label ?? SOURCE_LABELS[event.source] ?? event.source
      };
    });
    return { totalKwh: total, points: series, hasEvents: true, axisLabels: labels };
  }, [energyEvents, range]);

  const baselineY = CHART_VIEWBOX_H - CHART_BOTTOM_PAD;
  const linePath = useMemo(() => {
    if (!hasEvents || points.length === 0) return '';
    const segments = [`M 0 ${baselineY}`];
    for (const point of points) {
      segments.push(`L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`);
    }
    const last = points[points.length - 1];
    segments.push(`L ${CHART_VIEWBOX_W} ${last.y.toFixed(2)}`);
    return segments.join(' ');
  }, [hasEvents, points, baselineY]);

  const fillPath = useMemo(() => {
    if (!hasEvents || points.length === 0) return '';
    return `${linePath} L ${CHART_VIEWBOX_W} ${baselineY} L 0 ${baselineY} Z`;
  }, [hasEvents, linePath, points.length, baselineY]);

  return (
    <section className="border border-on-surface bg-surface p-8 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8 border-b border-surface-dim pb-3">
        <h3 className="font-ui-label text-on-surface uppercase tracking-wider text-[12px]">
          {HEADLINE_BY_RANGE[range]}
        </h3>
        <div className="flex items-center gap-4">
          <span className="font-data-mono text-primary text-[13px] tabular-nums">
            +{totalKwh.toFixed(1)} kWh
          </span>
          <div role="tablist" aria-label="Chart range" className="flex items-center gap-1 border border-on-surface/15">
            {RANGE_TABS.map((tab) => {
              const isActive = tab.id === range;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setRange(tab.id)}
                  className={`font-data-mono text-[10px] uppercase tracking-[0.16em] px-2.5 py-1 transition-colors ${
                    isActive
                      ? 'bg-on-surface text-surface'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex-1 relative min-h-[220px] pl-7 pr-1 pt-2 pb-7">
        <div className="absolute left-0 top-2 font-data-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">
          Max
        </div>
        <div className="absolute left-0 bottom-7 font-data-mono text-[10px] tabular-nums text-on-surface-variant">
          0
        </div>

        <div
          className="relative h-full w-full border-l border-b border-on-surface/15"
          onMouseMove={(event) => {
            if (!hasEvents || points.length === 0) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const ratio = (event.clientX - rect.left) / rect.width;
            const cursorX = ratio * CHART_VIEWBOX_W;
            // Snap to the nearest event by horizontal distance.
            let nearest = 0;
            let bestDist = Number.POSITIVE_INFINITY;
            for (let i = 0; i < points.length; i++) {
              const dist = Math.abs(points[i].x - cursorX);
              if (dist < bestDist) {
                bestDist = dist;
                nearest = i;
              }
            }
            setHoveredIndex(nearest);
          }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${CHART_VIEWBOX_W} ${CHART_VIEWBOX_H}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            <line
              x1={0}
              x2={CHART_VIEWBOX_W}
              y1={baselineY}
              y2={baselineY}
              stroke="currentColor"
              strokeWidth={0.4}
              className="text-on-surface/15"
              vectorEffect="non-scaling-stroke"
            />
            {hasEvents && (
              <>
                <path d={fillPath} fill="rgb(163,56,0)" fillOpacity={0.08} />
                <path
                  d={linePath}
                  fill="none"
                  stroke="rgb(163,56,0)"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            )}
            {/* Vertical scrub line at hovered point */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <line
                x1={points[hoveredIndex].x}
                x2={points[hoveredIndex].x}
                y1={0}
                y2={CHART_VIEWBOX_H}
                stroke="currentColor"
                strokeWidth={0.6}
                strokeDasharray="2 2"
                className="text-on-surface/30"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* Event dots — render only when there are few enough to read.
              Dense multi-day views skip the dots so the line stays clean. */}
          {hasEvents && points.length <= 32 &&
            points.map((point, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <span
                  key={idx}
                  aria-hidden
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-surface bg-primary transition-all pointer-events-none ${
                    isHovered ? 'h-3 w-3 ring-2 ring-primary/30' : 'h-2 w-2'
                  }`}
                  style={{
                    left: `${(point.x / CHART_VIEWBOX_W) * 100}%`,
                    top: `${(point.y / CHART_VIEWBOX_H) * 100}%`
                  }}
                />
              );
            })}

          {/* Tooltip — pinned above the hovered point, flips to the other side
              of the cursor near the chart edges so it never clips off-screen. */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <ChartTooltip
              point={points[hoveredIndex]}
              range={range}
              total={totalKwh}
            />
          )}

          {!hasEvents && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/60 text-center">
                {EMPTY_BY_RANGE[range]}
                <span className="block mt-1 text-on-surface-variant/40 normal-case tracking-normal">
                  Read a lesson or pass a checkpoint to start charging.
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="absolute left-7 right-1 -bottom-0 flex justify-between font-data-mono text-[10px] tabular-nums text-on-surface-variant">
          <span>{axisLabels.left}</span>
          <span>{axisLabels.mid}</span>
          <span>{axisLabels.right}</span>
        </div>
      </div>
    </section>
  );
};

export const HomeDashboard = ({
  user,
  displayName,
  topicProgress: _topicProgress,
  recentSessions: _recentSessions,
  completedSessions,
  latestTheorySession,
  lastClockedInAt,
  latestTaskAction: _latestTaskAction,
  readingSignals: _readingSignals,
  trackMetaByTopic: _trackMetaByTopic,
  stats,
  resumeContext,
  learnHref,
  learnLabel,
  practiceHref: _practiceHref,
  practiceLabel: _practiceLabel,
  gridHint,
}: HomeDashboardProps) => {
  const firstName = (
    displayName ??
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ?? 'Operator'
  ).split(' ')[0];

  const nextUp = useMemo(() => {
    if (latestTheorySession && resumeContext?.chapterTitle) {
      return {
        moduleNumber: latestTheorySession.chapterNumber
          ? `Module ${latestTheorySession.chapterNumber}`
          : latestTheorySession.chapterId.replace(/^module-/i, 'Module '),
        title: resumeContext.lessonTitle || resumeContext.chapterTitle,
        summary: resumeContext.lessonTitle
          ? `Continue ${resumeContext.chapterTitle}.`
          : 'Pick up where you left off.',
        ctaLabel: 'Resume Lesson',
      };
    }
    return {
      moduleNumber: 'Module 1.1',
      title: 'PySpark — Your first DataFrame',
      summary:
        'Start with the building block. Read a CSV, inspect its schema, run your first transformation.',
      ctaLabel: 'Begin first lesson',
    };
  }, [latestTheorySession, resumeContext]);

  const activityRows = useMemo<ActivityRow[]>(() => {
    const rows: ActivityRow[] = [];
    if (stats.currentStreak >= 7) {
      rows.push({
        key: 'streak',
        icon: 'bolt',
        label: `${stats.currentStreak} day streak achieved`,
        timestamp: lastClockedInAt,
        highlight: true,
      });
    }
    if (stats.totalXp >= 10000 && stats.totalXp < 30000) {
      rows.push({ key: 'tier-mid', icon: 'emoji_events', label: 'Mid tier reached', timestamp: lastClockedInAt, highlight: true });
    } else if (stats.totalXp >= 30000) {
      rows.push({ key: 'tier-senior', icon: 'emoji_events', label: 'Senior tier reached', timestamp: lastClockedInAt, highlight: true });
    }
    completedSessions.slice(0, 4).forEach((session) => {
      rows.push({
        key: `lesson-${session.id}`,
        icon: 'check_circle',
        label: `Completed ${session.chapterId.replace(/^module-/i, 'Module ')}`,
        timestamp: session.completedAt ?? session.lastActiveAt,
      });
    });
    if (rows.length === 0) {
      rows.push({ key: 'welcome', icon: 'login', label: `Welcome to StableGrid, ${firstName}`, timestamp: lastClockedInAt });
    }
    return rows.slice(0, 5);
  }, [completedSessions, stats.currentStreak, stats.totalXp, lastClockedInAt, firstName]);

  return (
    <main className="bg-surface bg-grid-pattern min-h-[calc(100dvh-4rem)]">
      <div className="max-w-[1440px] mx-auto px-12 py-12 flex flex-col gap-12">
        <header className="border-b border-on-surface pb-6">
          <h1 className="font-h1 text-h1 text-on-surface">
            Welcome back, {firstName}.
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="border border-on-surface bg-surface p-8 relative flex flex-col">
            <div className="absolute top-0 right-0 border-l border-b border-on-surface px-2 py-1 font-ui-label text-[10px] text-on-surface uppercase tracking-wider bg-surface">
              NEXTUP
            </div>
            <div className="flex gap-6 mt-2">
              <CellIllustration />
              <div className="flex flex-col">
                <div className="font-data-mono text-on-surface-variant text-[13px] mb-1">
                  {nextUp.moduleNumber}
                </div>
                <h2 className="font-h2 text-h2 text-on-surface leading-tight mb-4">
                  {nextUp.title}
                </h2>
                <p className="font-body-lg text-on-surface-variant mb-6 leading-relaxed">
                  {nextUp.summary}
                </p>
                <Link
                  href={learnHref}
                  className="bg-primary text-on-primary font-ui-label uppercase tracking-wider text-[14px] px-6 py-3 self-start hover:bg-surface-tint transition-colors"
                >
                  {nextUp.ctaLabel === 'Resume Lesson' && learnLabel.startsWith('Continue')
                    ? 'Resume Lesson'
                    : learnLabel}
                </Link>
              </div>
            </div>
          </section>

          <GenerationChart />
        </div>

        <section className="border border-on-surface bg-surface">
          <div className="border-b border-on-surface p-4 bg-surface-container-low">
            <h3 className="font-ui-label text-on-surface uppercase tracking-wider text-[12px]">
              RECENT ACTIVITY LOG
            </h3>
          </div>
          <div className="flex flex-col w-full">
            {activityRows.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between p-4 border-b border-surface-dim last:border-b-0 hover:bg-surface-container-lowest transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 flex items-center justify-center ${
                      row.highlight
                        ? 'border border-on-surface bg-primary-fixed'
                        : 'border border-surface-dim'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[16px] ${row.highlight ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {row.icon}
                    </span>
                  </div>
                  <span className="font-body-lg text-on-surface text-[16px]">
                    {row.label}
                  </span>
                </div>
                <span className="font-data-mono text-on-surface-variant text-[13px] text-right tabular-nums">
                  {formatRelativeTime(row.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {gridHint && (
          <div className="flex items-center justify-between border-t border-surface-dim pt-4">
            <span className="font-body-lg text-on-surface-variant">
              You have enough power to deploy{' '}
              <span className="text-on-surface font-semibold">{gridHint.componentName}</span>.
            </span>
            <Link
              href="/grid"
              className="font-ui-label uppercase tracking-wider text-[12px] text-primary border-b-2 border-primary hover:text-surface-tint hover:border-surface-tint pb-1"
            >
              Open Grid →
            </Link>
          </div>
        )}

        <footer className="mt-8 border-t border-on-surface pt-6 pb-12 flex justify-between items-center">
          <div className="font-ui-label text-on-surface font-bold text-[14px] uppercase tracking-widest">
            StableGrid
          </div>
          <div className="flex gap-6 font-data-mono text-on-surface-variant text-[13px]">
            <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          </div>
        </footer>
      </div>
    </main>
  );
};
