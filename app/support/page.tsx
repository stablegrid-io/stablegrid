import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with stablegrid.io — contact, support requests, and account help.',
  alternates: { canonical: '/support' }
};

const SECTIONS = [
  {
    eyebrow: 'Contact channel',
    title: 'Reach us by email.',
    body: (
      <>
        <p className="font-body text-[15px] leading-relaxed text-on-surface-variant mb-5">
          Use the suggested subject format so we can route your message quickly.
        </p>
        <a
          href="mailto:support@stablegrid.io?subject=%5Bstablegrid%5D%20"
          className="inline-flex items-center gap-2 px-5 py-3 border border-primary bg-primary text-on-primary font-data-mono uppercase text-[12px] tracking-wider hover:bg-primary-dim hover:border-primary-dim transition-colors"
        >
          support@stablegrid.io <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
        </a>
        <div className="mt-5 flex flex-wrap items-baseline gap-3">
          <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
            Suggested subject
          </span>
          <span className="font-data-mono text-[12px] text-on-surface px-2 py-1 border border-surface-dim bg-surface-container-low">
            [stablegrid] brief issue summary
          </span>
        </div>
      </>
    )
  },
  {
    eyebrow: 'Include in report',
    title: 'What helps us debug fast.',
    body: (
      <ul className="font-body text-[15px] leading-relaxed text-on-surface-variant space-y-2 list-none">
        {[
          'Route URL where the issue occurred',
          'Timestamp (rough is fine — within an hour)',
          'What you expected to happen',
          'What actually happened',
          'A screenshot if it’s visual',
          'Your login email, only if account-specific'
        ].map((line) => (
          <li key={line} className="flex items-baseline gap-3">
            <span aria-hidden className="font-data-mono text-on-surface-variant text-[12px] tabular-nums">
              ·
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    )
  },
  {
    eyebrow: 'Data requests',
    title: 'GDPR export & delete.',
    body: (
      <p className="font-body text-[15px] leading-relaxed text-on-surface-variant">
        Export and delete actions are available in{' '}
        <Link
          href="/settings?tab=privacy"
          className="text-on-surface underline underline-offset-2 hover:text-primary transition-colors"
        >
          Settings · Privacy
        </Link>
        {' '}after login. For pre-account inquiries email the address above.
      </p>
    )
  }
];

const SLA = [
  { label: 'First reply', value: '≤ 2 business days' },
  { label: 'Critical issues', value: 'Sign-in · Billing · Data loss' },
  { label: 'Quiet hours', value: 'Weekends · EU public holidays' }
];

export default function SupportPage() {
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

        {/* Editorial masthead — matches Terms / Privacy article header so
            the three legal-style pages read as one publication. */}
        <header className="mt-12 pb-10 border-b border-on-surface">
          <p className="font-data-mono uppercase tracking-[0.22em] text-[10px] text-primary mb-5">
            Stablegrid · Support
          </p>
          <h1 className="font-serif text-[44px] sm:text-[56px] leading-[1.05] tracking-tight text-on-surface">
            Support
          </h1>
          <p className="mt-5 font-data-mono uppercase tracking-wider text-[11px] text-on-surface-variant">
            We aim to reply within two business days
          </p>
        </header>

        {/* SLA strip — kept as a compact mono table; content-driven, no
            card chrome. */}
        <dl className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 border-b border-surface-dim pb-8">
          {SLA.map((item) => (
            <div key={item.label}>
              <dt className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant mb-1.5">
                {item.label}
              </dt>
              <dd className="font-data-mono text-[14px] text-on-surface tabular-nums">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Body — same flowing-prose article shape as Terms / Privacy. */}
        <article className="mt-12 space-y-12">
          {SECTIONS.map((section) => (
            <section key={section.eyebrow}>
              <p className="font-data-mono uppercase tracking-wider text-[11px] text-on-surface-variant mb-3">
                {section.eyebrow}
              </p>
              <h2 className="font-serif text-[22px] sm:text-[24px] leading-tight text-on-surface mb-4">
                {section.title}
              </h2>
              {section.body}
            </section>
          ))}
        </article>

        <footer className="mt-16 pt-6 border-t border-surface-dim flex flex-wrap justify-between gap-4 font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
          <span>Support · stablegrid.io</span>
          <Link href="/" className="hover:text-on-surface transition-colors">
            Back to home
          </Link>
        </footer>
      </div>
    </main>
  );
}
