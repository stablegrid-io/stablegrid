'use client';

import { useReducer, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  Check,
  X,
  FlaskConical,
  Lightbulb,
  BarChart3,
  Code2,
  Layers,
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
import dynamic from 'next/dynamic';

const ReadingModeDropdown = dynamic(
  () => import('@/components/learn/theory/ReadingModeDropdown').then((m) => m.ReadingModeDropdown),
  { ssr: false }
);

// ── Constants ──────────────────────────────────────────────────────────────────

const ACCENT = '153,247,255';
const GREEN = '34,197,94';
const RED = '239,68,68';

const TYPE_CONFIG: Record<string, { label: string; icon: typeof FlaskConical; color: string }> = {
  concept_identification: { label: 'Concept ID', icon: Lightbulb, color: '168,162,255' },
  output_prediction: { label: 'Output Prediction', icon: BarChart3, color: '108,200,255' },
  synthesis: { label: 'Synthesis', icon: Layers, color: '255,180,108' },
  write_the_code: { label: 'Write Code', icon: Code2, color: '120,255,180' },
};

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
  | { type: 'RESTORE'; state: SessionState };

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
      const newAnswers: Record<string, FieldAnswer> = {};
      let allCorrect = true;

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

        // Only allow navigating to checked tasks or the current task
        const canNavigate = isChecked || isCurrent;

        let bg: string;
        let border: string;
        let size: string;

        if (isChecked && isCorrect) {
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
          border = 'rgba(255,255,255,0.15)';
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

// ── FieldRenderer ──────────────────────────────────────────────────────────────

function FieldRenderer({
  field,
  value,
  result,
  checked,
  readOnly,
  showResult,
  onChange,
}: {
  field: TemplateField;
  value: string;
  result: boolean | null;
  checked: boolean;
  readOnly: boolean;
  showResult: boolean;
  onChange: (v: string) => void;
}) {
  const correctValue = getCorrectValue(field);
  const showFeedback = checked && showResult;

  return (
    <div className="space-y-3">
      {/* Field label */}
      <div className="flex items-start gap-2">
        <span className="text-[13px] leading-relaxed flex-1" style={{ color: 'var(--rm-text)' }}>
          {field.label}
        </span>
        {showFeedback && result === true && (
          <div className="flex items-center gap-1 shrink-0">
            <Check className="h-3.5 w-3.5" style={{ color: `rgb(${GREEN})` }} />
            <span className="text-[11px] font-medium" style={{ color: `rgb(${GREEN})` }}>Correct</span>
          </div>
        )}
        {showFeedback && result === false && (
          <div className="flex items-center gap-1 shrink-0">
            <X className="h-3.5 w-3.5" style={{ color: `rgb(${RED})` }} />
            <span className="text-[11px] font-medium" style={{ color: `rgb(${RED})` }}>Incorrect</span>
          </div>
        )}
      </div>

      {/* Single/multi select options */}
      {(field.type === 'single_select' || field.type === 'multi_select') && field.options && (
        <div className="space-y-2">
          {field.options.map((opt) => {
            const selected = value === opt;
            const isCorrectOption = opt.toLowerCase() === correctValue.toLowerCase();
            const showCorrectHighlight = showFeedback && result === false && isCorrectOption;

            let bgClass = '';
            let borderStyle = '1px solid var(--rm-border)';
            let textClass = '';
            let iconElement: React.ReactNode = null;

            if (showCorrectHighlight) {
              bgClass = '';
              borderStyle = `1px solid rgba(${GREEN},0.3)`;
              textClass = '';
              iconElement = <Check className="h-4 w-4 shrink-0" style={{ color: `rgb(${GREEN})` }} />;
            } else if (selected && showFeedback && result === true) {
              bgClass = '';
              borderStyle = `1px solid rgba(${GREEN},0.3)`;
              textClass = '';
              iconElement = <Check className="h-4 w-4 shrink-0" style={{ color: `rgb(${GREEN})` }} />;
            } else if (selected && showFeedback && result === false) {
              bgClass = '';
              borderStyle = `1px solid rgba(${RED},0.3)`;
              textClass = '';
              iconElement = <X className="h-4 w-4 shrink-0" style={{ color: `rgb(${RED})` }} />;
            } else if (selected) {
              bgClass = '';
              borderStyle = '1px solid var(--rm-border)';
              textClass = '';
              iconElement = (
                <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                  style={{ background: `rgb(${ACCENT})` }}>
                  <Check className="h-2.5 w-2.5 text-black" />
                </div>
              );
            }

            return (
              <button
                key={opt}
                onClick={() => !readOnly && !checked && onChange(opt)}
                disabled={readOnly || checked}
                className={`w-full text-left rounded-xl px-4 py-3.5 text-[13px] leading-relaxed transition-all duration-200 ${bgClass} ${
                  readOnly || checked ? 'cursor-default' : 'cursor-pointer'
                }`}
                style={{
                  border: borderStyle,
                  backgroundColor: showCorrectHighlight
                    ? `rgba(${GREEN},0.05)`
                    : selected && showFeedback && result === true
                      ? `rgba(${GREEN},0.05)`
                      : selected && showFeedback && result === false
                        ? `rgba(${RED},0.05)`
                        : 'var(--rm-bg-elevated)',
                }}
              >
                <span className={`flex items-center gap-3 ${textClass}`}>
                  {iconElement && iconElement}
                  {!iconElement && !showFeedback && (
                    <div
                      className="w-4 h-4 rounded-full shrink-0 transition-all duration-200"
                      style={{
                        border: selected ? 'none' : '1.5px solid var(--rm-border)',
                        background: 'transparent',
                      }}
                    />
                  )}
                  {!iconElement && showFeedback && (
                    <div className="w-4 h-4 shrink-0" />
                  )}
                  <span
                    style={{
                      color: showCorrectHighlight
                        ? `rgb(${GREEN})`
                        : selected && showFeedback && result === true
                          ? `rgb(${GREEN})`
                          : selected && showFeedback && result === false
                            ? `rgb(${RED})`
                            : 'var(--rm-text)',
                    }}
                  >
                    {opt}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Text / numeric inputs */}
      {(field.type === 'short_text' || field.type === 'numeric') && (
        <input
          type={field.type === 'numeric' ? 'number' : 'text'}
          value={value}
          onChange={(e) => !readOnly && !checked && onChange(e.target.value)}
          readOnly={readOnly || checked}
          placeholder={field.type === 'numeric' ? 'Enter a number' : 'Type your answer...'}
          className="w-full rounded-xl px-4 py-3.5 text-[13px] leading-relaxed outline-none transition-all duration-200"
          style={{
            border: showFeedback && result === true
              ? `1px solid rgba(${GREEN},0.3)`
              : showFeedback && result === false
                ? `1px solid rgba(${RED},0.3)`
                : '1px solid var(--rm-border)',
            backgroundColor: showFeedback && result === true
              ? `rgba(${GREEN},0.05)`
              : showFeedback && result === false
                ? `rgba(${RED},0.05)`
                : 'var(--rm-bg-elevated)',
            color: 'var(--rm-text)',
          }}
        />
      )}

      {/* Show correct answer when wrong (text/numeric) */}
      {showFeedback && result === false && (field.type === 'short_text' || field.type === 'numeric') && (
        <div
          className="rounded-lg px-3 py-2 text-[12px] flex items-center gap-2"
          style={{
            background: `rgba(${GREEN},0.05)`,
            border: `1px solid rgba(${GREEN},0.12)`,
            color: `rgb(${GREEN})`,
          }}
        >
          <Check className="h-3 w-3 shrink-0" />
          Correct answer: {correctValue}
        </div>
      )}
    </div>
  );
}

// ── Rationale Card ─────────────────────────────────────────────────────────────

function RationaleCard({ field, result }: { field: TemplateField; result: boolean | null }) {
  const rationale = field.rationale || field.distractorRationale;
  if (!rationale) return null;

  const isCorrect = result === true;
  const tint = isCorrect ? GREEN : RED;

  return (
    <div
      className="rounded-xl px-4 py-3 text-[12px] leading-relaxed"
      style={{
        background: `rgba(${tint},0.03)`,
        border: `1px solid rgba(${tint},0.08)`,
        color: 'var(--rm-text-secondary)',
      }}
    >
      <span className="font-semibold" style={{ color: `rgba(${tint === GREEN ? GREEN : RED},0.8)` }}>
        {isCorrect ? 'Correct' : 'Explanation'}:
      </span>{' '}
      {rationale}
    </div>
  );
}

// ── StartScreen ────────────────────────────────────────────────────────────────

function StartScreen({
  practiceSet,
  onBegin,
}: {
  practiceSet: PracticeSet;
  onBegin: () => void;
}) {
  return (
    <div className="relative mx-auto max-w-5xl px-6 py-16 sm:px-8 lg:py-24">
      {/* Back link */}
      <Link
        href="/operations/practice"
        className="inline-flex items-center gap-1.5 text-[12px] text-white/30 hover:text-white/60 transition-colors mb-12"
        style={{ opacity: 0, animation: 'fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Practice Sets
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
        <button
          onClick={onBegin}
          className="group inline-flex items-center gap-3 rounded-2xl py-4 px-8 text-[15px] font-semibold transition-all duration-300 cursor-pointer"
          style={{
            background: `rgba(${ACCENT},0.12)`,
            border: `1px solid rgba(${ACCENT},0.2)`,
            color: `rgb(${ACCENT})`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `rgba(${ACCENT},0.18)`;
            e.currentTarget.style.boxShadow = `0 0 40px rgba(${ACCENT},0.1)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `rgba(${ACCENT},0.12)`;
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Begin Practice
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

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
  const toggleFocus = useReadingModeStore((s) => s.toggleFocus);

  // ESC to exit focus mode
  useEffect(() => {
    if (!focusMode) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggleFocus();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [focusMode, toggleFocus]);

  const allFieldsFilled = fields.every((f) => {
    const val = taskState.answers[f.id]?.value?.trim();
    return val && val.length > 0;
  });

  const handleCheck = useCallback(() => {
    dispatch({ type: 'CHECK_ANSWERS', tasks });
  }, [dispatch, tasks]);

  const handleNext = useCallback(() => {
    if (isLast) {
      dispatch({ type: 'FINISH' });
    } else {
      dispatch({ type: 'NEXT_TASK' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dispatch, isLast]);

  const handlePrev = useCallback(() => {
    dispatch({ type: 'PREV_TASK' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dispatch]);

  const handleNavigate = useCallback((index: number) => {
    dispatch({ type: 'GO_TO_TASK', index });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dispatch]);

  return (
    <div
      data-reading-mode={readingMode}
      className={focusMode ? 'fixed inset-0 z-40 overflow-y-auto' : ''}
      style={{ backgroundColor: 'var(--rm-bg, transparent)' }}
    >
    <div className={`relative mx-auto max-w-5xl px-6 py-8 sm:px-8 lg:py-12 ${focusMode ? 'min-h-screen' : ''}`}>

      {/* Floating controls — visible in focus mode */}
      {focusMode && (
        <div data-reading-mode={readingMode} className="contents">
          <div className="fixed top-3 right-3 z-50" data-reading-mode={readingMode}>
            <ReadingModeDropdown />
          </div>
          <button
            type="button"
            onClick={toggleFocus}
            data-reading-mode={readingMode}
            className="fixed top-3 left-3 z-50 flex items-center gap-2 rounded-lg px-3 py-1.5 backdrop-blur transition-opacity opacity-30 hover:opacity-100"
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
            <span className="font-mono text-[10px] tracking-widest uppercase">Exit Focus</span>
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
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-all duration-200 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="text-[13px] text-white/40 font-medium">
            {state.currentTaskIndex + 1}
            <span className="text-white/20"> / {tasks.length}</span>
          </span>
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
          {!focusMode && <ReadingModeDropdown />}
          {state.isReview && (
            <button
              onClick={() => dispatch({ type: 'BACK_TO_RESULTS' })}
              className="flex items-center gap-1.5 text-[12px] font-medium text-white/30 hover:text-white/60 transition-colors cursor-pointer"
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
        {/* Task card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--rm-bg-elevated)',
            border: '1px solid var(--rm-border)',
          }}
        >
          <div className="p-8 sm:p-10 space-y-8">
            {/* Task title */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2" style={{ color: 'var(--rm-text-heading)' }}>
                {task.title}
              </h2>
              <div className="flex items-center gap-3 text-[12px]" style={{ color: 'var(--rm-text-secondary)' }}>
                {(() => {
                  const typeInfo = TYPE_CONFIG[task.type];
                  return typeInfo ? (
                    <span className="flex items-center gap-1">
                      {(() => { const Icon = typeInfo.icon; return <Icon className="h-3 w-3" />; })()}
                      {typeInfo.label}
                    </span>
                  ) : null;
                })()}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {task.estimatedMinutes} min
                </span>
              </div>
            </div>

            {/* Context */}
            <div>
              <h4 className="text-[11px] font-medium uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--rm-text-secondary)' }}>
                Context
              </h4>
              <p className="text-[14px] leading-[1.7]" style={{ color: 'var(--rm-text)' }}>
                {task.description.context}
              </p>
            </div>

            {/* Evidence / code block */}
            {task.evidence && (
              <div>
                <h4 className="text-[11px] font-medium uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--rm-text-secondary)' }}>
                  {task.evidence.type === 'code_block' ? 'Code' : 'Evidence'}
                </h4>
                <pre
                  className="rounded-xl p-5 text-[13px] leading-relaxed overflow-x-auto font-mono whitespace-pre-wrap"
                  style={{
                    backgroundColor: 'var(--rm-code-bg)',
                    border: '1px solid var(--rm-border)',
                    color: 'var(--rm-code-text)',
                  }}
                >
                  {task.evidence.content}
                </pre>
              </div>
            )}

            {/* Task instruction */}
            <div>
              <h4 className="text-[11px] font-medium uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--rm-text-secondary)' }}>
                Task
              </h4>
              <p className="text-[14px] leading-[1.7]" style={{ color: 'var(--rm-text)' }}>
                {task.description.task}
              </p>
            </div>

            {/* Validation hint */}
            {task.description.validationHint && (
              <div
                className="rounded-xl px-4 py-3 text-[13px] leading-relaxed"
                style={{
                  backgroundColor: 'var(--rm-callout-bg)',
                  border: '1px solid var(--rm-callout-border)',
                  color: 'var(--rm-text-secondary)',
                }}
              >
                <span className="font-medium" style={{ color: 'var(--rm-text)' }}>Hint:</span> {task.description.validationHint}
              </div>
            )}

            {/* Scaffold for code tasks */}
            {task.scaffold && (
              <div>
                <h4 className="text-[11px] font-medium uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--rm-text-secondary)' }}>
                  Scaffold
                </h4>
                <pre
                  className="rounded-xl p-5 text-[13px] leading-relaxed overflow-x-auto font-mono"
                  style={{
                    backgroundColor: 'var(--rm-code-bg)',
                    border: '1px solid var(--rm-border)',
                    color: 'var(--rm-code-text)',
                  }}
                >
                  {task.scaffold}
                </pre>
              </div>
            )}

            {/* Divider before fields */}
            {fields.length > 0 && (
              <div className="h-px w-full" style={{ backgroundColor: 'var(--rm-border)' }} />
            )}

            {/* Answer fields */}
            {fields.length > 0 && (
              <div className="space-y-8">
                {fields.map((field) => (
                  <div key={field.id} className="space-y-3">
                    <FieldRenderer
                      field={field}
                      value={taskState.answers[field.id]?.value ?? ''}
                      result={taskState.answers[field.id]?.result ?? null}
                      checked={taskState.checked}
                      readOnly={state.isReview}
                      showResult={taskState.checked}
                      onChange={(v) =>
                        dispatch({
                          type: 'SET_ANSWER',
                          taskIndex: state.currentTaskIndex,
                          fieldId: field.id,
                          value: v,
                        })
                      }
                    />

                    {/* Rationale after check */}
                    {taskState.checked && (
                      <RationaleCard
                        field={field}
                        result={taskState.answers[field.id]?.result ?? null}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Footer actions */}
            <div className="pt-2 space-y-3">
              {!state.isReview && !taskState.checked && (
                <button
                  onClick={handleCheck}
                  disabled={!allFieldsFilled}
                  className="w-full rounded-xl py-4 text-[14px] font-semibold transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
                  style={{
                    background: allFieldsFilled ? `rgba(${ACCENT},0.12)` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${allFieldsFilled ? `rgba(${ACCENT},0.2)` : 'rgba(255,255,255,0.06)'}`,
                    color: allFieldsFilled ? `rgb(${ACCENT})` : 'rgba(255,255,255,0.2)',
                  }}
                  onMouseEnter={(e) => {
                    if (allFieldsFilled) {
                      e.currentTarget.style.background = `rgba(${ACCENT},0.18)`;
                      e.currentTarget.style.boxShadow = `0 0 30px rgba(${ACCENT},0.08)`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (allFieldsFilled) {
                      e.currentTarget.style.background = `rgba(${ACCENT},0.12)`;
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  Check Answer
                </button>
              )}

              {!state.isReview && taskState.checked && (
                <button
                  onClick={handleNext}
                  className="w-full rounded-xl py-4 text-[14px] font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    background: `rgba(${ACCENT},0.12)`,
                    border: `1px solid rgba(${ACCENT},0.2)`,
                    color: `rgb(${ACCENT})`,
                    opacity: 0,
                    animation: 'fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `rgba(${ACCENT},0.18)`;
                    e.currentTarget.style.boxShadow = `0 0 30px rgba(${ACCENT},0.08)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `rgba(${ACCENT},0.12)`;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {isLast ? 'See Results' : 'Continue'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {state.isReview && (
                <div className="flex gap-3">
                  {!isLast && (
                    <button
                      onClick={() => dispatch({ type: 'NEXT_TASK' })}
                      className="flex-1 rounded-xl py-3.5 text-[13px] font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.08] text-white/50 hover:bg-white/[0.08] hover:text-white/70"
                    >
                      Next Task
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => dispatch({ type: 'BACK_TO_RESULTS' })}
                    className="flex-1 rounded-xl py-3.5 text-[13px] font-semibold transition-all duration-300 cursor-pointer bg-white/[0.04] border border-white/[0.08] text-white/50 hover:bg-white/[0.08] hover:text-white/70"
                  >
                    Back to Results
                  </button>
                </div>
              )}
            </div>
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

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
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
            background: taskState.allCorrect
              ? `rgba(${GREEN},0.08)`
              : `rgba(${RED},0.08)`,
          }}
        >
          {taskState.allCorrect ? (
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
            {correctFields}/{totalFields} fields correct
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
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          {fields.map((field) => {
            const answer = taskState.answers[field.id];
            const isCorrect = answer?.result === true;
            const correctValue = getCorrectValue(field);
            const tint = isCorrect ? GREEN : RED;

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
                        Correct: {correctValue}
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

  const { totalCorrectFields, totalFields, tasksFullyCorrect } = useMemo(() => {
    let correctF = 0;
    let totalF = 0;
    let fullyCorrect = 0;

    for (let i = 0; i < tasks.length; i++) {
      const fields = tasks[i].template?.fields ?? [];
      const ts = state.taskStates[i];
      let taskAllCorrect = fields.length > 0;

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

    return { totalCorrectFields: correctF, totalFields: totalF, tasksFullyCorrect: fullyCorrect };
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
          {tasksFullyCorrect} of {tasks.length} tasks fully correct
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

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-10 max-w-md mx-auto">
          <button
            onClick={() => dispatch({ type: 'REVIEW' })}
            className="flex-1 rounded-xl py-3.5 text-[13px] font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.08] text-white/50 hover:bg-white/[0.08] hover:text-white/70"
          >
            <Eye className="h-4 w-4" />
            Review Answers
          </button>

          <button
            onClick={() => dispatch({ type: 'RESET', taskCount: tasks.length })}
            className="flex-1 rounded-xl py-3.5 text-[13px] font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.08] text-white/50 hover:bg-white/[0.08] hover:text-white/70"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
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

      {/* Back link */}
      <div
        className="mt-12 text-center"
        style={{
          opacity: 0,
          animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 200ms forwards',
        }}
      >
        <Link
          href="/operations/practice"
          className="inline-flex items-center gap-1.5 text-[12px] text-white/25 hover:text-white/50 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Practice Sets
        </Link>
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

// ── Main Viewer ────────────────────────────────────────────────────────────────

export function PracticeSetViewer({ practiceSet }: { practiceSet: PracticeSet }) {
  const tasks = practiceSet.tasks as PracticeTask[];
  const pathname = usePathname();
  const moduleId = practiceSet.metadata?.moduleId ?? '';

  const [state, dispatch] = useReducer(sessionReducer, tasks.length, createInitialState);
  const [hydrated, setHydrated] = useState(false);

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
    if (state.phase !== 'start') {
      saveSession(moduleId, pathname ?? '', state);
    }
  }, [state, moduleId, pathname, hydrated]);

  // Don't render until hydrated to avoid flash of start screen
  if (!hydrated) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0c0e' }}>
      {state.phase === 'start' && (
        <StartScreen
          practiceSet={practiceSet}
          onBegin={() => dispatch({ type: 'START' })}
        />
      )}

      {state.phase === 'session' && (
        <TaskScreen
          practiceSet={practiceSet}
          state={state}
          dispatch={dispatch}
        />
      )}

      {state.phase === 'results' && (
        <ResultsScreen
          practiceSet={practiceSet}
          state={state}
          dispatch={dispatch}
        />
      )}
    </div>
  );
}
