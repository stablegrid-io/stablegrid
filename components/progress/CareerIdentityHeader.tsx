'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { WorkerCareerSnapshot } from '@/types/progress';
import { CircularReadinessProgress } from '@/components/progress/CircularReadinessProgress';

interface CareerIdentityHeaderProps {
  userName: string;
  snapshot: WorkerCareerSnapshot;
  primaryRoute: string;
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
  primaryRoute
}: CareerIdentityHeaderProps) {
  const criteriaMetCount = snapshot.promotionCriteria.filter((criterion) => criterion.met).length;
  const criteriaTotal = snapshot.promotionCriteria.length;

  return (
    <header className="rounded-2xl border border-light-border bg-light-surface p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-dark-border dark:bg-dark-surface">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-500">
        Worker HRB
      </p>
      <div className="mt-2 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <div className="space-y-3 min-w-0">
          <h1 className="text-2xl font-bold leading-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            {userName} · HRB
          </h1>
          <p
            className="text-sm text-slate-600 dark:text-slate-300"
            aria-live="polite"
          >
            Role {snapshot.careerLevel}: {snapshot.currentRole}. Next role: {snapshot.nextRole}.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 font-medium text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
              {snapshot.currentRole} → {snapshot.nextRole}
            </span>
            <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 font-medium text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
              {criteriaMetCount}/{criteriaTotal} criteria met
            </span>
            <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 font-medium text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
              {formatKwh(snapshot.advancementProgress.kwhEarned)} earned
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Started {formatDate(snapshot.tenureStartDate)} · Active {snapshot.activeDaysLast30}/30 days
          </p>
        </div>

        <div className="rounded-xl border border-light-border bg-light-bg p-3.5 dark:border-dark-border dark:bg-dark-bg">
          <div className="flex items-center gap-3">
            <CircularReadinessProgress
              value={snapshot.promotionReadinessPct}
              label={`Promotion readiness ${snapshot.promotionReadinessPct}% toward ${snapshot.nextRole}`}
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                Promotion target
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {snapshot.nextRole}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Keep focus on the unmet criteria below.
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            <Link
              href={primaryRoute}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:ring-offset-dark-surface"
            >
              Advance to next role
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#development-plan"
              className="inline-flex items-center justify-center text-xs font-medium text-text-light-secondary underline-offset-2 transition hover:text-brand-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:text-text-dark-secondary dark:hover:text-brand-300"
            >
              Review development plan
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
