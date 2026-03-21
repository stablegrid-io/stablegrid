'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  Flag,
  Lightbulb,
  NotebookPen,
  RotateCcw,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle';
import { NOTEBOOKS, type NotebookDefinition, type NotebookIssue } from '@/data/notebooks';
import { createNotebookProgressRequestKey } from '@/lib/api/requestKeys';
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
    badge: '',
    accentRgb: '16,185,129',
    eyebrow: 'Starter review'
  },
  Intermediate: {
    badge: '',
    accentRgb: '245,158,11',
    eyebrow: 'Operations review'
  },
  Advanced: {
    badge: '',
    accentRgb: '239,68,68',
    eyebrow: 'Critical review'
  }
};

const DIFFICULTY_BADGE_STYLES: Record<
  NotebookDefinition['difficulty'],
  { border: string; background: string; color: string }
> = {
  Beginner: {
    border: 'rgba(16,185,129,0.3)',
    background: 'rgba(16,185,129,0.08)',
    color: '#10b981'
  },
  Intermediate: {
    border: 'rgba(245,158,11,0.3)',
    background: 'rgba(245,158,11,0.08)',
    color: '#f59e0b'
  },
  Advanced: {
    border: 'rgba(239,68,68,0.3)',
    background: 'rgba(239,68,68,0.08)',
    color: '#ef4444'
  }
};

const SEVERITY_STYLES: Record<
  NotebookIssue['severity'],
  { label: string; badge: string; icon: string }
> = {
  performance: {
    label: 'Performance',
    icon: '⚡',
    badge: ''
  },
  practice: {
    label: 'Best Practice',
    icon: '🧩',
    badge: ''
  },
  redundant: {
    label: 'Redundant',
    icon: '♻',
    badge: ''
  }
};

const SEVERITY_BADGE_STYLES: Record<
  NotebookIssue['severity'],
  { border: string; background: string; color: string }
> = {
  performance: {
    border: 'rgba(239,68,68,0.3)',
    background: 'rgba(239,68,68,0.08)',
    color: '#ef4444'
  },
  practice: {
    border: 'rgba(245,158,11,0.3)',
    background: 'rgba(245,158,11,0.08)',
    color: '#f59e0b'
  },
  redundant: {
    border: 'rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#5a8878'
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
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
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
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': createNotebookProgressRequestKey(nextCompletedNotebookIds)
          },
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
      <main className="min-h-screen bg-[#060809] px-6 pb-16 pt-10">
        {/* Scanline overlay */}
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
            backgroundSize: '100% 3px'
          }}
        />
        {/* Ambient glow */}
        <div
          className="pointer-events-none fixed left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 opacity-[0.04]"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(34,185,154,1), transparent 70%)'
          }}
        />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-7">
          <header className="max-w-4xl">
            <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#2a4038] mb-2">
              Notebook Gallery
            </p>
            <h1 className="text-4xl font-semibold text-white md:text-5xl">
              Notebooks
            </h1>
            <p className="mt-3 max-w-3xl text-[13px] leading-8 text-[#8ab8ae] md:text-base">
              Review production-style notebooks before they hit operations. Each
              notebook opens into the same line-by-line audit flow, with progress
              tracked separately once you submit it.
            </p>
          </header>

          {/* Stats/filter bar */}
          <section
            className="relative overflow-hidden rounded-[10px] border p-3"
            style={{
              background: 'rgba(12,17,14,0.85)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(255,255,255,0.06)'
            }}
          >
            {/* Corner brackets */}
            <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t" style={{ borderColor: 'rgba(34,185,154,0.3)' }} />
            <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t" style={{ borderColor: 'rgba(34,185,154,0.3)' }} />
            <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l" style={{ borderColor: 'rgba(34,185,154,0.3)' }} />
            <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r" style={{ borderColor: 'rgba(34,185,154,0.3)' }} />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFilterPanelOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-[6px] border px-3 py-2 text-sm font-medium text-white transition-colors"
                  style={{
                    borderColor: 'rgba(255,255,255,0.06)',
                    background: 'rgba(8,12,10,0.9)'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34,185,154,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
                  }}
                >
                  <SlidersHorizontal className="h-4 w-4" style={{ color: '#22b99a' }} />
                  Filters
                  {filter !== 'all' ? (
                    <span
                      className="rounded-[4px] border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em]"
                      style={{
                        borderColor: 'rgba(34,185,154,0.3)',
                        background: 'rgba(34,185,154,0.08)',
                        color: '#22b99a'
                      }}
                    >
                      1 active
                    </span>
                  ) : null}
                </button>
                <ViewToggle view={viewMode} onChange={setViewMode} />
              </div>

              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[#3a5a4a]">
                <span
                  className="rounded-[4px] border px-2.5 py-1"
                  style={{
                    borderColor: 'rgba(255,255,255,0.06)',
                    background: 'rgba(8,12,10,0.9)'
                  }}
                >
                  Showing {filteredNotebooks.length} of {NOTEBOOKS.length} notebooks
                </span>
                <span
                  className="rounded-[4px] border px-2.5 py-1"
                  style={{
                    borderColor: 'rgba(255,255,255,0.06)',
                    background: 'rgba(8,12,10,0.9)'
                  }}
                >
                  {completionStats.completed} completed
                </span>
                <span
                  className="rounded-[4px] border px-2.5 py-1"
                  style={{
                    borderColor: 'rgba(255,255,255,0.06)',
                    background: 'rgba(8,12,10,0.9)'
                  }}
                >
                  {completionStats.total - completionStats.completed} pending
                </span>
                <span
                  className="rounded-[4px] border px-2.5 py-1"
                  style={{
                    borderColor: 'rgba(255,255,255,0.06)',
                    background: 'rgba(8,12,10,0.9)'
                  }}
                >
                  Filter: {FILTERS.find((option) => option.id === filter)?.label ?? 'All'}
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-[13px] text-[#8ab8ae]">
                {isLoadingCompletion
                  ? 'Loading notebook review history...'
                  : `${completionStats.completed}/${completionStats.total} notebook reviews submitted`}
              </div>
              <div className="flex items-center gap-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#3a5a4a]">
                  Completion
                </p>
                {/* Segmented progress bar — 10 blocks */}
                <div className="flex items-center gap-[3px]">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const filled = i < Math.round(completionStats.completionPct / 10);
                    return (
                      <div
                        key={i}
                        className="h-[10px] w-3 rounded-[2px] transition-all duration-500"
                        style={{
                          background: filled
                            ? 'rgba(34,185,154,0.85)'
                            : 'rgba(255,255,255,0.05)',
                          border: filled
                            ? '1px solid rgba(34,185,154,0.4)'
                            : '1px solid rgba(255,255,255,0.05)'
                        }}
                      />
                    );
                  })}
                </div>
                <p className="font-mono text-sm font-medium text-white">
                  {completionStats.completionPct}%
                </p>
              </div>
            </div>
          </section>

          {isFilterPanelOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
              aria-label="Close filter panel backdrop"
              onClick={() => setIsFilterPanelOpen(false)}
            />
          ) : null}

          <aside
            className={`fixed inset-y-0 left-0 z-50 w-[380px] max-w-[94vw] border-r p-4 shadow-2xl transition-transform duration-300 ease-in-out ${
              isFilterPanelOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
            }`}
            style={{
              background: 'rgba(8,12,10,0.98)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(255,255,255,0.06)'
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-white">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(false)}
                className="rounded-[4px] p-1.5 text-[#8ab8ae] transition-colors hover:text-white"
                style={{ background: 'rgba(255,255,255,0.04)' }}
                aria-label="Close filter panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <section
              className="flex h-[calc(100%-2.2rem)] flex-col rounded-[10px] border p-4"
              style={{
                background: 'rgba(12,17,14,0.85)',
                borderColor: 'rgba(255,255,255,0.06)'
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.35em]" style={{ color: '#22b99a' }}>
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filter Panel
                </div>
                <button
                  type="button"
                  onClick={() => { setFilter('all'); setIsFilterPanelOpen(false); }}
                  className="inline-flex items-center gap-1 rounded-[4px] border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#8ab8ae] transition-colors hover:text-white"
                  style={{
                    borderColor: 'rgba(255,255,255,0.06)',
                    background: 'rgba(8,12,10,0.9)'
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto pr-1">
                <section
                  className="rounded-[8px] border p-3"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#3a5a4a]">
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
                          className="w-full rounded-[6px] border p-2.5 text-left transition"
                          style={{
                            borderColor: selected
                              ? 'rgba(34,185,154,0.3)'
                              : 'rgba(255,255,255,0.06)',
                            background: selected
                              ? 'rgba(34,185,154,0.06)'
                              : 'transparent'
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white">
                                {option.label}
                              </p>
                              <p className="mt-0.5 text-[11px] text-[#8ab8ae]">
                                {descriptions[option.id]}
                              </p>
                            </div>
                            <span
                              className="rounded-[4px] border px-2 py-0.5 font-mono text-[10px] font-medium"
                              style={
                                selected
                                  ? {
                                      borderColor: 'rgba(34,185,154,0.3)',
                                      background: 'rgba(34,185,154,0.08)',
                                      color: '#22b99a'
                                    }
                                  : {
                                      borderColor: 'rgba(255,255,255,0.06)',
                                      background: 'transparent',
                                      color: '#3a5a4a'
                                    }
                              }
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
            viewMode === 'list' ? (
              <section
                className="overflow-hidden rounded-[10px] border"
                style={{
                  background: 'rgba(12,17,14,0.85)',
                  borderColor: 'rgba(255,255,255,0.06)'
                }}
              >
                <div
                  className="grid grid-cols-[2rem_2rem_1fr_auto_auto_auto] items-center gap-4 border-b px-4 py-2.5"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  {['Status', '#', 'Title', 'Difficulty', 'Issues', 'Est.'].map((col) => (
                    <span key={col} className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#2a4038]">
                      {col}
                    </span>
                  ))}
                </div>
                {filteredNotebooks.map((notebook, index) => {
                  const difficultyStyle = DIFFICULTY_STYLES[notebook.difficulty];
                  const completed = completedNotebookIds.has(notebook.id);
                  const accentColor =
                    notebook.difficulty === 'Beginner' ? '#10b981' :
                    notebook.difficulty === 'Intermediate' ? '#f59e0b' :
                    '#ef4444';
                  return (
                    <button
                      key={notebook.id}
                      type="button"
                      onClick={() => startNotebook(notebook.id)}
                      className="grid w-full grid-cols-[2rem_2rem_1fr_auto_auto_auto] items-center gap-4 border-b px-4 py-3 text-left transition last:border-0"
                      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,185,154,0.03)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }}
                    >
                      <span className="flex items-center">
                        {completed ? (
                          <CheckCircle2 className="h-4 w-4" style={{ color: '#22b99a' }} />
                        ) : (
                          <Circle className="h-4 w-4" style={{ color: '#1e3028' }} />
                        )}
                      </span>
                      <span className="font-mono text-xs tabular-nums text-[#3a5a4a]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="truncate text-sm font-medium text-white">
                        {notebook.title}
                      </span>
                      <span className="font-mono text-sm font-medium" style={{ color: accentColor }}>
                        {notebook.difficulty}
                      </span>
                      <span className="font-mono text-sm text-[#3a5a4a]">
                        {notebook.totalIssues}
                      </span>
                      <span className="font-mono text-sm text-[#3a5a4a]">
                        ~{notebook.estimatedMinutes}m
                      </span>
                    </button>
                  );
                })}
              </section>
            ) : (
            <section className="grid grid-cols-1 gap-6">
              {filteredNotebooks.map((notebook) => {
                const difficultyStyle = DIFFICULTY_STYLES[notebook.difficulty];
                const difficultyBadgeStyle = DIFFICULTY_BADGE_STYLES[notebook.difficulty];
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
                    className="group relative overflow-hidden rounded-[10px] border p-6 text-left transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      ...cardVars,
                      background: 'rgba(12,17,14,0.85)',
                      backdropFilter: 'blur(20px)',
                      borderColor: `rgba(${difficultyStyle.accentRgb},0.18)`
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `rgba(${difficultyStyle.accentRgb},0.42)`;
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 30px 90px -44px rgba(${difficultyStyle.accentRgb},0.42)`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `rgba(${difficultyStyle.accentRgb},0.18)`;
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                    }}
                  >
                    {/* Top accent stripe */}
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                      style={{ background: `rgba(${difficultyStyle.accentRgb},0.5)` }}
                    />
                    {/* Corner brackets */}
                    <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t" style={{ borderColor: `rgba(${difficultyStyle.accentRgb},0.4)` }} />
                    <span className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t" style={{ borderColor: `rgba(${difficultyStyle.accentRgb},0.4)` }} />
                    <span className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l" style={{ borderColor: `rgba(${difficultyStyle.accentRgb},0.4)` }} />
                    <span className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r" style={{ borderColor: `rgba(${difficultyStyle.accentRgb},0.4)` }} />

                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(var(--notebook-accent),0.18),transparent_32%),linear-gradient(180deg,rgba(var(--notebook-accent),0.08),transparent_46%)]" />
                    <div className="pointer-events-none absolute -right-12 top-10 h-44 w-44 rounded-full blur-3xl" style={{ background: `rgba(${difficultyStyle.accentRgb},0.1)` }} />

                    <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                      <div className="max-w-3xl">
                        <div
                          className="mb-4 inline-flex items-center gap-2 rounded-[4px] border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em]"
                          style={{
                            borderColor: difficultyBadgeStyle.border,
                            background: difficultyBadgeStyle.background,
                            color: difficultyBadgeStyle.color
                          }}
                        >
                          <NotebookPen className="h-3.5 w-3.5" />
                          {difficultyStyle.eyebrow}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-3xl font-semibold text-white">
                            {notebook.title}
                          </h2>
                          <span
                            className="rounded-[4px] border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.16em]"
                            style={{
                              borderColor: difficultyBadgeStyle.border,
                              background: difficultyBadgeStyle.background,
                              color: difficultyBadgeStyle.color
                            }}
                          >
                            {notebook.difficulty}
                          </span>
                        </div>

                        <p className="mt-4 max-w-2xl text-[13px] leading-7 text-[#8ab8ae]">
                          {notebook.context}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <span
                            className="rounded-[4px] border px-3 py-1.5 font-mono text-[11px] text-[#8ab8ae]"
                            style={{
                              borderColor: 'rgba(255,255,255,0.06)',
                              background: 'rgba(8,12,10,0.9)'
                            }}
                          >
                            {completed ? 'Submitted' : 'Ready for review'}
                          </span>
                        </div>
                      </div>

                      <div
                        className="w-full max-w-sm rounded-[8px] border p-5"
                        style={{
                          borderColor: `rgba(${difficultyStyle.accentRgb},0.18)`,
                          background: 'rgba(8,12,10,0.9)'
                        }}
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#3a5a4a]">
                            Review Status
                          </span>
                          <span className="font-mono text-xl font-semibold text-white">
                            {completionPct}%
                          </span>
                        </div>

                        {/* Segmented progress bar — 10 blocks */}
                        <div className="flex items-center gap-[3px]">
                          {Array.from({ length: 10 }).map((_, i) => {
                            const filled = i < Math.round(completionPct / 10);
                            return (
                              <div
                                key={i}
                                className="h-[10px] flex-1 rounded-[2px] transition-all duration-500"
                                style={{
                                  background: filled
                                    ? `rgba(${difficultyStyle.accentRgb},0.85)`
                                    : 'rgba(255,255,255,0.05)',
                                  border: filled
                                    ? `1px solid rgba(${difficultyStyle.accentRgb},0.4)`
                                    : '1px solid rgba(255,255,255,0.05)'
                                }}
                              />
                            );
                          })}
                        </div>

                        <p className="mt-4 text-[13px] leading-7 text-[#8ab8ae]">
                          {statusCopy}
                        </p>
                      </div>
                    </div>

                    <div
                      className="relative mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                      <div className="flex flex-wrap gap-2">
                        {bottomChips.map((chip) => (
                          <span
                            key={`${notebook.id}-${chip}`}
                            className="rounded-[4px] border px-3 py-1 font-mono text-[11px] text-[#3a5a4a]"
                            style={{
                              borderColor: 'rgba(255,255,255,0.06)',
                              background: 'rgba(8,12,10,0.9)'
                            }}
                          >
                            {chip}
                          </span>
                        ))}
                      </div>

                      <span className="inline-flex items-center gap-2 text-sm font-medium text-white transition-transform group-hover:translate-x-0.5">
                        {ctaLabel}
                        <ArrowRight className="h-4 w-4" style={{ color: '#22b99a' }} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </section>
            )
          ) : (
            <section
              className="rounded-[10px] border p-10 text-center"
              style={{
                background: 'rgba(12,17,14,0.85)',
                borderColor: 'rgba(255,255,255,0.06)'
              }}
            >
              <p className="text-base font-semibold text-white">
                No notebook reviews match this filter
              </p>
              <p className="mt-1 text-[13px] text-[#8ab8ae]">
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
  const difficultyChipStyleByLevel: Record<
    NotebookDefinition['difficulty'],
    { borderColor: string; background: string; color: string }
  > = {
    Beginner: {
      borderColor: 'rgba(16,185,129,0.3)',
      background: 'rgba(16,185,129,0.08)',
      color: '#10b981'
    },
    Intermediate: {
      borderColor: 'rgba(245,158,11,0.3)',
      background: 'rgba(245,158,11,0.08)',
      color: '#f59e0b'
    },
    Advanced: {
      borderColor: 'rgba(239,68,68,0.3)',
      background: 'rgba(239,68,68,0.08)',
      color: '#ef4444'
    }
  };

  let renderedLineCount = 0;

  return (
    <main className="min-h-screen bg-[#060809] px-4 pb-16 pt-4 text-white sm:px-6">
      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
          backgroundSize: '100% 3px'
        }}
      />
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 opacity-[0.04]"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(34,185,154,1), transparent 70%)'
        }}
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-4">
        {/* Notebook shell header */}
        <section
          className="overflow-hidden rounded-[10px] border"
          style={{
            background: 'rgba(6,10,8,0.95)',
            borderColor: 'rgba(255,255,255,0.06)',
            boxShadow: '0 30px 70px -46px rgba(0,0,0,0.9)'
          }}
        >
          <div
            className="flex items-center gap-4 border-b px-4 py-2 font-mono text-xs text-[#8ab8ae]"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <span className="font-semibold tracking-[0.04em] text-white">
              Jupyter Notebook
            </span>
            <div className="hidden items-center gap-3 sm:flex">
              {reviewShellMenuItems.map((item) => (
                <span key={item} className="text-[#3a5a4a]">
                  {item}
                </span>
              ))}
            </div>
            <span className="ml-auto inline-flex items-center gap-1 text-[#3a5a4a]">
              <Clock3 className="h-3.5 w-3.5" />
              Python 3 (ipykernel)
            </span>
          </div>

          <div
            className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleBackToCatalog}
                className="inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1.5 font-mono text-xs font-medium text-white transition-colors"
                style={{
                  borderColor: 'rgba(255,255,255,0.08)',
                  background: 'rgba(8,12,10,0.9)'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34,185,154,0.3)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <span className="truncate text-sm font-semibold text-white">
                {activeNotebook.title}
              </span>
              <span
                className="rounded-[4px] border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={difficultyChipStyleByLevel[activeNotebook.difficulty]}
              >
                {activeNotebook.difficulty}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isReview ? (
                <>
                  <span
                    className="rounded-[4px] border px-2.5 py-1 font-mono text-[11px] font-medium text-[#8ab8ae]"
                    style={{
                      borderColor: 'rgba(255,255,255,0.06)',
                      background: 'rgba(8,12,10,0.9)'
                    }}
                  >
                    {flaggedLineIds.size} flagged
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHint((previous) => !previous)}
                    className="inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1.5 font-mono text-xs font-medium transition-colors"
                    style={
                      showHint
                        ? {
                            borderColor: 'rgba(34,185,154,0.4)',
                            background: 'rgba(34,185,154,0.1)',
                            color: '#22b99a'
                          }
                        : {
                            borderColor: 'rgba(255,255,255,0.08)',
                            background: 'rgba(8,12,10,0.9)',
                            color: '#8ab8ae'
                          }
                    }
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    Hint
                  </button>
                  <button
                    type="button"
                    disabled={flaggedLineIds.size === 0}
                    onClick={handleSubmitReview}
                    className="inline-flex items-center gap-1.5 rounded-[6px] border px-3 py-1.5 font-mono text-xs font-semibold transition disabled:cursor-not-allowed"
                    style={{
                      borderColor: flaggedLineIds.size === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(34,185,154,0.5)',
                      background: flaggedLineIds.size === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(34,185,154,0.85)',
                      color: flaggedLineIds.size === 0 ? '#1e3028' : '#031116'
                    }}
                  >
                    Submit Review
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center gap-1.5 rounded-[6px] border px-3 py-1.5 font-mono text-xs font-medium text-[#8ab8ae] transition-colors"
                    style={{
                      borderColor: 'rgba(255,255,255,0.08)',
                      background: 'rgba(8,12,10,0.9)'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34,185,154,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToCatalog}
                    className="inline-flex items-center gap-1.5 rounded-[6px] border px-3 py-1.5 font-mono text-xs font-semibold transition"
                    style={{
                      borderColor: 'rgba(34,185,154,0.5)',
                      background: 'rgba(34,185,154,0.85)',
                      color: '#031116'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,185,154,1)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,185,154,0.85)';
                    }}
                  >
                    Back to Notebooks
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="px-4 py-2 font-mono text-[11px] text-[#2a4038]">
            notebook/{activeNotebook.id}.ipynb
          </div>
        </section>

        {showHint && isReview ? (
          <section
            className="rounded-[8px] border p-4"
            style={{
              borderColor: 'rgba(240,192,64,0.3)',
              background: 'rgba(240,192,64,0.06)'
            }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.35em]" style={{ color: '#f0c040' }}>
              Hint
            </p>
            <p className="mt-1 text-[13px]" style={{ color: '#f0c040' }}>
              There are {uniqueIssues.length} unique issues. Focus on repeated actions,
              driver-side conversions, and anti-pattern imports.
            </p>
          </section>
        ) : null}

        {isResults ? (
          <section
            className="rounded-[8px] border p-5"
            style={{
              borderColor: 'rgba(34,185,154,0.25)',
              background: 'rgba(34,185,154,0.06)'
            }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#22b99a]">
              Review Score
            </p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div className="font-mono text-4xl font-bold leading-none text-white">{score}%</div>
              <div className="flex items-center gap-5 font-mono text-xs text-[#8ab8ae]">
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
                  className="overflow-hidden rounded-[8px] border"
                  style={{
                    background: 'rgba(6,10,8,0.95)',
                    borderColor: 'rgba(255,255,255,0.06)'
                  }}
                >
                  <div className="grid grid-cols-[86px_minmax(0,1fr)]">
                    <div
                      className="border-r px-3 py-4 font-mono text-xs text-[#3a5a4a]"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                      Md [{cellIndex}]:
                    </div>
                    <div className="px-4 py-4">
                      <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#3a5a4a]">
                        Markdown Cell
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-white">
                        {headingText}
                      </h2>
                      <div
                        className="mt-3 rounded-[6px] border p-3"
                        style={{
                          borderColor: 'rgba(255,255,255,0.06)',
                          background: 'rgba(8,12,10,0.9)'
                        }}
                      >
                        <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#3a5a4a]">
                          Requirements
                        </p>
                        {requirementBullets.length > 0 ? (
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-[13px] leading-relaxed text-[#8ab8ae]">
                            {requirementBullets.map((bullet) => (
                              <li key={`${cell.id}-${bullet}`}>{bullet}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-[13px] leading-relaxed text-[#3a5a4a]">
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
                className="overflow-hidden rounded-[8px] border"
                style={{
                  background: 'rgba(6,10,8,0.95)',
                  borderColor: 'rgba(255,255,255,0.06)'
                }}
              >
                <div className="grid grid-cols-[86px_minmax(0,1fr)]">
                  <div
                    className="border-r px-3 py-3 font-mono text-xs"
                    style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#22b99a' }}
                  >
                    In [{cellIndex}]:
                  </div>
                  <div>
                    <div
                      className="flex items-center justify-between border-b px-4 py-2.5"
                      style={{
                        borderColor: 'rgba(255,255,255,0.06)',
                        background: 'rgba(8,12,10,0.9)'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#3a5a4a]">
                          Python Cell
                        </p>
                        <span
                          className="rounded-[4px] border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]"
                          style={{
                            borderColor: 'rgba(34,185,154,0.25)',
                            background: 'rgba(34,185,154,0.06)',
                            color: '#22b99a'
                          }}
                        >
                          PySpark
                        </span>
                        <span
                          className="rounded-[4px] border px-2 py-0.5 font-mono text-[10px] font-medium text-[#3a5a4a]"
                          style={{
                            borderColor: 'rgba(255,255,255,0.06)',
                            background: 'rgba(6,10,8,0.95)'
                          }}
                        >
                          {lines.length} lines
                        </span>
                      </div>
                      {isResults ? (
                        <p className="font-mono text-[11px] text-[#3a5a4a]">
                          {cell.issues?.filter((issue) => foundIssueIds.has(issue.id)).length}/
                          {cell.issues?.length ?? 0} found
                        </p>
                      ) : null}
                    </div>

                    <div
                      className="py-2.5"
                      style={{ background: 'rgba(4,8,6,0.98)' }}
                    >
                      {lines.map((line, lineIndex) => {
                        renderedLineCount += 1;
                        const previousLine = lineIndex > 0 ? lines[lineIndex - 1]?.text ?? '' : '';
                        const addGroupGap = shouldAddVisualGap(previousLine, line.text);
                        const flagged = flaggedLineIds.has(line.id);
                        const hasIssue = Boolean(line.issueId);
                        const correctFlag = isResults && flagged && hasIssue;
                        const missedIssue = isResults && !flagged && hasIssue;
                        const falseFlag = isResults && flagged && !hasIssue;

                        let rowStyle: React.CSSProperties = {
                          borderLeft: '2px solid transparent',
                          background: 'transparent'
                        };
                        if (isReview && flagged) {
                          rowStyle = {
                            borderLeft: '2px solid rgba(34,185,154,0.8)',
                            background: 'rgba(34,185,154,0.07)'
                          };
                        }
                        if (correctFlag) {
                          rowStyle = {
                            borderLeft: '2px solid rgba(16,185,129,0.8)',
                            background: 'rgba(16,185,129,0.07)'
                          };
                        }
                        if (missedIssue) {
                          rowStyle = {
                            borderLeft: '2px solid rgba(240,192,64,0.8)',
                            background: 'rgba(240,192,64,0.06)'
                          };
                        }
                        if (falseFlag) {
                          rowStyle = {
                            borderLeft: '2px solid rgba(240,64,96,0.8)',
                            background: 'rgba(240,64,96,0.07)'
                          };
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
                            className={`group relative grid grid-cols-[2.25rem_minmax(0,1fr)_1rem] items-start gap-3 px-3 py-1 transition-colors ${
                              addGroupGap ? 'mt-2' : ''
                            } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                            style={rowStyle}
                            onMouseEnter={(e) => {
                              if (clickable && !flagged) {
                                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (clickable && !flagged && !correctFlag && !missedIssue && !falseFlag) {
                                (e.currentTarget as HTMLDivElement).style.background = rowStyle.background as string;
                              }
                            }}
                          >
                            <span className="w-8 pt-1 text-right font-mono text-[11px] leading-7 text-[#2a4038]">
                              {renderedLineCount}
                            </span>
                            <code className="flex-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere] font-mono text-[13px] leading-7 tracking-[0.01em]">
                              {highlightNotebookLine(line.text || ' ', `line-${line.id}`)}
                            </code>
                            <span className="pt-2 text-[11px] text-[#3a5a4a]">
                              {isReview && flagged ? (
                                <Flag className="h-3.5 w-3.5" style={{ color: '#22b99a' }} />
                              ) : null}
                              {correctFlag ? (
                                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#10b981' }} />
                              ) : null}
                              {missedIssue ? (
                                <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#f0c040' }} />
                              ) : null}
                              {falseFlag ? (
                                <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#f04060' }} />
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
          <section
            className="rounded-[10px] border p-5"
            style={{
              background: 'rgba(6,10,8,0.95)',
              borderColor: 'rgba(255,255,255,0.06)'
            }}
          >
            <h2 className="text-base font-semibold text-white">Issue Breakdown</h2>
            <div className="mt-4 space-y-3">
              {uniqueIssues.map((issue) => {
                const found = foundIssueIds.has(issue.id);
                const severity = SEVERITY_STYLES[issue.severity];
                const severityBadge = SEVERITY_BADGE_STYLES[issue.severity];
                return (
                  <article
                    key={issue.id}
                    className="rounded-[8px] border p-4"
                    style={
                      found
                        ? {
                            borderColor: 'rgba(16,185,129,0.3)',
                            background: 'rgba(16,185,129,0.06)'
                          }
                        : {
                            borderColor: 'rgba(240,192,64,0.3)',
                            background: 'rgba(240,192,64,0.05)'
                          }
                    }
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="rounded-[4px] border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]"
                        style={{
                          borderColor: severityBadge.border,
                          background: severityBadge.background,
                          color: severityBadge.color
                        }}
                      >
                        {severity.icon} {severity.label}
                      </span>
                      <span className="text-sm font-semibold text-white">{issue.title}</span>
                      <span
                        className="ml-auto font-mono text-[11px] font-semibold uppercase tracking-[0.1em]"
                        style={{ color: found ? '#10b981' : '#f0c040' }}
                      >
                        {found ? 'Found' : 'Missed'}
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-[#8ab8ae]">{issue.explanation}</p>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="pb-8 text-center font-mono text-[9px] uppercase tracking-[0.35em] text-[#1e3028]">
            Flag lines that contain issues, then submit your review
          </div>
        )}

        {isReview ? (
          <section
            className="rounded-[10px] border p-4"
            style={{
              background: 'rgba(6,10,8,0.95)',
              borderColor: 'rgba(255,255,255,0.06)'
            }}
          >
            <div className="grid gap-3 text-xs sm:grid-cols-3">
              <div
                className="rounded-[8px] border p-3"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  background: 'rgba(8,12,10,0.9)'
                }}
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#3a5a4a]">
                  Issues
                </p>
                <p className="mt-1 font-mono text-lg font-semibold text-white">
                  {uniqueIssues.length}
                </p>
              </div>
              <div
                className="rounded-[8px] border p-3"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  background: 'rgba(8,12,10,0.9)'
                }}
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#3a5a4a]">
                  Severity Mix
                </p>
                <p className="mt-1 text-[13px] text-[#8ab8ae]">
                  Perf {issueCountBySeverity.performance ?? 0} · Practice{' '}
                  {issueCountBySeverity.practice ?? 0} · Redundant{' '}
                  {issueCountBySeverity.redundant ?? 0}
                </p>
              </div>
              <div
                className="rounded-[8px] border p-3"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  background: 'rgba(8,12,10,0.9)'
                }}
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#3a5a4a]">
                  Flagged
                </p>
                <p className="mt-1 font-mono text-lg font-semibold text-white">
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
