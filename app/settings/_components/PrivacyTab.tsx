'use client';

import { COOKIE_CATEGORY_COPY, COOKIE_SERVICE_REGISTRY } from '@/lib/cookies/cookie-config';
import { COOKIE_PREFERENCES_OPEN_EVENT } from '@/lib/cookies/cookie-consent';

const openCookiePreferences = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(COOKIE_PREFERENCES_OPEN_EVENT));
};

const policyCategories = [
  COOKIE_CATEGORY_COPY.necessary,
  COOKIE_CATEGORY_COPY.analytics,
  COOKIE_CATEGORY_COPY.marketing,
  COOKIE_CATEGORY_COPY.preferences
];

export function PrivacyTab() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header className="space-y-3 border-b border-on-surface pb-6">
        <p className="font-ui-label text-[11px] uppercase tracking-widest text-primary">
          stablegrid
        </p>
        <h1 className="font-h1 text-h1 text-on-surface">
          Privacy Policy
        </h1>
        <p className="font-data-mono text-[13px] text-on-surface-variant">
          Effective date: March 9, 2026
        </p>
      </header>

      <section className="space-y-3 border border-surface-dim bg-surface-container-low p-6">
        <h2 className="font-h2 text-[20px] text-on-surface">What we collect</h2>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          We collect account information (name, email), reading progress, session usage,
          and optional analytics events only after consent for the Analytics category.
        </p>
      </section>

      <section className="space-y-3 border border-surface-dim bg-surface-container-low p-6">
        <h2 className="font-h2 text-[20px] text-on-surface">Why we collect it</h2>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          Data is used to authenticate your account, persist chapter progress, improve
          reliability, and understand core funnel behavior for launch quality decisions.
        </p>
      </section>

      <section className="space-y-3 border border-surface-dim bg-surface-container-low p-6">
        <h2 className="font-h2 text-[20px] text-on-surface">Your controls</h2>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          You can request a GDPR export or permanently delete your account in
          Settings {'>'} Danger Zone. These actions require authentication.
        </p>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          When you are signed in, cookie choices are also stored with your account so
          your consent settings can follow you across sessions and devices.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={openCookiePreferences}
            className="inline-flex items-center gap-2 border border-on-surface bg-surface px-4 py-2 font-ui-label text-[12px] uppercase tracking-wider text-on-surface transition-colors hover:bg-surface-container"
          >
            Manage cookie preferences
          </button>
        </div>
      </section>

      <section
        id="cookie-policy"
        className="space-y-4 border border-surface-dim bg-surface-container-low p-6"
      >
        <h2 className="font-h2 text-[20px] text-on-surface">Cookie Policy</h2>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          We use necessary cookies to operate the website. Analytics, marketing, and
          preference cookies stay off by default until you opt in.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {policyCategories.map((category) => (
            <article
              key={category.label}
              className="border border-surface-dim bg-surface p-4"
            >
              <h3 className="font-ui-label text-[12px] uppercase tracking-wider text-on-surface mb-1">{category.label}</h3>
              <p className="font-body-lg text-[14px] leading-relaxed text-on-surface-variant">
                {category.description}
              </p>
            </article>
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="font-ui-label text-[12px] font-bold uppercase tracking-wider text-on-surface-variant">
            Cookie and service inventory
          </h3>
          <div className="overflow-x-auto border border-surface-dim">
            <table className="min-w-full text-left">
              <thead className="bg-surface-container">
                <tr>
                  <th className="px-3 py-2 font-ui-label text-[11px] uppercase tracking-wider text-on-surface-variant border-b border-surface-dim">Name</th>
                  <th className="px-3 py-2 font-ui-label text-[11px] uppercase tracking-wider text-on-surface-variant border-b border-surface-dim">Provider</th>
                  <th className="px-3 py-2 font-ui-label text-[11px] uppercase tracking-wider text-on-surface-variant border-b border-surface-dim">Category</th>
                  <th className="px-3 py-2 font-ui-label text-[11px] uppercase tracking-wider text-on-surface-variant border-b border-surface-dim">Purpose</th>
                  <th className="px-3 py-2 font-ui-label text-[11px] uppercase tracking-wider text-on-surface-variant border-b border-surface-dim">Expiry</th>
                  <th className="px-3 py-2 font-ui-label text-[11px] uppercase tracking-wider text-on-surface-variant border-b border-surface-dim">Type</th>
                  <th className="px-3 py-2 font-ui-label text-[11px] uppercase tracking-wider text-on-surface-variant border-b border-surface-dim">Legal basis</th>
                </tr>
              </thead>
              <tbody>
                {COOKIE_SERVICE_REGISTRY.map((service) => (
                  <tr key={service.id} className="align-top border-b border-surface-dim last:border-b-0">
                    <td className="px-3 py-2 font-data-mono text-[12px] text-on-surface">{service.name}</td>
                    <td className="px-3 py-2 font-body-lg text-[13px] text-on-surface-variant">{service.provider}</td>
                    <td className="px-3 py-2 font-body-lg text-[13px] text-on-surface-variant">{COOKIE_CATEGORY_COPY[service.category].label}</td>
                    <td className="px-3 py-2 font-body-lg text-[13px] text-on-surface-variant">{service.purpose}</td>
                    <td className="px-3 py-2 font-data-mono text-[12px] text-on-surface-variant">{service.expiry}</td>
                    <td className="px-3 py-2 font-data-mono text-[12px] text-on-surface-variant">{service.type}</td>
                    <td className="px-3 py-2 font-body-lg text-[13px] text-on-surface-variant">{service.legalBasis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3 border border-surface-dim bg-surface-container-low p-6">
        <h2 className="font-h2 text-[20px] text-on-surface">Contact</h2>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          For privacy questions, contact{' '}
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
