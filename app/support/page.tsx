import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Support · stableGrid.io',
  description: 'Support and contact paths for StableGrid users.'
};

export default function SupportPage() {
  return (
    <main className="min-h-screen px-4 py-10 text-on-surface" style={{ backgroundColor: '#0a0c0e' }}>
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <a href="/" className="inline-flex items-center gap-2 text-[13px] font-medium text-on-surface-variant/50 hover:text-on-surface-variant transition-colors">
          ← Home
        </a>
        <header className="space-y-3">
          <p className="font-bold text-sm tracking-tight" style={{ color: '#99f7ff', letterSpacing: '0.08em' }}>STABLEGRID.IO</p>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Support</h1>
          <p className="text-sm text-on-surface-variant/40">
            We handle launch-blocking support requests.
          </p>
        </header>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Contact channel</h2>
          <p className="text-sm leading-7 text-on-surface-variant/60">
            Email{' '}
            <a
              href="mailto:support@stablegrid.io"
              className="font-medium text-primary hover:underline"
            >
              support@stablegrid.io
            </a>{' '}
            with subject format:
            <span className="block font-mono text-xs text-on-surface-variant/40">
              [StableGrid] brief issue summary
            </span>
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Include in report</h2>
          <p className="text-sm leading-7 text-on-surface-variant/60">
            Include route URL, timestamp, expected behavior, actual behavior, and screenshots.
            For account-specific problems include your login email.
          </p>
          <Link
            href="/support/report-bug"
            className="inline-flex items-center rounded-[14px] border border-primary/40 bg-primary px-3 py-2 text-sm font-semibold text-[#0a0c0e] transition hover:bg-primary/90"
          >
            Report a bug
          </Link>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Data requests</h2>
          <p className="text-sm leading-7 text-on-surface-variant/60">
            GDPR export and delete actions are available in Settings {'>'} Danger Zone after
            login.
          </p>
        </section>
      </div>
    </main>
  );
}
