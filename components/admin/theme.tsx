import type { ReactNode } from 'react';

export const ADMIN_PAGE_SHELL_CLASS =
  'min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,185,153,0.12),transparent_26%),linear-gradient(180deg,#040706_0%,#060b0a_36%,#050706_100%)] px-4 py-6 sm:px-6 lg:px-8';

export const ADMIN_LAYOUT_CLASS =
  'w-full lg:grid lg:grid-cols-[13.25rem_minmax(0,1fr)] lg:gap-3 xl:grid-cols-[13.75rem_minmax(0,1fr)]';

export const ADMIN_PRIMARY_SURFACE_CLASS =
  'relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,12,0.82),rgba(5,8,8,0.92))] shadow-[0_30px_80px_-52px_rgba(0,0,0,0.82)] backdrop-blur-xl';

export const ADMIN_PRIMARY_SURFACE_OVERLAY_CLASS =
  'absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,185,153,0.12),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_30%)]';

export const ADMIN_SECONDARY_SURFACE_CLASS =
  'rounded-[22px] border border-white/10 bg-[#07100f]/65 shadow-[0_24px_45px_-35px_rgba(0,0,0,0.9)]';

export const ADMIN_TABLE_SURFACE_CLASS =
  'overflow-hidden rounded-[18px] border border-white/10 bg-[#07100f]/65';

export const ADMIN_DRAWER_SURFACE_CLASS =
  'border-l border-white/12 bg-[linear-gradient(180deg,#0b1110_0%,#070b0b_100%)] shadow-[-20px_0_46px_-30px_rgba(0,0,0,0.95)]';

export const ADMIN_DROPDOWN_SURFACE_CLASS =
  'border border-white/14 bg-[linear-gradient(180deg,rgba(16,22,22,0.96),rgba(8,12,12,0.96))] shadow-[0_24px_42px_-24px_rgba(0,0,0,0.95)] backdrop-blur-xl';

type AdminMessageTone = 'error' | 'success';

const ADMIN_MESSAGE_TONE_CLASS: Record<AdminMessageTone, string> = {
  error: 'border-rose-400/25 bg-rose-500/10 text-rose-100',
  success: 'border-brand-400/25 bg-brand-500/10 text-[#d7f6ec]'
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
    <div className={join('rounded-[18px] border px-4 py-3 text-sm', ADMIN_MESSAGE_TONE_CLASS[tone], className)}>
      {message}
    </div>
  );
}
