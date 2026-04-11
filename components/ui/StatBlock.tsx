import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatBlockProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  iconColor?: string;
  className?: string;
}

export function StatBlock({
  icon: Icon,
  label,
  value,
  iconColor = 'text-primary-dim',
  className = '',
}: StatBlockProps) {
  return (
    <div className={`p-4 border border-outline-variant bg-surface-container-low flex items-center gap-4 ${className}`}>
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <div>
        <div className="text-[10px] font-mono text-on-surface-variant uppercase">{label}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  );
}
