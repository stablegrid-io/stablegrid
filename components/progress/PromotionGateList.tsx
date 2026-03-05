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
  const visibleCriteria = showCompleted || unmetCriteria.length === 0
    ? criteria
    : unmetCriteria;

  return (
    <div>
      {metCriteria.length > 0 && unmetCriteria.length > 0 ? (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => setShowCompleted((value) => !value)}
            className="rounded-md border border-[#cbddd3] px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-[#315142] dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-300"
          >
            {showCompleted ? 'Hide completed criteria' : `Show completed (${metCriteria.length})`}
          </button>
        </div>
      ) : null}

      <ul className="space-y-2" aria-label="Promotion criteria">
      {visibleCriteria.map((criterion) => (
        <li
          key={criterion.id}
          className="rounded-lg border border-[#d8e6de] bg-white px-3 py-2.5 dark:border-[#2a4a3c] dark:bg-[#111f18]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {criterion.met ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
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
              className="inline-flex items-center gap-1 rounded-md border border-[#cadcd2] px-2 py-1 text-xs font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-[#2f5141] dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-300"
            >
              Open
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#e6eeea] dark:bg-[#24372d]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                criterion.met ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${criterion.progressPct}%` }}
              aria-label={`${criterion.progressPct}% complete`}
            />
          </div>
        </li>
      ))}
      </ul>
    </div>
  );
}
