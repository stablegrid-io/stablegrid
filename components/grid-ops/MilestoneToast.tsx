import { AnimatePresence, motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { GridOpsMilestone } from '@/lib/grid-ops/types';

interface MilestoneToastProps {
  milestone: GridOpsMilestone | null;
}

export function MilestoneToast({ milestone }: MilestoneToastProps) {
  return (
    <AnimatePresence>
      {milestone ? (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-6 right-6 z-[60] w-[min(420px,calc(100%-2rem))] rounded-xl border border-brand-500/45 bg-[#151b25] p-4 text-[#deebfd] shadow-[0_18px_46px_rgba(0,0,0,0.4)]"
        >
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-300">
            <Trophy className="h-4 w-4" />
            Milestone unlocked
          </p>
          <h4 className="mt-1 text-lg font-semibold">{milestone.title}</h4>
          <p className="mt-1 text-sm text-brand-100/90">{milestone.description}</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
