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
  const [showFullLadder, setShowFullLadder] = useState(false);
  const [activeStageId, setActiveStageId] = useState<string>(() => {
    const current = stages.find((stage) => stage.level === currentLevel);
    const nextActionable = stages.find((stage) => stage.unlocked && !stage.completed);
    if (current?.completed && nextActionable) {
      return nextActionable.id;
    }
    return current?.id ?? stages[0]?.id ?? '';
  });

  const currentStage = useMemo(
    () => stages.find((stage) => stage.level === currentLevel) ?? stages[0] ?? null,
    [currentLevel, stages]
  );
  const nextStage = useMemo(() => {
    const directNext = stages.find((stage) => stage.level === currentLevel + 1);
    if (directNext) {
      return directNext;
    }
    return stages.find((stage) => stage.unlocked && !stage.completed && stage.level !== currentLevel) ?? null;
  }, [currentLevel, stages]);

  const activeStage =
    stages.find((stage) => stage.id === activeStageId) ??
    nextStage ??
    currentStage ??
    stages[0] ??
    null;

  useEffect(() => {
    if (activeStage) {
      onStageViewed?.(activeStage);
    }
  }, [activeStage, onStageViewed]);

  return (
    <section className="rounded-[1.5rem] border border-[#d6ddd7] bg-white/72 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.02em] text-[#121b18] dark:text-[#f2f7f4]">
            Role path
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#6d746f] dark:text-[#7e9589]">
            Keep the current role and the next role in view, then expand for the full ladder.
          </p>
        </div>
        {stages.length > 2 ? (
          <button
            type="button"
            onClick={() => setShowFullLadder((value) => !value)}
            className="inline-flex items-center justify-center rounded-full border border-[#d5ddd7] bg-white/70 px-3.5 py-2 text-xs font-medium text-[#56635c] transition-colors hover:border-brand-500/30 hover:text-brand-700 dark:border-white/10 dark:bg-white/5 dark:text-[#9db6aa] dark:hover:border-brand-400/30 dark:hover:text-brand-300"
          >
            {showFullLadder ? 'Hide full role path' : `Show full role path (${stages.length} levels)`}
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[currentStage, nextStage].filter(Boolean).map((stage, index) => {
          const resolvedStage = stage as CareerLadderStage;
          const tone = index === 0 ? 'Current role' : 'Next role';

          return (
            <article
              key={resolvedStage.id}
              className="rounded-[1.35rem] border border-[#d6ddd7] bg-white/74 p-4 dark:border-white/8 dark:bg-white/4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4e5f57] dark:text-[#8aa496]">
                {tone}
              </p>
              <div className="mt-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold tracking-[-0.02em] text-[#121b18] dark:text-[#f2f7f4]">
                    {resolvedStage.role}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#6d746f] dark:text-[#7e9589]">
                    {resolvedStage.summary}
                  </p>
                </div>
                {resolvedStage.completed ? (
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-brand-500" aria-label="Completed stage" />
                ) : resolvedStage.unlocked ? (
                  <Milestone className="mt-1 h-4 w-4 shrink-0 text-amber-500" aria-label="Unlocked stage" />
                ) : (
                  <Lock className="mt-1 h-4 w-4 shrink-0 text-slate-400" aria-label="Locked stage" />
                )}
              </div>
            </article>
          );
        })}
      </div>

      {showFullLadder ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <ol className="space-y-2" aria-label="Career stages">
            {stages.map((stage) => {
              const isActive = activeStage?.id === stage.id;
              const isCurrent = stage.level === currentLevel;

              return (
                <li key={stage.id}>
                  <button
                    type="button"
                    onClick={() => setActiveStageId(stage.id)}
                    className={`w-full rounded-[18px] border px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-brand-200 bg-brand-50/90 shadow-[0_18px_40px_-30px_rgba(34,185,153,0.18)] dark:border-brand-500/30 dark:bg-brand-500/10'
                        : 'border-[#d6ddd7] bg-white/70 hover:border-brand-500/30 dark:border-white/10 dark:bg-white/4 dark:hover:border-brand-400/25'
                    }`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4e5f57] dark:text-[#8aa496]">
                          Level {stage.level}
                        </p>
                        <p className="truncate text-sm font-semibold text-[#121b18] dark:text-[#f2f7f4]">
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
          </ol>

          {activeStage ? (
            <div className="rounded-[1.35rem] border border-[#d6ddd7] bg-white/74 p-4 dark:border-white/8 dark:bg-white/4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4e5f57] dark:text-[#8aa496]">
                Level {activeStage.level}
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[#121b18] dark:text-[#f2f7f4]">
                {activeStage.role}
              </h3>
              <p className="mt-1 text-sm leading-6 text-[#6d746f] dark:text-[#7e9589]">
                {activeStage.summary}
              </p>

              {!activeStage.unlocked ? (
                <p className="mt-3 rounded-[16px] border border-amber-300/70 bg-amber-50/90 px-3 py-2 text-xs leading-5 text-amber-700 dark:border-amber-500/35 dark:bg-amber-900/20 dark:text-amber-300">
                  This role stays locked until the previous stage criteria are complete.
                </p>
              ) : null}

              <div className="mt-4">
                <PromotionGateList
                  criteria={activeStage.criteria}
                  onCriterionClick={onCriterionClick}
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
