'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { TheoryChapter, TheorySection as TheorySectionType } from '@/types/theory';
import {
  TheorySection,
  shouldTrackReadingBlock
} from '@/components/learn/theory/TheorySection';
import { TheoryLessonIntro } from '@/components/learn/theory/TheoryLessonReading';

const TheoryModuleCheckpoint = dynamic(
  () => import('@/components/learn/theory/TheoryModuleCheckpoint').then((m) => m.TheoryModuleCheckpoint),
  { ssr: false }
);
import { isModuleCheckpointLesson } from '@/lib/learn/moduleCheckpoints';
import {
  getDisplayLessonTitle,
  sortLessonsByOrder,
  sortModulesByOrder
} from '@/lib/learn/freezeTheoryDoc';

interface TheoryContentProps {
  topic: string;
  docId?: string;
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
  completedLessonIds?: string[];
  onCompleteModule: () => Promise<boolean>;
  completionActionPending: boolean;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  isAdmin?: boolean;
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
  completedLessonIds = [],
  onCompleteModule,
  completionActionPending,
  scrollContainerRef,
  isAdmin = false,
  docId
}: TheoryContentProps) => {
  const router = useRouter();
  const orderedModules = sortModulesByOrder(allChapters);
  const activeModule = orderedModules.find((item) => item.id === chapter.id) ?? chapter;
  const chapterIndex = orderedModules.findIndex((item) => item.id === activeModule.id);
  const previousChapter = chapterIndex > 0 ? orderedModules[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex >= 0 && chapterIndex < orderedModules.length - 1
      ? orderedModules[chapterIndex + 1]
      : null;

  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [localSections, setLocalSections] = useState(activeModule.sections);

  const orderedLessons = sortLessonsByOrder(localSections);
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
  const normalizeLessonTitle = (title: string) =>
    title.replace(/^lesson\s*\d+\s*:\s*/i, '').trim();
  const readingSegmentIds = useMemo(
    () =>
      visibleLesson
        ? visibleLesson.blocks.flatMap((block, index) =>
            shouldTrackReadingBlock(block)
              ? [`${visibleLesson.id}-segment-${index}`]
              : []
          )
        : [],
    [visibleLesson]
  );
  const [readSegmentIds, setReadSegmentIds] = useState<string[]>([]);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const visibleSegmentIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setLocalSections(activeModule.sections);
    setEditingLessonId(null);
  }, [activeModule.id, visibleLesson?.id]);

  const handleEditEnd = (updatedSection?: TheorySectionType) => {
    if (updatedSection) {
      setLocalSections((prev) =>
        prev.map((s) => (s.id === updatedSection.id ? updatedSection : s))
      );
      router.refresh();
    }
    setEditingLessonId(null);
  };

  useEffect(() => {
    const firstSegmentId = readingSegmentIds[0] ?? null;
    setReadSegmentIds(firstSegmentId ? [firstSegmentId] : []);
    setActiveSegmentId(firstSegmentId);
    visibleSegmentIdsRef.current = firstSegmentId ? new Set([firstSegmentId]) : new Set();
  }, [readingSegmentIds]);

  useEffect(() => {
    if (readingSegmentIds.length === 0 || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const root = scrollContainerRef.current;
    if (!root) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        let shouldSyncReadSegments = false;

        entries.forEach((entry) => {
          const segmentId = entry.target.getAttribute('data-reading-segment-id');
          if (!segmentId) {
            return;
          }

          if (entry.isIntersecting) {
            visibleSegmentIdsRef.current.add(segmentId);
            shouldSyncReadSegments = true;
          } else {
            visibleSegmentIdsRef.current.delete(segmentId);
          }
        });

        if (shouldSyncReadSegments) {
          setReadSegmentIds((current) => {
            const next = new Set(current);
            visibleSegmentIdsRef.current.forEach((segmentId) => {
              next.add(segmentId);
            });
            return next.size === current.length ? current : Array.from(next);
          });
        }

        const nextActiveSegment =
          readingSegmentIds.find((segmentId) => visibleSegmentIdsRef.current.has(segmentId)) ??
          activeSegmentId;

        if (nextActiveSegment) {
          setActiveSegmentId(nextActiveSegment);
        }
      },
      {
        root,
        threshold: 0.45,
        rootMargin: '-8% 0px -45% 0px'
      }
    );

    readingSegmentIds.forEach((segmentId) => {
      const element = document.getElementById(segmentId);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [activeSegmentId, readingSegmentIds, scrollContainerRef]);

  const lessonProgressTotal = readingSegmentIds.length;
  const lessonProgressCount = readSegmentIds.length;
  const activeSegmentIndex = activeSegmentId
    ? readingSegmentIds.indexOf(activeSegmentId)
    : -1;
  const lessonProgressStep =
    activeSegmentIndex >= 0 ? activeSegmentIndex + 1 : Math.min(lessonProgressCount, 1);
  const lessonProgressPercent =
    lessonProgressTotal > 0
      ? Math.round((lessonProgressCount / lessonProgressTotal) * 100)
      : 0;
  const lessonProgressLabel =
    lessonProgressTotal > 0
      ? `${lessonProgressStep} / ${lessonProgressTotal}`
      : 'Ready to read';

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
        className={`mx-auto w-full px-5 py-10 sm:px-6 lg:px-10 ${editingLessonId ? 'max-w-[110rem]' : ''}`}
        style={editingLessonId ? undefined : { maxWidth: 'var(--rm-content-max-width)' }}
      >
        {visibleLesson ? (
          <TheoryLessonIntro
            chapter={activeModule}
            lesson={visibleLesson}
            lessonIndex={Math.max(activeLessonIndex, 0)}
            lessonTotal={orderedLessons.length}
            lessonProgressLabel={lessonProgressLabel}
            lessonProgressPercent={lessonProgressPercent}
            showCheckpointTag={isCheckpointLesson}
            completedLessonCount={completedLessonCount}
            orderedLessonIds={orderedLessons.map((l) => l.id)}
            completedLessonIds={completedLessonIds}
          />
        ) : null}

        {visibleLesson ? (
          <TheorySection
            section={visibleLesson}
            lessonIndex={Math.max(activeLessonIndex, 0)}
            lessonTotal={orderedLessons.length}
            showHeader={false}
            isAdmin={isAdmin}
            isEditing={editingLessonId === visibleLesson.id}
            onEditStart={() => setEditingLessonId(visibleLesson.id)}
            onEditEnd={handleEditEnd}
            editContext={{ topic: docId ?? topic, chapterId: activeModule.id }}
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

        <div className="mt-10 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-t border-light-border pt-5 dark:border-dark-border" style={{ borderColor: 'var(--rm-border)' }}>
          <button
            type="button"
            onClick={handlePrevious}
            disabled={!previousLesson && !previousChapter}
            className={`min-w-0 inline-flex items-center gap-2 text-left text-sm ${
              previousLesson || previousChapter
                ? 'text-text-light-secondary hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:text-text-dark-primary'
                : 'cursor-default text-text-light-disabled dark:text-text-dark-disabled'
            }`}
            style={previousLesson || previousChapter ? { color: 'var(--rm-text-secondary)' } : undefined}
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

          <div className="whitespace-nowrap text-center text-xs tabular-nums text-text-light-tertiary dark:text-text-dark-tertiary" style={{ color: 'var(--rm-text-secondary)' }}>
            {Math.max(activeLessonIndex + 1, 1)} / {orderedLessons.length}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={nextModuleLocked || checkpointPending}
            className={`shrink-0 inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-sm font-medium transition-colors ${
              nextModuleLocked || checkpointPending
                ? 'cursor-not-allowed bg-light-hover text-text-light-disabled dark:bg-dark-hover dark:text-text-dark-disabled'
                : 'bg-on-surface text-surface hover:bg-white'
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
