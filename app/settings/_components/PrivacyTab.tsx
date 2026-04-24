'use client';

import { COOKIE_CATEGORY_COPY, COOKIE_SERVICE_REGISTRY } from '@/lib/cookies/cookie-config';

const policyCategories = [
  COOKIE_CATEGORY_COPY.necessary,
  COOKIE_CATEGORY_COPY.analytics,
  COOKIE_CATEGORY_COPY.marketing,
  COOKIE_CATEGORY_COPY.preferences
];

export function PrivacyTab() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-brand-500">
          stableGrid
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          Effective date: March 9, 2026
        </p>
      </header>

      <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-surface-container-low p-5">
        <h2 className="text-xl font-semibold">What we collect</h2>
        <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
          We collect account information (name, email), reading progress, session usage,
          and optional analytics events only after consent for the Analytics category.
        </p>
      </section>

      <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-surface-container-low p-5">
        <h2 className="text-xl font-semibold">Why we collect it</h2>
        <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
          Data is used to authenticate your account, persist chapter progress, improve
          reliability, and understand core funnel behavior for launch quality decisions.
        </p>
      </section>

      <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-surface-container-low p-5">
        <h2 className="text-xl font-semibold">Your controls</h2>
        <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
          You can request a GDPR export or permanently delete your account in
          Settings {'>'} Danger Zone. These actions require authentication.
        </p>
        <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
          You can change cookie choices at any time from the persistent
          {' '}
          <span className="font-medium">Cookie settings</span>
          {' '}
          control shown across the site.
        </p>
        <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
          When you are signed in, cookie choices are also stored with your account so
          your consent settings can follow you across sessions and devices.
        </p>
      </section>

      <section
        id="cookie-policy"
        className="space-y-4 rounded-[22px] border border-white/[0.06] bg-surface-container-low p-5"
      >
        <h2 className="text-xl font-semibold">Cookie Policy</h2>
        <p className="text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
          We use necessary cookies to operate the website. Analytics, marketing, and
          preference cookies stay off by default until you opt in.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {policyCategories.map((category) => (
            <article
              key={category.label}
              className="rounded-[14px] border border-white/[0.06] bg-surface p-3"
            >
              <h3 className="text-sm font-semibold">{category.label}</h3>
              <p className="mt-1 text-xs leading-6 text-text-light-secondary dark:text-text-dark-secondary">
                {category.description}
              </p>
            </article>
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wide text-text-light-tertiary dark:text-text-dark-tertiary">
            Cookie and service inventory
          </h3>
          <div className="overflow-x-auto rounded-[14px] border border-white/[0.06]">
            <table className="min-w-full divide-y divide-light-border text-left text-sm dark:divide-dark-border">
              <thead className="bg-surface text-xs font-mono font-bold uppercase tracking-wide text-text-light-tertiary dark:text-text-dark-tertiary">
                <tr>
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Provider</th>
                  <th className="px-3 py-2 font-semibold">Category</th>
                  <th className="px-3 py-2 font-semibold">Purpose</th>
                  <th className="px-3 py-2 font-semibold">Expiry</th>
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 font-semibold">Legal basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {COOKIE_SERVICE_REGISTRY.map((service) => (
                  <tr key={service.id} className="align-top">
                    <td className="px-3 py-2 font-medium">{service.name}</td>
                    <td className="px-3 py-2">{service.provider}</td>
                    <td className="px-3 py-2">{COOKIE_CATEGORY_COPY[service.category].label}</td>
                    <td className="px-3 py-2">{service.purpose}</td>
                    <td className="px-3 py-2">{service.expiry}</td>
                    <td className="px-3 py-2">{service.type}</td>
                    <td className="px-3 py-2">{service.legalBasis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-surface-container-low p-5">
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
  );
}
