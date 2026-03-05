'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, ClipboardList } from 'lucide-react';
import type { DevelopmentTask } from '@/types/progress';

interface DevelopmentPlanChecklistProps {
  tasks: DevelopmentTask[];
  promotionReady: boolean;
  onTaskStart?: (task: DevelopmentTask) => void;
}

export function DevelopmentPlanChecklist({
  tasks,
  promotionReady,
  onTaskStart
}: DevelopmentPlanChecklistProps) {
  const primaryTask = tasks[0] ?? null;

  return (
    <section
      id="development-plan"
      aria-labelledby="development-plan-heading"
      className="rounded-2xl border border-[#d6e5dd] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:border-[#284739] dark:bg-[#0f1914]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="development-plan-heading"
            className="text-sm font-semibold uppercase tracking-[0.11em] text-slate-700 dark:text-slate-200"
          >
            Development Plan
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Priority actions required for the next role.
          </p>
        </div>
        {primaryTask ? (
          <Link
            href={primaryTask.route}
            onClick={() => onTaskStart?.(primaryTask)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Start next task
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      {promotionReady ? (
        <div className="mt-4 rounded-lg border border-emerald-300/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-300">
          <p className="inline-flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            Ready for promotion review
          </p>
          <p className="mt-1 text-xs">
            All current role criteria are met. Continue operations or open missions for stretch goals.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="rounded-lg border border-[#d8e5dd] bg-[#fbfdfc] px-3 py-2.5 dark:border-[#2c4a3c] dark:bg-[#14231b]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                    <ClipboardList className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    {task.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Estimated effort: {task.etaMinutes} minutes
                  </p>
                </div>
                <Link
                  href={task.route}
                  onClick={() => onTaskStart?.(task)}
                  className="rounded-md border border-[#cbddd3] px-2 py-1 text-xs font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-[#315142] dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-300"
                >
                  Start
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
