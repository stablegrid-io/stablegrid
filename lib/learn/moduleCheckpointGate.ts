import type { Question } from '@/lib/types';
import fabricQuestions from '@/data/questions/fabric.json';
import pysparkQuestions from '@/data/questions/pyspark.json';

interface QuestionPayload {
  questions?: Question[];
}

const QUESTION_BANKS: Record<string, Question[]> = {
  pyspark: (pysparkQuestions as QuestionPayload).questions ?? [],
  fabric: (fabricQuestions as QuestionPayload).questions ?? [],
};

export const CHECKPOINT_PASS_RATIO = 0.9;
export const CHECKPOINT_QUESTIONS_PER_LESSON = 1;

export const getCheckpointPassThreshold = (totalQuestions: number) =>
  Math.ceil(totalQuestions * CHECKPOINT_PASS_RATIO);

export const isCheckpointPassing = (correct: number, total: number) =>
  total > 0 && correct / total >= CHECKPOINT_PASS_RATIO;

export const buildModuleNumberTag = (moduleNumber: number) =>
  `module-${String(moduleNumber).padStart(2, '0')}`;

export const buildLessonTag = (moduleNumber: number, lessonOrder: number) =>
  `${buildModuleNumberTag(moduleNumber)}-lesson-${String(lessonOrder).padStart(2, '0')}`;

const shuffle = <T>(input: readonly T[]): T[] => {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export interface PreparedCheckpointQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  lessonOrder: number | null;
  xpReward: number;
}

const prepareQuestion = (q: Question): PreparedCheckpointQuestion => {
  const options = q.options ?? [];
  const correct = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
  const lessonTag = q.tags?.find((t) => /lesson-\d+$/.test(t));
  const lessonOrder = lessonTag ? Number(lessonTag.match(/lesson-(\d+)$/)?.[1] ?? null) : null;
  return {
    id: q.id,
    question: q.question,
    options: shuffle(options),
    correctAnswer: String(correct ?? ''),
    explanation: q.explanation,
    lessonOrder: Number.isFinite(lessonOrder ?? NaN) ? lessonOrder : null,
    xpReward: q.xpReward ?? 0,
  };
};

export interface SelectCheckpointQuestionsArgs {
  topic: string;
  moduleNumber: number;
  lessonCount: number;
}

/**
 * Selects checkpoint questions for a module. When per-lesson tags exist
 * in the bank, returns 2 random questions per lesson. Otherwise falls back
 * to the largest available shuffled subset of the module's question pool.
 */
export const selectCheckpointQuestions = ({
  topic,
  moduleNumber,
  lessonCount,
}: SelectCheckpointQuestionsArgs): PreparedCheckpointQuestion[] => {
  const bank = QUESTION_BANKS[topic.toLowerCase()] ?? [];
  if (bank.length === 0) return [];

  const moduleTag = buildModuleNumberTag(moduleNumber);
  const moduleQuestions = bank.filter(
    (q) => q.type === 'multiple-choice' && (q.tags ?? []).includes(moduleTag)
  );
  if (moduleQuestions.length === 0) return [];

  const target = lessonCount * CHECKPOINT_QUESTIONS_PER_LESSON;

  // Group by lesson tag if present
  const byLesson = new Map<number, Question[]>();
  const orphans: Question[] = [];
  for (const q of moduleQuestions) {
    const lessonTag = q.tags?.find((t) => t.startsWith(`${moduleTag}-lesson-`));
    if (!lessonTag) {
      orphans.push(q);
      continue;
    }
    const order = Number(lessonTag.match(/lesson-(\d+)$/)?.[1] ?? '0');
    if (!Number.isFinite(order) || order <= 0) {
      orphans.push(q);
      continue;
    }
    const list = byLesson.get(order) ?? [];
    list.push(q);
    byLesson.set(order, list);
  }

  // When per-lesson tags exist, pick CHECKPOINT_QUESTIONS_PER_LESSON random per lesson
  if (byLesson.size > 0) {
    const selected: Question[] = [];
    for (const [, lessonQs] of byLesson) {
      const picked = shuffle(lessonQs).slice(0, CHECKPOINT_QUESTIONS_PER_LESSON);
      selected.push(...picked);
    }
    // If still under target (e.g. a few lessons missing), top up from orphans
    if (selected.length < target && orphans.length > 0) {
      const needed = target - selected.length;
      selected.push(...shuffle(orphans).slice(0, needed));
    }
    return shuffle(selected).map(prepareQuestion);
  }

  // Fallback: bank only has module-level tags. Use what exists, capped at target.
  const pool = shuffle(moduleQuestions).slice(0, target);
  return pool.map(prepareQuestion);
};
