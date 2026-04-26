import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support · stablegrid',
  description: 'Support and contact paths for stablegrid users.'
};

export default function SupportPage() {
  return (
    <main className="min-h-screen px-4 py-10 text-on-surface" style={{ backgroundColor: '#0a0c0e' }}>
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-on-surface-variant hover:text-on-surface transition-colors"
        >
          ← Home
        </a>
        <header className="space-y-3">
          <p className="font-bold text-sm tracking-tight" style={{ color: '#99f7ff', letterSpacing: '0.08em' }}>stablegrid</p>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Support</h1>
          <p className="text-sm text-on-surface-variant">
            We aim to reply to every support request within 2 business days. Critical bugs
            affecting sign-in, billing, or data loss take top priority.
          </p>
        </header>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Contact channel</h2>
          <p className="text-sm leading-7 text-on-surface-variant/80">
            Reach us by email at the address below. Use the suggested subject format so we can
            route your message quickly.
          </p>
          <a
            href="mailto:support@stablegrid.io?subject=%5Bstablegrid%5D%20"
            className="inline-block w-full rounded-[14px] border border-white/[0.06] bg-[#0c0e10] px-4 py-3 text-sm font-medium text-primary transition hover:border-primary/40 hover:bg-[#0e1114] min-h-[44px]"
          >
            support@stablegrid.io
          </a>
          <p className="text-xs text-on-surface-variant">
            Suggested subject:
            <span className="ml-2 inline-block rounded-[8px] bg-[#0c0e10] px-2 py-1 font-mono text-xs text-on-surface-variant">
              [stablegrid] brief issue summary
            </span>
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Include in report</h2>
          <p className="text-sm leading-7 text-on-surface-variant/80">
            Include route URL, timestamp, expected behavior, actual behavior, and screenshots.
            For account-specific problems include your login email.
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Data requests</h2>
          <p className="text-sm leading-7 text-on-surface-variant/80">
            GDPR export and delete actions are available in Settings {'>'} Danger Zone after
            login.
          </p>
        </section>
      </div>
    </main>
  );
}
