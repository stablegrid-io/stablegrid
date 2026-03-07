'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { NextRecommendedCardData } from '@/components/home/activation-table/types';

interface NextRecommendedCardProps {
  data: NextRecommendedCardData;
}

export const NextRecommendedCard = ({ data }: NextRecommendedCardProps) => {
  return (
    <article
      data-testid="activation-next-recommended"
      className="rounded-[1.35rem] border border-brand-500/28 bg-[#081411]/92 p-4 shadow-[0_20px_44px_-36px_rgba(34,185,153,0.45)]"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-300">
        Next recommended
      </p>
      <h3 className="mt-2 text-xl font-semibold text-text-dark-primary">{data.title}</h3>
      <p className="mt-2 text-sm text-text-dark-secondary">{data.reason}</p>
      {data.effort ? (
        <p className="mt-2 text-xs text-brand-200">Estimated effort: {data.effort}</p>
      ) : null}
      <Link
        href={data.cta.href}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-brand-500/35 bg-brand-500/15 px-3 py-2 text-sm font-semibold text-brand-100 transition-colors hover:bg-brand-500/25"
      >
        {data.cta.label}
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </article>
  );
};
