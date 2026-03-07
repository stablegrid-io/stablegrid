'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { forwardRef } from 'react';
import type { ResumeHeroData } from '@/components/home/entry/types';

interface ResumeHeroProps {
  data: ResumeHeroData;
}

export const ResumeHero = forwardRef<HTMLAnchorElement, ResumeHeroProps>(
  function ResumeHero({ data }, ref) {
    return (
      <section className="rounded-2xl border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-surface">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">
          Workspace Ready
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
          {data.moduleTitle}
        </h1>
        <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          {data.chapterProgress}
        </p>
        <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          {data.statusLine}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            ref={ref}
            href={data.primaryCta.href}
            data-testid="home-primary-action"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-500 bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 dark:text-dark-bg dark:hover:bg-brand-400"
          >
            {data.primaryCta.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={data.secondaryCta.href}
            className="inline-flex items-center rounded-xl border border-light-border bg-light-bg px-3.5 py-2 text-sm font-medium text-text-light-secondary transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary dark:hover:border-brand-400 dark:hover:text-brand-300"
          >
            {data.secondaryCta.label}
          </Link>
        </div>
      </section>
    );
  }
);
