'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { forwardRef } from 'react';
import type { CurrentModuleCardData } from '@/components/home/activation-table/types';

interface CurrentModuleCardProps {
  data: CurrentModuleCardData;
}

export const CurrentModuleCard = forwardRef<HTMLAnchorElement, CurrentModuleCardProps>(
  ({ data }, ref) => {
    return (
      <article
        data-testid="activation-current-module"
        className="rounded-[1.6rem] border border-warning-500/25 bg-[#11100d]/92 p-5 shadow-[0_28px_64px_-46px_rgba(245,158,11,0.38)]"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-warning-300">
          Current module
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-text-dark-primary">{data.title}</h2>
        <p className="mt-2 inline-flex rounded-full border border-warning-500/25 bg-warning-500/10 px-2.5 py-1 text-xs font-medium text-warning-200">
          {data.stateLabel}
        </p>
        <p className="mt-3 text-sm text-text-dark-secondary">{data.descriptor}</p>
        <p className="mt-2 text-sm text-warning-100">{data.progressLine}</p>

        <Link
          ref={ref}
          href={data.cta.href}
          data-testid="activation-primary-cta"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-warning-400/45 bg-warning-500/90 px-4 py-2 text-sm font-semibold text-dark-bg transition-colors hover:bg-warning-400"
        >
          {data.cta.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </article>
    );
  }
);

CurrentModuleCard.displayName = 'CurrentModuleCard';
