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
  const completedLessonCount = completedLessonIds.length;
  const lessonProgressPct =
    orderedLessons.length > 0
      ? Math.min(100, Math.round((completedLessonCount / orderedLessons.length) * 100))
      : 0;
  const checkpointMeta = getModuleCheckpointMeta({
    topic: doc.topic,
    chapter: activeModule,
    lessonsRead: completedLessonIds.length,
    lessonsTotal: orderedLessons.length,
    isCompleted: isChapterCompleted
  });
  const checkpointBadgeClass =
    checkpointMeta.state === 'passed'
      ? 'border-primary/30 bg-primary/10 text-primary'
      : checkpointMeta.state === 'ready'
        ? 'border-tertiary/30 bg-tertiary/10 text-tertiary'
        : 'border-outline-variant bg-surface-container-low text-on-surface-variant';

  return (
    <div className="flex h-full flex-col bg-surface-container">
      <div className="border-b border-outline-variant/30 px-4 py-4">
        <Link
          href={`/learn/${doc.topic}/theory`}
          className="mb-3 inline-flex items-center gap-2 text-[10px] font-mono font-medium text-on-surface-variant transition-colors hover:text-on-surface uppercase tracking-wider"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Modules
        </Link>

        <div className="text-sm font-bold text-on-surface">
          {activeModule.title}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[10px] font-mono font-medium text-on-surface-variant uppercase">
          <Clock3 className="h-3.5 w-3.5" />
          {orderedLessons.length} lessons · {activeModule.totalMinutes} min
        </div>


        {checkpointMeta.hasCheckpoint ? (
          <div
            className={`mt-3 inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] font-medium ${checkpointBadgeClass}`}
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

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 pt-1">
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
                className={`w-full border px-3 py-2.5 text-left transition-colors ${
                  isActiveLesson
                    ? 'border-white/[0.12] bg-white/[0.06]'
                    : isLockedLesson
                      ? 'cursor-not-allowed border-transparent opacity-55'
                      : 'border-transparent hover:border-outline-variant/30 hover:bg-surface-container-high'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isLockedLesson
                        ? 'bg-surface-container-highest text-on-surface-variant'
                        : isLessonRead
                          ? 'bg-primary text-surface'
                          : isActiveLesson
                            ? 'bg-on-surface text-surface'
                            : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                    style={undefined}
                  >
                    {isLockedLesson ? (
                      <Lock className="h-3 w-3" />
                    ) : isLessonRead ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      lessonOrder
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm leading-5 ${
                        isActiveLesson
                          ? 'font-semibold text-on-surface'
                          : isLessonRead
                            ? 'text-on-surface/70'
                            : 'text-on-surface-variant'
                      }`}
                    >
                      {lessonLabel}
                    </div>
                    <div className="mt-1 text-[10px] text-on-surface-variant/60">
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
