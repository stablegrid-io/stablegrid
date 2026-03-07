'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ReviewNotesCardData } from '@/components/home/activation-table/types';

interface ReviewNotesCardProps {
  data: ReviewNotesCardData;
}

export const ReviewNotesCard = ({ data }: ReviewNotesCardProps) => {
  return (
    <article
      data-testid="activation-review-notes"
      className="rounded-[1.2rem] border border-slate-500/25 bg-[#101317]/90 p-4"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-300">
        {data.descriptor}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-text-dark-primary">{data.title}</h3>
      <p className="mt-2 text-sm text-text-dark-secondary">{data.note}</p>
      <Link
        href={data.cta.href}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-400/30 bg-slate-500/10 px-3 py-1.5 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-500/16"
      >
        {data.cta.label}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </article>
  );
};
