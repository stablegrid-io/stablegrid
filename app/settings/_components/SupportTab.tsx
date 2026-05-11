'use client';

import type { ReactNode } from 'react';

const SLA = [
  { label: 'Sign-in / billing', value: 'Top priority' },
  { label: 'Data loss', value: 'Same business day' },
  { label: 'General questions', value: '< 2 business days' },
];

const SECTIONS = [
  {
    eyebrow: 'Contact channel',
    title: 'Email is the channel.',
    body: (
      <>
        <Prose>
          Email{' '}
          <a
            href="mailto:support@stablegrid.io?subject=%5Bstablegrid%5D%20"
            className="text-primary border-b border-primary/40 hover:border-primary transition-colors"
          >
            support@stablegrid.io
          </a>{' '}
          with the suggested subject format so we can route your message quickly.
        </Prose>
        <p className="mt-4 font-data-mono text-[12px] text-on-surface px-3 py-2 border border-surface-dim bg-surface-container-low inline-block">
          [stablegrid] brief issue summary
        </p>
      </>
    ),
  },
  {
    eyebrow: 'Include in report',
    title: 'What helps us answer fast.',
    body: (
      <>
        <Prose>
          Route URL, timestamp (with timezone), expected behaviour, actual behaviour, and a
          screenshot if possible. For account-specific problems include the login email.
        </Prose>
      </>
    ),
  },
  {
    eyebrow: 'Data requests',
    title: 'Export and deletion are self-service.',
    body: (
      <>
        <Prose>
          GDPR export and account deletion live in{' '}
          <span className="font-medium text-on-surface">Settings &gt; Danger Zone</span> and run
          immediately after re-authentication. If something goes wrong with either, email us and
          we&rsquo;ll handle it manually within one business day.
        </Prose>
      </>
    ),
  },
];

export function SupportTab() {
  return (
    <div className="mx-auto w-full max-w-[680px]">
      <header className="pb-10 border-b border-on-surface">
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

      <article className="mt-12 space-y-12">
        {SECTIONS.map((section) => (
          <section key={section.eyebrow}>
            <p className="font-data-mono uppercase tracking-wider text-[11px] text-on-surface-variant mb-3">
              {section.eyebrow}
            </p>
            <SectionHeader>{section.title}</SectionHeader>
            {section.body}
          </section>
        ))}
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
