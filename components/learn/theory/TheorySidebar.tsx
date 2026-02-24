'use client';

import Link from 'next/link';
import { ArrowLeft, Clock, ListTree } from 'lucide-react';
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
  completedLessonIds?: string[];
  onSelectLesson: (lessonId: string) => void;
}

export const TheorySidebar = ({
  doc,
  activeChapterId,
  activeLessonId,
  completedLessonIds = [],
  onSelectLesson
}: TheorySidebarProps) => {
  const modules = sortModulesByOrder(doc.modules ?? doc.chapters);
  const totalMinutes = modules.reduce((sum, chapter) => sum + chapter.totalMinutes, 0);
  const activeModule =
    modules.find((module) => module.id === activeChapterId) ?? modules[0];
  const orderedLessons = sortLessonsByOrder(activeModule.sections);
  const activeLesson = orderedLessons.find((section) => section.id === activeLessonId);
  const activeLessonOrder =
    activeLesson?.order ??
    orderedLessons.findIndex((section) => section.id === activeLessonId) + 1;
  const completedLessonSet = new Set(completedLessonIds);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-light-border p-4 dark:border-dark-border">
        <Link
          href={`/learn/${doc.topic}/theory`}
          className="mb-3 inline-flex items-center gap-2 text-xs text-text-light-tertiary transition-colors hover:text-brand-500 dark:text-text-dark-tertiary"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to modules
        </Link>
        <div className="mt-1 flex items-center gap-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          <Clock className="h-3.5 w-3.5" />
          {totalMinutes} min total
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="rounded-lg border border-light-border bg-light-surface p-3 dark:border-dark-border dark:bg-dark-surface">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-500">
            Module {activeModule.number}
          </div>
          <div className="mt-1 text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            {activeModule.title}
          </div>
          <div className="mt-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            {activeModule.totalMinutes} min · {activeModule.sections.length} lessons
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-light-border bg-light-surface p-2 dark:border-dark-border dark:bg-dark-surface">
          <div className="mb-1.5 flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
            <ListTree className="h-3.5 w-3.5" />
            Lessons
          </div>
          <div className="space-y-1">
            {orderedLessons.map((section, sectionIndex) => {
              const isActiveLesson = section.id === activeLessonId;
              const lessonOrder = section.order ?? sectionIndex + 1;
              const isCompletedLesson =
                completedLessonSet.size > 0
                  ? completedLessonSet.has(section.id)
                  : activeLessonOrder > 0 && lessonOrder < activeLessonOrder;
              const isLockedLesson = section.learningStatus === 'locked';
              const lessonLabel = getDisplayLessonTitle(section, lessonOrder);

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
                  className={`w-full rounded px-2 py-1.5 text-left text-[12px] transition-colors ${
                    isActiveLesson
                      ? 'border-l-[3px] border-brand-400 bg-brand-500/20 text-brand-700 dark:text-brand-300'
                      : isLockedLesson
                        ? 'cursor-not-allowed border-l-[3px] border-transparent text-text-light-tertiary/70 dark:text-text-dark-tertiary/70'
                        : 'border-l-[3px] border-transparent text-text-light-secondary hover:bg-brand-500/10 dark:text-text-dark-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isActiveLesson ? (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    ) : isCompletedLesson ? (
                      <span className="text-emerald-500">✓</span>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-neutral-500/70" />
                    )}

                    <span className="min-w-0 flex-1 truncate">{lessonLabel}</span>

                    <span className="shrink-0 text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary">
                      {section.durationMinutes ?? section.estimatedMinutes} min
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
