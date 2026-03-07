'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Lock, Milestone } from 'lucide-react';
import type { CareerLadderStage, PromotionCriterion } from '@/types/progress';
import { PromotionGateList } from '@/components/progress/PromotionGateList';

interface CareerLadderProps {
  stages: CareerLadderStage[];
  currentLevel: number;
  onStageViewed?: (stage: CareerLadderStage) => void;
  onCriterionClick?: (criterion: PromotionCriterion) => void;
}

export function CareerLadder({
  stages,
  currentLevel,
  onStageViewed,
  onCriterionClick
}: CareerLadderProps) {
  const [showAllStages, setShowAllStages] = useState(false);
  const [activeStageId, setActiveStageId] = useState<string>(() => {
    const current = stages.find((stage) => stage.level === currentLevel);
    const nextActionable = stages.find((stage) => stage.unlocked && !stage.completed);
    if (current?.completed && nextActionable) {
      return nextActionable.id;
    }
    return current?.id ?? stages[0]?.id ?? '';
  });

  const visibleStages = useMemo(() => {
    if (showAllStages) {
      return stages;
    }

    return stages.filter((stage) => Math.abs(stage.level - currentLevel) <= 1);
  }, [currentLevel, showAllStages, stages]);

  useEffect(() => {
    const activeStage = stages.find((stage) => stage.id === activeStageId);
    if (activeStage) {
      onStageViewed?.(activeStage);
    }
  }, [activeStageId, onStageViewed, stages]);

  useEffect(() => {
    const activeVisible = visibleStages.some((stage) => stage.id === activeStageId);
    if (activeVisible) {
      return;
    }
    const current = stages.find((stage) => stage.level === currentLevel) ?? null;
    const nextActionable = stages.find((stage) => stage.unlocked && !stage.completed) ?? null;
    const fallback =
      current?.completed && nextActionable ? nextActionable : (current ?? stages[0] ?? null);
    if (fallback) {
      setActiveStageId(fallback.id);
    }
  }, [activeStageId, currentLevel, stages, visibleStages]);

  const activeStage =
    stages.find((stage) => stage.id === activeStageId) ??
    stages.find((stage) => stage.level === currentLevel) ??
    stages[0] ??
    null;

  return (
    <section
      aria-labelledby="career-ladder-heading"
      className="rounded-2xl border border-light-border bg-light-surface p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:border-dark-border dark:bg-dark-surface"
    >
      <div className="mb-3">
        <h2
          id="career-ladder-heading"
          className="text-sm font-semibold uppercase tracking-[0.11em] text-slate-700 dark:text-slate-200"
        >
          Career Ladder
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Focus on your current and next roles first.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <ol className="space-y-2" aria-label="Career stages">
          {visibleStages.map((stage) => {
            const isActive = activeStage?.id === stage.id;
            const isCurrent = stage.level === currentLevel;
            return (
              <li key={stage.id}>
                <button
                  type="button"
                  onClick={() => setActiveStageId(stage.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                    isActive
                      ? 'border-brand-500 bg-light-surface shadow-sm dark:border-brand-500 dark:bg-dark-hover'
                      : 'border-light-border bg-light-bg hover:border-brand-400 dark:border-dark-border dark:bg-dark-bg dark:hover:border-brand-500'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                        Level {stage.level}
                      </p>
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {stage.role}
                      </p>
                    </div>
                    {stage.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-brand-500" aria-label="Completed stage" />
                    ) : stage.unlocked ? (
                      <Milestone className="h-4 w-4 text-amber-500" aria-label="Unlocked stage" />
                    ) : (
                      <Lock className="h-4 w-4 text-slate-400" aria-label="Locked stage" />
                    )}
                  </div>
                </button>
              </li>
            );
          })}
          {stages.length > 2 ? (
            <li>
              <button
                type="button"
                onClick={() => setShowAllStages((value) => !value)}
                className="w-full rounded-lg border border-dashed border-light-border px-3 py-2 text-left text-xs font-medium text-text-light-secondary transition hover:border-brand-400 hover:text-brand-700 dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-brand-500 dark:hover:text-brand-300"
              >
                {showAllStages ? 'Show focused ladder' : `Show full ladder (${stages.length} levels)`}
              </button>
            </li>
          ) : null}
        </ol>

        {activeStage ? (
          <div className="rounded-lg border border-light-border bg-light-bg p-3.5 dark:border-dark-border dark:bg-dark-bg">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
              Role {activeStage.level}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {activeStage.role}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {activeStage.summary}
            </p>

            {!activeStage.unlocked ? (
              <p className="mt-3 rounded-md border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/35 dark:bg-amber-900/20 dark:text-amber-300">
                This role is locked. Complete the previous stage criteria to unlock it.
              </p>
            ) : null}

            <div className="mt-3">
              <PromotionGateList
                criteria={activeStage.criteria}
                onCriterionClick={onCriterionClick}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
