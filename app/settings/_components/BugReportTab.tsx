'use client';

import { BugReportForm } from '@/app/support/report-bug/BugReportForm';

interface BugReportTabProps {
  onBackToSupport: () => void;
}

export function BugReportTab({ onBackToSupport }: BugReportTabProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Report a bug</h1>
        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          Send a reproducible issue report and we will triage it with environment context.
        </p>
      </header>

      <section className="rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
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
