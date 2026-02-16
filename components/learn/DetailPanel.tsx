'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  Link2,
  X,
  Zap
} from 'lucide-react';
import type { FunctionEntry } from '@/types/learn';
import { CodeBlock } from '@/components/learn/CodeBlock';

interface DetailPanelProps {
  selectedFunction: FunctionEntry | null;
  allFunctions: FunctionEntry[];
  onSelectRelated: (id: string) => void;
  onClose: () => void;
  isBookmarked: boolean;
  isMastered: boolean;
  onToggleBookmark: (id: string) => void;
  onToggleMastered: (id: string) => void;
  previousFunction: FunctionEntry | null;
  nextFunction: FunctionEntry | null;
  onNavigate: (entry: FunctionEntry) => void;
}

const difficultyBadge: Record<FunctionEntry['difficulty'], string> = {
  beginner:
    'border-success-200 bg-success-50 text-success-700 dark:border-success-800 dark:bg-success-900/20 dark:text-success-400',
  intermediate:
    'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-800 dark:bg-warning-900/20 dark:text-warning-400',
  advanced:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400'
};

export const DetailPanel = ({
  selectedFunction,
  allFunctions,
  onSelectRelated,
  onClose,
  isBookmarked,
  isMastered,
  onToggleBookmark,
  onToggleMastered,
  previousFunction,
  nextFunction,
  onNavigate
}: DetailPanelProps) => {
  const [activeExample, setActiveExample] = useState(0);

  useEffect(() => {
    setActiveExample(0);
  }, [selectedFunction?.id]);

  const relatedFunctions = useMemo(() => {
    if (!selectedFunction?.relatedFunctions?.length) return [];

    return selectedFunction.relatedFunctions
      .map((id) => allFunctions.find((entry) => entry.id === id))
      .filter((entry): entry is FunctionEntry => Boolean(entry));
  }, [allFunctions, selectedFunction]);

  if (!selectedFunction) {
    return (
      <div className="hidden h-full flex-col items-center justify-center p-8 text-center lg:flex">
        <BookOpen className="mb-4 h-12 w-12 text-text-light-tertiary dark:text-text-dark-tertiary" />
        <h3 className="mb-2 text-lg font-semibold">Select a function</h3>
        <p className="max-w-md text-sm text-text-light-secondary dark:text-text-dark-secondary">
          Choose an entry from the left list to open syntax, examples, performance
          notes, and related APIs.
        </p>
      </div>
    );
  }

  const selectedExample = selectedFunction.examples[activeExample] ?? selectedFunction.examples[0];

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 border-b border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button type="button" onClick={onClose} className="btn btn-ghost text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button type="button" onClick={onClose} className="btn btn-ghost p-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-8 p-6 lg:p-8">
          <section className="border-b border-light-border pb-6 dark:border-dark-border">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${difficultyBadge[selectedFunction.difficulty]}`}
              >
                {selectedFunction.difficulty}
              </span>
              <span className="rounded-full border border-light-border px-2.5 py-1 text-[11px] text-text-light-tertiary dark:border-dark-border dark:text-text-dark-tertiary">
                {selectedFunction.category}
              </span>
              <span className="rounded-full border border-light-border px-2.5 py-1 text-[11px] text-text-light-tertiary dark:border-dark-border dark:text-text-dark-tertiary">
                {selectedFunction.examples.length} example
                {selectedFunction.examples.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="data-mono text-2xl font-bold tracking-tight text-text-light-primary dark:text-text-dark-primary">
                  {selectedFunction.name}
                </h2>
                <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  {selectedFunction.shortDescription}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleBookmark(selectedFunction.id)}
                  className={`rounded-lg border p-2 transition-colors ${
                    isBookmarked
                      ? 'border-brand-300 bg-brand-50 text-brand-600 dark:border-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
                      : 'border-light-border text-text-light-tertiary hover:text-text-light-primary dark:border-dark-border dark:text-text-dark-tertiary dark:hover:text-text-dark-primary'
                  }`}
                  aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark function'}
                >
                  <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleMastered(selectedFunction.id)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    isMastered
                      ? 'border-success-300 bg-success-50 text-success-700 dark:border-success-700 dark:bg-success-900/20 dark:text-success-400'
                      : 'border-light-border text-text-light-tertiary hover:text-text-light-primary dark:border-dark-border dark:text-text-dark-tertiary dark:hover:text-text-dark-primary'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  {isMastered ? 'Mastered' : 'Mark done'}
                </button>
              </div>
            </div>

            <p className="leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
              {selectedFunction.longDescription}
            </p>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
              Syntax
            </h3>
            <CodeBlock code={selectedFunction.syntax} label="Syntax" />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
                Examples
              </h3>
              {selectedFunction.examples.length > 1 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedFunction.examples.map((example, index) => (
                    <button
                      key={example.label}
                      type="button"
                      onClick={() => setActiveExample(index)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        activeExample === index
                          ? 'bg-brand-500 text-white'
                          : 'border border-light-border text-text-light-secondary hover:text-text-light-primary dark:border-dark-border dark:text-text-dark-secondary dark:hover:text-text-dark-primary'
                      }`}
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {selectedExample ? (
              <CodeBlock
                key={`${selectedFunction.id}-${activeExample}`}
                code={selectedExample.code}
                label={selectedExample.label}
                output={selectedExample.output}
              />
            ) : null}
          </section>

          {selectedFunction.parameters?.length ? (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
                Parameters
              </h3>
              <div className="grid gap-2 md:grid-cols-2">
                {selectedFunction.parameters.map((parameter) => (
                  <div
                    key={parameter.name}
                    className="rounded-lg border border-light-border bg-light-surface p-3 dark:border-dark-border dark:bg-dark-surface"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <code className="text-xs font-semibold">{parameter.name}</code>
                      <span className="rounded bg-light-active px-1.5 py-0.5 text-[11px] text-text-light-tertiary dark:bg-dark-active dark:text-text-dark-tertiary">
                        {parameter.type}
                      </span>
                    </div>
                    <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      {parameter.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {selectedFunction.returns ? (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
                Returns
              </h3>
              <div className="rounded-lg border border-light-border bg-light-surface p-3 dark:border-dark-border dark:bg-dark-surface">
                <code className="text-sm text-text-light-primary dark:text-text-dark-primary">
                  {selectedFunction.returns}
                </code>
              </div>
            </section>
          ) : null}

          {selectedFunction.notes?.length ? (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
                Notes
              </h3>
              <div className="space-y-2">
                {selectedFunction.notes.map((note) => (
                  <div
                    key={note}
                    className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-text-light-secondary dark:border-brand-800 dark:bg-brand-900/10 dark:text-text-dark-secondary"
                  >
                    {note}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {selectedFunction.performance ? (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
                Performance tip
              </h3>
              <div className="flex items-start gap-2 rounded-lg border border-warning-200 bg-warning-50 p-3 text-sm text-text-light-secondary dark:border-warning-800 dark:bg-warning-900/10 dark:text-text-dark-secondary">
                <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning-600 dark:text-warning-400" />
                <p>{selectedFunction.performance}</p>
              </div>
            </section>
          ) : null}

          {relatedFunctions.length ? (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
                See also
              </h3>
              <div className="flex flex-wrap gap-2">
                {relatedFunctions.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onSelectRelated(entry.id)}
                    className="inline-flex items-center gap-2 rounded-md border border-light-border bg-light-surface px-3 py-1.5 text-xs text-text-light-secondary transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-secondary dark:hover:border-brand-700 dark:hover:text-brand-400"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    <span className="data-mono">{entry.name}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {selectedFunction.tags.length ? (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedFunction.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-light-border bg-light-surface px-2.5 py-1 text-[11px] text-text-light-tertiary dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-tertiary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-light-border px-4 py-2 dark:border-dark-border lg:px-8">
        <button
          type="button"
          onClick={() => previousFunction && onNavigate(previousFunction)}
          disabled={!previousFunction}
          className="inline-flex items-center gap-1.5 rounded-md border border-light-border px-3 py-1.5 text-xs font-medium text-text-light-secondary transition-colors hover:text-text-light-primary disabled:opacity-40 dark:border-dark-border dark:text-text-dark-secondary dark:hover:text-text-dark-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {previousFunction ? previousFunction.name : 'Previous'}
        </button>

        <div className="hidden items-center gap-3 text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary md:flex">
          <span>↑↓ Navigate</span>
          <span>•</span>
          <span>B Bookmark</span>
          <span>•</span>
          <span>M Mastered</span>
        </div>

        <button
          type="button"
          onClick={() => nextFunction && onNavigate(nextFunction)}
          disabled={!nextFunction}
          className="inline-flex items-center gap-1.5 rounded-md border border-light-border px-3 py-1.5 text-xs font-medium text-text-light-secondary transition-colors hover:text-text-light-primary disabled:opacity-40 dark:border-dark-border dark:text-text-dark-secondary dark:hover:text-text-dark-primary"
        >
          {nextFunction ? nextFunction.name : 'Next'}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
