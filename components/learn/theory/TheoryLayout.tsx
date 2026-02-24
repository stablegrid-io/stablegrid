'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, LockOpen, Menu, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { TheoryChapter, TheoryDoc } from '@/types/theory';
import type { Topic } from '@/types/progress';
import { useReadingSession } from '@/lib/hooks/useReadingSession';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { formatUnitsAsKwh, getChapterCompletionRewardUnits } from '@/lib/energy';
import { TheorySidebar } from '@/components/learn/theory/TheorySidebar';
import { TheoryContent } from '@/components/learn/theory/TheoryContent';
import { sortModulesByOrder } from '@/lib/learn/freezeTheoryDoc';

interface TheoryLayoutProps {
  doc: TheoryDoc;
}

interface ChapterCompletionBurstProps {
  visible: boolean;
  burstKey: number;
  rewardLabel: string;
  unlockedModuleTitle: string | null;
}

interface ResumeTarget {
  chapterId: string;
  lessonId: string | null;
}

interface ModuleProgressApiRow {
  module_id: string;
  module_order: number;
  is_unlocked: boolean;
  is_completed: boolean;
  current_lesson_id: string | null;
  last_visited_route: string | null;
  completed_at: string | null;
  updated_at: string;
}

interface ModuleProgressApiPayload {
  data?: ModuleProgressApiRow[];
  error?: string;
  storage?: 'module_progress' | 'reading_sessions_fallback';
  warning?: string;
}

const parseLessonFromRoute = (route: string | null) => {
  if (!route || !route.includes('?')) {
    return null;
  }
  const [, query = ''] = route.split('?');
  const params = new URLSearchParams(query);
  const lessonId = params.get('lesson');
  return lessonId && lessonId.trim().length > 0 ? lessonId : null;
};

const BURST_PARTICLES: Array<{ x: number; y: number; delay: number }> = [
  { x: 0, y: -44, delay: 0 },
  { x: 34, y: -32, delay: 0.02 },
  { x: 46, y: -2, delay: 0.04 },
  { x: 34, y: 30, delay: 0.06 },
  { x: 0, y: 44, delay: 0.08 },
  { x: -34, y: 30, delay: 0.1 },
  { x: -46, y: -2, delay: 0.12 },
  { x: -34, y: -32, delay: 0.14 }
];

const ChapterCompletionBurst = ({
  visible,
  burstKey,
  rewardLabel,
  unlockedModuleTitle
}: ChapterCompletionBurstProps) => (
  <AnimatePresence>
    {visible ? (
      <motion.div
        key={burstKey}
        initial={{ opacity: 0, y: -18, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -14, scale: 0.84 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="pointer-events-none fixed right-3 top-20 z-[90] sm:right-6"
      >
        <div className="relative flex w-[18rem] items-center justify-center overflow-visible rounded-2xl border border-brand-300/60 bg-gradient-to-b from-brand-50 to-teal-50 px-4 py-5 shadow-xl dark:border-brand-700/40 dark:from-[#0f1c2e] dark:to-[#0d1b1d] sm:w-[20rem]">
          {[0, 1, 2].map((ring) => (
            <motion.span
              key={`chapter-ring-${burstKey}-${ring}`}
              className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-success-400/60"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.8 + ring * 0.38], opacity: [0.45, 0] }}
              transition={{ duration: 0.85, delay: ring * 0.1, ease: 'easeOut' }}
            />
          ))}

          {BURST_PARTICLES.map((particle, index) => (
            <motion.span
              key={`chapter-spark-${burstKey}-${index}`}
              className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-success-400"
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.9 }}
              animate={{
                x: particle.x,
                y: particle.y,
                opacity: [0.95, 0],
                scale: [1.2, 0.28]
              }}
              transition={{ duration: 0.52, delay: particle.delay, ease: 'easeOut' }}
            />
          ))}

          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center"
            animate={{
              rotate: [0, -8, 6, 0],
              x: [0, -5, 9, 0],
              y: [0, 1, -3, 0],
              scale: [1, 1.03, 1.08, 1]
            }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          >
            <div className="w-full max-w-[16rem] rounded-xl border border-emerald-300/70 bg-emerald-50/90 px-3 py-3 text-center dark:border-emerald-700/50 dark:bg-emerald-900/30">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                Module Completed
              </div>
              <div className="mt-2 flex items-center justify-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />+{rewardLabel}
              </div>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/60 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/50 dark:text-emerald-200">
                <LockOpen className="h-3 w-3" />
                {unlockedModuleTitle
                  ? `Unlocked: ${unlockedModuleTitle}`
                  : 'Course Complete'}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

export const TheoryLayout = ({ doc }: TheoryLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedChapterId = searchParams.get('chapter');
  const requestedLessonId = searchParams.get('lesson');

  const modules = useMemo(
    () => sortModulesByOrder(doc.modules ?? doc.chapters),
    [doc.chapters, doc.modules]
  );
  const initialChapter = modules[0] ?? doc.chapters[0];

  if (!initialChapter) {
    throw new Error(`Theory doc "${doc.topic}" has no modules.`);
  }

  const [activeChapter, setActiveChapter] = useState<TheoryChapter>(initialChapter);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(
    initialChapter.sections[0]?.id ?? null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completedChapterIds, setCompletedChapterIds] = useState<Set<string>>(new Set());
  const [unlockedChapterIds, setUnlockedChapterIds] = useState<Set<string>>(new Set());
  const [completionsLoaded, setCompletionsLoaded] = useState(false);
  const [resumeTarget, setResumeTarget] = useState<ResumeTarget | null | undefined>(
    undefined
  );
  const [completionActionPending, setCompletionActionPending] = useState(false);
  const [completionSyncStatus, setCompletionSyncStatus] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);
  const [pulseVisible, setPulseVisible] = useState(false);
  const [completionBurstKey, setCompletionBurstKey] = useState(0);
  const [recentlyUnlockedModuleTitle, setRecentlyUnlockedModuleTitle] = useState<
    string | null
  >(null);
  const lastTouchedRouteRef = useRef<string>('');
  const addXP = useProgressStore((state) => state.addXP);
  const chapterCompletionRewardUnits = getChapterCompletionRewardUnits(
    activeChapter.durationMinutes ?? activeChapter.totalMinutes
  );
  const chapterCompletionRewardLabel = formatUnitsAsKwh(chapterCompletionRewardUnits, 2);
  const applyModuleProgressRows = useCallback((rows: ModuleProgressApiRow[]) => {
    setCompletedChapterIds(
      new Set(
        rows
          .filter((row) => row.is_completed)
          .map((row) => row.module_id)
      )
    );
    setUnlockedChapterIds(
      new Set(
        rows
          .filter((row) => row.is_unlocked)
          .map((row) => row.module_id)
      )
    );
    setCompletionsLoaded(true);
  }, []);
  const unlockedModuleIds = useMemo(() => {
    if (!completionsLoaded) {
      return new Set(modules.map((module) => module.id));
    }
    return new Set(unlockedChapterIds);
  }, [completionsLoaded, modules, unlockedChapterIds]);
  const activeModuleIndex = modules.findIndex((module) => module.id === activeChapter.id);
  const upcomingModule =
    activeModuleIndex >= 0 && activeModuleIndex < modules.length - 1
      ? modules[activeModuleIndex + 1]
      : null;
  const isUpcomingModuleUnlocked = upcomingModule
    ? unlockedModuleIds.has(upcomingModule.id)
    : true;
  const buildLessonRoute = useCallback(
    (chapterId: string, lessonId: string | null) => {
      const params = new URLSearchParams();
      params.set('chapter', chapterId);
      if (lessonId) {
        params.set('lesson', lessonId);
      }
      return `${pathname}?${params.toString()}`;
    },
    [pathname]
  );
  const persistedRoute = useMemo(() => {
    return buildLessonRoute(activeChapter.id, activeLessonId);
  }, [activeChapter.id, activeLessonId, buildLessonRoute]);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const handleChapterComplete = useCallback(() => {
    setCompletedChapterIds((prev) => new Set([...prev, activeChapter.id]));
    const currentIndex = modules.findIndex((module) => module.id === activeChapter.id);
    const nextModule =
      currentIndex >= 0 && currentIndex < modules.length - 1
        ? modules[currentIndex + 1]
        : null;
    if (nextModule) {
      setUnlockedChapterIds((prev) => new Set([...prev, nextModule.id]));
    }
    setRecentlyUnlockedModuleTitle(nextModule?.title ?? null);
    setPulseVisible(true);
    setCompletionBurstKey((value) => value + 1);
  }, [activeChapter.id, modules]);
  const handleChapterIncomplete = useCallback(() => {
    setCompletedChapterIds((prev) => {
      const next = new Set(prev);
      next.delete(activeChapter.id);
      return next;
    });
    setRecentlyUnlockedModuleTitle(null);
  }, [activeChapter.id]);

  const {
    isCompleted,
    activeSeconds,
    completedLessonIds,
    markChapterComplete,
    markChapterIncomplete
  } = useReadingSession({
    topic: doc.topic as Topic,
    chapter: activeChapter,
    currentLessonId: activeLessonId,
    lastVisitedRoute: persistedRoute,
    onChapterComplete: handleChapterComplete,
    onChapterIncomplete: handleChapterIncomplete,
    onFirstCompletionEnergyUnits: (units) =>
      addXP(units, {
        source: 'chapter-complete',
        topic: doc.topic as Topic,
        label: `Completed ${activeChapter.title}`
      })
  });

  useEffect(() => {
    lastTouchedRouteRef.current = '';
  }, [doc.topic]);

  useEffect(() => {
    let mounted = true;
    setCompletionsLoaded(false);
    setResumeTarget(undefined);

    const loadModuleProgress = async () => {
      try {
        const response = await fetch(
          `/api/learn/module-progress?topic=${encodeURIComponent(doc.topic)}`,
          {
            method: 'GET',
            cache: 'no-store'
          }
        );

        if (!mounted) return;

        if (!response.ok) {
          setCompletedChapterIds(new Set());
          setUnlockedChapterIds(new Set(modules.map((module) => module.id)));
          setCompletionsLoaded(true);
          setResumeTarget(null);
          return;
        }

        const payload = (await response.json()) as ModuleProgressApiPayload;
        const rows = Array.isArray(payload.data) ? payload.data : [];
        applyModuleProgressRows(rows);

        if (requestedChapterId) {
          setResumeTarget(null);
          return;
        }

        const candidateRow = [...rows]
          .sort((left, right) => {
            const leftTs = new Date(left.updated_at ?? 0).getTime();
            const rightTs = new Date(right.updated_at ?? 0).getTime();
            return rightTs - leftTs;
          })
          .find(
            (row) =>
              row.last_visited_route ||
              row.current_lesson_id ||
              row.is_completed
          );

        if (!candidateRow) {
          setResumeTarget(null);
          return;
        }

        const targetChapter = modules.find(
          (module) => module.id === candidateRow.module_id
        );
        if (!targetChapter || !candidateRow.is_unlocked) {
          setResumeTarget(null);
          return;
        }

        const lessonFromRoute = parseLessonFromRoute(candidateRow.last_visited_route);
        const lessonFromProgress =
          typeof candidateRow.current_lesson_id === 'string'
            ? candidateRow.current_lesson_id
            : null;
        const lessonId = targetChapter.sections.some(
          (section) => section.id === lessonFromProgress
        )
          ? lessonFromProgress
          : targetChapter.sections.some((section) => section.id === lessonFromRoute)
            ? lessonFromRoute
            : null;

        setResumeTarget({
          chapterId: targetChapter.id,
          lessonId
        });
      } catch (error) {
        if (!mounted) return;
        console.warn('Failed to load module progress:', error);
        setCompletedChapterIds(new Set());
        setUnlockedChapterIds(new Set(modules.map((module) => module.id)));
        setCompletionsLoaded(true);
        setResumeTarget(null);
      }
    };

    void loadModuleProgress();

    return () => {
      mounted = false;
    };
  }, [applyModuleProgressRows, doc.topic, modules, requestedChapterId]);

  useEffect(() => {
    if (!pulseVisible) return;
    const timeout = window.setTimeout(() => setPulseVisible(false), 2600);
    return () => window.clearTimeout(timeout);
  }, [pulseVisible]);

  const updateQueryRoute = useCallback(
    (chapterId: string, lessonId: string | null) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set('chapter', chapterId);
      if (lessonId) {
        nextParams.set('lesson', lessonId);
      } else {
        nextParams.delete('lesson');
      }

      const nextQuery = nextParams.toString();
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) {
        return;
      }

      const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(nextHref, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const resolveLessonId = (
      chapter: TheoryChapter,
      preferredLessonId: string | null
    ) => {
      if (
        preferredLessonId &&
        chapter.sections.some((section) => section.id === preferredLessonId)
      ) {
        return preferredLessonId;
      }
      return chapter.sections[0]?.id ?? null;
    };

    const fallbackChapter = modules[0];
    const firstUnlockedChapter =
      modules.find((module) => unlockedModuleIds.has(module.id)) ?? fallbackChapter;

    if (!fallbackChapter || !firstUnlockedChapter) {
      return;
    }

    if (!requestedChapterId) {
      if (resumeTarget === undefined) {
        return;
      }

      const resumedChapter = resumeTarget?.chapterId
        ? modules.find((module) => module.id === resumeTarget.chapterId)
        : null;
      const targetChapter =
        resumedChapter && unlockedModuleIds.has(resumedChapter.id)
          ? resumedChapter
          : firstUnlockedChapter;
      const targetLessonId = resolveLessonId(
        targetChapter,
        resumeTarget?.lessonId ?? requestedLessonId
      );

      setActiveChapter(targetChapter);
      setActiveLessonId(targetLessonId);
      updateQueryRoute(targetChapter.id, targetLessonId);
      return;
    }

    const targetChapter = modules.find((chapter) => chapter.id === requestedChapterId);
    if (!targetChapter || !unlockedModuleIds.has(targetChapter.id)) {
      setActiveChapter(firstUnlockedChapter);
      const fallbackLessonId = resolveLessonId(firstUnlockedChapter, requestedLessonId);
      setActiveLessonId(fallbackLessonId);
      updateQueryRoute(firstUnlockedChapter.id, fallbackLessonId);
      return;
    }

    setActiveChapter(targetChapter);
    const resolvedLessonId = resolveLessonId(targetChapter, requestedLessonId);
    setActiveLessonId(resolvedLessonId);
    updateQueryRoute(targetChapter.id, resolvedLessonId);
  }, [
    modules,
    requestedChapterId,
    requestedLessonId,
    resumeTarget,
    unlockedModuleIds,
    updateQueryRoute
  ]);

  const handleSelectChapter = (chapter: TheoryChapter) => {
    const targetChapter = modules.find((module) => module.id === chapter.id) ?? chapter;
    if (!unlockedModuleIds.has(targetChapter.id)) {
      return;
    }
    const firstLessonId = targetChapter.sections[0]?.id ?? null;
    setActiveChapter(targetChapter);
    setActiveLessonId(firstLessonId);
    updateQueryRoute(targetChapter.id, firstLessonId);
    setSidebarOpen(false);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLesson = (lessonId: string) => {
    if (!activeChapter.sections.some((section) => section.id === lessonId)) {
      return;
    }
    setActiveLessonId(lessonId);
    updateQueryRoute(activeChapter.id, lessonId);
    setSidebarOpen(false);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const syncModuleProgress = useCallback(
    async ({
      action,
      moduleId,
      currentLessonId,
      lastVisitedRoute
    }: {
      action: 'ensure' | 'complete' | 'incomplete' | 'touch';
      moduleId?: string;
      currentLessonId?: string | null;
      lastVisitedRoute?: string | null;
    }) => {
      const response = await fetch('/api/learn/module-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic: doc.topic,
          action,
          moduleId,
          currentLessonId,
          lastVisitedRoute
        })
      });

      const payload = (await response.json().catch(() => ({}))) as ModuleProgressApiPayload;

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to sync module progress.');
      }

      const rows = Array.isArray(payload.data) ? payload.data : [];
      applyModuleProgressRows(rows);
      return payload;
    },
    [applyModuleProgressRows, doc.topic]
  );

  useEffect(() => {
    if (!completionsLoaded) {
      return;
    }

    if (!activeChapter.id) {
      return;
    }

    const touchKey = `${doc.topic}|${activeChapter.id}|${activeLessonId ?? ''}|${persistedRoute}`;
    if (lastTouchedRouteRef.current === touchKey) {
      return;
    }
    lastTouchedRouteRef.current = touchKey;

    void syncModuleProgress({
      action: 'touch',
      moduleId: activeChapter.id,
      currentLessonId: activeLessonId,
      lastVisitedRoute: persistedRoute
    }).catch((error) => {
      console.warn('Failed to persist module route:', error);
    });
  }, [
    activeChapter.id,
    activeLessonId,
    completionsLoaded,
    doc.topic,
    persistedRoute,
    syncModuleProgress
  ]);

  const handleCompleteCourse = () => {
    router.push(`/learn/${doc.topic}/theory`);
  };

  const handleCompletionAction = async () => {
    if (completionActionPending) return;
    setCompletionActionPending(true);
    setCompletionSyncStatus(null);
    try {
      if (isCompleted) {
        await markChapterIncomplete();
        const syncResult = await syncModuleProgress({
          action: 'incomplete',
          moduleId: activeChapter.id
        });
        setCompletionSyncStatus({
          type: syncResult.warning ? 'warning' : 'success',
          message: syncResult.warning ?? 'Completion state saved.'
        });
      } else {
        if (!unlockedModuleIds.has(activeChapter.id)) {
          throw new Error('Cannot complete a locked module.');
        }
        await markChapterComplete();
        const syncResult = await syncModuleProgress({
          action: 'complete',
          moduleId: activeChapter.id
        });
        setCompletionSyncStatus({
          type: syncResult.warning ? 'warning' : 'success',
          message: syncResult.warning ?? 'Module completion saved.'
        });
      }
    } catch (error) {
      console.warn('Failed to sync completion state:', error);
      const fallbackMessage =
        error instanceof Error && /unauthorized/i.test(error.message)
          ? 'Sign in to save module completion and unlock progress.'
          : error instanceof Error
            ? error.message
            : 'Failed to save completion state.';
      setCompletionSyncStatus({
        type: 'error',
        message: fallbackMessage
      });
    } finally {
      setCompletionActionPending(false);
    }
  };

  const readingMinutes = Math.floor(activeSeconds / 60);

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden">
      <ChapterCompletionBurst
        visible={pulseVisible}
        burstKey={completionBurstKey}
        rewardLabel={chapterCompletionRewardLabel}
        unlockedModuleTitle={recentlyUnlockedModuleTitle}
      />

      {isCompleted ? (
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-4 py-2 dark:border-emerald-800 dark:bg-emerald-900/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Module completed
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <Clock className="h-3 w-3" />
              {readingMinutes}m active reading
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">
              +{chapterCompletionRewardLabel} earned
            </span>
            {upcomingModule && isUpcomingModuleUnlocked ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                <LockOpen className="h-3 w-3" />
                {upcomingModule.title} unlocked
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-light-border bg-light-bg px-4 dark:border-dark-border dark:bg-dark-bg">
        <button
          type="button"
          onClick={() => setSidebarOpen((value) => !value)}
          className="btn btn-ghost h-9 w-9 p-0 lg:hidden"
          aria-label="Toggle module navigation"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="truncate text-sm font-medium">{doc.title}</div>
        <div className="ml-auto flex items-center gap-3 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          <span>
            M. {activeChapter.order ?? activeChapter.number} / {modules.length}
          </span>
          <span className="hidden sm:inline">
            ~{activeChapter.durationMinutes ?? activeChapter.totalMinutes} min
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={`absolute inset-y-0 left-0 z-50 w-80 border-r border-light-border bg-light-bg transition-transform duration-300 dark:border-dark-border dark:bg-dark-bg lg:relative lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <TheorySidebar
            doc={doc}
            activeChapterId={activeChapter.id}
            activeLessonId={activeLessonId}
            completedLessonIds={completedLessonIds}
            onSelectLesson={handleSelectLesson}
          />
        </aside>

        {sidebarOpen ? (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            aria-label="Close module navigation"
          />
        ) : null}

        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto">
          <TheoryContent
            chapter={activeChapter}
            allChapters={modules}
            activeLessonId={activeLessonId}
            onNavigate={handleSelectChapter}
            onSelectLesson={handleSelectLesson}
            onCompleteCourse={handleCompleteCourse}
            isCompleted={isCompleted}
            isNextModuleUnlocked={isUpcomingModuleUnlocked}
            onCompletionAction={handleCompletionAction}
            completionActionPending={completionActionPending}
            completionRewardLabel={chapterCompletionRewardLabel}
            completionSyncStatus={completionSyncStatus}
          />
        </div>
      </div>
    </div>
  );
};
