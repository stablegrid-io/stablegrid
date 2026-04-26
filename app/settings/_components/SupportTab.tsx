'use client';

export function SupportTab() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-mono font-bold tracking-[0.18em] text-brand-500">
          stablegrid
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Support</h1>
        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          We handle launch-blocking support requests.
        </p>
      </header>

      <section className="space-y-3 rounded-[22px] border border-light-border bg-surface-container-low p-5 dark:border-dark-border ">
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
          <span className="block text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            [stablegrid] brief issue summary
          </span>
        </p>
      </section>

      <section className="space-y-3 rounded-[22px] border border-light-border bg-surface-container-low p-5 dark:border-dark-border ">
        <h2 className="text-xl font-semibold">Include in report</h2>
        <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
          Include route URL, timestamp, expected behavior, actual behavior, and screenshots.
          For account-specific problems include your login email.
        </p>
      </section>

      <section className="space-y-3 rounded-[22px] border border-light-border bg-surface-container-low p-5 dark:border-dark-border ">
        <h2 className="text-xl font-semibold">Data requests</h2>
        <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
          GDPR export and delete actions are available in Settings {'>'} Danger Zone after
          login.
        </p>
      </section>
    </div>
  );
}
