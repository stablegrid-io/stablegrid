'use client';

import type { Category } from '@/types/learn';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelect: (id: string) => void;
}

export const CategoryFilter = ({
  categories,
  selectedCategory,
  onSelect
}: CategoryFilterProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onSelect('all')}
        className={`flex-shrink-0 rounded-[10px] px-4 py-2 text-sm font-medium transition-all ${
          selectedCategory === 'all'
            ? 'bg-primary text-white'
            : 'border border-light-border bg-light-surface text-text-light-secondary hover:bg-light-hover dark:border-outline-variant dark:bg-surface-container dark:text-on-surface-variant dark:hover:bg-surface-container-high'
        }`}
      >
        All
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.id)}
          className={`flex flex-shrink-0 items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium transition-all ${
            selectedCategory === category.id
              ? 'bg-primary text-white'
              : 'border border-light-border bg-light-surface text-text-light-secondary hover:bg-light-hover dark:border-outline-variant dark:bg-surface-container dark:text-on-surface-variant dark:hover:bg-surface-container-high'
          }`}
        >
          {category.label}
          <span
            className={`rounded-[7px] px-1.5 py-0.5 text-xs ${
              selectedCategory === category.id
                ? 'bg-white/20 text-white'
                : 'bg-light-active text-text-light-tertiary dark:bg-surface-container-high dark:text-on-surface-variant/70'
            }`}
          >
            {category.count}
          </span>
        </button>
      ))}
    </div>
  );
};
