'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { PendingTaskCardData } from '@/components/home/activation-table/types';

interface PendingTaskCardProps {
  data: PendingTaskCardData;
}

export const PendingTaskCard = ({ data }: PendingTaskCardProps) => {
  return (
    <article
      data-testid="activation-pending-task"
      className="rounded-[1.2rem] border border-warning-500/18 bg-[#15110d]/90 p-4"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-warning-300">
        {data.status}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-text-dark-primary">{data.title}</h3>
      <p className="mt-2 text-sm text-text-dark-secondary">{data.note}</p>
      <Link
        href={data.cta.href}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-warning-500/35 bg-warning-500/10 px-3 py-1.5 text-sm font-medium text-warning-100 transition-colors hover:bg-warning-500/18"
      >
        {data.cta.label}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </article>
  );
};
