'use client';

import { ArrowRight, Layers3 } from 'lucide-react';
import Link from 'next/link';

interface SystemStatusPanelProps {
  primaryActionHref: string;
  primaryActionLabel: string;
  simplified: boolean;
  onToggleSimplified: () => void;
}

export const SystemStatusPanel = ({
  primaryActionHref,
  primaryActionLabel,
  simplified,
  onToggleSimplified
}: SystemStatusPanelProps) => {
  return (
    <aside
      data-testid="home-system-status"
      className="rounded-[1.35rem] border border-[#d3dbd4] bg-[rgba(249,246,240,0.72)] p-3 shadow-[0_18px_48px_-44px_rgba(15,23,42,0.24)] backdrop-blur dark:border-white/10 dark:bg-[rgba(10,18,14,0.7)]"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-[#24362d] dark:text-[#e3efe8]">
            System Status
          </h2>
          <p className="mt-1 text-sm text-[#607169] dark:text-[#97aca1]">
            KPIs are now pinned inside the learning grid.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={primaryActionHref}
            data-testid="home-primary-action"
            className="inline-flex items-center gap-2 rounded-xl bg-[#101918] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0a100e] dark:bg-brand-400 dark:text-[#07100a] dark:hover:bg-brand-300"
          >
            {primaryActionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onToggleSimplified}
            data-testid="home-simplify-toggle"
            className="inline-flex items-center gap-2 rounded-xl border border-[#cfd8cf] bg-white/64 px-3 py-2 text-sm font-medium text-[#31453a] transition-colors hover:border-brand-500/30 hover:text-[#152019] dark:border-white/10 dark:bg-white/5 dark:text-[#b9d0c3] dark:hover:border-brand-300/30"
          >
            <Layers3 className="h-4 w-4" />
            {simplified ? 'Show grid' : 'Simplify view'}
          </button>
        </div>
      </div>
    </aside>
  );
};
