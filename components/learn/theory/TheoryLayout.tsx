'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, Menu, X } from 'lucide-react';
import { PulseMascot } from '@/components/mascot/PulseMascot';
import type { TheoryChapter, TheoryDoc } from '@/types/theory';
import type { Topic } from '@/types/progress';
import { getChapterCompletions } from '@/lib/progress';
import { useReadingSession } from '@/lib/hooks/useReadingSession';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { usePulseMascotStore } from '@/lib/stores/usePulseMascotStore';
import { TheorySidebar } from '@/components/learn/theory/TheorySidebar';
import { TheoryContent } from '@/components/learn/theory/TheoryContent';

interface TheoryLayoutProps {
  doc: TheoryDoc;
}

export const TheoryLayout = ({ doc }: TheoryLayoutProps) => {
  const searchParams = useSearchParams();
  const requestedChapterId = searchParams.get('chapter');
  const [activeChapter, setActiveChapter] = useState<TheoryChapter>(doc.chapters[0]);
  const [activeSection, setActiveSection] = useState(doc.chapters[0].sections[0]?.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completedChapterIds, setCompletedChapterIds] = useState<Set<string>>(
    new Set()
  );
  const [completionActionPending, setCompletionActionPending] = useState(false);
  const [pulseVisible, setPulseVisible] = useState(false);
  const addXP = useProgressStore((state) => state.addXP);
  const pulseMood = usePulseMascotStore((state) => state.mood);
  const pulseMotion = usePulseMascotStore((state) => state.motion);
  const pulseAction = usePulseMascotStore((state) => state.action);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const handleChapterComplete = useCallback(() => {
    setCompletedChapterIds((prev) => new Set([...prev, activeChapter.id]));
    setPulseVisible(true);
  }, [activeChapter.id]);
  const handleChapterIncomplete = useCallback(() => {
    setCompletedChapterIds((prev) => {
      const next = new Set(prev);
      next.delete(activeChapter.id);
      return next;
    });
  }, [activeChapter.id]);

  const {
    isCompleted,
    activeSeconds,
    markChapterComplete,
    markChapterIncomplete
  } =
    useReadingSession({
      topic: doc.topic as Topic,
      chapter: activeChapter,
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
    let mounted = true;
    const loadCompletions = async () => {
      const completed = await getChapterCompletions(doc.topic as Topic);
      if (!mounted) return;
      setCompletedChapterIds(completed);
    };
    void loadCompletions();
    return () => {
      mounted = false;
    };
  }, [doc.topic]);

  useEffect(() => {
    if (!pulseVisible) return;
    const timeout = window.setTimeout(() => setPulseVisible(false), 4800);
    return () => window.clearTimeout(timeout);
  }, [pulseVisible]);

  useEffect(() => {
    if (!requestedChapterId) {
      setActiveChapter(doc.chapters[0]);
      setActiveSection(doc.chapters[0].sections[0]?.id);
      return;
    }

    const targetChapter = doc.chapters.find(
      (chapter) => chapter.id === requestedChapterId
    );
    if (!targetChapter) {
      return;
    }

    setActiveChapter(targetChapter);
    setActiveSection(targetChapter.sections[0]?.id);
  }, [doc.chapters, requestedChapterId]);

  const handleSelectChapter = (chapter: TheoryChapter) => {
    setActiveChapter(chapter);
    setActiveSection(chapter.sections[0]?.id);
    setSidebarOpen(false);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompletionAction = async () => {
    if (completionActionPending) return;
    setCompletionActionPending(true);
    try {
      if (isCompleted) {
        await markChapterIncomplete();
      } else {
        await markChapterComplete();
      }
    } finally {
      setCompletionActionPending(false);
    }
  };

  const readingMinutes = Math.floor(activeSeconds / 60);

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden">
      {isCompleted ? (
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-4 py-2 dark:border-emerald-800 dark:bg-emerald-900/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Chapter completed
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <Clock className="h-3 w-3" />
              {readingMinutes}m active reading
            </span>
            <div
              className={`transition-opacity duration-500 ${
                pulseVisible ? 'opacity-100' : 'opacity-85'
              }`}
            >
              <PulseMascot mood={pulseMood} motion={pulseMotion} action={pulseAction} size={40} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-light-border bg-light-bg px-4 dark:border-dark-border dark:bg-dark-bg">
        <button
          type="button"
          onClick={() => setSidebarOpen((value) => !value)}
          className="btn btn-ghost h-9 w-9 p-0 lg:hidden"
          aria-label="Toggle chapter navigation"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="truncate text-sm font-medium">{doc.title}</div>
        <div className="ml-auto flex items-center gap-3 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          <span>
            Ch. {activeChapter.number} / {doc.chapters.length}
          </span>
          <span className="hidden sm:inline">~{activeChapter.totalMinutes} min</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={`absolute inset-y-0 left-0 z-50 w-72 border-r border-light-border bg-light-bg transition-transform duration-300 dark:border-dark-border dark:bg-dark-bg lg:relative lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <TheorySidebar
            doc={doc}
            activeChapterId={activeChapter.id}
            activeSectionId={activeSection ?? ''}
            completedChapterIds={completedChapterIds}
            onSelectChapter={handleSelectChapter}
          />
        </aside>

        {sidebarOpen ? (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            aria-label="Close chapter navigation"
          />
        ) : null}

        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto">
          <TheoryContent
            chapter={activeChapter}
            allChapters={doc.chapters}
            onNavigate={handleSelectChapter}
            onSectionVisible={setActiveSection}
            isCompleted={isCompleted}
            onCompletionAction={handleCompletionAction}
            completionActionPending={completionActionPending}
          />
        </div>
      </div>
    </div>
  );
};
