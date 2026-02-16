'use client';

import { Bookmark, Check, ChevronRight } from 'lucide-react';
import type { FunctionEntry } from '@/types/learn';

interface FunctionCardProps {
  entry: FunctionEntry;
  selected: boolean;
  bookmarked: boolean;
  mastered: boolean;
  onSelect: () => void;
  onToggleBookmark: () => void;
  onToggleMastered: () => void;
}

const difficultyDotClass: Record<FunctionEntry['difficulty'], string> = {
  beginner: 'bg-success-500',
  intermediate: 'bg-warning-500',
  advanced: 'bg-violet-500'
};

export const FunctionCard = ({
  entry,
  selected,
  bookmarked,
  mastered,
  onSelect,
  onToggleBookmark,
  onToggleMastered
}: FunctionCardProps) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`group relative w-full cursor-pointer rounded-lg border px-3 py-2.5 text-left transition-all duration-150 ${
        selected
          ? 'border-brand-300 bg-brand-50/70 dark:border-brand-700 dark:bg-brand-900/20'
          : 'border-transparent bg-transparent hover:border-light-border hover:bg-light-bg dark:hover:border-dark-border dark:hover:bg-dark-surface'
      }`}
    >
      {selected ? (
        <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand-500" />
      ) : null}

      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <code
              className={`truncate text-[13px] font-semibold ${
                selected
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-text-light-primary dark:text-text-dark-primary'
              }`}
            >
              {entry.name}
            </code>
            {mastered ? (
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-success-300 bg-success-50 text-success-600 dark:border-success-700 dark:bg-success-900/20 dark:text-success-400">
                <Check className="h-2.5 w-2.5" />
              </span>
            ) : null}
          </div>

          <p className="line-clamp-1 text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
            {entry.shortDescription}
          </p>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${difficultyDotClass[entry.difficulty]}`}
            aria-hidden
          />
          {bookmarked ? (
            <span className="text-[10px] font-semibold text-brand-500">◆</span>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleBookmark();
            }}
            className={`rounded p-1 transition ${
              bookmarked
                ? 'text-brand-500'
                : 'text-text-light-tertiary hover:text-text-light-primary dark:text-text-dark-tertiary dark:hover:text-text-dark-primary'
            }`}
            aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? 'fill-brand-500' : ''}`} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleMastered();
            }}
            className={`rounded p-1 transition ${
              mastered
                ? 'text-success-500'
                : 'text-text-light-tertiary hover:text-text-light-primary dark:text-text-dark-tertiary dark:hover:text-text-dark-primary'
            }`}
            aria-label={mastered ? 'Unmark mastered' : 'Mark mastered'}
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>

        <ChevronRight
          className={`h-3.5 w-3.5 ${
            selected
              ? 'text-brand-500'
              : 'text-text-light-tertiary dark:text-text-dark-tertiary'
          }`}
        />
      </div>
    </div>
  );
};
