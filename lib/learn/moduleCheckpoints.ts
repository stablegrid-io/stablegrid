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

export const getModuleCheckpointQuestions = (
  topic: string,
  moduleNumber: number,
  limit: number = 3
) => {
  if (!isPracticeTopic(topic)) {
    return [];
  }

  const tag = getModuleCheckpointTag(moduleNumber);
  return QUESTION_BANKS[topic]
    .filter((question) => question.tags?.includes(tag))
    .slice(0, limit);
};

export const getModuleCheckpointRequiredCorrect = (questionCount: number) =>
  Math.max(1, Math.round(questionCount * MODULE_CHECKPOINT_PASS_RATIO));

interface ModuleCheckpointTarget {
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
  const questionCount = getModuleCheckpointQuestions(topic, chapter.number).length;
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
