import type { BugSeverity } from '@/components/admin/bugs/types';

const TONE_BY_SEVERITY: Record<
  BugSeverity,
  {
    className: string;
  }
> = {
  Low: {
    className: 'border-outline-variant/20 bg-surface-container text-[#d0dfd9]'
  },
  Medium: {
    className: 'border-amber-300/22 bg-amber-400/10 text-amber-100'
  },
  High: {
    className: 'border-orange-300/24 bg-orange-400/12 text-orange-100'
  },
  Critical: {
    className: 'border-rose-300/26 bg-error/14 text-error'
  }
};

export function BugSeverityBadge({ severity }: { severity: BugSeverity }) {
  return (
    <span
      className={`inline-flex items-center  border px-2.5 py-1 text-xs font-medium ${TONE_BY_SEVERITY[severity].className}`}
    >
      {severity}
    </span>
  );
}
