import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Cpu,
  Database,
  Gauge,
  History,
  Layers,
  Sparkles,
  type LucideIcon
} from 'lucide-react';
import type { TheoryDoc } from '@/types/theory';
import type {
  TheoryCategorySlug,
  TheoryCategorySummary
} from '@/data/learn/theory/categories';

interface TheoryCategorySelectorProps {
  doc: TheoryDoc;
  categories: TheoryCategorySummary[];
  completedChapterIds: string[];
}

export const TheoryCategorySelector = ({
  doc,
  categories,
  completedChapterIds
}: TheoryCategorySelectorProps) => {
  const totalChapters = doc.chapters.length;
  const totalMinutes = doc.chapters.reduce((sum, chapter) => sum + chapter.totalMinutes, 0);
  const completedSet = new Set(completedChapterIds);

  const getCompletionState = (completedCount: number, chapterCount: number) => {
    const pct = chapterCount > 0 ? Math.round((completedCount / chapterCount) * 100) : 0;

    if (pct >= 100) {
      return {
        pct,
        badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
        bar: 'bg-emerald-500',
        accent: 'border-emerald-400/70',
        icon: 'text-emerald-500'
      };
    }

    if (pct >= 50) {
      return {
        pct,
        badge: 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300',
        bar: 'bg-brand-500',
        accent: 'border-brand-400/70',
        icon: 'text-brand-500'
      };
    }

    if (pct > 0) {
      return {
        pct,
        badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
        bar: 'bg-amber-500',
        accent: 'border-amber-400/70',
        icon: 'text-amber-500'
      };
    }

    return {
      pct,
      badge: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
      bar: 'bg-neutral-300 dark:bg-neutral-700',
      accent: 'border-neutral-300 dark:border-neutral-700',
      icon: 'text-neutral-400 dark:text-neutral-500'
    };
  };

  const categoryIconMap: Record<TheoryCategorySlug, LucideIcon> = {
    fundamentals: BookOpen,
    history: History,
    architecture: Cpu,
    optimization: Gauge,
    data: Database,
    advanced: Sparkles
  };

  const allCompletedCount = doc.chapters.filter((chapter) =>
    completedSet.has(chapter.id)
  ).length;
  const allCompletion = getCompletionState(allCompletedCount, totalChapters);

  return (
    <div className="min-h-screen bg-light-bg pb-24 dark:bg-dark-bg lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href={`/learn/${doc.topic}`}
            className="mb-8 inline-flex items-center gap-2 text-sm text-text-light-tertiary transition-colors hover:text-brand-500 dark:text-text-dark-tertiary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Topic
          </Link>

          <header className="mb-8">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.24em] text-brand-500">
              Theory
            </p>
            <h1 className="text-3xl font-bold">{doc.title}</h1>
            <p className="mt-2 text-text-light-secondary dark:text-text-dark-secondary">
              Choose a category first, then dive into chapters.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {totalChapters} chapters
              </span>
              <span>{totalMinutes} min total</span>
            </div>
          </header>

          <div className="mb-4">
            <Link
              href={`/learn/${doc.topic}/theory/all`}
              className="card card-hover flex flex-col gap-4 border-brand-200/70 bg-gradient-to-r from-white to-brand-50/30 p-5 dark:from-dark-surface dark:to-brand-900/10 dark:border-brand-800/60"
            >
              <div className="flex w-full items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20">
                    <Layers className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                      All Chapters
                    </div>
                    <div className="mt-0.5 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                      Browse everything without filtering.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${allCompletion.badge}`}
                  >
                    {allCompletion.pct}%
                  </span>
                  <ChevronRight className="h-4 w-4 text-brand-500" />
                </div>
              </div>
              <div className="w-full">
                <div className="mb-1 flex items-center justify-between text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                  <span>
                    {allCompletedCount}/{totalChapters} completed
                  </span>
                  <span>{totalMinutes} min</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${allCompletion.bar}`}
                    style={{ width: `${allCompletion.pct}%` }}
                  />
                </div>
              </div>
            </Link>
          </div>

          <div className="mb-5 border-t border-light-border/80 dark:border-dark-border/80" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => {
              const completedCount = category.chapters.filter((chapter) =>
                completedSet.has(chapter.id)
              ).length;
              const completion = getCompletionState(completedCount, category.chapterCount);
              const CategoryIcon = categoryIconMap[category.slug];

              return (
                <Link
                  key={category.slug}
                  href={`/learn/${doc.topic}/theory/${category.slug}`}
                  className={`card card-hover flex h-full flex-col gap-4 border-l-2 p-5 ${completion.accent}`}
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface">
                        <CategoryIcon className={`h-4 w-4 ${completion.icon}`} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                          {category.label}
                        </div>
                        <div className="mt-0.5 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                          {category.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${completion.badge}`}
                      >
                        {completion.pct}%
                      </span>
                      <ChevronRight className="h-4 w-4 text-brand-500" />
                    </div>
                  </div>
                  <div className="mt-auto w-full space-y-2">
                    <div className="flex items-center justify-between text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                      <span>
                        {completedCount}/{category.chapterCount} completed
                      </span>
                      <span>{category.totalMinutes} min</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${completion.bar}`}
                        style={{ width: `${completion.pct}%` }}
                      />
                    </div>
                    {completion.pct === 100 ? (
                      <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completed
                      </div>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
