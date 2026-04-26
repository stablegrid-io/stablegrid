/*
 * LEGAL NOTICE: These terms are a starting draft only and have NOT been reviewed
 * by qualified legal counsel. They must be reviewed by a qualified commercial /
 * consumer-protection lawyer before production use. Governing-law, jurisdiction,
 * and entity placeholders must be finalised prior to publication.
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of use for StableGrid.',
  alternates: { canonical: '/terms' }
};

export default function TermsPage() {
  return (
    <main className="min-h-screen px-4 py-10 text-on-surface" style={{ backgroundColor: '#0a0c0e' }}>
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <a href="/" className="inline-flex items-center gap-2 text-[13px] font-medium text-on-surface-variant hover:text-on-surface transition-colors">
          ← Home
        </a>
        <header className="space-y-3">
          <p className="font-bold text-sm tracking-tight" style={{ color: '#99f7ff', letterSpacing: '0.08em' }}>stablegrid</p>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">
            Terms of Use
          </h1>
          <p className="text-sm text-on-surface-variant">
            Effective date: March 4, 2026
          </p>
        </header>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Service scope</h2>
          <p className="text-sm leading-7 text-on-surface-variant/80">
            stablegrid is a learning platform for data engineering. The current scope includes
            structured theory, practice sets, Grid Ops (our applied training arena), missions,
            the in-platform kWh economy, and paid subscription tiers with billing through Stripe.
            Features evolve over time; material additions will be reflected in these terms.
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Account responsibilities</h2>
          <p className="text-sm leading-7 text-on-surface-variant/80">
            You are responsible for account security and for activity performed through your
            account credentials. You must provide accurate information during signup and keep
            your contact email current.
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Acceptable use</h2>
          <p className="text-sm leading-7 text-on-surface-variant/80">
            Do not attempt unauthorized access, abuse APIs, scrape content at scale, or disrupt
            platform availability for other users. Automated account creation, sharing of paid
            credentials, and attempts to circumvent usage limits are prohibited.
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Intellectual property</h2>
          <p className="text-sm leading-7 text-on-surface-variant/80">
            All platform content — including theory material, practice sets, datasets, source
            code, branding, and the stablegrid name and logo — is owned by stablegrid or its
            licensors and is protected by intellectual-property laws. You receive a limited,
            non-exclusive, non-transferable licence to access and use the service for personal
            learning. Reproduction, resale, or redistribution of platform content is not permitted
            without written consent.
          </p>
          <p className="text-sm leading-7 text-on-surface-variant/80">
            You retain ownership of content you submit (e.g., solutions, bug reports,
            notebook entries). By submitting content you grant stablegrid a worldwide,
            royalty-free licence to host, store, and process that content for the purpose of
            operating and improving the service.
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Payments, renewals and refunds</h2>
          <p className="text-sm leading-7 text-on-surface-variant/80">
            Paid subscriptions are billed through Stripe. Subscriptions renew automatically at
            the end of each billing period unless cancelled before renewal. You can cancel at any
            time from Settings &gt; Billing; cancellation takes effect at the end of the current
            paid period.
          </p>
          <p className="text-sm leading-7 text-on-surface-variant/80">
            Consumers in the European Union and the United Kingdom may exercise the statutory
            14-day right of withdrawal after the first purchase, provided the service has not
            been fully consumed during that period. Outside this statutory window, fees already
            paid are generally non-refundable except where required by law or at our discretion.
            Contact{' '}
            <a
              href="mailto:support@stablegrid.io"
              className="font-medium text-primary hover:underline"
            >
              support@stablegrid.io
            </a>{' '}
            for refund enquiries.
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Termination</h2>
          <p className="text-sm leading-7 text-on-surface-variant/80">
            You may terminate your account at any time from Settings &gt; Danger Zone. We may
            suspend or terminate accounts that breach these terms, pose a security risk, or that
            we are legally required to disable. On termination your access ends immediately;
            retention of residual data is governed by our Privacy Policy. Provisions that by
            their nature should survive termination (intellectual property, liability,
            governing law) continue to apply.
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Disclaimer and limitation of liability</h2>
          <p className="text-sm leading-7 text-on-surface-variant/80">
            The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis.
            To the maximum extent permitted by law, stablegrid disclaims all implied warranties
            of merchantability, fitness for a particular purpose, and non-infringement.
          </p>
          <p className="text-sm leading-7 text-on-surface-variant/80">
            To the maximum extent permitted by law, stablegrid&apos;s aggregate liability for any
            claim arising out of or relating to the service is capped at the greater of (a) the
            amounts you paid to stablegrid in the twelve months preceding the event giving rise
            to the claim, or (b) one hundred euros (€100). stablegrid is not liable for indirect,
            consequential, incidental, or punitive damages, or for loss of data, profits, or
            goodwill. Nothing in these terms excludes liability that cannot lawfully be excluded,
            including for gross negligence, wilful misconduct, or statutory consumer rights.
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Governing law and jurisdiction</h2>
          <p className="text-sm leading-7 text-on-surface-variant/80">
            These terms are governed by the laws of the Republic of Lithuania, without regard to
            its conflict-of-laws rules. The courts of Vilnius, Lithuania have exclusive
            jurisdiction over any dispute, subject to mandatory consumer-protection rules in your
            country of residence, which remain unaffected. The specific governing jurisdiction
            may be updated once the operating entity is finalised.
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Dispute resolution</h2>
          <p className="text-sm leading-7 text-on-surface-variant/80">
            We prefer to resolve disputes directly. Before starting formal proceedings, please
            contact us at{' '}
            <a
              href="mailto:support@stablegrid.io"
              className="font-medium text-primary hover:underline"
            >
              support@stablegrid.io
            </a>{' '}
            and allow up to 30 days for good-faith negotiation. If the dispute cannot be resolved
            informally, it will be submitted to the competent courts identified above, or — where
            both parties agree in writing — to binding arbitration. Consumers in the EU may also
            use the European Commission&apos;s Online Dispute Resolution platform.
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Changes to these terms</h2>
          <p className="text-sm leading-7 text-on-surface-variant/80">
            We may update these terms as the service evolves or as required by law. For material
            changes we will notify you by email and via an in-product notice at least 14 days
            before the new terms take effect. Continued use of the service after the effective
            date constitutes acceptance; if you disagree with the changes you may close your
            account before they take effect.
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-5">
          <h2 className="text-xl font-semibold">Support</h2>
          <p className="text-sm leading-7 text-on-surface-variant/80">
            Questions about these terms can be sent to{' '}
            <a
              href="mailto:support@stablegrid.io"
              className="font-medium text-primary hover:underline"
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
