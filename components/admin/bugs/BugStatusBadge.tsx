import type { BugStatus } from '@/components/admin/bugs/types';

const STATUS_CLASS: Record<BugStatus, string> = {
  New: 'border-primary bg-primary/10 text-primary',
  'In Review': 'border-amber-500/40 bg-amber-500/10 text-amber-700',
  Resolved: 'border-on-surface bg-surface text-on-surface',
};

export function BugStatusBadge({ status }: { status: BugStatus }) {
  return (
    <span
      className={`inline-flex h-6 items-center border px-2.5 font-data-mono text-[10px] font-semibold tracking-[0.12em] uppercase ${STATUS_CLASS[status]}`}
    >
      {status}
    </span>
  );
}
