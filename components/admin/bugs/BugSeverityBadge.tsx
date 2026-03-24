import type { BugSeverity } from '@/components/admin/bugs/types';

const TONE_BY_SEVERITY: Record<BugSeverity, string> = {
  Low: 'border-white/[0.08] bg-white/[0.04] text-on-surface-variant/60',
  Medium: 'border-amber-400/15 bg-amber-400/8 text-amber-200/80',
  High: 'border-orange-400/15 bg-orange-400/8 text-orange-200/80',
  Critical: 'border-rose-400/15 bg-rose-400/10 text-rose-300/90'
};

export function BugSeverityBadge({ severity }: { severity: BugSeverity }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-medium ${TONE_BY_SEVERITY[severity]}`}
    >
      {severity}
    </span>
  );
}
