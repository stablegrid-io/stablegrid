import type { ReactNode } from 'react';

interface KickerProps {
  children: ReactNode;
  brackets?: boolean;
  className?: string;
}

/**
 * Editorial kicker label — uppercase mono, generous tracking, optional `[ ]`
 * brackets. Replaces pill-style badges in the editorial design language.
 */
export function Kicker({ children, brackets = false, className = '' }: KickerProps) {
  return (
    <span
      className={`font-editorial-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-3 ${className}`}
    >
      {brackets ? <span aria-hidden>[ </span> : null}
      {children}
      {brackets ? <span aria-hidden> ]</span> : null}
    </span>
  );
}
