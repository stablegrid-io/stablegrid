import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ADMIN_ENTRY_ANIM_STYLE } from '@/components/admin/theme';

interface AdminPageHeaderProps {
  /** Eyebrow above the breadcrumb, e.g. "Admin · Commerce". */
  eyebrow: string;
  /** Last crumb (current page). */
  crumb: string;
  /** Display title (h1). */
  title: string;
  /** Subtitle paragraph beneath the title. */
  subtitle?: string;
}

export function AdminPageHeader({
  eyebrow,
  crumb,
  title,
  subtitle,
}: AdminPageHeaderProps) {
  return (
    <header
      className="space-y-3 border-b border-surface-dim pb-5"
      style={ADMIN_ENTRY_ANIM_STYLE}
    >
      <span className="font-data-mono text-[10px] tracking-[0.22em] uppercase text-on-surface-variant">
        {eyebrow}
      </span>

      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant"
      >
        <Link
          href="/admin"
          className="px-1 py-0.5 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3 text-on-surface-variant" />
        <span className="text-on-surface">{crumb}</span>
      </nav>

      <div>
        <h1 className="font-h1 text-[42px] sm:text-[48px] font-bold tracking-tight text-on-surface">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 font-body text-[15px] text-on-surface-variant">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
