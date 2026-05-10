'use client';

/**
 * Tier progression panel — home dashboard.
 *
 * Three columns (Junior / Mid / Senior) with the user's current tier
 * highlighted, followed by a checklist of the criteria that gate the next
 * promotion. Mirrors the topbar dropdown gauge but expands every gate into
 * a labelled progress row so the user can see exactly what's left.
 *
 * The panel only re-renders when the relevant store slices change; tier
 * resolution and progress reports are derived through useMemo so the
 * checklists are stable across unrelated store updates.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { useHoverPrefetch } from '@/lib/hooks/useHoverPrefetch';
import {
  getTierProgressReport,
  getUserTier,
  type CriterionProgress,
  type TierContext,
  type UserTier,
} from '@/lib/tiers';

interface TierCopy {
  label: string;
  description: string;
}

const TIER_COPY: Record<UserTier, TierCopy> = {
  junior: {
    label: 'Junior',
    description:
      'Field manuals open. Reading the building blocks, shipping the first transformations.',
  },
  mid: {
    label: 'Mid',
    description:
      'Three Junior tracks logged across two disciplines, with practice volume to match the reading.',
  },
  senior: {
    label: 'Senior',
    description:
      'A topic mastered end-to-end, three Mid tracks, and seventy-five practice tasks under the belt.',
  },
};

const TIER_ORDER: UserTier[] = ['junior', 'mid', 'senior'];

export const TierProgressionPanel = () => {
  const prefetchRoute = useHoverPrefetch();
  const xp = useProgressStore((state) => state.xp);
  const completedTracks = useProgressStore((state) => state.completedTracks);
  const practiceTasksSolved = useProgressStore((state) => state.practiceTasksSolved);
  const practiceModulesCompleteByTier = useProgressStore(
    (state) => state.practiceModulesCompleteByTier,
  );

  const ctx = useMemo<TierContext>(
    () => ({
      kwh: xp,
      completedTracks,
      practiceTasksSolved,
      practiceModulesCompleteByTier,
    }),
    [xp, completedTracks, practiceTasksSolved, practiceModulesCompleteByTier],
  );

  const tier = getUserTier(ctx);
  const tierIndex = TIER_ORDER.indexOf(tier);

  const midReport = useMemo(() => getTierProgressReport(ctx, 'mid'), [ctx]);
  const seniorReport = useMemo(() => getTierProgressReport(ctx, 'senior'), [ctx]);

  const nextReport = tier === 'senior' ? null : tier === 'mid' ? seniorReport : midReport;
  const nextLabel = nextReport?.target === 'senior' ? 'Senior' : 'Mid';

  return (
    <section className="border border-on-surface bg-surface">
      <div className="flex items-center justify-between border-b border-on-surface p-4 bg-surface-container-low">
        <h3 className="font-ui-label text-on-surface uppercase tracking-wider text-[12px]">
          Tier progression
        </h3>
        <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant tabular-nums">
          Tier {tierIndex + 1} / 3
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3">
        {TIER_ORDER.map((t, i) => {
          const reached = i <= tierIndex;
          const isCurrent = t === tier;
          const status = isCurrent ? 'Current' : reached ? 'Achieved' : 'Locked';
          return (
            <div
              key={t}
              className={`p-6 border-b md:border-b-0 ${
                i < TIER_ORDER.length - 1 ? 'md:border-r' : ''
              } border-surface-dim ${
                isCurrent
                  ? 'bg-primary-fixed/40'
                  : reached
                    ? 'bg-surface'
                    : 'bg-surface-container-low/40'
              }`}
            >
              <div className="flex items-baseline justify-between mb-2">
                <span
                  className={`font-data-mono text-[10px] uppercase tracking-[0.18em] ${
                    isCurrent ? 'text-primary' : 'text-on-surface-variant'
                  }`}
                >
                  Tier {i + 1}
                </span>
                <span
                  className={`font-data-mono text-[10px] uppercase tracking-[0.18em] tabular-nums ${
                    isCurrent
                      ? 'text-primary'
                      : reached
                        ? 'text-on-surface-variant'
                        : 'text-on-surface-variant/60'
                  }`}
                >
                  {status}
                </span>
              </div>
              <h4
                className={`font-h2 text-[28px] leading-tight mb-2 ${
                  reached ? 'text-on-surface' : 'text-on-surface-variant/60'
                }`}
              >
                {TIER_COPY[t].label}
              </h4>
              <p
                className={`font-body text-[14px] leading-relaxed ${
                  reached ? 'text-on-surface-variant' : 'text-on-surface-variant/60'
                }`}
              >
                {TIER_COPY[t].description}
              </p>
            </div>
          );
        })}
      </div>

      {nextReport && (
        <div className="border-t border-on-surface p-6">
          <div className="flex items-center justify-between mb-5">
            <span className="font-data-mono uppercase text-[10px] tracking-[0.18em] text-on-surface-variant">
              To advance · {nextLabel}
            </span>
            {nextReport.metAll && (
              <span className="font-data-mono uppercase text-[10px] tracking-[0.18em] text-primary">
                All criteria met
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
            {nextReport.criteria.map((criterion) => (
              <CriterionRow key={criterion.id} criterion={criterion} />
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Link
              href="/learn"
              onMouseEnter={() => prefetchRoute('/learn')}
              onFocus={() => prefetchRoute('/learn')}
              className="font-ui-label uppercase tracking-wider text-[12px] text-primary border-b-2 border-primary hover:text-surface-tint hover:border-surface-tint pb-1"
            >
              Open Learn →
            </Link>
          </div>
        </div>
      )}

      {!nextReport && (
        <div className="border-t border-on-surface px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <span className="font-body-lg text-on-surface-variant">
            You&rsquo;re at the top of the ladder. Keep the streak — the curriculum keeps growing.
          </span>
          <Link
            href="/learn"
            onMouseEnter={() => prefetchRoute('/learn')}
            onFocus={() => prefetchRoute('/learn')}
            className="font-ui-label uppercase tracking-wider text-[12px] text-primary border-b-2 border-primary hover:text-surface-tint hover:border-surface-tint pb-1"
          >
            Open Learn →
          </Link>
        </div>
      )}
    </section>
  );
};

const CriterionRow = ({ criterion }: { criterion: CriterionProgress }) => {
  const pct =
    criterion.target > 0
      ? Math.min(100, Math.round((criterion.current / criterion.target) * 100))
      : 0;
  // Reserve the same vertical space whether the row is met (with check icon)
  // or not — material-symbols-outlined inflates the line box, which would
  // otherwise push the progress bar down a couple of px on met rows and
  // misalign them across the two-column grid.
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <span
          className={`font-body text-[14px] leading-snug inline-flex items-baseline gap-1.5 ${
            criterion.met ? 'text-on-surface' : 'text-on-surface-variant'
          }`}
        >
          <span
            aria-hidden
            className={`material-symbols-outlined text-[14px] w-4 shrink-0 align-[-2px] text-primary ${
              criterion.met ? 'opacity-100' : 'opacity-0'
            }`}
          >
            check
          </span>
          <span>{criterion.label}</span>
        </span>
        <span className="font-data-mono text-[10px] uppercase tracking-wider text-on-surface-variant tabular-nums shrink-0">
          {criterion.display}
        </span>
      </div>
      <div className="h-1 bg-surface-dim relative">
        <div
          className={`absolute inset-y-0 left-0 ${criterion.met ? 'bg-primary' : 'bg-on-surface'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {criterion.detail && (
        <div className="mt-1.5 font-data-mono text-[10px] uppercase tracking-wider text-on-surface-variant/80">
          {criterion.detail}
        </div>
      )}
    </div>
  );
};
