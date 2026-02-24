'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import type { TheoryChapter } from '@/types/theory';
import { TheorySection } from '@/components/learn/theory/TheorySection';
import {
  getDisplayLessonTitle,
  sortLessonsByOrder,
  sortModulesByOrder
} from '@/lib/learn/freezeTheoryDoc';

interface TheoryContentProps {
  chapter: TheoryChapter;
  allChapters: TheoryChapter[];
  activeLessonId: string | null;
  onNavigate: (chapter: TheoryChapter) => void;
  onSelectLesson: (lessonId: string) => void;
  onCompleteCourse: () => void;
  isCompleted: boolean;
  isNextModuleUnlocked: boolean;
  onCompletionAction: () => void;
  completionActionPending: boolean;
  completionRewardLabel: string;
  completionSyncStatus?: {
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null;
}

export const TheoryContent = ({
  chapter,
  allChapters,
  activeLessonId,
  onNavigate,
  onSelectLesson,
  onCompleteCourse,
  isCompleted,
  isNextModuleUnlocked,
  onCompletionAction,
  completionActionPending,
  completionRewardLabel,
  completionSyncStatus = null
}: TheoryContentProps) => {
  const orderedModules = sortModulesByOrder(allChapters);
  const activeModule = orderedModules.find((item) => item.id === chapter.id) ?? chapter;
  const chapterIndex = orderedModules.findIndex((item) => item.id === activeModule.id);
  const previousChapter = chapterIndex > 0 ? orderedModules[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex >= 0 && chapterIndex < orderedModules.length - 1
      ? orderedModules[chapterIndex + 1]
      : null;

  const orderedLessons = sortLessonsByOrder(activeModule.sections);
  const selectedLesson = orderedLessons.find((section) => section.id === activeLessonId);
  const visibleLessons = selectedLesson ? [selectedLesson] : orderedLessons.slice(0, 1);
  const activeLesson = visibleLessons[0] ?? null;
  const activeLessonIndex = activeLesson
    ? orderedLessons.findIndex((section) => section.id === activeLesson.id)
    : -1;
  const previousLesson =
    activeLessonIndex > 0 ? orderedLessons[activeLessonIndex - 1] : null;
  const nextLesson =
    activeLessonIndex >= 0 && activeLessonIndex < orderedLessons.length - 1
      ? orderedLessons[activeLessonIndex + 1]
      : null;
  const nextModuleLocked = Boolean(nextChapter) && !isNextModuleUnlocked && !nextLesson;
  const normalizeLessonTitle = (title: string) =>
    title.replace(/^lesson\s*\d+\s*:\s*/i, '').trim();

  const handleNext = () => {
    if (nextLesson) {
      onSelectLesson(nextLesson.id);
      return;
    }

    if (nextChapter) {
      if (!isNextModuleUnlocked) {
        return;
      }
      onNavigate(nextChapter);
      return;
    }

    onCompleteCourse();
  };

  const handlePrevious = () => {
    if (previousLesson) {
      onSelectLesson(previousLesson.id);
      return;
    }

    if (previousChapter) {
      onNavigate(previousChapter);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeModule.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="mx-auto max-w-3xl px-4 py-8 lg:px-8 lg:py-12"
      >
        <header className="mb-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-brand-500">
            Module {activeModule.order ?? activeModule.number}
          </p>
          <h1 className="mb-3 text-3xl font-bold">{activeModule.title}</h1>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            {activeModule.description}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            <BookOpen className="h-3.5 w-3.5" />~
            {activeModule.durationMinutes ?? activeModule.totalMinutes} min read
          </div>
        </header>

        <div className="space-y-12">
          {visibleLessons.map((section) => (
            <TheorySection
              key={section.id}
              section={section}
              lessonIndex={Math.max(
                0,
                (section.order ??
                  orderedLessons.findIndex((item) => item.id === section.id) + 1) - 1
              )}
              lessonTotal={orderedLessons.length}
            />
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Module Completion
          </h3>
          <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Mark this module when you finish reading it. First completion awards +
            {completionRewardLabel}.
          </p>
          {nextChapter && !isNextModuleUnlocked ? (
            <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
              Complete this module to unlock: {nextChapter.title}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onCompletionAction}
            disabled={completionActionPending}
            className={`mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isCompleted
                ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
                : 'bg-brand-500 text-white hover:bg-brand-600'
            } ${completionActionPending ? 'cursor-not-allowed opacity-70' : ''}`}
          >
            {completionActionPending
              ? 'Saving...'
              : isCompleted
                ? 'Mark as not read'
                : 'I have read this module'}
          </button>
          {completionSyncStatus ? (
            <p
              className={`mt-2 text-xs ${
                completionSyncStatus.type === 'error'
                  ? 'text-red-500'
                  : completionSyncStatus.type === 'warning'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {completionSyncStatus.message}
            </p>
          ) : null}
        </div>

        <div className="mt-16 flex gap-4 border-t border-light-border pt-8 dark:border-dark-border">
          {previousLesson || previousChapter ? (
            <button
              type="button"
              onClick={handlePrevious}
              className="card flex-1 p-4 text-left transition-colors hover:border-brand-400 dark:hover:border-brand-600"
            >
              <div className="mb-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                {previousLesson ? 'Previous Lesson' : 'Previous Module'}
              </div>
              <div className="text-sm font-medium">
                {previousLesson
                  ? normalizeLessonTitle(
                      getDisplayLessonTitle(
                        previousLesson,
                        previousLesson.order ?? activeLessonIndex
                      )
                    )
                  : previousChapter?.title}
              </div>
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleNext}
            disabled={nextModuleLocked}
            className={`ml-auto flex-none w-full rounded-xl border px-4 py-2.5 text-right shadow-sm transition-all sm:w-[18rem] ${
              nextModuleLocked
                ? 'cursor-not-allowed border-amber-400/50 bg-amber-500/15 text-amber-900 dark:text-amber-200'
                : 'border-brand-500 bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700'
            }`}
          >
            <div
              className={`mb-1 text-xs ${nextModuleLocked ? 'text-amber-700 dark:text-amber-300' : 'text-white/80'}`}
            >
              {nextLesson
                ? 'Next Lesson'
                : nextChapter
                  ? isNextModuleUnlocked
                    ? 'Next Module'
                    : 'Module Locked'
                  : 'Course'}
            </div>
            <div
              className={`text-sm font-semibold ${nextModuleLocked ? 'text-amber-900 dark:text-amber-100' : 'text-white'}`}
            >
              {nextLesson
                ? normalizeLessonTitle(
                    getDisplayLessonTitle(
                      nextLesson,
                      nextLesson.order ?? activeLessonIndex + 2
                    )
                  )
                : nextChapter
                  ? isNextModuleUnlocked
                    ? nextChapter.title
                    : 'Complete this module to unlock'
                  : 'Complete Course'}
            </div>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
