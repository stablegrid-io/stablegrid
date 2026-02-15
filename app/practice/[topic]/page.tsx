'use client';

import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { PracticeTopic } from '@/lib/types';
import { SessionHeader } from '@/components/practice/SessionHeader';
import { QuestionCard } from '@/components/practice/QuestionCard';
import { FeedbackPanel } from '@/components/practice/FeedbackPanel';
import { SessionComplete } from '@/components/practice/SessionComplete';
import { useQuestionSession } from '@/lib/hooks/useQuestionSession';
import { Card } from '@/components/ui/Card';

export default function PracticePage({
  params
}: {
  params: { topic: string };
}) {
  const topic = params.topic as PracticeTopic;
  const {
    currentQuestion,
    currentIndex,
    userAnswer,
    showFeedback,
    isCorrect,
    hintRevealed,
    sessionStats,
    isLoading,
    sessionComplete,
    setUserAnswer,
    handleSubmit,
    handleNext,
    handleSkip,
    handleRevealHint,
    handleTryAgain,
    handleRestart,
    progress,
    questions,
    isRuntimeLoading,
    runtimeError,
    lastXpGained
  } = useQuestionSession(topic, 10);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-brand-500" />
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Loading questions...
          </p>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <SessionComplete
          stats={sessionStats}
          topic={topic}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            No questions found for this topic
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SessionHeader
        topic={topic}
        currentQuestion={currentIndex + 1}
        totalQuestions={questions.length}
        progress={progress}
        xpEarned={sessionStats.totalXP}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {topic === 'python' && isRuntimeLoading && (
            <div className="mb-4 rounded-2xl border border-light-border bg-light-hover px-4 py-3 text-sm text-text-light-secondary dark:border-dark-border dark:bg-dark-muted dark:text-text-dark-secondary">
              Loading Python runtime for code checks...
            </div>
          )}
          {runtimeError && (
            <div className="mb-4 rounded-2xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-800 dark:bg-error-900/10 dark:text-error-400">
              {runtimeError} Code execution is temporarily unavailable; answers
              will be validated by pattern matching only.
            </div>
          )}

          <Card className="p-8">
            <AnimatePresence mode="wait">
              {!showFeedback ? (
                <QuestionCard
                  key={currentQuestion.id}
                  question={currentQuestion}
                  userAnswer={userAnswer}
                  onAnswerChange={setUserAnswer}
                  onSubmit={handleSubmit}
                  hintRevealed={hintRevealed}
                  onRevealHint={handleRevealHint}
                  showFeedback={showFeedback}
                />
              ) : (
                <FeedbackPanel
                  key={`feedback-${currentQuestion.id}`}
                  isCorrect={isCorrect}
                  explanation={currentQuestion.explanation}
                  correctAnswer={currentQuestion.correctAnswer}
                  userAnswer={userAnswer}
                  xpGained={lastXpGained}
                  onNext={handleNext}
                  onTryAgain={handleTryAgain}
                />
              )}
            </AnimatePresence>
          </Card>

          {!showFeedback && (
            <div className="mt-4 text-center">
              <button
                onClick={handleSkip}
                className="text-sm text-text-light-tertiary transition-colors hover:text-brand-500 dark:text-text-dark-tertiary"
              >
                Skip Question →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
