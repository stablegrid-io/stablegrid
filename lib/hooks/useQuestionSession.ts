'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PracticeTopic, Question } from '@/lib/types';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { validateAnswer } from '@/lib/validators/answerValidator';
import { getPracticeRewardUnits } from '@/lib/energy';
import pysparkQuestionsData from '@/data/questions/pyspark.json';
import fabricQuestionsData from '@/data/questions/fabric.json';

interface SessionStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  totalXP: number;
  timeSpent: number;
}

interface QuestionPayload {
  questions?: Question[];
}

const QUESTION_BANKS: Record<PracticeTopic, Question[]> = {
  pyspark: (pysparkQuestionsData as QuestionPayload).questions ?? [],
  fabric: (fabricQuestionsData as QuestionPayload).questions ?? []
};

const shuffleQuestions = (items: Question[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const normalizeOption = (value: string) => value.trim().toLowerCase();

const toMultipleChoiceQuestion = (question: Question): Question => {
  const baseCorrect = Array.isArray(question.correctAnswer)
    ? question.correctAnswer[0] ?? ''
    : question.correctAnswer;
  const correctAnswer = `${baseCorrect}`.trim();

  const candidateOptions = [
    correctAnswer,
    ...(question.options ?? []),
    ...(question.alternateAnswers ?? [])
  ]
    .map((value) => `${value}`.trim())
    .filter(Boolean);

  const deduped: string[] = [];
  const seen = new Set<string>();
  candidateOptions.forEach((option) => {
    const key = normalizeOption(option);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(option);
    }
  });

  const fallbackDistractors = [
    'All of the above',
    'None of the above',
    'Insufficient information',
    'Not applicable'
  ];

  while (deduped.length < 4) {
    const fallback =
      fallbackDistractors.find((item) => !seen.has(normalizeOption(item))) ??
      `Option ${deduped.length + 1}`;
    const key = normalizeOption(fallback);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(fallback);
    }
  }

  return {
    ...question,
    type: 'multiple-choice',
    options: deduped.slice(0, 4),
    correctAnswer: correctAnswer || deduped[0]
  };
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
  const [isFirstCompletedSession, setIsFirstCompletedSession] = useState(false);
  const initialQuestionHistoryCountRef = useRef(0);

  const { answerQuestion } = useProgressStore();

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
    setIsFirstCompletedSession(false);
    initialQuestionHistoryCountRef.current = useProgressStore.getState().questionHistory.length;

    try {
      let allQuestions: Question[] = [];

      if (hasPresetQuestions) {
        allQuestions = presetQuestions ?? [];
      } else {
        allQuestions = QUESTION_BANKS[topic] ?? [];
      }

      allQuestions = allQuestions.map(toMultipleChoiceQuestion);

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
    setUserAnswer('');
  }, [currentQuestion]);

  const handleSubmit = useCallback(
    async (answerOverride?: string) => {
      if (!currentQuestion) {
        return;
      }

      const answer =
        typeof answerOverride === 'string' ? answerOverride : userAnswer;
      const finalCorrect = validateAnswer(currentQuestion, answer);

      setIsCorrect(finalCorrect);
      setShowFeedback(true);

      const alreadyAnswered = answeredQuestionIds.has(currentQuestion.id);
      const xpGained =
        !alreadyAnswered && finalCorrect
          ? getPracticeRewardUnits(currentQuestion.difficulty)
          : 0;
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
      const answeredQuestions = sessionStats.correctAnswers + sessionStats.incorrectAnswers;
      setSessionStats((prev) => ({ ...prev, timeSpent }));
      setIsFirstCompletedSession(
        initialQuestionHistoryCountRef.current === 0 && answeredQuestions > 0
      );
      setSessionComplete(true);
    }
  }, [currentIndex, questions.length, sessionStartTime, sessionStats]);

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
    lastXpGained,
    isFirstCompletedSession,

    setUserAnswer,
    handleSubmit,
    handleNext,
    handleSkip,
    handleRevealHint,
    handleTryAgain,
    handleRestart,

    progress,
    accuracy,
    isRuntimeLoading: false,
    runtimeError: null
  };
};
