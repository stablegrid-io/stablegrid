'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Clock3,
  ListChecks,
  Target,
  TrendingDown,
  TrendingUp,
  Zap
} from 'lucide-react';
import type { WorkerCareerSnapshot } from '@/types/progress';

interface CareerIdentityHeaderProps {
  userName: string;
  snapshot: WorkerCareerSnapshot;
  primaryRoute: string;
  onReviewDetails: () => void;
  onPrimaryAction?: () => void;
}

const formatDate = (isoDate: string | null) => {
  if (!isoDate) return 'Not started';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Not started';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
};

const formatKwh = (value: number) =>
  `${value.toLocaleString(undefined, {
    minimumFractionDigits: value < 10 ? 1 : 0,
    maximumFractionDigits: 1
  })} kWh`;

const clampPct = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

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

interface KpiCardData {
  label: string;
  value: string;
  detail: string;
  deltaValue: number;
  deltaLabel: string;
  icon: LucideIcon;
  trendPoints: Array<{
    label: string;
    value: number;
  }>;
  accentClasses: {
    iconWrap: string;
    icon: string;
    line: string;
    glow: string;
    pill: string;
    dot: string;
  };
}

const KpiSparkline = ({
  points,
  lineClassName,
  glowClassName,
  dotClassName
}: {
  points: Array<{ label: string; value: number }>;
  lineClassName: string;
  glowClassName: string;
  dotClassName: string;
}) => {
  const values = points.map((point) => point.value);
  const width = 220;
  const height = 62;
  const linePath = buildSparklinePath(values, width, height);
  const areaPath = buildSparklineArea(values, width, height);

  if (!linePath || !areaPath) {
    return <div className="h-16 rounded-[18px] bg-white/[0.03]" />;
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const pointsWithCoords = values.map((value, index) => ({
    x: values.length === 1 ? width / 2 : (index / (values.length - 1)) * width,
    y: height - ((value - min) / range) * (height - 6) - 3,
    key: `${points[index]?.label ?? 'Point'}-${index}`
  }));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full" preserveAspectRatio="none">
      <path d={areaPath} className={glowClassName} />
      <path
        d={linePath}
        className={lineClassName}
        fill="none"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pointsWithCoords.map((point) => (
        <circle
          key={point.key}
          cx={point.x}
          cy={point.y}
          r={2.7}
          className={`${dotClassName} stroke-white/60`}
          strokeWidth={0.8}
        />
      ))}
    </svg>
  );
};

const KpiCard = ({ card }: { card: KpiCardData }) => {
  const TrendIcon = card.deltaValue < 0 ? TrendingDown : TrendingUp;
  const deltaTone =
    card.deltaValue < 0
      ? 'text-rose-200'
      : card.deltaValue > 0
        ? 'text-[#d7f6ec]'
        : 'text-[#c8d7d1]';

  return (
    <article className="group relative overflow-hidden rounded-[30px] border border-white/[0.14] bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_24px_56px_-40px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition duration-300 ease-out hover:-translate-y-px hover:border-white/20 lg:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent_32%),radial-gradient(circle_at_bottom,rgba(34,185,153,0.07),transparent_38%)] opacity-80 transition group-hover:opacity-100" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#9ab2a6]">
              {card.label}
            </p>
            <p className="mt-2 text-[2.05rem] font-semibold tracking-tight text-white">{card.value}</p>
          </div>
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ${card.accentClasses.iconWrap}`}
          >
            <card.icon className={`h-5 w-5 ${card.accentClasses.icon}`} strokeWidth={2.2} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${card.accentClasses.pill} ${deltaTone}`}
          >
            <TrendIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
            {card.deltaValue === 0
              ? '0.0%'
              : `${card.deltaValue > 0 ? '+' : '-'}${formatChange(card.deltaValue)}`}
          </span>
          <span className="text-[#90a49b]">{card.deltaLabel}</span>
        </div>

        <div className="mt-3 text-[0.68rem] uppercase tracking-[0.18em] text-[#8aa097]">{card.detail}</div>
        <div className="mt-4">
          <KpiSparkline
            points={card.trendPoints}
            lineClassName={card.accentClasses.line}
            glowClassName={card.accentClasses.glow}
            dotClassName={card.accentClasses.dot}
          />
        </div>
      </div>
    </article>
  );
};

export function CareerIdentityHeader({
  userName,
  snapshot,
  primaryRoute,
  onReviewDetails,
  onPrimaryAction
}: CareerIdentityHeaderProps) {
  const criteriaMetCount = snapshot.promotionCriteria.filter((criterion) => criterion.met).length;
  const criteriaTotal = snapshot.promotionCriteria.length;
  const primaryTask = snapshot.developmentTasks[0] ?? null;
  const focusLabel = primaryTask
    ? `Next focus: ${primaryTask.label}.`
    : 'All current role criteria are met.';
  const heroBody = `Role ${snapshot.careerLevel}: ${snapshot.currentRole}. ${focusLabel}`;
  const progressWidth = Math.max(0, Math.min(100, snapshot.promotionReadinessPct));
  const competencyById = new Map(
    snapshot.competencyScores.map((score) => [score.id, clampPct(score.score)])
  );
  const criterionProgressByToken = (token: string) =>
    clampPct(
      snapshot.promotionCriteria.find((criterion) => criterion.id.includes(token))?.progressPct ?? 0
    );

  const readinessTrendPoints =
    snapshot.promotionCriteria.length > 0
      ? snapshot.promotionCriteria.map((criterion) => ({
          label: criterion.label,
          value: clampPct(criterion.progressPct)
        }))
      : [{ label: 'Readiness', value: clampPct(snapshot.promotionReadinessPct) }];

  let cumulativeCriteria = 0;
  const criteriaTrendPoints =
    snapshot.promotionCriteria.length > 0
      ? snapshot.promotionCriteria.map((criterion, index) => {
          if (criterion.met) {
            cumulativeCriteria += 1;
          }
          const ratio = ((cumulativeCriteria / Math.max(1, index + 1)) * 100);
          return {
            label: criterion.label,
            value: clampPct(ratio)
          };
        })
      : [{ label: 'Criteria', value: 0 }];

  const cadenceTrendPoints = [
    { label: 'Knowledge', value: competencyById.get('knowledge') ?? 0 },
    { label: 'Incident response', value: competencyById.get('incident_response') ?? 0 },
    { label: 'Consistency', value: competencyById.get('consistency') ?? 0 },
    { label: 'Field operations', value: competencyById.get('field_operations') ?? 0 },
    { label: 'Active days', value: clampPct((snapshot.activeDaysLast30 / 30) * 100) }
  ];

  const outputTrendPoints = [
    {
      label: 'Tracks',
      value: clampPct(
        (snapshot.advancementProgress.tracksCompleted /
          Math.max(1, snapshot.advancementProgress.tracksTotal)) *
          100
      )
    },
    { label: 'Notebook reviews', value: criterionProgressByToken('-notebooks') },
    { label: 'Missions', value: criterionProgressByToken('-missions') },
    { label: 'Flashcards', value: criterionProgressByToken('-flashcards') },
    { label: 'Output', value: criterionProgressByToken('-kwh-earned') }
  ];

  const metricCards: KpiCardData[] = [
    {
      label: 'Ready',
      value: `${snapshot.promotionReadinessPct}%`,
      detail: `toward ${snapshot.nextRole}`,
      deltaValue: clampPct(snapshot.promotionReadinessPct),
      deltaLabel: 'toward target',
      icon: Target,
      trendPoints: readinessTrendPoints,
      accentClasses: {
        iconWrap: 'bg-[rgba(34,185,153,0.12)]',
        icon: 'text-[#8af1d5]',
        line: 'stroke-[#8af1d5]',
        glow: 'fill-[rgba(34,185,153,0.18)]',
        pill: 'border-emerald-400/20 bg-emerald-400/12',
        dot: 'fill-[#8af1d5]'
      }
    },
    {
      label: 'Criteria',
      value: `${criteriaMetCount}/${criteriaTotal}`,
      detail: 'promotion gates met',
      deltaValue: criteriaTotal > 0 ? clampPct((criteriaMetCount / criteriaTotal) * 100) : 0,
      deltaLabel: 'coverage',
      icon: ListChecks,
      trendPoints: criteriaTrendPoints,
      accentClasses: {
        iconWrap: 'bg-[rgba(90,198,250,0.12)]',
        icon: 'text-[#8bd8ff]',
        line: 'stroke-[#8bd8ff]',
        glow: 'fill-[rgba(90,198,250,0.18)]',
        pill: 'border-sky-400/20 bg-sky-400/12',
        dot: 'fill-[#8bd8ff]'
      }
    },
    {
      label: 'Cadence',
      value: `${snapshot.activeDaysLast30}/30`,
      detail: 'active days this month',
      deltaValue: clampPct((snapshot.activeDaysLast30 / 30) * 100),
      deltaLabel: '30-day cadence',
      icon: Clock3,
      trendPoints: cadenceTrendPoints,
      accentClasses: {
        iconWrap: 'bg-[rgba(171,132,255,0.12)]',
        icon: 'text-[#d0b6ff]',
        line: 'stroke-[#d0b6ff]',
        glow: 'fill-[rgba(171,132,255,0.18)]',
        pill: 'border-violet-400/20 bg-violet-400/12',
        dot: 'fill-[#d0b6ff]'
      }
    },
    {
      label: 'Output',
      value: formatKwh(snapshot.advancementProgress.kwhEarned),
      detail: 'total earned output',
      deltaValue: criterionProgressByToken('-kwh-earned'),
      deltaLabel: 'energy target',
      icon: Zap,
      trendPoints: outputTrendPoints,
      accentClasses: {
        iconWrap: 'bg-[rgba(255,214,10,0.14)]',
        icon: 'text-[#ffd86f]',
        line: 'stroke-[#ffd86f]',
        glow: 'fill-[rgba(255,214,10,0.18)]',
        pill: 'border-amber-400/20 bg-amber-400/12',
        dot: 'fill-[#ffd86f]'
      }
    }
  ];

  return (
    <header
      data-testid="hrb-overview"
      className="relative overflow-hidden rounded-[2rem] border border-brand-200/70 bg-[#f4f8f5] p-5 shadow-[0_24px_80px_-58px_rgba(15,23,42,0.32)] backdrop-blur dark:border-brand-400/25 dark:bg-[linear-gradient(140deg,#0c1a14,#09120f)] sm:p-6"
    >
      <div
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.74), rgba(238,246,241,0.62)), radial-gradient(circle at 92% 8%, rgba(34,185,153,0.14), transparent 34%), linear-gradient(90deg, rgba(15,23,42,0.03) 1px, transparent 1px), linear-gradient(rgba(15,23,42,0.03) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 32px 32px, 32px 32px'
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          background:
            'radial-gradient(circle at 82% 18%, rgba(34,185,153,0.18), transparent 26%), linear-gradient(180deg, rgba(8,16,13,0.08), rgba(8,16,13,0.34)), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 32px 32px, 32px 32px'
        }}
      />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.85fr)] lg:items-end">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-700 dark:text-brand-300">
              Worker HRB
            </p>
            <h1
              className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-[#0f1d16] dark:text-[#f2fbf5] sm:text-4xl lg:text-[3.4rem] lg:leading-[1.02]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              You&apos;re {snapshot.promotionReadinessPct}% ready for {snapshot.nextRole}.
            </h1>
            <p
              className="mt-3 max-w-2xl text-sm leading-7 text-[#2f4c3d] dark:text-[#c8ddd1] sm:text-[15px]"
              aria-live="polite"
            >
              {heroBody}
            </p>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[#567364] dark:text-[#83a795]">
                <span>{userName}</span>
                <span>{snapshot.nextRole}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#dce6df] dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,rgba(143,153,163,0.96),rgba(120,131,142,0.92))] transition-[width] duration-500"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5 text-xs text-[#3b5849] dark:text-[#a9c3b5]">
              <span className="rounded-full border border-brand-200/70 bg-white/80 px-3 py-1.5 dark:border-brand-400/20 dark:bg-brand-500/10">
                Role {snapshot.careerLevel}: {snapshot.currentRole}
              </span>
              <span className="rounded-full border border-brand-200/70 bg-white/80 px-3 py-1.5 dark:border-brand-400/20 dark:bg-brand-500/10">
                Started {formatDate(snapshot.tenureStartDate)}
              </span>
              <span className="rounded-full border border-brand-200/70 bg-white/80 px-3 py-1.5 dark:border-brand-400/20 dark:bg-brand-500/10">
                Active {snapshot.activeDaysLast30}/30 days
              </span>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-brand-200/70 bg-white/78 p-4 shadow-[0_22px_60px_-48px_rgba(15,23,42,0.38)] backdrop-blur dark:border-brand-400/20 dark:bg-[#0f2019]/72 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4c6a5a] dark:text-[#89b09d]">
              Next step
            </p>
            <p className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[#0f1d16] dark:text-[#eef9f2]">
              {primaryTask ? primaryTask.label : 'Promotion review'}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#3b5849] dark:text-[#a9c3b5]">
              {primaryTask
                ? `This is the highest-leverage move for getting closer to ${snapshot.nextRole}.`
                : 'You have met the current promotion requirements. Review the detailed readiness evidence below.'}
            </p>

            <div className="mt-5 flex flex-col gap-2.5">
              <Link
                href={primaryRoute}
                data-testid="hrb-next-action"
                onClick={() => onPrimaryAction?.()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-[#072014] transition-colors hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-brand-400 dark:text-[#07100a] dark:hover:bg-brand-300 dark:ring-offset-[#0f2019]"
              >
                Open next step
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={onReviewDetails}
                className="inline-flex items-center justify-center text-xs font-medium text-[#486055] transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-[#b0c6ba] dark:hover:text-brand-300"
              >
                Review readiness details
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => (
            <KpiCard key={card.label} card={card} />
          ))}
        </div>
      </div>
    </header>
  );
}
