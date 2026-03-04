import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy · StableGrid.io',
  description: 'How StableGrid collects, uses, and protects Theory Beta user data.'
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-light-bg px-4 py-10 text-text-light-primary dark:bg-dark-bg dark:text-text-dark-primary">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
            StableGrid Theory Beta
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
            Effective date: March 4, 2026
          </p>
        </header>

        <section className="space-y-3 rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
          <h2 className="text-xl font-semibold">What we collect</h2>
          <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
            We collect account information (name, email), reading progress, session usage,
            and product analytics events required to operate Theory Beta.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
          <h2 className="text-xl font-semibold">Why we collect it</h2>
          <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
            Data is used to authenticate your account, persist chapter progress, improve
            reliability, and understand core funnel behavior for launch quality decisions.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
          <h2 className="text-xl font-semibold">Your controls</h2>
          <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
            You can request a GDPR export or permanently delete your account in
            Settings {'>'} Danger Zone. These actions require authentication.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
            For privacy questions, contact{' '}
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
