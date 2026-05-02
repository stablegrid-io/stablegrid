import type { ReactNode } from 'react';

export const ADMIN_PAGE_SHELL_CLASS =
  'min-h-screen px-4 py-6 sm:px-6 lg:px-8';

export const ADMIN_LAYOUT_CLASS =
  'w-full lg:grid lg:grid-cols-[13.25rem_minmax(0,1fr)] lg:gap-4 xl:grid-cols-[13.75rem_minmax(0,1fr)]';

/* ── Surfaces ─────────────────────────────────────────────────────────────────
   Aligned with the public-site frosted glass spec — `/practice/coding`
   toolbar, `/learn` cards, etc. — so admin and consumer pages share one
   visual language. */

/** Section panel that wraps tables / filter bars. Frosted glass. */
export const ADMIN_PRIMARY_SURFACE_CLASS = [
  'relative overflow-hidden rounded-[22px]',
  'border border-white/[0.1]',
  'bg-white/[0.05]',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_32px_rgba(0,0,0,0.22)]',
  '[backdrop-filter:blur(40px)_saturate(160%)] [-webkit-backdrop-filter:blur(40px)_saturate(160%)]',
].join(' ');

export const ADMIN_PRIMARY_SURFACE_OVERLAY_CLASS =
  'absolute inset-0 pointer-events-none';

/** Inset card on top of a primary surface (e.g. nested KPI tiles). */
export const ADMIN_SECONDARY_SURFACE_CLASS =
  'rounded-[18px] border border-white/[0.08] bg-white/[0.03]';

/** Solid card surface — matches /learn topic-card pattern. Use for
   data-dense panels (tables, lists) where readability needs an opaque bg. */
export const ADMIN_TABLE_SURFACE_CLASS =
  'overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#181c20]';

/** Detail drawer (slide-in panels). */
export const ADMIN_DRAWER_SURFACE_CLASS =
  'border-l border-white/[0.08] bg-[#0c0e10]/95 [backdrop-filter:blur(40px)_saturate(160%)] shadow-[-20px_0_46px_-30px_rgba(0,0,0,0.95)]';

/** Floating menu / popover panel. */
export const ADMIN_DROPDOWN_SURFACE_CLASS = [
  'rounded-[12px] border border-white/[0.12]',
  'bg-[rgba(16,18,22,0.96)]',
  '[backdrop-filter:blur(40px)_saturate(160%)] [-webkit-backdrop-filter:blur(40px)_saturate(160%)]',
  'shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]',
].join(' ');

/** Unified filter toolbar — search + tabs + dropdowns + actions in one row.
    Matches /practice/coding pattern. */
export const ADMIN_TOOLBAR_CLASS = [
  'relative z-30 w-full rounded-[18px]',
  'border border-white/[0.1] bg-white/[0.05]',
  '[backdrop-filter:blur(40px)_saturate(160%)] [-webkit-backdrop-filter:blur(40px)_saturate(160%)]',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_32px_rgba(0,0,0,0.22)]',
].join(' ');

/** Glass-button style used inside the toolbar (h-9, rounded-10). */
export const ADMIN_TOOLBAR_BUTTON_CLASS =
  'inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-white/[0.1] bg-white/[0.04] px-3 text-[10.5px] font-semibold tracking-[0.12em] uppercase font-mono text-white/78 transition-all hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.35)]';

/* ── Animation ──────────────────────────────────────────────────────────────── */

/** Apply to top-level page sections; pairs with @keyframes fadeSlideUp in
    globals.css. Set inline `animation` to vary delay. */
export const ADMIN_ENTRY_ANIM_STYLE = {
  opacity: 0,
  animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
} as const;

/* ── Inline messages ─────────────────────────────────────────────────────────── */

type AdminMessageTone = 'error' | 'success';

const ADMIN_MESSAGE_TONE_CLASS: Record<AdminMessageTone, string> = {
  error: 'border-error/20 bg-error/5 text-error rounded-[12px]',
  success: 'border-primary/20 bg-primary/5 text-primary rounded-[12px]',
};

const join = (...values: Array<string | undefined>) => values.filter(Boolean).join(' ');

export function AdminSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={join(ADMIN_PRIMARY_SURFACE_CLASS, className)}>
      <div className={ADMIN_PRIMARY_SURFACE_OVERLAY_CLASS} />
      <div className="relative">{children}</div>
    </section>
  );
}

export function AdminInlineMessage({
  tone,
  message,
  className,
}: {
  tone: AdminMessageTone;
  message: string;
  className?: string;
}) {
  return (
    <div
      className={join(
        'border px-4 py-3 text-sm font-medium',
        ADMIN_MESSAGE_TONE_CLASS[tone],
        className,
      )}
    >
      {message}
    </div>
  );
}
