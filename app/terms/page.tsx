/*
 * LEGAL NOTICE: These terms are a starting draft only and have NOT been reviewed
 * by qualified legal counsel. They must be reviewed by a qualified commercial /
 * consumer-protection lawyer before production use. Governing-law, jurisdiction,
 * and entity placeholders must be finalised prior to publication.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of use for StableGrid.',
  alternates: { canonical: '/terms' }
};

const SUPPORT_EMAIL = 'support@stablegrid.io';

const supportLink = (
  <a
    href={`mailto:${SUPPORT_EMAIL}`}
    className="text-primary border-b border-primary/40 hover:border-primary transition-colors"
  >
    {SUPPORT_EMAIL}
  </a>
);

export default function TermsPage() {
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

        {/* Masthead — editorial article header. Eyebrow / serif h1 / metadata
            line, then a full-width hairline rule. Mirrors the dashboard
            masthead pattern. */}
        <header className="mt-12 pb-10 border-b border-on-surface">
          <p className="font-data-mono uppercase tracking-[0.22em] text-[10px] text-primary mb-5">
            Stablegrid · Legal
          </p>
          <h1 className="font-serif text-[44px] sm:text-[56px] leading-[1.05] tracking-tight text-on-surface">
            Terms of Use
          </h1>
          <p className="mt-5 font-data-mono uppercase tracking-wider text-[11px] text-on-surface-variant">
            Effective March 4, 2026
          </p>
        </header>

        {/* Body — long-form prose, single column. Each section opens with a
            hairline rule + serif h2; body copy is set in serif body for the
            editorial reading rhythm. No card chrome — legal text reads
            better as flowing pages, not boxes. */}
        <article className="mt-12 space-y-12">
          <section>
            <SectionHeader>Service scope</SectionHeader>
            <Prose>
              stablegrid is a learning platform for data engineering. The current
              scope includes structured theory, practice sets, Grid Ops (our
              applied training arena), missions, the in-platform kWh economy,
              and paid subscription tiers with billing through Stripe. Features
              evolve over time; material additions will be reflected in these
              terms.
            </Prose>
          </section>

          <section>
            <SectionHeader>Account responsibilities</SectionHeader>
            <Prose>
              You are responsible for account security and for activity performed
              through your account credentials. You must provide accurate
              information during signup and keep your contact email current.
            </Prose>
          </section>

          <section>
            <SectionHeader>Acceptable use</SectionHeader>
            <Prose>
              Do not attempt unauthorized access, abuse APIs, scrape content at
              scale, or disrupt platform availability for other users. Automated
              account creation, sharing of paid credentials, and attempts to
              circumvent usage limits are prohibited.
            </Prose>
          </section>

          <section>
            <SectionHeader>Intellectual property</SectionHeader>
            <Prose>
              All platform content — including theory material, practice sets,
              datasets, source code, branding, and the stablegrid name and logo
              — is owned by stablegrid or its licensors and is protected by
              intellectual-property laws. You receive a limited, non-exclusive,
              non-transferable licence to access and use the service for personal
              learning. Reproduction, resale, or redistribution of platform
              content is not permitted without written consent.
            </Prose>
            <Prose>
              You retain ownership of content you submit (e.g., solutions, bug
              reports, notebook entries). By submitting content you grant
              stablegrid a worldwide, royalty-free licence to host, store, and
              process that content for the purpose of operating and improving
              the service.
            </Prose>
          </section>

          <section>
            <SectionHeader>Payments, renewals and refunds</SectionHeader>
            <Prose>
              Paid subscriptions are billed through Stripe. Subscriptions renew
              automatically at the end of each billing period unless cancelled
              before renewal. You can cancel at any time from Settings &gt;
              Billing; cancellation takes effect at the end of the current paid
              period.
            </Prose>
            <Prose>
              Consumers in the European Union and the United Kingdom may exercise
              the statutory 14-day right of withdrawal after the first purchase,
              provided the service has not been fully consumed during that
              period. Outside this statutory window, fees already paid are
              generally non-refundable except where required by law or at our
              discretion. Contact {supportLink} for refund enquiries.
            </Prose>
          </section>

          <section>
            <SectionHeader>Termination</SectionHeader>
            <Prose>
              You may terminate your account at any time from Settings &gt;
              Danger Zone. We may suspend or terminate accounts that breach these
              terms, pose a security risk, or that we are legally required to
              disable. On termination your access ends immediately; retention of
              residual data is governed by our Privacy Policy. Provisions that
              by their nature should survive termination (intellectual property,
              liability, governing law) continue to apply.
            </Prose>
          </section>

          <section>
            <SectionHeader>Disclaimer and limitation of liability</SectionHeader>
            <Prose>
              The service is provided on an &quot;as is&quot; and &quot;as
              available&quot; basis. To the maximum extent permitted by law,
              stablegrid disclaims all implied warranties of merchantability,
              fitness for a particular purpose, and non-infringement.
            </Prose>
            <Prose>
              To the maximum extent permitted by law, stablegrid&apos;s aggregate
              liability for any claim arising out of or relating to the service
              is capped at the greater of (a) the amounts you paid to stablegrid
              in the twelve months preceding the event giving rise to the claim,
              or (b) one hundred euros (€100). stablegrid is not liable for
              indirect, consequential, incidental, or punitive damages, or for
              loss of data, profits, or goodwill. Nothing in these terms excludes
              liability that cannot lawfully be excluded, including for gross
              negligence, wilful misconduct, or statutory consumer rights.
            </Prose>
          </section>

          <section>
            <SectionHeader>Governing law and jurisdiction</SectionHeader>
            <Prose>
              These terms are governed by the laws of the Republic of Lithuania,
              without regard to its conflict-of-laws rules. The courts of
              Vilnius, Lithuania have exclusive jurisdiction over any dispute,
              subject to mandatory consumer-protection rules in your country of
              residence, which remain unaffected. The specific governing
              jurisdiction may be updated once the operating entity is finalised.
            </Prose>
          </section>

          <section>
            <SectionHeader>Dispute resolution</SectionHeader>
            <Prose>
              We prefer to resolve disputes directly. Before starting formal
              proceedings, please contact us at {supportLink} and allow up to 30
              days for good-faith negotiation. If the dispute cannot be resolved
              informally, it will be submitted to the competent courts identified
              above, or — where both parties agree in writing — to binding
              arbitration. Consumers in the EU may also use the European
              Commission&apos;s Online Dispute Resolution platform.
            </Prose>
          </section>

          <section>
            <SectionHeader>Changes to these terms</SectionHeader>
            <Prose>
              We may update these terms as the service evolves or as required by
              law. For material changes we will notify you by email and via an
              in-product notice at least 14 days before the new terms take
              effect. Continued use of the service after the effective date
              constitutes acceptance; if you disagree with the changes you may
              close your account before they take effect.
            </Prose>
          </section>

          <section>
            <SectionHeader>Support</SectionHeader>
            <Prose>
              Questions about these terms can be sent to {supportLink}.
            </Prose>
          </section>
        </article>

        <footer className="mt-20 pt-8 border-t-2 border-on-surface flex flex-wrap items-center justify-between gap-4">
          <span className="font-data-mono uppercase tracking-[0.18em] text-[10px] text-on-surface-variant">
            stablegrid.io
          </span>
          <span className="font-data-mono uppercase tracking-[0.18em] text-[10px] text-on-surface-variant">
            Legal · Effective 2026-03-04
          </span>
        </footer>
      </div>
    </main>
  );
}

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-serif text-[22px] sm:text-[24px] leading-tight text-on-surface mb-4">
    {children}
  </h2>
);

const Prose = ({ children }: { children: React.ReactNode }) => (
  <p className="font-body text-[15px] leading-[1.75] text-on-surface mt-4 first:mt-0">
    {children}
  </p>
);
