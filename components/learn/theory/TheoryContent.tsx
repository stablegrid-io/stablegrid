'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock3 } from 'lucide-react';
import type { TheoryChapter } from '@/types/theory';
import { TheorySection } from '@/components/learn/theory/TheorySection';
import { TheoryModuleCheckpoint } from '@/components/learn/theory/TheoryModuleCheckpoint';
import { isModuleCheckpointLesson } from '@/lib/learn/moduleCheckpoints';
import {
  getDisplayLessonTitle,
  sortLessonsByOrder,
  sortModulesByOrder
} from '@/lib/learn/freezeTheoryDoc';

interface TheoryContentProps {
  topic: string;
  chapter: TheoryChapter;
  allChapters: TheoryChapter[];
  activeLessonId: string | null;
  onNavigate: (chapter: TheoryChapter, lessonId?: string | null) => void;
  onSelectLesson: (lessonId: string) => void;
  onCompleteCourse: () => void;
  isNextModuleUnlocked: boolean;
  isChapterCompleted: boolean;
  hasModuleCheckpoint: boolean;
  isProgressLoaded: boolean;
  completedLessonCount: number;
  onCompleteModule: () => Promise<boolean>;
  completionActionPending: boolean;
}

export const TheoryContent = ({
  topic,
  chapter,
  allChapters,
  activeLessonId,
  onNavigate,
  onSelectLesson,
  onCompleteCourse,
  isNextModuleUnlocked,
  isChapterCompleted,
  hasModuleCheckpoint,
  isProgressLoaded,
  completedLessonCount,
  onCompleteModule,
  completionActionPending
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
  const visibleLesson = selectedLesson ?? orderedLessons[0] ?? null;
  const activeLessonIndex = visibleLesson
    ? orderedLessons.findIndex((section) => section.id === visibleLesson.id)
    : -1;
  const previousLesson =
    activeLessonIndex > 0 ? orderedLessons[activeLessonIndex - 1] : null;
  const nextLesson =
    activeLessonIndex >= 0 && activeLessonIndex < orderedLessons.length - 1
      ? orderedLessons[activeLessonIndex + 1]
      : null;
  const isCheckpointLesson =
    Boolean(visibleLesson) &&
    hasModuleCheckpoint &&
    isModuleCheckpointLesson(visibleLesson?.title);
  const checkpointPending = isCheckpointLesson && !isChapterCompleted;
  const nextModuleLocked =
    Boolean(nextChapter) && (!isNextModuleUnlocked || checkpointPending) && !nextLesson;
  const activeLessonTitle = visibleLesson
    ? getDisplayLessonTitle(visibleLesson, activeLessonIndex + 1)
    : activeModule.title;
  const normalizeLessonTitle = (title: string) =>
    title.replace(/^lesson\s*\d+\s*:\s*/i, '').trim();

  const handleNext = () => {
    if (checkpointPending) {
      return;
    }

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
      const previousChapterLessons = sortLessonsByOrder(previousChapter.sections);
      const lastLessonId =
        previousChapterLessons[previousChapterLessons.length - 1]?.id ?? null;
      onNavigate(previousChapter, lastLessonId);
    }
  };

  const nextLabel = nextLesson
    ? 'Next Lesson'
    : checkpointPending
      ? 'Finish Checkpoint'
    : nextChapter
      ? isNextModuleUnlocked
        ? 'Next Module'
        : 'Module Locked'
      : 'Complete Course';
  const nextTarget = nextLesson
    ? normalizeLessonTitle(
        getDisplayLessonTitle(nextLesson, nextLesson.order ?? activeLessonIndex + 2)
      )
    : checkpointPending
      ? 'Complete the flashcards below'
    : nextChapter
      ? isNextModuleUnlocked
        ? nextChapter.title
        : 'Complete this module to unlock'
      : 'Complete Course';
  const previousLabel = previousLesson ? 'Previous Lesson' : 'Previous Module';
  const previousTarget = previousLesson
    ? normalizeLessonTitle(
        getDisplayLessonTitle(previousLesson, previousLesson.order ?? activeLessonIndex)
      )
    : previousChapter?.title ?? null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${activeModule.id}-${visibleLesson?.id ?? 'overview'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="mx-auto w-full max-w-[42rem] px-6 py-10"
      >
        <header className="mb-8">
          <div className="mb-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            Module {activeModule.order ?? activeModule.number} · Lesson{' '}
            {Math.max(activeLessonIndex + 1, 1)} of {orderedLessons.length}
          </div>
          <h1 className="text-3xl font-semibold leading-tight text-text-light-primary dark:text-text-dark-primary">
            {normalizeLessonTitle(activeLessonTitle)}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {visibleLesson?.durationMinutes ?? visibleLesson?.estimatedMinutes ?? 0} min
            </span>
            <span>{activeModule.title}</span>
          </div>
        </header>

        {visibleLesson ? (
          <TheorySection
            section={visibleLesson}
            lessonIndex={Math.max(activeLessonIndex, 0)}
            lessonTotal={orderedLessons.length}
            showHeader={false}
          />
        ) : null}

        {visibleLesson && isCheckpointLesson ? (
          <TheoryModuleCheckpoint
            topic={topic}
            chapter={activeModule}
            canStart={completedLessonCount >= orderedLessons.length}
            isProgressLoaded={isProgressLoaded}
            lessonsReadCount={completedLessonCount}
            lessonCount={orderedLessons.length}
            isCompleted={isChapterCompleted}
            isCompleting={completionActionPending}
            onCompleteModule={onCompleteModule}
          />
        ) : null}

        <div className="mt-10 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-t border-light-border pt-5 dark:border-dark-border">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={!previousLesson && !previousChapter}
            className={`min-w-0 inline-flex items-center gap-2 text-left text-sm ${
              previousLesson || previousChapter
                ? 'text-text-light-secondary hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:text-text-dark-primary'
                : 'cursor-default text-text-light-disabled dark:text-text-dark-disabled'
            }`}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate">
                {previousLabel}
                {previousTarget ? `: ${previousTarget}` : ''}
              </span>
            </span>
            <span className="sm:hidden">Previous</span>
          </button>

          <div className="whitespace-nowrap text-center text-xs tabular-nums text-text-light-tertiary dark:text-text-dark-tertiary">
            {Math.max(activeLessonIndex + 1, 1)} / {orderedLessons.length}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={nextModuleLocked || checkpointPending}
            className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              nextModuleLocked || checkpointPending
                ? 'cursor-not-allowed bg-light-hover text-text-light-disabled dark:bg-dark-hover dark:text-text-dark-disabled'
                : 'bg-text-light-primary text-white hover:bg-neutral-800 dark:bg-text-dark-primary dark:text-dark-bg dark:hover:bg-neutral-200'
            }`}
          >
            <span className="hidden sm:inline">{nextLabel}</span>
            <span className="sm:hidden">Continue</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
