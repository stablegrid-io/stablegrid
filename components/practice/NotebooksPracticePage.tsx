'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Flag,
  Lightbulb,
  NotebookPen,
  RotateCcw
} from 'lucide-react';
import { NOTEBOOKS, type NotebookDefinition, type NotebookIssue } from '@/data/notebooks';

type NotebookView = 'catalog' | 'review' | 'results';
type NotebookFilter = 'all' | 'new' | 'completed';

const FILTERS: Array<{ id: NotebookFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'completed', label: 'Completed' }
];

const DIFFICULTY_STYLES: Record<
  NotebookDefinition['difficulty'],
  { badge: string }
> = {
  Beginner: {
    badge:
      'border-success-200 bg-success-50 text-success-700 dark:border-success-700/60 dark:bg-success-900/30 dark:text-success-300'
  },
  Intermediate: {
    badge:
      'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-700/60 dark:bg-warning-900/30 dark:text-warning-300'
  },
  Advanced: {
    badge:
      'border-error-200 bg-error-50 text-error-700 dark:border-error-700/60 dark:bg-error-900/30 dark:text-error-300'
  }
};

const SEVERITY_STYLES: Record<
  NotebookIssue['severity'],
  { label: string; badge: string; icon: string }
> = {
  performance: {
    label: 'Performance',
    icon: '⚡',
    badge:
      'border-error-200 bg-error-50 text-error-700 dark:border-error-700/60 dark:bg-error-900/30 dark:text-error-300'
  },
  practice: {
    label: 'Best Practice',
    icon: '🧩',
    badge:
      'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-700/60 dark:bg-warning-900/30 dark:text-warning-300'
  },
  redundant: {
    label: 'Redundant',
    icon: '♻',
    badge:
      'border-light-border bg-light-bg text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary'
  }
};

function getUniqueIssues(notebook: NotebookDefinition): NotebookIssue[] {
  const map = new Map<string, NotebookIssue>();

  notebook.cells.forEach((cell) => {
    cell.issues?.forEach((issue) => {
      if (!map.has(issue.id)) {
        map.set(issue.id, issue);
      }
    });
  });

  return Array.from(map.values());
}

interface NumberedLine {
  id: string;
  text: string;
  flaggable: boolean;
  issueId?: string;
  lineNumber: number;
}

export function NotebooksPracticePage() {
  const [view, setView] = useState<NotebookView>('catalog');
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [flaggedLineIds, setFlaggedLineIds] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [completedNotebookIds, setCompletedNotebookIds] = useState<Set<string>>(
    new Set()
  );
  const [filter, setFilter] = useState<NotebookFilter>('all');

  const activeNotebook = useMemo(
    () => NOTEBOOKS.find((notebook) => notebook.id === activeNotebookId) ?? null,
    [activeNotebookId]
  );

  const filteredNotebooks = useMemo(() => {
    if (filter === 'completed') {
      return NOTEBOOKS.filter((notebook) => completedNotebookIds.has(notebook.id));
    }

    if (filter === 'new') {
      return NOTEBOOKS.filter((notebook) => !completedNotebookIds.has(notebook.id));
    }

    return NOTEBOOKS;
  }, [completedNotebookIds, filter]);

  const completionStats = useMemo(() => {
    const total = NOTEBOOKS.length;
    const completed = completedNotebookIds.size;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, completionPct };
  }, [completedNotebookIds]);

  const uniqueIssues = useMemo(() => {
    if (!activeNotebook) return [];
    return getUniqueIssues(activeNotebook);
  }, [activeNotebook]);

  const allCodeLines = useMemo(() => {
    if (!activeNotebook) return [] as NumberedLine[];

    let lineNumber = 0;
    const result: NumberedLine[] = [];

    activeNotebook.cells.forEach((cell) => {
      if (cell.type !== 'code') return;
      (cell.lines ?? []).forEach((line) => {
        lineNumber += 1;
        result.push({
          id: line.id,
          text: line.text,
          flaggable: Boolean(line.flaggable),
          issueId: line.issueId,
          lineNumber
        });
      });
    });

    return result;
  }, [activeNotebook]);

  const foundIssueIds = useMemo(() => {
    const found = new Set<string>();
    allCodeLines.forEach((line) => {
      if (flaggedLineIds.has(line.id) && line.issueId) {
        found.add(line.issueId);
      }
    });
    return found;
  }, [allCodeLines, flaggedLineIds]);

  const falseFlagCount = useMemo(() => {
    return allCodeLines.filter(
      (line) => flaggedLineIds.has(line.id) && !line.issueId
    ).length;
  }, [allCodeLines, flaggedLineIds]);

  const score = useMemo(() => {
    if (!activeNotebook || uniqueIssues.length === 0) return 0;
    const found = foundIssueIds.size;
    const penalty = falseFlagCount * 0.35;
    const raw = ((found - penalty) / uniqueIssues.length) * 100;
    return Math.max(0, Math.round(raw));
  }, [activeNotebook, falseFlagCount, foundIssueIds, uniqueIssues.length]);

  const lineLookup = useMemo(() => {
    const map = new Map<string, NumberedLine>();
    allCodeLines.forEach((line) => {
      map.set(line.id, line);
    });
    return map;
  }, [allCodeLines]);

  const startNotebook = useCallback((notebookId: string) => {
    setActiveNotebookId(notebookId);
    setFlaggedLineIds(new Set());
    setShowHint(false);
    setView('review');
  }, []);

  const toggleLineFlag = useCallback(
    (lineId: string) => {
      if (view !== 'review') return;
      const line = lineLookup.get(lineId);
      if (!line?.flaggable) return;

      setFlaggedLineIds((previous) => {
        const next = new Set(previous);
        if (next.has(lineId)) {
          next.delete(lineId);
        } else {
          next.add(lineId);
        }
        return next;
      });
    },
    [lineLookup, view]
  );

  const handleSubmitReview = useCallback(() => {
    if (!activeNotebook) return;
    setView('results');
    setCompletedNotebookIds((previous) => {
      const next = new Set(previous);
      next.add(activeNotebook.id);
      return next;
    });
  }, [activeNotebook]);

  const handleRetry = useCallback(() => {
    setFlaggedLineIds(new Set());
    setShowHint(false);
    setView('review');
  }, []);

  const handleBackToCatalog = useCallback(() => {
    setActiveNotebookId(null);
    setFlaggedLineIds(new Set());
    setShowHint(false);
    setView('catalog');
  }, []);

  if (view === 'catalog') {
    return (
      <main className="min-h-screen bg-light-bg px-6 pb-16 pt-10 dark:bg-dark-bg">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
          <header className="flex flex-col gap-3">
            <p className="data-mono text-xs uppercase tracking-[0.35em] text-brand-500/80">
              Practice · Notebook Reviews
            </p>
            <h1 className="text-4xl font-semibold text-text-light-primary dark:text-text-dark-primary md:text-5xl font-display">
              Notebooks
            </h1>
            <p className="max-w-3xl text-sm text-text-light-secondary dark:text-text-dark-secondary md:text-base">
              Review production-style Fabric notebooks and flag risky lines before
              they hit pipeline reliability.
            </p>
          </header>

          <section className="card flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  {completionStats.completed} of {completionStats.total} completed
                </p>
                <div className="h-1.5 w-44 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${completionStats.completionPct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {FILTERS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFilter(option.id)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                      filter === option.id
                        ? 'bg-text-light-primary text-white dark:bg-white dark:text-dark-bg'
                        : 'border border-light-border bg-light-surface text-text-light-tertiary hover:text-text-light-primary dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-tertiary dark:hover:text-text-dark-primary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {filteredNotebooks.length > 0 ? (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredNotebooks.map((notebook) => {
                const difficultyStyle = DIFFICULTY_STYLES[notebook.difficulty];
                const completed = completedNotebookIds.has(notebook.id);

                return (
                  <button
                    key={notebook.id}
                    type="button"
                    onClick={() => startNotebook(notebook.id)}
                    className="group card card-hover flex h-full flex-col items-start gap-4 p-5 text-left"
                  >
                    <div className="flex w-full items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300">
                          <NotebookPen className="h-4.5 w-4.5" />
                        </span>
                        <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                          {notebook.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${difficultyStyle.badge}`}
                      >
                        {notebook.difficulty}
                      </span>
                      {notebook.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-light-border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-text-light-tertiary dark:border-dark-border dark:text-text-dark-tertiary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <p className="line-clamp-3 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      {notebook.context}
                    </p>

                    <div className="mt-auto flex w-full items-center justify-between border-t border-light-border/80 pt-3 text-xs text-text-light-tertiary dark:border-dark-border dark:text-text-dark-tertiary">
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-error-500" />
                        {notebook.totalIssues} issues
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5 text-brand-500" />~{notebook.estimatedMinutes} min
                      </span>
                    </div>

                    {completed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success-600 dark:text-success-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completed
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </section>
          ) : (
            <section className="card p-10 text-center">
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                No notebooks match this filter.
              </p>
            </section>
          )}
        </div>
      </main>
    );
  }

  if (!activeNotebook) {
    return null;
  }

  const isReview = view === 'review';
  const isResults = view === 'results';
  const issueCountBySeverity = uniqueIssues.reduce<Record<string, number>>(
    (accumulator, issue) => {
      accumulator[issue.severity] = (accumulator[issue.severity] ?? 0) + 1;
      return accumulator;
    },
    {}
  );

  let renderedLineCount = 0;

  return (
    <main className="min-h-screen bg-light-bg px-4 pb-16 pt-6 dark:bg-dark-bg sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <section className="sticky top-16 z-20 rounded-xl border border-light-border bg-white/95 px-4 py-3 backdrop-blur dark:border-dark-border dark:bg-[#0c121d]/95">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleBackToCatalog}
                className="btn btn-ghost h-8 px-2.5 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                {activeNotebook.title}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  DIFFICULTY_STYLES[activeNotebook.difficulty].badge
                }`}
              >
                {activeNotebook.difficulty}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isReview ? (
                <>
                  <span className="rounded-full border border-light-border bg-light-surface px-2.5 py-1 text-[11px] font-medium text-text-light-tertiary dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-tertiary">
                    {flaggedLineIds.size} flagged
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHint((previous) => !previous)}
                    className={`btn h-8 px-2.5 text-xs ${
                      showHint ? 'btn-secondary' : 'btn-ghost'
                    }`}
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    Hint
                  </button>
                  <button
                    type="button"
                    disabled={flaggedLineIds.size === 0}
                    onClick={handleSubmitReview}
                    className="btn btn-primary h-8 px-3 text-xs"
                  >
                    Submit Review
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="btn btn-secondary h-8 px-3 text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToCatalog}
                    className="btn btn-primary h-8 px-3 text-xs"
                  >
                    Back to Notebooks
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="card p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
            Scenario
          </p>
          <p className="mt-2 text-sm leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
            {activeNotebook.context}
          </p>
        </section>

        {showHint && isReview ? (
          <section className="rounded-xl border border-warning-200 bg-warning-50/50 p-4 dark:border-warning-700/50 dark:bg-warning-900/20">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-warning-700 dark:text-warning-300">
              Hint
            </p>
            <p className="mt-1 text-sm text-warning-700 dark:text-warning-200">
              There are {uniqueIssues.length} unique issues. Focus on repeated
              actions, driver-side conversions, and anti-pattern imports.
            </p>
          </section>
        ) : null}

        {isResults ? (
          <section className="rounded-2xl border border-brand-300 bg-brand-500/10 p-5 dark:border-brand-700/60 dark:bg-brand-900/25">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
              Review Score
            </p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div className="text-4xl font-bold leading-none text-text-light-primary dark:text-text-dark-primary">
                {score}%
              </div>
              <div className="flex items-center gap-5 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                <span>Found {foundIssueIds.size}/{uniqueIssues.length}</span>
                <span>False flags {falseFlagCount}</span>
              </div>
            </div>
          </section>
        ) : null}

        <section className="space-y-3">
          {activeNotebook.cells.map((cell, cellIndex) => {
            if (cell.type === 'markdown') {
              return (
                <article key={cell.id} className="card p-4 sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
                    Markdown Cell {cellIndex + 1}
                  </p>
                  <div className="mt-2 space-y-2">
                    {(cell.content ?? '').split('\n').map((line) => {
                      if (line.startsWith('# ')) {
                        return (
                          <h2
                            key={`${cell.id}-${line}`}
                            className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary"
                          >
                            {line.replace('# ', '')}
                          </h2>
                        );
                      }

                      return (
                        <p
                          key={`${cell.id}-${line}`}
                          className="text-sm leading-relaxed text-text-light-secondary dark:text-text-dark-secondary"
                        >
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </article>
              );
            }

            const lines = cell.lines ?? [];

            return (
              <article key={cell.id} className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-light-border bg-light-surface px-4 py-2 dark:border-dark-border dark:bg-dark-surface">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
                    Python Cell {cellIndex + 1}
                  </p>
                  {isResults ? (
                    <p className="text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
                      {
                        cell.issues?.filter((issue) => foundIssueIds.has(issue.id))
                          .length
                      }
                      /{cell.issues?.length ?? 0} found
                    </p>
                  ) : null}
                </div>

                <div className="bg-[#0b1220] py-1.5 dark:bg-[#050913]">
                  {lines.map((line) => {
                    renderedLineCount += 1;
                    const flagged = flaggedLineIds.has(line.id);
                    const hasIssue = Boolean(line.issueId);
                    const correctFlag = isResults && flagged && hasIssue;
                    const missedIssue = isResults && !flagged && hasIssue;
                    const falseFlag = isResults && flagged && !hasIssue;

                    let rowClass =
                      'border-l-2 border-transparent bg-transparent hover:bg-white/[0.04]';
                    if (isReview && flagged) {
                      rowClass = 'border-l-2 border-error-400 bg-error-500/12';
                    }
                    if (correctFlag) {
                      rowClass = 'border-l-2 border-success-400 bg-success-500/12';
                    }
                    if (missedIssue) {
                      rowClass = 'border-l-2 border-warning-400 bg-warning-500/14';
                    }
                    if (falseFlag) {
                      rowClass = 'border-l-2 border-error-400 bg-error-500/12';
                    }

                    const clickable = isReview && Boolean(line.flaggable);

                    return (
                      <div
                        key={line.id}
                        role={clickable ? 'button' : undefined}
                        tabIndex={clickable ? 0 : undefined}
                        onClick={() => {
                          if (clickable) toggleLineFlag(line.id);
                        }}
                        onKeyDown={(event) => {
                          if (!clickable) return;
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            toggleLineFlag(line.id);
                          }
                        }}
                        className={`group flex items-start gap-3 px-3 py-0.5 ${rowClass} ${
                          clickable ? 'cursor-pointer' : 'cursor-default'
                        }`}
                      >
                        <span className="w-8 pt-0.5 text-right text-[11px] text-text-dark-tertiary">
                          {renderedLineCount}
                        </span>
                        <code className="flex-1 whitespace-pre text-[13px] leading-6 text-[#d8e4ff]">
                          {line.text || ' '}
                        </code>
                        <span className="pt-1 text-[11px] text-[#9fb4d8]">
                          {isReview && flagged ? <Flag className="h-3.5 w-3.5" /> : null}
                          {correctFlag ? <CheckCircle2 className="h-3.5 w-3.5 text-success-400" /> : null}
                          {missedIssue ? <AlertTriangle className="h-3.5 w-3.5 text-warning-400" /> : null}
                          {falseFlag ? <AlertTriangle className="h-3.5 w-3.5 text-error-400" /> : null}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>

        {isResults ? (
          <section className="card p-5">
            <h2 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
              Issue Breakdown
            </h2>
            <div className="mt-4 space-y-3">
              {uniqueIssues.map((issue) => {
                const found = foundIssueIds.has(issue.id);
                const severity = SEVERITY_STYLES[issue.severity];
                return (
                  <article
                    key={issue.id}
                    className={`rounded-xl border p-4 ${
                      found
                        ? 'border-success-200 bg-success-50/50 dark:border-success-700/50 dark:bg-success-900/20'
                        : 'border-warning-200 bg-warning-50/50 dark:border-warning-700/50 dark:bg-warning-900/20'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${severity.badge}`}
                      >
                        {severity.icon} {severity.label}
                      </span>
                      <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                        {issue.title}
                      </span>
                      <span
                        className={`ml-auto text-[11px] font-semibold uppercase tracking-[0.1em] ${
                          found
                            ? 'text-success-700 dark:text-success-300'
                            : 'text-warning-700 dark:text-warning-300'
                        }`}
                      >
                        {found ? 'Found' : 'Missed'}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
                      {issue.explanation}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="pb-8 text-center text-xs uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
            Flag lines that contain issues, then submit your review
          </div>
        )}

        {isReview ? (
          <section className="card p-4">
            <div className="grid gap-3 text-xs sm:grid-cols-3">
              <div className="rounded-lg border border-light-border bg-light-surface p-3 dark:border-dark-border dark:bg-dark-surface">
                <p className="font-semibold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
                  Issues
                </p>
                <p className="mt-1 text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                  {uniqueIssues.length}
                </p>
              </div>
              <div className="rounded-lg border border-light-border bg-light-surface p-3 dark:border-dark-border dark:bg-dark-surface">
                <p className="font-semibold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
                  Severity Mix
                </p>
                <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  Perf {issueCountBySeverity.performance ?? 0} · Practice{' '}
                  {issueCountBySeverity.practice ?? 0} · Redundant{' '}
                  {issueCountBySeverity.redundant ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-light-border bg-light-surface p-3 dark:border-dark-border dark:bg-dark-surface">
                <p className="font-semibold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
                  Flagged
                </p>
                <p className="mt-1 text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                  {flaggedLineIds.size}
                </p>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
