import type { ReactNode } from 'react';

export const ADMIN_PAGE_SHELL_CLASS =
  'min-h-screen px-4 py-6 sm:px-6 lg:px-8';

export const ADMIN_LAYOUT_CLASS =
  'w-full lg:grid lg:grid-cols-[13.25rem_minmax(0,1fr)] lg:gap-4 xl:grid-cols-[13.75rem_minmax(0,1fr)]';

export const ADMIN_PRIMARY_SURFACE_CLASS =
  'relative overflow-hidden border border-outline-variant/20 bg-surface-container-low/60 backdrop-blur-xl';

export const ADMIN_PRIMARY_SURFACE_OVERLAY_CLASS =
  'absolute inset-0 pointer-events-none';

export const ADMIN_SECONDARY_SURFACE_CLASS =
  'border border-outline-variant/20 bg-surface-container-low/50';

export const ADMIN_TABLE_SURFACE_CLASS =
  'overflow-hidden border border-outline-variant/20 bg-surface-container-low/50';

export const ADMIN_DRAWER_SURFACE_CLASS =
  'border-l border-outline-variant/20 bg-surface shadow-[-20px_0_46px_-30px_rgba(0,0,0,0.95)]';

export const ADMIN_DROPDOWN_SURFACE_CLASS =
  'border border-outline-variant/30 bg-surface-container backdrop-blur-xl shadow-[0_24px_42px_-24px_rgba(0,0,0,0.95)]';

type AdminMessageTone = 'error' | 'success';

const ADMIN_MESSAGE_TONE_CLASS: Record<AdminMessageTone, string> = {
  error: 'border-error/25 bg-error/10 text-error',
  success: 'border-primary/25 bg-primary/10 text-primary'
};

const join = (...values: Array<string | undefined>) => values.filter(Boolean).join(' ');

export function AdminSurface({
  children,
  className
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
  className
}: {
  tone: AdminMessageTone;
  message: string;
  className?: string;
}) {
  return (
    <div className={join('border px-4 py-3 font-mono text-sm', ADMIN_MESSAGE_TONE_CLASS[tone], className)}>
      {message}
    </div>
  );
}
