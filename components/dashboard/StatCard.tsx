'use client';

import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  description?: string;
  accentColor?: 'brand' | 'success' | 'warning' | 'violet';
}

const accentClasses = {
  brand: 'border-l-brand-500',
  success: 'border-l-brand-500',
  warning: 'border-l-amber-500',
  violet: 'border-l-violet-500'
};

export const StatCard = ({
  label,
  value,
  icon: Icon,
  trend,
  description,
  accentColor = 'brand'
}: StatCardProps) => {
  const isPositiveTrend = (trend?.value ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative h-full rounded-xl border border-light-border bg-light-surface p-6 transition-all duration-200 hover:border-light-active dark:border-dark-border dark:bg-dark-surface dark:hover:border-dark-active ${accentClasses[accentColor]} border-l-2`}
    >
      <div className="mb-4 flex items-center justify-between">
        <Icon className="h-4 w-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
        {trend && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isPositiveTrend
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
                : 'bg-error-50 text-error-700 dark:bg-error-900/20 dark:text-error-400'
            }`}
          >
            {isPositiveTrend ? '↑' : '↓'} {Math.abs(trend.value)} {trend.label}
          </span>
        )}
      </div>

      <div className="mb-1 text-4xl font-bold tracking-tight text-text-light-primary dark:text-text-dark-primary">
        {value}
      </div>
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-light-tertiary dark:text-text-dark-tertiary">
        {label}
      </div>
      {description && (
        <p className="mt-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
          {description}
        </p>
      )}
    </motion.div>
  );
};
