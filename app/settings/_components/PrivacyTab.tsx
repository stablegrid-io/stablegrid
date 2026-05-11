'use client';

import type { ReactNode } from 'react';
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
  COOKIE_CATEGORY_COPY.preferences,
];

export function PrivacyTab() {
  return (
    <div className="mx-auto w-full max-w-[680px]">
      <header className="pb-10 border-b border-on-surface">
        <p className="font-data-mono uppercase tracking-[0.22em] text-[10px] text-primary mb-5">
          Stablegrid · Legal
        </p>
        <h1 className="font-serif text-[44px] sm:text-[56px] leading-[1.05] tracking-tight text-on-surface">
          Privacy Policy
        </h1>
        <p className="mt-5 font-data-mono uppercase tracking-wider text-[11px] text-on-surface-variant">
          Effective March 9, 2026
        </p>
      </header>

      <article className="mt-12 space-y-12">
        <section>
          <SectionHeader>What we collect</SectionHeader>
          <Prose>
            We collect account information (name, email), learning progress, session usage, and
            optional analytics events — the latter only after consent for the Analytics category.
          </Prose>
        </section>

        <section>
          <SectionHeader>Why we collect it</SectionHeader>
          <Prose>
            Data is used to authenticate your account, persist chapter progress, improve
            reliability, and understand core funnel behaviour for launch-quality decisions.
          </Prose>
        </section>

        <section>
          <SectionHeader>Your controls</SectionHeader>
          <Prose>
            You can request a GDPR export or permanently delete your account in{' '}
            <span className="font-medium text-on-surface">Settings &gt; Danger Zone</span>. These
            actions require authentication.
          </Prose>
          <Prose>
            When you are signed in, cookie choices are also stored with your account so your
            consent settings can follow you across sessions and devices.
          </Prose>
          <div className="mt-6">
            <button
              type="button"
              onClick={openCookiePreferences}
              className="inline-flex items-center gap-2 border border-on-surface bg-surface px-4 py-2.5 font-data-mono uppercase text-[11px] tracking-wider text-on-surface transition-colors hover:bg-surface-container-low"
            >
              Manage cookie preferences
            </button>
          </div>
        </section>

        <section id="cookie-policy" className="scroll-mt-20">
          <SectionHeader>Cookie policy</SectionHeader>
          <Prose>
            We use necessary cookies to operate the website. Analytics, marketing, and preference
            cookies stay off by default until you opt in.
          </Prose>
          <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            {policyCategories.map((category) => (
              <div key={category.label}>
                <dt className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant mb-1.5">
                  {category.label}
                </dt>
                <dd className="font-body text-[14px] leading-[1.7] text-on-surface">
                  {category.description}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 font-data-mono uppercase text-[10px] tracking-[0.18em] text-on-surface-variant">
            Cookie and service inventory
          </p>
          <EditorialTable
            headers={['Name', 'Provider', 'Category', 'Purpose', 'Expiry']}
            rows={COOKIE_SERVICE_REGISTRY.map((service) => [
              service.name,
              service.provider,
              COOKIE_CATEGORY_COPY[service.category].label,
              service.purpose,
              service.expiry,
            ])}
          />
        </section>

        <section>
          <SectionHeader>Contact</SectionHeader>
          <Prose>
            For privacy questions, contact{' '}
            <a
              href="mailto:support@stablegrid.io"
              className="text-primary border-b border-primary/40 hover:border-primary transition-colors"
            >
              support@stablegrid.io
            </a>
            .
          </Prose>
        </section>
      </article>
    </div>
  );
}

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-serif text-[22px] sm:text-[24px] leading-tight text-on-surface mb-4">
      {children}
    </h2>
  );
}

function Prose({ children }: { children: ReactNode }) {
  return (
    <p className="font-body text-[15px] leading-[1.75] text-on-surface mt-4 first:mt-0">
      {children}
    </p>
  );
}

// Stacked-card on phones (header → value pairs); classic table on md:+.
// Same responsive pattern as theory tables and the public /privacy page.
function EditorialTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <>
      <div className="md:hidden mt-5 flex flex-col gap-3">
        {rows.map((row, rowIndex) => (
          <div key={`m-${rowIndex}`} className="border border-surface-dim">
            <dl className="flex flex-col">
              {row.map((cell, cellIndex) => (
                <div
                  key={`m-${rowIndex}-${cellIndex}`}
                  className="grid grid-cols-[40%_60%] gap-3 border-b last:border-b-0 border-surface-dim px-3 py-2.5"
                >
                  <dt className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
                    {headers[cellIndex]}
                  </dt>
                  <dd className="font-body text-[13px] leading-snug text-on-surface">{cell}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <div className="hidden md:block mt-5 border border-surface-dim overflow-x-auto">
        <table className="min-w-full divide-y divide-surface-dim text-left">
          <thead>
            <tr className="font-data-mono uppercase text-[10px] tracking-[0.16em] text-on-surface-variant">
              {headers.map((h) => (
                <th key={h} className="px-3 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-dim">
            {rows.map((row, rowIndex) => (
              <tr key={`d-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={`d-${rowIndex}-${cellIndex}`}
                    className={
                      cellIndex === 0
                        ? 'px-3 py-2.5 font-body text-[13px] text-on-surface'
                        : 'px-3 py-2.5 font-body text-[13px] text-on-surface-variant'
                    }
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
