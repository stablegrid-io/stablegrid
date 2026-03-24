import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function BugsPageHeader() {
  return (
    <header>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-on-surface-variant/40">
        <Link
          href="/admin"
          className="rounded-md px-1.5 py-0.5 transition hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3 text-on-surface-variant/25" />
        <span className="text-on-surface-variant/70">Bugs</span>
      </nav>

      <div className="mt-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant/50">Bug Reports</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">
          Issues &amp; resolutions
        </h1>
        <p className="mt-2 text-[13px] text-on-surface-variant/40">Review and manage submitted bug reports.</p>
      </div>
    </header>
  );
}
