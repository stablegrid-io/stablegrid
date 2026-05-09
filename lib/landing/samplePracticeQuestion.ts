import pjsi1Data from '@/data/operations/practice-sets/pyspark/PJSI1_Practice.json';
import type { PracticeSet } from '@/data/operations/practice-sets';

/**
 * Picks a representative MCQ from the live practice catalogue to surface on
 * the public Coding-practice landing page. Mirrors the role
 * `getSampleLesson` plays for theory: a real question pulled from a real
 * shipped track, so the marketing page can show what practice actually
 * feels like instead of a mock screenshot.
 *
 * Pinned to PJSI1 / module-PJSI1-task-02 ("Aggregate Before Join, or Join
 * Before Aggregate") — a Mid-level Joins & Shuffles task. Two short
 * (4-line) python snippets compare aggregate-then-join vs join-then-
 * aggregate, both clearly labelled. Lets the preview show side-by-side
 * code blocks with full python syntax highlighting in a small footprint.
 */

export interface SamplePracticeEvidence {
  type: 'text' | 'code_block';
  language?: string;
  content: string;
  label?: string;
  title?: string;
}

export interface SamplePracticeQuestion {
  id: string;
  setTitle: string;
  title: string;
  context: string;
  prompt: string;
  evidence: SamplePracticeEvidence[];
  options: string[];
  correctAnswer: string;
  rationale?: string;
  topic: string;
  trackLevel: string;
  moduleId: string;
  href: string;
}

interface RawTask {
  id?: string;
  title?: string;
  description?: { context?: string; task?: string };
  evidence?: Array<{
    type?: string;
    language?: string;
    content?: string;
    label?: string;
    title?: string;
  }>;
  template?: {
    fields?: Array<{
      type?: string;
      label?: string;
      options?: string[];
      correctAnswer?: string;
      rationale?: string;
    }>;
  };
}

const PINNED_TASK_ID = 'module-PJSI1-task-02';

export function getSamplePracticeQuestion(): SamplePracticeQuestion | null {
  const set = pjsi1Data as unknown as PracticeSet;
  const task = (set.tasks as unknown as RawTask[]).find(
    (t) => t.id === PINNED_TASK_ID,
  );
  if (!task) return null;
  const field = task.template?.fields?.find(
    (f) => f.type === 'single_select',
  );
  if (!field || !field.options || !field.correctAnswer) return null;
  if (!task.id || !task.title || !task.description?.context) return null;

  const params = new URLSearchParams();
  params.set('practice', set.metadata.moduleId);

  const evidence: SamplePracticeEvidence[] = (task.evidence ?? [])
    .filter(
      (e): e is SamplePracticeEvidence & { content: string } =>
        (e.type === 'text' || e.type === 'code_block') &&
        typeof e.content === 'string',
    )
    .map((e) => ({
      type: e.type as 'text' | 'code_block',
      content: e.content,
      language: e.language,
      label: e.label,
      title: e.title,
    }));

  return {
    id: task.id,
    setTitle: set.title,
    title: task.title,
    context: task.description.context,
    prompt: task.description.task ?? field.label ?? '',
    evidence,
    options: field.options,
    correctAnswer: field.correctAnswer,
    rationale: field.rationale,
    topic: set.topic,
    trackLevel: set.metadata.trackLevel,
    moduleId: set.metadata.moduleId,
    href: `/practice/${set.metadata.trackLevel}?${params.toString()}`,
  };
}
