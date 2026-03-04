'use client';

import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, CircleDashed, Target, Zap } from 'lucide-react';

type FirstLoopStepStatus = 'complete' | 'current' | 'upcoming';

export interface FirstLoopStep {
  id: 'chapter' | 'practice' | 'deploy';
  title: string;
  description: string;
  detail: string;
  status: FirstLoopStepStatus;
}

interface FirstLoopChecklistProps {
  steps: FirstLoopStep[];
}

const STEP_ICON_BY_ID = {
  chapter: BookOpen,
  practice: Target,
  deploy: Zap
} as const;

const STATUS_COPY: Record<FirstLoopStepStatus, string> = {
  complete: 'Complete',
  current: 'Current',
  upcoming: 'Queued'
};

const STATUS_SHELL: Record<FirstLoopStepStatus, string> = {
  complete:
    'border-emerald-200 bg-emerald-50/90 dark:border-emerald-500/30 dark:bg-emerald-500/10',
  current:
    'border-brand-200 bg-brand-50/90 dark:border-brand-500/30 dark:bg-brand-500/10',
  upcoming:
    'border-[#d7e5db] bg-white/70 dark:border-white/10 dark:bg-white/5'
};

const STATUS_BADGE: Record<FirstLoopStepStatus, string> = {
  complete:
    'border-emerald-200 bg-white text-emerald-700 dark:border-emerald-500/30 dark:bg-[#07100d] dark:text-emerald-300',
  current:
    'border-brand-200 bg-white text-brand-700 dark:border-brand-500/30 dark:bg-[#07100d] dark:text-brand-300',
  upcoming:
    'border-[#d7e5db] bg-white text-[#5a7263] dark:border-white/10 dark:bg-[#0d1511] dark:text-[#9eb7a9]'
};

export function FirstLoopChecklist({ steps }: FirstLoopChecklistProps) {
  const completedCount = steps.filter((step) => step.status === 'complete').length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.06 }}
      className="rounded-[1.8rem] border border-[#d7e5db] bg-[rgba(255,255,255,0.82)] p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.28)] backdrop-blur dark:border-white/10 dark:bg-[rgba(10,18,14,0.7)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f7b6b] dark:text-[#8fb8a3]">
            First deployment loop
          </p>
          <h2
            className="mt-2 text-[1.65rem] font-semibold tracking-tight text-[#101918] dark:text-[#f3f7f4]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Finish two chapters, then spend the reward.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4a6154] dark:text-[#b7cec2]">
            StableGrid is clearest when you complete the full loop once. The primary action above
            keeps moving to the next unfinished step.
          </p>
        </div>

        <div className="inline-flex items-center rounded-full border border-[#d7e5db] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#4b6657] dark:border-white/10 dark:bg-[#0d1511] dark:text-[#96b4a4]">
          {completedCount}/3 complete
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {steps.map((step) => {
          const Icon = STEP_ICON_BY_ID[step.id];

          return (
            <article
              key={step.id}
              className={`rounded-[1.4rem] border p-4 ${STATUS_SHELL[step.status]}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/80 dark:border-white/10 dark:bg-[#0d1511]">
                    <Icon className="h-4 w-4 text-[#153327] dark:text-[#d7ede1]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#101918] dark:text-[#f3f7f4]">
                      {step.title}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#5d7767] dark:text-[#94b0a1]">
                      {step.description}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${STATUS_BADGE[step.status]}`}
                >
                  {step.status === 'complete' ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <CircleDashed className="h-3.5 w-3.5" />
                  )}
                  {STATUS_COPY[step.status]}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-[#405548] dark:text-[#bfd7cb]">
                {step.detail}
              </p>
            </article>
          );
        })}
      </div>
    </motion.section>
  );
}
