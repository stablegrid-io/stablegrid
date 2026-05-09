'use client';

import { LayoutGrid, List } from 'lucide-react';

export type ViewMode = 'gallery' | 'list';

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex border border-surface-dim bg-surface">
      <button
        type="button"
        onClick={() => onChange('gallery')}
        className={`flex h-8 w-8 items-center justify-center  transition ${
          view === 'gallery'
            ? 'bg-surface-container text-on-surface shadow-sm  '
            : 'text-on-surface-variant hover:text-on-surface  '
        }`}
        aria-label="Gallery view"
        aria-pressed={view === 'gallery'}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`flex h-8 w-8 items-center justify-center  transition ${
          view === 'list'
            ? 'bg-surface-container text-on-surface shadow-sm  '
            : 'text-on-surface-variant hover:text-on-surface  '
        }`}
        aria-label="List view"
        aria-pressed={view === 'list'}
      >
        <List className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
