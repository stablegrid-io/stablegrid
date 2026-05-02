import type { BugStatus } from '@/components/admin/bugs/types';

const STATUS_STYLE: Record<BugStatus, { bg: string; border: string; color: string }> = {
  New: {
    bg: 'rgba(96,165,250,0.12)',
    border: 'rgba(96,165,250,0.35)',
    color: 'rgb(147,197,253)',
  },
  'In Review': {
    bg: 'rgba(255,201,101,0.12)',
    border: 'rgba(255,201,101,0.35)',
    color: 'rgb(255,201,101)',
  },
  Resolved: {
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.35)',
    color: 'rgb(110,231,160)',
  },
};

export function BugStatusBadge({ status }: { status: BugStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex h-6 items-center rounded-full px-2.5 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
      }}
    >
      {status}
    </span>
  );
}
