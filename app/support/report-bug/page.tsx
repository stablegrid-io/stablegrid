import type { Metadata } from 'next';
import Link from 'next/link';
import { BugReportForm } from './BugReportForm';

export const metadata: Metadata = {
  title: 'Report a Bug · stableGrid.io',
  description: 'Report product issues to the StableGrid team.'
};

export default function ReportBugPage() {
  return (
    <main className="min-h-screen bg-[#0c0e10] px-4 py-10 text-text-light-primary dark:text-text-dark-primary">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
            StableGrid
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Report a bug</h1>
          <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
            Send a reproducible issue report and we will triage it with environment context.
          </p>
          <p className="rounded-[14px] border border-brand-500/25 bg-brand-500/10 px-4 py-2 text-sm text-brand-700 dark:text-brand-200">
            Confirmed valid bug reports are compensated with kWh.
          </p>
        </header>

        <section className="rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <BugReportForm />
        </section>

        <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          Need direct help instead?{' '}
          <Link
            href="/support"
            className="font-medium text-brand-600 hover:underline dark:text-brand-300"
          >
            Open support
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
