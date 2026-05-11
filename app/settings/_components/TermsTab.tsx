'use client';

import type { ReactNode } from 'react';

export function TermsTab() {
  return (
    <div className="mx-auto w-full max-w-[680px]">
      <header className="pb-10 border-b border-on-surface">
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

      <article className="mt-12 space-y-12">
        <section>
          <SectionHeader>Service scope</SectionHeader>
          <Prose>
            Current release scope is the PySpark theory and practice tracks. Features outside this
            scope may appear in product navigation only when explicitly launched.
          </Prose>
        </section>

        <section>
          <SectionHeader>Account responsibilities</SectionHeader>
          <Prose>
            You are responsible for account security and for activity performed through your
            account credentials.
          </Prose>
        </section>

        <section>
          <SectionHeader>Acceptable use</SectionHeader>
          <Prose>
            Do not attempt unauthorised access, abuse APIs, or disrupt platform availability for
            other users.
          </Prose>
        </section>

        <section>
          <SectionHeader>Support</SectionHeader>
          <Prose>
            Questions about these terms can be sent to{' '}
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
