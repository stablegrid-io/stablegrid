'use client';

export function SupportTab() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header className="space-y-3 border-b border-on-surface pb-6">
        <p className="font-ui-label text-[11px] uppercase tracking-widest text-primary">
          stablegrid
        </p>
        <h1 className="font-h1 text-h1 text-on-surface">Support</h1>
        <p className="font-data-mono text-[13px] text-on-surface-variant">
          We handle launch-blocking support requests.
        </p>
      </header>

      <section className="space-y-3 border border-surface-dim bg-surface-container-low p-6">
        <h2 className="font-h2 text-[20px] text-on-surface">Contact channel</h2>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          Email{' '}
          <a
            href="mailto:support@stablegrid.io"
            className="text-primary underline underline-offset-2 hover:text-surface-tint"
          >
            support@stablegrid.io
          </a>{' '}
          with subject format:
          <span className="block font-data-mono text-[12px] text-on-surface-variant mt-2">
            [stablegrid] brief issue summary
          </span>
        </p>
      </section>

      <section className="space-y-3 border border-surface-dim bg-surface-container-low p-6">
        <h2 className="font-h2 text-[20px] text-on-surface">Include in report</h2>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          Include route URL, timestamp, expected behavior, actual behavior, and screenshots.
          For account-specific problems include your login email.
        </p>
      </section>

      <section className="space-y-3 border border-surface-dim bg-surface-container-low p-6">
        <h2 className="font-h2 text-[20px] text-on-surface">Data requests</h2>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          GDPR export and delete actions are available in Settings {'>'} Danger Zone after
          login.
        </p>
      </section>
    </div>
  );
}
