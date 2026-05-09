import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you were looking for does not exist.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center bg-surface">
      <p className="font-data-mono text-[12px] tracking-widest uppercase text-primary mb-6">
        404 · Page not found
      </p>
      <h1 className="font-h1 text-h1 text-on-surface mb-4 max-w-2xl">
        We can&rsquo;t find that page.
      </h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mb-10">
        The URL may have changed, or the resource was moved. Try one of the entry
        points below.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 border border-on-surface bg-on-surface text-surface font-ui-label text-[13px] uppercase tracking-wider hover:bg-primary hover:border-primary transition-colors"
        >
          Back to home
        </Link>
        <Link
          href="/learn/pyspark/theory"
          className="inline-flex items-center font-ui-label text-[13px] uppercase tracking-wider text-primary border-b-2 border-primary pb-1 hover:text-surface-tint hover:border-surface-tint transition-colors"
        >
          Open the PySpark track →
        </Link>
      </div>
    </main>
  );
}
