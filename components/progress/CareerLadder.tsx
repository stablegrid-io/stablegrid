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
    const fallback = stages.find((stage) => stage.level === currentLevel) ?? stages[0] ?? null;
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
      className="rounded-2xl border border-[#d6e5dd] bg-[#f8fbf9] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:border-[#284739] dark:bg-[#0e1a15]"
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
                      ? 'border-emerald-500 bg-white shadow-sm dark:bg-[#16261f]'
                      : 'border-[#d4e1da] bg-white hover:border-emerald-400 dark:border-[#2d4c3e] dark:bg-[#121f19] dark:hover:border-emerald-500'
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
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Completed stage" />
                    ) : stage.unlocked ? (
                      <Milestone className="h-4 w-4 text-sky-500" aria-label="Unlocked stage" />
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
                className="w-full rounded-lg border border-dashed border-[#cddfd5] px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-[#304f41] dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-300"
              >
                {showAllStages ? 'Show focused ladder' : `Show full ladder (${stages.length} levels)`}
              </button>
            </li>
          ) : null}
        </ol>

        {activeStage ? (
          <div className="rounded-lg border border-[#d5e3db] bg-white p-3.5 dark:border-[#2d4b3d] dark:bg-[#13211a]">
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
