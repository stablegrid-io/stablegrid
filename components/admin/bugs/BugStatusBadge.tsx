import type { BugStatus } from '@/components/admin/bugs/types';

const TONE_BY_STATUS: Record<
  BugStatus,
  {
    className: string;
  }
> = {
  New: {
    className: 'border-sky-300/22 bg-sky-500/12 text-sky-100'
  },
  'In Review': {
    className: 'border-amber-300/22 bg-amber-500/12 text-amber-100'
  },
  Resolved: {
    className: 'border-brand-400/24 bg-brand-500/12 text-[#d6f5ea]'
  }
};

export function BugStatusBadge({ status }: { status: BugStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${TONE_BY_STATUS[status].className}`}
    >
      {status}
    </span>
  );
}
