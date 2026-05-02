'use client';

import React, { useReducer, useCallback, useEffect, useMemo, useState, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Eye,
  ArrowRight,
  Target,
  LogOut,
} from 'lucide-react';
import type { PracticeSet, PracticeTask, TemplateField } from '@/data/operations/practice-sets';
import { useReadingModeStore } from '@/lib/stores/useReadingModeStore';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import {
  computePracticePayout,
  computePracticeScorePercent,
  DEFAULT_PRACTICE_KWH_THRESHOLD,
} from '@/lib/energy';
import {
  validateCodeOutput,
  type ExpectedOutputSpec,
} from '@/lib/practice/codeTaskValidator';
import dynamic from 'next/dynamic';

const ReadingModeDropdown = dynamic(
  () => import('@/components/learn/theory/ReadingModeDropdown').then((m) => m.ReadingModeDropdown),
  { ssr: false }
);
const FocusModeButton = dynamic(
  () => import('@/components/learn/theory/ReadingModeDropdown').then((m) => m.FocusModeButton),
  { ssr: false }
);

const SplitPanelCodeTask = dynamic(
  () => import('@/components/operations/SplitPanelCodeTask').then((m) => m.SplitPanelCodeTask),
  { ssr: false, loading: () => <div className="h-96 rounded-[14px] animate-pulse" style={{ backgroundColor: 'var(--rm-code-bg, #0d1117)' }} /> }
);


// ── Constants ──────────────────────────────────────────────────────────────────

const ACCENT = '153,247,255';
const GREEN = '34,197,94';
const RED = '239,68,68';

/* Theme-aware feedback colors — adapt per reading mode (defined in
   globals.css). Use these for any results / breakdown surface so contrast
   holds on light, book and kindle modes. */
const SUCCESS_RGB = 'var(--rm-success-rgb)';
const ERROR_RGB = 'var(--rm-error-rgb)';


// ── Types ──────────────────────────────────────────────────────────────────────

type Phase = 'start' | 'session' | 'results';

export interface CheckpointModeConfig {
  passingScorePercent: number;
  /** Called once per results-phase entry with the computed score. */
  onResultsComputed: (result: {
    correct: number;
    total: number;
    percent: number;
    passed: boolean;
  }) => void;
  /** Where the "Back / Continue" CTAs should return to. */
  returnHref: string;
  /**
   * Optional URL of the next module's first lesson. When set, the pass screen
   * promotes a "Next module" CTA above "Continue to track" so users move
   * forward without bouncing through the track map.
   */
  nextModuleHref?: string;
  /** Title of the next module — shown inside the "Next module" CTA. */
  nextModuleTitle?: string;
  /** Label shown above the score (e.g. "Module Checkpoint"). */
  resultsHeading?: string;
  /** Label shown in the session topbar (e.g. "Module 01 · Checkpoint"). */
  topbarLabel?: string;
  /** Optional retry hook — the wrapper uses it to re-shuffle questions on retry. */
  onRetry?: () => void;
}

interface FieldAnswer {
  value: string;
  result: boolean | null;
}

interface RunMeta {
  callLog: string[];
  literals: number[];
  userCode: string;
}

interface TaskState {
  answers: Record<string, FieldAnswer>;
  checked: boolean;
  allCorrect: boolean;
  // Code tasks have no machine-verifiable answer fields by default. When a
  // task ships an `expectedOutput` spec we run the validator and set
  // allCorrect accordingly; otherwise we surface a neutral "submitted,
  // self-review" state instead of falsely marking the task correct.
  // Keeping these flags optional preserves backward compatibility with
  // sessionStorage snapshots from before they existed.
  selfReview?: boolean;
  /** Last captured stdout from running the user's code. */
  output?: string;
  /** Run-evidence used by the validator's anti-cheat heuristics. */
  lastRunMeta?: RunMeta;
  /** Validator diagnostic from CHECK_ANSWERS — surfaced in the UI. */
  validationReasons?: string[];
}

interface SessionState {
  phase: Phase;
  currentTaskIndex: number;
  taskStates: TaskState[];
  isReview: boolean;
  /**
   * Random seed regenerated on every RESET (Try again). 0 = no shuffle
   * (initial attempt), > 0 = deterministic shuffle keyed by this value.
   * Stored in session state so a page refresh mid-attempt restores the
   * same task / field / option order the user was last looking at.
   */
  shuffleSeed: number;
  /**
   * Running total of kWh awarded during this attempt — sum of per-task
   * rewards plus the module-completion bonus. Drives the "+N kWh earned"
   * badge on the results screen and the ring toast that fires on results
   * entry. Reset to 0 on RESET (Try again); persisted alongside the rest
   * of the session so a refresh on the results screen still shows the
   * correct earned amount.
   */
  sessionKwhEarned: number;
}

type SessionAction =
  | { type: 'START' }
  | { type: 'SET_ANSWER'; taskIndex: number; fieldId: string; value: string }
  | { type: 'SET_OUTPUT'; taskIndex: number; output: string; meta?: RunMeta }
  | { type: 'CHECK_ANSWERS'; tasks: PracticeTask[] }
  | { type: 'NEXT_TASK' }
  | { type: 'PREV_TASK' }
  | { type: 'GO_TO_TASK'; index: number }
  | { type: 'FINISH' }
  | { type: 'REVIEW' }
  | { type: 'BACK_TO_RESULTS' }
  | { type: 'RESET'; taskCount: number }
  | { type: 'RESTORE'; state: SessionState }
  | { type: 'BACK_TO_START' }
  | { type: 'AWARD_KWH'; amount: number };

// ── Validation helpers ─────────────────────────────────────────────────────────

function getCorrectValue(field: TemplateField): string {
  if (field.correctAnswer != null) return String(field.correctAnswer);
  return field.correct ?? '';
}

function checkFieldAnswer(field: TemplateField, userAnswer: string): boolean {
  const trimmed = userAnswer.trim();
  if (!trimmed) return false;

  const correct = getCorrectValue(field);

  if (field.type === 'numeric') {
    const numUser = parseFloat(trimmed);
    const numCorrect = parseFloat(correct);
    if (isNaN(numUser) || isNaN(numCorrect)) return false;
    const tol = field.tolerance ?? 0;
    return Math.abs(numUser - numCorrect) <= tol;
  }

  if (trimmed.toLowerCase() === correct.toLowerCase()) return true;
  if (field.acceptSynonyms?.some((s) => trimmed.toLowerCase() === s.toLowerCase())) return true;
  if (field.alsoAccept && trimmed.toLowerCase() === field.alsoAccept.toLowerCase()) return true;

  return false;
}

// ── Shuffling helpers ──────────────────────────────────────────────────────────

/**
 * Mulberry32 PRNG — deterministic, fast, sufficient for shuffling. Seeding
 * with the same number always produces the same sequence, so a SessionState
 * snapshot rebuilds the exact same shuffle on reload.
 */
function mulberry32(seed: number) {
  let t = seed | 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let x = t ^ (t >>> 15);
    x = Math.imul(x, 1 | x);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates with an injected RNG so the shuffle is deterministic. */
function seededShuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Generate a fresh non-zero seed (0 means "no shuffle, original order"). */
function newShuffleSeed(): number {
  return (Math.floor(Math.random() * 0x7fffffff) | 1) >>> 0;
}

/**
 * Re-shuffle tasks (top-level), fields within each task, and options within
 * each MCQ field — all driven by a single seeded RNG so the result is
 * reproducible from the seed alone. Field/option IDs are preserved, so the
 * answer-keyed taskState still validates correctly after the shuffle.
 *
 * When seed === 0 the original order is returned unchanged (initial attempt).
 */
function reshuffleTasksForRetry(
  tasks: PracticeTask[],
  seed: number,
): PracticeTask[] {
  if (!seed) return tasks;
  const rng = mulberry32(seed);
  return seededShuffle(tasks, rng).map((task) => {
    const fields = task.template?.fields ?? [];
    if (fields.length === 0) return task;
    const shuffledFields = seededShuffle(fields, rng).map((f) => {
      if (f.options && f.options.length > 1) {
        return { ...f, options: seededShuffle(f.options, rng) };
      }
      return f;
    });
    return {
      ...task,
      template: task.template
        ? { ...task.template, fields: shuffledFields }
        : task.template,
    };
  });
}

// ── Reducer ────────────────────────────────────────────────────────────────────

function createInitialState(taskCount: number, shuffleSeed: number = 0): SessionState {
  return {
    phase: 'start',
    currentTaskIndex: 0,
    taskStates: Array.from({ length: taskCount }, () => ({
      answers: {},
      checked: false,
      allCorrect: false,
    })),
    isReview: false,
    shuffleSeed,
    sessionKwhEarned: 0,
  };
}

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START':
      return { ...state, phase: 'session', currentTaskIndex: 0, isReview: false };

    case 'SET_ANSWER': {
      const newStates = [...state.taskStates];
      const ts = { ...newStates[action.taskIndex] };
      ts.answers = {
        ...ts.answers,
        [action.fieldId]: { value: action.value, result: null },
      };
      ts.checked = false;
      ts.allCorrect = false;
      newStates[action.taskIndex] = ts;
      return { ...state, taskStates: newStates };
    }

    case 'SET_OUTPUT': {
      const newStates = [...state.taskStates];
      const ts = { ...newStates[action.taskIndex] };
      ts.output = action.output;
      if (action.meta) ts.lastRunMeta = action.meta;
      newStates[action.taskIndex] = ts;
      return { ...state, taskStates: newStates };
    }

    case 'CHECK_ANSWERS': {
      const idx = state.currentTaskIndex;
      const task = action.tasks[idx];
      const fields = task.template?.fields ?? [];
      const newStates = [...state.taskStates];
      const ts = { ...newStates[idx] };
      const newAnswers: Record<string, FieldAnswer> = { ...ts.answers };
      let allCorrect = true;

      // Code tasks: validate against the task's `expectedOutput` spec when
      // present. The validator parses Spark printSchema/show output and
      // compares schema, row count, and any spot-check cell values. When
      // the spec is missing or the output cannot be parsed, fall back to
      // the neutral "self-review" state.
      if (task.type === 'write_the_code' && fields.length === 0) {
        const codeVal = ts.answers['__code']?.value ?? '';
        newAnswers['__code'] = { value: codeVal, result: null };
        ts.answers = newAnswers;
        ts.checked = true;

        const expected = (task as { expectedOutput?: ExpectedOutputSpec })
          .expectedOutput;
        const validation = validateCodeOutput(
          {
            output: ts.output ?? '',
            callLog: ts.lastRunMeta?.callLog ?? [],
            literals: ts.lastRunMeta?.literals ?? [],
            userCode: ts.lastRunMeta?.userCode ?? '',
          },
          expected,
        );
        if (validation.verdict === 'success') {
          ts.allCorrect = true;
          ts.selfReview = false;
        } else if (validation.verdict === 'failure') {
          ts.allCorrect = false;
          ts.selfReview = false;
        } else {
          ts.allCorrect = false;
          ts.selfReview = true;
        }
        ts.validationReasons = validation.reasons;
        newStates[idx] = ts;
        return { ...state, taskStates: newStates };
      }

      for (const field of fields) {
        const userVal = ts.answers[field.id]?.value ?? '';
        const correct = checkFieldAnswer(field, userVal);
        newAnswers[field.id] = { value: userVal, result: correct };
        if (!correct) allCorrect = false;
      }

      ts.answers = newAnswers;
      ts.checked = true;
      ts.allCorrect = allCorrect;
      newStates[idx] = ts;
      return { ...state, taskStates: newStates };
    }

    case 'NEXT_TASK':
      return { ...state, currentTaskIndex: state.currentTaskIndex + 1 };

    case 'PREV_TASK':
      return { ...state, currentTaskIndex: Math.max(0, state.currentTaskIndex - 1) };

    case 'GO_TO_TASK':
      return { ...state, currentTaskIndex: action.index };

    case 'FINISH':
      return { ...state, phase: 'results', isReview: false };

    case 'REVIEW':
      return { ...state, phase: 'session', currentTaskIndex: 0, isReview: true };

    case 'BACK_TO_RESULTS':
      return { ...state, phase: 'results', isReview: false };

    case 'RESET':
      // Generate a new shuffle seed so the component re-shuffles tasks /
      // fields / options for this attempt. Storing the seed (rather than a
      // counter) lets a refreshed page deterministically rebuild the same
      // ordering the user saw before reload.
      return {
        ...createInitialState(action.taskCount, newShuffleSeed()),
        phase: 'session',
      };

    case 'RESTORE':
      // Older sessionStorage snapshots may predate sessionKwhEarned; coerce
      // missing values to 0 so the field is always a number downstream.
      return {
        ...action.state,
        sessionKwhEarned: action.state.sessionKwhEarned ?? 0,
      };

    case 'BACK_TO_START':
      return { ...state, phase: 'start' };

    case 'AWARD_KWH':
      if (!action.amount) return state;
      return {
        ...state,
        sessionKwhEarned: state.sessionKwhEarned + action.amount,
      };

    default:
      return state;
  }
}

// ── Progress Dots ──────────────────────────────────────────────────────────────

function ProgressDots({
  total,
  current,
  taskStates,
  onNavigate,
}: {
  total: number;
  current: number;
  taskStates: TaskState[];
  onNavigate: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const ts = taskStates[i];
        const isCurrent = i === current;
        const isChecked = ts?.checked;
        const isCorrect = ts?.allCorrect;
        const isSelfReview = ts?.selfReview;

        // Allow navigating to any task
        const canNavigate = true;

        let bg: string;
        let border: string;
        let size: string;

        if (isChecked && isSelfReview) {
          // Code task — submitted but not machine-validated. Neutral, not green.
          bg = 'var(--rm-text-secondary)';
          border = 'transparent';
          size = 'w-2.5 h-2.5';
        } else if (isChecked && isCorrect) {
          bg = `rgb(${SUCCESS_RGB})`;
          border = 'transparent';
          size = 'w-2.5 h-2.5';
        } else if (isChecked && !isCorrect) {
          bg = `rgb(${ERROR_RGB})`;
          border = 'transparent';
          size = 'w-2.5 h-2.5';
        } else if (isCurrent) {
          // Main accent for the active dot — uses the theme's heading color
          // so it stays high-contrast (white in dark themes, near-black in
          // light themes).
          bg = 'var(--rm-text-heading, #ffffff)';
          border = 'transparent';
          size = 'w-3 h-3';
        } else {
          bg = 'transparent';
          border = 'var(--rm-border, rgba(255,255,255,0.15))';
          size = 'w-2.5 h-2.5';
        }

        return (
          <button
            key={i}
            onClick={() => canNavigate && onNavigate(i)}
            className={`${size} rounded-full transition-all duration-300 shrink-0 ${canNavigate ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
            style={{
              background: bg,
              border: border !== 'transparent' ? `1.5px solid ${border}` : 'none',
            }}
            title={`Task ${i + 1}`}
          />
        );
      })}
    </div>
  );
}

// Practice metadata uses both 'mid' and 'mid-level' historically; the API only
// recognises the canonical theory slugs. Anything else maps to null and the
// API call is skipped rather than risking a 400.
function resolvePracticeTrackSlug(trackLevel: string | undefined): string | null {
  if (!trackLevel) return null;
  const normalized = trackLevel.toLowerCase().replace(/-level$/, '');
  return ['junior', 'mid', 'senior'].includes(normalized) ? normalized : null;
}

// The practice landing route /operations/practice redirects to /learn, which
// drops the user back at the topic picker. Building the track map URL from
// the practice metadata keeps them anchored on the level they came from.
function buildTrackMapPath(practiceSet: PracticeSet): string {
  const topic = practiceSet.topic;
  const trackSlug = resolvePracticeTrackSlug(practiceSet.metadata?.trackLevel);
  if (topic && trackSlug) {
    return `/learn/${topic}/theory/${trackSlug}`;
  }
  if (topic) {
    return `/learn/${topic}`;
  }
  return '/learn';
}

async function persistPracticeCompletion(practiceSet: PracticeSet) {
  const moduleId = practiceSet.metadata?.moduleId;
  const topic = practiceSet.topic;
  const trackSlug = resolvePracticeTrackSlug(practiceSet.metadata?.trackLevel);
  if (!moduleId || !topic || !trackSlug) return;
  // Checkpoints aren't practice sets — they don't have a `module_progress` row.
  // Their pass state is persisted via useCheckpointStore (localStorage cache +
  // /api/learn/module-checkpoint) keyed against `module_checkpoints`.
  if (moduleId.startsWith('checkpoint-')) return;

  try {
    await fetch('/api/learn/module-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `practice-complete-${moduleId}-${Date.now()}`,
      },
      body: JSON.stringify({
        action: 'complete_practice',
        topic,
        track: trackSlug,
        moduleId,
        currentLessonId: null,
        lastVisitedRoute: null,
      }),
      credentials: 'same-origin',
    });
  } catch (error) {
    console.warn('[practice-complete] failed to persist completion:', error);
  }
}

// ── StartScreen ────────────────────────────────────────────────────────────────

function StartScreen({
  practiceSet,
  sessionPath,
}: {
  practiceSet: PracticeSet;
  sessionPath: string;
}) {
  return (
    <div className="relative mx-auto max-w-5xl px-6 py-16 sm:px-8 lg:py-24">
      {/* Back link — points at the actual track map for this level. */}
      <Link
        href={buildTrackMapPath(practiceSet)}
        className="inline-flex items-center gap-1.5 text-[12px] text-white/30 hover:text-white/60 transition-colors mb-12"
        style={{ opacity: 0, animation: 'fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to track
      </Link>

      {/* Main content */}
      <div
        style={{
          opacity: 0,
          animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 60ms forwards',
        }}
      >
        {/* Topic badge */}
        <div className="mb-6">
          <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/30">
            {practiceSet.topic} · {practiceSet.metadata.trackLevel}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white/90 mb-5 max-w-3xl">
          {practiceSet.title}
        </h1>

        {/* Description */}
        <p className="text-[15px] leading-relaxed text-white/40 mb-10 max-w-2xl">
          {practiceSet.description}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-6 mb-12 text-[13px] text-white/30">
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4 text-white/20" />
            {practiceSet.metadata.taskCount} tasks
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-white/20" />
            ~{practiceSet.metadata.estimatedDurationMinutes} min · untimed
          </span>
          {practiceSet.metadata.scenarioCompany && (
            <span className="text-white/20">
              {practiceSet.metadata.scenarioCompany}
            </span>
          )}
        </div>

        {/* Begin button */}
        <Link
          href={sessionPath}
          className="group inline-flex items-center gap-3 rounded-[14px] py-3.5 px-8 text-[15px] font-semibold transition-all duration-200 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: `rgba(${ACCENT},0.12)`,
            border: `1px solid rgba(${ACCENT},0.2)`,
            color: `rgb(${ACCENT})`,
          }}
        >
          Begin Practice
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

// ── FocusWrapper ──────────────────────────────────────────────────────────────

function FocusWrapper({
  briefPath,
  children,
  beforeExit,
}: {
  briefPath: string;
  children: React.ReactNode;
  /**
   * Optional pre-exit guard. Return false to abort exiting (e.g. user
   * cancelled a "leave checkpoint?" confirm). Used to keep ESC from silently
   * discarding an in-progress checkpoint attempt.
   */
  beforeExit?: () => boolean;
}) {
  const exitLinkRef = React.useRef<HTMLAnchorElement>(null);

  const exitSession = useCallback(() => {
    if (beforeExit && !beforeExit()) return;
    clearSession();
    const store = useReadingModeStore.getState();
    if (store.focusMode) store.toggleFocus();
    exitLinkRef.current?.click();
  }, [beforeExit]);

  // ESC: in focus mode → exit focus only; otherwise → exit session.
  // Ignore when typing in inputs.
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const store = useReadingModeStore.getState();
      if (store.focusMode) {
        store.toggleFocus();
        return;
      }
      exitSession();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [exitSession]);

  return (
    <FocusWrapperContext.Provider value={exitSession}>
      {/* Native <a> — Next.js Link/router.push fails silently during focus mode */}
      <a ref={exitLinkRef} href={briefPath} className="hidden" aria-hidden tabIndex={-1} />
      {children}
    </FocusWrapperContext.Provider>
  );
}

const FocusWrapperContext = React.createContext<(() => void) | null>(null);

// ── TaskScreen ─────────────────────────────────────────────────────────────────

function TaskScreen({
  practiceSet,
  state,
  dispatch,
  checkpointMode,
  kwhAlreadyEarned = false,
  onKwhEarned,
}: {
  practiceSet: PracticeSet;
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
  checkpointMode?: CheckpointModeConfig;
  /** Owned by PracticeSetSession (localStorage-backed) — when true, the
   *  module bonus and per-task awards are short-circuited so retries don't
   *  re-pay. */
  kwhAlreadyEarned?: boolean;
  /** Called once after a paying handleNext mints kWh, so the parent can
   *  persist the "already paid" flag. */
  onKwhEarned?: () => void;
}) {
  const tasks = practiceSet.tasks as PracticeTask[];
  const task = tasks[state.currentTaskIndex];
  const taskState = state.taskStates[state.currentTaskIndex];
  const fields = task.template?.fields ?? [];
  const isLast = state.currentTaskIndex === tasks.length - 1;
  const isFirst = state.currentTaskIndex === 0;

  /* ── Lifted hint state ─────────────────────────────────────────────────────
     Owned at the session level (keyed by task.id) so navigating away and back
     preserves which tiers the user has unlocked, AND so the reward path can
     dock the task payout based on hint usage. H1 is free / pre-unlocked.

     Persisted to the backend via /api/operations/practice/hint-unlock so a
     user can't reload to "reset" hints and re-earn the un-docked reward —
     once unlocked, a hint stays unlocked across sessions. */
  const [unlockedHintsByTaskId, setUnlockedHintsByTaskId] = useState<
    Map<string, Set<string>>
  >(() => {
    const map = new Map<string, Set<string>>();
    tasks.forEach((t) => {
      const initial = new Set<string>();
      t.hints?.forEach((h) => {
        if (h.tier === 'H1') initial.add(h.tier);
      });
      map.set(t.id, initial);
    });
    return map;
  });

  // Hydrate from the server on mount so prior unlocks rehydrate before
  // the user can interact. Skipped in checkpoint mode (checkpoints have
  // their own scoring path and don't surface tiered hints).
  const moduleIdForHints = practiceSet.metadata?.moduleId;
  useEffect(() => {
    if (checkpointMode) return;
    if (!moduleIdForHints) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/operations/practice/hint-unlock?moduleId=${encodeURIComponent(moduleIdForHints)}`,
          { credentials: 'same-origin' },
        );
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as {
          data?: Array<{ taskId: string; hintTier: string }>;
        };
        if (cancelled) return;
        const rows = json?.data ?? [];
        if (rows.length === 0) return;
        setUnlockedHintsByTaskId((prev) => {
          const next = new Map(prev);
          for (const row of rows) {
            const set = new Set(next.get(row.taskId) ?? []);
            set.add(row.hintTier);
            next.set(row.taskId, set);
          }
          return next;
        });
      } catch (err) {
        // Decorative — fall back to session-only state so a network blip
        // doesn't lock the user out of the editor.
        console.warn('[hint-unlock] failed to hydrate:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [moduleIdForHints, checkpointMode]);

  const unlockedHintsForCurrentTask =
    unlockedHintsByTaskId.get(task.id) ?? new Set<string>();
  const handleUnlockHintForCurrentTask = useCallback(
    (tier: string) => {
      // Optimistic local update so the unlock animation fires immediately.
      setUnlockedHintsByTaskId((prev) => {
        const next = new Map(prev);
        const current = new Set(next.get(task.id) ?? []);
        current.add(tier);
        next.set(task.id, current);
        return next;
      });

      // Persist server-side. Skipped in checkpoint mode.
      if (checkpointMode) return;
      const moduleId = practiceSet.metadata?.moduleId;
      const topic = practiceSet.topic;
      if (!moduleId || !topic) return;
      const hint = (task.hints ?? []).find((h) => h.tier === tier);
      const xpCost = hint?.xp_cost ?? 0;
      void fetch('/api/operations/practice/hint-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          moduleId,
          taskId: task.id,
          hintTier: tier,
          xpCost,
        }),
        credentials: 'same-origin',
      }).catch((err) => {
        // The optimistic local update is already in place, so the user
        // sees the hint regardless. On the next mount the server is
        // authoritative — if this POST never landed, the hint reverts
        // to locked. Acceptable degradation for a decorative state.
        console.warn('[hint-unlock] failed to persist:', err);
      });
    },
    [task.id, task.hints, practiceSet, checkpointMode],
  );

  // kWh integrity now lives in the server-side payout endpoint
  // (/api/operations/practice/payout). Once-per-(user, module) is enforced
  // by a unique-PK on practice_module_payouts, so we no longer need the
  // local awardedTaskIdsRef / awardedModuleRef gates here. The parent
  // PracticeSetSession passes `kwhAlreadyEarned` (server-seeded on mount,
  // localStorage-cached) which gates the payout call in handleNext below.
  const readingMode = useReadingModeStore((s) => s.mode);
  const focusMode = useReadingModeStore((s) => s.focusMode);
  const exitSession = useContext(FocusWrapperContext);
  // In checkpoint mode the proper top bar handles exit + reading mode + focus
  // toggle, so the focus-mode `fixed inset-0` overlay (which covers the top
  // bar) and floating ESC button must be skipped — otherwise the user loses
  // the contextual top bar (Module 01 · Checkpoint · Question X of N).
  const useFixedFocusOverlay = focusMode && !checkpointMode;

  const isCodeTask = !!(task as any).starterScaffold;
  const isMcqOnlyTask =
    !isCodeTask && fields.length > 0 && fields.every((f) => f.type === 'single_select');
  // Multi-question MCQ tasks (JA6 refactor-reading) own their own action
  // buttons inside the answers panel, so the outer footer is suppressed for
  // them to avoid duplicate Previous / Check / Continue controls.
  const isMultiQuestionMcqTask = isMcqOnlyTask && fields.length > 1;
  const allFieldsFilled = isCodeTask
    ? (taskState.answers['__code']?.value?.trim()?.length ?? 0) > 0
    : fields.every((f) => {
        const val = taskState.answers[f.id]?.value?.trim();
        return val && val.length > 0;
      });

  // Sentinel at the top of the task viewport. `scrollIntoView` walks up to the
  // nearest scrollable ancestor and scrolls *that* — works correctly whether
  // the practice session lives inside a checkpoint shell (overflow-y-auto
  // wrapper) or the legacy full-page route (window scroll). `window.scrollTo`
  // is a no-op inside the checkpoint shell because the body never scrolls.
  const topSentinelRef = React.useRef<HTMLDivElement>(null);
  const scrollToTop = useCallback(() => {
    topSentinelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Auto-focus the primary action button as it becomes actionable, so Enter
  // naturally advances the quiz without users needing to Tab. Selecting the
  // last unanswered option lights up Check Answer; clicking Check Answer
  // promotes Continue / See Results into focus. Restricted to MCQ-only tasks
  // because code tasks have their own keyboard shortcut (Cmd/Ctrl+Enter to
  // run) and competing focus would surprise users mid-typing.
  const checkBtnRef = React.useRef<HTMLButtonElement>(null);
  const continueBtnRef = React.useRef<HTMLButtonElement>(null);
  const prevAllFilledRef = React.useRef(allFieldsFilled);
  const prevCheckedRef = React.useRef(taskState.checked);
  useEffect(() => {
    if (!isMcqOnlyTask || state.isReview) {
      prevAllFilledRef.current = allFieldsFilled;
      prevCheckedRef.current = taskState.checked;
      return;
    }
    if (!prevAllFilledRef.current && allFieldsFilled && !taskState.checked) {
      checkBtnRef.current?.focus({ preventScroll: true });
    }
    if (!prevCheckedRef.current && taskState.checked) {
      continueBtnRef.current?.focus({ preventScroll: true });
    }
    prevAllFilledRef.current = allFieldsFilled;
    prevCheckedRef.current = taskState.checked;
  }, [allFieldsFilled, taskState.checked, isMcqOnlyTask, state.isReview]);

  // Persist each Check-Answer attempt so the Practice Mastery panel and
  // future analytics can read which tasks the user has solved. Append-only:
  // every time a given task's `checked` flips false → true we record one
  // row. Re-checking after Clear is a fresh attempt and produces another
  // row. Tracked per-taskId so navigating Previous to a previously-checked
  // task does NOT re-submit. Skipped in review mode (no new attempt) and in
  // checkpoint mode (checkpoints have their own scoring path).
  const lastCheckedByTaskIdRef = React.useRef<Record<string, boolean>>({});
  useEffect(() => {
    if (state.isReview || checkpointMode) {
      lastCheckedByTaskIdRef.current[task.id] = taskState.checked;
      return;
    }
    const previouslyChecked = lastCheckedByTaskIdRef.current[task.id] ?? false;
    lastCheckedByTaskIdRef.current[task.id] = taskState.checked;
    if (previouslyChecked || !taskState.checked) return;

    const moduleId = practiceSet.metadata?.moduleId;
    const topic = practiceSet.topic;
    if (!moduleId || !topic || moduleId.startsWith('checkpoint-')) return;

    const result: 'success' | 'failure' | 'self_review' = taskState.selfReview
      ? 'self_review'
      : taskState.allCorrect
        ? 'success'
        : 'failure';

    // Submit MCQ answer values too so the server can re-validate against
    // the registry's correctAnswer (the client-claimed `result` is no
    // longer trusted as the source of truth for MCQ tasks).
    const submittedAnswers: Record<string, string> = {};
    for (const [fieldId, ans] of Object.entries(taskState.answers)) {
      if (fieldId === '__code') continue;
      const v = ans?.value ?? '';
      if (typeof v === 'string' && v.length > 0) submittedAnswers[fieldId] = v;
    }

    void fetch('/api/operations/practice/task-attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        moduleId,
        taskId: task.id,
        result,
        // Persist what the user typed and what the run produced so the
        // attempt is fully reconstructible without round-tripping
        // through the editor.
        code: taskState.answers['__code']?.value ?? null,
        output: taskState.output ?? null,
        answers: Object.keys(submittedAnswers).length > 0 ? submittedAnswers : undefined,
      }),
      credentials: 'same-origin',
    }).catch((err) => {
      console.warn('[practice-attempt] failed to record:', err);
    });

    // kWh awards are deferred until "See Results" so we can gate them on
    // the overall score threshold (see handleNext). No minting fires here.
  }, [
    taskState.checked,
    taskState.allCorrect,
    taskState.selfReview,
    state.isReview,
    checkpointMode,
    practiceSet,
    task.id,
    taskState.answers,
    taskState.output,
  ]);

  const handleCheck = useCallback(() => {
    dispatch({ type: 'CHECK_ANSWERS', tasks });
  }, [dispatch, tasks]);

  const handleNext = useCallback(() => {
    if (!isLast) {
      dispatch({ type: 'NEXT_TASK' });
      scrollToTop();
      return;
    }

    // Persist practice completion (analytics) before flipping to the
    // results phase so the result survives a tab close. Fire-and-forget —
    // UX must not wait on the network.
    void persistPracticeCompletion(practiceSet);

    // Compute the final score using the same rounded value the user sees
    // on the results screen, so the eligibility check and the displayed
    // percentage can never diverge (no "shown 80%, awarded 0 kWh" cliff).
    const scorePercent = computePracticeScorePercent(tasks, state.taskStates);

    // Flip to results immediately. The server payout runs in parallel —
    // the kWh pill animates in once the credit lands, so the user sees
    // their score without waiting on the network.
    dispatch({ type: 'FINISH' });
    scrollToTop();

    // Checkpoint mode and known-replay attempts skip the network call.
    if (checkpointMode) return;
    if (kwhAlreadyEarned) return;

    const moduleId = practiceSet.metadata?.moduleId;
    if (!moduleId) return;

    void (async () => {
      try {
        const res = await fetch('/api/operations/practice/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            topic: practiceSet.topic,
            moduleId,
            scorePercent,
          }),
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          ok?: boolean;
          alreadyPaid?: boolean;
          eligible?: boolean;
          kwh?: number;
        };
        if (!json.ok) return;

        if (!json.alreadyPaid && json.eligible && (json.kwh ?? 0) > 0) {
          // Fresh payout — credit the local store and mark the module
          // as paid for future replays / refreshes / new devices.
          useProgressStore.getState().addXP(json.kwh!, {
            source: 'practice-module-complete',
            label: `Practice · ${practiceSet.title}`,
          });
          dispatch({ type: 'AWARD_KWH', amount: json.kwh! });
          onKwhEarned?.();
        } else if (json.alreadyPaid) {
          // Server says already paid (localStorage cleared or different
          // device) — sync the cache so the UI reflects it.
          onKwhEarned?.();
        }
        // Below-threshold attempts get { eligible: false, kwh: 0 } —
        // no dispatch, results screen renders the "score X%+ to earn"
        // copy via the threshold check.
      } catch {
        /* network failure — UI shows the score with no kWh credit;
           the user can retry and the idempotent endpoint will still
           credit on the next paying attempt */
      }
    })();
  }, [
    dispatch,
    isLast,
    practiceSet,
    scrollToTop,
    checkpointMode,
    tasks,
    state.taskStates,
    kwhAlreadyEarned,
    onKwhEarned,
  ]);

  const handlePrev = useCallback(() => {
    dispatch({ type: 'PREV_TASK' });
    scrollToTop();
  }, [dispatch, scrollToTop]);

  const handleNavigate = useCallback((index: number) => {
    dispatch({ type: 'GO_TO_TASK', index });
    scrollToTop();
  }, [dispatch, scrollToTop]);

  const handleAnswerChange = useCallback((fieldId: string, value: string) => {
    dispatch({ type: 'SET_ANSWER', taskIndex: state.currentTaskIndex, fieldId, value });
  }, [dispatch, state.currentTaskIndex]);

  const handleOutputChange = useCallback((output: string, meta?: RunMeta) => {
    dispatch({ type: 'SET_OUTPUT', taskIndex: state.currentTaskIndex, output, meta });
    // For code tasks, capturing output IS the check — running the code is
    // the only meaningful submission gesture. Skip the extra "Check Answer"
    // click and dispatch CHECK_ANSWERS in the same render so the validator
    // sees the just-set output (reducer dispatches batch and the second
    // dispatch reads from the post-SET_OUTPUT state).
    const t = tasks[state.currentTaskIndex];
    if (t && (t as { starterScaffold?: unknown }).starterScaffold) {
      dispatch({ type: 'CHECK_ANSWERS', tasks });
    }
  }, [dispatch, state.currentTaskIndex, tasks]);

  return (
    <div
      data-reading-mode={readingMode}
      className={
        useFixedFocusOverlay
          ? 'fixed inset-0 z-40 overflow-y-auto'
          : isMcqOnlyTask
            ? 'h-full'
            : ''
      }
      style={{ backgroundColor: 'var(--rm-bg, transparent)' }}
    >
    <div ref={topSentinelRef} aria-hidden />
    <div className={`relative mx-auto w-[94%] py-8 lg:py-12 ${useFixedFocusOverlay ? 'min-h-screen flex flex-col justify-center' : ''}`}>

      {/* Floating controls — visible in focus mode */}
      {useFixedFocusOverlay && (
        <div data-reading-mode={readingMode} className="contents">
          <div className="fixed top-3 right-3 z-50 flex items-center gap-1" data-reading-mode={readingMode}>
            <ReadingModeDropdown />
            <FocusModeButton />
          </div>
          <button
            type="button"
            onClick={exitSession ?? undefined}
            className="fixed top-3 left-3 z-50 flex items-center gap-2 rounded-lg px-3 py-1.5 backdrop-blur opacity-30 hover:opacity-100 transition-opacity cursor-pointer"
            style={{
              backgroundColor: 'var(--rm-bg-elevated)',
              border: '1px solid var(--rm-border)',
              color: 'var(--rm-text-secondary)',
            }}
          >
            <kbd
              className="font-mono text-[10px] tracking-widest rounded px-1.5 py-0.5"
              style={{
                border: '1px solid var(--rm-border)',
                backgroundColor: 'var(--rm-bg)',
                color: 'var(--rm-text-secondary)',
              }}
            >ESC</kbd>
            <span className="font-mono text-[10px] tracking-widest uppercase">Exit Session</span>
          </button>
        </div>
      )}

      {/* Top navigation bar */}
      <div
        className="relative z-50 flex items-center justify-between mb-8"
        style={{
          opacity: 0,
          animation: 'fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Left: back arrow + task counter */}
        <div className="flex items-center gap-4">
          {!isFirst && (
            <button
              onClick={handlePrev}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer"
              style={{ backgroundColor: 'var(--rm-bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--rm-border, rgba(255,255,255,0.06))', color: 'var(--rm-text-secondary)' }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Center: progress dots */}
        <ProgressDots
          total={tasks.length}
          current={state.currentTaskIndex}
          taskStates={state.taskStates}
          onNavigate={handleNavigate}
        />

        {/* Right: reading mode + review indicator */}
        <div className="flex items-center gap-2">
          {state.isReview && (
            <button
              onClick={() => dispatch({ type: 'BACK_TO_RESULTS' })}
              className="flex items-center gap-1.5 text-[12px] font-medium transition-colors cursor-pointer"
              style={{ color: 'var(--rm-text-secondary)' }}
            >
              <Eye className="h-3.5 w-3.5" />
              Exit Review
            </button>
          )}
        </div>
      </div>

      {/* Task card — keyed for animation */}
      <div
        key={state.currentTaskIndex}
        style={{
          opacity: 0,
          animation: 'fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 40ms forwards',
        }}
      >
        {/* Task card — always split panel layout: context/evidence on the
            left, answer area on the right (stacks vertically on mobile). */}
        <div className="space-y-6">
          <SplitPanelCodeTask
            key={task.id}
            task={task}
            practiceSet={practiceSet}
            topic={practiceSet.topic}
            taskState={taskState}
            isReview={state.isReview}
            onAnswerChange={handleAnswerChange}
            onOutputChange={handleOutputChange}
            onCheck={handleCheck}
            onNext={handleNext}
            onSkip={isCodeTask ? handleNext : () => {
              if (state.isReview) {
                dispatch({ type: 'BACK_TO_RESULTS' });
              } else {
                handleNext();
              }
            }}
            onPrev={handlePrev}
            isFirst={isFirst}
            checked={taskState.checked}
            isLast={isLast}
            unlockedHints={unlockedHintsForCurrentTask}
            onUnlockHint={handleUnlockHintForCurrentTask}
          />

          {/* Footer navigation — suppressed for all MCQ tasks where the
              answers panel owns its own inline footer (Back / Check /
              Continue). Code tasks keep this outer footer. */}
          {!isMcqOnlyTask && (
          <div className="flex items-center gap-3 pt-2">
            {/* Previous */}
            {!isFirst && (
              <button
                onClick={handlePrev}
                className="rounded-[14px] px-5 py-3 text-[13px] font-medium transition-all duration-200 cursor-pointer flex items-center gap-2"
                style={{
                  backgroundColor: 'var(--rm-bg-elevated)',
                  border: '1px solid var(--rm-border)',
                  color: 'var(--rm-text-secondary)',
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Previous
              </button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Non-code: Check Answer (before checked).
                Primary action — uses text-heading as bg + bg as fg so the
                pill auto-inverts across every reading mode (solid + readable
                in both dark and light themes). */}
            {!isCodeTask && !state.isReview && !taskState.checked && (
              <button
                ref={checkBtnRef}
                onClick={handleCheck}
                disabled={!allFieldsFilled}
                className="rounded-[14px] px-6 py-3.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 flex items-center gap-2 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: allFieldsFilled ? 'var(--rm-text-heading)' : 'var(--rm-bg-elevated)',
                  border: `1px solid ${allFieldsFilled ? 'var(--rm-text-heading)' : 'var(--rm-border)'}`,
                  color: allFieldsFilled ? 'var(--rm-bg)' : 'var(--rm-text-secondary)',
                }}
              >
                Check Answer
              </button>
            )}

            {/* Continue / See Results — same primary-action pattern.
                Code tasks always show Continue (user can skip without
                running); MCQ tasks only show it after Check fires. */}
            {(isCodeTask || taskState.checked || state.isReview) && (
              !isLast ? (
                <button
                  ref={continueBtnRef}
                  onClick={handleNext}
                  className="rounded-[14px] px-6 py-3.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: 'var(--rm-text-heading)',
                    border: '1px solid var(--rm-text-heading)',
                    color: 'var(--rm-bg)',
                  }}
                >
                  Continue
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  ref={continueBtnRef}
                  onClick={handleNext}
                  className="rounded-[14px] px-6 py-3.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: 'var(--rm-text-heading)',
                    border: '1px solid var(--rm-text-heading)',
                    color: 'var(--rm-bg)',
                  }}
                >
                  See Results
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )
            )}

            {state.isReview && (
              <button
                onClick={() => dispatch({ type: 'BACK_TO_RESULTS' })}
                className="rounded-[14px] px-5 py-3 text-[13px] font-medium transition-all duration-200 cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ backgroundColor: 'var(--rm-bg-elevated)', border: '1px solid var(--rm-border)', color: 'var(--rm-text-secondary)' }}
              >
                Back to Results
              </button>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}

// ── ResultsScreen ──────────────────────────────────────────────────────────────

function ResultsBreakdownRow({
  task,
  taskState,
  index,
}: {
  task: PracticeTask;
  taskState: TaskState;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const fields = task.template?.fields ?? [];

  const correctFields = fields.filter((f) => taskState.answers[f.id]?.result === true).length;
  const totalFields = fields.length;
  const isSelfReview = Boolean(taskState.selfReview);

  return (
    <div
      className="rounded-[14px] overflow-hidden transition-all duration-200"
      style={{
        background: 'var(--rm-bg-elevated)',
        border: '1px solid var(--rm-border)',
      }}
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full text-left px-5 py-4 flex items-center gap-4 cursor-pointer transition-all duration-200 hover:brightness-[1.04]"
      >
        {/* Status icon */}
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: isSelfReview
              ? 'var(--rm-bg)'
              : taskState.allCorrect
                ? `rgba(${SUCCESS_RGB},0.12)`
                : `rgba(${ERROR_RGB},0.12)`,
            border: isSelfReview ? '1px solid var(--rm-border)' : 'none',
          }}
        >
          {isSelfReview ? (
            <Eye className="h-3.5 w-3.5" style={{ color: 'var(--rm-text-secondary)' }} />
          ) : taskState.allCorrect ? (
            <Check className="h-3.5 w-3.5" style={{ color: `rgb(${SUCCESS_RGB})` }} />
          ) : (
            <X className="h-3.5 w-3.5" style={{ color: `rgb(${ERROR_RGB})` }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium truncate" style={{ color: 'var(--rm-text)' }}>
            Task {index + 1}: {task.title}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--rm-text-secondary)' }}>
            {isSelfReview
              ? 'Submitted — review your output'
              : `${correctFields}/${totalFields} fields correct`}
          </div>
        </div>

        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0" style={{ color: 'var(--rm-text-secondary)' }} />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--rm-text-secondary)' }} />
        )}
      </button>

      {expanded && (
        <div
          className="px-5 pb-5 space-y-2"
          style={{ borderTop: '1px solid var(--rm-border)' }}
        >
          {fields.map((field) => {
            const answer = taskState.answers[field.id];
            const isCorrect = answer?.result === true;
            const correctValue = getCorrectValue(field);
            const tint = isCorrect ? SUCCESS_RGB : ERROR_RGB;
            const toleranceHint =
              field.type === 'numeric' && (field.tolerance ?? 0) > 0
                ? ` (±${field.tolerance})`
                : '';
            const acceptedAlternates = [
              ...(field.acceptSynonyms ?? []),
              ...(field.alsoAccept ? [field.alsoAccept] : []),
            ];

            return (
              <div
                key={field.id}
                className="rounded-lg px-4 py-3 mt-2"
                style={{
                  background: `rgba(${tint},0.06)`,
                  border: `1px solid rgba(${tint},0.16)`,
                }}
              >
                <div className="text-[11px] mb-1.5" style={{ color: 'var(--rm-text-secondary)' }}>{field.label}</div>
                <div className="flex items-start gap-2">
                  {isCorrect ? (
                    <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: `rgb(${SUCCESS_RGB})` }} />
                  ) : (
                    <X className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: `rgb(${ERROR_RGB})` }} />
                  )}
                  <div className="text-[12px] min-w-0">
                    <div style={{ color: `rgb(${tint})`, fontWeight: 500 }}>
                      {answer?.value || '(no answer)'}
                    </div>
                    {!isCorrect && (
                      <div className="mt-1.5" style={{ color: `rgb(${SUCCESS_RGB})` }}>
                        Correct: {correctValue}{toleranceHint}
                        {acceptedAlternates.length > 0 && (
                          <span className="block text-[11px] mt-0.5" style={{ color: 'var(--rm-text-secondary)' }}>
                            Also accepted: {acceptedAlternates.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Stable-grid mark with the same staggered L-charge fill animation as the
 * pre-checkpoint interstitial — so the user sees the brand mark "complete
 * itself" once when results mount, mirroring the entrance from the start of
 * the run. The four active cells fill sequentially over ~600ms, then hold.
 */
function ResultsLogoMark({
  tint,
  size = 32,
}: {
  tint?: string;
  size?: number;
}) {
  const stroke = tint ? `rgb(${tint})` : 'currentColor';
  const fill = tint ? `rgb(${tint})` : 'currentColor';
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className="sg-results-mark"
    >
      <g stroke={stroke} strokeWidth="2.5">
        <rect x="15" y="15" width="22" height="22" rx="3" />
        <rect x="41" y="15" width="22" height="22" rx="3" />
        <rect x="67" y="15" width="22" height="22" rx="3" />
        <rect x="15" y="41" width="22" height="22" rx="3" />
        <rect x="41" y="41" width="22" height="22" rx="3" strokeOpacity="0.35" />
        <rect x="67" y="41" width="22" height="22" rx="3" strokeOpacity="0.35" />
        <rect x="15" y="67" width="22" height="22" rx="3" strokeOpacity="0.35" />
        <rect x="41" y="67" width="22" height="22" rx="3" strokeOpacity="0.35" />
        <rect x="67" y="67" width="22" height="22" rx="3" strokeOpacity="0.35" />
      </g>
      <g fill={fill}>
        <rect className="sg-rf0" x="19" y="19" width="14" height="14" rx="2" opacity="0" />
        <rect className="sg-rf1" x="45" y="19" width="14" height="14" rx="2" opacity="0" />
        <rect className="sg-rf2" x="71" y="19" width="14" height="14" rx="2" opacity="0" />
        <rect className="sg-rf3" x="19" y="45" width="14" height="14" rx="2" opacity="0" />
      </g>
      <style jsx>{`
        /* Slow continuous rotation of the whole mark — mirrors the
           landing-hero-mark-spin behavior so the brand mark on the results
           screen feels visually consistent with the home page. The L-shape
           cells fade in once on mount, then the entire SVG rotates. */
        @keyframes sg-results-fill {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes sg-results-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .sg-results-mark {
          animation: sg-results-spin 24s linear infinite;
          transform-origin: 50% 50%;
        }
        .sg-results-mark rect[class^='sg-rf'] {
          transform-origin: center;
          transform-box: fill-box;
          animation: sg-results-fill 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .sg-results-mark .sg-rf0 { animation-delay: 0.1s; }
        .sg-results-mark .sg-rf1 { animation-delay: 0.22s; }
        .sg-results-mark .sg-rf2 { animation-delay: 0.34s; }
        .sg-results-mark .sg-rf3 { animation-delay: 0.46s; }
        @media (prefers-reduced-motion: reduce) {
          .sg-results-mark { animation: none !important; }
          .sg-results-mark rect[class^='sg-rf'] {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </svg>
  );
}

function ResultsScreen({
  practiceSet,
  state,
  dispatch,
  checkpointMode,
  kwhAlreadyEarned = false,
}: {
  practiceSet: PracticeSet;
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
  checkpointMode?: CheckpointModeConfig;
  /** Sourced from PracticeSetSession's localStorage flag — true when the
   *  module has paid out kWh on this device before. Drives the "Already
   *  earned" badge that replaces the kWh pill on replay attempts. */
  kwhAlreadyEarned?: boolean;
}) {
  const tasks = practiceSet.tasks as PracticeTask[];

  const {
    totalCorrectFields,
    totalFields,
    tasksFullyCorrect,
    verifiedTaskCount,
    selfReviewTaskCount,
  } = useMemo(() => {
    let correctF = 0;
    let totalF = 0;
    let fullyCorrect = 0;
    let verifiedTasks = 0;
    let selfReviewTasks = 0;

    for (let i = 0; i < tasks.length; i++) {
      const fields = tasks[i].template?.fields ?? [];
      const ts = state.taskStates[i];

      // Code tasks (no fields) are submitted for self-review and excluded
      // from the validated-task denominator so the score isn't dragged
      // down by tasks we never tried to grade.
      if (fields.length === 0) {
        if (ts?.selfReview) selfReviewTasks++;
        continue;
      }

      verifiedTasks++;
      let taskAllCorrect = true;
      for (const field of fields) {
        totalF++;
        if (ts.answers[field.id]?.result === true) {
          correctF++;
        } else {
          taskAllCorrect = false;
        }
      }
      if (taskAllCorrect) fullyCorrect++;
    }

    return {
      totalCorrectFields: correctF,
      totalFields: totalF,
      tasksFullyCorrect: fullyCorrect,
      verifiedTaskCount: verifiedTasks,
      selfReviewTaskCount: selfReviewTasks,
    };
  }, [tasks, state.taskStates]);

  const scorePercent = totalFields > 0 ? Math.round((totalCorrectFields / totalFields) * 100) : 0;
  const passingThreshold = checkpointMode?.passingScorePercent ?? 70;
  const isGoodScore = scorePercent >= passingThreshold;
  const isCheckpoint = Boolean(checkpointMode);
  const checkpointPassed = isCheckpoint && isGoodScore;
  const checkpointFailed = isCheckpoint && !isGoodScore;
  const sessionKwhEarned = state.sessionKwhEarned;
  // Three mutually-exclusive payout states the results screen needs to
  // communicate. Order of preference: fresh win > already-earned > below-
  // threshold. Checkpoint mode short-circuits all three (it has its own
  // pass/fail UI). The threshold here mirrors what the server enforces,
  // pulled from computePracticePayout so any per-module override applies.
  const payoutPreview = useMemo(
    () => computePracticePayout(practiceSet, 100),
    [practiceSet],
  );
  const threshold = payoutPreview.threshold;
  const kwhAtMax = payoutPreview.kwhAtMax;
  const showKwhEarned = !isCheckpoint && sessionKwhEarned > 0;
  const showAlreadyEarned =
    !isCheckpoint && !showKwhEarned && kwhAlreadyEarned;
  const showBelowThreshold =
    !isCheckpoint &&
    !showKwhEarned &&
    !showAlreadyEarned &&
    scorePercent < threshold;

  // Fire the checkpoint callback exactly once per results-phase entry.
  useEffect(() => {
    if (!checkpointMode) return;
    checkpointMode.onResultsComputed({
      correct: totalCorrectFields,
      total: totalFields,
      percent: scorePercent,
      passed: scorePercent >= checkpointMode.passingScorePercent,
    });
    // We intentionally only fire on results-phase entry; recomputing on every
    // taskState change would double-record attempts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apple-minimalistic action button styles. The primary CTA inverts heading
  // text against the background — works across every reading mode (white pill
  // on dark, near-black pill on light) without any per-mode overrides.
  const primaryBtn =
    'rounded-[14px] py-3.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2';
  const primaryBtnStyle: React.CSSProperties = {
    background: 'var(--rm-text-heading)',
    color: 'var(--rm-bg)',
    border: '1px solid var(--rm-text-heading)',
  };
  const secondaryBtn =
    'rounded-[14px] py-3.5 text-[13px] font-medium transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:brightness-[1.06] focus-visible:ring-2 focus-visible:ring-offset-2';
  const secondaryBtnStyle: React.CSSProperties = {
    background: 'var(--rm-bg-elevated)',
    border: '1px solid var(--rm-border)',
    color: 'var(--rm-text)',
  };

  const encouragement = isCheckpoint
    ? checkpointPassed
      ? `You cleared the ${passingThreshold}% threshold. The next module is now unlocked.`
      : `You need ${passingThreshold}% to unlock the next module. Review the missed questions, then try again — questions are reshuffled on each attempt.`
    : scorePercent === 100
      ? 'Perfect score. Every field correct.'
      : scorePercent >= 80
        ? 'Strong performance. Review the few you missed to lock in your understanding.'
        : scorePercent >= 60
          ? 'Solid foundation. Review the missed questions and try again for a higher score.'
          : 'Good start. Take time to review the explanations, then give it another attempt.';

  const closeHref = checkpointMode?.returnHref ?? buildTrackMapPath(practiceSet);

  return (
    <div className="relative mx-auto max-w-2xl px-6 py-16 sm:px-8 lg:py-24">
      {/* Single centered column — the per-task breakdown moves out of the
          results screen; users who want to review individual answers can
          re-enter the practice and step through it. */}
      <div
        className="text-center mx-auto max-w-md"
        style={{
          opacity: 0,
          animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Brand mark — bare on the page, no tile. 3x size so it owns the
            top of the screen, slow 24s rotation gives it presence without
            distracting from the score. */}
        <div
          className="flex justify-center mb-10"
          style={{
            color: isGoodScore
              ? `rgb(${SUCCESS_RGB})`
              : 'var(--rm-text-heading)',
          }}
        >
          <ResultsLogoMark size={168} />
        </div>

        {/* Eyebrow label */}
        <p
          className="text-[11px] mb-5 uppercase tracking-[0.16em] font-semibold"
          style={{ color: 'var(--rm-text-secondary)' }}
        >
          {isCheckpoint
            ? checkpointPassed
              ? `${checkpointMode?.resultsHeading ?? 'Checkpoint'} Passed`
              : `${checkpointMode?.resultsHeading ?? 'Checkpoint'} — Try Again`
            : 'Practice Complete'}
        </p>

        {/* Large score number — Apple-style: huge, tight tracking, high contrast */}
        <div className="mb-3 flex items-baseline justify-center">
          <span
            className="text-7xl sm:text-8xl font-semibold tracking-[-0.04em] tabular-nums"
            style={{ color: 'var(--rm-text-heading)' }}
          >
            {scorePercent}
          </span>
          <span
            className="text-3xl sm:text-4xl font-medium ml-0.5"
            style={{ color: 'var(--rm-text-secondary)' }}
          >
            %
          </span>
        </div>

        {/* Subtitle — single concise line */}
        <p className="text-[14px] mb-6" style={{ color: 'var(--rm-text-secondary)' }}>
          {totalCorrectFields} of {totalFields} correct
          {tasksFullyCorrect > 0 && tasksFullyCorrect !== verifiedTaskCount && (
            <> · {tasksFullyCorrect} task{tasksFullyCorrect === 1 ? '' : 's'} perfect</>
          )}
          {selfReviewTaskCount > 0 && (
            <> · {selfReviewTaskCount} for self-review</>
          )}
        </p>

        {/* kWh earned this session — sum of per-task rewards plus the
            module-completion bonus. Only shown when something was actually
            awarded (checkpoint mode and full-replay attempts both land at
            0 and skip the badge). Chrome mirrors the secondary buttons on
            this screen (rm-bg-elevated + rm-border) and typography mirrors
            the eyebrow / subtitle so the badge reads as part of the same
            family rather than a brand-colored intruder. */}
        {showKwhEarned && (
          <div
            className="inline-flex items-baseline gap-2 rounded-full px-4 py-1.5 mb-8"
            style={{
              backgroundColor: 'var(--rm-bg-elevated)',
              border: '1px solid var(--rm-border)',
            }}
          >
            <span
              className="text-[13px] font-semibold tabular-nums tracking-tight"
              style={{ color: 'var(--rm-text-heading)' }}
            >
              +{sessionKwhEarned.toLocaleString()}
            </span>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: 'var(--rm-text-secondary)' }}
            >
              kWh earned
            </span>
          </div>
        )}

        {/* Replay attempt: kWh has already been paid for this module on
            this device, so no new kWh is on offer. Same chrome family as
            the kWh-earned pill, dimmed text to read as a status note
            rather than a reward. */}
        {showAlreadyEarned && (
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
            style={{
              backgroundColor: 'var(--rm-bg-elevated)',
              border: '1px solid var(--rm-border)',
            }}
          >
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: 'var(--rm-text-secondary)' }}
            >
              Already earned · No new kWh
            </span>
          </div>
        )}

        {/* Below the threshold: tells the user *why* no kWh, what the bar
            is, and what's at stake on the next attempt. Replaces the
            previously-silent "no pill" state so users below threshold
            understand they didn't miss a bug — they missed the bar. */}
        {showBelowThreshold && (
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
            style={{
              backgroundColor: 'var(--rm-bg-elevated)',
              border: '1px solid var(--rm-border)',
            }}
          >
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: 'var(--rm-text-secondary)' }}
            >
              Score {threshold}%+ to earn up to {kwhAtMax.toLocaleString()} kWh
            </span>
          </div>
        )}

        {/* Encouragement */}
        <p
          className="text-[15px] leading-relaxed max-w-md mx-auto"
          style={{ color: 'var(--rm-text)' }}
        >
          {encouragement}
        </p>

        {/* Action buttons — Try again (repeat the practice) + leave the
            session. The user is in control of which they want; primary is
            picked based on score so the obvious next step is always one
            click away. */}
        <div className="flex flex-col gap-3 mt-10 max-w-md mx-auto">
          {checkpointFailed ? (
            <>
              <button
                onClick={() => {
                  dispatch({ type: 'RESET', taskCount: tasks.length });
                  checkpointMode?.onRetry?.();
                }}
                className={primaryBtn}
                style={primaryBtnStyle}
              >
                <RotateCcw className="h-4 w-4" />
                Retry checkpoint
              </button>
              <Link
                href={closeHref}
                className={secondaryBtn}
                style={secondaryBtnStyle}
              >
                Back to track
              </Link>
            </>
          ) : checkpointPassed && checkpointMode?.nextModuleHref ? (
            <>
              <Link
                href={checkpointMode.nextModuleHref}
                className={primaryBtn}
                style={primaryBtnStyle}
              >
                {checkpointMode.nextModuleTitle
                  ? `Next module: ${checkpointMode.nextModuleTitle}`
                  : 'Start next module'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={closeHref}
                className={secondaryBtn}
                style={secondaryBtnStyle}
              >
                Back to track
              </Link>
            </>
          ) : isGoodScore ? (
            // Strong score — exit-to-home wins primary, "try again" stays available.
            <>
              <Link
                href="/home"
                className={primaryBtn}
                style={primaryBtnStyle}
              >
                <LogOut className="h-4 w-4" />
                Exit to home
              </Link>
              <button
                onClick={() => dispatch({ type: 'RESET', taskCount: tasks.length })}
                className={secondaryBtn}
                style={secondaryBtnStyle}
              >
                <RotateCcw className="h-4 w-4" />
                Try again
              </button>
            </>
          ) : (
            // Below threshold — "try again" wins primary, exit-to-home demoted.
            <>
              <button
                onClick={() => dispatch({ type: 'RESET', taskCount: tasks.length })}
                className={primaryBtn}
                style={primaryBtnStyle}
              >
                <RotateCcw className="h-4 w-4" />
                Try again
              </button>
              <Link
                href="/home"
                className={secondaryBtn}
                style={secondaryBtnStyle}
              >
                <LogOut className="h-4 w-4" />
                Exit to home
              </Link>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

// ── Session persistence ────────────────────────────────────────────────────────

const PRACTICE_SESSION_KEY = 'practice-session:v1';

interface PersistedPracticeSession {
  moduleId: string;
  route: string;
  state: SessionState;
  savedAt: string;
}

// Checkpoints generate a fresh random shuffle of questions on every mount, so
// restoring a saved SessionState (whose answers are keyed by old shuffle order)
// would attach stale results to different questions. Skip persistence entirely
// for checkpoint sessions — they're meant to be one-shot and the user expects
// a clean board on refresh.
const isCheckpointModuleId = (moduleId: string) => moduleId.startsWith('checkpoint-');

function saveSession(moduleId: string, route: string, state: SessionState) {
  if (state.phase === 'start') return;
  if (isCheckpointModuleId(moduleId)) return;
  try {
    const snapshot: PersistedPracticeSession = {
      moduleId,
      route,
      state,
      savedAt: new Date().toISOString(),
    };
    window.sessionStorage.setItem(PRACTICE_SESSION_KEY, JSON.stringify(snapshot));
  } catch { /* ignore */ }
}

function loadSession(moduleId: string): SessionState | null {
  if (isCheckpointModuleId(moduleId)) return null;
  try {
    const raw = window.sessionStorage.getItem(PRACTICE_SESSION_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as PersistedPracticeSession;
    if (snapshot.moduleId !== moduleId) {
      clearSession();
      return null;
    }
    if (snapshot.state.phase === 'start') return null;
    return snapshot.state;
  } catch {
    return null;
  }
}

function clearSession() {
  try { window.sessionStorage.removeItem(PRACTICE_SESSION_KEY); } catch { /* ignore */ }
}

/** Read the active practice session info for the mini-player (called from outside) */
export function getActivePracticeSession(): PersistedPracticeSession | null {
  try {
    const raw = window.sessionStorage.getItem(PRACTICE_SESSION_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as PersistedPracticeSession;
    if (snapshot.state.phase !== 'session') return null;
    return snapshot;
  } catch {
    return null;
  }
}

// ── Brief Viewer (start screen only — rendered at /[modulePrefix]) ───────────

export function PracticeSetBrief({ practiceSet }: { practiceSet: PracticeSet }) {
  const pathname = usePathname();
  const sessionPath = `${pathname}/session`;

  return (
    <div className="min-h-screen" style={{ background: '#0a0c0e' }}>
      <StartScreen
        practiceSet={practiceSet}
        sessionPath={sessionPath}
      />
    </div>
  );
}

// ── Session Viewer (task + results — rendered at /[modulePrefix]/session) ─────

export function PracticeSetSession({
  practiceSet,
  checkpointMode,
}: {
  practiceSet: PracticeSet;
  checkpointMode?: CheckpointModeConfig;
}) {
  const originalTasks = practiceSet.tasks as PracticeTask[];
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const moduleId = practiceSet.metadata?.moduleId ?? '';
  // ESC exits practice session and returns to the tree map.
  // - When mounted under /learn/[topic]/theory/[level]?practice=..., the tree map IS this pathname (strip query).
  // - When mounted under the legacy /operations/practice/[topic]/[level]/[modulePrefix] route, derive the learn URL.
  // - A `?from=` query param overrides the derivation, used when entering from
  //   /practice/coding/[topic] so the back button returns to the topic tier
  //   picker, not the theory track map. Restricted to internal absolute paths.
  let treeMapPath = pathname.replace(/\/session\/?$/, '');
  const fromParam = searchParams?.get('from') ?? null;
  if (fromParam && fromParam.startsWith('/') && !fromParam.startsWith('//')) {
    treeMapPath = fromParam;
  }
  const opsMatch = !fromParam ? pathname.match(/^\/operations\/practice\/([^/]+)\/([^/]+)/) : null;
  if (opsMatch) {
    treeMapPath = `/learn/${opsMatch[1]}/theory/${opsMatch[2]}`;
  }

  const [state, dispatch] = useReducer(sessionReducer, originalTasks.length, (count) => ({
    ...createInitialState(count),
    phase: 'session' as const,
  }));

  // Tasks the user actually sees: original on first attempt (seed === 0),
  // deterministically reshuffled on every retry (seed > 0). Because the
  // seed is stored in SessionState and persisted, a page refresh restores
  // the exact same ordering — same task at position 0, same field order,
  // same option order — so saved answers always realign correctly.
  const tasks = useMemo(
    () => reshuffleTasksForRetry(originalTasks, state.shuffleSeed),
    [originalTasks, state.shuffleSeed],
  );

  // Mirror the shuffled tasks back into a derived practiceSet so child
  // components (TaskScreen, ResultsScreen) read the same view via their
  // existing `practiceSet` prop without each re-deriving the shuffle.
  const shuffledPracticeSet = useMemo(
    () => (tasks === originalTasks ? practiceSet : { ...practiceSet, tasks }),
    [practiceSet, tasks, originalTasks],
  );
  const [hydrated, setHydrated] = useState(false);
  const focusMode = useReadingModeStore((s) => s.focusMode);
  const readingMode = useReadingModeStore((s) => s.mode);

  // "Module already paid kWh" flag. Persisted to localStorage so the
  // gate survives RESET (Try again — TaskScreen unmounts and the in-mount
  // refs would otherwise reset), full reloads, and tab restarts. The
  // 5000-kWh server cap is the ultimate integrity bound; this flag is the
  // UX-level gate that keeps replays from re-paying without forcing the
  // server cap to do all the work. Skipped for checkpoint modules.
  const kwhPaidStorageKey = useMemo(
    () =>
      moduleId && !moduleId.startsWith('checkpoint-')
        ? `stablegrid:practice-paid:${moduleId}`
        : null,
    [moduleId],
  );
  const [kwhAlreadyEarned, setKwhAlreadyEarned] = useState(false);
  useEffect(() => {
    if (!kwhPaidStorageKey || !moduleId || moduleId.startsWith('checkpoint-')) {
      return;
    }
    let cancelled = false;
    // Fast path: prime from localStorage so the indicator doesn't flicker
    // off on remount before the server fetch resolves.
    try {
      if (window.localStorage.getItem(kwhPaidStorageKey)) {
        setKwhAlreadyEarned(true);
      }
    } catch {
      /* localStorage unavailable — fall through to server fetch */
    }
    // Server reconciliation: the payout endpoint is the source of truth.
    // If the server says paid, mirror to localStorage so the next mount
    // starts already-paid. If the server says not paid (and localStorage
    // disagrees, e.g. user hit the global cap on a different device and
    // the row was rolled back), trust the server.
    void (async () => {
      try {
        const res = await fetch(
          `/api/operations/practice/payout?moduleId=${encodeURIComponent(moduleId)}`,
          { credentials: 'same-origin' },
        );
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as { alreadyPaid?: boolean };
        if (cancelled) return;
        if (json.alreadyPaid) {
          setKwhAlreadyEarned(true);
          try {
            window.localStorage.setItem(kwhPaidStorageKey, '1');
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* network failure — leave the localStorage value in place */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kwhPaidStorageKey, moduleId]);
  const markKwhEarned = useCallback(() => {
    if (!kwhPaidStorageKey) return;
    try {
      window.localStorage.setItem(kwhPaidStorageKey, '1');
    } catch {
      /* ignore */
    }
    setKwhAlreadyEarned(true);
  }, [kwhPaidStorageKey]);

  // Headline kWh number for the top-bar "available" pill — sourced from
  // the same formula the server uses, so what we promise here is exactly
  // what the payout endpoint pays at a perfect score.
  const kwhAtMax = useMemo(
    () => computePracticePayout(practiceSet, 100).kwhAtMax,
    [practiceSet],
  );
  const kwhThreshold = useMemo(
    () =>
      practiceSet.metadata?.minScorePercentForKwh ??
      DEFAULT_PRACTICE_KWH_THRESHOLD,
    [practiceSet],
  );

  // Detect in-progress checkpoint work so we can warn before navigation
  // discards it. Practice sets aren't graded, so we only guard checkpoint
  // attempts. "Has progress" means the quiz hasn't been submitted (still in
  // session phase) and at least one question has been answered or checked.
  const hasUnsavedCheckpointProgress =
    Boolean(checkpointMode) &&
    state.phase === 'session' &&
    state.taskStates.some(
      (ts) =>
        ts.checked ||
        Object.values(ts.answers).some((a) => a && a.value !== '')
    );

  // beforeunload: catches tab close, refresh, address-bar nav. Modern browsers
  // ignore custom messages — they show a generic "Leave site?" dialog when
  // returnValue is set.
  useEffect(() => {
    if (!hasUnsavedCheckpointProgress) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedCheckpointProgress]);

  const confirmLeaveCheckpoint = useCallback(() => {
    if (!hasUnsavedCheckpointProgress) return true;
    return window.confirm(
      'Leave the checkpoint? Your current attempt will be discarded — questions are reshuffled when you return.'
    );
  }, [hasUnsavedCheckpointProgress]);

  // Restore session from sessionStorage after mount
  useEffect(() => {
    const saved = loadSession(moduleId);
    if (saved && saved.taskStates.length === tasks.length) {
      dispatch({ type: 'RESTORE', state: saved });
    }
    setHydrated(true);
  }, [moduleId, tasks.length]);

  // Persist state to sessionStorage on every change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    saveSession(moduleId, pathname ?? '', state);
  }, [state, moduleId, pathname, hydrated]);

  // Don't render until hydrated to avoid flash
  if (!hydrated) {
    return <div className="min-h-screen" />;
  }

  const moduleNumber = (practiceSet.metadata?.moduleId ?? '').replace(/^module-/, '');

  return (
    <div
      className="relative flex h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] flex-col overflow-hidden bg-surface lg:h-[100dvh]"
      data-focus-mode={focusMode ? 'true' : undefined}
    >
      {state.phase === 'session' && (
        <>
          {/* Top bar — mirrors the reading session top bar.
              In checkpoint mode we deliberately keep this visible inside focus
              mode (no `data-hide-on-focus`) and hide the Pomodoro/Sprint
              picker, since a graded checkpoint has its own pacing. */}
          <div
            {...(checkpointMode ? {} : { 'data-hide-on-focus': true })}
            className="flex h-12 flex-shrink-0 items-center border-b border-outline-variant/20 bg-surface/95 backdrop-blur-md px-4 sticky top-0 z-40"
          >
            {/* Left: back to tree map */}
            <div className="flex items-center gap-1.5">
              <a
                href={treeMapPath}
                onClick={(e) => {
                  e.preventDefault();
                  if (!confirmLeaveCheckpoint()) return;
                  clearSession();
                  window.location.href = treeMapPath;
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Back</span>
              </a>
            </div>

            {/* Center: practice set context or active session.
                `min-w-0` + `truncate` so a long module slug on a narrow
                phone shrinks the label rather than pushing the right-side
                controls off-screen. */}
            <div className="flex-1 min-w-0 flex items-center justify-center gap-2 px-2">
              <span className="font-mono text-[11px] text-on-surface-variant/70 tracking-wide truncate">
                {checkpointMode?.topbarLabel ?? moduleNumber}
                <span className="mx-1.5 text-outline-variant/50">·</span>
                <span className="text-on-surface/80">
                  {checkpointMode ? 'Question' : 'Task'} {state.currentTaskIndex + 1} of {tasks.length}
                </span>
              </span>
              {/* kWh status pill — three states. Hidden in checkpoint
                  mode (no kWh path there). Hidden on small screens to
                  keep the topbar compact; the results screen surfaces the
                  same information when it matters. */}
              {!checkpointMode && (
                kwhAlreadyEarned ? (
                  <span
                    className="hidden sm:inline-flex items-center font-mono text-[9px] font-bold uppercase tracking-[0.18em] rounded-full px-2 py-0.5"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                    title="kWh already earned for this practice — replays don't pay again"
                  >
                    Replay · Already earned
                  </span>
                ) : kwhAtMax > 0 ? (
                  <span
                    className="hidden sm:inline-flex items-center font-mono text-[9px] font-bold uppercase tracking-[0.18em] rounded-full px-2 py-0.5"
                    style={{
                      backgroundColor: 'rgba(153,247,255,0.06)',
                      border: '1px solid rgba(153,247,255,0.18)',
                      color: 'rgba(153,247,255,0.8)',
                    }}
                    title={`Earn up to ${kwhAtMax.toLocaleString()} kWh — score ${kwhThreshold}%+ to qualify`}
                  >
                    +{kwhAtMax.toLocaleString()} kWh · {kwhThreshold}%+ to earn
                  </span>
                ) : null
              )}
            </div>

            {/* Right: reading mode + focus toggle.
                Sprint/Pomodoro/Deep-Focus sessions are theory-only; practice
                runs untimed by default, so the Start session entry point is
                intentionally absent here. */}
            <div className="flex items-center gap-1">
              <ReadingModeDropdown />
              <FocusModeButton />
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto"
            data-reading-mode={readingMode}
            style={{ backgroundColor: 'var(--rm-bg)' }}
          >
            <FocusWrapper briefPath={treeMapPath} beforeExit={confirmLeaveCheckpoint}>
              <TaskScreen
                practiceSet={shuffledPracticeSet}
                state={state}
                dispatch={dispatch}
                checkpointMode={checkpointMode}
                kwhAlreadyEarned={kwhAlreadyEarned}
                onKwhEarned={markKwhEarned}
              />
            </FocusWrapper>
          </div>
        </>
      )}

      {state.phase === 'results' && (
        <div
          className="flex-1 overflow-y-auto"
          data-reading-mode={readingMode}
          style={{ backgroundColor: 'var(--rm-bg)' }}
        >
          <ResultsScreen
            practiceSet={shuffledPracticeSet}
            state={state}
            dispatch={dispatch}
            checkpointMode={checkpointMode}
            kwhAlreadyEarned={kwhAlreadyEarned}
          />
        </div>
      )}

    </div>
  );
}
