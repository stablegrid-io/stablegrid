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
  up: 'text-emerald-600 dark:text-emerald-400',
  flat: 'text-slate-500 dark:text-slate-400',
  down: 'text-amber-600 dark:text-amber-400'
} as const;

export function CompetencyMatrix({ scores }: CompetencyMatrixProps) {
  return (
    <section
      aria-labelledby="competency-matrix-heading"
      className="rounded-2xl border border-[#d6e5dd] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:border-[#284739] dark:bg-[#0f1914]"
    >
      <h2
        id="competency-matrix-heading"
        className="text-sm font-semibold uppercase tracking-[0.11em] text-slate-700 dark:text-slate-200"
      >
        Competency Matrix
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        HR-aligned capability profile built from operational evidence.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {scores.map((score) => {
          const TrendIcon = trendIcon[score.trend];
          return (
            <article
              key={score.id}
              className="rounded-lg border border-[#d8e5dd] bg-[#fbfdfc] p-3 dark:border-[#2c4a3c] dark:bg-[#14231b]"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {score.label}
                </h3>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${trendTone[score.trend]}`}>
                  <TrendIcon className="h-3.5 w-3.5" />
                  {score.trend}
                </span>
              </div>
              <div className="mt-2 flex items-end gap-2">
                <strong className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {score.score}
                </strong>
                <span className="mb-1 text-xs text-slate-500 dark:text-slate-400">/100</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#e2ece7] dark:bg-[#23372d]">
                <div
                  className={`h-full rounded-full ${
                    score.score >= 75
                      ? 'bg-emerald-500'
                      : score.score >= 55
                        ? 'bg-sky-500'
                        : 'bg-amber-500'
                  }`}
                  style={{ width: `${score.score}%` }}
                />
              </div>
              {score.score < 60 ? (
                <Link
                  href={score.recommendedAction.route}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200"
                >
                  {score.recommendedAction.label}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ) : (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
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
