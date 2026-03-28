'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Lock, TimerReset } from 'lucide-react';
import { MultipleChoice } from '@/components/practice/MultipleChoice';
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
      <section className="mt-8 rounded-3xl border border-light-border bg-light-surface p-6 dark:border-dark-border dark:bg-dark-surface">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
              Module Checkpoint
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
              {correctAnswers >= requiredCorrect ? 'Checkpoint passed' : 'Checkpoint failed'}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
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
              <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-brand-500">
                <CheckCircle2 className="h-4 w-4" />
                Module marked complete.
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-light-border bg-light-bg px-4 py-3 text-right dark:border-dark-border dark:bg-dark-bg">
            <div className="text-xs uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
              Result
            </div>
            <div className="mt-2 text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
              {Math.round((correctAnswers / questions.length) * 100)}%
            </div>
            <div className="mt-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
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
              className="inline-flex items-center gap-2 rounded-full bg-text-light-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-60 dark:bg-text-dark-primary dark:text-dark-bg dark:hover:bg-neutral-200"
            >
              Save completion
            </button>
          ) : null}
          <button
            type="button"
            onClick={resetRun}
            className="inline-flex items-center gap-2 rounded-full border border-light-border px-5 py-2.5 text-sm font-medium text-text-light-secondary transition-colors hover:border-text-light-primary hover:text-text-light-primary dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-text-dark-primary dark:hover:text-text-dark-primary"
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
      <section className="mt-8 rounded-3xl border border-light-border bg-light-surface p-6 dark:border-dark-border dark:bg-dark-surface">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg">
          <Lock className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
          Module Checkpoint
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
          Finish the module before the timed flashcards unlock
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
          Spend at least {MIN_LESSON_READ_SECONDS} seconds reading every lesson in this
          module first. Once the full module qualifies as read, you will answer{' '}
          {questions.length} flashcards with {MODULE_CHECKPOINT_TIME_LIMIT_SECONDS}
          seconds per card.
        </p>
        <div className="mt-5 inline-flex rounded-full border border-light-border bg-light-bg px-3 py-1.5 text-xs font-medium text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
          {isProgressLoaded
            ? `${lessonsReadCount}/${lessonCount} lessons read`
            : 'Syncing lesson reads...'}
        </div>
      </section>
    );
  }

  if (!hasStarted || !currentQuestion) {
    return (
      <section className="mt-8 rounded-3xl border border-light-border bg-light-surface p-6 dark:border-dark-border dark:bg-dark-surface">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
          Module Checkpoint
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          <span className="rounded-full border border-light-border bg-light-bg px-3 py-1.5 dark:border-dark-border dark:bg-dark-bg">
            {questions.length} flashcards
          </span>
          <span className="rounded-full border border-light-border bg-light-bg px-3 py-1.5 dark:border-dark-border dark:bg-dark-bg">
            {MODULE_CHECKPOINT_TIME_LIMIT_SECONDS} sec each
          </span>
          <span className="rounded-full border border-light-border bg-light-bg px-3 py-1.5 dark:border-dark-border dark:bg-dark-bg">
            Pass {requiredCorrect}/{questions.length}
          </span>
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
          Finish the module with a timed flashcard checkpoint
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
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
            className="inline-flex items-center gap-2 rounded-full bg-text-light-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-text-dark-primary dark:text-dark-bg dark:hover:bg-neutral-200"
          >
            Start checkpoint
          </button>
          {isCompleted ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-500">
              <CheckCircle2 className="h-4 w-4" />
              Already completed
            </span>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-3xl border border-light-border bg-light-surface p-6 dark:border-dark-border dark:bg-dark-surface">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
            Module Checkpoint
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            Flashcard {currentIndex + 1} of {questions.length}
          </h2>
        </div>

        <div className="rounded-2xl border border-light-border bg-light-bg px-4 py-3 dark:border-dark-border dark:bg-dark-bg">
          <div className="text-[11px] uppercase tracking-[0.18em] text-text-light-tertiary dark:text-text-dark-tertiary">
            Time left
          </div>
          <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            <Clock3 className="h-4 w-4 text-brand-500" />
            {timeLeft}s
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-light-border bg-light-bg p-5 dark:border-dark-border dark:bg-dark-bg">
        <p className="text-base leading-8 text-text-light-primary dark:text-text-dark-primary">
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
        <div className="mt-5 rounded-3xl border border-light-border bg-light-bg p-5 dark:border-dark-border dark:bg-dark-bg">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                isCorrect
                  ? 'bg-brand-500/10 text-brand-500'
                  : 'bg-light-hover text-text-light-secondary dark:bg-dark-hover dark:text-text-dark-secondary'
              }`}
            >
              {isCorrect ? 'Correct' : timedOut ? 'Time up' : 'Incorrect'}
            </span>
          </div>
          <p className="mt-3 text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
            {currentQuestion.explanation}
          </p>
          {!isCorrect ? (
            <p className="mt-3 text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
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
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-text-light-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-60 dark:bg-text-dark-primary dark:text-dark-bg dark:hover:bg-neutral-200"
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
            className="inline-flex items-center gap-2 rounded-full bg-text-light-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-text-dark-primary dark:text-dark-bg dark:hover:bg-neutral-200"
          >
            Submit answer
          </button>
          <button
            type="button"
            onClick={resetRun}
            className="inline-flex items-center gap-2 rounded-full border border-light-border px-5 py-2.5 text-sm font-medium text-text-light-secondary transition-colors hover:border-text-light-primary hover:text-text-light-primary dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-text-dark-primary dark:hover:text-text-dark-primary"
          >
            Restart checkpoint
          </button>
        </div>
      )}
    </section>
  );
};
