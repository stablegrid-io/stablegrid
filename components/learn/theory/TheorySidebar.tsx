'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import type { TheoryChapter, TheoryDoc } from '@/types/theory';
import { getTheoryCategories, type TheoryCategorySlug } from '@/data/learn/theory/categories';

interface TheorySidebarProps {
  doc: TheoryDoc;
  activeChapterId: string;
  completedChapterIds: Set<string>;
  onSelectChapter: (chapter: TheoryChapter) => void;
}

export const TheorySidebar = ({
  doc,
  activeChapterId,
  completedChapterIds,
  onSelectChapter
}: TheorySidebarProps) => {
  const totalMinutes = doc.chapters.reduce(
    (sum, chapter) => sum + chapter.totalMinutes,
    0
  );
  const groupedCategories = getTheoryCategories(doc);

  const categoryTone: Record<
    TheoryCategorySlug,
    { dot: string; text: string; badge: string }
  > = {
    fundamentals: {
      dot: 'bg-brand-500',
      text: 'text-brand-700 dark:text-brand-300',
      badge: 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
    },
    history: {
      dot: 'bg-violet-500',
      text: 'text-violet-700 dark:text-violet-300',
      badge: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300'
    },
    architecture: {
      dot: 'bg-cyan-500',
      text: 'text-cyan-700 dark:text-cyan-300',
      badge: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300'
    },
    optimization: {
      dot: 'bg-amber-500',
      text: 'text-amber-700 dark:text-amber-300',
      badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
    },
    data: {
      dot: 'bg-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-300',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
    },
    advanced: {
      dot: 'bg-fuchsia-500',
      text: 'text-fuchsia-700 dark:text-fuchsia-300',
      badge: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/20 dark:text-fuchsia-300'
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-light-border p-4 dark:border-dark-border">
        <Link
          href={`/learn/${doc.topic}/theory`}
          className="mb-3 inline-flex items-center gap-2 text-xs text-text-light-tertiary transition-colors hover:text-brand-500 dark:text-text-dark-tertiary"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to categories
        </Link>
        <div className="text-sm font-semibold">{doc.title}</div>
        <div className="mt-1 flex items-center gap-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          <Clock className="h-3.5 w-3.5" />
          {totalMinutes} min total
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {groupedCategories.map((category, categoryIndex) => {
          const completedCount = category.chapters.filter((chapter) =>
            completedChapterIds.has(chapter.id)
          ).length;
          const tone = categoryTone[category.slug];
          const sortedChapters = [...category.chapters].sort(
            (left, right) => left.number - right.number
          );

          return (
            <div
              key={category.slug}
              className={`${
                categoryIndex > 0
                  ? 'mt-3 border-t border-light-border pt-3 dark:border-dark-border'
                  : ''
              }`}
            >
              <div className="mb-2 px-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                    <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${tone.text}`}>
                      {category.label}
                    </span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone.badge}`}>
                    {completedCount}/{category.chapterCount}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-text-light-tertiary dark:text-text-dark-tertiary">
                  {category.description}
                </p>
              </div>

              {sortedChapters.map((chapter) => {
                const isActive = chapter.id === activeChapterId;
                const chapterCompleted = completedChapterIds.has(chapter.id);
                return (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={() => onSelectChapter(chapter)}
                    className={`mb-1 w-full rounded-lg p-3 text-left transition-all ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-900/20'
                        : 'hover:bg-light-hover dark:hover:bg-dark-hover'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          chapterCompleted
                            ? 'bg-emerald-500 text-white'
                            : isActive
                              ? 'bg-brand-500 text-white'
                              : 'bg-light-surface text-text-light-tertiary dark:bg-dark-surface dark:text-text-dark-tertiary'
                        }`}
                      >
                        {chapterCompleted ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          chapter.number
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`truncate text-sm font-medium ${
                            isActive
                              ? 'text-brand-700 dark:text-brand-300'
                              : 'text-text-light-primary dark:text-text-dark-primary'
                          }`}
                        >
                          {chapter.title}
                        </div>
                        <div className="mt-0.5 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                          {chapter.totalMinutes} min
                        </div>
                      </div>
                    </div>

                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
