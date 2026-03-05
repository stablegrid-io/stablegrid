'use client';

import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, CalendarDays, ShieldCheck, TimerReset } from 'lucide-react';
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
    <header className="rounded-2xl border border-[#d7e4dc] bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.12),transparent_40%),linear-gradient(180deg,#ffffff,#f5faf7)] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:border-[#254438] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.18),transparent_42%),linear-gradient(180deg,#0d1813,#0a1511)]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
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
          <dl className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 sm:grid-cols-4">
            <div className="rounded-lg border border-[#d9e7df] bg-white/85 px-2.5 py-2 dark:border-[#2a4a3d] dark:bg-[#0d1b15]/90">
              <dt className="inline-flex items-center gap-1 font-medium uppercase tracking-[0.08em]">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                Current Role
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {snapshot.currentRole}
              </dd>
            </div>
            <div className="rounded-lg border border-[#d9e7df] bg-white/85 px-2.5 py-2 dark:border-[#2a4a3d] dark:bg-[#0d1b15]/90">
              <dt className="inline-flex items-center gap-1 font-medium uppercase tracking-[0.08em]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Next Role
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {snapshot.nextRole}
              </dd>
            </div>
            <div className="rounded-lg border border-[#d9e7df] bg-white/85 px-2.5 py-2 dark:border-[#2a4a3d] dark:bg-[#0d1b15]/90">
              <dt className="inline-flex items-center gap-1 font-medium uppercase tracking-[0.08em]">
                <CalendarDays className="h-3.5 w-3.5" />
                Tenure Start
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {formatDate(snapshot.tenureStartDate)}
              </dd>
            </div>
            <div className="rounded-lg border border-[#d9e7df] bg-white/85 px-2.5 py-2 dark:border-[#2a4a3d] dark:bg-[#0d1b15]/90">
              <dt className="inline-flex items-center gap-1 font-medium uppercase tracking-[0.08em]">
                <TimerReset className="h-3.5 w-3.5" />
                Active Days
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {snapshot.activeDaysLast30}/30 days
              </dd>
            </div>
          </dl>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            {criteriaMetCount}/{criteriaTotal} promotion criteria met.
            {` `}
            {formatKwh(snapshot.advancementProgress.kwhEarned)} earned.
          </p>
        </div>

        <div className="rounded-xl border border-[#d7e4dc] bg-white/80 p-3.5 dark:border-[#2b4b3d] dark:bg-[#102018]/90">
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

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Link
              href={primaryRoute}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:ring-offset-[#0a1511]"
            >
              Advance to next role
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#development-plan"
              className="inline-flex items-center justify-center rounded-lg border border-[#c8dad0] bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-[#2c4d3e] dark:bg-[#102018] dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:text-emerald-300 dark:ring-offset-[#0a1511]"
            >
              Review development plan
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
