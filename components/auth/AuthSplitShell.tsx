'use client';

import type { ReactNode } from 'react';
import { ScadaMimicBackground } from '@/components/home/landing/ScadaMimicBackground';

interface AuthSplitShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthSplitShell({ title, subtitle, children }: AuthSplitShellProps) {
  return (
    <main className="relative overflow-hidden min-h-screen bg-surface flex items-center justify-center px-5 py-10 sm:px-8">
      <ScadaMimicBackground />
      <article className="relative z-10 w-full max-w-[480px] bg-surface border border-on-surface">
        {/* Header strip */}
        <header className="flex items-center gap-3 px-6 py-3 bg-primary text-on-primary">
          <span className="font-data-mono uppercase text-[11px] tracking-wider">
            Access Card
          </span>
        </header>

        {/* Perforation hairline */}
        <div
          aria-hidden
          className="h-px text-on-surface"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to right, currentColor 0 4px, transparent 4px 8px)',
            opacity: 0.35
          }}
        />

        {/* Body */}
        <div className="px-6 sm:px-10 py-10">
          <h1 className="mb-3 font-h1 text-[36px] font-bold leading-tight tracking-tight text-on-surface">
            {title}
          </h1>
          <p className="mb-8 font-body text-[15px] leading-relaxed text-on-surface-variant">
            {subtitle}
          </p>
          {children}
        </div>

        {/* Footer strip */}
        <footer className="border-t border-surface-dim px-6 py-3 text-center font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
          Free during beta · no credit card required
        </footer>
      </article>
    </main>
  );
}
