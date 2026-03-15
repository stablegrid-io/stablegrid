'use client';

import { useMemo, useRef, useState } from 'react';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';
import { CareerIdentityHeader } from '@/components/progress/CareerIdentityHeader';
import { CareerLadder } from '@/components/progress/CareerLadder';
import { CompletionHeatmap } from '@/components/progress/CompletionHeatmap';
import { CompetencyMatrix } from '@/components/progress/CompetencyMatrix';
import { ProgressDisclosure } from '@/components/progress/ProgressDisclosure';
import { PromotionGateList } from '@/components/progress/PromotionGateList';
import { ShiftLogTimeline } from '@/components/progress/ShiftLogTimeline';
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

type DisclosureKey = 'readiness' | 'capability' | 'activity';

export const ProgressDashboard = ({
  userId,
  userEmail,
  workerCareerSnapshot,
  readingSessions
}: ProgressDashboardProps) => {
  const [openSections, setOpenSections] = useState<Record<DisclosureKey, boolean>>({
    readiness: false,
    capability: false,
    activity: false
  });
  const viewedStageIds = useRef<Set<string>>(new Set());
  const readinessRef = useRef<HTMLDivElement | null>(null);
  const capabilityRef = useRef<HTMLDivElement | null>(null);
  const activityRef = useRef<HTMLDivElement | null>(null);

  const userName = useMemo(() => {
    const base = userEmail.split('@')[0] ?? 'Worker';
    return base.trim().length > 0 ? base : 'Worker';
  }, [userEmail]);

  const primaryTask = workerCareerSnapshot.developmentTasks[0] ?? null;
  const primaryRoute =
    primaryTask?.route ??
    workerCareerSnapshot.promotionCriteria[0]?.route ??
    '/theory';
  const criteriaMetCount = workerCareerSnapshot.promotionCriteria.filter(
    (criterion) => criterion.met
  ).length;
  const criteriaTotal = workerCareerSnapshot.promotionCriteria.length;
  const promotionReady = workerCareerSnapshot.developmentTasks.length === 0;

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

  const toggleSection = (section: DisclosureKey) => {
    setOpenSections((value) => ({
      ...value,
      [section]: !value[section]
    }));
  };

  const scrollToSection = (section: DisclosureKey) => {
    const ref =
      section === 'readiness'
        ? readinessRef
        : section === 'capability'
          ? capabilityRef
          : activityRef;
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openSection = (section: DisclosureKey) => {
    setOpenSections((value) => ({
      ...value,
      [section]: true
    }));

    window.requestAnimationFrame(() => {
      scrollToSection(section);
    });
  };

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[radial-gradient(circle_at_top,rgba(34,185,153,0.12),transparent_56%)] dark:bg-[radial-gradient(circle_at_top,rgba(34,185,153,0.16),transparent_52%)]" />

      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 lg:px-6 lg:py-8">
        <CareerIdentityHeader
          userName={userName}
          snapshot={workerCareerSnapshot}
          primaryRoute={primaryRoute}
          onReviewDetails={() => openSection('readiness')}
          onPrimaryAction={() => {
            if (primaryTask) {
              handleTaskStart(primaryTask);
            }
          }}
        />

        <div ref={readinessRef} id="hrb-readiness-details">
          <ProgressDisclosure
            id="hrb-readiness-panel"
            testId="hrb-readiness-disclosure"
            title="Readiness details"
            description={
              promotionReady
                ? 'All current promotion criteria are met. Review your role path and supporting evidence.'
                : `${criteriaMetCount} of ${criteriaTotal} promotion criteria are met.`
            }
            open={openSections.readiness}
            onToggle={() => toggleSection('readiness')}
          >
            <div data-testid="hrb-readiness-panel" className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              <CareerLadder
                stages={workerCareerSnapshot.ladderStages}
                currentLevel={workerCareerSnapshot.careerLevel}
                onStageViewed={handleStageViewed}
                onCriterionClick={handleCriterionClick}
              />

              <section className="rounded-[1.5rem] border border-[#d6ddd7] bg-white/72 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold tracking-[-0.02em] text-[#121b18] dark:text-[#f2f7f4]">
                      Promotion criteria
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[#6d746f] dark:text-[#7e9589]">
                      The current gate stays focused on the remaining requirements first.
                    </p>
                  </div>
                  {primaryTask ? (
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#4e5f57] dark:text-[#8aa496]">
                      Next focus: {primaryTask.label}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4">
                  <PromotionGateList
                    criteria={workerCareerSnapshot.promotionCriteria}
                    onCriterionClick={handleCriterionClick}
                  />
                </div>
              </section>
            </div>
          </ProgressDisclosure>
        </div>

        <div ref={capabilityRef}>
          <ProgressDisclosure
            id="hrb-capability-panel"
            title="Capability signals"
            description="A compact view of the competencies inferred from your recent operational evidence."
            open={openSections.capability}
            onToggle={() => toggleSection('capability')}
          >
            <CompetencyMatrix scores={workerCareerSnapshot.competencyScores} />
          </ProgressDisclosure>
        </div>

        <div ref={activityRef}>
          <ProgressDisclosure
            id="hrb-activity-panel"
            title="Activity evidence"
            description="Recent learning cadence and operational events that support the HRB record."
            open={openSections.activity}
            onToggle={() => toggleSection('activity')}
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <CompletionHeatmap sessions={readingSessions} />
              <ShiftLogTimeline entries={workerCareerSnapshot.shiftLogEntries} />
            </div>
          </ProgressDisclosure>
        </div>
      </div>
    </div>
  );
};
