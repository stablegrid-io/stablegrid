'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PracticeTopic, Question } from '@/lib/types';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { validateAnswer } from '@/lib/validators/answerValidator';
import { runCodeTests } from '@/lib/validators/testRunner';
import { usePyodide } from '@/lib/hooks/usePyodide';

interface SessionStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  totalXP: number;
  timeSpent: number;
}

const shuffleQuestions = (items: Question[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

interface UseQuestionSessionOptions {
  presetQuestions?: Question[];
  enabled?: boolean;
}

export const useQuestionSession = (
  topic: PracticeTopic,
  questionCount: number = 10,
  options: UseQuestionSessionOptions = {}
) => {
  const { presetQuestions, enabled = true } = options;
  const hasPresetQuestions = Array.isArray(presetQuestions);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    skippedQuestions: 0,
    totalXP: 0,
    timeSpent: 0
  });
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(
    () => new Set()
  );
  const [lastXpGained, setLastXpGained] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);

  const { answerQuestion } = useProgressStore();
  const shouldEnableRuntime =
    hasPresetQuestions && presetQuestions
      ? presetQuestions.some((question) => question.topic === 'python')
      : topic === 'python';
  const { runCode, isLoading: runtimeLoading, error: runtimeError } =
    usePyodide(enabled && shouldEnableRuntime);

  const loadQuestions = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setSessionComplete(false);
    setCurrentIndex(0);
    setUserAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
    setHintRevealed(false);
    setAnsweredQuestionIds(new Set());
    setLastXpGained(0);

    try {
      let allQuestions: Question[] = [];

      if (hasPresetQuestions) {
        allQuestions = presetQuestions ?? [];
      } else {
        const questionModule = await import(`@/data/questions/${topic}.json`);
        const payload = (questionModule.default ?? questionModule) as {
          questions?: Question[];
          [key: string]: Question[] | undefined;
        };
        allQuestions = payload.questions ?? payload[topic] ?? [];
      }

      const selected = shuffleQuestions(allQuestions).slice(
        0,
        Math.min(questionCount, allQuestions.length)
      );
      setQuestions(selected);
      setSessionStats((prev) => ({
        ...prev,
        totalQuestions: selected.length,
        correctAnswers: 0,
        incorrectAnswers: 0,
        skippedQuestions: 0,
        totalXP: 0,
        timeSpent: 0
      }));
    } catch (error) {
      console.error('Failed to load questions:', error);
      setQuestions([]);
      setSessionStats((prev) => ({ ...prev, totalQuestions: 0 }));
    } finally {
      setSessionStartTime(Date.now());
      setIsLoading(false);
    }
  }, [enabled, hasPresetQuestions, presetQuestions, questionCount, topic]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void loadQuestions();
  }, [enabled, loadQuestions]);

  const currentQuestion = useMemo(
    () => questions[currentIndex],
    [questions, currentIndex]
  );

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }
    setUserAnswer(currentQuestion.codeSnippet ?? '');
  }, [currentQuestion]);

  const handleSubmit = useCallback(
    async (answerOverride?: string) => {
      if (!currentQuestion) {
        return;
      }

      const answer =
        typeof answerOverride === 'string' ? answerOverride : userAnswer;
      const baseCorrect = validateAnswer(currentQuestion, answer);
      let finalCorrect = baseCorrect;

      if (
        baseCorrect &&
        currentQuestion.type === 'code' &&
        currentQuestion.topic === 'python' &&
        !runtimeLoading &&
        !runtimeError
      ) {
        const testResult = await runCodeTests({
          question: currentQuestion,
          answer,
          runPython: runCode
        });
        finalCorrect = testResult.success;
      }

      setIsCorrect(finalCorrect);
      setShowFeedback(true);

      const alreadyAnswered = answeredQuestionIds.has(currentQuestion.id);
      const xpGained =
        !alreadyAnswered && finalCorrect ? currentQuestion.xpReward : 0;
      setLastXpGained(xpGained);

      if (!alreadyAnswered) {
        setSessionStats((prev) => ({
          ...prev,
          correctAnswers: prev.correctAnswers + (finalCorrect ? 1 : 0),
          incorrectAnswers: prev.incorrectAnswers + (finalCorrect ? 0 : 1),
          totalXP: prev.totalXP + xpGained
        }));

        answerQuestion(
          currentQuestion.id,
          currentQuestion.topic,
          finalCorrect,
          xpGained
        );

        setAnsweredQuestionIds((prev) => {
          const next = new Set(prev);
          next.add(currentQuestion.id);
          return next;
        });
      }
    },
    [
      answerQuestion,
      answeredQuestionIds,
      currentQuestion,
      runCode,
      runtimeError,
      runtimeLoading,
      userAnswer
    ]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer('');
      setShowFeedback(false);
      setIsCorrect(false);
      setHintRevealed(false);
      setLastXpGained(0);
    } else {
      const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
      setSessionStats((prev) => ({ ...prev, timeSpent }));
      setSessionComplete(true);
    }
  }, [currentIndex, questions.length, sessionStartTime]);

  const handleSkip = useCallback(() => {
    setSessionStats((prev) => ({
      ...prev,
      skippedQuestions: prev.skippedQuestions + 1
    }));
    handleNext();
  }, [handleNext]);

  const handleRevealHint = useCallback(() => {
    setHintRevealed(true);
  }, []);

  const handleTryAgain = useCallback(() => {
    setShowFeedback(false);
    setHintRevealed(false);
  }, []);

  const handleRestart = useCallback(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const progress = questions.length
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;

  const accuracy =
    sessionStats.correctAnswers + sessionStats.incorrectAnswers > 0
      ? (sessionStats.correctAnswers /
          (sessionStats.correctAnswers + sessionStats.incorrectAnswers)) *
        100
      : 0;

  return {
    questions,
    currentQuestion,
    currentIndex,
    userAnswer,
    showFeedback,
    isCorrect,
    hintRevealed,
    sessionStats,
    isLoading,
    sessionComplete,
    isRuntimeLoading: runtimeLoading,
    runtimeError,
    lastXpGained,

    setUserAnswer,
    handleSubmit,
    handleNext,
    handleSkip,
    handleRevealHint,
    handleTryAgain,
    handleRestart,

    progress,
    accuracy
  };
};
