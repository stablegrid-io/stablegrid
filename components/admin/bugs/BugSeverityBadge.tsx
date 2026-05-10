import type { BugSeverity } from '@/components/admin/bugs/types';

const SEVERITY_CLASS: Record<BugSeverity, string> = {
  Low: 'border-surface-dim bg-surface-container-low text-on-surface-variant',
  Medium: 'border-amber-500/40 bg-amber-500/10 text-amber-700',
  High: 'border-error/60 bg-error/5 text-error',
  Critical: 'border-error bg-error/10 text-error',
};

export function BugSeverityBadge({ severity }: { severity: BugSeverity }) {
  return (
    <span
      className={`inline-flex h-6 items-center border px-2.5 font-data-mono text-[10px] font-semibold tracking-[0.12em] uppercase ${SEVERITY_CLASS[severity]}`}
    >
      {severity}
    </span>
  );
}
