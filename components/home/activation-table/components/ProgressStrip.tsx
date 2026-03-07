'use client';

import type { ProgressStripData } from '@/components/home/activation-table/types';

interface ProgressStripProps {
  data: ProgressStripData;
}

export const ProgressStrip = ({ data }: ProgressStripProps) => {
  return (
    <section
      data-testid="activation-progress-strip"
      aria-label="Progress summary"
      className="rounded-2xl border border-dark-border/80 bg-dark-bg/75 px-4 py-3 shadow-[0_22px_50px_-40px_rgba(0,0,0,0.7)]"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-400">
        {data.headline}
      </p>
      <p className="mt-2 text-sm text-text-dark-secondary">
        {data.items.join(' · ')}
      </p>
    </section>
  );
};
