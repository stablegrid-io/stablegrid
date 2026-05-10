/*
 * LEGAL NOTICE: This policy is a starting draft only and has NOT been reviewed by
 * qualified legal counsel. It must be reviewed by a qualified data-protection
 * lawyer before production use. Placeholders (company name, registered address,
 * supervisory authority) must be filled in prior to publication.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { COOKIE_CATEGORY_COPY, COOKIE_SERVICE_REGISTRY } from '@/lib/cookies/cookie-config';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How StableGrid collects, uses, and protects user data.',
  alternates: { canonical: '/privacy' }
};

const policyCategories = [
  COOKIE_CATEGORY_COPY.necessary,
  COOKIE_CATEGORY_COPY.analytics,
  COOKIE_CATEGORY_COPY.marketing,
  COOKIE_CATEGORY_COPY.preferences
];

const legalBases = [
  { purpose: 'Account creation and authentication', basis: 'Contract (Art. 6(1)(b) GDPR)' },
  { purpose: 'Learning progress and session history', basis: 'Contract / Legitimate interest (Art. 6(1)(b) / (f))' },
  { purpose: 'Product analytics', basis: 'Consent (Art. 6(1)(a)) — opt-in via cookie banner' },
  { purpose: 'Marketing emails', basis: 'Consent (Art. 6(1)(a)) — opt-in, withdraw any time' },
  { purpose: 'Billing and subscription management', basis: 'Contract (Art. 6(1)(b)) + Legal obligation (Art. 6(1)(c))' }
];

const retentionPeriods = [
  { category: 'Account data (email, name, auth identifiers)', period: 'Until account deletion' },
  { category: 'Learning progress and kWh balance', period: 'Until account deletion' },
  { category: 'Billing records and invoices', period: '7 years (tax and accounting law)' },
  { category: 'Support correspondence', period: 'Up to 24 months after resolution' },
  { category: 'Analytics events (with consent)', period: 'Up to 14 months from collection' }
];

const subProcessors = [
  { name: 'Supabase', region: 'United States', purpose: 'Authentication, database, file storage' },
  { name: 'Stripe', region: 'United States', purpose: 'Payment processing and billing' },
  { name: 'Cloudflare', region: 'United States', purpose: 'Turnstile CAPTCHA, CDN, DDoS protection' },
  { name: 'Vercel', region: 'United States', purpose: 'Application hosting and edge delivery' }
];

const userRights = [
  { label: 'Access (Art. 15)', description: 'Request a copy of the personal data we hold about you.' },
  { label: 'Rectification (Art. 16)', description: 'Ask us to correct inaccurate or incomplete data.' },
  { label: 'Erasure (Art. 17)', description: 'Request deletion of your data ("right to be forgotten").' },
  { label: 'Restriction (Art. 18)', description: 'Ask us to pause processing in specific situations.' },
  { label: 'Portability (Art. 20)', description: 'Receive your data in a machine-readable export.' },
  { label: 'Objection (Art. 21)', description: 'Object to processing based on legitimate interests.' },
  { label: 'Withdraw consent (Art. 7(3))', description: 'Revoke any consent-based processing at any time.' },
  { label: 'Complaint (Art. 77)', description: 'Lodge a complaint with your local supervisory authority.' }
];

const SECTION_CARD = 'border border-surface-dim bg-surface-container-low p-6';
const TABLE_WRAP = 'border border-surface-dim';
const TABLE_HEAD =
  'bg-surface-container font-data-mono uppercase text-[10px] tracking-[0.16em] text-on-surface-variant';
const TABLE_BODY = 'divide-y divide-surface-dim text-on-surface';
const SECTION_TITLE = 'font-h2 text-[22px] sm:text-[24px] font-bold text-on-surface tracking-tight';
const PROSE = 'font-body text-[14px] leading-7 text-on-surface-variant';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-surface px-4 py-12">
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          Home
        </Link>

        <header className="space-y-3 border-b border-on-surface pb-6">
          <p className="font-data-mono uppercase text-[11px] tracking-[0.22em] text-on-surface-variant">
            stablegrid · legal
          </p>
          <h1 className="font-h1 text-[42px] sm:text-[48px] font-bold tracking-tight text-on-surface">
            Privacy Policy
          </h1>
          <p className="font-data-mono text-[12px] uppercase tracking-wider text-on-surface-variant">
            Effective date · March 9, 2026
          </p>
        </header>

        <section className={`${SECTION_CARD} space-y-3`}>
          <h2 className={SECTION_TITLE}>Data controller</h2>
          <p className={PROSE}>
            stablegrid is operated by <span className="font-medium text-on-surface">[Company Name]</span>,
            registered at <span className="font-medium text-on-surface">[Registered Address]</span>.
            For any privacy or data-protection enquiry (including exercise of the rights listed below),
            contact{' '}
            <a href="mailto:support@stablegrid.io" className="font-medium text-primary hover:underline">
              support@stablegrid.io
            </a>
            .
          </p>
          <p className={PROSE}>
            We do not currently have a dedicated Data Protection Officer. Data-protection requests
            are handled by the team at the address above.
          </p>
        </section>

        <section className={`${SECTION_CARD} space-y-3`}>
          <h2 className={SECTION_TITLE}>What we collect</h2>
          <p className={PROSE}>
            We collect account information (name, email), learning progress, session usage,
            billing records for paid subscriptions, and optional analytics events — the latter only
            after consent for the Analytics category.
          </p>
        </section>

        <section className={`${SECTION_CARD} space-y-3`}>
          <h2 className={SECTION_TITLE}>Why we collect it</h2>
          <p className={PROSE}>
            Data is used to authenticate your account, persist your learning progress and kWh balance,
            deliver paid features, process payments, keep the service reliable and secure, and —
            with your consent — understand aggregate product usage.
          </p>
        </section>

        <section className={`${SECTION_CARD} space-y-4`}>
          <h2 className={SECTION_TITLE}>Legal basis for processing</h2>
          <p className={PROSE}>Under Article 6 GDPR we rely on the following legal bases:</p>
          <div className={`overflow-x-auto ${TABLE_WRAP}`}>
            <table className="min-w-full divide-y divide-surface-dim text-left text-sm">
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Processing purpose</th>
                  <th className="px-3 py-2.5 font-semibold">Legal basis</th>
                </tr>
              </thead>
              <tbody className={TABLE_BODY}>
                {legalBases.map((row) => (
                  <tr key={row.purpose}>
                    <td className="px-3 py-2.5 font-body text-[13px]">{row.purpose}</td>
                    <td className="px-3 py-2.5 font-body text-[13px] text-on-surface-variant">{row.basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`${SECTION_CARD} space-y-4`}>
          <h2 className={SECTION_TITLE}>How long we keep your data</h2>
          <div className={`overflow-x-auto ${TABLE_WRAP}`}>
            <table className="min-w-full divide-y divide-surface-dim text-left text-sm">
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Data category</th>
                  <th className="px-3 py-2.5 font-semibold">Retention period</th>
                </tr>
              </thead>
              <tbody className={TABLE_BODY}>
                {retentionPeriods.map((row) => (
                  <tr key={row.category}>
                    <td className="px-3 py-2.5 font-body text-[13px]">{row.category}</td>
                    <td className="px-3 py-2.5 font-body text-[13px] text-on-surface-variant">{row.period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`${SECTION_CARD} space-y-4`}>
          <h2 className={SECTION_TITLE}>Sub-processors</h2>
          <p className={PROSE}>
            We rely on the following sub-processors to deliver the service. Each is bound by a
            data-processing agreement consistent with GDPR Article 28.
          </p>
          <div className={`overflow-x-auto ${TABLE_WRAP}`}>
            <table className="min-w-full divide-y divide-surface-dim text-left text-sm">
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Provider</th>
                  <th className="px-3 py-2.5 font-semibold">Region</th>
                  <th className="px-3 py-2.5 font-semibold">Purpose</th>
                </tr>
              </thead>
              <tbody className={TABLE_BODY}>
                {subProcessors.map((row) => (
                  <tr key={row.name}>
                    <td className="px-3 py-2.5 font-body text-[13px]">{row.name}</td>
                    <td className="px-3 py-2.5 font-body text-[13px] text-on-surface-variant">{row.region}</td>
                    <td className="px-3 py-2.5 font-body text-[13px] text-on-surface-variant">{row.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`${SECTION_CARD} space-y-3`}>
          <h2 className={SECTION_TITLE}>International data transfers</h2>
          <p className={PROSE}>
            Several of our sub-processors are based in the United States. Where personal data is
            transferred outside the European Economic Area, transfers are protected by the European
            Commission&apos;s Standard Contractual Clauses (SCCs) and, where applicable, supplementary
            technical measures such as encryption in transit and at rest.
          </p>
        </section>

        <section className={`${SECTION_CARD} space-y-4`}>
          <h2 className={SECTION_TITLE}>Your rights</h2>
          <p className={PROSE}>
            If you are in the European Economic Area or the United Kingdom you have the following
            rights in relation to your personal data:
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {userRights.map((right) => (
              <li
                key={right.label}
                className="border border-surface-dim bg-surface p-4"
              >
                <p className="font-body text-[13px] font-semibold text-on-surface">{right.label}</p>
                <p className="mt-1 font-body text-[12px] leading-6 text-on-surface-variant">
                  {right.description}
                </p>
              </li>
            ))}
          </ul>
          <p className={PROSE}>
            To exercise any of these rights, email{' '}
            <a href="mailto:support@stablegrid.io" className="font-medium text-primary hover:underline">
              support@stablegrid.io
            </a>
            . You can also use the self-service GDPR export and account deletion tools in
            Settings &gt; Danger Zone. You always have the right to lodge a complaint with your
            local supervisory authority.
          </p>
        </section>

        <section className={`${SECTION_CARD} space-y-3`}>
          <h2 className={SECTION_TITLE}>Your controls</h2>
          <p className={PROSE}>
            You can request a GDPR export or permanently delete your account in Settings &gt; Danger Zone.
            These actions require authentication.
          </p>
          <p className={PROSE}>
            You can change cookie choices at any time from the persistent{' '}
            <span className="font-medium text-on-surface">Cookie settings</span> control shown across the site.
          </p>
        </section>

        <section
          id="cookie-policy"
          className={`${SECTION_CARD} space-y-4 scroll-mt-20`}
        >
          <h2 className={SECTION_TITLE}>Cookie Policy</h2>
          <p className={PROSE}>
            We use necessary cookies to operate the website. Analytics, marketing, and preference
            cookies stay off by default until you opt in.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {policyCategories.map((category) => (
              <article key={category.label} className="border border-surface-dim bg-surface p-4">
                <h3 className="font-body text-[13px] font-semibold text-on-surface">{category.label}</h3>
                <p className="mt-1 font-body text-[12px] leading-6 text-on-surface-variant">
                  {category.description}
                </p>
              </article>
            ))}
          </div>
          <div className="space-y-2">
            <h3 className="font-data-mono uppercase text-[10px] tracking-[0.18em] text-on-surface-variant">
              Cookie and service inventory
            </h3>
            <div className={`overflow-x-auto ${TABLE_WRAP}`}>
              <table className="min-w-full divide-y divide-surface-dim text-left text-sm">
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Name</th>
                    <th className="px-3 py-2.5 font-semibold">Provider</th>
                    <th className="px-3 py-2.5 font-semibold">Category</th>
                    <th className="px-3 py-2.5 font-semibold">Purpose</th>
                    <th className="px-3 py-2.5 font-semibold">Expiry</th>
                  </tr>
                </thead>
                <tbody className={TABLE_BODY}>
                  {COOKIE_SERVICE_REGISTRY.map((service) => (
                    <tr key={service.id}>
                      <td className="px-3 py-2.5 font-body text-[13px] font-medium">{service.name}</td>
                      <td className="px-3 py-2.5 font-body text-[13px] text-on-surface-variant">{service.provider}</td>
                      <td className="px-3 py-2.5 font-body text-[13px] text-on-surface-variant">
                        {COOKIE_CATEGORY_COPY[service.category].label}
                      </td>
                      <td className="px-3 py-2.5 font-body text-[13px] text-on-surface-variant">{service.purpose}</td>
                      <td className="px-3 py-2.5 font-data-mono text-[12px] text-on-surface-variant">{service.expiry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className={`${SECTION_CARD} space-y-3`}>
          <h2 className={SECTION_TITLE}>Contact</h2>
          <p className={PROSE}>
            For privacy questions, contact{' '}
            <a href="mailto:support@stablegrid.io" className="font-medium text-primary hover:underline">
              support@stablegrid.io
            </a>
            .
          </p>
        </section>

        <footer className="pt-8 pb-4 border-t border-surface-dim text-center font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
          © 2026 stablegrid
        </footer>
      </div>
    </main>
  );
}
