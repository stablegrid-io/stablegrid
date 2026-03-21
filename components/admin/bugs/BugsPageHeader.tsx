import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function BugsPageHeader() {
  return (
    <header className="space-y-2">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[#8ea39a]">
        <Link
          href="/admin"
          className=" px-1 py-0.5 transition hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-[#62756c]" />
        <span className="text-[#d5e2dd]">Bugs</span>
      </nav>

      <h1
        className="text-3xl font-semibold tracking-tight text-on-surface sm:text-4xl"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Bug Reports
      </h1>
      <p className="text-sm text-[#8ea39a]">Review and manage submitted bug reports.</p>
    </header>
  );
}
