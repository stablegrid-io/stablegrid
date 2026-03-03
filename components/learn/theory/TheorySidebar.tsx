'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock3, Lock } from 'lucide-react';
import {
  getModuleCheckpointMeta,
  isModuleCheckpointLesson,
  MODULE_CHECKPOINT_TIME_LIMIT_SECONDS
} from '@/lib/learn/moduleCheckpoints';
import type { TheoryDoc } from '@/types/theory';
import {
  getDisplayLessonTitle,
  sortLessonsByOrder,
  sortModulesByOrder
} from '@/lib/learn/freezeTheoryDoc';

interface TheorySidebarProps {
  doc: TheoryDoc;
  activeChapterId: string;
  activeLessonId: string | null;
  completedLessonIds: string[];
  isProgressLoaded: boolean;
  isChapterCompleted: boolean;
  onSelectLesson: (lessonId: string) => void;
}

export const TheorySidebar = ({
  doc,
  activeChapterId,
  activeLessonId,
  completedLessonIds,
  isProgressLoaded,
  isChapterCompleted,
  onSelectLesson
}: TheorySidebarProps) => {
  const modules = sortModulesByOrder(doc.modules ?? doc.chapters);
  const activeModule =
    modules.find((module) => module.id === activeChapterId) ?? modules[0];
  const orderedLessons = sortLessonsByOrder(activeModule.sections);
  const completedLessonIdSet = new Set(completedLessonIds);
  const checkpointMeta = getModuleCheckpointMeta({
    topic: doc.topic,
    chapter: activeModule,
    lessonsRead: completedLessonIds.length,
    lessonsTotal: orderedLessons.length,
    isCompleted: isChapterCompleted
  });
  const checkpointBadgeClass =
    checkpointMeta.state === 'passed'
      ? 'border-brand-500/30 bg-brand-500/10 text-brand-500'
      : checkpointMeta.state === 'ready'
        ? 'border-warning-500/30 bg-warning-500/10 text-warning-600 dark:text-warning-400'
        : 'border-light-border bg-light-bg text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary';

  return (
    <div className="flex h-full flex-col bg-light-surface dark:bg-dark-surface">
      <div className="border-b border-light-border px-4 py-4 dark:border-dark-border">
        <Link
          href={`/learn/${doc.topic}/theory`}
          className="mb-3 inline-flex items-center gap-2 text-xs text-text-light-tertiary transition-colors hover:text-brand-500 dark:text-text-dark-tertiary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Modules
        </Link>

        <div className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
          {activeModule.title}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          <Clock3 className="h-3.5 w-3.5" />
          {orderedLessons.length} lessons · {activeModule.totalMinutes} min
        </div>
        {checkpointMeta.hasCheckpoint ? (
          <div
            className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium ${checkpointBadgeClass}`}
          >
            {checkpointMeta.state === 'passed' ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : null}
            <span>{checkpointMeta.label}</span>
            <span className="opacity-70">·</span>
            <span>
              {!isProgressLoaded
                ? 'Syncing lesson reads'
                : checkpointMeta.state === 'pending'
                ? `${completedLessonIds.length}/${orderedLessons.length} read`
                : checkpointMeta.detail}
            </span>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {orderedLessons.map((section, sectionIndex) => {
            const isActiveLesson = section.id === activeLessonId;
            const lessonOrder = section.order ?? sectionIndex + 1;
            const isLockedLesson = section.learningStatus === 'locked';
            const lessonLabel = getDisplayLessonTitle(section, lessonOrder);
            const isCheckpointLesson = isModuleCheckpointLesson(section.title);
            const isLessonRead =
              isProgressLoaded && completedLessonIdSet.has(section.id);

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  if (isLockedLesson) return;
                  onSelectLesson(section.id);
                }}
                disabled={isLockedLesson}
                title={lessonLabel}
                className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                  isActiveLesson
                    ? 'bg-light-bg shadow-[0_0_0_1px_rgba(0,0,0,0.08)] dark:bg-dark-bg dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]'
                    : isLockedLesson
                      ? 'cursor-not-allowed opacity-55'
                      : 'hover:bg-light-hover dark:hover:bg-dark-hover'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                      isLockedLesson
                        ? 'bg-light-border text-text-light-tertiary dark:bg-dark-border dark:text-text-dark-tertiary'
                        : isLessonRead
                          ? isActiveLesson
                            ? 'bg-brand-500 text-white shadow-[0_0_0_2px_rgba(16,185,129,0.18)] dark:text-dark-bg'
                            : 'bg-brand-500/15 text-brand-600 ring-1 ring-brand-500/35 dark:text-brand-400'
                          : isActiveLesson
                            ? 'bg-text-light-primary text-white dark:bg-text-dark-primary dark:text-dark-bg'
                            : 'bg-light-border text-text-light-tertiary dark:bg-dark-border dark:text-text-dark-tertiary'
                    }`}
                  >
                    {isLockedLesson ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      lessonOrder
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm leading-5 ${
                        isActiveLesson
                          ? 'font-semibold text-text-light-primary dark:text-text-dark-primary'
                          : 'text-text-light-secondary dark:text-text-dark-secondary'
                      }`}
                    >
                      {lessonLabel}
                    </div>
                    <div className="mt-1 text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
                      {isCheckpointLesson && checkpointMeta.hasCheckpoint ? (
                        <>
                          {checkpointMeta.label} · {checkpointMeta.detail} ·{' '}
                          {MODULE_CHECKPOINT_TIME_LIMIT_SECONDS}s each
                        </>
                      ) : (
                        <>{section.durationMinutes ?? section.estimatedMinutes} min</>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
