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
      'bg-primary-fixed border-primary-fixed  ',
    iconClass: 'text-primary',
    titleClass: 'text-brand-900 '
  },
  warning: {
    Icon: AlertTriangle,
    classes:
      'bg-warning-50 border-warning-200  ',
    iconClass: 'text-warning-500',
    titleClass: 'text-warning-900 '
  },
  tip: {
    Icon: Lightbulb,
    classes:
      'bg-success-50 border-success-200  ',
    iconClass: 'text-success-500',
    titleClass: 'text-success-900 '
  },
  danger: {
    Icon: AlertTriangle,
    classes:
      'bg-error-50 border-error-200  ',
    iconClass: 'text-error-500',
    titleClass: 'text-error-900 '
  },
  insight: {
    Icon: Zap,
    classes:
      'bg-primary-fixed border-primary-fixed  ',
    iconClass: 'text-primary',
    titleClass: 'text-brand-900 '
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
