'use client';

import { useMemo, useRef, useState } from 'react';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';
import { CareerIdentityHeader } from '@/components/progress/CareerIdentityHeader';
import { CareerLadder } from '@/components/progress/CareerLadder';
import { CompletionHeatmap } from '@/components/progress/CompletionHeatmap';
import { CompetencyMatrix } from '@/components/progress/CompetencyMatrix';
import { ShiftLogTimeline } from '@/components/progress/ShiftLogTimeline';
import { DevelopmentPlanChecklist } from '@/components/progress/DevelopmentPlanChecklist';
import type {
  CareerLadderStage,
  DevelopmentTask,
  PromotionCriterion,
  ReadingSession,
  WorkerCareerSnapshot
} from '@/types/progress';

interface ProgressDashboardProps {
  userId: string;
  userEmail: string;
  workerCareerSnapshot: WorkerCareerSnapshot;
  readingSessions: ReadingSession[];
}

export const ProgressDashboard = ({
  userId,
  userEmail,
  workerCareerSnapshot,
  readingSessions
}: ProgressDashboardProps) => {
  const [showCompetencyMatrix, setShowCompetencyMatrix] = useState(false);
  const [showShiftLog, setShowShiftLog] = useState(false);
  const viewedStageIds = useRef<Set<string>>(new Set());

  const userName = useMemo(() => {
    const base = userEmail.split('@')[0] ?? 'Worker';
    return base.trim().length > 0 ? base : 'Worker';
  }, [userEmail]);

  const handleStageViewed = (stage: CareerLadderStage) => {
    const stageKey = `${userId}:${stage.id}`;
    if (viewedStageIds.current.has(stageKey)) {
      return;
    }
    viewedStageIds.current.add(stageKey);
    void trackProductEvent('career_ladder_stage_viewed', {
      userId,
      stageId: stage.id,
      stageLevel: stage.level,
      stageRole: stage.role
    });
  };

  const handleCriterionClick = (criterion: PromotionCriterion) => {
    void trackProductEvent('promotion_criterion_clicked', {
      userId,
      criterionId: criterion.id,
      label: criterion.label,
      route: criterion.route,
      met: criterion.met
    });
  };

  const handleTaskStart = (task: DevelopmentTask) => {
    void trackProductEvent('development_task_started', {
      userId,
      taskId: task.id,
      label: task.label,
      route: task.route,
      etaMinutes: task.etaMinutes
    });
  };

  const primaryRoute =
    workerCareerSnapshot.developmentTasks[0]?.route ??
    workerCareerSnapshot.promotionCriteria[0]?.route ??
    '/learn/theory';
  const promotionReady = workerCareerSnapshot.developmentTasks.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
      <CareerIdentityHeader
        userName={userName}
        snapshot={workerCareerSnapshot}
        primaryRoute={primaryRoute}
      />

      <div className="mt-4 space-y-4">
        <CareerLadder
          stages={workerCareerSnapshot.ladderStages}
          currentLevel={workerCareerSnapshot.careerLevel}
          onStageViewed={handleStageViewed}
          onCriterionClick={handleCriterionClick}
        />

        <CompletionHeatmap sessions={readingSessions} />

        <section className="rounded-2xl border border-light-border bg-light-surface p-3.5 dark:border-dark-border dark:bg-dark-surface">
          <button
            type="button"
            onClick={() => setShowCompetencyMatrix((value) => !value)}
            className="w-full rounded-lg border border-light-border px-3 py-2 text-left text-sm font-medium text-text-light-secondary transition hover:border-brand-500 hover:text-brand-700 dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-brand-500 dark:hover:text-brand-300"
          >
            {showCompetencyMatrix ? 'Hide competency matrix' : 'Show competency matrix'}
          </button>
          {showCompetencyMatrix ? (
            <div className="mt-3">
              <CompetencyMatrix scores={workerCareerSnapshot.competencyScores} />
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-light-border bg-light-surface p-3.5 dark:border-dark-border dark:bg-dark-surface">
          <button
            type="button"
            onClick={() => setShowShiftLog((value) => !value)}
            className="w-full rounded-lg border border-light-border px-3 py-2 text-left text-sm font-medium text-text-light-secondary transition hover:border-brand-500 hover:text-brand-700 dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-brand-500 dark:hover:text-brand-300"
          >
            {showShiftLog ? 'Hide shift log' : 'Show shift log'}
          </button>
          {showShiftLog ? (
            <div className="mt-3">
              <ShiftLogTimeline entries={workerCareerSnapshot.shiftLogEntries} />
            </div>
          ) : null}
        </section>

        <DevelopmentPlanChecklist
          tasks={workerCareerSnapshot.developmentTasks}
          promotionReady={promotionReady}
          onTaskStart={handleTaskStart}
        />
      </div>
    </div>
  );
};
