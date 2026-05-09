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
        className={`flex-shrink-0  px-4 py-2 text-sm font-medium transition-all ${
          selectedCategory === 'all'
            ? 'bg-primary text-on-surface'
            : 'border border-surface-dim bg-surface-container text-on-surface-variant hover:bg-surface-container    '
        }`}
      >
        All
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.id)}
          className={`flex flex-shrink-0 items-center gap-2  px-4 py-2 text-sm font-medium transition-all ${
            selectedCategory === category.id
              ? 'bg-primary text-on-surface'
              : 'border border-surface-dim bg-surface-container text-on-surface-variant hover:bg-surface-container    '
          }`}
        >
          {category.label}
          <span
            className={` px-1.5 py-0.5 text-xs ${
              selectedCategory === category.id
                ? 'bg-on-surface/20 text-on-surface'
                : 'bg-surface-container text-on-surface-variant  '
            }`}
          >
            {category.count}
          </span>
        </button>
      ))}
    </div>
  );
};
