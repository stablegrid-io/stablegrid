'use client';

import { BookOpen } from 'lucide-react';
import type { FunctionEntry } from '@/types/learn';
import { FunctionCard } from '@/components/learn/FunctionCard';

interface FunctionListProps {
  functions: FunctionEntry[];
  selectedId: string | null;
  onSelect: (entry: FunctionEntry) => void;
  bookmarkedIds: string[];
  masteredIds: string[];
  onToggleBookmark: (id: string) => void;
  onToggleMastered: (id: string) => void;
}

export const FunctionList = ({
  functions,
  selectedId,
  onSelect,
  bookmarkedIds,
  masteredIds,
  onToggleBookmark,
  onToggleMastered
}: FunctionListProps) => {
  if (functions.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center text-center">
        <BookOpen className="mb-2 h-8 w-8 text-text-light-tertiary dark:text-text-dark-tertiary" />
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          No functions match your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {functions.map((entry) => (
        <FunctionCard
          key={entry.id}
          entry={entry}
          selected={entry.id === selectedId}
          bookmarked={bookmarkedIds.includes(entry.id)}
          mastered={masteredIds.includes(entry.id)}
          onSelect={() => onSelect(entry)}
          onToggleBookmark={() => onToggleBookmark(entry.id)}
          onToggleMastered={() => onToggleMastered(entry.id)}
        />
      ))}
    </div>
  );
};
