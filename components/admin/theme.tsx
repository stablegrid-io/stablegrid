import type { ReactNode } from 'react';

export const ADMIN_PAGE_SHELL_CLASS =
  'min-h-screen px-4 py-6 sm:px-6 lg:px-8';

export const ADMIN_LAYOUT_CLASS =
  'w-full lg:grid lg:grid-cols-[13.25rem_minmax(0,1fr)] lg:gap-4 xl:grid-cols-[13.75rem_minmax(0,1fr)]';

export const ADMIN_PRIMARY_SURFACE_CLASS =
  'relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-2xl';

export const ADMIN_PRIMARY_SURFACE_OVERLAY_CLASS =
  'absolute inset-0 pointer-events-none';

export const ADMIN_SECONDARY_SURFACE_CLASS =
  'rounded-xl border border-white/[0.06] bg-white/[0.02]';

export const ADMIN_TABLE_SURFACE_CLASS =
  'overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]';

export const ADMIN_DRAWER_SURFACE_CLASS =
  'border-l border-white/[0.06] bg-[#0c0e10]/95 backdrop-blur-2xl shadow-[-20px_0_46px_-30px_rgba(0,0,0,0.95)]';

export const ADMIN_DROPDOWN_SURFACE_CLASS =
  'rounded-xl border border-white/[0.06] bg-[#141618]/95 backdrop-blur-2xl shadow-[0_24px_42px_-24px_rgba(0,0,0,0.95)]';

type AdminMessageTone = 'error' | 'success';

const ADMIN_MESSAGE_TONE_CLASS: Record<AdminMessageTone, string> = {
  error: 'border-error/20 bg-error/5 text-error rounded-lg',
  success: 'border-primary/20 bg-primary/5 text-primary rounded-lg'
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
    <div className={join('border px-4 py-3 text-sm font-medium', ADMIN_MESSAGE_TONE_CLASS[tone], className)}>
      {message}
    </div>
  );
}
