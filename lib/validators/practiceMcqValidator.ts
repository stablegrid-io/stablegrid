/**
 * Server-side MCQ answer validation for practice task attempts.
 *
 * Imported by the task-attempt POST route so the recorded `result` is
 * derived from the registry's correctAnswer, not from a client claim.
 * No 'use client' — runs in the API route.
 *
 * Code tasks (write_the_code) are NOT validated here. The Python runtime
 * lives in the browser (Pyodide), so the server cannot re-execute the
 * user's submission; the route still accepts and stores those attempts
 * with the client-claimed result. Only MCQ-style fields (single_select,
 * multi_select with `correctAnswer` in the registry) are server-validated.
 */

import {
  getPracticeSet,
  type PracticeTask,
  type TemplateField,
} from '@/data/operations/practice-sets';

export type PracticeMcqResult = 'success' | 'failure';

export interface ValidatedField {
  value: string;
  isCorrect: boolean;
}

export type PracticeMcqValidationOutcome =
  | {
      status: 'validated';
      task: PracticeTask;
      perField: Record<string, ValidatedField>;
      result: PracticeMcqResult;
    }
  | {
      status: 'unknown_task';
    }
  | {
      status: 'no_validatable_fields';
      task: PracticeTask;
    };

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[   ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getCorrect = (field: TemplateField): string => {
  if (field.correctAnswer != null) return String(field.correctAnswer);
  if (field.correct != null) return field.correct;
  return '';
};

const isValidatable = (field: TemplateField): boolean =>
  (field.type === 'single_select' || field.type === 'multi_select') &&
  Boolean(field.options) &&
  getCorrect(field).length > 0;

/**
 * Look up the task in the registry and validate every MCQ field's submitted
 * value against `correctAnswer`. Returns either a fully-validated result, or
 * a status flag indicating why validation could not run (so the route handler
 * can decide whether to fall back to the client-claimed result).
 */
export function validatePracticeMcqAnswers(
  topic: string,
  moduleId: string,
  taskId: string,
  answers: Record<string, string>,
): PracticeMcqValidationOutcome {
  const modulePrefix = moduleId.replace(/^module-/, '');
  const set = getPracticeSet(topic, modulePrefix);
  if (!set) return { status: 'unknown_task' };

  const task = set.tasks.find((t) => t.id === taskId);
  if (!task) return { status: 'unknown_task' };

  const fields = (task.template?.fields ?? []).filter(isValidatable);
  if (fields.length === 0) {
    return { status: 'no_validatable_fields', task };
  }

  // No answers submitted — the caller is using us only as a task-identity
  // probe. Don't fabricate a "failure" verdict from missing fields.
  if (Object.keys(answers).length === 0) {
    return { status: 'no_validatable_fields', task };
  }

  const perField: Record<string, ValidatedField> = {};
  let allCorrect = true;

  for (const field of fields) {
    const submitted = (answers[field.id] ?? '').toString();
    const correct = getCorrect(field);
    const isCorrect =
      submitted.length > 0 && normalize(submitted) === normalize(correct);
    perField[field.id] = { value: submitted, isCorrect };
    if (!isCorrect) allCorrect = false;
  }

  return {
    status: 'validated',
    task,
    perField,
    result: allCorrect ? 'success' : 'failure',
  };
}
