'use client';

import { motion } from 'framer-motion';
import { DollarSign, Shield, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useUserStore } from '@/lib/stores/useUserStore';

const statItems = [
  {
    key: 'balance',
    label: 'Client Credits',
    icon: DollarSign
  },
  {
    key: 'reputation',
    label: 'Reputation',
    icon: Shield
  },
  {
    key: 'streak',
    label: 'Streak',
    icon: Zap
  }
] as const;

export function StatsHeader() {
  const { balance, reputation, streak } = useUserStore();
  const statValues = { balance, reputation, streak };

  return (
    <Card className="p-6">
      <div className="grid gap-4 md:grid-cols-3">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          const value = statValues[item.key];
          return (
            <motion.div
              key={item.key}
              className="flex items-center gap-4 rounded-lg border border-light-border bg-light-muted p-4 dark:border-dark-border dark:bg-dark-muted"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20">
                <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-light-tertiary dark:text-text-dark-tertiary">
                  {item.label}
                </p>
                <p className="data-mono text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                  {item.key === 'balance'
                    ? `$${value.toLocaleString()}`
                    : value.toLocaleString()}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
