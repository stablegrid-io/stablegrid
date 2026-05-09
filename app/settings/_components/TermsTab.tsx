'use client';

export function TermsTab() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header className="space-y-3 border-b border-on-surface pb-6">
        <p className="font-ui-label text-[11px] uppercase tracking-widest text-primary">
          stablegrid
        </p>
        <h1 className="font-h1 text-h1 text-on-surface">
          Terms of Use
        </h1>
        <p className="font-data-mono text-[13px] text-on-surface-variant">
          Effective date: March 4, 2026
        </p>
      </header>

      <section className="space-y-3 border border-surface-dim bg-surface-container-low p-6">
        <h2 className="font-h2 text-[20px] text-on-surface">Service scope</h2>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          Current release scope is Theory. Features outside this scope may appear in
          product navigation only when explicitly launched.
        </p>
      </section>

      <section className="space-y-3 border border-surface-dim bg-surface-container-low p-6">
        <h2 className="font-h2 text-[20px] text-on-surface">Account responsibilities</h2>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          You are responsible for account security and for activity performed through your
          account credentials.
        </p>
      </section>

      <section className="space-y-3 border border-surface-dim bg-surface-container-low p-6">
        <h2 className="font-h2 text-[20px] text-on-surface">Acceptable use</h2>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          Do not attempt unauthorized access, abuse APIs, or disrupt platform availability
          for other users.
        </p>
      </section>

      <section className="space-y-3 border border-surface-dim bg-surface-container-low p-6">
        <h2 className="font-h2 text-[20px] text-on-surface">Support</h2>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          Questions about these terms can be sent to{' '}
          <a
            href="mailto:support@stablegrid.io"
            className="text-primary underline underline-offset-2 hover:text-surface-tint"
          >
            support@stablegrid.io
          </a>
          .
        </p>
      </section>
    </div>
  );
}
