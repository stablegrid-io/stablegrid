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
    <div data-testid="promotion-criteria-list">
      {metCriteria.length > 0 ? (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => setShowCompleted((value) => !value)}
            className="rounded-full border border-[#d5ddd7] bg-white/70 px-3 py-1.5 text-xs font-medium text-[#56635c] transition-colors hover:border-brand-500/30 hover:text-brand-700 dark:border-white/10 dark:bg-white/5 dark:text-[#9db6aa] dark:hover:border-brand-400/30 dark:hover:text-brand-300"
          >
            {showCompleted ? 'Hide completed criteria' : `Show completed (${metCriteria.length})`}
          </button>
        </div>
      ) : null}

      {allCriteriaMet && !showCompleted ? (
        <div className="rounded-[18px] border border-brand-200 bg-brand-50/90 px-3.5 py-3 text-sm text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200">
          All criteria are met for this role. Select the next role stage to see pending requirements.
        </div>
      ) : (
        <ul className="space-y-2" aria-label="Promotion criteria">
          {visibleCriteria.map((criterion) => (
            <li
              key={criterion.id}
              data-testid={
                criterion.route === '/practice/notebooks'
                  ? 'promotion-criterion-notebooks'
                  : undefined
              }
              className="rounded-[18px] border border-[#d6ddd7] bg-white/74 px-3.5 py-3 dark:border-white/8 dark:bg-white/4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {criterion.met ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-500" aria-hidden />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                    )}
                    <p className="text-sm font-medium text-[#121b18] dark:text-[#f2f7f4]">
                      {criterion.label}
                    </p>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#6d746f] dark:text-[#7e9589]">
                    {criterion.currentValueLabel} / {criterion.targetValueLabel}
                  </p>
                </div>
                <Link
                  href={criterion.route}
                  onClick={() => onCriterionClick?.(criterion)}
                  className="inline-flex items-center gap-1 rounded-full border border-[#d5ddd7] bg-white/80 px-3 py-1.5 text-xs font-medium text-[#56635c] transition-colors hover:border-brand-500/30 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:bg-white/5 dark:text-[#9db6aa] dark:hover:border-brand-400/30 dark:hover:text-brand-300"
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
