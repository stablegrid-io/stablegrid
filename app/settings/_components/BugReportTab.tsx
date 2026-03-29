'use client';

import { BugReportForm } from '@/app/support/report-bug/BugReportForm';

interface BugReportTabProps {
  onBackToSupport: () => void;
}

export function BugReportTab({ onBackToSupport }: BugReportTabProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
          StableGrid
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Report a bug</h1>
        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          Send a reproducible issue report and we will triage it with environment context.
        </p>
        <p className="rounded-xl border border-brand-500/25 bg-brand-500/10 px-4 py-2 text-sm text-brand-700 dark:text-brand-200">
          Confirmed valid bug reports are compensated with kWh.
        </p>
      </header>

      <section className="rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
        <BugReportForm />
      </section>

      <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
        Need direct help instead?{' '}
        <button
          type="button"
          onClick={onBackToSupport}
          className="font-medium text-brand-600 hover:underline dark:text-brand-300"
        >
          Open support
        </button>
        .
      </p>
    </div>
  );
}
