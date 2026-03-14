import type { BugSeverity } from '@/components/admin/bugs/types';

const TONE_BY_SEVERITY: Record<
  BugSeverity,
  {
    className: string;
  }
> = {
  Low: {
    className: 'border-white/14 bg-white/[0.05] text-[#d0dfd9]'
  },
  Medium: {
    className: 'border-amber-300/22 bg-amber-400/10 text-amber-100'
  },
  High: {
    className: 'border-orange-300/24 bg-orange-400/12 text-orange-100'
  },
  Critical: {
    className: 'border-rose-300/26 bg-rose-500/14 text-rose-100'
  }
};

export function BugSeverityBadge({ severity }: { severity: BugSeverity }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${TONE_BY_SEVERITY[severity].className}`}
    >
      {severity}
    </span>
  );
}
