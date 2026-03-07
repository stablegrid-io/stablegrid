'use client';

import { ArrowRight, History } from 'lucide-react';
import Link from 'next/link';
import type { ConsoleActivityItem } from '@/components/home/home/console-types';

interface RecentActivityPanelProps {
  items: ConsoleActivityItem[];
}

const KIND_LABEL: Record<ConsoleActivityItem['kind'], string> = {
  theory: 'Theory',
  practice: 'Practice',
  grid: 'Grid Ops'
};

export const RecentActivityPanel = ({ items }: RecentActivityPanelProps) => {
  return (
    <section
      data-testid="home-recent-activity"
      className="rounded-[2rem] border border-[#d3dbd4] bg-[rgba(249,246,240,0.82)] p-5 shadow-[0_24px_72px_-58px_rgba(15,23,42,0.32)] backdrop-blur dark:border-white/10 dark:bg-[rgba(10,18,14,0.76)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4e5f57] dark:text-[#8aa496]">
            <History className="h-3.5 w-3.5" />
            Recent activity
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#101918] dark:text-[#f3f7f4]">
            Continue where the shift left off.
          </h2>
        </div>
        <Link
          href="/progress"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#486055] transition-colors hover:text-brand-700 dark:text-[#b0c6ba] dark:hover:text-brand-300"
        >
          View progress
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            data-testid={`recent-activity-${item.id}`}
            className="flex flex-col gap-3 rounded-[1.35rem] border border-[#d6ddd7] bg-white/72 px-4 py-4 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="mb-2 inline-flex rounded-full border border-[#d5ddd7] bg-white/70 px-2 py-0.5 text-[11px] font-medium text-[#5b6c64] dark:border-white/10 dark:bg-white/5 dark:text-[#9db6aa]">
                {KIND_LABEL[item.kind]}
              </div>
              <p className="truncate text-base font-semibold text-[#101918] dark:text-[#f3f7f4]">
                {item.label}
              </p>
              <p className="mt-1 text-sm text-[#627068] dark:text-[#8aa496]">
                {item.detail}
              </p>
            </div>
            <Link
              href={item.href}
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[#cad4cd] bg-white/70 px-4 py-2 text-sm font-medium text-[#1d2d25] transition-colors hover:border-brand-500/30 hover:text-[#101918] dark:border-white/10 dark:bg-white/5 dark:text-[#e3efe8]"
            >
              {item.actionLabel}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};
