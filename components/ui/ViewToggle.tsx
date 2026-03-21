'use client';

import { LayoutGrid, List } from 'lucide-react';

export type ViewMode = 'gallery' | 'list';

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-xl border border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg">
      <button
        type="button"
        onClick={() => onChange('gallery')}
        className={`flex h-8 w-8 items-center justify-center rounded-[10px] transition ${
          view === 'gallery'
            ? 'bg-light-surface text-text-light-primary shadow-sm dark:bg-dark-surface dark:text-text-dark-primary'
            : 'text-text-light-tertiary hover:text-text-light-primary dark:text-text-dark-tertiary dark:hover:text-text-dark-primary'
        }`}
        aria-label="Gallery view"
        aria-pressed={view === 'gallery'}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`flex h-8 w-8 items-center justify-center rounded-[10px] transition ${
          view === 'list'
            ? 'bg-light-surface text-text-light-primary shadow-sm dark:bg-dark-surface dark:text-text-dark-primary'
            : 'text-text-light-tertiary hover:text-text-light-primary dark:text-text-dark-tertiary dark:hover:text-text-dark-primary'
        }`}
        aria-label="List view"
        aria-pressed={view === 'list'}
      >
        <List className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
