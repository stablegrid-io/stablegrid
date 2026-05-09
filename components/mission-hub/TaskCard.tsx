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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary-fixed bg-primary-fixed">
              <Icon className="h-5 w-5 text-primary-dim" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-on-surface-variant">
                {task.industry}
              </div>
              <div className="text-xs text-on-surface-variant">
                {task.difficulty}
              </div>
            </div>
          </div>
          <Badge tone={tone}>{isCompleted ? 'Completed' : task.status}</Badge>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-on-surface">
            {task.title}
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant line-clamp-2">
            {task.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {task.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded border border-surface-dim bg-surface-container-low px-2 py-1 text-xs text-on-surface-variant"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-surface-dim pt-4">
          <div className="text-sm font-semibold text-on-surface">
            ${task.reward.toLocaleString()}
          </div>
          <span className="text-sm text-on-surface-variant">
            {isLocked ? 'Locked' : 'Open'}
          </span>
        </div>
      </motion.div>
    </Card>
  );
};
