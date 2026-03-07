'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import type { PromotionCriterion } from '@/types/progress';

interface PromotionGateListProps {
  criteria: PromotionCriterion[];
  onCriterionClick?: (criterion: PromotionCriterion) => void;
}

export function PromotionGateList({
  criteria,
  onCriterionClick
}: PromotionGateListProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  const unmetCriteria = useMemo(
    () => criteria.filter((criterion) => !criterion.met),
    [criteria]
  );
  const metCriteria = useMemo(
    () => criteria.filter((criterion) => criterion.met),
    [criteria]
  );
  const visibleCriteria = showCompleted ? criteria : unmetCriteria;
  const allCriteriaMet = unmetCriteria.length === 0;

  return (
    <div>
      {metCriteria.length > 0 ? (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => setShowCompleted((value) => !value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-500 hover:text-brand-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-brand-300"
          >
            {showCompleted ? 'Hide completed criteria' : `Show completed (${metCriteria.length})`}
          </button>
        </div>
      ) : null}

      {allCriteriaMet && !showCompleted ? (
        <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-800 dark:border-brand-500/40 dark:bg-brand-900/25 dark:text-brand-200">
          All criteria are met for this role. Select the next role stage to see pending requirements.
        </div>
      ) : (
        <ul className="space-y-2" aria-label="Promotion criteria">
          {visibleCriteria.map((criterion) => (
            <li
              key={criterion.id}
              className="rounded-lg border border-light-border bg-light-bg px-3 py-2.5 dark:border-dark-border dark:bg-dark-bg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {criterion.met ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-500" aria-hidden />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                    )}
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {criterion.label}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {criterion.currentValueLabel} / {criterion.targetValueLabel}
                  </p>
                </div>
                <Link
                  href={criterion.route}
                  onClick={() => onCriterionClick?.(criterion)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition hover:border-brand-500 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:border-slate-600 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-brand-300"
                >
                  Open
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    criterion.met ? 'bg-brand-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${criterion.progressPct}%` }}
                  aria-label={`${criterion.progressPct}% complete`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
