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
      <div className="max-w-[1100px] mx-auto px-6 lg:px-12 py-12 lg:py-16">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant hover:text-on-surface transition-colors mb-12"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} /> Home
        </Link>

        {/* Masthead — page label only; the global topbar carries the wordmark. */}
        <header className="pb-6 mb-12 border-b-2 border-on-surface">
          <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant">
            Support desk
          </span>
        </header>

        {/* Title */}
        <section className="mb-16">
          <span className="font-data-mono uppercase text-[12px] tracking-wider text-on-surface-variant block mb-3">
            § Help
          </span>
          <h1 className="font-h1 text-h1 text-on-surface mb-4">Support</h1>
          <p className="font-body-lg text-on-surface-variant max-w-[60ch] leading-relaxed">
            We aim to reply to every support request within two business days.
            Sign-in, billing, and data-loss issues take top priority.
          </p>
        </section>

        {/* SLA strip */}
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-surface-dim border border-surface-dim mb-16">
          {SLA.map((item) => (
            <div key={item.label} className="bg-surface px-5 py-5">
              <dt className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant block mb-2">
                {item.label}
              </dt>
              <dd className="font-data-mono text-[14px] text-on-surface tabular-nums">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Sections */}
        <ol className="flex flex-col gap-12">
          {SECTIONS.map((section, idx) => (
            <li
              key={section.eyebrow}
              className="grid grid-cols-1 lg:grid-cols-[88px_1fr] gap-4 lg:gap-12 pb-12 border-b border-surface-dim last:border-b-0 last:pb-0"
            >
              <span className="font-data-mono uppercase text-[12px] tracking-wider text-on-surface-variant tabular-nums">
                § 0{idx + 1}
              </span>
              <div>
                <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant block mb-3">
                  {section.eyebrow}
                </span>
                <h2 className="font-serif text-[26px] sm:text-[32px] leading-tight text-on-surface mb-5">
                  {section.title}
                </h2>
                {section.body}
              </div>
            </li>
          ))}
        </ol>

        {/* Colophon */}
        <footer className="mt-20 pt-6 border-t border-surface-dim flex flex-wrap justify-between gap-4 font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
          <span>Support · stablegrid.io</span>
          <Link href="/" className="hover:text-on-surface transition-colors">
            Back to home
          </Link>
        </footer>
      </div>
    </main>
  );
}
