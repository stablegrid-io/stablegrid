'use client';

import Link from 'next/link';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from 'lucide-react';
import type { CareerCompetencyScore } from '@/types/progress';

interface CompetencyMatrixProps {
  scores: CareerCompetencyScore[];
}

const trendIcon = {
  up: ArrowUpRight,
  flat: Minus,
  down: ArrowDownRight
} as const;

const trendTone = {
  up: 'text-brand-700 dark:text-brand-300',
  flat: 'text-slate-500 dark:text-slate-400',
  down: 'text-amber-600 dark:text-amber-400'
} as const;

export function CompetencyMatrix({ scores }: CompetencyMatrixProps) {
  return (
    <section
      aria-labelledby="competency-matrix-heading"
      className="rounded-[1.5rem] border border-[#d6ddd7] bg-white/72 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-5"
    >
      <h2
        id="competency-matrix-heading"
        className="text-sm font-semibold tracking-[-0.02em] text-[#121b18] dark:text-[#f2f7f4]"
      >
        Capability profile
      </h2>
      <p className="mt-1 text-sm leading-6 text-[#6d746f] dark:text-[#7e9589]">
        A quieter read of the signals behind readiness.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {scores.map((score) => {
          const TrendIcon = trendIcon[score.trend];
          return (
            <article
              key={score.id}
              className="rounded-[1.35rem] border border-[#d6ddd7] bg-white/74 p-3.5 dark:border-white/8 dark:bg-white/4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#121b18] dark:text-[#f2f7f4]">
                  {score.label}
                </h3>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${trendTone[score.trend]}`}>
                  <TrendIcon className="h-3.5 w-3.5" />
                  {score.trend}
                </span>
              </div>
              <div className="mt-2 flex items-end gap-2">
                <strong className="text-2xl font-bold text-[#121b18] dark:text-[#f2f7f4]">
                  {score.score}
                </strong>
                <span className="mb-1 text-xs text-[#6d746f] dark:text-[#7e9589]">/100</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full ${
                    score.score >= 75
                      ? 'bg-success-500'
                      : score.score >= 55
                        ? 'bg-brand-500'
                        : 'bg-amber-500'
                  }`}
                  style={{ width: `${score.score}%` }}
                />
              </div>
              {score.score < 60 ? (
                <Link
                  href={score.recommendedAction.route}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 transition hover:text-brand-600 dark:text-brand-300 dark:hover:text-brand-200"
                >
                  {score.recommendedAction.label}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ) : (
                <p className="mt-2 text-xs text-[#6d746f] dark:text-[#7e9589]">
                  Performance is in range for this competency.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
