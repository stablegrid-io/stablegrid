'use client';

import { motion } from 'framer-motion';
import { Database, ShieldCheck, ShoppingBag, TrendingUp } from 'lucide-react';
import type { Task } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface TaskCardProps {
  task: Task;
  isLocked: boolean;
  isCompleted: boolean;
  onSelect: (taskId: string) => void;
}

const industryIcons: Record<string, typeof Database> = {
  energy: TrendingUp,
  fintech: ShieldCheck,
  ecommerce: ShoppingBag,
  tech: Database
};

const statusTone: Record<string, 'neutral' | 'warning' | 'success' | 'error'> = {
  available: 'neutral',
  critical: 'warning',
  expiring: 'error'
};

export const TaskCard = ({
  task,
  isLocked,
  isCompleted,
  onSelect
}: TaskCardProps) => {
  const Icon = industryIcons[task.industry] ?? Database;
  const tone = isCompleted ? 'success' : statusTone[task.status] ?? 'neutral';

  return (
    <Card
      hover={!isLocked}
      onClick={() => (!isLocked ? onSelect(task.id) : undefined)}
      className={`p-6 ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20">
              <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
                {task.industry}
              </div>
              <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                {task.difficulty}
              </div>
            </div>
          </div>
          <Badge tone={tone}>{isCompleted ? 'Completed' : task.status}</Badge>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            {task.title}
          </h3>
          <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary line-clamp-2">
            {task.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {task.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded border border-light-border bg-light-muted px-2 py-1 text-xs text-text-light-secondary dark:border-dark-border dark:bg-dark-muted dark:text-text-dark-secondary"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-light-border pt-4 dark:border-dark-border">
          <div className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            ${task.reward.toLocaleString()}
          </div>
          <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
            {isLocked ? 'Locked' : 'Open'}
          </span>
        </div>
      </motion.div>
    </Card>
  );
};
