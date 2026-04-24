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
        <BookOpen className="mb-4 h-12 w-12 text-text-light-tertiary dark:text-on-surface-variant/70" />
        <h3 className="mb-2 text-lg font-semibold">Select a function</h3>
        <p className="max-w-md text-sm text-text-light-secondary dark:text-on-surface-variant">
          Choose an entry from the left list to open syntax, examples, performance
          notes, and related APIs.
        </p>
      </div>
    );
  }

  const selectedExample = selectedFunction.examples[activeExample] ?? selectedFunction.examples[0];

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 border-b border-light-border bg-light-bg dark:border-outline-variant dark:bg-surface lg:hidden">
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
          <section className="border-b border-light-border pb-6 dark:border-outline-variant">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 font-mono font-bold uppercase tracking-[0.14em] text-[11px] ${difficultyBadge[selectedFunction.difficulty]}`}
              >
                {selectedFunction.difficulty}
              </span>
              <span className="rounded-full border border-light-border px-2.5 py-1 text-[11px] text-text-light-tertiary dark:border-outline-variant dark:text-on-surface-variant/70">
                {selectedFunction.category}
              </span>
              <span className="rounded-full border border-light-border px-2.5 py-1 text-[11px] text-text-light-tertiary dark:border-outline-variant dark:text-on-surface-variant/70">
                {selectedFunction.examples.length} example
                {selectedFunction.examples.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="data-mono text-2xl font-bold tracking-tight text-text-light-primary dark:text-on-surface">
                  {selectedFunction.name}
                </h2>
                <p className="mt-2 text-sm text-text-light-secondary dark:text-on-surface-variant">
                  {selectedFunction.shortDescription}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleBookmark(selectedFunction.id)}
                  className={`rounded-[10px] border p-2 transition-colors ${
                    isBookmarked
                      ? 'border-brand-300 bg-brand-50 text-primary-dim dark:border-primary/40 dark:bg-primary/10 dark:text-primary'
                      : 'border-light-border text-text-light-tertiary hover:text-text-light-primary dark:border-outline-variant dark:text-on-surface-variant/70 dark:hover:text-on-surface'
                  }`}
                  aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark function'}
                >
                  <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleMastered(selectedFunction.id)}
                  className={`inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-xs font-bold transition-colors ${
                    isMastered
                      ? 'border-success-300 bg-success-50 text-success-700 dark:border-success-700 dark:bg-success-900/20 dark:text-success-400'
                      : 'border-light-border text-text-light-tertiary hover:text-text-light-primary dark:border-outline-variant dark:text-on-surface-variant/70 dark:hover:text-on-surface'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  {isMastered ? 'Mastered' : 'Mark done'}
                </button>
              </div>
            </div>

            <p className="leading-relaxed text-text-light-secondary dark:text-on-surface-variant">
              {selectedFunction.longDescription}
            </p>
          </section>

          <section>
            <h3 className="mb-3 font-mono font-bold uppercase tracking-[0.18em] text-xs text-text-light-tertiary dark:text-on-surface-variant/70">
              Syntax
            </h3>
            <CodeBlock code={selectedFunction.syntax} label="Syntax" />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-mono font-bold uppercase tracking-[0.18em] text-xs text-text-light-tertiary dark:text-on-surface-variant/70">
                Examples
              </h3>
              {selectedFunction.examples.length > 1 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedFunction.examples.map((example, index) => (
                    <button
                      key={example.label}
                      type="button"
                      onClick={() => setActiveExample(index)}
                      className={`rounded-[7px] px-2.5 py-1 text-xs font-medium transition-colors ${
                        activeExample === index
                          ? 'bg-primary text-white'
                          : 'border border-light-border text-text-light-secondary hover:text-text-light-primary dark:border-outline-variant dark:text-on-surface-variant dark:hover:text-on-surface'
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
              <h3 className="mb-3 font-mono font-bold uppercase tracking-[0.18em] text-xs text-text-light-tertiary dark:text-on-surface-variant/70">
                Parameters
              </h3>
              <div className="grid gap-2 md:grid-cols-2">
                {selectedFunction.parameters.map((parameter) => (
                  <div
                    key={parameter.name}
                    className="rounded-[10px] border border-light-border bg-light-surface p-3 dark:border-outline-variant dark:bg-surface-container"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <code className="data-mono text-xs font-bold">{parameter.name}</code>
                      <span className="rounded-[7px] bg-light-active px-1.5 py-0.5 text-[11px] text-text-light-tertiary dark:bg-surface-container-high dark:text-on-surface-variant/70">
                        {parameter.type}
                      </span>
                    </div>
                    <p className="text-xs text-text-light-secondary dark:text-on-surface-variant">
                      {parameter.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {selectedFunction.returns ? (
            <section>
              <h3 className="mb-3 font-mono font-bold uppercase tracking-[0.18em] text-xs text-text-light-tertiary dark:text-on-surface-variant/70">
                Returns
              </h3>
              <div className="rounded-[10px] border border-light-border bg-light-surface p-3 dark:border-outline-variant dark:bg-surface-container">
                <code className="text-sm text-text-light-primary dark:text-on-surface">
                  {selectedFunction.returns}
                </code>
              </div>
            </section>
          ) : null}

          {selectedFunction.notes?.length ? (
            <section>
              <h3 className="mb-3 font-mono font-bold uppercase tracking-[0.18em] text-xs text-text-light-tertiary dark:text-on-surface-variant/70">
                Notes
              </h3>
              <div className="space-y-2">
                {selectedFunction.notes.map((note) => (
                  <div
                    key={note}
                    className="rounded-[10px] border border-brand-200 bg-brand-50 p-3 text-sm text-text-light-secondary dark:border-primary/30 dark:bg-primary/10 dark:text-on-surface-variant"
                  >
                    {note}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {selectedFunction.performance ? (
            <section>
              <h3 className="mb-3 font-mono font-bold uppercase tracking-[0.18em] text-xs text-text-light-tertiary dark:text-on-surface-variant/70">
                Performance tip
              </h3>
              <div className="flex items-start gap-2 rounded-[10px] border border-warning-200 bg-warning-50 p-3 text-sm text-text-light-secondary dark:border-warning-800 dark:bg-warning-900/10 dark:text-on-surface-variant">
                <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning-600 dark:text-warning-400" />
                <p>{selectedFunction.performance}</p>
              </div>
            </section>
          ) : null}

          {relatedFunctions.length ? (
            <section>
              <h3 className="mb-3 font-mono font-bold uppercase tracking-[0.18em] text-xs text-text-light-tertiary dark:text-on-surface-variant/70">
                See also
              </h3>
              <div className="flex flex-wrap gap-2">
                {relatedFunctions.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onSelectRelated(entry.id)}
                    className="inline-flex items-center gap-2 rounded-[7px] border border-light-border bg-light-surface px-3 py-1.5 text-xs text-text-light-secondary transition-colors hover:border-brand-300 hover:text-primary-dim dark:border-outline-variant dark:bg-surface-container dark:text-on-surface-variant dark:hover:border-primary/40 dark:hover:text-primary"
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
              <h3 className="mb-3 font-mono font-bold uppercase tracking-[0.18em] text-xs text-text-light-tertiary dark:text-on-surface-variant/70">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedFunction.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-light-border bg-light-surface px-2.5 py-1 text-[11px] text-text-light-tertiary dark:border-outline-variant dark:bg-surface-container dark:text-on-surface-variant/70"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-light-border px-4 py-2 dark:border-outline-variant lg:px-8">
        <button
          type="button"
          onClick={() => previousFunction && onNavigate(previousFunction)}
          disabled={!previousFunction}
          className="inline-flex items-center gap-1.5 rounded-[7px] border border-light-border px-3 py-1.5 text-xs font-medium text-text-light-secondary transition-colors hover:text-text-light-primary disabled:opacity-40 dark:border-outline-variant dark:text-on-surface-variant dark:hover:text-on-surface"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {previousFunction ? previousFunction.name : 'Previous'}
        </button>

        <div className="hidden items-center gap-3 text-[11px] text-text-light-tertiary dark:text-on-surface-variant/70 md:flex">
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
          className="inline-flex items-center gap-1.5 rounded-[7px] border border-light-border px-3 py-1.5 text-xs font-medium text-text-light-secondary transition-colors hover:text-text-light-primary disabled:opacity-40 dark:border-outline-variant dark:text-on-surface-variant dark:hover:text-on-surface"
        >
          {nextFunction ? nextFunction.name : 'Next'}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
