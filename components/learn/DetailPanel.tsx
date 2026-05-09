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
    'border-success-200 bg-success-50 text-success-700   ',
  intermediate:
    'border-warning-200 bg-warning-50 text-warning-700   ',
  advanced:
    'border-violet-200 bg-violet-50 text-violet-700   '
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
        <BookOpen className="mb-4 h-12 w-12 text-on-surface-variant" />
        <h3 className="mb-2 text-lg font-semibold">Select a function</h3>
        <p className="max-w-md text-sm text-on-surface-variant">
          Choose an entry from the left list to open syntax, examples, performance
          notes, and related APIs.
        </p>
      </div>
    );
  }

  const selectedExample = selectedFunction.examples[activeExample] ?? selectedFunction.examples[0];

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 border-b border-surface-dim bg-surface lg:hidden">
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
          <section className="border-b border-surface-dim pb-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 font-mono font-bold uppercase tracking-[0.14em] text-[11px] ${difficultyBadge[selectedFunction.difficulty]}`}
              >
                {selectedFunction.difficulty}
              </span>
              <span className="rounded-full border border-surface-dim px-2.5 py-1 text-[11px] text-on-surface-variant">
                {selectedFunction.category}
              </span>
              <span className="rounded-full border border-surface-dim px-2.5 py-1 text-[11px] text-on-surface-variant">
                {selectedFunction.examples.length} example
                {selectedFunction.examples.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="data-mono text-2xl font-bold tracking-tight text-on-surface">
                  {selectedFunction.name}
                </h2>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {selectedFunction.shortDescription}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleBookmark(selectedFunction.id)}
                  className={` border p-2 transition-colors ${
                    isBookmarked
                      ? 'border-primary-fixed-dim bg-primary-fixed text-primary-dim   '
                      : 'border-surface-dim text-on-surface-variant hover:text-on-surface   '
                  }`}
                  aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark function'}
                >
                  <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleMastered(selectedFunction.id)}
                  className={`inline-flex items-center gap-2  border px-3 py-2 text-xs font-bold transition-colors ${
                    isMastered
                      ? 'border-success-300 bg-success-50 text-success-700   '
                      : 'border-surface-dim text-on-surface-variant hover:text-on-surface   '
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  {isMastered ? 'Mastered' : 'Mark done'}
                </button>
              </div>
            </div>

            <p className="leading-relaxed text-on-surface-variant">
              {selectedFunction.longDescription}
            </p>
          </section>

          <section>
            <h3 className="mb-3 font-mono font-bold uppercase tracking-[0.18em] text-xs text-on-surface-variant">
              Syntax
            </h3>
            <CodeBlock code={selectedFunction.syntax} label="Syntax" />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-mono font-bold uppercase tracking-[0.18em] text-xs text-on-surface-variant">
                Examples
              </h3>
              {selectedFunction.examples.length > 1 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedFunction.examples.map((example, index) => (
                    <button
                      key={example.label}
                      type="button"
                      onClick={() => setActiveExample(index)}
                      className={` px-2.5 py-1 text-xs font-medium transition-colors ${
                        activeExample === index
                          ? 'bg-primary text-on-surface'
                          : 'border border-surface-dim text-on-surface-variant hover:text-on-surface   '
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
              <h3 className="mb-3 font-mono font-bold uppercase tracking-[0.18em] text-xs text-on-surface-variant">
                Parameters
              </h3>
              <div className="grid gap-2 md:grid-cols-2">
                {selectedFunction.parameters.map((parameter) => (
                  <div
                    key={parameter.name}
                    className="border border-surface-dim bg-surface-container p-3"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <code className="data-mono text-xs font-bold">{parameter.name}</code>
                      <span className="bg-surface-container px-1.5 py-0.5 text-[11px] text-on-surface-variant">
                        {parameter.type}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {parameter.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {selectedFunction.returns ? (
            <section>
              <h3 className="mb-3 font-mono font-bold uppercase tracking-[0.18em] text-xs text-on-surface-variant">
                Returns
              </h3>
              <div className="border border-surface-dim bg-surface-container p-3">
                <code className="text-sm text-on-surface">
                  {selectedFunction.returns}
                </code>
              </div>
            </section>
          ) : null}

          {selectedFunction.notes?.length ? (
            <section>
              <h3 className="mb-3 font-mono font-bold uppercase tracking-[0.18em] text-xs text-on-surface-variant">
                Notes
              </h3>
              <div className="space-y-2">
                {selectedFunction.notes.map((note) => (
                  <div
                    key={note}
                    className="border border-primary-fixed bg-primary-fixed p-3 text-sm text-on-surface-variant"
                  >
                    {note}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {selectedFunction.performance ? (
            <section>
              <h3 className="mb-3 font-mono font-bold uppercase tracking-[0.18em] text-xs text-on-surface-variant">
                Performance tip
              </h3>
              <div className="flex items-start gap-2 border border-warning-200 bg-warning-50 p-3 text-sm text-on-surface-variant">
                <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning-600" />
                <p>{selectedFunction.performance}</p>
              </div>
            </section>
          ) : null}

          {relatedFunctions.length ? (
            <section>
              <h3 className="mb-3 font-mono font-bold uppercase tracking-[0.18em] text-xs text-on-surface-variant">
                See also
              </h3>
              <div className="flex flex-wrap gap-2">
                {relatedFunctions.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onSelectRelated(entry.id)}
                    className="inline-flex items-center gap-2 border border-surface-dim bg-surface-container px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:border-primary-fixed-dim hover:text-primary-dim"
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
              <h3 className="mb-3 font-mono font-bold uppercase tracking-[0.18em] text-xs text-on-surface-variant">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedFunction.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-surface-dim bg-surface-container px-2.5 py-1 text-[11px] text-on-surface-variant"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-surface-dim px-4 py-2 lg:px-8">
        <button
          type="button"
          onClick={() => previousFunction && onNavigate(previousFunction)}
          disabled={!previousFunction}
          className="inline-flex items-center gap-1.5 border border-surface-dim px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-40"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {previousFunction ? previousFunction.name : 'Previous'}
        </button>

        <div className="hidden items-center gap-3 text-[11px] text-on-surface-variant md:flex">
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
          className="inline-flex items-center gap-1.5 border border-surface-dim px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-40"
        >
          {nextFunction ? nextFunction.name : 'Next'}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
