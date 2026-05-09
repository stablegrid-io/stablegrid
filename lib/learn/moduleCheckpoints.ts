import type { PracticeTopic, Question } from '@/lib/types';
import fabricQuestionsData from '@/data/questions/fabric.json';
import pysparkQuestionsData from '@/data/questions/pyspark.json';

interface QuestionPayload {
  questions?: Question[];
}

const QUESTION_BANKS: Record<PracticeTopic, Question[]> = {
  pyspark: (pysparkQuestionsData as QuestionPayload).questions ?? [],
  fabric: (fabricQuestionsData as QuestionPayload).questions ?? []
};

const PRACTICE_TOPICS = new Set<PracticeTopic>(['pyspark', 'fabric']);

const isPracticeTopic = (topic: string): topic is PracticeTopic =>
  PRACTICE_TOPICS.has(topic as PracticeTopic);

export const MODULE_CHECKPOINT_TIME_LIMIT_SECONDS = 30;
export const MODULE_CHECKPOINT_PASS_RATIO = 0.67;

export const isModuleCheckpointLesson = (title: string | null | undefined) =>
  typeof title === 'string' && /module checkpoint/i.test(title);

export const getModuleCheckpointTag = (moduleNumber: number) =>
  `module-${String(moduleNumber).padStart(2, '0')}`;

interface CheckpointTarget {
  /** Chapter id, e.g. `module-PS3` (Junior), `module-PSI3` (Mid),
   *  `module-PSS3` (Senior). The question bank tags questions by id so
   *  Junior / Mid / Senior modules with the same number don't collide. */
  id: string;
  number: number;
}

export const getModuleCheckpointQuestions = (
  topic: string,
  chapter: CheckpointTarget,
  limit: number = 3
) => {
  if (!isPracticeTopic(topic)) {
    return [];
  }

  const bank = QUESTION_BANKS[topic];
  // Prefer id-scoped tags (module-PS3, module-PSI3, module-PSS3 …) so each
  // tier gets its own question pool. Fall back to legacy numeric tags
  // (module-01 …) for content that hasn't been retagged yet.
  const idMatches = bank.filter((question) =>
    question.tags?.includes(chapter.id)
  );
  if (idMatches.length > 0) return idMatches.slice(0, limit);

  const numericTag = getModuleCheckpointTag(chapter.number);
  return bank
    .filter((question) => question.tags?.includes(numericTag))
    .slice(0, limit);
};

export const getModuleCheckpointRequiredCorrect = (questionCount: number) =>
  Math.max(1, Math.round(questionCount * MODULE_CHECKPOINT_PASS_RATIO));

interface ModuleCheckpointTarget {
  id: string;
  number: number;
  sections: Array<{ title: string }>;
}

export type ModuleCheckpointState = 'none' | 'pending' | 'ready' | 'passed';

export const getModuleCheckpointMeta = ({
  topic,
  chapter,
  lessonsRead,
  lessonsTotal,
  isCompleted
}: {
  topic: string;
  chapter: ModuleCheckpointTarget;
  lessonsRead: number;
  lessonsTotal: number;
  isCompleted: boolean;
}) => {
  const hasCheckpointLesson = chapter.sections.some((section) =>
    isModuleCheckpointLesson(section.title)
  );
  const questionCount = getModuleCheckpointQuestions(topic, chapter).length;
  const requiredCorrect = getModuleCheckpointRequiredCorrect(questionCount);
  const hasCheckpoint = hasCheckpointLesson && questionCount > 0;

  if (!hasCheckpoint) {
    return {
      hasCheckpoint,
      questionCount: 0,
      requiredCorrect: 0,
      state: 'none' as ModuleCheckpointState,
      label: null,
      detail: null
    };
  }

  if (isCompleted) {
    return {
      hasCheckpoint,
      questionCount,
      requiredCorrect,
      state: 'passed' as ModuleCheckpointState,
      label: 'Checkpoint passed',
      detail: `${questionCount} flashcards`
    };
  }

  if (lessonsRead >= lessonsTotal) {
    return {
      hasCheckpoint,
      questionCount,
      requiredCorrect,
      state: 'ready' as ModuleCheckpointState,
      label: 'Checkpoint ready',
      detail: `Pass ${requiredCorrect}/${questionCount}`
    };
  }

  return {
    hasCheckpoint,
    questionCount,
    requiredCorrect,
    state: 'pending' as ModuleCheckpointState,
    label: 'Checkpoint pending',
    detail: `${questionCount} flashcards`
  };
};
