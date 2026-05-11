'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import type { ReadingSession, Topic, TopicProgress } from '@/types/progress';
import type { ReadingSignal } from '@/components/home/home/WeeklyActivityCard';
import type { TrackMetaByTopic } from '@/lib/learn/theoryTrackMeta';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { useHoverPrefetch } from '@/lib/hooks/useHoverPrefetch';
import { usePrefetchData } from '@/lib/hooks/usePrefetchData';
import { TierProgressionPanel } from '@/components/home/home/TierProgressionPanel';
import { BrandCell } from '@/components/brand/BrandCell';
import { getPracticeSet } from '@/data/operations/practice-sets';

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
  units?: number;
  highlight?: boolean;
}

// Source → activity-row presentation. Highlighted sources are the rare,
// celebratory events (track/module completion, streak crossings); the rest
// stack as everyday log entries.
const ACTIVITY_ICON_BY_SOURCE: Record<string, string> = {
  'flashcard-correct': 'task_alt',
  'streak-milestone': 'bolt',
  'chapter-complete': 'verified',
  'lesson-read': 'menu_book',
  'practice-task': 'check_circle',
  'practice-module-complete': 'workspace_premium',
  'track-complete': 'emoji_events',
  mission: 'flag',
  'infrastructure-deploy': 'electrical_services',
  manual: 'add',
};

const ACTIVITY_FALLBACK_LABEL: Record<string, string> = {
  'flashcard-correct': 'Flashcard correct',
  'streak-milestone': 'Streak milestone',
  'chapter-complete': 'Chapter complete',
  'lesson-read': 'Lesson read',
  'practice-task': 'Practice task solved',
  'practice-module-complete': 'Practice module complete',
  'track-complete': 'Track complete',
  mission: 'Mission complete',
  'infrastructure-deploy': 'Infrastructure deployed',
  manual: 'Credit posted',
};

const HIGHLIGHTED_ACTIVITY_SOURCES = new Set<string>([
  'track-complete',
  'practice-module-complete',
  'chapter-complete',
  'streak-milestone',
]);

/**
 * Wraps the shared `BrandCell` so the rest of HomeDashboard keeps reading
 * "<CellIllustration />" without juggling the marker prop. The mid-left
 * vermillion cell ("self" marker) signals the operator's current spot
 * in the curriculum.
 *
 * NB: keep this file's existing `<CellIllustration />` JSX usage stable —
 * call sites elsewhere should use `<BrandCell />` directly so we don't
 * proliferate a private adapter beyond this file.
 */
const CellIllustration = () => <BrandCell marker="self" />;

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
      className="pointer-events-none absolute z-10 w-[min(10rem,calc(100vw-2rem))] sm:w-auto sm:min-w-[10rem] border border-on-surface/15 bg-surface px-3 py-2 shadow-[0_12px_24px_-12px_rgba(0,0,0,0.35)]"
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: `translate(${flipsLeft ? 'calc(-100% - 10px)' : '10px'}, -50%)`
      }}
    >
      <div className="font-data-mono text-[9px] uppercase tracking-[0.18em] text-on-surface-variant">
        {formatPointTooltipTime(range, point.timestamp)}
      </div>
      {/* Cumulative leads — it's the score the operator is actually
          tracking; the per-event gain is the secondary detail below. */}
      <div className="mt-1 font-serif text-[22px] leading-none tabular-nums text-on-surface">
        {point.cumulative.toLocaleString()}
        <span className="font-data-mono text-[11px] uppercase tracking-[0.16em] text-on-surface-variant ml-1.5">
          kWh
        </span>
      </div>
      <div className="mt-1 font-data-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant tabular-nums">
        Cumulative · {sharePct}% of period
      </div>
      <div className="mt-2 pt-2 border-t border-surface-dim flex items-baseline justify-between gap-3">
        <span className="font-data-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">
          This event
        </span>
        <span className="font-data-mono text-[12px] tabular-nums text-primary">
          +{point.units.toLocaleString()}
          <span className="text-on-surface-variant ml-1">kWh</span>
        </span>
      </div>
      {point.label && (
        <div className="mt-1 font-body text-[12px] text-on-surface leading-snug">
          {point.label}
        </div>
      )}
    </div>
  );
};

const GenerationChart = () => {
  const energyEvents = useProgressStore((state) => state.energyEvents);
  // Pick the smallest range that actually has data so the chart never
  // opens to an empty "Today" the morning after activity — operators were
  // mistaking the natural day-rollover for lost history. If today has any
  // events we still default there; otherwise we walk up to 7d / 30d / all
  // until we find something. Falls back to 'today' on a brand-new account.
  const initialRange = useMemo<ChartRange>(() => {
    if (energyEvents.length === 0) return 'today';
    const now = Date.now();
    const startOfToday = startOfLocalDay(now);
    const hasToday = energyEvents.some((e) => e.timestamp >= startOfToday);
    if (hasToday) return 'today';
    const sevenDayStart = startOfToday - 6 * MS_PER_DAY;
    if (energyEvents.some((e) => e.timestamp >= sevenDayStart)) return '7d';
    const thirtyDayStart = startOfToday - 29 * MS_PER_DAY;
    if (energyEvents.some((e) => e.timestamp >= thirtyDayStart)) return '30d';
    return 'all';
  }, [energyEvents]);
  const [range, setRange] = useState<ChartRange>(initialRange);
  // Keep range in sync if energyEvents hydrate after first render (e.g.
  // localStorage rehydration arrives a tick later than the initial paint).
  // We only auto-bump when the user is still on 'today' and today is empty,
  // so manual selection of any other range is respected.
  useEffect(() => {
    if (range === 'today' && initialRange !== 'today') {
      setRange(initialRange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRange]);
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
                  className={`font-data-mono text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.16em] px-2.5 py-2 sm:py-1.5 min-h-[36px] sm:min-h-0 transition-colors ${
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
        {(() => {
          // Y-axis tick labels — two intermediate numeric values plus the
          // 0 baseline and the totalKwh top so the chart reads at-a-glance
          // instead of requiring a hover. Empty state still shows 0/Max so
          // the axis chrome is consistent across data states.
          const formatTick = (value: number): string => {
            if (!Number.isFinite(value) || value <= 0) return '0';
            if (value >= 10_000) return `${Math.round(value / 1000)}k`;
            if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
            if (value >= 100) return Math.round(value).toString();
            if (value >= 10) return value.toFixed(0);
            return value.toFixed(1);
          };
          // ratio is 0 (bottom) → 1 (top) of the plot area. The plot area
          // sits inside pt-2 (8px) / pb-7 (28px) padding, so we anchor each
          // label by `bottom: 28px + ratio * (chart height - 36px)`.
          const ticks = hasEvents
            ? [
                { ratio: 0, label: '0' },
                { ratio: 0.33, label: formatTick(totalKwh / 3) },
                { ratio: 0.66, label: formatTick((totalKwh * 2) / 3) },
                { ratio: 1, label: formatTick(totalKwh) },
              ]
            : [
                { ratio: 0, label: '0' },
                { ratio: 1, label: 'Max' },
              ];
          return ticks.map((t, i) => (
            <div
              key={i}
              className="absolute left-0 -translate-y-1/2 font-data-mono text-[10px] tabular-nums uppercase tracking-[0.14em] text-on-surface-variant"
              style={{ bottom: `calc(28px + (100% - 36px) * ${t.ratio})` }}
            >
              {t.label}
            </div>
          ));
        })()}

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

/**
 * Greeting that types itself in. The caret keeps blinking on the trailing
 * period after typing completes so the line still reads as a live cursor
 * without taking the whole header offscreen. One of a handful of variants
 * is picked at random per mount so /home doesn't read identical every time.
 */
const GREETING_VARIANTS = [
  (n: string) => `Welcome back, ${n}.`,
  (n: string) => `Back at it, ${n}.`,
  (n: string) => `${n}, the grid is online.`,
  (n: string) => `Pick up where you left off, ${n}.`,
  (n: string) => `${n} — let's read some plans.`,
];

const WelcomeGreeting = ({ name }: { name: string }) => {
  const fullText = useMemo(() => {
    const pick = GREETING_VARIANTS[Math.floor(Math.random() * GREETING_VARIANTS.length)];
    return pick(name);
  }, [name]);
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (typed.length >= fullText.length) return;
    const id = setTimeout(() => setTyped(fullText.slice(0, typed.length + 1)), 38);
    return () => clearTimeout(id);
  }, [typed, fullText]);

  return (
    <header className="border-b border-on-surface pb-6">
      <h1 className="font-h1 text-h1 text-on-surface">
        <span aria-live="polite">{typed}</span>
        <span
          aria-hidden
          className="ml-1 inline-block w-[0.6ch] h-[0.85em] -mb-1 bg-primary"
          style={{ animation: 'welcomeCaret 1.05s steps(2, jump-none) infinite' }}
        />
      </h1>
    </header>
  );
};

export const HomeDashboard = ({
  user,
  displayName,
  topicProgress,
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
  // Hover-prefetch + data warming for the two main CTAs (resume lesson,
  // open grid). Cheap on hover; the destination route's JS chunk + warmed
  // store are ready before the click lands.
  const prefetchRoute = useHoverPrefetch();
  const prefetchData = usePrefetchData();

  const firstName = (
    displayName ??
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ?? 'Operator'
  ).split(' ')[0];

  // Read the active practice session out of sessionStorage on mount. The
  // mini-player writes this on every state change in PracticeSetViewer; if
  // it exists with `phase === 'session'`, it represents the user's latest
  // practice activity. Compared against `latestTheorySession.lastActiveAt`,
  // the more-recent one wins the NextUp slot.
  const [latestPractice, setLatestPractice] = useState<{
    moduleId: string;
    taskIndex: number;
    totalTasks: number;
    savedAt: string;
    route: string;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem('practice-session:v1');
      if (!raw) return;
      const snap = JSON.parse(raw) as {
        moduleId: string;
        route: string;
        savedAt: string;
        state: {
          phase: string;
          currentTaskIndex: number;
          taskStates: Array<unknown>;
        };
      };
      if (snap.state?.phase !== 'session') return;
      let route = snap.route ?? '';
      if (
        route &&
        !/[?&]practice=/.test(route) &&
        (/\/practice\/fundamentals\//.test(route) ||
          /\/practice\/modules\//.test(route))
      ) {
        const sep = route.includes('?') ? '&' : '?';
        route = `${route}${sep}practice=${snap.moduleId}`;
      }
      setLatestPractice({
        moduleId: snap.moduleId,
        taskIndex: snap.state.currentTaskIndex,
        totalTasks: snap.state.taskStates.length,
        savedAt: snap.savedAt,
        route,
      });
    } catch {
      /* ignore */
    }
  }, []);

  const nextUp = useMemo(() => {
    const theoryTs = latestTheorySession ? Date.parse(latestTheorySession.lastActiveAt) : 0;
    const practiceTs = latestPractice ? Date.parse(latestPractice.savedAt) : 0;
    const preferPractice = Boolean(
      latestPractice && (!latestTheorySession || practiceTs > theoryTs),
    );

    if (preferPractice && latestPractice) {
      const set = getPracticeSet('pyspark', latestPractice.moduleId.replace(/^module-/, ''));
      const subjectLabel = latestPractice.moduleId
        .replace(/^module-FND-/i, '')
        .replace(/-(JUNIOR|MID|SENIOR)$/i, '')
        .replace(/-/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        kind: 'practice' as const,
        moduleNumber: 'Practice',
        title: set?.title ?? `Practice — ${subjectLabel}`,
        summary: `Continue ${subjectLabel}. Task ${latestPractice.taskIndex + 1} of ${latestPractice.totalTasks}.`,
        ctaLabel: 'Resume Practice',
        href: latestPractice.route,
        progress: {
          current: Math.min(latestPractice.taskIndex, latestPractice.totalTasks),
          total: latestPractice.totalTasks,
          label: 'Module Progress',
          unit: 'tasks',
        },
      };
    }

    if (latestTheorySession && resumeContext?.chapterTitle) {
      return {
        kind: 'theory' as const,
        moduleNumber: latestTheorySession.chapterNumber
          ? `Module ${latestTheorySession.chapterNumber}`
          : latestTheorySession.chapterId.replace(/^module-/i, 'Module '),
        title: resumeContext.lessonTitle || resumeContext.chapterTitle,
        summary: resumeContext.lessonTitle
          ? `Continue ${resumeContext.chapterTitle}.`
          : 'Pick up where you left off.',
        ctaLabel: 'Resume Lesson',
        href: undefined as string | undefined,
        progress: {
          current: latestTheorySession.sectionsRead,
          total: latestTheorySession.sectionsTotal,
          label: 'Chapter Progress',
          unit: 'lessons',
        },
      };
    }

    // Empty state — no active session. Fall back to track-level progress
    // (chapters completed across the whole topic) so the bar still shows
    // something meaningful instead of disappearing.
    const py = topicProgress.find((tp) => tp.topic === 'pyspark') ?? null;
    return {
      kind: 'theory' as const,
      moduleNumber: 'Module 1.1',
      title: 'PySpark — Your first DataFrame',
      summary:
        'Start with the building block. Read a CSV, inspect its schema, run your first transformation.',
      ctaLabel: 'Begin first lesson',
      href: undefined as string | undefined,
      progress: {
        current: py?.theoryChaptersCompleted ?? 0,
        total: py?.theoryChaptersTotal ?? 0,
        label: 'Track Progress',
        unit: 'modules',
      },
    };
  }, [latestTheorySession, latestPractice, resumeContext, topicProgress]);

  const energyEvents = useProgressStore((state) => state.energyEvents);

  const activityRows = useMemo<ActivityRow[]>(() => {
    // Merge both sources — `energy_events` (richer per-event labels and
    // kWh values, fed by the live writes) and `reading_sessions` (the
    // SSR fallback that covers history written before the energy_events
    // feature existed). Without the merge a new device would flicker
    // between the two views during hydration, and historical completions
    // would render with the bare "Completed Module PS1" label even when
    // the user's session is otherwise tracked.
    const COMPLETION_SOURCES = new Set([
      'chapter-complete',
      'practice-module-complete',
      'track-complete',
    ]);
    // Energy events that *represent* a completion within ±5 minutes of
    // a session row mean the two refer to the same act. Drop the
    // session row in that case — the energy event has a better label
    // and the kWh number to show.
    const PROXIMITY_MS = 5 * 60 * 1000;
    const completionEventTimes = energyEvents
      .filter((e) => COMPLETION_SOURCES.has(e.source))
      .map((e) => e.timestamp);

    const eventRows: ActivityRow[] = energyEvents.map((event) => ({
      key: event.id,
      icon: ACTIVITY_ICON_BY_SOURCE[event.source] ?? 'check_circle',
      label: event.label ?? ACTIVITY_FALLBACK_LABEL[event.source] ?? 'Activity',
      timestamp: new Date(event.timestamp).toISOString(),
      units: event.units,
      highlight: HIGHLIGHTED_ACTIVITY_SOURCES.has(event.source),
    }));

    const sessionRows: ActivityRow[] = completedSessions
      .filter((session) => {
        const sessionTs = Date.parse(session.completedAt ?? session.lastActiveAt);
        if (!Number.isFinite(sessionTs)) return true;
        // Drop sessions that are covered by a completion energy event.
        return !completionEventTimes.some(
          (eventTs) => Math.abs(eventTs - sessionTs) < PROXIMITY_MS,
        );
      })
      .map((session) => ({
        key: `lesson-${session.id}`,
        icon: 'check_circle',
        label: `Completed ${session.chapterId.replace(/^module-/i, 'Module ')}`,
        timestamp: session.completedAt ?? session.lastActiveAt,
        highlight: false,
      }));

    const merged = [...eventRows, ...sessionRows]
      .sort(
        (a, b) =>
          Date.parse(b.timestamp ?? '') - Date.parse(a.timestamp ?? ''),
      )
      .slice(0, 5);

    if (merged.length > 0) return merged;

    return [{
      key: 'welcome',
      icon: 'login',
      label: `Welcome to StableGrid, ${firstName}`,
      timestamp: lastClockedInAt,
    }];
  }, [energyEvents, completedSessions, lastClockedInAt, firstName]);

  return (
    <main className="bg-surface bg-grid-pattern min-h-[calc(100dvh-4rem)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-10 lg:py-12 flex flex-col gap-8 lg:gap-12">
        <WelcomeGreeting name={firstName} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <section className="border border-on-surface bg-surface p-5 sm:p-6 lg:p-8 relative flex flex-col">
            <div className="absolute top-0 right-0 border-l border-b border-on-surface px-2 py-1 font-ui-label text-[10px] text-on-surface uppercase tracking-wider bg-surface">
              NEXTUP
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-2">
              <CellIllustration />
              <div className="flex flex-col min-w-0">
                <div className="font-data-mono text-on-surface-variant text-[13px] mb-1">
                  {nextUp.moduleNumber}
                </div>
                <h2 className="font-h2 text-[24px] sm:text-h2 text-on-surface leading-tight mb-4 break-words">
                  {nextUp.title}
                </h2>
                <p className="font-body text-[15px] sm:font-body-lg sm:text-body-lg text-on-surface-variant mb-4 leading-relaxed">
                  {nextUp.summary}
                </p>
                {(() => {
                  const total = nextUp.progress.total;
                  if (total <= 0) return null;
                  const current = Math.min(nextUp.progress.current, total);
                  const pct = Math.round((current / total) * 100);
                  const { label, unit } = nextUp.progress;
                  return (
                    <div className="mb-6">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="font-data-mono uppercase text-[10px] tracking-[0.18em] text-on-surface-variant">
                          {label}
                        </span>
                        <span className="font-data-mono text-[11px] tabular-nums text-on-surface-variant">
                          {current} / {total} <span className="text-on-surface-variant/60">· {pct}%</span>
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${label}: ${current} of ${total} ${unit}`}
                        className="h-1.5 w-full bg-surface-container border border-surface-dim overflow-hidden"
                      >
                        <div
                          className="h-full bg-primary transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
                {(() => {
                  const ctaHref = nextUp.href ?? learnHref;
                  const ctaLabel =
                    nextUp.kind === 'practice'
                      ? nextUp.ctaLabel
                      : nextUp.ctaLabel === 'Resume Lesson' && learnLabel.startsWith('Continue')
                        ? 'Resume Lesson'
                        : learnLabel;
                  return (
                    <Link
                      href={ctaHref}
                      onMouseEnter={() => {
                        prefetchRoute(ctaHref);
                        prefetchData(ctaHref);
                      }}
                      onFocus={() => {
                        prefetchRoute(ctaHref);
                        prefetchData(ctaHref);
                      }}
                      className="bg-primary text-on-primary font-ui-label uppercase tracking-wider text-[14px] px-6 py-3 self-start hover:bg-surface-tint transition-colors"
                    >
                      {ctaLabel}
                    </Link>
                  );
                })()}
              </div>
            </div>
          </section>

          <GenerationChart />
        </div>

        <TierProgressionPanel />

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
                className="flex items-start sm:items-center gap-3 p-4 border-b border-surface-dim last:border-b-0 hover:bg-surface-container-lowest transition-colors"
              >
                <div
                  className={`w-8 h-8 shrink-0 flex items-center justify-center ${
                    row.highlight
                      ? 'border border-on-surface bg-primary-fixed'
                      : 'border border-surface-dim'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      row.highlight ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    {row.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                  <span className="font-body text-[15px] sm:font-body-lg sm:text-[16px] text-on-surface leading-snug break-words">
                    {row.label}
                  </span>
                  <div className="flex items-center gap-3 sm:gap-4 sm:shrink-0">
                    {row.units !== undefined && row.units !== 0 && (
                      <span className="font-data-mono text-primary text-[12px] sm:text-[13px] tabular-nums">
                        +{row.units} kWh
                      </span>
                    )}
                    <span className="font-data-mono text-on-surface-variant text-[12px] sm:text-[13px] tabular-nums whitespace-nowrap">
                      {formatRelativeTime(row.timestamp)}
                    </span>
                  </div>
                </div>
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
              onMouseEnter={() => prefetchRoute('/grid')}
              onFocus={() => prefetchRoute('/grid')}
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
