'use client';

import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { StableGridWordmark } from '@/components/brand/StableGridLogo';

interface AuthSplitShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const featureList = [
  {
    icon: '⚡',
    title: 'PySpark curriculum',
    description:
      'Structured chapters on execution plans, joins, AQE, Delta, and streaming.'
  },
  {
    icon: '📚',
    title: 'Reference library',
    description:
      'Searchable function documentation for SQL, Python, PySpark, and Fabric.'
  },
  {
    icon: '🎯',
    title: 'Targeted practice',
    description: 'Difficulty-based question sets with completion and accuracy tracking.'
  }
];

export function AuthSplitShell({ title, subtitle, children }: AuthSplitShellProps) {
  return (
    <main className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <div className="grid min-h-screen lg:grid-cols-[44%_56%]">
        <aside className="relative hidden overflow-hidden border-r border-[#1f1f1f] bg-[#0a0a0a] px-10 py-14 text-white lg:flex lg:items-center lg:justify-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)',
              backgroundSize: '36px 36px'
            }}
          />
          <div
            className="pointer-events-none absolute -left-28 -top-16 h-72 w-72 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }}
          />

          <div className="relative z-10 w-full max-w-md">
            <div className="mb-12 inline-flex items-center gap-3">
              <StableGridWordmark
                size="md"
                titleClassName="text-[#fafafa]"
                subtitle="Data Engineering Learning Platform"
                subtitleClassName="text-[#737373]"
              />
            </div>

            <h2 className="mb-4 max-w-md font-serif text-4xl leading-tight tracking-tight text-[#fafafa]">
              Build practical data engineering skills.
            </h2>
            <p className="mb-10 max-w-md text-sm leading-relaxed text-[#a3a3a3]">
              Learn with structured theory, function references, and practice across
              SQL, Python, PySpark, and Microsoft Fabric.
            </p>

            <div className="space-y-5">
              {featureList.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[10px] border border-brand-500/20 bg-brand-500/10 text-base">
                    {feature.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#fafafa]">
                      {feature.title}
                    </div>
                    <p className="text-xs leading-relaxed text-[#737373]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 border-t border-[#1f1f1f] pt-6 text-xs text-[#737373]">
              <div className="mb-1 flex items-center gap-2 text-[#a3a3a3]">
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                Free plan available
              </div>
              SQL and Python are included on the free tier.
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-14">
          <div className="w-full max-w-md">
            <header className="mb-8">
              <p className="data-mono mb-2 text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-brand-500">
                stableGrid.io Access
              </p>
              <h1 className="mb-2 text-3xl font-semibold tracking-tight text-text-light-primary dark:text-text-dark-primary">
                {title}
              </h1>
              <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                {subtitle}
              </p>
            </header>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
