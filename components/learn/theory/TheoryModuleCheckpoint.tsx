'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Lock, TimerReset } from 'lucide-react';
// Inline multiple choice — practice system removed
const MultipleChoice = ({ options, selected, onSelect, disabled }: {
  options: string[]; selected: string | null; onSelect: (value: string) => void; disabled?: boolean;
}) => (
  <div className="space-y-2">
    {options.map((option) => (
      <button key={option} type="button" disabled={disabled}
        onClick={() => onSelect(option)}
        className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-colors ${
          selected === option
            ? 'border-primary/40 bg-primary/10 text-on-surface'
            : 'border-white/[0.06] bg-white/[0.02] text-on-surface-variant hover:bg-white/[0.04]'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        {option}
      </button>
    ))}
  </div>
);
import {
  getModuleCheckpointQuestions,
  getModuleCheckpointRequiredCorrect,
  MODULE_CHECKPOINT_TIME_LIMIT_SECONDS
} from '@/lib/learn/moduleCheckpoints';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { MIN_LESSON_READ_SECONDS } from '@/lib/learn/lessonReadProgress';
import type { TheoryChapter } from '@/types/theory';
import { validateAnswer } from '@/lib/validators/answerValidator';
import { LightbulbPulseFeedback } from '@/components/feedback/LightbulbPulseFeedback';

interface TheoryModuleCheckpointProps {
  topic: string;
  chapter: TheoryChapter;
  canStart: boolean;
  isProgressLoaded: boolean;
  lessonsReadCount: number;
  lessonCount: number;
  isCompleted: boolean;
  isCompleting: boolean;
  onCompleteModule: () => Promise<boolean>;
}

export const TheoryModuleCheckpoint = ({
  topic,
  chapter,
  canStart,
  isProgressLoaded,
  lessonsReadCount,
  lessonCount,
  isCompleted,
  isCompleting,
  onCompleteModule
}: TheoryModuleCheckpointProps) => {
  const answerQuestion = useProgressStore((state) => state.answerQuestion);
  const questions = useMemo(
    () => getModuleCheckpointQuestions(topic, chapter.number),
    [chapter.number, topic]
  );
  const requiredCorrect = useMemo(
    () => getModuleCheckpointRequiredCorrect(questions.length),
    [questions.length]
  );
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MODULE_CHECKPOINT_TIME_LIMIT_SECONDS);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [moduleSaveSucceeded, setModuleSaveSucceeded] = useState<boolean | null>(null);

  const currentQuestion = questions[currentIndex] ?? null;

  const resetRun = useCallback(() => {
    setHasStarted(false);
    setCurrentIndex(0);
    setSelectedAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
    setTimedOut(false);
    setCorrectAnswers(0);
    setTimeLeft(MODULE_CHECKPOINT_TIME_LIMIT_SECONDS);
    setSessionFinished(false);
    setModuleSaveSucceeded(null);
  }, []);

  useEffect(() => {
    resetRun();
  }, [chapter.id, resetRun, topic]);

  const recordAnswer = useCallback(
    (correct: boolean) => {
      if (!currentQuestion) {
        return;
      }

      answerQuestion(
        currentQuestion.id,
        currentQuestion.topic,
        correct,
        0
      );
    },
    [answerQuestion, currentQuestion]
  );

  const handleResolveAnswer = useCallback(
    (answer: string, didTimeOut: boolean) => {
      if (!currentQuestion || showFeedback) {
        return;
      }

      const resolvedCorrect = !didTimeOut && validateAnswer(currentQuestion, answer);
      recordAnswer(resolvedCorrect);
      setIsCorrect(resolvedCorrect);
      setTimedOut(didTimeOut);
      setShowFeedback(true);
      if (resolvedCorrect) {
        setCorrectAnswers((prev) => prev + 1);
      }
    },
    [currentQuestion, recordAnswer, showFeedback]
  );

  useEffect(() => {
    if (!hasStarted || showFeedback || sessionFinished || !currentQuestion) {
      return;
    }

    if (timeLeft <= 0) {
      handleResolveAnswer('', true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    currentQuestion,
    handleResolveAnswer,
    hasStarted,
    sessionFinished,
    showFeedback,
    timeLeft
  ]);

  const handleAdvance = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer('');
      setShowFeedback(false);
      setIsCorrect(false);
      setTimedOut(false);
      setTimeLeft(MODULE_CHECKPOINT_TIME_LIMIT_SECONDS);
      return;
    }

    const passedCheckpoint = correctAnswers >= requiredCorrect;
    const didSaveModule = passedCheckpoint ? await onCompleteModule() : false;
    setModuleSaveSucceeded(passedCheckpoint ? didSaveModule : null);
    setSessionFinished(true);
  }, [correctAnswers, currentIndex, onCompleteModule, questions.length, requiredCorrect]);

  if (questions.length === 0) {
    return null;
  }

  if (sessionFinished) {
    return (
      <section className="mt-8 rounded-[22px] border border-light-border bg-light-surface p-6 dark:border-outline-variant dark:bg-surface-container">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono font-bold uppercase tracking-[0.18em] text-xs text-primary">
              Module Checkpoint
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-text-light-primary dark:text-on-surface">
              {correctAnswers >= requiredCorrect ? 'Checkpoint passed' : 'Checkpoint failed'}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-text-light-secondary dark:text-on-surface-variant">
              You answered {correctAnswers} of {questions.length} flashcards within the
              timed checkpoint.
            </p>
            {correctAnswers < requiredCorrect ? (
              <p className="mt-3 text-sm text-warning-600 dark:text-warning-400">
                You need {requiredCorrect}/{questions.length} correct answers to complete
                the module.
              </p>
            ) : null}
            {correctAnswers >= requiredCorrect && moduleSaveSucceeded === false ? (
              <p className="mt-3 text-sm text-warning-600 dark:text-warning-400">
                The checkpoint finished, but module completion did not save yet.
              </p>
            ) : null}
            {isCompleted || moduleSaveSucceeded ? (
              <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Module marked complete.
              </p>
            ) : null}
          </div>

          <div className="rounded-[14px] border border-light-border bg-light-bg px-4 py-3 text-right dark:border-outline-variant dark:bg-surface">
            <div className="font-mono font-bold uppercase tracking-[0.16em] text-xs text-text-light-tertiary dark:text-on-surface-variant/70">
              Result
            </div>
            <div className="mt-2 text-2xl font-semibold text-text-light-primary dark:text-on-surface">
              {Math.round((correctAnswers / questions.length) * 100)}%
            </div>
            <div className="mt-1 text-xs text-text-light-tertiary dark:text-on-surface-variant/70">
              Pass at {requiredCorrect}/{questions.length}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {correctAnswers >= requiredCorrect && moduleSaveSucceeded === false ? (
            <button
              type="button"
              onClick={async () => {
                const didSaveModule = await onCompleteModule();
                setModuleSaveSucceeded(didSaveModule);
              }}
              disabled={isCompleting}
              className="inline-flex items-center gap-2 rounded-full bg-text-light-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-60 dark:bg-on-surface dark:text-surface dark:hover:bg-neutral-200"
            >
              Save completion
            </button>
          ) : null}
          <button
            type="button"
            onClick={resetRun}
            className="inline-flex items-center gap-2 rounded-full border border-light-border px-5 py-2.5 text-sm font-medium text-text-light-secondary transition-colors hover:border-text-light-primary hover:text-text-light-primary dark:border-outline-variant dark:text-on-surface-variant dark:hover:border-on-surface dark:hover:text-on-surface"
          >
            <TimerReset className="h-4 w-4" />
            Retake checkpoint
          </button>
        </div>

        {correctAnswers >= requiredCorrect ? (
          <LightbulbPulseFeedback
            className="mt-5"
            contextType="module"
            contextId={`${topic}:${chapter.id}`}
            prompt="How was this module checkpoint?"
          />
        ) : null}
      </section>
    );
  }

  if (!canStart) {
    return (
      <section className="mt-8 rounded-[22px] border border-light-border bg-light-surface p-6 dark:border-outline-variant dark:bg-surface-container">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-light-border bg-light-bg dark:border-outline-variant dark:bg-surface">
          <Lock className="h-5 w-5 text-text-light-secondary dark:text-on-surface-variant" />
        </div>
        <p className="mt-5 font-mono font-bold uppercase tracking-[0.18em] text-xs text-primary">
          Module Checkpoint
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-text-light-primary dark:text-on-surface">
          Finish the module before the timed flashcards unlock
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-text-light-secondary dark:text-on-surface-variant">
          Spend at least {MIN_LESSON_READ_SECONDS} seconds reading every lesson in this
          module first. Once the full module qualifies as read, you will answer{' '}
          {questions.length} flashcards with {MODULE_CHECKPOINT_TIME_LIMIT_SECONDS}
          seconds per card.
        </p>
        <div className="mt-5 inline-flex rounded-full border border-light-border bg-light-bg px-3 py-1.5 text-xs font-medium text-text-light-secondary dark:border-outline-variant dark:bg-surface dark:text-on-surface-variant">
          {isProgressLoaded
            ? `${lessonsReadCount}/${lessonCount} lessons read`
            : 'Syncing lesson reads...'}
        </div>
      </section>
    );
  }

  if (!hasStarted || !currentQuestion) {
    return (
      <section className="mt-8 rounded-[22px] border border-light-border bg-light-surface p-6 dark:border-outline-variant dark:bg-surface-container">
        <p className="font-mono font-bold uppercase tracking-[0.18em] text-xs text-primary">
          Module Checkpoint
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-light-tertiary dark:text-on-surface-variant/70">
          <span className="rounded-full border border-light-border bg-light-bg px-3 py-1.5 dark:border-outline-variant dark:bg-surface">
            {questions.length} flashcards
          </span>
          <span className="rounded-full border border-light-border bg-light-bg px-3 py-1.5 dark:border-outline-variant dark:bg-surface">
            {MODULE_CHECKPOINT_TIME_LIMIT_SECONDS} sec each
          </span>
          <span className="rounded-full border border-light-border bg-light-bg px-3 py-1.5 dark:border-outline-variant dark:bg-surface">
            Pass {requiredCorrect}/{questions.length}
          </span>
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-text-light-primary dark:text-on-surface">
          Finish the module with a timed flashcard checkpoint
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-text-light-secondary dark:text-on-surface-variant">
          This checkpoint is now the completion gate for the module. Finish the
          flashcards below to mark the module complete and unlock the next one.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setHasStarted(true);
              setTimeLeft(MODULE_CHECKPOINT_TIME_LIMIT_SECONDS);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-text-light-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-on-surface dark:text-surface dark:hover:bg-neutral-200"
          >
            Start checkpoint
          </button>
          {isCompleted ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Already completed
            </span>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-[22px] border border-light-border bg-light-surface p-6 dark:border-outline-variant dark:bg-surface-container">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono font-bold uppercase tracking-[0.18em] text-xs text-primary">
            Module Checkpoint
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-text-light-primary dark:text-on-surface">
            Flashcard {currentIndex + 1} of {questions.length}
          </h2>
        </div>

        <div className="rounded-[14px] border border-light-border bg-light-bg px-4 py-3 dark:border-outline-variant dark:bg-surface">
          <div className="font-mono font-bold uppercase tracking-[0.18em] text-[11px] text-text-light-tertiary dark:text-on-surface-variant/70">
            Time left
          </div>
          <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-text-light-primary dark:text-on-surface">
            <Clock3 className="h-4 w-4 text-primary" />
            {timeLeft}s
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[22px] border border-light-border bg-light-bg p-5 dark:border-outline-variant dark:bg-surface">
        <p className="text-base leading-8 text-text-light-primary dark:text-on-surface">
          {currentQuestion.question}
        </p>

        <div className="mt-5">
          <MultipleChoice
            options={currentQuestion.options ?? []}
            selected={selectedAnswer}
            onSelect={setSelectedAnswer}
            disabled={showFeedback}
          />
        </div>
      </div>

      {showFeedback ? (
        <div className="mt-5 rounded-[22px] border border-light-border bg-light-bg p-5 dark:border-outline-variant dark:bg-surface">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 font-mono font-bold uppercase tracking-[0.12em] text-xs ${
                isCorrect
                  ? 'bg-primary/10 text-primary'
                  : 'bg-light-hover text-text-light-secondary dark:bg-surface-container-high dark:text-on-surface-variant'
              }`}
            >
              {isCorrect ? 'Correct' : timedOut ? 'Time up' : 'Incorrect'}
            </span>
          </div>
          <p className="mt-3 text-sm leading-7 text-text-light-secondary dark:text-on-surface-variant">
            {currentQuestion.explanation}
          </p>
          {!isCorrect ? (
            <p className="mt-3 text-sm font-medium text-text-light-primary dark:text-on-surface">
              Correct answer: {Array.isArray(currentQuestion.correctAnswer)
                ? currentQuestion.correctAnswer[0]
                : currentQuestion.correctAnswer}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => {
              void handleAdvance();
            }}
            disabled={isCompleting}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-text-light-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-60 dark:bg-on-surface dark:text-surface dark:hover:bg-neutral-200"
          >
            {currentIndex === questions.length - 1
              ? correctAnswers >= requiredCorrect
                ? 'Complete module'
                : 'See result'
              : 'Next flashcard'}
          </button>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleResolveAnswer(selectedAnswer, false)}
            disabled={!selectedAnswer || isCompleting}
            className="inline-flex items-center gap-2 rounded-full bg-text-light-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-on-surface dark:text-surface dark:hover:bg-neutral-200"
          >
            Submit answer
          </button>
          <button
            type="button"
            onClick={resetRun}
            className="inline-flex items-center gap-2 rounded-full border border-light-border px-5 py-2.5 text-sm font-medium text-text-light-secondary transition-colors hover:border-text-light-primary hover:text-text-light-primary dark:border-outline-variant dark:text-on-surface-variant dark:hover:border-on-surface dark:hover:text-on-surface"
          >
            Restart checkpoint
          </button>
        </div>
      )}
    </section>
  );
};
