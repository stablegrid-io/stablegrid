import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms · stableGrid.io',
  description: 'Terms of use for StableGrid.'
};

export default function TermsPage() {
  return (
    <main className="min-h-screen px-4 py-10 text-on-surface" style={{ backgroundColor: '#0a0c0e' }}>
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <a href="/" className="inline-flex items-center gap-2 text-[13px] font-medium text-on-surface-variant/50 hover:text-on-surface-variant transition-colors">
          ← Home
        </a>
        <header className="space-y-3">
          <p className="font-bold text-sm tracking-tight" style={{ color: '#99f7ff', letterSpacing: '0.08em' }}>STABLEGRID.IO</p>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">
            Terms of Use
          </h1>
          <p className="text-sm text-on-surface-variant/40">
            Effective date: March 4, 2026
          </p>
        </header>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Service scope</h2>
          <p className="text-sm leading-7 text-on-surface-variant/60">
            Current release scope is Theory. Features outside this scope may appear in
            product navigation only when explicitly launched.
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Account responsibilities</h2>
          <p className="text-sm leading-7 text-on-surface-variant/60">
            You are responsible for account security and for activity performed through your
            account credentials.
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Acceptable use</h2>
          <p className="text-sm leading-7 text-on-surface-variant/60">
            Do not attempt unauthorized access, abuse APIs, or disrupt platform availability
            for other users.
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Support</h2>
          <p className="text-sm leading-7 text-on-surface-variant/60">
            Questions about these terms can be sent to{' '}
            <a
              href="mailto:support@stablegrid.io"
              className="font-medium text-brand-600 hover:underline dark:text-brand-300"
            >
              support@stablegrid.io
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
