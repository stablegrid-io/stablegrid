'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Filter, Search, X, ChevronDown } from 'lucide-react';
import type { QuestionFilters } from '@/lib/hooks/useQuestionFilters';
import type { PracticeTopic } from '@/lib/types';

interface FilterPanelProps {
  filters: QuestionFilters;
  onUpdateFilter: (key: keyof QuestionFilters, value: QuestionFilters[keyof QuestionFilters]) => void;
  onToggleArrayFilter: (
    key: 'difficulties' | 'topics' | 'tags',
    value: string
  ) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
  availableTopics?: PracticeTopic[];
  availableTags?: string[];
}

export const FilterPanel = ({
  filters,
  onUpdateFilter,
  onToggleArrayFilter,
  onClearFilters,
  hasActiveFilters,
  resultCount,
  availableTopics = ['pyspark', 'fabric'],
  availableTags = []
}: FilterPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const panelContent = (
    <div className="card space-y-5 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-text-light-tertiary hover:text-brand-500 dark:text-text-dark-tertiary"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="btn btn-ghost h-8 w-8 p-0 lg:hidden"
            type="button"
            aria-label="Close filters"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light-tertiary dark:text-text-dark-tertiary" />
          <input
            type="text"
            value={filters.search}
            onChange={(event) => onUpdateFilter('search', event.target.value)}
            placeholder="Search questions..."
            className="input pl-10 pr-10"
          />
          {filters.search && (
            <button
              onClick={() => onUpdateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light-tertiary hover:text-text-light-primary dark:text-text-dark-tertiary dark:hover:text-text-dark-primary"
              type="button"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="divider" />

      <FilterSection title="Difficulty">
        <div className="space-y-2">
          {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
            <Checkbox
              key={difficulty}
              label={difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              checked={filters.difficulties.includes(difficulty)}
              onChange={() => onToggleArrayFilter('difficulties', difficulty)}
              color={
                difficulty === 'easy'
                  ? 'success'
                  : difficulty === 'medium'
                    ? 'warning'
                    : 'error'
              }
            />
          ))}
        </div>
      </FilterSection>

      <div className="divider" />

      <FilterSection title="Topics">
        <div className="space-y-2">
          {availableTopics.map((topic) => (
            <Checkbox
              key={topic}
              label={topic.toUpperCase()}
              checked={filters.topics.includes(topic)}
              onChange={() => onToggleArrayFilter('topics', topic)}
            />
          ))}
        </div>
      </FilterSection>

      <div className="divider" />

      <FilterSection title="Status">
        <div className="space-y-2">
          {(
            [
              { value: 'all', label: 'All Questions' },
              { value: 'new', label: 'New (Not Attempted)' },
              { value: 'attempted', label: 'Attempted' },
              { value: 'correct', label: 'Correct' },
              { value: 'incorrect', label: 'Incorrect' },
              { value: 'bookmarked', label: 'Bookmarked' }
            ] as const
          ).map((status) => (
            <Radio
              key={status.value}
              label={status.label}
              checked={filters.status === status.value}
              onChange={() => onUpdateFilter('status', status.value)}
            />
          ))}
        </div>
      </FilterSection>

      {availableTags.length > 0 && (
        <>
          <div className="divider" />
          <FilterSection title="Tags" collapsible>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <TagButton
                  key={tag}
                  label={tag}
                  active={filters.tags.includes(tag)}
                  onClick={() => onToggleArrayFilter('tags', tag)}
                />
              ))}
            </div>
          </FilterSection>
        </>
      )}

      <div className="rounded-lg bg-light-surface p-3 text-center text-sm text-text-light-secondary dark:bg-dark-surface dark:text-text-dark-secondary">
        <span className="font-semibold text-text-light-primary dark:text-text-dark-primary">
          {resultCount}
        </span>{' '}
        {resultCount === 1 ? 'question' : 'questions'} found
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-secondary w-full"
          type="button"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 h-2 w-2 rounded-full bg-brand-500" />
          )}
        </button>
      </div>

      <div className="hidden lg:block">{panelContent}</div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            />
            <motion.div
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto border-r border-light-border bg-light-bg p-4 dark:border-dark-border dark:bg-dark-bg lg:hidden"
            >
              {panelContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const FilterSection = ({
  title,
  children,
  collapsible = false
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(!collapsible);

  return (
    <div>
      <button
        onClick={() => collapsible && setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between"
        disabled={!collapsible}
        type="button"
      >
        <span className="text-xs font-medium uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
          {title}
        </span>
        {collapsible && (
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Checkbox = ({
  label,
  checked,
  onChange,
  color = 'brand'
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  color?: 'brand' | 'success' | 'warning' | 'error';
}) => {
  const colorClasses = {
    brand: 'border-brand-500 bg-brand-500',
    success: 'border-success-500 bg-success-500',
    warning: 'border-warning-500 bg-warning-500',
    error: 'border-error-500 bg-error-500'
  };

  return (
    <label className="group flex cursor-pointer items-center gap-3">
      <span className="relative">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <span
          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
            checked
              ? colorClasses[color]
              : 'border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg'
          } group-hover:border-brand-500`}
        >
          {checked && (
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-white"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>
      </span>
      <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
        {label}
      </span>
    </label>
  );
};

const Radio = ({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) => {
  return (
    <label className="group flex cursor-pointer items-center gap-3">
      <span className="relative flex h-5 w-5 items-center justify-center">
        <input
          type="radio"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <span
          className={`h-5 w-5 rounded-full border-2 transition-all group-hover:border-brand-500 ${
            checked
              ? 'border-brand-500'
              : 'border-light-border dark:border-dark-border'
          }`}
        />
        {checked && (
          <span className="absolute h-2.5 w-2.5 rounded-full bg-brand-500" />
        )}
      </span>
      <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
        {label}
      </span>
    </label>
  );
};

const TagButton = ({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'bg-brand-500 text-white'
          : 'border border-light-border bg-light-surface text-text-light-secondary hover:border-brand-500 dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-secondary'
      }`}
      type="button"
    >
      {label}
    </button>
  );
};
