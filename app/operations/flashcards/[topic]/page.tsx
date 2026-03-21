'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { PracticeTopic } from '@/lib/types';
import { SessionHeader } from '@/components/practice/SessionHeader';
import { QuestionCard } from '@/components/practice/QuestionCard';
import { FeedbackPanel } from '@/components/practice/FeedbackPanel';
import { SessionComplete } from '@/components/practice/SessionComplete';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';
import { useQuestionSession } from '@/lib/hooks/useQuestionSession';
import { Card } from '@/components/ui/Card';

const ALLOWED_TOPICS: PracticeTopic[] = ['pyspark', 'fabric'];

export default function PracticePage({
  params
}: {
  params: { topic: string };
}) {
  const topic = params.topic as PracticeTopic;
  const isAllowedTopic = ALLOWED_TOPICS.includes(topic);
  const sessionTopic = isAllowedTopic ? topic : 'pyspark';
  const startTrackedRef = useRef(false);

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
    lastXpGained,
    isFirstCompletedSession
  } = useQuestionSession(sessionTopic, 10, { enabled: isAllowedTopic });

  useEffect(() => {
    if (!isAllowedTopic || isLoading || sessionComplete || startTrackedRef.current) {
      return;
    }

    startTrackedRef.current = true;
    void trackProductEvent('practice_session_started', {
      topic: sessionTopic,
      questionCount: questions.length,
      source: 'topic_drill'
    });
  }, [isAllowedTopic, isLoading, questions.length, sessionComplete, sessionTopic]);

  useEffect(() => {
    if (isLoading) {
      startTrackedRef.current = false;
    }
  }, [isLoading]);

  if (!isAllowedTopic) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Topic not available in flashcards.
          </p>
        </div>
      </div>
    );
  }

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
          isFirstCompletedSession={isFirstCompletedSession}
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
