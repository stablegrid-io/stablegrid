'use client';

import { ArrowRight, BellRing } from 'lucide-react';
import Link from 'next/link';
import type { ConsoleAlert } from '@/components/home/home/console-types';

interface IncomingAlertsPanelProps {
  alerts: ConsoleAlert[];
}

const TONE_CLASSES: Record<ConsoleAlert['tone'], string> = {
  warning: 'border-amber-500/20 bg-amber-500/8 text-amber-800 dark:text-amber-200',
  positive:
    'border-brand-500/20 bg-brand-500/8 text-brand-800 dark:text-brand-200',
  neutral: 'border-slate-500/15 bg-slate-500/5 text-slate-800 dark:text-slate-200'
};

export const IncomingAlertsPanel = ({ alerts }: IncomingAlertsPanelProps) => {
  return (
    <section
      data-testid="home-incoming-alerts"
      className="rounded-[1.8rem] border border-[#d3dbd4] bg-[rgba(249,246,240,0.82)] p-4 shadow-[0_22px_64px_-52px_rgba(15,23,42,0.3)] backdrop-blur dark:border-white/10 dark:bg-[rgba(10,18,14,0.76)]"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-mono font-bold uppercase tracking-[0.18em] text-[#24362d] dark:text-[#e3efe8]">
            Incoming Alerts
          </h2>
          <p className="mt-1 text-xs text-[#627068] dark:text-[#8aa496]">
            Resolve the highest-value next steps first.
          </p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#cdd8d1] bg-white/70 text-[#4b5f55] dark:border-white/10 dark:bg-white/5 dark:text-[#9eb7aa]">
          <BellRing className="h-4 w-4" />
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <Link
            key={alert.id}
            href={alert.href}
            data-testid={`incoming-alert-${alert.id}`}
            className={`block rounded-[1.15rem] border px-4 py-3 transition-colors hover:border-brand-500/30 ${TONE_CLASSES[alert.tone]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{alert.label}</p>
                <p className="mt-1 text-xs opacity-80">{alert.detail}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium">
                {alert.actionLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
