'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Flag,
  Lightbulb,
  NotebookPen,
  RotateCcw,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { NOTEBOOKS, type NotebookDefinition, type NotebookIssue } from '@/data/notebooks';
import { LightbulbPulseFeedback } from '@/components/feedback/LightbulbPulseFeedback';

type NotebookView = 'catalog' | 'review' | 'results';
type NotebookFilter = 'all' | 'new' | 'completed';

const FILTERS: Array<{ id: NotebookFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'completed', label: 'Completed' }
];
const NOTEBOOK_ID_SET = new Set(NOTEBOOKS.map((notebook) => notebook.id));

const DIFFICULTY_STYLES: Record<
  NotebookDefinition['difficulty'],
  { badge: string; accentRgb: string; eyebrow: string }
> = {
  Beginner: {
    badge:
      'border-success-300/70 bg-success-500/10 text-success-600 dark:border-success-500/30 dark:bg-success-500/15 dark:text-success-300',
    accentRgb: '16,185,129',
    eyebrow: 'Starter review'
  },
  Intermediate: {
    badge:
      'border-warning-300/70 bg-warning-500/10 text-warning-600 dark:border-warning-500/30 dark:bg-warning-500/15 dark:text-warning-300',
    accentRgb: '245,158,11',
    eyebrow: 'Operations review'
  },
  Advanced: {
    badge:
      'border-error-300/70 bg-error-500/10 text-error-600 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-300',
    accentRgb: '239,68,68',
    eyebrow: 'Critical review'
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

const IMPORT_LINE_PATTERN = /^(from\s+\S+\s+import|import\s+)/;
const DISPLAY_LINE_PATTERN = /^(display|print)\s*\(|\.\s*show\s*\(/;
const ASSIGNMENT_LINE_PATTERN = /^[A-Za-z_][\w.]*\s*=/;
const CONTROL_LINE_PATTERN =
  /^(if|elif|else|for|while|try|except|finally|with|def|class)\b/;
const COMMENT_LINE_PATTERN = /^#/;

const trimLine = (line: string) => line.trim();

const isImportLine = (line: string) => IMPORT_LINE_PATTERN.test(trimLine(line));
const isDisplayLine = (line: string) => DISPLAY_LINE_PATTERN.test(trimLine(line));
const isAssignmentLine = (line: string) =>
  ASSIGNMENT_LINE_PATTERN.test(trimLine(line));
const isControlLine = (line: string) => CONTROL_LINE_PATTERN.test(trimLine(line));
const isCommentLine = (line: string) => COMMENT_LINE_PATTERN.test(trimLine(line));

const shouldAddVisualGap = (previousLine: string, currentLine: string) => {
  const previous = trimLine(previousLine);
  const current = trimLine(currentLine);

  if (!previous || !current) return false;

  if (isImportLine(previous) && !isImportLine(current)) return true;
  if (isDisplayLine(previous) && isAssignmentLine(current)) return true;
  if (isCommentLine(current) && !isCommentLine(previous)) return true;
  if (isControlLine(current) && !isControlLine(previous)) return true;

  return false;
};

const NOTEBOOK_PYTHON_KEYWORDS = [
  'import',
  'from',
  'as',
  'def',
  'class',
  'return',
  'if',
  'elif',
  'else',
  'for',
  'while',
  'try',
  'except',
  'finally',
  'with',
  'in',
  'is',
  'not',
  'and',
  'or',
  'lambda',
  'yield',
  'await',
  'async',
  'True',
  'False',
  'None',
  'pass',
  'break',
  'continue'
];

const buildNotebookTokenRegex = (keywords: string[]) =>
  new RegExp(
    [
      '(?<comment>#.*$)',
      '(?<string>"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\')',
      '(?<number>\\b\\d+(?:\\.\\d+)?\\b)',
      '(?<decorator>@[A-Za-z_]\\w*)',
      `(?<keyword>\\b(?:${keywords.join('|')})\\b)`,
      '(?<function>\\b[A-Za-z_]\\w*(?=\\s*\\())'
    ].join('|'),
    'g'
  );

const NOTEBOOK_PYTHON_REGEX = buildNotebookTokenRegex(NOTEBOOK_PYTHON_KEYWORDS);
const NOTEBOOK_MARKDOWN_HEADING_PATTERN = /^#+\s*/;
const NOTEBOOK_MARKDOWN_BULLET_PATTERN = /^[-*]\s+/;

const notebookTokenClass = (type: string) => {
  if (type === 'comment') {
    return 'text-slate-500';
  }
  if (type === 'string') {
    return 'text-emerald-300';
  }
  if (type === 'number') {
    return 'text-sky-300';
  }
  if (type === 'decorator') {
    return 'text-amber-300';
  }
  if (type === 'keyword') {
    return 'font-medium text-violet-300';
  }
  if (type === 'function') {
    return 'text-blue-200';
  }
  return 'text-slate-200';
};

const highlightNotebookLine = (line: string, lineKey: string): ReactNode[] => {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  NOTEBOOK_PYTHON_REGEX.lastIndex = 0;

  for (const match of line.matchAll(NOTEBOOK_PYTHON_REGEX)) {
    const index = match.index ?? 0;
    const token = match[0];

    if (index > lastIndex) {
      parts.push(line.slice(lastIndex, index));
    }

    const groups = match.groups ?? {};
    const type =
      Object.keys(groups).find((key) => Boolean(groups[key])) ?? 'plain';

    parts.push(
      <span key={`${lineKey}-${index}`} className={notebookTokenClass(type)}>
        {token}
      </span>
    );

    lastIndex = index + token.length;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [line];
};

const extractNotebookMarkdownHeading = (line: string) =>
  line.replace(NOTEBOOK_MARKDOWN_HEADING_PATTERN, '').trim();

const buildRequirementBullets = (lines: string[]) => {
  return lines
    .map((line) => line.replace(NOTEBOOK_MARKDOWN_BULLET_PATTERN, '').trim())
    .filter(Boolean)
    .flatMap((line) =>
      line
        .split(/(?<=[.!?])\s+/)
        .map((segment) => segment.trim())
        .filter(Boolean)
    );
};

const sanitizeCompletedNotebookIds = (value: unknown) => {
  if (!Array.isArray(value)) return [] as string[];

  const uniqueIds = new Set(
    value.filter(
      (item): item is string => typeof item === 'string' && NOTEBOOK_ID_SET.has(item)
    )
  );

  return Array.from(uniqueIds);
};

export function NotebooksPracticePage() {
  const [view, setView] = useState<NotebookView>('catalog');
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [flaggedLineIds, setFlaggedLineIds] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [completedNotebookIds, setCompletedNotebookIds] = useState<Set<string>>(
    new Set()
  );
  const [isLoadingCompletion, setIsLoadingCompletion] = useState(true);
  const [filter, setFilter] = useState<NotebookFilter>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

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

  useEffect(() => {
    let isCancelled = false;

    const loadNotebookProgress = async () => {
      try {
        const response = await fetch('/api/practice/notebooks/progress', {
          method: 'GET'
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          data?: { completedNotebookIds?: unknown };
        };
        const completedIds = sanitizeCompletedNotebookIds(
          payload?.data?.completedNotebookIds
        );

        if (!isCancelled) {
          setCompletedNotebookIds(new Set(completedIds));
        }
      } catch (error) {
        console.error('Failed to load notebook progress:', error);
      } finally {
        if (!isCancelled) {
          setIsLoadingCompletion(false);
        }
      }
    };

    void loadNotebookProgress();

    return () => {
      isCancelled = true;
    };
  }, []);

  const persistNotebookProgress = useCallback(
    async (nextCompletedNotebookIds: Set<string>) => {
      try {
        const response = await fetch('/api/practice/notebooks/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            completedNotebookIds: Array.from(nextCompletedNotebookIds)
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          console.error('Failed to save notebook progress:', payload?.error);
        }
      } catch (error) {
        console.error('Failed to save notebook progress:', error);
      }
    },
    []
  );

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
    const nextCompletedNotebookIds = new Set(completedNotebookIds);
    nextCompletedNotebookIds.add(activeNotebook.id);
    setView('results');
    setCompletedNotebookIds(nextCompletedNotebookIds);
    void persistNotebookProgress(nextCompletedNotebookIds);
  }, [activeNotebook, completedNotebookIds, persistNotebookProgress]);

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
          <header className="max-w-4xl">
            <p className="data-mono mb-2 text-xs uppercase tracking-[0.32em] text-brand-500/80">
              Notebook Gallery
            </p>
            <h1 className="text-4xl font-semibold text-text-light-primary dark:text-text-dark-primary md:text-5xl font-display">
              Notebooks
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-8 text-text-light-secondary dark:text-text-dark-secondary md:text-base">
              Review production-style notebooks before they hit operations. Each
              notebook opens into the same line-by-line audit flow, with progress
              tracked separately once you submit it.
            </p>
          </header>

          <section className="rounded-2xl border border-light-border bg-light-surface p-3 dark:border-dark-border dark:bg-dark-surface">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-light-border bg-light-bg px-3 py-2 text-sm font-medium text-text-light-primary transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:hover:border-brand-400 dark:hover:text-brand-300"
              >
                <SlidersHorizontal className="h-4 w-4 text-brand-500" />
                Filters
                {filter !== 'all' ? (
                  <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-500">
                    1 active
                  </span>
                ) : null}
              </button>

              <div className="flex flex-wrap items-center gap-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 dark:border-dark-border dark:bg-dark-bg">
                  Showing {filteredNotebooks.length} of {NOTEBOOKS.length} notebooks
                </span>
                <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 dark:border-dark-border dark:bg-dark-bg">
                  {completionStats.completed} completed
                </span>
                <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 dark:border-dark-border dark:bg-dark-bg">
                  {completionStats.total - completionStats.completed} pending
                </span>
                <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 dark:border-dark-border dark:bg-dark-bg">
                  Filter: {FILTERS.find((option) => option.id === filter)?.label ?? 'All'}
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {isLoadingCompletion
                  ? 'Loading notebook review history...'
                  : `${completionStats.completed}/${completionStats.total} notebook reviews submitted`}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  Completion
                </p>
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all duration-500"
                    style={{ width: `${completionStats.completionPct}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  {completionStats.completionPct}%
                </p>
              </div>
            </div>
          </section>

          {isFilterPanelOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px]"
              aria-label="Close filter panel backdrop"
              onClick={() => setIsFilterPanelOpen(false)}
            />
          ) : null}

          <aside
            className={`fixed inset-y-0 left-0 z-50 w-[380px] max-w-[94vw] border-r border-light-border bg-light-bg/95 p-4 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-in-out dark:border-dark-border dark:bg-[#02060f]/95 ${
              isFilterPanelOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(false)}
                className="rounded-md p-1.5 text-text-light-secondary transition-colors hover:bg-light-surface hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:bg-dark-surface dark:hover:text-text-dark-primary"
                aria-label="Close filter panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <section className="flex h-[calc(100%-2.2rem)] flex-col rounded-2xl border border-light-border bg-light-surface/95 p-4 dark:border-dark-border dark:bg-dark-surface/95">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filter Panel
                </div>
                <button
                  type="button"
                  onClick={() => { setFilter('all'); setIsFilterPanelOpen(false); }}
                  className="inline-flex items-center gap-1 rounded-md border border-light-border px-2.5 py-1.5 text-xs font-medium text-text-light-secondary transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-brand-400 dark:hover:text-brand-300"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto pr-1">
                <section className="rounded-xl border border-light-border p-3 dark:border-dark-border">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
                    Status
                  </p>
                  <div className="mt-2 space-y-2">
                    {FILTERS.map((option) => {
                      const selected = filter === option.id;
                      const descriptions: Record<NotebookFilter, string> = {
                        all: 'Show all notebooks regardless of progress.',
                        new: 'Only notebooks you haven\'t reviewed yet.',
                        completed: 'Notebooks you\'ve already submitted.'
                      };
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setFilter(option.id)}
                          aria-pressed={selected}
                          className={`w-full rounded-lg border p-2.5 text-left transition ${
                            selected
                              ? 'border-brand-500/40 bg-brand-500/10'
                              : 'border-light-border hover:border-brand-500/40 dark:border-dark-border'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                                {option.label}
                              </p>
                              <p className="mt-0.5 text-[11px] text-text-light-secondary dark:text-text-dark-secondary">
                                {descriptions[option.id]}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                selected
                                  ? 'border border-brand-500/40 bg-brand-500/10 text-brand-500'
                                  : 'border border-light-border text-text-light-secondary dark:border-dark-border dark:text-text-dark-secondary'
                              }`}
                            >
                              {selected ? 'Applied' : 'Use'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            </section>
          </aside>

          {filteredNotebooks.length > 0 ? (
            <section className="grid grid-cols-1 gap-6">
              {filteredNotebooks.map((notebook) => {
                const difficultyStyle = DIFFICULTY_STYLES[notebook.difficulty];
                const completed = completedNotebookIds.has(notebook.id);
                const completionPct = completed ? 100 : 0;
                const cardVars = {
                  '--notebook-accent': difficultyStyle.accentRgb
                } as CSSProperties;
                const statusCopy = completed
                  ? 'Review submitted. Reopen the notebook anytime to audit it again from scratch.'
                  : `Flag ${notebook.totalIssues} risky lines across the notebook before it reaches production.`;
                const ctaLabel = completed ? 'Review again' : 'Open review';
                const bottomChips = [
                  `${notebook.totalIssues} issues`,
                  `~${notebook.estimatedMinutes} min`,
                  ...notebook.tags.slice(0, 2)
                ];

                return (
                  <button
                    key={notebook.id}
                    type="button"
                    onClick={() => startNotebook(notebook.id)}
                    className="group relative overflow-hidden rounded-[32px] border border-light-border bg-light-surface p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(var(--notebook-accent),0.42)] hover:shadow-[0_30px_90px_-44px_rgba(var(--notebook-accent),0.42)] dark:border-dark-border dark:bg-dark-surface"
                    style={cardVars}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(var(--notebook-accent),0.18),transparent_32%),linear-gradient(180deg,rgba(var(--notebook-accent),0.08),transparent_46%)]" />
                    <div className="pointer-events-none absolute -right-12 top-10 h-44 w-44 rounded-full bg-[rgba(var(--notebook-accent),0.1)] blur-3xl" />

                    <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                      <div className="max-w-3xl">
                        <div
                          className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${difficultyStyle.badge}`}
                        >
                          <NotebookPen className="h-3.5 w-3.5" />
                          {difficultyStyle.eyebrow}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-3xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                            {notebook.title}
                          </h2>
                          <span
                            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${difficultyStyle.badge}`}
                          >
                            {notebook.difficulty}
                          </span>
                        </div>

                        <p className="mt-4 max-w-2xl text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
                          {notebook.context}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full border border-light-border bg-light-bg px-3 py-1.5 text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
                            {completed ? 'Submitted' : 'Ready for review'}
                          </span>
                        </div>
                      </div>

                      <div className="w-full max-w-sm rounded-3xl border border-[rgba(var(--notebook-accent),0.18)] bg-light-bg/85 p-5 dark:bg-dark-bg/70">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-light-tertiary dark:text-text-dark-tertiary">
                            Review Status
                          </span>
                          <span className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                            {completionPct}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                          <div
                            className="h-full rounded-full bg-[rgb(var(--notebook-accent))] transition-all duration-500"
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>

                        <p className="mt-4 text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
                          {statusCopy}
                        </p>
                      </div>
                    </div>

                    <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-light-border/80 pt-5 dark:border-dark-border">
                      <div className="flex flex-wrap gap-2">
                        {bottomChips.map((chip) => (
                          <span
                            key={`${notebook.id}-${chip}`}
                            className="rounded-full border border-light-border bg-light-bg px-3 py-1 text-xs text-text-light-tertiary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-tertiary"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>

                      <span className="inline-flex items-center gap-2 text-sm font-medium text-text-light-primary transition-transform group-hover:translate-x-0.5 dark:text-text-dark-primary">
                        {ctaLabel}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </section>
          ) : (
            <section className="rounded-[28px] border border-light-border bg-light-surface p-10 text-center dark:border-dark-border dark:bg-dark-surface">
              <p className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
                No notebook reviews match this filter
              </p>
              <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Adjust the status filter to widen the gallery.
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
  const reviewShellMenuItems = [
    'File',
    'Edit',
    'View',
    'Insert',
    'Cell',
    'Kernel',
    'Help'
  ];
  const difficultyChipClassByLevel: Record<NotebookDefinition['difficulty'], string> = {
    Beginner: 'border-emerald-500/40 bg-emerald-500/12 text-emerald-200',
    Intermediate: 'border-amber-500/40 bg-amber-500/12 text-amber-200',
    Advanced: 'border-rose-500/40 bg-rose-500/12 text-rose-200'
  };
  const severityBadgeClassByLevel: Record<NotebookIssue['severity'], string> = {
    performance: 'border-rose-500/35 bg-rose-500/15 text-rose-200',
    practice: 'border-amber-500/35 bg-amber-500/15 text-amber-200',
    redundant: 'border-slate-500/35 bg-slate-500/15 text-slate-200'
  };

  let renderedLineCount = 0;

  return (
    <main className="dark min-h-screen bg-[#0f1117] px-4 pb-16 pt-4 text-slate-100 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <section className="overflow-hidden rounded-xl border border-slate-700/60 bg-[#141923] shadow-[0_30px_70px_-46px_rgba(0,0,0,0.9)]">
          <div className="flex items-center gap-4 border-b border-slate-700/70 px-4 py-2 text-xs text-slate-300">
            <span className="font-semibold tracking-[0.04em] text-slate-100">
              Jupyter Notebook
            </span>
            <div className="hidden items-center gap-3 sm:flex">
              {reviewShellMenuItems.map((item) => (
                <span key={item} className="text-slate-400">
                  {item}
                </span>
              ))}
            </div>
            <span className="ml-auto inline-flex items-center gap-1 text-slate-400">
              <Clock3 className="h-3.5 w-3.5" />
              Python 3 (ipykernel)
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/70 px-4 py-2.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleBackToCatalog}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-600/80 bg-[#0f1420] px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-[#111a2b]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <span className="truncate text-sm font-semibold text-slate-100">
                {activeNotebook.title}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  difficultyChipClassByLevel[activeNotebook.difficulty]
                }`}
              >
                {activeNotebook.difficulty}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isReview ? (
                <>
                  <span className="rounded-full border border-slate-600/70 bg-[#0f1420] px-2.5 py-1 text-[11px] font-medium text-slate-300">
                    {flaggedLineIds.size} flagged
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHint((previous) => !previous)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      showHint
                        ? 'border-cyan-400/50 bg-cyan-500/18 text-cyan-100'
                        : 'border-slate-600/80 bg-[#0f1420] text-slate-200 hover:border-slate-500 hover:bg-[#111a2b]'
                    }`}
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    Hint
                  </button>
                  <button
                    type="button"
                    disabled={flaggedLineIds.size === 0}
                    onClick={handleSubmitReview}
                    className="inline-flex items-center gap-1.5 rounded-md border border-cyan-400/55 bg-cyan-500/85 px-3 py-1.5 text-xs font-semibold text-[#031116] transition disabled:cursor-not-allowed disabled:border-slate-600/80 disabled:bg-slate-700/40 disabled:text-slate-400"
                  >
                    Submit Review
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-600/80 bg-[#0f1420] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-[#111a2b]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToCatalog}
                    className="inline-flex items-center gap-1.5 rounded-md border border-cyan-400/55 bg-cyan-500/85 px-3 py-1.5 text-xs font-semibold text-[#031116] transition hover:bg-cyan-400"
                  >
                    Back to Notebooks
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="px-4 py-2 text-xs text-slate-400">
            notebook/{activeNotebook.id}.ipynb
          </div>
        </section>

        {showHint && isReview ? (
          <section className="rounded-lg border border-amber-500/40 bg-amber-500/12 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">
              Hint
            </p>
            <p className="mt-1 text-sm text-amber-100">
              There are {uniqueIssues.length} unique issues. Focus on repeated actions,
              driver-side conversions, and anti-pattern imports.
            </p>
          </section>
        ) : null}

        {isResults ? (
          <section className="rounded-lg border border-cyan-500/35 bg-cyan-500/12 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
              Review Score
            </p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div className="text-4xl font-bold leading-none text-slate-100">{score}%</div>
              <div className="flex items-center gap-5 text-xs text-slate-300">
                <span>
                  Found {foundIssueIds.size}/{uniqueIssues.length}
                </span>
                <span>False flags {falseFlagCount}</span>
              </div>
            </div>
          </section>
        ) : null}

        {isResults ? (
          <LightbulbPulseFeedback
            contextType="notebook"
            contextId={activeNotebook.id}
            prompt="Was this notebook review useful?"
          />
        ) : null}

        <section className="space-y-3">
          {activeNotebook.cells.map((cell, cellIndex) => {
            if (cell.type === 'markdown') {
              const markdownLines = (cell.content ?? '')
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean);
              const headingLine =
                markdownLines.find((line) => line.startsWith('#')) ?? markdownLines[0] ?? '';
              const headingText = headingLine
                ? extractNotebookMarkdownHeading(headingLine)
                : 'Notebook task';
              const requirementSourceLines = markdownLines.filter(
                (line) => line !== headingLine
              );
              const requirementBullets = buildRequirementBullets(requirementSourceLines);

              return (
                <article
                  key={cell.id}
                  className="overflow-hidden rounded-lg border border-slate-700/70 bg-[#101623]"
                >
                  <div className="grid grid-cols-[86px_minmax(0,1fr)]">
                    <div className="border-r border-slate-700/70 px-3 py-4 font-mono text-xs text-slate-500">
                      Md [{cellIndex}]:
                    </div>
                    <div className="px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Markdown Cell
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-100">
                        {headingText}
                      </h2>
                      <div className="mt-3 rounded-md border border-slate-700/70 bg-[#0b1220] p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Requirements
                        </p>
                        {requirementBullets.length > 0 ? (
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-300">
                            {requirementBullets.map((bullet) => (
                              <li key={`${cell.id}-${bullet}`}>{bullet}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm leading-relaxed text-slate-400">
                            No requirements listed in this markdown cell.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            }

            const lines = cell.lines ?? [];

            return (
              <article
                key={cell.id}
                className="overflow-hidden rounded-lg border border-slate-700/70 bg-[#101623]"
              >
                <div className="grid grid-cols-[86px_minmax(0,1fr)]">
                  <div className="border-r border-slate-700/70 px-3 py-3 font-mono text-xs text-cyan-300">
                    In [{cellIndex}]:
                  </div>
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-700/70 bg-[#151d2b] px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Python Cell
                        </p>
                        <span className="rounded-full border border-cyan-400/35 bg-cyan-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200">
                          PySpark
                        </span>
                        <span className="rounded-full border border-slate-600/75 bg-[#101623] px-2 py-0.5 text-[10px] font-medium text-slate-400">
                          {lines.length} lines
                        </span>
                      </div>
                      {isResults ? (
                        <p className="text-[11px] text-slate-400">
                          {cell.issues?.filter((issue) => foundIssueIds.has(issue.id)).length}/
                          {cell.issues?.length ?? 0} found
                        </p>
                      ) : null}
                    </div>

                    <div className="bg-[#0b1220] py-2.5">
                      {lines.map((line, lineIndex) => {
                        renderedLineCount += 1;
                        const previousLine = lineIndex > 0 ? lines[lineIndex - 1]?.text ?? '' : '';
                        const addGroupGap = shouldAddVisualGap(previousLine, line.text);
                        const flagged = flaggedLineIds.has(line.id);
                        const hasIssue = Boolean(line.issueId);
                        const correctFlag = isResults && flagged && hasIssue;
                        const missedIssue = isResults && !flagged && hasIssue;
                        const falseFlag = isResults && flagged && !hasIssue;

                        let rowClass =
                          'border-l-2 border-transparent bg-transparent hover:bg-white/[0.04]';
                        if (isReview && flagged) {
                          rowClass = 'border-l-2 border-cyan-400 bg-cyan-500/10';
                        }
                        if (correctFlag) {
                          rowClass = 'border-l-2 border-emerald-400 bg-emerald-500/12';
                        }
                        if (missedIssue) {
                          rowClass = 'border-l-2 border-amber-400 bg-amber-500/14';
                        }
                        if (falseFlag) {
                          rowClass = 'border-l-2 border-rose-400 bg-rose-500/16';
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
                            className={`group relative grid grid-cols-[2.25rem_minmax(0,1fr)_1rem] items-start gap-3 px-3 py-1 ${rowClass} ${
                              addGroupGap ? 'mt-2' : ''
                            } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            <span className="w-8 pt-1 text-right font-mono text-[11px] leading-7 text-slate-500">
                              {renderedLineCount}
                            </span>
                            <code className="flex-1 whitespace-pre font-mono text-[13px] leading-7 tracking-[0.01em]">
                              {highlightNotebookLine(line.text || ' ', `line-${line.id}`)}
                            </code>
                            <span className="pt-2 text-[11px] text-slate-400">
                              {isReview && flagged ? (
                                <Flag className="h-3.5 w-3.5 text-cyan-300" />
                              ) : null}
                              {correctFlag ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                              ) : null}
                              {missedIssue ? (
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                              ) : null}
                              {falseFlag ? (
                                <AlertTriangle className="h-3.5 w-3.5 text-rose-300" />
                              ) : null}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {isResults ? (
          <section className="rounded-lg border border-slate-700/70 bg-[#101623] p-5">
            <h2 className="text-base font-semibold text-slate-100">Issue Breakdown</h2>
            <div className="mt-4 space-y-3">
              {uniqueIssues.map((issue) => {
                const found = foundIssueIds.has(issue.id);
                const severity = SEVERITY_STYLES[issue.severity];
                return (
                  <article
                    key={issue.id}
                    className={`rounded-lg border p-4 ${
                      found
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-amber-500/40 bg-amber-500/10'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                          severityBadgeClassByLevel[issue.severity]
                        }`}
                      >
                        {severity.icon} {severity.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-100">{issue.title}</span>
                      <span
                        className={`ml-auto text-[11px] font-semibold uppercase tracking-[0.1em] ${
                          found ? 'text-emerald-300' : 'text-amber-300'
                        }`}
                      >
                        {found ? 'Found' : 'Missed'}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">{issue.explanation}</p>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="pb-8 text-center text-xs uppercase tracking-[0.14em] text-slate-500">
            Flag lines that contain issues, then submit your review
          </div>
        )}

        {isReview ? (
          <section className="rounded-lg border border-slate-700/70 bg-[#101623] p-4">
            <div className="grid gap-3 text-xs sm:grid-cols-3">
              <div className="rounded-lg border border-slate-700/70 bg-[#141c2a] p-3">
                <p className="font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Issues
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-100">
                  {uniqueIssues.length}
                </p>
              </div>
              <div className="rounded-lg border border-slate-700/70 bg-[#141c2a] p-3">
                <p className="font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Severity Mix
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Perf {issueCountBySeverity.performance ?? 0} · Practice{' '}
                  {issueCountBySeverity.practice ?? 0} · Redundant{' '}
                  {issueCountBySeverity.redundant ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-slate-700/70 bg-[#141c2a] p-3">
                <p className="font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Flagged
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-100">
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
