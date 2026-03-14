'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
  const metricCards = [
    {
      label: 'Ready',
      value: `${snapshot.promotionReadinessPct}%`,
      detail: `toward ${snapshot.nextRole}`
    },
    {
      label: 'Criteria',
      value: `${criteriaMetCount}/${criteriaTotal}`,
      detail: 'promotion gates met'
    },
    {
      label: 'Cadence',
      value: `${snapshot.activeDaysLast30}/30`,
      detail: 'active days this month'
    },
    {
      label: 'Output',
      value: formatKwh(snapshot.advancementProgress.kwhEarned),
      detail: 'total earned output'
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

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metricCards.map((card) => (
            <article
              key={card.label}
              className="rounded-[1.35rem] border border-brand-200/70 bg-white/78 px-4 py-3.5 dark:border-brand-400/20 dark:bg-[#0f2019]/72"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4c6a5a] dark:text-[#89b09d]">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0f1d16] dark:text-[#eef9f2]">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-[#5b6c64] dark:text-[#9db6aa]">{card.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </header>
  );
}
