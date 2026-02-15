'use client';

import { Bookmark, ChevronRight, Code } from 'lucide-react';
import type { FunctionEntry } from '@/types/learn';

interface FunctionCardProps {
  entry: FunctionEntry;
  selected: boolean;
  bookmarked: boolean;
  onSelect: () => void;
  onToggleBookmark: () => void;
}

const difficultyClass: Record<FunctionEntry['difficulty'], string> = {
  beginner:
    'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400',
  intermediate:
    'bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400',
  advanced: 'bg-error-50 text-error-700 dark:bg-error-900/20 dark:text-error-400'
};

export const FunctionCard = ({
  entry,
  selected,
  bookmarked,
  onSelect,
  onToggleBookmark
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
      className={`group w-full cursor-pointer rounded-lg border p-4 text-left transition-all duration-150 ${
        selected
          ? 'border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20'
          : 'border-transparent bg-light-bg hover:border-light-border hover:bg-light-surface dark:bg-dark-bg dark:hover:border-dark-border dark:hover:bg-dark-surface'
      }`}
      aria-selected={selected}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Code
              className={`h-4 w-4 flex-shrink-0 ${
                selected
                  ? 'text-brand-500'
                  : 'text-text-light-tertiary dark:text-text-dark-tertiary'
              }`}
            />
            <code
              className={`truncate text-sm font-semibold ${
                selected
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-text-light-primary dark:text-text-dark-primary'
              }`}
            >
              {entry.name}
            </code>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${difficultyClass[entry.difficulty]}`}
          >
            {entry.difficulty}
          </span>
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
            <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-brand-500' : ''}`} />
          </button>
        </div>
      </div>

      <p className="ml-6 line-clamp-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
        {entry.shortDescription}
      </p>

      {selected ? (
        <div className="mt-2 flex justify-end">
          <ChevronRight className="h-4 w-4 text-brand-500" />
        </div>
      ) : null}
    </div>
  );
};
