import Link from 'next/link';
import { ArrowRight, Flag, Radar } from 'lucide-react';
import type { GridOpsComputedState } from '@/lib/grid-ops/types';

interface MissionPanelProps {
  state: GridOpsComputedState;
}

export function MissionPanel({ state }: MissionPanelProps) {
  const currentMilestone = state.milestones.current;
  const nextMilestone = state.milestones.next;
  const recommendation = state.recommendation.next_best_action;

  return (
    <section className="rounded-2xl border border-[#cfe3d8] bg-[#f7fcf9] p-4 dark:border-[#253f33] dark:bg-[#0f1814]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5b7767] dark:text-[#8ba897]">
        Mission Control
      </p>

      <h3 className="mt-1 text-lg font-semibold text-[#173127] dark:text-[#def0e5]">
        Reach 100% stability while suppressing blackout risk
      </h3>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-start gap-2 rounded-lg border border-[#d7e7df] bg-white px-3 py-2 dark:border-[#2b4539] dark:bg-[#121d18]">
          <Radar className="mt-0.5 h-4 w-4 text-brand-500" />
          <div>
            <p className="font-medium text-[#1f382d] dark:text-[#deefe5]">Next Best Action</p>
            <p className="text-[#4a6757] dark:text-[#9db8a8]">{recommendation.action}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-[#d7e7df] bg-white px-3 py-2 dark:border-[#2b4539] dark:bg-[#121d18]">
          <Flag className="mt-0.5 h-4 w-4 text-cyan-500" />
          <div>
            <p className="font-medium text-[#1f382d] dark:text-[#deefe5]">Milestones</p>
            <p className="text-[#4a6757] dark:text-[#9db8a8]">
              {currentMilestone
                ? `Current: ${currentMilestone.title}`
                : 'Current: Initialization phase'}
            </p>
            <p className="text-[#4a6757] dark:text-[#9db8a8]">
              {nextMilestone
                ? `Next: ${nextMilestone.title} (${nextMilestone.threshold}%)`
                : 'All milestones reached'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/learn/pyspark/theory/all"
          className="inline-flex items-center gap-1 rounded-lg border border-[#bcd4c7] bg-white px-3 py-2 text-sm font-medium text-[#1d352a] transition hover:border-brand-500/60 dark:border-[#2d493b] dark:bg-[#121d18] dark:text-[#d3e9db]"
        >
          Continue learning
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
