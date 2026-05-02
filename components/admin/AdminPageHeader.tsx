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
      className="space-y-3 border-b border-white/[0.08] pb-5"
      style={ADMIN_ENTRY_ANIM_STYLE}
    >
      <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-white/40">
        {eyebrow}
      </span>

      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-[12px] text-white/40"
      >
        <Link
          href="/admin"
          className="rounded px-1 py-0.5 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.4)]"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3 text-white/25" />
        <span className="text-white/70">{crumb}</span>
      </nav>

      <div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-on-surface">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-[15px] text-on-surface-variant/60">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
