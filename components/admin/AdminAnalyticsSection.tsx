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
  'sales',
  'average_session_duration',
  'average_platform_time',
  'average_task_time'
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

const Surface = ({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,12,0.82),rgba(5,8,8,0.92))] shadow-[0_30px_80px_-52px_rgba(0,0,0,0.82)] backdrop-blur-xl ${className}`}
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,185,153,0.12),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_30%)]" />
    <div className="relative">{children}</div>
  </section>
);

const InlineMessage = ({
  tone,
  message
}: {
  tone: 'error' | 'success';
  message: string;
}) => (
  <div
    className={`rounded-[18px] border px-4 py-3 text-sm ${
      tone === 'error'
        ? 'border-rose-400/25 bg-rose-500/10 text-rose-100'
        : 'border-brand-400/25 bg-brand-500/10 text-[#d7f6ec]'
    }`}
  >
    {message}
  </div>
);

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
  valueFormat
}: {
  points: Array<{ value: number; label: string; date: string }>;
  lineClassName: string;
  glowClassName: string;
  dotClassName: string;
  valueFormat: 'number' | 'currency_eur' | 'duration_seconds';
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
  const tooltipLeftPx = activePoint ? Math.min(width - 30, Math.max(30, activePoint.x)) : width / 2;
  const tooltipTopPx = activePoint ? Math.max(4, activePoint.y - 36) : 6;

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
    return <div className="h-16 rounded-[18px] bg-white/[0.03]" />;
  }

  return (
    <div className="relative pt-1">
      {activePoint ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-[12px] border border-white/24 bg-[linear-gradient(180deg,rgba(23,29,29,0.94),rgba(10,14,14,0.94))] px-2.5 py-1.5 text-[11px] font-medium text-white shadow-[0_14px_26px_-18px_rgba(0,0,0,0.92)] backdrop-blur-xl transition-all duration-150 ease-out"
          style={{
            left: `${tooltipLeftPx}px`,
            top: `${tooltipTopPx}px`
          }}
        >
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[#d9e8e2]">{activePoint.date}</span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span className={dotClassName}>{formatPointValue(activePoint.value)}</span>
          </div>
          <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-[35%] rotate-45 border-b border-r border-white/20 bg-[#111919]" />
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

const HeroKpiCard = ({ card }: { card: HeroKpiCardData }) => {
  const TrendIcon = card.deltaValue < 0 ? TrendingDown : TrendingUp;
  const deltaTone =
    card.deltaValue < 0
      ? 'text-rose-200'
      : card.deltaValue > 0
        ? 'text-[#d7f6ec]'
        : 'text-[#c8d7d1]';

  return (
    <div className="group relative overflow-hidden rounded-[30px] border border-white/[0.14] bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_24px_56px_-40px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition duration-300 ease-out hover:-translate-y-px hover:border-white/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent_32%),radial-gradient(circle_at_bottom,rgba(34,185,153,0.07),transparent_38%)] opacity-80 transition group-hover:opacity-100" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-[0.01em] text-[#d1ded8]">{card.title}</p>
            <p className="mt-2 text-[2.25rem] font-semibold tracking-tight text-white">{card.value}</p>
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ${card.accentClasses.iconWrap}`}
          >
            <card.icon className={`h-5 w-5 ${card.accentClasses.icon}`} strokeWidth={2.2} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${card.accentClasses.pill} ${deltaTone}`}
          >
            <TrendIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
            {card.deltaValue === 0 ? '0.0%' : `${card.deltaValue > 0 ? '+' : '-'}${formatChange(card.deltaValue)}`}
          </span>
          <span className="text-[#90a49b]">{card.deltaLabel}</span>
        </div>

        <div className="mt-3 text-[0.72rem] uppercase tracking-[0.2em] text-[#8aa097]">{card.note}</div>
        <div className="mt-5">
          <Sparkline
            points={card.trendPoints}
            lineClassName={card.accentClasses.line}
            glowClassName={card.accentClasses.glow}
            dotClassName={card.accentClasses.dot}
            valueFormat={card.valueFormat}
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
    segmentSurface: 'bg-[linear-gradient(180deg,rgba(30,86,76,0.42),rgba(15,26,24,0.92))] border-[#6ce0c6]/20',
    badge: 'bg-[#6ce0c6]/14 text-[#bff8ea] border-[#6ce0c6]/20',
    eyebrow: 'text-[#8de9d0]',
    connector: 'bg-[#5ad6ba]/62',
    outcomeBar: 'bg-[linear-gradient(90deg,rgba(91,231,194,0.95),rgba(171,255,232,0.92))]',
    outcomeGlow: 'bg-[#5be7c2]/16'
  },
  teal: {
    segmentSurface: 'bg-[linear-gradient(180deg,rgba(24,93,80,0.38),rgba(15,25,23,0.92))] border-[#5bd9be]/18',
    badge: 'bg-[#5bd9be]/14 text-[#c7fff0] border-[#5bd9be]/20',
    eyebrow: 'text-[#8be9d2]',
    connector: 'bg-[#5bd9be]/58',
    outcomeBar: 'bg-[linear-gradient(90deg,rgba(91,217,190,0.95),rgba(179,255,235,0.92))]',
    outcomeGlow: 'bg-[#5bd9be]/16'
  },
  blue: {
    segmentSurface: 'bg-[linear-gradient(180deg,rgba(31,69,110,0.36),rgba(15,22,28,0.92))] border-sky-300/18',
    badge: 'bg-sky-300/12 text-sky-100 border-sky-300/18',
    eyebrow: 'text-sky-200',
    connector: 'bg-sky-300/54',
    outcomeBar: 'bg-[linear-gradient(90deg,rgba(90,198,250,0.95),rgba(170,232,255,0.92))]',
    outcomeGlow: 'bg-sky-300/14'
  },
  amber: {
    segmentSurface: 'bg-[linear-gradient(180deg,rgba(118,84,17,0.34),rgba(23,20,15,0.92))] border-amber-300/18',
    badge: 'bg-amber-300/12 text-amber-100 border-amber-300/18',
    eyebrow: 'text-amber-200',
    connector: 'bg-amber-300/56',
    outcomeBar: 'bg-[linear-gradient(90deg,rgba(255,214,10,0.95),rgba(255,233,148,0.92))]',
    outcomeGlow: 'bg-amber-300/14'
  },
  violet: {
    segmentSurface: 'bg-[linear-gradient(180deg,rgba(84,51,130,0.34),rgba(20,17,25,0.92))] border-violet-300/18',
    badge: 'bg-violet-300/12 text-violet-100 border-violet-300/18',
    eyebrow: 'text-violet-200',
    connector: 'bg-violet-300/54',
    outcomeBar: 'bg-[linear-gradient(90deg,rgba(171,132,255,0.95),rgba(222,202,255,0.92))]',
    outcomeGlow: 'bg-violet-300/14'
  },
  slate: {
    segmentSurface: 'bg-[linear-gradient(180deg,rgba(56,67,78,0.26),rgba(17,20,24,0.92))] border-white/10',
    badge: 'bg-white/[0.08] text-[#dfe8e3] border-white/10',
    eyebrow: 'text-[#bed0c7]',
    connector: 'bg-white/34',
    outcomeBar: 'bg-[linear-gradient(90deg,rgba(180,192,201,0.95),rgba(232,239,244,0.9))]',
    outcomeGlow: 'bg-white/[0.08]'
  },
  orange: {
    segmentSurface: 'bg-[linear-gradient(180deg,rgba(127,69,32,0.34),rgba(27,19,16,0.92))] border-orange-300/18',
    badge: 'bg-orange-300/12 text-orange-100 border-orange-300/18',
    eyebrow: 'text-orange-200',
    connector: 'bg-orange-300/56',
    outcomeBar: 'bg-[linear-gradient(90deg,rgba(255,159,67,0.95),rgba(255,212,170,0.92))]',
    outcomeGlow: 'bg-orange-300/14'
  },
  rose: {
    segmentSurface: 'bg-[linear-gradient(180deg,rgba(124,48,73,0.34),rgba(25,16,20,0.92))] border-rose-300/18',
    badge: 'bg-rose-300/12 text-rose-100 border-rose-300/18',
    eyebrow: 'text-rose-200',
    connector: 'bg-rose-300/56',
    outcomeBar: 'bg-[linear-gradient(90deg,rgba(251,113,133,0.95),rgba(255,205,214,0.92))]',
    outcomeGlow: 'bg-rose-300/14'
  }
};

const InfoHint = ({ label, content }: { label: string; content: string }) => (
  <span className="group relative inline-flex items-center">
    <button
      type="button"
      className="inline-flex h-5.5 w-5.5 items-center justify-center rounded-full border border-white/14 bg-white/[0.03] text-[#98aba3] transition duration-200 hover:border-white/25 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/35"
      aria-label={label}
    >
      <CircleHelp className="h-3.5 w-3.5" strokeWidth={2.1} />
    </button>
    <span className="pointer-events-none absolute right-0 top-[calc(100%+8px)] z-20 w-64 origin-top-right translate-y-1 scale-[0.98] rounded-[14px] border border-white/18 bg-[linear-gradient(180deg,rgba(18,25,25,0.97),rgba(8,12,12,0.97))] px-3 py-2 text-[11px] leading-5 text-[#dce9e3] opacity-0 shadow-[0_18px_34px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl transition duration-200 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100">
      {content}
      <span className="absolute right-3 top-0 h-2 w-2 -translate-y-1/2 rotate-45 border-l border-t border-white/16 bg-[#111919]" />
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

const DecisionTreeOutcomeCard = ({
  outcome,
  accent
}: {
  outcome: AdminAnalyticsTreeOutcome;
  accent: AdminAnalyticsTreeAccent;
}) => {
  const style = TREE_ACCENT_STYLES[accent];

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[#8ea49a]">{outcome.label}</p>
        <InfoHint
          label={`${outcome.label} definition`}
          content={getCompletionMeaningHint(outcome.label)}
        />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight text-white">{outcome.ratePct}%</p>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${style.badge}`}>
          {outcome.completedUsers}/{outcome.totalUsers}
        </span>
      </div>
      <div className={`mt-3 h-2 overflow-hidden rounded-full ${style.outcomeGlow}`}>
        <div
          className={`h-full rounded-full ${style.outcomeBar}`}
          style={{ width: `${Math.max(outcome.ratePct, outcome.totalUsers > 0 ? 6 : 0)}%` }}
        />
      </div>
      <p className="mt-3 text-xs leading-5 text-[#93a89f]">{outcome.helper}</p>
    </div>
  );
};

const DecisionTreeSegmentCard = ({ segment }: { segment: AdminAnalyticsTreeSegment }) => {
  const style = TREE_ACCENT_STYLES[segment.accent];

  return (
    <div className={`rounded-[24px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${style.segmentSurface}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className={`text-[0.68rem] uppercase tracking-[0.18em] ${style.eyebrow}`}>Segment</p>
            <InfoHint
              label={`${segment.label} calculation`}
              content="Segment count is the number of users in this branch. Share = segment users / total users."
            />
          </div>
          <h4 className="mt-2 text-lg font-semibold tracking-tight text-white">{segment.label}</h4>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${style.badge}`}>
          {segment.sharePct}% of total
        </span>
      </div>
      <p className="mt-4 text-[2rem] font-semibold tracking-tight text-white">{segment.count}</p>
      <p className="mt-2 text-sm leading-6 text-[#a7bbb2]">{segment.helper}</p>
    </div>
  );
};

const DecisionTreeMap = ({ tree }: { tree: AdminAnalyticsDecisionTree }) => {
  const [leftSegment, rightSegment] = tree.segments;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[#7fbba7]">{tree.windowLabel}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">{tree.title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#9fb1aa]">{tree.description}</p>
        </div>
        {tree.note ? (
          <div className="rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs text-[#d7e5df]">
            {tree.note}
          </div>
        ) : null}
      </div>

      <div className="lg:hidden">
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2">
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#8fa79d]">{tree.rootLabel}</p>
            <InfoHint
              label={`${tree.rootLabel} definition`}
              content="Total users in scope for this analytics view after the selected period filter is applied."
            />
          </div>
          <p className="mt-3 text-[2.2rem] font-semibold tracking-tight text-white">{tree.rootCount}</p>
          <p className="mt-2 text-sm text-[#9fb1aa]">{tree.rootHelper}</p>
        </div>
        <div className="mt-4 space-y-4">
          {tree.segments.map((segment) => {
            const style = TREE_ACCENT_STYLES[segment.accent];

            return (
              <div key={segment.id} className="relative pl-5">
                <div className="absolute left-[0.45rem] top-0 bottom-0 w-[2px] rounded-full bg-white/20" />
                <div className={`absolute left-[0.45rem] top-8 h-[2px] w-4 rounded-full ${style.connector}`} />
                <DecisionTreeSegmentCard segment={segment} />
                <div className="mt-4 space-y-3 pl-4">
                  {segment.outcomes.map((outcome) => (
                    <div key={outcome.id} className="relative pl-4">
                      <div className={`absolute left-0 top-6 h-[2px] w-4 rounded-full ${style.connector}`} />
                      <DecisionTreeOutcomeCard outcome={outcome} accent={segment.accent} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="relative mx-auto max-w-6xl px-4 pb-2 pt-2">
          <div className="absolute left-1/2 top-[6.25rem] h-10 w-[2px] -translate-x-1/2 rounded-full bg-white/28" />
          <div className="flex justify-center">
            <div className="w-[20rem] rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-6 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_48px_-30px_rgba(0,0,0,0.9)]">
              <div className="flex items-center justify-center gap-2">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#8fa79d]">{tree.rootLabel}</p>
                <InfoHint
                  label={`${tree.rootLabel} definition`}
                  content="Total users in scope for this analytics view after the selected period filter is applied."
                />
              </div>
              <p className="mt-3 text-[2.6rem] font-semibold tracking-tight text-white">{tree.rootCount}</p>
              <p className="mt-2 text-sm text-[#9fb1aa]">{tree.rootHelper}</p>
            </div>
          </div>

          <div className="relative mt-10 grid grid-cols-2 gap-10 border-t border-white/20 pt-10">
            <div className="absolute left-1/2 top-0 h-10 w-[2px] -translate-x-1/2 rounded-full bg-white/28" />
            {[leftSegment, rightSegment].map((segment) => {
              const style = TREE_ACCENT_STYLES[segment.accent];

              return (
                <div key={segment.id} className="relative">
                  <div className={`absolute left-1/2 top-[-2.5rem] h-10 w-[2px] -translate-x-1/2 rounded-full ${style.connector}`} />
                  <DecisionTreeSegmentCard segment={segment} />
                  <div className="relative mt-8 grid grid-cols-2 gap-4 border-t border-white/16 pt-8">
                    <div className={`absolute left-1/2 top-0 h-8 w-[2px] -translate-x-1/2 rounded-full ${style.connector}`} />
                    {segment.outcomes.map((outcome) => (
                      <div key={outcome.id} className="relative">
                        <div className={`absolute left-1/2 top-[-2rem] h-8 w-[2px] -translate-x-1/2 rounded-full ${style.connector}`} />
                        <DecisionTreeOutcomeCard outcome={outcome} accent={segment.accent} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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
        valueFormat:
          metric.id === 'sales'
            ? 'currency_eur'
            : metric.id === 'average_session_duration' ||
                metric.id === 'average_platform_time' ||
                metric.id === 'average_task_time'
              ? 'duration_seconds'
              : 'number'
      };
    });
  }, [analytics?.trend, primaryMetrics]);

  return (
    <div className="space-y-6">
      <Surface>
        <div className="border-b border-white/10 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[#7fbba7]">Analytics</p>
              <h2
                className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                See growth, engagement, and learning health
              </h2>
            </div>
            <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
              <div className="flex items-center gap-2 sm:hidden">
                <label htmlFor="analytics-period-select" className="sr-only">
                  Analytics period
                </label>
                <div className="relative min-w-0 flex-1">
                  <select
                    id="analytics-period-select"
                    value={period}
                    onChange={(event) => setPeriod(event.target.value as AdminAnalyticsPeriod)}
                    className="h-11 w-full appearance-none rounded-full border border-white/12 bg-white/[0.04] px-4 pr-10 text-sm font-medium text-[#d7e5df] outline-none transition focus:border-brand-400/30 focus:bg-white/[0.06]"
                  >
                    {PERIOD_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#8fa69b]">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 12 8"
                      className="h-2.5 w-2.5 fill-current"
                    >
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
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-white transition hover:border-brand-400/30 hover:bg-white/[0.08]"
                  aria-label="Refresh analytics"
                >
                  <RefreshCw className="h-4.5 w-4.5" strokeWidth={2.2} />
                </button>
              </div>

              <div className="hidden flex-wrap gap-2 sm:flex">
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPeriod(option.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      period === option.id
                        ? 'border-brand-400/35 bg-brand-500/15 text-[#d5f4ea]'
                        : 'border-white/12 bg-white/[0.04] text-[#c8d7d1] hover:border-brand-400/20 hover:bg-white/[0.06]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <p className="text-xs text-[#8fa69b]">
                  {analytics ? `Updated ${formatDateTime(analytics.generatedAt)}` : 'Loading analytics...'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void loadAnalytics(period);
                    onMutation('Analytics refreshed.');
                  }}
                  className="hidden rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white transition hover:border-brand-400/30 hover:bg-white/[0.08] sm:inline-flex"
                >
                  Refresh analytics
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          {error ? <InlineMessage tone="error" message={error} /> : null}
          {loading && !analytics ? (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-10 text-sm text-[#9fb1aa]">
              Loading analytics snapshot...
            </div>
          ) : analytics ? (
            <div className="overflow-x-auto pb-2 [scrollbar-color:rgba(140,163,154,0.55)_transparent] [scrollbar-width:thin]">
              <div className="grid min-w-full grid-flow-col auto-cols-[minmax(18.5rem,1fr)] gap-4 xl:auto-cols-[calc((100%-3rem)/4)]">
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
            <div className="border-b border-white/10 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[#7fbba7]">
                    Decision map
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white sm:text-[2rem]">
                    See how the user base splits into meaningful outcomes
                  </h3>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-[#d7e5df]">
                  {analytics.periodLabel}
                </div>
              </div>
            </div>

            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
              <div
                className="flex gap-2 overflow-x-auto pb-1"
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
                      className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'border-brand-400/35 bg-brand-500/15 text-[#d5f4ea]'
                          : 'border-white/12 bg-white/[0.04] text-[#c8d7d1] hover:border-brand-400/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      {tree.title}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-5 py-5 sm:px-6">
              {activeDecisionTree ? (
                <div
                  id={`decision-tree-panel-${activeDecisionTree.id}`}
                  role="tabpanel"
                  aria-label={activeDecisionTree.title}
                >
                  <DecisionTreeMap tree={activeDecisionTree} />
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-10 text-sm text-[#9fb1aa]">
                  Decision trees will appear here once the analytics snapshot has enough data to segment users.
                </div>
              )}
            </div>
          </Surface>
        </>
      ) : null}
    </div>
  );
}
