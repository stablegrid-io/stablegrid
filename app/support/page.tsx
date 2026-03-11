import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Support · stableGrid.io',
  description: 'Support and contact paths for StableGrid users.'
};

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-light-bg px-4 py-10 text-text-light-primary dark:bg-dark-bg dark:text-text-dark-primary">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
            StableGrid
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Support</h1>
          <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
            We handle launch-blocking support requests.
          </p>
        </header>

        <section className="space-y-3 rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
          <h2 className="text-xl font-semibold">Contact channel</h2>
          <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
            Email{' '}
            <a
              href="mailto:support@stablegrid.io"
              className="font-medium text-brand-600 hover:underline dark:text-brand-300"
            >
              support@stablegrid.io
            </a>{' '}
            with subject format:
            <span className="block font-mono text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              [StableGrid] brief issue summary
            </span>
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
          <h2 className="text-xl font-semibold">Include in report</h2>
          <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
            Include route URL, timestamp, expected behavior, actual behavior, and screenshots.
            For account-specific problems include your login email.
          </p>
          <Link
            href="/support/report-bug"
            className="inline-flex items-center rounded-lg border border-brand-500/40 bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 dark:border-brand-400/50 dark:bg-brand-400 dark:text-slate-900 dark:hover:bg-brand-300"
          >
            Report a bug
          </Link>
        </section>

        <section className="space-y-3 rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
          <h2 className="text-xl font-semibold">Data requests</h2>
          <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
            GDPR export and delete actions are available in Settings {'>'} Danger Zone after
            login.
          </p>
        </section>
      </div>
    </main>
  );
}
