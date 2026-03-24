import type { BugStatus } from '@/components/admin/bugs/types';

const TONE_BY_STATUS: Record<BugStatus, string> = {
  New: 'border-sky-400/15 bg-sky-400/8 text-sky-200/80',
  'In Review': 'border-amber-400/15 bg-amber-400/8 text-amber-200/80',
  Resolved: 'border-emerald-400/15 bg-emerald-400/8 text-emerald-200/80'
};

export function BugStatusBadge({ status }: { status: BugStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-medium ${TONE_BY_STATUS[status]}`}
    >
      {status}
    </span>
  );
}
