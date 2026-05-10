'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Lock, TimerReset } from 'lucide-react';
import {
  getModuleCheckpointQuestions,
  getModuleCheckpointRequiredCorrect,
  MODULE_CHECKPOINT_TIME_LIMIT_SECONDS
} from '@/lib/learn/moduleCheckpoints';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { useReadingModeStore } from '@/lib/stores/useReadingModeStore';
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

const formatTopicLabel = (topic: string) =>
  topic
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatChapterTitle = (title: string) =>
  title.replace(/^module\s*\d+\s*:\s*/i, '').trim();

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
  const readingMode = useReadingModeStore((s) => s.mode);
  const answerQuestion = useProgressStore((state) => state.answerQuestion);
  const questions = useMemo(
    () => getModuleCheckpointQuestions(topic, chapter),
    [chapter, topic]
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
      if (!currentQuestion) return;
      answerQuestion(currentQuestion.id, currentQuestion.topic, correct, 0);
    },
    [answerQuestion, currentQuestion]
  );

  const handleResolveAnswer = useCallback(
    (answer: string, didTimeOut: boolean) => {
      if (!currentQuestion || showFeedback) return;
      const resolvedCorrect = !didTimeOut && validateAnswer(currentQuestion, answer);
      recordAnswer(resolvedCorrect);
      setIsCorrect(resolvedCorrect);
      setTimedOut(didTimeOut);
      setShowFeedback(true);
      if (resolvedCorrect) setCorrectAnswers((prev) => prev + 1);
    },
    [currentQuestion, recordAnswer, showFeedback]
  );

  useEffect(() => {
    if (!hasStarted || showFeedback || sessionFinished || !currentQuestion) return;
    if (timeLeft <= 0) {
      handleResolveAnswer('', true);
      return;
    }
    const timeoutId = window.setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timeoutId);
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

  const handleSkip = useCallback(() => {
    if (showFeedback || !currentQuestion) return;
    handleResolveAnswer('', false);
  }, [currentQuestion, handleResolveAnswer, showFeedback]);

  if (questions.length === 0) return null;

  /* ── Finished state ─────────────────────────────────────────────────────── */
  if (sessionFinished) {
    const passed = correctAnswers >= requiredCorrect;
    const scorePct = Math.round((correctAnswers / questions.length) * 100);
    return (
      <section
        data-reading-mode={readingMode}
        className="mt-10"
        style={{
          backgroundColor: 'var(--rm-bg)',
          border: '1px solid var(--rm-text-secondary)',
          color: 'var(--rm-text)',
        }}
      >
        <div
          aria-hidden
          className="h-[2px] w-full"
          style={{
            backgroundColor: passed
              ? 'var(--rm-accent)'
              : 'var(--rm-text-secondary)',
          }}
        />
        <div className="px-8 py-8">
          <p
            className="font-data-mono text-[11px] font-bold uppercase tracking-[0.22em]"
            style={{ color: 'var(--rm-accent)' }}
          >
            Module Checkpoint
          </p>
          <h2
            className="mt-3 font-h1 text-[32px] leading-tight"
            style={{ color: 'var(--rm-text)' }}
          >
            {passed ? 'Checkpoint passed' : 'Checkpoint failed'}
          </h2>
          <p
            className="mt-4 max-w-2xl font-body text-[14px] leading-7"
            style={{ color: 'var(--rm-text-secondary)' }}
          >
            You answered {correctAnswers} of {questions.length} questions correctly.
          </p>
          {!passed && (
            <p
              className="mt-3 font-body text-[14px]"
              style={{ color: 'var(--rm-text-secondary)' }}
            >
              You need {requiredCorrect}/{questions.length} correct to pass the module.
            </p>
          )}
          {passed && moduleSaveSucceeded === false && (
            <p
              className="mt-3 font-body text-[14px]"
              style={{ color: 'var(--rm-text-secondary)' }}
            >
              The checkpoint finished, but module completion did not save yet.
            </p>
          )}
          {(isCompleted || moduleSaveSucceeded) && (
            <p
              className="mt-4 inline-flex items-center gap-2 font-data-mono text-[11px] uppercase tracking-[0.18em]"
              style={{ color: 'var(--rm-accent)' }}
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
              Module marked complete
            </p>
          )}

          <dl className="mt-7 grid grid-cols-2 gap-3 max-w-md">
            <div
              className="px-4 py-3"
              style={{ border: '1px solid var(--rm-border)' }}
            >
              <dt
                className="font-data-mono text-[10px] uppercase tracking-[0.18em]"
                style={{ color: 'var(--rm-text-secondary)' }}
              >
                Score
              </dt>
              <dd
                className="mt-2 font-serif text-[24px] tabular-nums"
                style={{ color: passed ? 'var(--rm-accent)' : 'var(--rm-text)' }}
              >
                {scorePct}%
              </dd>
            </div>
            <div
              className="px-4 py-3"
              style={{ border: '1px solid var(--rm-border)' }}
            >
              <dt
                className="font-data-mono text-[10px] uppercase tracking-[0.18em]"
                style={{ color: 'var(--rm-text-secondary)' }}
              >
                Pass at
              </dt>
              <dd
                className="mt-2 font-serif text-[24px] tabular-nums"
                style={{ color: 'var(--rm-text)' }}
              >
                {requiredCorrect}/{questions.length}
              </dd>
            </div>
          </dl>

          <div className="mt-7 flex flex-wrap gap-2">
            {passed && moduleSaveSucceeded === false && (
              <button
                type="button"
                onClick={async () => {
                  const didSaveModule = await onCompleteModule();
                  setModuleSaveSucceeded(didSaveModule);
                }}
                disabled={isCompleting}
                className="font-data-mono text-[11px] uppercase tracking-[0.18em] px-5 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-wait"
                style={{
                  backgroundColor: 'var(--rm-accent)',
                  color: 'var(--rm-bg)',
                }}
              >
                Save completion
              </button>
            )}
            <button
              type="button"
              onClick={resetRun}
              className="inline-flex items-center gap-2 font-data-mono text-[11px] uppercase tracking-[0.18em] px-5 py-2.5 transition-colors"
              style={{
                border: '1px solid var(--rm-border)',
                color: 'var(--rm-text-secondary)',
              }}
            >
              <TimerReset className="h-3.5 w-3.5" strokeWidth={1.75} />
              Retake checkpoint
            </button>
          </div>

          {passed && (
            <LightbulbPulseFeedback
              className="mt-7"
              contextType="module"
              contextId={`${topic}:${chapter.id}`}
              prompt="How was this module checkpoint?"
            />
          )}
        </div>
      </section>
    );
  }

  /* ── Locked state ───────────────────────────────────────────────────────── */
  if (!canStart) {
    return (
      <section
        data-reading-mode={readingMode}
        className="mt-10"
        style={{
          backgroundColor: 'var(--rm-bg)',
          border: '1px solid var(--rm-text-secondary)',
          color: 'var(--rm-text)',
        }}
      >
        <div className="px-8 py-8">
          <span
            className="inline-flex h-10 w-10 items-center justify-center"
            style={{ border: '1px solid var(--rm-border)' }}
          >
            <Lock
              className="h-4 w-4"
              strokeWidth={1.5}
              style={{ color: 'var(--rm-text-secondary)' }}
            />
          </span>
          <p
            className="mt-5 font-data-mono text-[11px] font-bold uppercase tracking-[0.22em]"
            style={{ color: 'var(--rm-text-secondary)' }}
          >
            Module Checkpoint
          </p>
          <h2
            className="mt-3 font-h1 text-[28px] leading-tight"
            style={{ color: 'var(--rm-text)' }}
          >
            Finish the module to unlock the checkpoint
          </h2>
          <p
            className="mt-3 max-w-2xl font-body text-[14px] leading-7"
            style={{ color: 'var(--rm-text-secondary)' }}
          >
            Spend at least {MIN_LESSON_READ_SECONDS} seconds reading every lesson in this
            module first. Once the module is complete you will answer {questions.length}{' '}
            questions with {MODULE_CHECKPOINT_TIME_LIMIT_SECONDS} seconds per question.
          </p>
          <div
            className="mt-5 inline-flex font-data-mono text-[11px] uppercase tracking-[0.18em] px-3 py-1.5"
            style={{
              border: '1px solid var(--rm-border)',
              color: 'var(--rm-text-secondary)',
            }}
          >
            {isProgressLoaded
              ? `${lessonsReadCount}/${lessonCount} lessons read`
              : 'Syncing lesson reads…'}
          </div>
        </div>
      </section>
    );
  }

  /* ── Intro state ────────────────────────────────────────────────────────── */
  if (!hasStarted || !currentQuestion) {
    return (
      <section
        data-reading-mode={readingMode}
        className="mt-10"
        style={{
          backgroundColor: 'var(--rm-bg)',
          border: '1px solid var(--rm-text-secondary)',
          color: 'var(--rm-text)',
        }}
      >
        <div aria-hidden className="h-[2px] w-full" style={{ backgroundColor: 'var(--rm-accent)' }} />
        <div className="px-8 py-8">
          <p
            className="font-data-mono text-[11px] font-bold uppercase tracking-[0.22em]"
            style={{ color: 'var(--rm-accent)' }}
          >
            Module Checkpoint
          </p>
          <h2
            className="mt-3 font-h1 text-[28px] leading-tight"
            style={{ color: 'var(--rm-text)' }}
          >
            Finish with a timed checkpoint
          </h2>
          <p
            className="mt-3 max-w-2xl font-body text-[14px] leading-7"
            style={{ color: 'var(--rm-text-secondary)' }}
          >
            This is the completion gate for the module — pass it to mark the module
            complete and unlock the next one.
          </p>

          <dl className="mt-6 flex flex-wrap gap-2">
            {[
              { label: 'Questions', value: `${questions.length}` },
              { label: 'Per question', value: `${MODULE_CHECKPOINT_TIME_LIMIT_SECONDS} sec` },
              { label: 'Pass at', value: `${requiredCorrect}/${questions.length}` }
            ].map((item) => (
              <div
                key={item.label}
                className="px-3 py-2 flex items-baseline gap-2"
                style={{ border: '1px solid var(--rm-border)' }}
              >
                <dt
                  className="font-data-mono text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: 'var(--rm-text-secondary)' }}
                >
                  {item.label}
                </dt>
                <dd
                  className="font-data-mono text-[12px] tabular-nums"
                  style={{ color: 'var(--rm-text)' }}
                >
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={() => {
                setHasStarted(true);
                setTimeLeft(MODULE_CHECKPOINT_TIME_LIMIT_SECONDS);
              }}
              className="inline-flex items-center gap-2 font-data-mono text-[11px] uppercase tracking-[0.18em] px-5 py-2.5 transition-colors"
              style={{
                backgroundColor: 'var(--rm-accent)',
                color: 'var(--rm-bg)',
              }}
            >
              Start checkpoint
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
            {isCompleted && (
              <span
                className="inline-flex items-center gap-2 font-data-mono text-[11px] uppercase tracking-[0.18em]"
                style={{ color: 'var(--rm-accent)' }}
              >
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                Already completed
              </span>
            )}
          </div>
        </div>
      </section>
    );
  }

  /* ── Question state — editorial multi-choice ────────────────────────────── */
  const totalReward = currentQuestion.xpReward ?? 5;
  const moduleTitle = formatChapterTitle(chapter.title);
  const breadcrumb = `Checkpoint · ${formatTopicLabel(topic)} · M${chapter.order ?? chapter.number} ${moduleTitle}`;
  const options = currentQuestion.options ?? [];

  return (
    <section
      data-reading-mode={readingMode}
      className="mt-10"
      style={{
        backgroundColor: 'var(--rm-bg)',
        border: '1px solid var(--rm-text-secondary)',
        color: 'var(--rm-text)',
      }}
    >
      {/* Header — breadcrumb + counter + timer */}
      <header
        className="flex items-center justify-between gap-4 px-8 py-4"
        style={{ borderBottom: '1px solid var(--rm-border)' }}
      >
        <span
          className="font-data-mono text-[11px] uppercase tracking-[0.18em] truncate"
          style={{ color: 'var(--rm-text-secondary)' }}
        >
          {breadcrumb}
        </span>
        <div className="flex items-center gap-5 shrink-0">
          <span
            className="inline-flex items-center gap-1.5 font-data-mono text-[11px] uppercase tracking-[0.16em] tabular-nums"
            style={{ color: 'var(--rm-text-secondary)' }}
          >
            <Clock3
              className="h-3.5 w-3.5"
              strokeWidth={1.75}
              style={{ color: 'var(--rm-accent)' }}
            />
            {timeLeft}s
          </span>
          <span
            className="font-data-mono text-[11px] uppercase tracking-[0.18em] tabular-nums"
            style={{ color: 'var(--rm-text)' }}
          >
            Task {currentIndex + 1} of {questions.length}
          </span>
        </div>
      </header>

      {/* Body */}
      <div className="px-8 py-10">
        <h2
          className="font-h1 text-[28px] sm:text-[34px] leading-tight max-w-3xl"
          style={{ color: 'var(--rm-text)' }}
        >
          {currentQuestion.question}
        </h2>

        {currentQuestion.codeSnippet && (
          <pre
            className="mt-6 overflow-x-auto px-5 py-4 font-data-mono text-[13px] leading-relaxed"
            style={{
              border: '1px solid var(--rm-border)',
              backgroundColor: 'var(--rm-code-bg, var(--rm-bg))',
              color: 'var(--rm-code-text, var(--rm-text))',
            }}
          >
            <code>{currentQuestion.codeSnippet}</code>
          </pre>
        )}

        {/* Options */}
        <ul className="mt-7 flex flex-col gap-1">
          {options.map((option) => {
            const isSelected = selectedAnswer === option;
            return (
              <li key={option}>
                <button
                  type="button"
                  disabled={showFeedback}
                  onClick={() => setSelectedAnswer(option)}
                  className={`group flex w-full items-start gap-4 px-3 py-3 text-left transition-colors ${
                    showFeedback ? 'cursor-default' : 'cursor-pointer'
                  }`}
                  aria-pressed={isSelected}
                >
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center transition-colors"
                    style={{
                      border: `1px solid ${
                        isSelected ? 'var(--rm-accent)' : 'var(--rm-border)'
                      }`,
                      backgroundColor: isSelected ? 'var(--rm-accent)' : 'transparent',
                    }}
                  >
                    {isSelected && (
                      <span
                        className="block h-2 w-2"
                        style={{ backgroundColor: 'var(--rm-bg)' }}
                      />
                    )}
                  </span>
                  <span
                    className="font-body text-[15px] leading-relaxed"
                    style={{
                      color: isSelected ? 'var(--rm-accent)' : 'var(--rm-text)',
                    }}
                  >
                    {option}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Feedback after submit */}
        {showFeedback && (
          <div
            className="mt-7 px-5 py-4"
            style={{ border: '1px solid var(--rm-border)' }}
          >
            <span
              className="font-data-mono text-[11px] font-bold uppercase tracking-[0.22em]"
              style={{
                color: isCorrect ? 'var(--rm-accent)' : 'var(--rm-text-secondary)',
              }}
            >
              {isCorrect ? 'Correct' : timedOut ? 'Time up' : 'Incorrect'}
            </span>
            <p
              className="mt-3 font-body text-[14px] leading-7"
              style={{ color: 'var(--rm-text-secondary)' }}
            >
              {currentQuestion.explanation}
            </p>
            {!isCorrect && (
              <p
                className="mt-3 font-body text-[14px]"
                style={{ color: 'var(--rm-text)' }}
              >
                <span
                  className="font-data-mono text-[11px] uppercase tracking-[0.18em] mr-2"
                  style={{ color: 'var(--rm-text-secondary)' }}
                >
                  Answer:
                </span>
                {Array.isArray(currentQuestion.correctAnswer)
                  ? currentQuestion.correctAnswer[0]
                  : currentQuestion.correctAnswer}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer — kWh reward + Skip + Submit */}
      <footer
        className="flex items-center justify-between gap-4 px-8 py-5"
        style={{ borderTop: '1px solid var(--rm-border)' }}
      >
        <span
          className="font-data-mono text-[11px] uppercase tracking-[0.16em] tabular-nums"
          style={{ color: 'var(--rm-text-secondary)' }}
        >
          +{totalReward} kWh on correct
        </span>
        <div className="flex items-center gap-6">
          {!showFeedback ? (
            <>
              <button
                type="button"
                onClick={handleSkip}
                disabled={isCompleting}
                className="group inline-flex items-center gap-1.5 font-data-mono text-[11px] uppercase tracking-[0.18em] transition-colors"
                style={{ color: 'var(--rm-text-secondary)' }}
              >
                Skip
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => handleResolveAnswer(selectedAnswer, false)}
                disabled={!selectedAnswer || isCompleting}
                className="group inline-flex items-center gap-1.5 pb-1 font-data-mono text-[12px] font-bold uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  color: 'var(--rm-accent)',
                  borderBottom: '1px solid var(--rm-accent)',
                }}
              >
                Submit answer
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                void handleAdvance();
              }}
              disabled={isCompleting}
              className="group inline-flex items-center gap-1.5 pb-1 font-data-mono text-[12px] font-bold uppercase tracking-[0.18em] transition-colors disabled:opacity-50 disabled:cursor-wait"
              style={{
                color: 'var(--rm-accent)',
                borderBottom: '1px solid var(--rm-accent)',
              }}
            >
              {currentIndex === questions.length - 1
                ? correctAnswers >= requiredCorrect
                  ? 'Complete module'
                  : 'See result'
                : 'Next question'}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </button>
          )}
        </div>
      </footer>
    </section>
  );
};
