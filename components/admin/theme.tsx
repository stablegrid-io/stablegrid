import type { ReactNode } from 'react';

/* Admin shell — editorial engineering system (cream / ink / vermillion).
   1px hairline borders, 0 corner radius, no shadows. Pairs with the public
   site (TopBar / Sidebar / HomeDashboard) so the admin reads as the same
   journal, just with a different masthead. */

export const ADMIN_PAGE_SHELL_CLASS =
  'min-h-screen bg-surface px-4 py-6 sm:px-6 lg:px-8';

export const ADMIN_LAYOUT_CLASS =
  'w-full lg:grid lg:grid-cols-[13.25rem_minmax(0,1fr)] lg:gap-4 xl:grid-cols-[13.75rem_minmax(0,1fr)]';

/* ── Surfaces ─────────────────────────────────────────────────────────────── */

/** Section panel that wraps tables / filter bars. Cream paper, hairline ink. */
export const ADMIN_PRIMARY_SURFACE_CLASS =
  'relative bg-surface border border-surface-dim';

/** Inset card on top of a primary surface (e.g. nested KPI tiles). */
export const ADMIN_SECONDARY_SURFACE_CLASS =
  'border border-surface-dim bg-surface-container-low';

/** Solid card surface — for data-dense panels (tables, lists). */
export const ADMIN_TABLE_SURFACE_CLASS =
  'border border-surface-dim bg-surface';

/** Detail drawer (slide-in panels). */
export const ADMIN_DRAWER_SURFACE_CLASS =
  'border-l border-surface-dim bg-surface';

/** Floating menu / popover panel. */
export const ADMIN_DROPDOWN_SURFACE_CLASS =
  'border border-on-surface bg-surface';

/** Toolbar row — search + tabs + dropdowns + actions in one row. */
export const ADMIN_TOOLBAR_CLASS =
  'relative z-30 w-full border border-surface-dim bg-surface-container-low';

/** Glass-button replaced with editorial flat button (h-9). */
export const ADMIN_TOOLBAR_BUTTON_CLASS =
  'inline-flex h-9 items-center gap-1.5 border border-on-surface bg-surface px-3 font-data-mono text-[10.5px] font-semibold tracking-[0.12em] uppercase text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';

/* ── Animation ──────────────────────────────────────────────────────────── */

export const ADMIN_ENTRY_ANIM_STYLE = {
  opacity: 0,
  animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
} as const;

/* ── Inline messages ──────────────────────────────────────────────────────── */

type AdminMessageTone = 'error' | 'success';

const ADMIN_MESSAGE_TONE_CLASS: Record<AdminMessageTone, string> = {
  error: 'border-error/40 bg-error/5 text-error',
  success: 'border-primary/40 bg-primary/5 text-primary',
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
        'border px-4 py-3 font-ui-label text-[12px] uppercase tracking-wider',
        ADMIN_MESSAGE_TONE_CLASS[tone],
        className,
      )}
    >
      {message}
    </div>
  );
}

/* ── Shared editorial primitives ─────────────────────────────────────────── */

/** Eyebrow label in mono uppercase — used above section titles. */
export const ADMIN_EYEBROW_CLASS =
  'font-data-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant';

/** Tiny mono label for form fields. */
export const ADMIN_FIELD_LABEL_CLASS =
  'font-data-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant';

/** Form input — flat cream-on-ink-border. */
export const ADMIN_INPUT_CLASS =
  'mt-2 w-full border border-surface-dim bg-surface-container-low px-4 py-3 font-body text-[13px] text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/20';

/** Tiny chip-style badge. */
export const ADMIN_SMALL_BADGE_CLASS =
  'inline-flex h-6 items-center border border-surface-dim bg-surface-container px-2.5 font-data-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant';

/** Mono uppercase label baseline (for buttons etc.). */
export const ADMIN_MONO_BUTTON_TEXT_CLASS =
  'font-data-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold';

/** Primary action button (vermillion). */
export const ADMIN_PRIMARY_BUTTON_CLASS =
  'h-11 px-5 border border-primary bg-primary text-surface transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';

/** Secondary button — flat ink-on-cream. */
export const ADMIN_SECONDARY_BUTTON_CLASS =
  'h-11 px-5 border border-on-surface bg-surface text-on-surface transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';

/** Compact button used in row actions / toolbars. */
export const ADMIN_GHOST_BUTTON_CLASS =
  'inline-flex h-8 items-center px-3 border border-surface-dim bg-surface text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';

/** Status pill — Active state (success). */
export const ADMIN_STATUS_ACTIVE_CLASS =
  'inline-flex h-6 items-center border border-primary bg-primary/10 px-2.5 font-data-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-primary';

/** Status pill — Inactive state. */
export const ADMIN_STATUS_INACTIVE_CLASS =
  'inline-flex h-6 items-center border border-surface-dim bg-surface-container px-2.5 font-data-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-on-surface-variant';

/** Danger action (e.g. delete confirm). */
export const ADMIN_DANGER_BUTTON_CLASS =
  'inline-flex h-8 items-center px-3 border border-error bg-error/10 text-error font-data-mono text-[10px] font-semibold uppercase tracking-[0.12em]';

/** Section heading row (eyebrow + title + body). */
export const ADMIN_SECTION_TITLE_CLASS =
  'font-h2 text-[28px] font-bold tracking-tight text-on-surface sm:text-[30px]';

export const ADMIN_SECTION_BODY_CLASS =
  'mt-2 max-w-2xl font-body text-[14px] leading-relaxed text-on-surface-variant';

/** Table header cell. */
export const ADMIN_TABLE_HEADER_CLASS =
  'px-5 py-3.5 font-data-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-on-surface-variant';

/** Table row hover. */
export const ADMIN_TABLE_ROW_CLASS =
  'border-t border-surface-dim transition-colors hover:bg-surface-container-low';
