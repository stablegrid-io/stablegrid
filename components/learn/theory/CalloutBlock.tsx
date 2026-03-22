'use client';

import { AlertTriangle, Info, Lightbulb, Zap } from 'lucide-react';
import type { CalloutBlock as TheoryCallout } from '@/types/theory';

interface CalloutBlockProps {
  block: TheoryCallout;
}

const config = {
  info: {
    Icon: Info,
    classes:
      'bg-brand-50 border-brand-200 dark:bg-brand-900/10 dark:border-brand-800',
    iconClass: 'text-brand-500',
    titleClass: 'text-brand-900 dark:text-brand-100'
  },
  warning: {
    Icon: AlertTriangle,
    classes:
      'bg-warning-50 border-warning-200 dark:bg-warning-900/10 dark:border-warning-800',
    iconClass: 'text-warning-500',
    titleClass: 'text-warning-900 dark:text-warning-100'
  },
  tip: {
    Icon: Lightbulb,
    classes:
      'bg-success-50 border-success-200 dark:bg-success-900/10 dark:border-success-800',
    iconClass: 'text-success-500',
    titleClass: 'text-success-900 dark:text-success-100'
  },
  danger: {
    Icon: AlertTriangle,
    classes:
      'bg-error-50 border-error-200 dark:bg-error-900/10 dark:border-error-800',
    iconClass: 'text-error-500',
    titleClass: 'text-error-900 dark:text-error-100'
  },
  insight: {
    Icon: Zap,
    classes:
      'bg-brand-50 border-brand-200 dark:bg-brand-900/10 dark:border-brand-800',
    iconClass: 'text-brand-500',
    titleClass: 'text-brand-900 dark:text-brand-100'
  }
} as const;

export const CalloutBlock = ({ block }: CalloutBlockProps) => {
  const entry = config[block.variant];
  const Icon = entry.Icon;

  return (
    <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--rm-callout-bg)', borderLeftColor: 'var(--rm-callout-border)' }}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${entry.iconClass}`} />
        <div>
          {block.title ? (
            <div className="mb-1 text-sm font-semibold" style={{ color: 'var(--rm-text-heading)' }}>
              {block.title}
            </div>
          ) : null}
          <p className="text-sm leading-relaxed" style={{ color: 'var(--rm-text)' }}>
            {block.content}
          </p>
        </div>
      </div>
    </div>
  );
};
