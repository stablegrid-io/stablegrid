'use client';

import Link from 'next/link';
import { ArrowLeft, Clock3, Lock } from 'lucide-react';
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
  onSelectLesson: (lessonId: string) => void;
}

export const TheorySidebar = ({
  doc,
  activeChapterId,
  activeLessonId,
  onSelectLesson
}: TheorySidebarProps) => {
  const modules = sortModulesByOrder(doc.modules ?? doc.chapters);
  const activeModule =
    modules.find((module) => module.id === activeChapterId) ?? modules[0];
  const orderedLessons = sortLessonsByOrder(activeModule.sections);

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
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {orderedLessons.map((section, sectionIndex) => {
            const isActiveLesson = section.id === activeLessonId;
            const lessonOrder = section.order ?? sectionIndex + 1;
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
                      isActiveLesson
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
                      {section.durationMinutes ?? section.estimatedMinutes} min
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
