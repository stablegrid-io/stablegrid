import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'error';
  className?: string;
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'badge bg-surface-container-low text-on-surface-variant  ',
  success: 'badge badge-success',
  warning: 'badge badge-warning',
  error: 'badge badge-error'
};

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  const classes = ['data-mono', toneClasses[tone], className]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
}
