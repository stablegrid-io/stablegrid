'use client';

import type { ReactNode } from 'react';
import { StableGridWordmark } from '@/components/brand/StableGridLogo';

interface AuthSplitShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const featureList = [
  {
    label: '01',
    title: 'PySpark curriculum',
    description:
      'Structured chapters on execution plans, joins, AQE, Delta, and streaming.'
  },
  {
    label: '02',
    title: 'Reference library',
    description:
      'Searchable function documentation for PySpark and the Spark API.'
  },
  {
    label: '03',
    title: 'Targeted practice',
    description: 'Module-graded question sets with completion and accuracy tracking.'
  }
];

export function AuthSplitShell({ title, subtitle, children }: AuthSplitShellProps) {
  return (
    <main className="min-h-screen bg-surface bg-grid-pattern">
      <div className="grid min-h-screen lg:grid-cols-[44%_56%]">
        <aside className="relative hidden overflow-hidden border-r border-on-surface bg-surface px-12 py-14 lg:flex lg:items-center lg:justify-center">
          <div className="relative z-10 w-full max-w-md">
            <div className="mb-12 inline-flex items-center gap-3">
              <StableGridWordmark
                size="md"
                titleClassName="text-on-surface"
                subtitle="Data Engineering Learning Platform"
                subtitleClassName="text-on-surface-variant font-ui-label uppercase tracking-wider text-[11px]"
              />
            </div>

            <h2 className="mb-4 max-w-md font-h1 text-h1 text-on-surface leading-tight">
              Build practical data engineering skills.
            </h2>
            <p className="mb-10 max-w-md font-body-lg text-on-surface-variant leading-relaxed">
              Learn with structured theory, function references, and module-graded
              practice for PySpark.
            </p>

            <div className="border-t border-on-surface">
              {featureList.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-6 border-b border-surface-dim py-5"
                >
                  <span className="font-data-mono text-on-surface-variant text-[12px] tabular-nums pt-0.5 w-8">
                    {feature.label}
                  </span>
                  <div>
                    <div className="font-ui-label text-on-surface uppercase tracking-wider text-[12px] mb-1">
                      {feature.title}
                    </div>
                    <p className="font-body-lg text-on-surface-variant text-[15px] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 font-data-mono text-[12px] text-on-surface-variant">
              Free during beta — no credit card required.
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-14">
          <div className="w-full max-w-md">
            <header className="mb-8">
              <p className="font-ui-label mb-2 text-[11px] uppercase tracking-widest text-primary">
                STABLEGRID.IO ACCESS
              </p>
              <h1 className="mb-2 font-h1 text-[36px] font-bold leading-tight tracking-tight text-on-surface">
                {title}
              </h1>
              <p className="font-body-lg text-on-surface-variant">{subtitle}</p>
            </header>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
