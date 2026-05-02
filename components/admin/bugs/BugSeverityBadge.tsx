import type { BugSeverity } from '@/components/admin/bugs/types';

const SEVERITY_STYLE: Record<BugSeverity, { bg: string; border: string; color: string }> = {
  Low: {
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.6)',
  },
  Medium: {
    bg: 'rgba(255,201,101,0.12)',
    border: 'rgba(255,201,101,0.35)',
    color: 'rgb(255,201,101)',
  },
  High: {
    bg: 'rgba(251,146,60,0.12)',
    border: 'rgba(251,146,60,0.35)',
    color: 'rgb(253,186,116)',
  },
  Critical: {
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.4)',
    color: 'rgb(252,165,165)',
  },
};

export function BugSeverityBadge({ severity }: { severity: BugSeverity }) {
  const style = SEVERITY_STYLE[severity];
  return (
    <span
      className="inline-flex h-6 items-center rounded-full px-2.5 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
      }}
    >
      {severity}
    </span>
  );
}
