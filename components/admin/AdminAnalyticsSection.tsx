'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Clock3,
  CircleHelp,
  CreditCard,
  Hourglass,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users
} from 'lucide-react';
import { AdminInlineMessage, AdminSurface } from '@/components/admin/theme';
import type {
  AdminAnalyticsDecisionTree,
  AdminAnalyticsKpi,
  AdminAnalyticsPeriod,
  AdminAnalyticsSnapshot,
  AdminAnalyticsTreeAccent,
  AdminAnalyticsTreeOutcome,
  AdminAnalyticsTreeSegment
} from '@/lib/admin/types';

interface ApiEnvelope<T> {
  data: T;
  error?: string;
}

const PRIMARY_METRIC_IDS: AdminAnalyticsKpi['id'][] = [
  'total_users',
  'active_users',
  'active_subscriptions',
  'sales'
];

const PERIOD_OPTIONS: Array<{ id: AdminAnalyticsPeriod; label: string }> = [
  { id: 'all_time', label: 'All time' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'daily', label: 'Daily' }
];

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    cache: 'no-store'
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new Error(payload.error ?? 'Request failed.');
  }

  return payload.data;
}

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));

const formatChange = (value: number) => {
  const rounded = Math.abs(value);

  if (rounded >= 100) {
    return `${Math.round(rounded)}%`;
  }

  if (rounded >= 10) {
    return `${rounded.toFixed(1)}%`;
  }

  return `${rounded.toFixed(1)}%`;
};

const formatDurationShort = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0m';
  }

  const wholeSeconds = Math.round(seconds);
  const days = Math.floor(wholeSeconds / 86_400);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = wholeSeconds % 60;

  if (days > 0) {
    const hours = Math.floor((wholeSeconds % 86_400) / 3_600);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  if (wholeSeconds >= 3_600) {
    const totalHours = Math.floor(wholeSeconds / 3_600);
    const hourMinutes = Math.floor((wholeSeconds % 3_600) / 60);
    return hourMinutes > 0 ? `${totalHours}h ${hourMinutes}m` : `${totalHours}h`;
  }

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
};

const buildSparklinePath = (values: number[], width: number, height: number) => {
  if (values.length === 0) {
    return '';
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 6) - 3;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
};

const buildSparklineArea = (values: number[], width: number, height: number) => {
  const linePath = buildSparklinePath(values, width, height);

  if (!linePath) {
    return '';
  }

  const lastPointX = values.length === 1 ? width / 2 : width;

  return `${linePath} L ${lastPointX.toFixed(2)} ${height} L 0 ${height} Z`;
};

const Surface = AdminSurface;

const InlineMessage = AdminInlineMessage;

interface HeroKpiCardData {
  id: AdminAnalyticsKpi['id'];
  title: string;
  value: string;
  note: string;
  deltaLabel: string;
  deltaValue: number;
  trendPoints: Array<{
    value: number;
    label: string;
    date: string;
  }>;
  icon: LucideIcon;
  accentClasses: {
    iconWrap: string;
    icon: string;
    line: string;
    glow: string;
    pill: string;
    dot: string;
  };
  valueFormat: 'number' | 'currency_eur' | 'duration_seconds';
}

const Sparkline = ({
  points,
  lineClassName,
  glowClassName,
  dotClassName,
  valueFormat,
  metricLabel
}: {
  points: Array<{ value: number; label: string; date: string }>;
  lineClassName: string;
  glowClassName: string;
  dotClassName: string;
  valueFormat: 'number' | 'currency_eur' | 'duration_seconds';
  metricLabel?: string;
}) => {
  const values = points.map((point) => point.value);
  const width = 240;
  const height = 64;
  const linePath = buildSparklinePath(values, width, height);
  const areaPath = buildSparklineArea(values, width, height);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    setActiveIndex(null);
  }, [values.length]);

  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pointsWithCoords = values.map((value, index) => ({
    ...points[index],
    x: values.length === 1 ? width / 2 : (index / (values.length - 1)) * width,
    y: height - ((value - min) / range) * (height - 6) - 3
  }));
  const activePoint =
    activeIndex == null ? null : pointsWithCoords[Math.min(activeIndex, pointsWithCoords.length - 1)];
  const tooltipLeftPx = activePoint ? Math.min(width - 50, Math.max(50, activePoint.x)) : width / 2;
  const tooltipTopPx = activePoint ? Math.max(4, activePoint.y - 56) : 6;

  const prevPoint =
    activeIndex != null && activeIndex > 0
      ? pointsWithCoords[activeIndex - 1]
      : null;
  const pointDelta =
    activePoint && prevPoint ? activePoint.value - prevPoint.value : null;
  const pointDeltaPct =
    pointDelta != null && prevPoint && prevPoint.value !== 0
      ? (pointDelta / prevPoint.value) * 100
      : null;

  const formatPointValue = (value: number) =>
    valueFormat === 'currency_eur'
      ? new Intl.NumberFormat('en', {
          style: 'currency',
          currency: 'EUR',
          maximumFractionDigits: 0
        }).format(value)
      : valueFormat === 'duration_seconds'
        ? formatDurationShort(value)
        : value.toLocaleString('en');

  if (!linePath || !areaPath) {
    return <div className="h-16 rounded-[10px] bg-white/[0.04]" />;
  }

  return (
    <div className="relative pt-1">
      {activePoint ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-2xl border border-white/[0.08] bg-[#1a1d20]/95 px-3.5 py-2.5 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all duration-150 ease-out"
          style={{
            left: `${tooltipLeftPx}px`,
            top: `${tooltipTopPx}px`
          }}
        >
          <div className="flex flex-col gap-1 whitespace-nowrap">
            <span className="text-[10px] font-medium tracking-wide text-on-surface-variant/40 uppercase">
              {metricLabel ?? activePoint.label}
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-on-surface">
              {formatPointValue(activePoint.value)}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-on-surface-variant/50">{activePoint.date}</span>
              {pointDeltaPct != null && (
                <>
                  <span className="h-0.5 w-0.5 rounded-full bg-white/20" />
                  <span className={`text-[10px] font-semibold ${pointDelta != null && pointDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pointDelta != null && pointDelta >= 0 ? '+' : ''}{pointDeltaPct.toFixed(0)}%
                  </span>
                </>
              )}
            </div>
          </div>
          <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-[35%] rotate-45 border-b border-r border-white/[0.08] bg-[#1a1d20]/95" />
        </div>
      ) : null}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-16 w-full overflow-visible"
        preserveAspectRatio="none"
        onMouseLeave={() => setActiveIndex(null)}
      >
        <path d={areaPath} className={glowClassName} />
        <path
          d={linePath}
          className={lineClassName}
          fill="none"
          strokeWidth="2.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pointsWithCoords.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r={9}
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`${point.label}: ${formatPointValue(point.value)} on ${point.date}`}
              className="cursor-pointer"
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
              onClick={() => setActiveIndex(index)}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={index === activeIndex ? 3.8 : 2.8}
              className={`${index === activeIndex ? dotClassName : 'fill-white/70'} transition-all duration-200`}
              stroke={index === activeIndex ? 'rgba(255,255,255,0.55)' : 'transparent'}
              strokeWidth={index === activeIndex ? 1 : 0}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};

const CARD_TINT: Record<string, { bg: string; glow: string }> = {
  total_users:          { bg: 'rgba(34,185,153,0.04)',  glow: 'rgba(34,185,153,0.08)' },
  active_users:         { bg: 'rgba(90,198,250,0.04)',  glow: 'rgba(90,198,250,0.08)' },
  active_subscriptions: { bg: 'rgba(171,132,255,0.04)', glow: 'rgba(171,132,255,0.08)' },
  sales:                { bg: 'rgba(255,214,10,0.03)',  glow: 'rgba(255,214,10,0.06)' },
};

const HeroKpiCard = ({ card }: { card: HeroKpiCardData }) => {
  const TrendIcon = card.deltaValue < 0 ? TrendingDown : TrendingUp;
  const isPositive = card.deltaValue > 0;
  const isNegative = card.deltaValue < 0;
  const tint = CARD_TINT[card.id] ?? { bg: 'rgba(255,255,255,0.02)', glow: 'rgba(255,255,255,0.04)' };

  return (
    <div
      className="group relative overflow-hidden rounded-[22px] transition-all duration-500 ease-out hover:-translate-y-0.5"
      style={{
        background: 'linear-gradient(180deg, #1c2025 0%, #181c20 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 40px -24px rgba(0,0,0,0.6)',
      }}
    >
      {/* Brand-tinted ambient glow — subtle, anchored at top-right behind icon */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 100% 0%, ${tint.glow}, transparent 70%)`,
        }}
      />
      {/* Top inset highlight — Apple-style 1px gradient stroke */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
        }}
      />

      <div className="relative p-6">
        {/* Header: title + icon */}
        <div className="flex items-start justify-between">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {card.title}
          </p>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-[12px] transition-transform duration-500 group-hover:scale-105"
            style={{
              background: tint.bg,
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: `0 0 24px ${tint.glow}`,
            }}
          >
            <card.icon className={`h-[18px] w-[18px] ${card.accentClasses.icon}`} strokeWidth={2} />
          </div>
        </div>

        {/* Value */}
        <p className="mt-4 text-5xl font-bold tracking-tight text-white font-mono tabular-nums">
          {card.value}
        </p>

        {/* Delta pill + label */}
        <div className="mt-4 flex items-center gap-2.5">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase"
            style={{
              background: isNegative
                ? 'rgba(239,68,68,0.12)'
                : isPositive
                  ? 'rgba(34,197,94,0.12)'
                  : 'rgba(255,255,255,0.04)',
              border: `1px solid ${
                isNegative
                  ? 'rgba(239,68,68,0.35)'
                  : isPositive
                    ? 'rgba(34,197,94,0.35)'
                    : 'rgba(255,255,255,0.12)'
              }`,
              color: isNegative
                ? 'rgb(252,165,165)'
                : isPositive
                  ? 'rgb(110,231,160)'
                  : 'rgba(255,255,255,0.6)',
            }}
          >
            <TrendIcon className="h-3 w-3" strokeWidth={2.5} />
            {card.deltaValue === 0 ? '0.0%' : `${isPositive ? '+' : '-'}${formatChange(card.deltaValue)}`}
          </span>
          <span className="text-[12px] text-white/45">{card.deltaLabel}</span>
        </div>

        {/* Description */}
        <p className="mt-3 text-[12px] leading-relaxed text-white/45">{card.note}</p>

        {/* Sparkline chart */}
        <div className="mt-5">
          <Sparkline
            points={card.trendPoints}
            lineClassName={card.accentClasses.line}
            glowClassName={card.accentClasses.glow}
            dotClassName={card.accentClasses.dot}
            valueFormat={card.valueFormat}
            metricLabel={card.title}
          />
        </div>
      </div>
    </div>
  );
};

const TREE_ACCENT_STYLES: Record<
  AdminAnalyticsTreeAccent,
  {
    segmentSurface: string;
    badge: string;
    eyebrow: string;
    connector: string;
    outcomeBar: string;
    outcomeGlow: string;
  }
> = {
  brand: {
    segmentSurface: 'bg-surface-container border-primary/12',
    badge: 'bg-primary/8 text-primary border-primary/15',
    eyebrow: 'text-primary/60',
    connector: 'bg-primary/20',
    outcomeBar: 'bg-primary',
    outcomeGlow: 'bg-primary/8'
  },
  teal: {
    segmentSurface: 'bg-surface-container border-primary/12',
    badge: 'bg-primary/8 text-primary border-primary/15',
    eyebrow: 'text-primary/60',
    connector: 'bg-primary/20',
    outcomeBar: 'bg-primary',
    outcomeGlow: 'bg-primary/8'
  },
  blue: {
    segmentSurface: 'bg-surface-container border-sky-400/12',
    badge: 'bg-sky-400/8 text-sky-300 border-sky-400/15',
    eyebrow: 'text-sky-300/60',
    connector: 'bg-sky-400/20',
    outcomeBar: 'bg-sky-400',
    outcomeGlow: 'bg-sky-400/8'
  },
  amber: {
    segmentSurface: 'bg-surface-container border-amber-400/12',
    badge: 'bg-amber-400/8 text-amber-300 border-amber-400/15',
    eyebrow: 'text-amber-300/60',
    connector: 'bg-amber-400/20',
    outcomeBar: 'bg-amber-400',
    outcomeGlow: 'bg-amber-400/8'
  },
  violet: {
    segmentSurface: 'bg-surface-container border-violet-400/12',
    badge: 'bg-violet-400/8 text-violet-300 border-violet-400/15',
    eyebrow: 'text-violet-300/60',
    connector: 'bg-violet-400/20',
    outcomeBar: 'bg-violet-400',
    outcomeGlow: 'bg-violet-400/8'
  },
  slate: {
    segmentSurface: 'bg-surface-container border-white/[0.08]',
    badge: 'bg-white/[0.06] text-on-surface-variant border-white/[0.08]',
    eyebrow: 'text-on-surface-variant/50',
    connector: 'bg-white/20',
    outcomeBar: 'bg-on-surface-variant',
    outcomeGlow: 'bg-white/[0.06]'
  },
  orange: {
    segmentSurface: 'bg-surface-container border-orange-400/12',
    badge: 'bg-orange-400/8 text-orange-300 border-orange-400/15',
    eyebrow: 'text-orange-300/60',
    connector: 'bg-orange-400/20',
    outcomeBar: 'bg-orange-400',
    outcomeGlow: 'bg-orange-400/8'
  },
  rose: {
    segmentSurface: 'bg-surface-container border-rose-400/12',
    badge: 'bg-rose-400/8 text-rose-300 border-rose-400/15',
    eyebrow: 'text-rose-300/60',
    connector: 'bg-rose-400/20',
    outcomeBar: 'bg-rose-400',
    outcomeGlow: 'bg-rose-400/8'
  }
};

const InfoHint = ({ label, content }: { label: string; content: string }) => (
  <span className="group relative inline-flex items-center">
    <button
      type="button"
      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-on-surface-variant/40 transition duration-200 hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      aria-label={label}
    >
      <CircleHelp className="h-3.5 w-3.5" strokeWidth={2.1} />
    </button>
    <span className="pointer-events-none absolute right-0 top-[calc(100%+8px)] z-20 w-64 origin-top-right translate-y-1 scale-[0.98] rounded-xl border border-white/[0.08] bg-[#141618]/95 px-3.5 py-2.5 text-[11px] leading-5 text-on-surface-variant opacity-0 shadow-[0_18px_34px_-20px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition duration-200 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100">
      {content}
      <span className="absolute right-3 top-0 h-2 w-2 -translate-y-1/2 rotate-45 border-l border-t border-white/[0.08] bg-[#141618]" />
    </span>
  </span>
);

const getCompletionMeaningHint = (outcomeLabel: string) => {
  const normalized = outcomeLabel.toLowerCase();

  if (normalized.includes('theory')) {
    return 'Completed means a user in this segment finished at least one theory module in the selected period.';
  }

  if (normalized.includes('task')) {
    return 'Completed means a user in this segment finished at least one activation task in the selected period.';
  }

  return 'Completed means a user in this segment finished the tracked learning action in the selected period.';
};

const FILL_COLORS = {
  violet: { from: 'rgba(140,100,255,0.25)', to: 'rgba(180,140,255,0.08)', glow: 'rgba(160,120,255,0.15)', accent: 'rgba(192,160,255,0.6)', border: 'rgba(160,120,255,0.12)' },
  blue:   { from: 'rgba(80,160,255,0.25)',  to: 'rgba(100,180,255,0.08)', glow: 'rgba(90,170,255,0.15)',  accent: 'rgba(100,200,255,0.6)',  border: 'rgba(90,170,255,0.12)' },
  teal:   { from: 'rgba(80,220,200,0.25)',  to: 'rgba(100,240,220,0.08)', glow: 'rgba(90,230,210,0.15)',  accent: 'rgba(153,247,255,0.6)',  border: 'rgba(100,230,220,0.12)' },
};

const useFillAnimation = (targetPct: number, delay = 0) => {
  const [fill, setFill] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setFill(targetPct), 80 + delay);
    return () => clearTimeout(timer);
  }, [targetPct, delay]);
  return fill;
};

const DecisionTreeOutcomeCard = ({
  outcome,
  accent,
  fillColor = 'teal',
  animDelay = 0
}: {
  outcome: AdminAnalyticsTreeOutcome;
  accent: AdminAnalyticsTreeAccent;
  fillColor?: keyof typeof FILL_COLORS;
  animDelay?: number;
}) => {
  const pct = outcome.ratePct;
  const colors = FILL_COLORS[fillColor];
  const targetFill = Math.max(pct, outcome.totalUsers > 0 ? 4 : 0);
  const fill = useFillAnimation(targetFill, animDelay);

  return (
    <div
      className="group relative overflow-hidden rounded-[18px] transition-all duration-500 hover:scale-[1.02]"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 24px -16px rgba(0,0,0,0.55)',
      }}
    >
      {/* Dynamic fill — animates from 0 to target */}
      <div
        className="absolute inset-x-0 bottom-0 group-hover:brightness-125"
        style={{
          height: `${fill}%`,
          background: `linear-gradient(to top, ${colors.from}, ${colors.to})`,
          transition: 'height 1.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease',
        }}
      />
      {/* Fill edge glow */}
      {fill > 0 && fill < 100 && (
        <div
          className="absolute inset-x-0 h-px"
          style={{
            bottom: `${fill}%`,
            background: `linear-gradient(90deg, transparent, ${colors.glow}, transparent)`,
            boxShadow: `0 0 8px ${colors.glow}`,
            transition: 'bottom 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}
      {/* Top progress line */}
      <div
        className="absolute top-0 left-0 h-[2px] rounded-full"
        style={{
          width: `${fill}%`,
          background: colors.accent,
          boxShadow: `0 0 6px ${colors.glow}`,
          transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
      {/* Content */}
      <div className="relative p-4">
        <p className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant/50">{outcome.label}</p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <p className="text-2xl font-bold tracking-tight text-on-surface">{pct}%</p>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-on-surface-variant/60"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}` }}
          >
            {outcome.completedUsers}/{outcome.totalUsers}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-on-surface-variant/40">{outcome.helper}</p>
      </div>
    </div>
  );
};

const DecisionTreeSegmentCard = ({
  segment,
  isLeft,
  animDelay = 0
}: {
  segment: AdminAnalyticsTreeSegment;
  isLeft?: boolean;
  animDelay?: number;
}) => {
  const pct = segment.sharePct;
  const colors = isLeft ? FILL_COLORS.violet : FILL_COLORS.blue;
  const targetFill = Math.max(pct, 4);
  const fill = useFillAnimation(targetFill, animDelay);

  return (
    <div
      className="group relative overflow-hidden rounded-[22px] hover:border-white/[0.12]"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.015) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.04) inset, 0 16px 32px -20px rgba(0,0,0,0.6)',
        transition: 'transform 0.5s ease, border-color 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      {/* Dynamic fill — animates from 0 to target */}
      <div
        className="absolute inset-x-0 bottom-0 group-hover:brightness-110"
        style={{
          height: `${fill}%`,
          background: `linear-gradient(to top, ${colors.from}, ${colors.to})`,
          transition: 'height 1.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease',
        }}
      />
      {/* Fill edge glow */}
      {fill > 0 && fill < 100 && (
        <div
          className="absolute inset-x-0 h-px"
          style={{
            bottom: `${fill}%`,
            background: `linear-gradient(90deg, transparent, ${colors.glow}, transparent)`,
            boxShadow: `0 0 12px ${colors.glow}`,
            transition: 'bottom 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}
      {/* Top progress line */}
      <div className="absolute top-0 left-0 h-[2px] rounded-full"
        style={{
          width: `${fill}%`,
          background: colors.accent,
          boxShadow: `0 0 8px ${colors.glow}`,
          transition: 'width 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
      {/* Content */}
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: colors.accent }}>
              {segment.label}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-on-surface">{segment.count}</p>
          </div>
          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ color: colors.accent, background: `${colors.from}`, border: `1px solid ${colors.border}` }}
          >
            {segment.sharePct}%
          </span>
        </div>
        <p className="mt-2 text-xs text-on-surface-variant/40">{segment.helper}</p>
      </div>
    </div>
  );
};

const FlowLine = ({ color = 'rgba(153,247,255,0.15)' }: { color?: string }) => (
  <div className="flex justify-center py-1">
    <div className="h-8 w-px" style={{ background: `linear-gradient(to bottom, ${color}, transparent)` }} />
  </div>
);

const FlowBranch = ({ leftColor = 'rgba(192,160,255,0.3)', rightColor = 'rgba(100,200,255,0.3)' }) => (
  <svg className="mx-auto block" width="100%" height="64" viewBox="0 0 800 64" preserveAspectRatio="xMidYMin meet">
    <defs>
      <linearGradient id="flowLeft" x1="400" y1="0" x2="200" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="rgba(153,247,255,0.2)" />
        <stop offset="100%" stopColor={leftColor} />
      </linearGradient>
      <linearGradient id="flowRight" x1="400" y1="0" x2="600" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="rgba(153,247,255,0.2)" />
        <stop offset="100%" stopColor={rightColor} />
      </linearGradient>
    </defs>
    {/* Curved paths instead of straight lines */}
    <path d="M 400 0 C 400 32, 200 32, 200 64" fill="none" stroke="url(#flowLeft)" strokeWidth="1.5" />
    <path d="M 400 0 C 400 32, 600 32, 600 64" fill="none" stroke="url(#flowRight)" strokeWidth="1.5" />
    <circle cx="400" cy="0" r="2.5" fill="rgba(153,247,255,0.3)" />
  </svg>
);

const FlowSplit = ({ color = 'rgba(153,247,255,0.12)' }: { color?: string }) => (
  <svg className="mx-auto block" width="100%" height="48" viewBox="0 0 400 48" preserveAspectRatio="xMidYMin meet">
    <path d="M 200 0 C 200 24, 100 24, 100 48" fill="none" stroke={color} strokeWidth="1" />
    <path d="M 200 0 C 200 24, 300 24, 300 48" fill="none" stroke={color} strokeWidth="1" />
    <circle cx="200" cy="0" r="2" fill={color} />
  </svg>
);

const DecisionTreeMap = ({ tree }: { tree: AdminAnalyticsDecisionTree }) => {
  const [leftSegment, rightSegment] = tree.segments;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/50">{tree.windowLabel}</p>
        <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-on-surface">{tree.title}</h3>
        <p className="mt-1.5 max-w-2xl text-sm text-on-surface-variant/40">{tree.description}</p>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden space-y-3">
        <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.03] p-5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/50">{tree.rootLabel}</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-on-surface">{tree.rootCount}</p>
          <p className="mt-1 text-xs text-on-surface-variant/40">{tree.rootHelper}</p>
        </div>
        {tree.segments.map((segment, i) => (
          <div key={segment.id} className="space-y-2">
            <FlowLine />
            <DecisionTreeSegmentCard segment={segment} isLeft={i === 0} />
            <div className="grid grid-cols-2 gap-2 pl-2">
              {segment.outcomes.map((outcome) => (
                <DecisionTreeOutcomeCard key={outcome.id} outcome={outcome} accent={segment.accent} fillColor={i === 0 ? 'violet' : 'blue'} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:block">
        <div className="mx-auto max-w-5xl">
          {/* Root — Hero block with full fill (100% = all users) */}
          <div
            className="group mx-auto max-w-lg rounded-[26px] relative overflow-hidden transition-all duration-500 hover:scale-[1.01]"
            style={{
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.05) inset, 0 24px 48px -24px rgba(0,0,0,0.65)',
            }}
          >
            {/* Full fill — root is always 100% */}
            <div className="absolute inset-0 transition-all duration-[800ms] ease-out group-hover:brightness-110"
              style={{
                background: `linear-gradient(to top, ${FILL_COLORS.teal.from}, ${FILL_COLORS.teal.to})`,
              }}
            />
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(153,247,255,0.06),transparent_60%)]" />
            {/* Top progress line — full width */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: FILL_COLORS.teal.accent,
                boxShadow: `0 0 10px ${FILL_COLORS.teal.glow}`,
              }}
            />
            <div className="relative p-8 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/60">{tree.rootLabel}</p>
              <p className="mt-3 text-5xl font-bold tracking-tight text-on-surface">{tree.rootCount}</p>
              <p className="mt-2 text-sm text-on-surface-variant/50">{tree.rootHelper}</p>
            </div>
          </div>

          {/* Curved flow branches */}
          <FlowBranch />

          {/* Segments */}
          <div className="grid grid-cols-2 gap-8">
            {[leftSegment, rightSegment].map((segment, i) => (
              <div key={segment.id} className="space-y-3">
                <DecisionTreeSegmentCard segment={segment} isLeft={i === 0} />
                <FlowSplit color={i === 0 ? 'rgba(192,160,255,0.2)' : 'rgba(100,200,255,0.2)'} />
                <div className="grid grid-cols-2 gap-3">
                  {segment.outcomes.map((outcome) => (
                    <DecisionTreeOutcomeCard key={outcome.id} outcome={outcome} accent={segment.accent} fillColor={i === 0 ? 'violet' : 'blue'} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export function AdminAnalyticsSection({
  onMutation
}: {
  onMutation: (message: string) => void;
}) {
  const [analytics, setAnalytics] = useState<AdminAnalyticsSnapshot | null>(null);
  const [period, setPeriod] = useState<AdminAnalyticsPeriod>('monthly');
  const [selectedTreeId, setSelectedTreeId] = useState<AdminAnalyticsDecisionTree['id'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (requestedPeriod: AdminAnalyticsPeriod) => {
    setLoading(true);
    setError(null);

    try {
      const data = await requestJson<AdminAnalyticsSnapshot>(`/api/admin/analytics?period=${requestedPeriod}`);
      setAnalytics(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics(period);
  }, [loadAnalytics, period]);

  const metricsById = useMemo(
    () => new Map((analytics?.metrics ?? []).map((metric) => [metric.id, metric])),
    [analytics?.metrics]
  );

  const primaryMetrics = PRIMARY_METRIC_IDS.map((id) => metricsById.get(id)).filter(
    (metric): metric is AdminAnalyticsKpi => Boolean(metric)
  );

  useEffect(() => {
    if (!analytics?.decisionTrees.length) {
      setSelectedTreeId(null);
      return;
    }

    setSelectedTreeId((current) => {
      if (current && analytics.decisionTrees.some((tree) => tree.id === current)) {
        return current;
      }

      return analytics.decisionTrees[0]?.id ?? null;
    });
  }, [analytics?.decisionTrees]);

  const activeDecisionTree = useMemo(
    () =>
      analytics?.decisionTrees.find((tree) => tree.id === selectedTreeId) ??
      analytics?.decisionTrees[0] ??
      null,
    [analytics?.decisionTrees, selectedTreeId]
  );

  const heroCards = useMemo(() => {
    const CARD_VISUALS: Partial<
      Record<
        AdminAnalyticsKpi['id'],
        {
          icon: LucideIcon;
          accentClasses: HeroKpiCardData['accentClasses'];
        }
      >
    > = {
      total_users: {
        icon: Users,
        accentClasses: {
          iconWrap: 'bg-[rgba(34,185,153,0.12)]',
          icon: 'text-[#8af1d5]',
          line: 'stroke-[#8af1d5]',
          glow: 'fill-[rgba(34,185,153,0.18)]',
          pill: 'border-emerald-400/20 bg-emerald-400/12',
          dot: 'fill-[#8af1d5]'
        }
      },
      active_users: {
        icon: Users,
        accentClasses: {
          iconWrap: 'bg-[rgba(90,198,250,0.12)]',
          icon: 'text-[#8bd8ff]',
          line: 'stroke-[#8bd8ff]',
          glow: 'fill-[rgba(90,198,250,0.18)]',
          pill: 'border-sky-400/20 bg-sky-400/12',
          dot: 'fill-[#8bd8ff]'
        }
      },
      active_subscriptions: {
        icon: CreditCard,
        accentClasses: {
          iconWrap: 'bg-[rgba(171,132,255,0.12)]',
          icon: 'text-[#d0b6ff]',
          line: 'stroke-[#d0b6ff]',
          glow: 'fill-[rgba(171,132,255,0.18)]',
          pill: 'border-violet-400/20 bg-violet-400/12',
          dot: 'fill-[#d0b6ff]'
        }
      },
      sales: {
        icon: ShoppingCart,
        accentClasses: {
          iconWrap: 'bg-[rgba(255,214,10,0.14)]',
          icon: 'text-[#ffd86f]',
          line: 'stroke-[#ffd86f]',
          glow: 'fill-[rgba(255,214,10,0.18)]',
          pill: 'border-amber-400/20 bg-amber-400/12',
          dot: 'fill-[#ffd86f]'
        }
      },
      average_session_duration: {
        icon: Clock3,
        accentClasses: {
          iconWrap: 'bg-[rgba(255,159,67,0.14)]',
          icon: 'text-[#ffc98f]',
          line: 'stroke-[#ffc98f]',
          glow: 'fill-[rgba(255,159,67,0.18)]',
          pill: 'border-orange-400/20 bg-orange-400/12',
          dot: 'fill-[#ffc98f]'
        }
      },
      average_platform_time: {
        icon: Clock3,
        accentClasses: {
          iconWrap: 'bg-[rgba(99,226,193,0.14)]',
          icon: 'text-[#9ef5dc]',
          line: 'stroke-[#9ef5dc]',
          glow: 'fill-[rgba(99,226,193,0.2)]',
          pill: 'border-emerald-400/20 bg-emerald-400/12',
          dot: 'fill-[#9ef5dc]'
        }
      },
      average_task_time: {
        icon: Hourglass,
        accentClasses: {
          iconWrap: 'bg-[rgba(246,173,85,0.16)]',
          icon: 'text-[#ffd48d]',
          line: 'stroke-[#ffd48d]',
          glow: 'fill-[rgba(246,173,85,0.2)]',
          pill: 'border-amber-400/20 bg-amber-400/12',
          dot: 'fill-[#ffd48d]'
        }
      }
    };

    const trendMeta = (analytics?.trend ?? []).map((point) => ({
      label: point.label,
      date: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
        new Date(point.bucketStart)
      )
    }));

    return primaryMetrics.map((metric) => {
      const visual = CARD_VISUALS[metric.id] ?? {
        icon: BookOpen,
        accentClasses: {
          iconWrap: 'bg-[rgba(255,159,67,0.13)]',
          icon: 'text-[#ffc48c]',
          line: 'stroke-[#ffc48c]',
          glow: 'fill-[rgba(255,159,67,0.18)]',
          pill: 'border-orange-400/20 bg-orange-400/12',
          dot: 'fill-[#ffc48c]'
        }
      };

      const trendPoints = (metric.trendValues ?? []).map((value, index) => ({
        value,
        label: trendMeta[index]?.label ?? `Point ${index + 1}`,
        date: trendMeta[index]?.date ?? 'N/A'
      }));

      return {
        id: metric.id,
        title: metric.label,
        value: metric.displayValue,
        note: metric.helper,
        deltaLabel: metric.deltaLabel ?? 'vs previous period',
        deltaValue: metric.deltaValue ?? 0,
        trendPoints,
        icon: visual.icon,
        accentClasses: visual.accentClasses,
        valueFormat: (
          metric.id === 'sales'
            ? 'currency_eur'
            : metric.id === 'average_session_duration' ||
                metric.id === 'average_platform_time' ||
                metric.id === 'average_task_time'
              ? 'duration_seconds'
              : 'number'
        ) as 'number' | 'currency_eur' | 'duration_seconds'
      };
    });
  }, [analytics?.trend, primaryMetrics]);

  return (
    <div className="space-y-6">
      <Surface>
        <div className="px-6 py-6 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                Analytics
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Growth, engagement &amp; health
              </h2>
            </div>
            <div className="flex w-full flex-col gap-2 lg:w-auto lg:items-end">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={period}
                    onChange={(event) => setPeriod(event.target.value as AdminAnalyticsPeriod)}
                    className="h-9 appearance-none pl-3 pr-7 font-mono text-[10.5px] font-semibold tracking-[0.12em] uppercase text-white/78 outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[rgba(153,247,255,0.35)]"
                    style={{
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {PERIOD_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id} className="bg-[#181c20]">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-white/40">
                    <svg aria-hidden="true" viewBox="0 0 12 8" className="h-[7px] w-[7px] fill-current">
                      <path d="M6 8 0 0h12L6 8Z" />
                    </svg>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void loadAnalytics(period);
                    onMutation('Analytics refreshed.');
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-all hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.35)]"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                  aria-label="Refresh analytics"
                >
                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-white/40">
                {analytics ? `Updated ${formatDateTime(analytics.generatedAt)}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 pt-2 sm:px-6">
          {error ? <InlineMessage tone="error" message={error} /> : null}
          {loading && !analytics ? (
            <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.02] px-6 py-12 text-center font-mono text-[12px] tracking-[0.14em] uppercase text-white/40">
              Loading analytics…
            </div>
          ) : analytics ? (
            <div className="overflow-x-auto pb-2 [scrollbar-color:rgba(255,255,255,0.1)_transparent] [scrollbar-width:thin]">
              <div className="grid min-w-full grid-flow-col auto-cols-[minmax(17rem,1fr)] gap-5 xl:auto-cols-[calc((100%-3.75rem)/4)]">
                {heroCards.map((card) => (
                  <HeroKpiCard key={card.id} card={card} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Surface>

      {analytics ? (
        <>
          <Surface>
            <div className="border-b border-white/[0.06] px-6 py-6 sm:px-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                    Decision map
                  </p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-[2rem]">
                    See how the user base splits into meaningful outcomes
                  </h3>
                </div>
                <span
                  className="inline-flex h-9 items-center rounded-[10px] px-3 font-mono text-[10.5px] font-semibold tracking-[0.12em] uppercase text-white/78"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {analytics.periodLabel}
                </span>
              </div>
            </div>

            <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
              <div
                className="flex gap-1.5 overflow-x-auto pb-1"
                role="tablist"
                aria-label="Analytics decision trees"
              >
                {analytics.decisionTrees.map((tree) => {
                  const isActive = activeDecisionTree?.id === tree.id;

                  return (
                    <button
                      key={tree.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`decision-tree-panel-${tree.id}`}
                      onClick={() => setSelectedTreeId(tree.id)}
                      className="shrink-0 h-9 px-3 transition-all"
                      style={{
                        borderRadius: 10,
                        background: isActive
                          ? 'rgba(153,247,255,0.14)'
                          : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${
                          isActive ? 'rgba(153,247,255,0.4)' : 'rgba(255,255,255,0.1)'
                        }`,
                        color: isActive ? 'rgb(153,247,255)' : 'rgba(255,255,255,0.78)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      }}
                    >
                      <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold whitespace-nowrap">
                        {tree.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-6 sm:px-7">
              {activeDecisionTree ? (
                <div
                  id={`decision-tree-panel-${activeDecisionTree.id}`}
                  role="tabpanel"
                  aria-label={activeDecisionTree.title}
                >
                  <DecisionTreeMap tree={activeDecisionTree} />
                </div>
              ) : (
                <div className="rounded-[22px] border border-dashed border-white/[0.1] bg-white/[0.02] px-5 py-12 text-center">
                  <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-white/40 mb-1">
                    Awaiting data
                  </p>
                  <p className="text-[13px] text-white/55">
                    Decision trees will appear here once the analytics snapshot has enough data
                    to segment users.
                  </p>
                </div>
              )}
            </div>
          </Surface>
        </>
      ) : null}
    </div>
  );
}
