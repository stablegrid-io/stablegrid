'use client';

import React, { useReducer, useCallback, useEffect, useMemo, useState, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  Clock3,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Eye,
  ArrowRight,
  Trophy,
  Target,
} from 'lucide-react';
import type { PracticeSet, PracticeTask, TemplateField } from '@/data/operations/practice-sets';
import { useReadingModeStore } from '@/lib/stores/useReadingModeStore';
import { useTheorySessionTimer } from '@/lib/hooks/useTheorySessionTimer';
import {
  useTheorySessionPreferencesStore,
  resolveTheorySessionMethodConfigs,
} from '@/lib/stores/useTheorySessionPreferencesStore';
import { TheorySessionTopbar } from '@/components/learn/theory/TheorySessionTopbar';
import dynamic from 'next/dynamic';

const TheorySessionPicker = dynamic(
  () => import('@/components/learn/theory/TheorySessionPicker').then((m) => m.TheorySessionPicker),
  { ssr: false }
);

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

// ── Types ──────────────────────────────────────────────────────────────────────

type Phase = 'start' | 'session' | 'results';

interface FieldAnswer {
  value: string;
  result: boolean | null;
}

interface TaskState {
  answers: Record<string, FieldAnswer>;
  checked: boolean;
  allCorrect: boolean;
  // Code tasks have no machine-verifiable answer fields, so we surface a
  // neutral "submitted, self-review" state instead of falsely marking the
  // task correct. Keeping it optional preserves backward compatibility
  // with sessionStorage snapshots from before this flag existed.
  selfReview?: boolean;
}

interface SessionState {
  phase: Phase;
  currentTaskIndex: number;
  taskStates: TaskState[];
  isReview: boolean;
}

type SessionAction =
  | { type: 'START' }
  | { type: 'SET_ANSWER'; taskIndex: number; fieldId: string; value: string }
  | { type: 'CHECK_ANSWERS'; tasks: PracticeTask[] }
  | { type: 'NEXT_TASK' }
  | { type: 'PREV_TASK' }
  | { type: 'GO_TO_TASK'; index: number }
  | { type: 'FINISH' }
  | { type: 'REVIEW' }
  | { type: 'BACK_TO_RESULTS' }
  | { type: 'RESET'; taskCount: number }
  | { type: 'RESTORE'; state: SessionState }
  | { type: 'BACK_TO_START' };

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

// ── Reducer ────────────────────────────────────────────────────────────────────

function createInitialState(taskCount: number): SessionState {
  return {
    phase: 'start',
    currentTaskIndex: 0,
    taskStates: Array.from({ length: taskCount }, () => ({
      answers: {},
      checked: false,
      allCorrect: false,
    })),
    isReview: false,
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

    case 'CHECK_ANSWERS': {
      const idx = state.currentTaskIndex;
      const task = action.tasks[idx];
      const fields = task.template?.fields ?? [];
      const newStates = [...state.taskStates];
      const ts = { ...newStates[idx] };
      const newAnswers: Record<string, FieldAnswer> = { ...ts.answers };
      let allCorrect = true;

      // Code tasks have no validatable fields — we can't claim correctness.
      // Mark as submitted for self-review instead so the UI shows a neutral
      // badge rather than a false "correct" state.
      if (task.type === 'write_the_code' && fields.length === 0) {
        const codeVal = ts.answers['__code']?.value ?? '';
        newAnswers['__code'] = { value: codeVal, result: null };
        ts.answers = newAnswers;
        ts.checked = true;
        ts.allCorrect = false;
        ts.selfReview = true;
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
      return createInitialState(action.taskCount);

    case 'RESTORE':
      return action.state;

    case 'BACK_TO_START':
      return { ...state, phase: 'start' };

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
          bg = 'rgba(255,255,255,0.35)';
          border = 'transparent';
          size = 'w-2.5 h-2.5';
        } else if (isChecked && isCorrect) {
          bg = `rgb(${GREEN})`;
          border = 'transparent';
          size = 'w-2.5 h-2.5';
        } else if (isChecked && !isCorrect) {
          bg = `rgb(${RED})`;
          border = 'transparent';
          size = 'w-2.5 h-2.5';
        } else if (isCurrent) {
          bg = `rgb(${ACCENT})`;
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
}: {
  briefPath: string;
  children: React.ReactNode;
}) {
  const exitLinkRef = React.useRef<HTMLAnchorElement>(null);

  const exitSession = useCallback(() => {
    clearSession();
    const store = useReadingModeStore.getState();
    if (store.focusMode) store.toggleFocus();
    exitLinkRef.current?.click();
  }, []);

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
}: {
  practiceSet: PracticeSet;
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
}) {
  const tasks = practiceSet.tasks as PracticeTask[];
  const task = tasks[state.currentTaskIndex];
  const taskState = state.taskStates[state.currentTaskIndex];
  const fields = task.template?.fields ?? [];
  const isLast = state.currentTaskIndex === tasks.length - 1;
  const isFirst = state.currentTaskIndex === 0;
  const readingMode = useReadingModeStore((s) => s.mode);
  const focusMode = useReadingModeStore((s) => s.focusMode);
  const exitSession = useContext(FocusWrapperContext);

  const isCodeTask = !!(task as any).starterScaffold;
  const allFieldsFilled = isCodeTask
    ? (taskState.answers['__code']?.value?.trim()?.length ?? 0) > 0
    : fields.every((f) => {
        const val = taskState.answers[f.id]?.value?.trim();
        return val && val.length > 0;
      });

  const handleCheck = useCallback(() => {
    dispatch({ type: 'CHECK_ANSWERS', tasks });
  }, [dispatch, tasks]);

  const handleNext = useCallback(() => {
    if (isLast) {
      // Persist practice completion before flipping to the results phase so
      // the result survives a tab close. Fire-and-forget — UX must not wait
      // on the network and any failure is recoverable on the next visit.
      void persistPracticeCompletion(practiceSet);
      dispatch({ type: 'FINISH' });
    } else {
      dispatch({ type: 'NEXT_TASK' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dispatch, isLast, practiceSet]);

  const handlePrev = useCallback(() => {
    dispatch({ type: 'PREV_TASK' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dispatch]);

  const handleNavigate = useCallback((index: number) => {
    dispatch({ type: 'GO_TO_TASK', index });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dispatch]);

  const handleAnswerChange = useCallback((fieldId: string, value: string) => {
    dispatch({ type: 'SET_ANSWER', taskIndex: state.currentTaskIndex, fieldId, value });
  }, [dispatch, state.currentTaskIndex]);

  return (
    <div
      data-reading-mode={readingMode}
      className={focusMode ? 'fixed inset-0 z-40 overflow-y-auto' : ''}
      style={{ backgroundColor: 'var(--rm-bg, transparent)' }}
    >
    <div className={`relative mx-auto w-[85%] py-8 lg:py-12 ${focusMode ? 'min-h-screen' : ''}`}>

      {/* Floating controls — visible in focus mode */}
      {focusMode && (
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
        {/* Task card — always split panel layout */}
        <div className="space-y-6">
          <SplitPanelCodeTask
            key={task.id}
            task={task}
            practiceSet={practiceSet}
            topic={practiceSet.topic}
            taskState={taskState}
            isReview={state.isReview}
            onAnswerChange={handleAnswerChange}
            onCheck={handleCheck}
            onNext={handleNext}
            onSkip={isCodeTask ? handleNext : () => {
              if (state.isReview) {
                dispatch({ type: 'BACK_TO_RESULTS' });
              } else {
                handleNext();
              }
            }}
            checked={taskState.checked}
            isLast={isLast}
          />

          {/* Footer navigation */}
          <div className="flex items-center gap-3 pt-2">
            {/* Previous */}
            {!isFirst && (
              <button
                onClick={handlePrev}
                className="rounded-[14px] px-5 py-3 text-[13px] font-medium transition-all duration-200 cursor-pointer flex items-center gap-2"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Previous
              </button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Non-code: Check Answer (before checked) */}
            {!isCodeTask && !state.isReview && !taskState.checked && (
              <button
                onClick={handleCheck}
                disabled={!allFieldsFilled}
                className="rounded-[14px] px-6 py-3.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 flex items-center gap-2 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: allFieldsFilled ? 'rgba(255,255,255,0.12)' : 'var(--rm-bg-elevated)',
                  border: `1px solid ${allFieldsFilled ? 'rgba(255,255,255,0.2)' : 'var(--rm-border)'}`,
                  color: allFieldsFilled ? '#ffffff' : 'var(--rm-text-secondary)',
                }}
              >
                Check Answer
              </button>
            )}

            {/* Continue / See Results */}
            {(isCodeTask || taskState.checked || state.isReview) && (
              !isLast ? (
                <button
                  onClick={handleNext}
                  className="rounded-[14px] px-6 py-3.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.8)',
                  }}
                >
                  Continue
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="rounded-[14px] px-6 py-3.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.8)',
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
        className="w-full text-left px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        {/* Status icon */}
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: isSelfReview
              ? 'rgba(255,255,255,0.06)'
              : taskState.allCorrect
                ? `rgba(${GREEN},0.08)`
                : `rgba(${RED},0.08)`,
          }}
        >
          {isSelfReview ? (
            <Eye className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} />
          ) : taskState.allCorrect ? (
            <Check className="h-3.5 w-3.5" style={{ color: `rgb(${GREEN})` }} />
          ) : (
            <X className="h-3.5 w-3.5" style={{ color: `rgb(${RED})` }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-white/80 truncate">
            Task {index + 1}: {task.title}
          </div>
          <div className="text-[11px] text-white/25 mt-0.5">
            {isSelfReview
              ? 'Submitted — review your output'
              : `${correctFields}/${totalFields} fields correct`}
          </div>
        </div>

        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-white/20" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
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
            const tint = isCorrect ? GREEN : RED;
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
                  background: `rgba(${tint},0.03)`,
                  border: `1px solid rgba(${tint},0.08)`,
                }}
              >
                <div className="text-[11px] text-white/30 mb-1.5">{field.label}</div>
                <div className="flex items-start gap-2">
                  {isCorrect ? (
                    <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: `rgb(${GREEN})` }} />
                  ) : (
                    <X className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: `rgb(${RED})` }} />
                  )}
                  <div className="text-[12px] min-w-0">
                    <div style={{ color: `rgba(${tint},0.8)` }}>
                      {answer?.value || '(no answer)'}
                    </div>
                    {!isCorrect && (
                      <div className="mt-1.5" style={{ color: `rgba(${GREEN},0.6)` }}>
                        Correct: {correctValue}{toleranceHint}
                        {acceptedAlternates.length > 0 && (
                          <span className="block text-[11px] mt-0.5" style={{ color: `rgba(${GREEN},0.45)` }}>
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

function ResultsScreen({
  practiceSet,
  state,
  dispatch,
}: {
  practiceSet: PracticeSet;
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
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
  const isGoodScore = scorePercent >= 70;

  return (
    <div className="relative mx-auto max-w-5xl px-6 py-16 sm:px-8 lg:py-24">
      {/* Score section */}
      <div
        className="text-center mb-16"
        style={{
          opacity: 0,
          animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: isGoodScore ? `rgba(${GREEN},0.08)` : `rgba(${ACCENT},0.08)`,
              border: `1px solid ${isGoodScore ? `rgba(${GREEN},0.12)` : `rgba(${ACCENT},0.12)`}`,
            }}
          >
            {isGoodScore ? (
              <Trophy className="h-6 w-6" style={{ color: `rgb(${GREEN})` }} />
            ) : (
              <Target className="h-6 w-6" style={{ color: `rgb(${ACCENT})` }} />
            )}
          </div>
        </div>

        {/* Message */}
        <p className="text-[13px] text-white/30 mb-3 uppercase tracking-[0.12em] font-medium">
          Practice Complete
        </p>

        {/* Large score */}
        <div className="mb-3">
          <span className="text-6xl sm:text-7xl font-bold tracking-tighter text-white/90">
            {scorePercent}
          </span>
          <span className="text-2xl font-medium text-white/20">%</span>
        </div>

        {/* Subtitle */}
        <p className="text-[14px] text-white/40 mb-2">
          {totalCorrectFields} of {totalFields} fields correct
        </p>
        <p className="text-[13px] text-white/25">
          {tasksFullyCorrect} of {verifiedTaskCount} tasks fully correct
          {selfReviewTaskCount > 0 && (
            <> · {selfReviewTaskCount} code task{selfReviewTaskCount === 1 ? '' : 's'} for self-review</>
          )}
        </p>

        {/* Encouragement text */}
        <p className="text-[14px] text-white/35 mt-6 max-w-md mx-auto">
          {scorePercent === 100
            ? 'Perfect score. Every field correct.'
            : scorePercent >= 80
              ? 'Strong performance. Review the few you missed to lock in your understanding.'
              : scorePercent >= 60
                ? 'Solid foundation. Review the missed questions and try again for a higher score.'
                : 'Good start. Take time to review the explanations, then give it another attempt.'}
        </p>

        {/* Action buttons — primary "Continue" returns to the track map where
            the just-completed module is now marked done and the next one
            unlocked. */}
        <div className="flex flex-col gap-3 mt-10 max-w-md mx-auto">
          <Link
            href={buildTrackMapPath(practiceSet)}
            className="rounded-[14px] py-3.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: 'rgba(255,255,255,0.92)',
              color: '#0a0c0e',
            }}
          >
            Continue to track
            <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => dispatch({ type: 'REVIEW' })}
              className="flex-1 rounded-[14px] py-3.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: 'var(--rm-bg-elevated)',
                border: '1px solid var(--rm-border)',
                color: 'var(--rm-text-secondary)',
              }}
            >
              <Eye className="h-4 w-4" />
              Review Answers
            </button>

            <button
              onClick={() => dispatch({ type: 'RESET', taskCount: tasks.length })}
              className="flex-1 rounded-[14px] py-3.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: 'var(--rm-bg-elevated)',
                border: '1px solid var(--rm-border)',
                color: 'var(--rm-text-secondary)',
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>

      {/* Per-task breakdown */}
      <div
        className="space-y-2"
        style={{
          opacity: 0,
          animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 100ms forwards',
        }}
      >
        <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/20 mb-4 px-1">
          Task Breakdown
        </h3>

        {tasks.map((task, i) => (
          <ResultsBreakdownRow
            key={task.id}
            task={task}
            taskState={state.taskStates[i]}
            index={i}
          />
        ))}
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

function saveSession(moduleId: string, route: string, state: SessionState) {
  if (state.phase === 'start') return;
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

export function PracticeSetSession({ practiceSet }: { practiceSet: PracticeSet }) {
  const tasks = practiceSet.tasks as PracticeTask[];
  const pathname = usePathname();
  const moduleId = practiceSet.metadata?.moduleId ?? '';
  // ESC exits practice session and returns to the tree map.
  // - When mounted under /learn/[topic]/theory/[level]?practice=..., the tree map IS this pathname (strip query).
  // - When mounted under the legacy /operations/practice/[topic]/[level]/[modulePrefix] route, derive the learn URL.
  let treeMapPath = pathname.replace(/\/session\/?$/, '');
  const opsMatch = pathname.match(/^\/operations\/practice\/([^/]+)\/([^/]+)/);
  if (opsMatch) {
    treeMapPath = `/learn/${opsMatch[1]}/theory/${opsMatch[2]}`;
  }

  const [state, dispatch] = useReducer(sessionReducer, tasks.length, (count) => ({
    ...createInitialState(count),
    phase: 'session' as const,
  }));
  const [hydrated, setHydrated] = useState(false);
  const [sessionPickerVisible, setSessionPickerVisible] = useState(false);
  const focusMode = useReadingModeStore((s) => s.focusMode);

  // Reuse the reading session timer with a separate scope so practice sessions
  // (Sprint / Pomodoro / Deep Focus / Free Practice) run independently of reading.
  const practiceSession = useTheorySessionTimer('practice-global');
  const { methodConfigs: sessionMethodConfigs, hasHydrated: sessionDefaultsHydrated } =
    useTheorySessionPreferencesStore((s) => ({
      methodConfigs: s.methodConfigs,
      hasHydrated: s.hasHydrated,
    }));
  const resolvedSessionMethodConfigs = useMemo(
    () => resolveTheorySessionMethodConfigs(sessionMethodConfigs),
    [sessionMethodConfigs]
  );
  const startPracticeSession = practiceSession.start;

  // Auto-reset session when it completes
  useEffect(() => {
    if (practiceSession.phase === 'complete') {
      practiceSession.reset();
    }
  }, [practiceSession.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const openSessionPicker = useCallback(() => {
    if (!sessionDefaultsHydrated) return;
    setSessionPickerVisible(true);
  }, [sessionDefaultsHydrated]);

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
      className="relative flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-surface lg:h-[calc(100dvh-3.5rem)]"
      data-focus-mode={focusMode ? 'true' : undefined}
    >
      {state.phase === 'session' && (
        <>
          {/* Top bar — mirrors the reading session top bar */}
          <div
            data-hide-on-focus
            className="flex h-12 flex-shrink-0 items-center border-b border-outline-variant/20 bg-surface/95 backdrop-blur-md px-4 sticky top-0 z-40"
          >
            {/* Left: back to tree map */}
            <div className="flex items-center gap-1.5">
              <a
                href={treeMapPath}
                onClick={(e) => {
                  e.preventDefault();
                  clearSession();
                  window.location.href = treeMapPath;
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Learning Path</span>
              </a>
            </div>

            {/* Center: practice set context or active session */}
            <div className="flex-1 flex items-center justify-center">
              {practiceSession.hasActiveSession ? (
                <TheorySessionTopbar session={practiceSession} />
              ) : (
                <span className="font-mono text-[11px] text-on-surface-variant/70 tracking-wide">
                  {moduleNumber}
                  <span className="mx-1.5 text-outline-variant/50">·</span>
                  <span className="text-on-surface/80">
                    Task {state.currentTaskIndex + 1} of {tasks.length}
                  </span>
                </span>
              )}
            </div>

            {/* Right: reading mode + start session */}
            <div className="flex items-center gap-1">
              <ReadingModeDropdown />
              <FocusModeButton />
              {!practiceSession.hasActiveSession && !moduleId.startsWith('capstone-') && (
                <>
                  <div className="mx-1 h-5 w-px bg-white/[0.12]" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={openSessionPicker}
                    disabled={!sessionDefaultsHydrated}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[14px] border border-white/[0.12] bg-white/[0.06] px-3 text-xs font-medium text-white/70 transition-all hover:bg-white/[0.1] hover:border-white/[0.18]"
                  >
                    <Clock3 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Start session</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <FocusWrapper briefPath={treeMapPath}>
              <TaskScreen
                practiceSet={practiceSet}
                state={state}
                dispatch={dispatch}
              />
            </FocusWrapper>
          </div>
        </>
      )}

      {state.phase === 'results' && (
        <div className="flex-1 overflow-y-auto">
          <ResultsScreen
            practiceSet={practiceSet}
            state={state}
            dispatch={dispatch}
          />
        </div>
      )}

      {sessionPickerVisible && !practiceSession.hasActiveSession ? (
        <TheorySessionPicker
          isOpen
          configsByMethod={resolvedSessionMethodConfigs}
          lessonTitle={practiceSet.title}
          lessonDurationMinutes={
            tasks.reduce((s, t: any) => s + (t.estimatedMinutes ?? 0), 0)
          }
          onStart={(config) => {
            setSessionPickerVisible(false);
            startPracticeSession(config);
          }}
          onOpenSettings={() => {
            setSessionPickerVisible(false);
            window.location.href = '/settings?tab=reading';
          }}
          onDismiss={() => setSessionPickerVisible(false)}
        />
      ) : null}
    </div>
  );
}
