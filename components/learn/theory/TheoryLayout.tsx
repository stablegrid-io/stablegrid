'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { PulseMascot } from '@/components/mascot/PulseMascot';
import type { TheoryChapter, TheoryDoc } from '@/types/theory';
import type { Topic } from '@/types/progress';
import { getChapterCompletions } from '@/lib/progress';
import { useReadingSession } from '@/lib/hooks/useReadingSession';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { usePulseMascotStore } from '@/lib/stores/usePulseMascotStore';
import { formatUnitsAsKwh, getChapterCompletionRewardUnits } from '@/lib/energy';
import { TheorySidebar } from '@/components/learn/theory/TheorySidebar';
import { TheoryContent } from '@/components/learn/theory/TheoryContent';

interface TheoryLayoutProps {
  doc: TheoryDoc;
}

interface ChapterCompletionBurstProps {
  visible: boolean;
  burstKey: number;
  mood: Parameters<typeof PulseMascot>[0]['mood'];
  mascotMotion: Parameters<typeof PulseMascot>[0]['motion'];
  action: Parameters<typeof PulseMascot>[0]['action'];
}

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
  mood,
  mascotMotion,
  action
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
        <div className="relative flex h-44 w-44 items-center justify-center overflow-visible rounded-2xl border border-brand-300/60 bg-gradient-to-b from-brand-50 to-teal-50 shadow-xl dark:border-brand-700/40 dark:from-[#0f1c2e] dark:to-[#0d1b1d]">
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
            animate={{ rotate: [0, -8, 6, 0], x: [0, -5, 9, 0], y: [0, 1, -3, 0], scale: [1, 1.03, 1.08, 1] }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          >
            <div className="w-[9.4rem]">
              <PulseMascot
                mood={mood}
                motion={mascotMotion}
                action={action}
                size={118}
                interactive={false}
                className="w-[9.4rem]"
              />
            </div>
          </motion.div>
        </div>

      </motion.div>
    ) : null}
  </AnimatePresence>
);

export const TheoryLayout = ({ doc }: TheoryLayoutProps) => {
  const searchParams = useSearchParams();
  const requestedChapterId = searchParams.get('chapter');
  const [activeChapter, setActiveChapter] = useState<TheoryChapter>(doc.chapters[0]);
  const [, setActiveSection] = useState(doc.chapters[0].sections[0]?.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completedChapterIds, setCompletedChapterIds] = useState<Set<string>>(
    new Set()
  );
  const [completionActionPending, setCompletionActionPending] = useState(false);
  const [pulseVisible, setPulseVisible] = useState(false);
  const [completionBurstKey, setCompletionBurstKey] = useState(0);
  const addXP = useProgressStore((state) => state.addXP);
  const pulseMood = usePulseMascotStore((state) => state.mood);
  const pulseMotion = usePulseMascotStore((state) => state.motion);
  const pulseAction = usePulseMascotStore((state) => state.action);
  const chapterCompletionRewardUnits = getChapterCompletionRewardUnits(
    activeChapter.totalMinutes
  );
  const chapterCompletionRewardLabel = formatUnitsAsKwh(
    chapterCompletionRewardUnits,
    2
  );
  const contentRef = useRef<HTMLDivElement | null>(null);
  const handleChapterComplete = useCallback(() => {
    setCompletedChapterIds((prev) => new Set([...prev, activeChapter.id]));
    setPulseVisible(true);
    setCompletionBurstKey((value) => value + 1);
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
    const timeout = window.setTimeout(() => setPulseVisible(false), 2600);
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
      <ChapterCompletionBurst
        visible={pulseVisible}
        burstKey={completionBurstKey}
        mood={pulseMood}
        mascotMotion={pulseMotion}
        action={pulseAction}
      />

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
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">
              +{chapterCompletionRewardLabel} earned
            </span>
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
            completionRewardLabel={chapterCompletionRewardLabel}
          />
        </div>
      </div>
    </div>
  );
};
