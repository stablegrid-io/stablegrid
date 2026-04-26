'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PracticeSetSession } from '@/app/operations/practice/[topic]/[level]/[modulePrefix]/PracticeSetViewer';
import type { PracticeSet, PracticeTask } from '@/data/operations/practice-sets';
import {
  CHECKPOINT_PASS_RATIO,
  selectCheckpointQuestions,
  type PreparedCheckpointQuestion,
} from '@/lib/learn/moduleCheckpointGate';
import { buildCheckpointKey, useCheckpointStore } from '@/lib/stores/useCheckpointStore';
import { useReadingModeStore } from '@/lib/stores/useReadingModeStore';
import type { TheoryChapter } from '@/types/theory';
import { CheckpointInterstitial } from './CheckpointInterstitial';

const INTERSTITIAL_DURATION_MS = 3000;

interface ModuleCheckpointSessionProps {
  topic: string;
  trackSlug: string;
  chapter: TheoryChapter;
  returnHref: string;
}

const buildCheckpointPracticeSet = (
  topic: string,
  trackSlug: string,
  chapter: TheoryChapter,
  questions: PreparedCheckpointQuestion[]
): PracticeSet => {
  const tasks: PracticeTask[] = questions.map((q, idx) => ({
    id: `checkpoint-q-${idx + 1}-${q.id}`,
    title: `Question ${idx + 1}`,
    type: 'multiple_choice',
    estimatedMinutes: 1,
    description: {
      context: q.question,
      task: 'Select the best answer.',
      validationHint: q.explanation,
    },
    template: {
      fields: [
        {
          id: 'answer',
          label: q.question,
          type: 'single_select',
          options: q.options,
          correctAnswer: q.correctAnswer,
          rationale: q.explanation,
        },
      ],
    },
  }));

  return {
    topic: topic.toLowerCase(),
    title: `${chapter.title} — Module Checkpoint`,
    description: `Pass with ${Math.round(CHECKPOINT_PASS_RATIO * 100)}% to unlock the next module.`,
    version: '1.0.0',
    metadata: {
      moduleId: `checkpoint-${chapter.id}`,
      trackLevel: trackSlug,
      estimatedDurationMinutes: Math.max(5, tasks.length),
      maximumDurationMinutes: tasks.length * 2,
      taskCount: tasks.length,
      scenarioCompany: '',
      modulePhase: 'checkpoint',
      taskTypeMix: { multiple_choice: tasks.length },
    },
    tasks,
  };
};

export function ModuleCheckpointSession({
  topic,
  trackSlug,
  chapter,
  returnHref,
}: ModuleCheckpointSessionProps) {
  const [attemptKey, setAttemptKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const recordAttempt = useCheckpointStore((s) => s.recordAttempt);
  const storeKey = buildCheckpointKey(topic, chapter.id);

  // Re-pick questions every time `attemptKey` changes (mount + retry).
  const questions = useMemo(
    () =>
      selectCheckpointQuestions({
        topic,
        moduleNumber: chapter.number,
        lessonCount: chapter.sections.length,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topic, chapter.id, attemptKey]
  );

  const practiceSet = useMemo(
    () => buildCheckpointPracticeSet(topic, trackSlug, chapter, questions),
    [topic, trackSlug, chapter, questions]
  );

  const handleResults = useCallback(
    ({
      correct,
      total,
      passed,
    }: {
      correct: number;
      total: number;
      percent: number;
      passed: boolean;
    }) => {
      recordAttempt(storeKey, { correct, total, passed });
    },
    [recordAttempt, storeKey]
  );

  const handleRetry = useCallback(() => {
    setAttemptKey((k) => k + 1);
    setIsLoading(true);
  }, []);

  // Pre-mission interstitial — game-style loading screen before each attempt.
  useEffect(() => {
    if (questions.length === 0) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const id = window.setTimeout(() => setIsLoading(false), INTERSTITIAL_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [attemptKey, questions.length]);

  // Auto-enable focus mode for the duration of the checkpoint. Fullscreen
  // itself may be denied (no user gesture in this effect), but the in-app
  // focus layout — which hides the sidebar and topbar — works regardless.
  // Always restore focus off on unmount so leaving the checkpoint doesn't
  // leave the rest of the app in focus mode.
  useEffect(() => {
    if (questions.length === 0) return;
    useReadingModeStore.getState().setFocus(true);
    return () => {
      useReadingModeStore.getState().setFocus(false);
    };
  }, [questions.length]);

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-5">
          <p className="text-[11px] font-mono font-bold tracking-widest uppercase text-on-surface-variant/40">
            Checkpoint not yet available
          </p>
          <h1 className="text-2xl font-bold text-on-surface">
            We&apos;re still building the question bank for this module.
          </h1>
          <p className="text-[13px] text-on-surface-variant/60">
            Module {chapter.number} doesn&apos;t have any tagged questions yet. As soon as
            content is added, this checkpoint will activate automatically.
          </p>
          <Link
            href={returnHref}
            className="inline-flex items-center gap-2 text-[12px] font-mono font-medium tracking-widest uppercase text-on-surface-variant/80 hover:text-on-surface transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to track
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <CheckpointInterstitial chapter={chapter} questionCount={questions.length} />;
  }

  const moduleNumberLabel = String(chapter.number).padStart(2, '0');

  return (
    <PracticeSetSession
      key={attemptKey}
      practiceSet={practiceSet}
      checkpointMode={{
        passingScorePercent: Math.round(CHECKPOINT_PASS_RATIO * 100),
        onResultsComputed: handleResults,
        returnHref,
        resultsHeading: 'Module Checkpoint',
        topbarLabel: `Module ${moduleNumberLabel} · Checkpoint`,
        onRetry: handleRetry,
      }}
    />
  );
}
