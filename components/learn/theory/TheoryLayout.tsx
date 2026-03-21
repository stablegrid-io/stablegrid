'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Clock3, Menu, X } from 'lucide-react';
import type { TheoryChapter, TheoryDoc } from '@/types/theory';
import type { Topic } from '@/types/progress';
import type { PracticeTopic } from '@/lib/types';
import {
  trackProductEvent,
  trackProductEventOnce
} from '@/lib/analytics/productAnalytics';
import { createPayloadRequestKey } from '@/lib/api/requestKeys';
import { useReadingSession } from '@/lib/hooks/useReadingSession';
import { useTheorySessionTimer } from '@/lib/hooks/useTheorySessionTimer';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import {
  resolveTheorySessionMethodConfigs,
  useTheorySessionPreferencesStore
} from '@/lib/stores/useTheorySessionPreferencesStore';
import { TheorySidebar } from '@/components/learn/theory/TheorySidebar';
import { TheoryContent } from '@/components/learn/theory/TheoryContent';
import { TheorySessionPicker } from '@/components/learn/theory/TheorySessionPicker';
import { TheorySessionTopbar } from '@/components/learn/theory/TheorySessionTopbar';
import { TheoryBreakOverlay } from '@/components/learn/theory/TheoryBreakOverlay';
import { TheorySessionSummary } from '@/components/learn/theory/TheorySessionSummary';
import {
  getModuleCheckpointQuestions,
  isModuleCheckpointLesson
} from '@/lib/learn/moduleCheckpoints';
import {
  sortLessonsByOrder,
  sortModulesByOrder
} from '@/lib/learn/freezeTheoryDoc';
import { useAdminStatus } from '@/lib/hooks/useAdminStatus';

const SessionExitModal = ({
  onContinue,
  onEndSession
}: {
  onContinue: () => void;
  onEndSession: () => void;
}) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="w-full max-w-sm border-2 border-primary/20 bg-surface-container p-6">
      {/* L-bracket corners */}
      <div className="relative">
        <div className="absolute -top-6 -left-6 w-4 h-4 border-t-2 border-l-2 border-primary/40" />
        <div className="absolute -top-6 -right-6 w-4 h-4 border-t-2 border-r-2 border-primary/40" />
        <div className="absolute -bottom-6 -left-6 w-4 h-4 border-b-2 border-l-2 border-primary/40" />
        <div className="absolute -bottom-6 -right-6 w-4 h-4 border-b-2 border-r-2 border-primary/40" />

        <h3 className="font-headline font-bold text-lg text-on-surface uppercase tracking-wider mb-2">
          Session Active
        </h3>
        <p className="font-mono text-[11px] text-on-surface-variant leading-relaxed mb-6">
          You have an active reading session. Would you like to end the session or continue reading?
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onEndSession}
            className="flex-1 border border-error/30 bg-error/10 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-error transition-colors hover:bg-error/20"
          >
            End Session
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 bg-primary text-on-primary py-2.5 font-mono text-xs font-bold uppercase tracking-widest transition-colors hover:bg-primary-dim"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  </div>
);

interface TheoryLayoutProps {
  doc: TheoryDoc;
}

const ModuleProgressRail = ({
  orderedLessons,
  completedLessonIds,
  activeLessonId
}: {
  orderedLessons: { id: string }[];
  completedLessonIds: string[];
  activeLessonId: string | null;
}) => {
  const completedSet = useMemo(() => new Set(completedLessonIds), [completedLessonIds]);
  const activeIndex = orderedLessons.findIndex((l) => l.id === activeLessonId);
  const isActiveLessonCompleted = activeLessonId ? completedSet.has(activeLessonId) : true;

  const [elapsed, setElapsed] = useState(0);
  const lessonIdRef = useRef(activeLessonId);

  useEffect(() => {
    if (lessonIdRef.current !== activeLessonId) {
      lessonIdRef.current = activeLessonId;
      setElapsed(0);
    }
  }, [activeLessonId]);

  useEffect(() => {
    if (isActiveLessonCompleted) return;
    const interval = setInterval(() => setElapsed((s) => Math.min(s + 1, 30)), 1000);
    return () => clearInterval(interval);
  }, [isActiveLessonCompleted, activeLessonId]);

  const activeProgress = isActiveLessonCompleted ? 100 : Math.round((elapsed / 30) * 100);

  if (orderedLessons.length === 0) return null;

  return (
    <div className="hidden lg:flex fixed right-4 top-1/2 -translate-y-1/2 z-30 flex-col items-center">
      {/* Battery cap */}
      <div className="w-5 h-2 bg-primary/30 mb-0.5" />
      {/* Battery body */}
      <div className="border-2 border-primary/20 p-1.5 flex flex-col-reverse gap-1 bg-surface-container-lowest/80 backdrop-blur-sm">
        {orderedLessons.map((l, i) => {
          const isCompleted = completedSet.has(l.id);
          const isActive = i === activeIndex && !isActiveLessonCompleted;

          return (
            <div
              key={l.id}
              className={`w-5 h-5 relative overflow-hidden transition-all duration-500 ${
                isCompleted
                  ? 'bg-primary/80'
                  : 'bg-surface-container-highest/20 border border-primary/10'
              }`}
            >
              {isActive && (
                <div
                  className="absolute inset-x-0 bottom-0 bg-primary/70 transition-[height] duration-1000 ease-linear"
                  style={{ height: `${activeProgress}%` }}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* Label */}
      <span className="font-mono text-[8px] text-primary/50 mt-2 font-bold">
        {completedLessonIds.length}/{orderedLessons.length}
      </span>
    </div>
  );
};

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

type ProgressIssueKind = 'load' | 'sync';

interface ProgressIssueState {
  kind: ProgressIssueKind;
  message: string;
}

const SESSION_PICKER_DISMISSED_STORAGE_PREFIX = 'theory-session-picker-dismissed';

const parseLessonFromRoute = (route: string | null) => {
  if (!route || !route.includes('?')) {
    return null;
  }
  const [, query = ''] = route.split('?');
  const params = new URLSearchParams(query);
  const lessonId = params.get('lesson');
  return lessonId && lessonId.trim().length > 0 ? lessonId : null;
};

const parseTheoryTrackSlugFromPathname = (pathname: string) => {
  const match = pathname.match(/^\/learn\/[^/]+\/theory\/([^/?#]+)/);
  if (!match) {
    return null;
  }

  const slug = match[1]?.trim().toLowerCase();
  if (!slug || slug === 'all') {
    return null;
  }

  return slug;
};

export const TheoryLayout = ({ doc }: TheoryLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedChapterId = searchParams.get('chapter');
  const requestedLessonId = searchParams.get('lesson');
  const { isAdmin } = useAdminStatus();
  const activeTrackSlug = useMemo(
    () => parseTheoryTrackSlugFromPathname(pathname),
    [pathname]
  );

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
  const [routeReady, setRouteReady] = useState(false);
  const [completionActionPending, setCompletionActionPending] = useState(false);
  const [sessionPickerVisible, setSessionPickerVisible] = useState(false);
  const [progressIssue, setProgressIssue] = useState<ProgressIssueState | null>(null);
  const [progressReloadToken, setProgressReloadToken] = useState(0);
  const lastTouchedRouteRef = useRef<string>('');
  const lastTrackedChapterStartRef = useRef<string | null>(null);
  const sessionPickerInitializedRef = useRef(false);
  const addXP = useProgressStore((state) => state.addXP);
  const { methodConfigs: sessionMethodConfigs, hasHydrated: sessionDefaultsHydrated } =
    useTheorySessionPreferencesStore((state) => ({
      methodConfigs: state.methodConfigs,
      hasHydrated: state.hasHydrated
    }));
  const resolvedSessionMethodConfigs = useMemo(
    () => resolveTheorySessionMethodConfigs(sessionMethodConfigs),
    [sessionMethodConfigs]
  );
  const theorySession = useTheorySessionTimer('global');
  const startTheorySession = theorySession.start;
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const pendingNavigationRef = useRef<string | null>(null);

  // Browser beforeunload guard
  useEffect(() => {
    if (!theorySession.hasActiveSession) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [theorySession.hasActiveSession]);

  // Intercept browser back/popstate
  useEffect(() => {
    if (!theorySession.hasActiveSession) return;
    const handler = () => {
      window.history.pushState(null, '', window.location.href);
      setShowExitConfirm(true);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [theorySession.hasActiveSession]);

  // Intercept all client-side link clicks when session is active
  useEffect(() => {
    if (!theorySession.hasActiveSession) return;
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript')) return;
      // Allow navigation within the current theory page (lesson switching)
      if (href.includes(pathname ?? '')) return;
      // Allow external links
      if (href.startsWith('http')) return;
      e.preventDefault();
      e.stopPropagation();
      pendingNavigationRef.current = href;
      setShowExitConfirm(true);
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [theorySession.hasActiveSession, pathname]);

  const retryProgressSync = useCallback(() => {
    setProgressIssue(null);
    setProgressReloadToken((value) => value + 1);
  }, []);
  const applyModuleProgressRows = useCallback((rows: ModuleProgressApiRow[]) => {
    setCompletedChapterIds(
      new Set(rows.filter((row) => row.is_completed).map((row) => row.module_id))
    );
    setUnlockedChapterIds(
      new Set(rows.filter((row) => row.is_unlocked).map((row) => row.module_id))
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
  const orderedActiveLessons = useMemo(
    () => sortLessonsByOrder(activeChapter.sections),
    [activeChapter.sections]
  );
  const hasActiveModuleCheckpoint = useMemo(() => {
    const hasCheckpointLesson = activeChapter.sections.some((section) =>
      isModuleCheckpointLesson(section.title)
    );

    if (!hasCheckpointLesson) {
      return false;
    }

    return getModuleCheckpointQuestions(doc.topic, activeChapter.number).length > 0;
  }, [activeChapter.number, activeChapter.sections, doc.topic]);
  const activeLessonIndex = orderedActiveLessons.findIndex(
    (section) => section.id === activeLessonId
  );
  const activeLesson =
    activeLessonIndex >= 0
      ? orderedActiveLessons[activeLessonIndex]
      : orderedActiveLessons[0];
  const activeLessonNumber = Math.max(activeLessonIndex + 1, 1);
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
  const sessionPickerDismissedStorageKey = useMemo(
    () => `${SESSION_PICKER_DISMISSED_STORAGE_PREFIX}:${pathname}`,
    [pathname]
  );
  const hasDismissedSessionPicker = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      return (
        window.sessionStorage.getItem(sessionPickerDismissedStorageKey) === '1'
      );
    } catch {
      return false;
    }
  }, [sessionPickerDismissedStorageKey]);
  const markSessionPickerDismissed = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.sessionStorage.setItem(sessionPickerDismissedStorageKey, '1');
    } catch {
      // Ignore storage failures and fall back to the component-local guard.
    }
  }, [sessionPickerDismissedStorageKey]);
  const persistedRoute = useMemo(() => {
    return buildLessonRoute(activeChapter.id, activeLessonId);
  }, [activeChapter.id, activeLessonId, buildLessonRoute]);
  const activeLessonDurationMinutes =
    activeLesson?.durationMinutes ??
    activeLesson?.estimatedMinutes ??
    activeChapter.durationMinutes ??
    activeChapter.totalMinutes;
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
  }, [activeChapter.id, modules]);
  const handleChapterIncomplete = useCallback(() => {
    setCompletedChapterIds((prev) => {
      const next = new Set(prev);
      next.delete(activeChapter.id);
      return next;
    });
  }, [activeChapter.id]);
  const completionRewardTopic =
    doc.topic === 'pyspark' || doc.topic === 'fabric'
      ? (doc.topic as PracticeTopic)
      : undefined;

  const { isCompleted, completedLessonIds, isHydrated, markChapterComplete } =
    useReadingSession({
      topic: doc.topic as Topic,
      chapter: activeChapter,
      currentLessonId: activeLessonId,
      lastVisitedRoute: persistedRoute,
      onChapterComplete: handleChapterComplete,
      onChapterIncomplete: handleChapterIncomplete,
      onFirstCompletionEnergyUnits: (units) =>
        addXP(units, {
          source: 'chapter-complete',
          ...(completionRewardTopic ? { topic: completionRewardTopic } : {}),
          label: `Completed ${activeChapter.title}`
        })
    });

  useEffect(() => {
    lastTouchedRouteRef.current = '';
    sessionPickerInitializedRef.current = false;
    setRouteReady(false);
    setSessionPickerVisible(false);
    setProgressIssue(null);
  }, [doc.topic]);

  useEffect(() => {
    let mounted = true;
    setCompletionsLoaded(false);
    setResumeTarget(undefined);
    setRouteReady(false);

    const loadModuleProgress = async () => {
      try {
        const response = await fetch(
          `/api/learn/module-progress?topic=${encodeURIComponent(doc.topic)}${
            activeTrackSlug ? `&track=${encodeURIComponent(activeTrackSlug)}` : ''
          }`,
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
          setProgressIssue({
            kind: 'load',
            message:
              'Progress service is temporarily unavailable. You can keep reading and retry sync.'
          });
          return;
        }

        const payload = (await response.json()) as ModuleProgressApiPayload;
        const rows = Array.isArray(payload.data) ? payload.data : [];
        applyModuleProgressRows(rows);
        setProgressIssue((current) => (current?.kind === 'sync' ? null : current));

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
            (row) => row.last_visited_route || row.current_lesson_id || row.is_completed
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
        setProgressIssue({
          kind: 'load',
          message:
            'Progress sync failed to load. You can keep reading and retry when ready.'
        });
      }
    };

    void loadModuleProgress();

    return () => {
      mounted = false;
    };
  }, [
    activeTrackSlug,
    applyModuleProgressRows,
    doc.topic,
    modules,
    progressReloadToken,
    requestedChapterId
  ]);

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
      setRouteReady(true);
      return;
    }

    const targetChapter = modules.find((chapter) => chapter.id === requestedChapterId);
    if (!targetChapter || !unlockedModuleIds.has(targetChapter.id)) {
      setActiveChapter(firstUnlockedChapter);
      const fallbackLessonId = resolveLessonId(firstUnlockedChapter, requestedLessonId);
      setActiveLessonId(fallbackLessonId);
      updateQueryRoute(firstUnlockedChapter.id, fallbackLessonId);
      setRouteReady(true);
      return;
    }

    setActiveChapter(targetChapter);
    const resolvedLessonId = resolveLessonId(targetChapter, requestedLessonId);
    setActiveLessonId(resolvedLessonId);
    updateQueryRoute(targetChapter.id, resolvedLessonId);
    setRouteReady(true);
  }, [
    modules,
    requestedChapterId,
    requestedLessonId,
    resumeTarget,
    unlockedModuleIds,
    updateQueryRoute
  ]);

  useEffect(() => {
    if (!routeReady || !completionsLoaded || !activeChapter.id) {
      return;
    }

    const trackingKey = `${doc.topic}:${activeChapter.id}`;
    if (lastTrackedChapterStartRef.current === trackingKey) {
      return;
    }

    lastTrackedChapterStartRef.current = trackingKey;

    const startMetadata = {
      topic: doc.topic,
      chapterId: activeChapter.id,
      chapterTitle: activeChapter.title,
      chapterNumber: activeChapter.number,
      lessonId: activeLessonId
    };

    void trackProductEvent('chapter_started', startMetadata);

    const isFirstChapterStart = completedChapterIds.size === 0;
    if (isFirstChapterStart) {
      void trackProductEventOnce(
        'first_chapter_started',
        'first_chapter_started',
        startMetadata
      );
    }
  }, [
    activeChapter.id,
    activeChapter.number,
    activeChapter.title,
    activeLessonId,
    completedChapterIds.size,
    completionsLoaded,
    doc.topic,
    routeReady
  ]);

  const handleSelectChapter = (
    chapter: TheoryChapter,
    preferredLessonId: string | null = null
  ) => {
    const targetChapter = modules.find((module) => module.id === chapter.id) ?? chapter;
    if (!unlockedModuleIds.has(targetChapter.id)) {
      return;
    }
    const resolvedLessonId =
      preferredLessonId &&
      targetChapter.sections.some((section) => section.id === preferredLessonId)
        ? preferredLessonId
        : targetChapter.sections[0]?.id ?? null;
    setActiveChapter(targetChapter);
    setActiveLessonId(resolvedLessonId);
    updateQueryRoute(targetChapter.id, resolvedLessonId);
    setSidebarOpen(false);
    contentRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLesson = (lessonId: string) => {
    if (!activeChapter.sections.some((section) => section.id === lessonId)) {
      return;
    }
    setActiveLessonId(lessonId);
    updateQueryRoute(activeChapter.id, lessonId);
    setSidebarOpen(false);
    contentRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
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
      const requestBody = {
        topic: doc.topic,
        track: activeTrackSlug,
        action,
        moduleId,
        currentLessonId,
        lastVisitedRoute
      };

      const response = await fetch('/api/learn/module-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': createPayloadRequestKey('module_progress', requestBody)
        },
        body: JSON.stringify(requestBody)
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as ModuleProgressApiPayload;

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to sync module progress.');
      }

      const rows = Array.isArray(payload.data) ? payload.data : [];
      applyModuleProgressRows(rows);
      setProgressIssue((current) => (current?.kind === 'sync' ? null : current));
      return payload;
    },
    [activeTrackSlug, applyModuleProgressRows, doc.topic]
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
      setProgressIssue({
        kind: 'sync',
        message:
          'Recent progress did not sync yet. Keep reading and retry to persist your latest route.'
      });
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

  const openSessionPicker = useCallback(() => {
    if (!sessionDefaultsHydrated) {
      return;
    }
    setSessionPickerVisible(true);
  }, [sessionDefaultsHydrated]);

  useEffect(() => {
    if (
      !routeReady ||
      !sessionDefaultsHydrated ||
      !theorySession.hasHydrated ||
      theorySession.hasActiveSession
    ) {
      return;
    }

    if (sessionPickerInitializedRef.current) {
      return;
    }

    sessionPickerInitializedRef.current = true;
    // Query-param reader navigation can recreate this client subtree. Keep the
    // dismissal for the current tab so the picker only auto-opens once per path.
    if (hasDismissedSessionPicker()) {
      return;
    }
    setSessionPickerVisible(true);
  }, [
    hasDismissedSessionPicker,
    routeReady,
    sessionDefaultsHydrated,
    theorySession.hasHydrated,
    theorySession.hasActiveSession
  ]);

  const completeCurrentModule = useCallback(async () => {
    if (completionActionPending) return false;
    setCompletionActionPending(true);
    try {
      if (!isCompleted) {
        if (!unlockedModuleIds.has(activeChapter.id)) {
          throw new Error('Cannot complete a locked module.');
        }
        await markChapterComplete();
        await syncModuleProgress({
          action: 'complete',
          moduleId: activeChapter.id
        });

        const completionMetadata = {
          topic: doc.topic,
          chapterId: activeChapter.id,
          chapterTitle: activeChapter.title,
          chapterNumber: activeChapter.number
        };

        void trackProductEvent('chapter_completed', completionMetadata);

        if (completedChapterIds.size === 0) {
          void trackProductEventOnce(
            'first_chapter_completed',
            'first_chapter_completed',
            completionMetadata
          );
        }
      }
      return true;
    } catch (error) {
      console.warn('Failed to sync completion state:', error);
      setProgressIssue({
        kind: 'sync',
        message:
          'Module completion did not sync. Retry progress sync, then complete the module again.'
      });
      return false;
    } finally {
      setCompletionActionPending(false);
    }
  }, [
    activeChapter.id,
    activeChapter.number,
    activeChapter.title,
    completionActionPending,
    completedChapterIds.size,
    doc.topic,
    isCompleted,
    markChapterComplete,
    syncModuleProgress,
    unlockedModuleIds
  ]);

  useEffect(() => {
    if (!isHydrated || !completionsLoaded || isCompleted || completionActionPending) {
      return;
    }

    if (hasActiveModuleCheckpoint) {
      return;
    }

    const lessonCount = orderedActiveLessons.length;
    if (lessonCount === 0 || completedLessonIds.length < lessonCount) {
      return;
    }

    void completeCurrentModule();
  }, [
    completeCurrentModule,
    completedLessonIds,
    completionActionPending,
    completionsLoaded,
    hasActiveModuleCheckpoint,
    isHydrated,
    isCompleted,
    orderedActiveLessons.length
  ]);

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-surface lg:h-[calc(100dvh-3.5rem)]">
      {/* Session exit confirmation modal */}
      {showExitConfirm && (
        <SessionExitModal
          onContinue={() => {
            setShowExitConfirm(false);
            pendingNavigationRef.current = null;
          }}
          onEndSession={() => {
            theorySession.stop();
            setShowExitConfirm(false);
            if (pendingNavigationRef.current) {
              router.push(pendingNavigationRef.current);
              pendingNavigationRef.current = null;
            }
          }}
        />
      )}


      <div className="flex h-11 flex-shrink-0 items-center gap-3 border-b border-outline-variant/30 bg-surface px-4 sticky top-0 z-40">
        <button
          type="button"
          onClick={() => setSidebarOpen((value) => !value)}
          aria-expanded={sidebarOpen}
          aria-controls="theory-sidebar"
          className="inline-flex h-8 items-center gap-2 border border-outline-variant/50 bg-surface-container px-3 text-xs font-mono font-medium text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
          aria-label="Toggle module navigation"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          <span className="hidden sm:inline uppercase tracking-wider">{sidebarOpen ? 'Close' : 'Modules'}</span>
        </button>

        {theorySession.hasActiveSession ? (
          <TheorySessionTopbar session={theorySession} />
        ) : (
          <>
            <div className="min-w-0 truncate font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
              M{activeChapter.order ?? activeChapter.number}
              <span className="mx-1 text-outline-variant">/</span>
              <span className="text-on-surface">
                Lesson {activeLessonNumber} of {orderedActiveLessons.length}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-3 font-mono text-[10px] text-on-surface-variant">
              <button
                type="button"
                onClick={openSessionPicker}
                disabled={!sessionDefaultsHydrated}
                className="inline-flex items-center gap-1 border border-outline-variant/50 px-2.5 py-1 text-xs font-mono text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary uppercase tracking-wider"
              >
                <Clock3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Session</span>
              </button>
              <button
                type="button"
                onClick={() => router.push('/settings?tab=reading')}
                className="hidden border border-outline-variant/50 px-2.5 py-1 text-xs font-mono text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary uppercase tracking-wider sm:inline-flex"
              >
                Settings
              </button>
            </div>
          </>
        )}
      </div>

      {progressIssue ? (
        <div
          data-testid="theory-progress-recovery"
          className="flex flex-wrap items-center justify-between gap-3 border-b border-tertiary/30 bg-tertiary/10 px-4 py-2 text-xs text-tertiary"
          role="status"
        >
          <p className="max-w-3xl font-mono">{progressIssue.message}</p>
          <button
            type="button"
            onClick={retryProgressSync}
            className="inline-flex items-center border border-tertiary/40 bg-tertiary/10 px-3 py-1 text-xs font-mono font-semibold text-tertiary transition-colors hover:bg-tertiary/20 uppercase tracking-wider"
          >
            Retry sync
          </button>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          id="theory-sidebar"
          className={`absolute inset-y-0 left-0 z-50 w-[min(18.25rem,calc(100vw-1rem))] border-r border-outline-variant/30 bg-surface-container/96 shadow-2xl backdrop-blur transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <TheorySidebar
            doc={doc}
            activeChapterId={activeChapter.id}
            activeLessonId={activeLessonId}
            completedLessonIds={completedLessonIds}
            isProgressLoaded={isHydrated}
            isChapterCompleted={isCompleted}
            onSelectLesson={handleSelectLesson}
          />
        </aside>

        {sidebarOpen ? (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
            aria-label="Close module navigation"
          />
        ) : null}

        {/* Vertical module progress rail */}
        <ModuleProgressRail
          orderedLessons={orderedActiveLessons}
          completedLessonIds={completedLessonIds}
          activeLessonId={activeLessonId}
        />

        <div
          ref={contentRef}
          aria-hidden={sessionPickerVisible && !theorySession.hasActiveSession}
          className="min-h-0 flex-1 overflow-y-auto bg-surface"
        >
          <TheoryContent
            topic={doc.topic}
            docId={doc.id}
            chapter={activeChapter}
            allChapters={modules}
            activeLessonId={activeLessonId}
            onNavigate={handleSelectChapter}
            onSelectLesson={handleSelectLesson}
            onCompleteCourse={handleCompleteCourse}
            isNextModuleUnlocked={isUpcomingModuleUnlocked}
            isChapterCompleted={isCompleted}
            hasModuleCheckpoint={hasActiveModuleCheckpoint}
            isProgressLoaded={isHydrated}
            completedLessonCount={completedLessonIds.length}
            completedLessonIds={completedLessonIds}
            onCompleteModule={completeCurrentModule}
            completionActionPending={completionActionPending}
            scrollContainerRef={contentRef}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {sessionPickerVisible && !theorySession.hasActiveSession ? (
        <TheorySessionPicker
          isOpen
          configsByMethod={resolvedSessionMethodConfigs}
          lessonTitle={activeLesson?.title ?? doc.title}
          lessonDurationMinutes={activeLessonDurationMinutes}
          onStart={(config) => {
            markSessionPickerDismissed();
            setSessionPickerVisible(false);
            startTheorySession(config);
          }}
          onOpenSettings={() => {
            markSessionPickerDismissed();
            setSessionPickerVisible(false);
            router.push('/settings?tab=reading');
          }}
          onDismiss={() => {
            markSessionPickerDismissed();
            setSessionPickerVisible(false);
          }}
        />
      ) : null}

      <AnimatePresence>
        {theorySession.isOnBreak &&
        theorySession.phaseDurationSeconds &&
        theorySession.remainingSeconds !== null ? (
          <TheoryBreakOverlay
            remainingSeconds={theorySession.remainingSeconds}
            totalSeconds={theorySession.phaseDurationSeconds}
            currentRound={theorySession.activeRound}
            totalRounds={theorySession.roundCount}
            tip={theorySession.breakTip ?? 'Let your focus rest for a moment.'}
            isPaused={theorySession.phase === 'paused'}
            onPause={theorySession.pause}
            onResume={theorySession.resume}
            onSkip={theorySession.skipBreak}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {theorySession.phase === 'complete' && theorySession.summary ? (
          <TheorySessionSummary
            lessonTitle={activeLesson?.title ?? doc.title}
            totalElapsedSeconds={theorySession.summary.totalElapsedSeconds}
            focusElapsedSeconds={theorySession.summary.focusElapsedSeconds}
            breakElapsedSeconds={theorySession.summary.breakElapsedSeconds}
            onNewSession={() => {
              theorySession.reset();
              setSessionPickerVisible(true);
            }}
            onDone={() => {
              theorySession.reset();
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};
