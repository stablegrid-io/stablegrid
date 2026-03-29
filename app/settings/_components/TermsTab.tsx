'use client';

export function TermsTab() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
          StableGrid
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Terms of Use
        </h1>
        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          Effective date: March 4, 2026
        </p>
      </header>

      <section className="space-y-3 rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
        <h2 className="text-xl font-semibold">Service scope</h2>
        <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
          Current release scope is Theory. Features outside this scope may appear in
          product navigation only when explicitly launched.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
        <h2 className="text-xl font-semibold">Account responsibilities</h2>
        <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
          You are responsible for account security and for activity performed through your
          account credentials.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
        <h2 className="text-xl font-semibold">Acceptable use</h2>
        <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
          Do not attempt unauthorized access, abuse APIs, or disrupt platform availability
          for other users.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
        <h2 className="text-xl font-semibold">Support</h2>
        <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
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
  );
}
