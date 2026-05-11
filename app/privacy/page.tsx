/*
 * LEGAL NOTICE: This policy is a starting draft only and has NOT been reviewed by
 * qualified legal counsel. It must be reviewed by a qualified data-protection
 * lawyer before production use. Placeholders (company name, registered address,
 * supervisory authority) must be filled in prior to publication.
 */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
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

export default function PrivacyPage() {
  return (
    <main className="bg-surface min-h-screen text-on-surface">
      <div className="mx-auto w-full max-w-[680px] px-6 sm:px-10 py-12 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-data-mono uppercase tracking-[0.18em] text-[11px] text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          Home
        </Link>

        {/* Editorial masthead — matches Terms / Support so the three
            publication-style pages read as one section of the site. */}
        <header className="mt-12 pb-10 border-b border-on-surface">
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

        {/* Body — flowing-prose article, no card chrome. Hairline rule
            separates sections via space-y-12 + section-level borders. */}
        <article className="mt-12 space-y-12">
          <section>
            <SectionHeader>Data controller</SectionHeader>
            <Prose>
              stablegrid is operated by{' '}
              <span className="font-medium text-on-surface">[Company Name]</span>, registered at{' '}
              <span className="font-medium text-on-surface">[Registered Address]</span>. For any
              privacy or data-protection enquiry (including exercise of the rights listed below),
              contact{' '}
              <a href="mailto:support@stablegrid.io" className="text-primary border-b border-primary/40 hover:border-primary transition-colors">
                support@stablegrid.io
              </a>
              .
            </Prose>
            <Prose>
              We do not currently have a dedicated Data Protection Officer. Data-protection
              requests are handled by the team at the address above.
            </Prose>
          </section>

          <section>
            <SectionHeader>What we collect</SectionHeader>
            <Prose>
              We collect account information (name, email), learning progress, session usage,
              billing records for paid subscriptions, and optional analytics events — the latter
              only after consent for the Analytics category.
            </Prose>
          </section>

          <section>
            <SectionHeader>Why we collect it</SectionHeader>
            <Prose>
              Data is used to authenticate your account, persist your learning progress and kWh
              balance, deliver paid features, process payments, keep the service reliable and
              secure, and — with your consent — understand aggregate product usage.
            </Prose>
          </section>

          <section>
            <SectionHeader>Legal basis for processing</SectionHeader>
            <Prose>Under Article 6 GDPR we rely on the following legal bases:</Prose>
            <EditorialTable
              headers={['Processing purpose', 'Legal basis']}
              rows={legalBases.map((r) => [r.purpose, r.basis])}
            />
          </section>

          <section>
            <SectionHeader>How long we keep your data</SectionHeader>
            <EditorialTable
              headers={['Data category', 'Retention period']}
              rows={retentionPeriods.map((r) => [r.category, r.period])}
            />
          </section>

          <section>
            <SectionHeader>Sub-processors</SectionHeader>
            <Prose>
              We rely on the following sub-processors to deliver the service. Each is bound by a
              data-processing agreement consistent with GDPR Article 28.
            </Prose>
            <EditorialTable
              headers={['Provider', 'Region', 'Purpose']}
              rows={subProcessors.map((r) => [r.name, r.region, r.purpose])}
            />
          </section>

          <section>
            <SectionHeader>International data transfers</SectionHeader>
            <Prose>
              Several of our sub-processors are based in the United States. Where personal data is
              transferred outside the European Economic Area, transfers are protected by the
              European Commission&rsquo;s Standard Contractual Clauses (SCCs) and, where
              applicable, supplementary technical measures such as encryption in transit and at
              rest.
            </Prose>
          </section>

          <section>
            <SectionHeader>Your rights</SectionHeader>
            <Prose>
              If you are in the European Economic Area or the United Kingdom you have the
              following rights in relation to your personal data:
            </Prose>
            <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {userRights.map((right) => (
                <div key={right.label}>
                  <dt className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant mb-1.5">
                    {right.label}
                  </dt>
                  <dd className="font-body text-[14px] leading-[1.7] text-on-surface">
                    {right.description}
                  </dd>
                </div>
              ))}
            </dl>
            <Prose>
              To exercise any of these rights, email{' '}
              <a href="mailto:support@stablegrid.io" className="text-primary border-b border-primary/40 hover:border-primary transition-colors">
                support@stablegrid.io
              </a>
              . You can also use the self-service GDPR export and account deletion tools in
              Settings &gt; Danger Zone. You always have the right to lodge a complaint with your
              local supervisory authority.
            </Prose>
          </section>

          <section>
            <SectionHeader>Your controls</SectionHeader>
            <Prose>
              You can request a GDPR export or permanently delete your account in Settings &gt;
              Danger Zone. These actions require authentication.
            </Prose>
            <Prose>
              You can change cookie choices at any time from the persistent{' '}
              <span className="font-medium text-on-surface">Cookie settings</span> control shown
              across the site.
            </Prose>
          </section>

          <section id="cookie-policy" className="scroll-mt-20">
            <SectionHeader>Cookie policy</SectionHeader>
            <Prose>
              We use necessary cookies to operate the website. Analytics, marketing, and
              preference cookies stay off by default until you opt in.
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
              <a href="mailto:support@stablegrid.io" className="text-primary border-b border-primary/40 hover:border-primary transition-colors">
                support@stablegrid.io
              </a>
              .
            </Prose>
          </section>
        </article>

        <footer className="mt-16 pt-6 border-t border-surface-dim flex flex-wrap justify-between gap-4 font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
          <span>Privacy · stablegrid.io</span>
          <Link href="/" className="hover:text-on-surface transition-colors">
            Back to home
          </Link>
        </footer>
      </div>
    </main>
  );
}

const SectionHeader = ({ children }: { children: ReactNode }) => (
  <h2 className="font-serif text-[22px] sm:text-[24px] leading-tight text-on-surface mb-4">
    {children}
  </h2>
);

const Prose = ({ children }: { children: ReactNode }) => (
  <p className="font-body text-[15px] leading-[1.75] text-on-surface mt-4 first:mt-0">
    {children}
  </p>
);

// Stacked-card fallback on phones (header → value pairs per row) keeps
// the table content readable below md, while desktop renders a classic
// table. Mirrors the responsive treatment used in theory tables.
const EditorialTable = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <>
    <div className="md:hidden mt-5 flex flex-col gap-3">
      {rows.map((row, rowIndex) => (
        <div
          key={`m-${rowIndex}`}
          className="border border-surface-dim"
        >
          <dl className="flex flex-col">
            {row.map((cell, cellIndex) => (
              <div
                key={`m-${rowIndex}-${cellIndex}`}
                className="grid grid-cols-[40%_60%] gap-3 border-b last:border-b-0 border-surface-dim px-3 py-2.5"
              >
                <dt className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
                  {headers[cellIndex]}
                </dt>
                <dd className="font-body text-[13px] leading-snug text-on-surface">
                  {cell}
                </dd>
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
