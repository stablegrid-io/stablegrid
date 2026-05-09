'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Flag } from 'lucide-react';
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
  onMarkLessonRead?: (lessonId: string) => Promise<void> | void;
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
  onMarkLessonRead,
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
  // Local section overrides only matter while an admin is mid-edit; otherwise
  // we read straight from the prop so chapter switches render the correct
  // lessons on the very first frame. The previous state-then-effect-sync
  // pattern caused a one-render flash where `localSections` still held the
  // OLD chapter's sections, making `visibleLesson` fall back to the wrong
  // lesson and intermittently breaking chapter-to-chapter navigation.
  const [localSectionsOverride, setLocalSectionsOverride] = useState<
    typeof activeModule.sections | null
  >(null);
  const localSections = localSectionsOverride ?? activeModule.sections;

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
  // The synthetic checkpoint section sits at the end of `orderedLessons`.
  // It must not be counted toward the read-all-lessons gate that unlocks
  // the checkpoint itself — otherwise the user could never start it.
  const readableLessons = useMemo(
    () => orderedLessons.filter((lesson) => !isModuleCheckpointLesson(lesson.title)),
    [orderedLessons]
  );
  const readableLessonCount = readableLessons.length;
  const completedReadableLessonCount = useMemo(
    () =>
      readableLessons.filter((lesson) => completedLessonIds.includes(lesson.id))
        .length,
    [completedLessonIds, readableLessons]
  );
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

  // Drop any in-flight admin edit when the user switches chapter or lesson.
  useEffect(() => {
    setLocalSectionsOverride(null);
    setEditingLessonId(null);
  }, [activeModule.id, visibleLesson?.id]);

  const handleEditEnd = (updatedSection?: TheorySectionType) => {
    if (updatedSection) {
      setLocalSectionsOverride((prev) => {
        const base = prev ?? activeModule.sections;
        return base.map((s) => (s.id === updatedSection.id ? updatedSection : s));
      });
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

  const isVisibleLessonRead =
    !!visibleLesson && completedLessonIds.includes(visibleLesson.id);

  const handleNext = async () => {
    if (checkpointPending) {
      return;
    }

    // Explicit completion: if the visible lesson hasn't been marked read yet,
    // mark it before advancing. Skip for checkpoint lessons — those are
    // completed via the checkpoint quiz, not a "mark as read" click.
    if (
      visibleLesson &&
      !isCheckpointLesson &&
      !isVisibleLessonRead &&
      onMarkLessonRead
    ) {
      await onMarkLessonRead(visibleLesson.id);
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

  // Compute the concrete remaining work in this module so the lock
  // tooltip can name names instead of saying just "module locked".
  const remainingLessons = orderedLessons.filter(
    (lesson) =>
      !completedLessonIds.includes(lesson.id) &&
      !isModuleCheckpointLesson(lesson.title),
  );
  const hasUnfinishedCheckpoint = hasModuleCheckpoint && !isChapterCompleted;

  // Build the locked-state label dynamically — if lessons are still
  // unfinished, "Module Locked" is the most accurate framing; once the
  // only thing left is the checkpoint, the label changes to point at it.
  const lockedLabel =
    remainingLessons.length > 0
      ? 'Finish Module to Unlock'
      : 'Pass Checkpoint to Unlock';

  const continueDestinationLabel = nextLesson
    ? 'continue'
    : checkpointPending
      ? 'finish checkpoint'
    : nextChapter
      ? isNextModuleUnlocked
        ? 'next module'
        : lockedLabel.toLowerCase()
      : 'finish course';

  const nextLabel =
    !isVisibleLessonRead && !isCheckpointLesson && !checkpointPending
      ? `Mark as read & ${continueDestinationLabel}`
      : nextLesson
        ? 'Next lesson'
        : checkpointPending
          ? 'Finish checkpoint'
        : nextChapter
          ? isNextModuleUnlocked
            ? 'Next module'
            : lockedLabel
          : 'Finish course';

  // Tooltip — names the remaining lessons (≤ 2) or counts them (≥ 3),
  // mentions the multi-choice checkpoint when applicable, and points
  // at the next module by name. Composes whichever pieces are real.
  const lockTooltip = (() => {
    if (!nextChapter) return '';
    const isLocked = !isNextModuleUnlocked || checkpointPending;
    if (!isLocked) return '';

    const steps: string[] = [];
    if (remainingLessons.length > 0) {
      if (remainingLessons.length <= 2) {
        const names = remainingLessons
          .map((l) => `"${normalizeLessonTitle(l.title)}"`)
          .join(' and ');
        steps.push(`finish ${names}`);
      } else {
        steps.push(`finish ${remainingLessons.length} remaining lessons`);
      }
    }
    if (hasUnfinishedCheckpoint) {
      steps.push('pass the multiple-choice checkpoint');
    }

    if (steps.length === 0) {
      return `Complete this module to unlock ${nextChapter.title}.`;
    }
    // Capitalise the first step.
    const head = steps[0].charAt(0).toUpperCase() + steps[0].slice(1);
    const rest = steps.slice(1);
    const phrase = rest.length === 0 ? head : `${head}, then ${rest.join(', then ')}`;
    return `${phrase} to unlock ${nextChapter.title}.`;
  })();
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
        className={`mx-auto w-full px-2 py-6 sm:px-6 sm:py-10 lg:px-10 ${editingLessonId ? 'max-w-[110rem]' : ''}`}
        style={editingLessonId ? undefined : { maxWidth: 'var(--rm-content-max-width)' }}
      >
        {visibleLesson && !isCheckpointLesson ? (
          <TheoryLessonIntro
            chapter={activeModule}
            lesson={visibleLesson}
            lessonIndex={Math.max(activeLessonIndex, 0)}
            lessonTotal={readableLessonCount}
            lessonProgressLabel={lessonProgressLabel}
            lessonProgressPercent={lessonProgressPercent}
            showCheckpointTag={isCheckpointLesson}
            completedLessonCount={completedLessonCount}
            orderedLessonIds={orderedLessons.map((l) => l.id)}
            completedLessonIds={completedLessonIds}
          />
        ) : null}

        {visibleLesson && !isCheckpointLesson ? (
          <TheorySection
            section={visibleLesson}
            lessonIndex={Math.max(activeLessonIndex, 0)}
            lessonTotal={readableLessonCount}
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
            canStart={completedReadableLessonCount >= readableLessonCount}
            isProgressLoaded={isProgressLoaded}
            lessonsReadCount={completedReadableLessonCount}
            lessonCount={readableLessonCount}
            isCompleted={isChapterCompleted}
            isCompleting={completionActionPending}
            onCompleteModule={onCompleteModule}
          />
        ) : null}

        {checkpointPending && (
          <div
            className="mt-10 flex items-start gap-3 border border-primary/30 bg-primary/[0.04] px-5 py-3"
            role="note"
          >
            <Flag className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" strokeWidth={1.75} aria-hidden />
            <p className="font-data-mono text-[11px] uppercase tracking-[0.16em] text-primary">
              Complete the checkpoint questions below to unlock the next module.
            </p>
          </div>
        )}

        <div className="mt-10 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-t border-surface-dim pt-5" style={{ borderColor: 'var(--rm-border)' }}>
          <button
            type="button"
            onClick={handlePrevious}
            disabled={!previousLesson && !previousChapter}
            className={`min-w-0 inline-flex items-center gap-2 text-left text-sm ${
              previousLesson || previousChapter
                ? 'text-on-surface-variant hover:text-on-surface  '
                : 'cursor-default text-on-surface-variant '
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

          <div
            className="whitespace-nowrap text-center font-data-mono text-[11px] uppercase tracking-[0.18em] tabular-nums text-on-surface-variant"
            style={{ color: 'var(--rm-text-secondary)' }}
          >
            {isCheckpointLesson
              ? 'Checkpoint'
              : `${Math.max(activeLessonIndex + 1, 1)} / ${readableLessonCount}`}
          </div>

          {/* Disabled buttons don't reliably fire `title` tooltips in
              Firefox/Safari, so wrap in a span that owns the tooltip
              attribute. The wrapper is the hover target; the button
              inside stays semantically disabled for keyboard / a11y. */}
          <span
            className="shrink-0 inline-flex"
            title={(nextModuleLocked || checkpointPending) ? lockTooltip : undefined}
          >
            <button
              type="button"
              onClick={() => {
                void handleNext();
              }}
              disabled={nextModuleLocked || checkpointPending}
              aria-describedby={
                (nextModuleLocked || checkpointPending) && lockTooltip ? 'next-module-lock-hint' : undefined
              }
              className={`group shrink-0 inline-flex items-center gap-2 pb-1 text-[15px] font-semibold border-b transition-colors ${
                nextModuleLocked || checkpointPending
                  ? 'cursor-not-allowed text-on-surface-variant/50 border-on-surface-variant/15'
                  : 'text-primary border-primary hover:text-primary-dim hover:border-primary-dim'
              }`}
            >
              <span className="hidden sm:inline">{nextLabel}</span>
              <span className="sm:hidden">Continue</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            {(nextModuleLocked || checkpointPending) && lockTooltip && (
              <span id="next-module-lock-hint" className="sr-only">{lockTooltip}</span>
            )}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
