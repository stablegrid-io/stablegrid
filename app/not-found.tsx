import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you were looking for does not exist.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center text-on-surface"
      style={{ backgroundColor: '#0a0c0e' }}
    >
      <p
        className="font-mono text-[11px] font-bold tracking-[0.22em] uppercase"
        style={{ color: '#99f7ff' }}
      >
        404
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-on-surface-variant">
        The page you were looking for does not exist, or it moved. Try one of
        the entry points below.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-white/[0.08]"
        >
          Back to home
        </Link>
        <Link
          href="/topics"
          className="inline-flex items-center rounded-full px-4 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
        >
          Browse all tracks →
        </Link>
      </div>
    </main>
  );
}
