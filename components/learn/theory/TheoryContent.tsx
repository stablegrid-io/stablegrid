'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import type { TheoryChapter } from '@/types/theory';
import { TheorySection } from '@/components/learn/theory/TheorySection';

interface TheoryContentProps {
  chapter: TheoryChapter;
  allChapters: TheoryChapter[];
  onNavigate: (chapter: TheoryChapter) => void;
  onSectionVisible: (sectionId: string) => void;
  isCompleted: boolean;
  onCompletionAction: () => void;
  completionActionPending: boolean;
  completionRewardLabel: string;
}

export const TheoryContent = ({
  chapter,
  allChapters,
  onNavigate,
  onSectionVisible,
  isCompleted,
  onCompletionAction,
  completionActionPending,
  completionRewardLabel
}: TheoryContentProps) => {
  const chapterIndex = allChapters.findIndex((item) => item.id === chapter.id);
  const previousChapter = chapterIndex > 0 ? allChapters[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex < allChapters.length - 1 ? allChapters[chapterIndex + 1] : null;

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    chapter.sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (!element) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              onSectionVisible(section.id);
            }
          });
        },
        { rootMargin: '-25% 0px -60% 0px', threshold: 0.1 }
      );
      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [chapter, onSectionVisible]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={chapter.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="mx-auto max-w-3xl px-4 py-8 lg:px-8 lg:py-12"
      >
        <header className="mb-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-brand-500">
            Chapter {chapter.number}
          </p>
          <h1 className="mb-3 text-3xl font-bold">{chapter.title}</h1>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            {chapter.description}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            <BookOpen className="h-3.5 w-3.5" />
            ~{chapter.totalMinutes} min read
          </div>
        </header>

        <div className="space-y-12">
          {chapter.sections.map((section) => (
            <TheorySection key={section.id} section={section} />
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Chapter Completion
          </h3>
          <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Mark this chapter when you finish reading it. First completion awards +{completionRewardLabel}.
          </p>
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
                : 'I have read this chapter'}
          </button>
        </div>

        <div className="mt-16 flex gap-4 border-t border-light-border pt-8 dark:border-dark-border">
          {previousChapter ? (
            <button
              type="button"
              onClick={() => onNavigate(previousChapter)}
              className="card flex-1 p-4 text-left transition-colors hover:border-brand-400 dark:hover:border-brand-600"
            >
              <div className="mb-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                Previous
              </div>
              <div className="text-sm font-medium">{previousChapter.title}</div>
            </button>
          ) : null}
          {nextChapter ? (
            <button
              type="button"
              onClick={() => onNavigate(nextChapter)}
              className="ml-auto flex-none w-full rounded-xl border border-brand-500 bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-right text-white shadow-sm transition-all hover:from-brand-600 hover:to-brand-700 sm:w-[18rem]"
            >
              <div className="mb-1 text-xs text-white/80">
                Next
              </div>
              <div className="text-sm font-semibold text-white">{nextChapter.title}</div>
            </button>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
