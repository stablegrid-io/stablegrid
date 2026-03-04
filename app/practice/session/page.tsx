'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { SessionHeader } from '@/components/practice/SessionHeader';
import { QuestionCard } from '@/components/practice/QuestionCard';
import { FeedbackPanel } from '@/components/practice/FeedbackPanel';
import { SessionComplete } from '@/components/practice/SessionComplete';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';
import { useQuestionSession } from '@/lib/hooks/useQuestionSession';
import type { PracticeTopic, Question } from '@/lib/types';

export default function PracticeSessionPage() {
  const router = useRouter();
  const [presetQuestions, setPresetQuestions] = useState<Question[]>([]);
  const [ready, setReady] = useState(false);
  const startTrackedRef = useRef(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('practice-questions');
    if (!raw) {
      router.replace('/practice/setup');
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Question[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        router.replace('/practice/setup');
        return;
      }
      setPresetQuestions(parsed);
      setReady(true);
    } catch (error) {
      console.error('Failed to parse practice questions', error);
      router.replace('/practice/setup');
    }
  }, [router]);

  const fallbackTopic = useMemo<PracticeTopic>(
    () => (presetQuestions[0]?.topic ?? 'sql') as PracticeTopic,
    [presetQuestions]
  );

  const topicLabel = useMemo(() => {
    if (presetQuestions.length === 0) return 'Practice';
    const uniqueTopics = Array.from(
      new Set(presetQuestions.map((question) => question.topic))
    );
    return uniqueTopics.length === 1 ? uniqueTopics[0] : 'Filtered';
  }, [presetQuestions]);

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
  } = useQuestionSession(fallbackTopic, presetQuestions.length, {
    presetQuestions,
    enabled: ready
  });

  useEffect(() => {
    if (!ready || isLoading || sessionComplete || startTrackedRef.current || presetQuestions.length === 0) {
      return;
    }

    startTrackedRef.current = true;
    void trackProductEvent('practice_session_started', {
      topic: topicLabel,
      questionCount: presetQuestions.length,
      source: 'practice_setup'
    });
  }, [isLoading, presetQuestions.length, ready, sessionComplete, topicLabel]);

  useEffect(() => {
    if (isLoading) {
      startTrackedRef.current = false;
    }
  }, [isLoading]);

  if (!ready || isLoading) {
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
          topic={topicLabel}
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
            No questions found for this session
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SessionHeader
        topic={topicLabel}
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
                type="button"
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
