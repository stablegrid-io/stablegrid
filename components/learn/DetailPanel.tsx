'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Link2, X, Zap } from 'lucide-react';
import type { FunctionEntry } from '@/types/learn';
import { CodeBlock } from '@/components/learn/CodeBlock';

interface DetailPanelProps {
  selectedFunction: FunctionEntry | null;
  allFunctions: FunctionEntry[];
  onSelectRelated: (id: string) => void;
  onClose: () => void;
}

const difficultyBadge: Record<FunctionEntry['difficulty'], string> = {
  beginner: 'badge badge-success',
  intermediate: 'badge badge-warning',
  advanced: 'badge badge-error'
};

export const DetailPanel = ({
  selectedFunction,
  allFunctions,
  onSelectRelated,
  onClose
}: DetailPanelProps) => {
  if (!selectedFunction) {
    return (
      <div className="hidden h-full flex-col items-center justify-center p-8 text-center lg:flex">
        <BookOpen className="mb-4 h-12 w-12 text-text-light-tertiary dark:text-text-dark-tertiary" />
        <h3 className="mb-2 text-lg font-semibold">Select a Function</h3>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          Choose an entry from the list to open full documentation and examples.
        </p>
      </div>
    );
  }

  const relatedFunctions = (selectedFunction.relatedFunctions ?? [])
    .map((id) => allFunctions.find((entry) => entry.id === id))
    .filter((entry): entry is FunctionEntry => Boolean(entry));

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedFunction.id}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.18 }}
        className="h-full overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex justify-end border-b border-light-border bg-light-bg p-4 dark:border-dark-border dark:bg-dark-bg lg:hidden">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-8 p-6 lg:p-8">
          <div>
            <div className="mb-4 flex flex-wrap items-start gap-2">
              <span className={difficultyBadge[selectedFunction.difficulty]}>
                {selectedFunction.difficulty}
              </span>
              <span className="badge border border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300">
                {selectedFunction.category}
              </span>
            </div>
            <h2 className="mb-3 text-2xl font-bold">{selectedFunction.name}</h2>
            <p className="leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
              {selectedFunction.longDescription}
            </p>
          </div>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
              Syntax
            </h3>
            <div className="rounded-lg border border-light-border bg-light-muted p-4 dark:border-dark-border dark:bg-dark-muted">
              <code className="text-sm text-brand-600 dark:text-brand-400">
                {selectedFunction.syntax}
              </code>
            </div>
          </section>

          {selectedFunction.parameters?.length ? (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
                Parameters
              </h3>
              <div className="space-y-2">
                {selectedFunction.parameters.map((param) => (
                  <div
                    key={param.name}
                    className="rounded-lg border border-light-border p-4 dark:border-dark-border"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <code className="font-semibold">{param.name}</code>
                      <span className="rounded bg-light-surface px-2 py-0.5 text-xs dark:bg-dark-surface">
                        {param.type}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          param.required
                            ? 'bg-error-50 text-error-700 dark:bg-error-900/20 dark:text-error-400'
                            : 'bg-light-surface text-text-light-tertiary dark:bg-dark-surface dark:text-text-dark-tertiary'
                        }`}
                      >
                        {param.required
                          ? 'required'
                          : `optional${param.default ? ` (default ${param.default})` : ''}`}
                      </span>
                    </div>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      {param.description}
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
              <div className="rounded-lg border border-light-border bg-light-muted p-4 dark:border-dark-border dark:bg-dark-muted">
                <code className="text-sm">{selectedFunction.returns}</code>
              </div>
            </section>
          ) : null}

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
              Examples
            </h3>
            <div className="space-y-4">
              {selectedFunction.examples.map((example, index) => (
                <CodeBlock
                  key={`${selectedFunction.id}-${index}`}
                  code={example.code}
                  label={example.label}
                  output={example.output}
                />
              ))}
            </div>
          </section>

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
                Performance
              </h3>
              <div className="flex items-start gap-3 rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/10">
                <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning-600 dark:text-warning-400" />
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  {selectedFunction.performance}
                </p>
              </div>
            </section>
          ) : null}

          {relatedFunctions.length ? (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
                Related
              </h3>
              <div className="flex flex-wrap gap-2">
                {relatedFunctions.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onSelectRelated(entry.id)}
                    className="flex items-center gap-2 rounded-lg border border-light-border px-3 py-2 text-sm transition-colors hover:border-brand-400 dark:border-dark-border dark:hover:border-brand-600"
                  >
                    <Link2 className="h-3.5 w-3.5 text-brand-500" />
                    <code>{entry.name}</code>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedFunction.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-light-border bg-light-surface px-3 py-1 text-xs text-text-light-secondary dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-secondary"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </section>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
