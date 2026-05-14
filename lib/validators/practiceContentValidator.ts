// Use namespace imports — vitest's jsdom env mangles `node:path` named
// imports (CI fails with "join is not a function"). Namespace style is
// robust across both Node and jsdom contexts.
import * as fs from 'node:fs';
import * as nodePath from 'node:path';

import type { PracticeTask, TemplateField } from '@/data/operations/practice-sets';

export type PracticeContentSeverity = 'error' | 'warning';

export type PracticeContentCategory =
  | 'missing_context'
  | 'missing_task'
  | 'no_template_fields'
  | 'missing_correct_answer'
  | 'missing_evidence'
  | 'length_bias_strict'
  | 'length_bias_warning'
  | 'rationale_too_long'
  | 'distractor_rationale_too_long'
  | 'duplicate_option'
  | 'unauthored_task';

export interface PracticeContentIssue {
  file: string; // basename, e.g. "PS1_Practice.json"
  taskId: string;
  fieldId: string | null;
  category: PracticeContentCategory;
  severity: PracticeContentSeverity;
  detail: string;
}

// ── Policy thresholds ───────────────────────────────────────────────────────
const MIN_CONTEXT_CHARS = 50;
const MIN_TASK_CHARS = 20;
const RATIONALE_CHAR_CAP = 150;
const LENGTH_BIAS_STRICT_RATIO = 2.0;
const LENGTH_BIAS_WARNING_RATIO = 1.5;

// Task types where `evidence` is expected. Concept-check tasks where the
// scenario is fully self-contained in description.context are exempt.
const EVIDENCE_REQUIRED_TYPES = new Set<string>([
  'output_prediction',
  'diagnostic_analysis',
  'concept_identification'
]);

// Tasks of these types are pure code drills — empty template.fields is
// expected (graded by code output, not MCQ).
const CODE_TASK_TYPES = new Set<string>([
  'write_the_code',
  'modify_the_code',
  'fix_the_code',
  'complete_the_code'
]);

const PRACTICE_DIR = nodePath.join(
  process.cwd(),
  'data',
  'operations',
  'practice-sets',
  'pyspark'
);

// PS-tier (Junior gateway) is the only set where length-bias-strict
// blocks CI. PM/PX/FND/etc are surfaced as warnings — they're flagged
// for a follow-up content sprint rather than the immediate fix pass.
const STRICT_TIER_PREFIXES = ['PS'];

const isStrictTierFile = (file: string): boolean =>
  STRICT_TIER_PREFIXES.some((prefix) => {
    const base = file.replace(/_Practice\.json$/i, '');
    return new RegExp(`^${prefix}\\d+$`).test(base);
  });

interface PracticeSetFile {
  topic?: string;
  metadata?: { moduleId?: string };
  tasks?: PracticeTask[];
}

const trimmedLength = (value: string | null | undefined) =>
  typeof value === 'string' ? value.trim().length : 0;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isCodeTask = (task: PracticeTask): boolean =>
  CODE_TASK_TYPES.has(task.type) || Boolean(task.starterScaffold) || Boolean(task.scaffold);

const requiresEvidence = (task: PracticeTask): boolean => {
  if (isCodeTask(task)) return false;
  if (!EVIDENCE_REQUIRED_TYPES.has(task.type)) return false;
  // Self-contained context exemption: when description.context is rich
  // (>= 250 chars), the task usually doesn't need a separate evidence block.
  return trimmedLength(task.description?.context) < 250;
};

const collectCorrectValues = (field: TemplateField): string[] => {
  const raw =
    typeof field.correctAnswer === 'string'
      ? [field.correctAnswer]
      : typeof field.correctAnswer === 'number'
        ? [String(field.correctAnswer)]
        : Array.isArray(field.correctAnswer)
          ? (field.correctAnswer as unknown[]).map((v) => String(v))
          : isNonEmptyString(field.correct)
            ? [field.correct]
            : [];
  return raw.map((v) => v.trim()).filter((v) => v.length > 0);
};

const computeLengthBiasRatio = (
  field: TemplateField,
  correctValues: string[]
): number | null => {
  if (field.type !== 'single_select' && field.type !== 'multi_select') return null;
  const options = (field.options ?? []).map((o) => o.trim()).filter(Boolean);
  if (options.length < 3) return null;
  if (correctValues.length === 0) return null;

  const correctSet = new Set(correctValues.map((c) => c.toLowerCase()));
  const correctLens: number[] = [];
  const distractorLens: number[] = [];
  for (const option of options) {
    if (correctSet.has(option.toLowerCase())) correctLens.push(option.length);
    else distractorLens.push(option.length);
  }
  if (correctLens.length === 0 || distractorLens.length === 0) return null;

  const avgCorrect = correctLens.reduce((s, n) => s + n, 0) / correctLens.length;
  const avgDistractor = distractorLens.reduce((s, n) => s + n, 0) / distractorLens.length;
  if (avgDistractor <= 0) return null;
  return avgCorrect / avgDistractor;
};

const validateField = (
  file: string,
  taskId: string,
  field: TemplateField,
  issues: PracticeContentIssue[]
): void => {
  // 1. Missing correctAnswer on MCQ field.
  const correctValues = collectCorrectValues(field);
  if (
    (field.type === 'single_select' || field.type === 'multi_select') &&
    correctValues.length === 0
  ) {
    issues.push({
      file,
      taskId,
      fieldId: field.id,
      category: 'missing_correct_answer',
      severity: 'error',
      detail: `${field.type} field has no correctAnswer set`
    });
  }

  // 2. Length bias (single_select/multi_select only).
  const ratio = computeLengthBiasRatio(field, correctValues);
  if (ratio !== null) {
    if (ratio >= LENGTH_BIAS_STRICT_RATIO) {
      issues.push({
        file,
        taskId,
        fieldId: field.id,
        category: 'length_bias_strict',
        // Only PS (Junior gateway) blocks CI. Other tiers flagged for
        // follow-up rewrites.
        severity: isStrictTierFile(file) ? 'error' : 'warning',
        detail: `correct/distractor length ratio ${ratio.toFixed(2)}× (limit ${LENGTH_BIAS_STRICT_RATIO}×)`
      });
    } else if (ratio >= LENGTH_BIAS_WARNING_RATIO) {
      issues.push({
        file,
        taskId,
        fieldId: field.id,
        category: 'length_bias_warning',
        severity: 'warning',
        detail: `correct/distractor length ratio ${ratio.toFixed(2)}× (warning ${LENGTH_BIAS_WARNING_RATIO}×)`
      });
    }
  }

  // 3. Rationale length cap.
  if (typeof field.rationale === 'string' && field.rationale.length > RATIONALE_CHAR_CAP) {
    issues.push({
      file,
      taskId,
      fieldId: field.id,
      category: 'rationale_too_long',
      severity: 'error',
      detail: `${field.rationale.length} chars (cap ${RATIONALE_CHAR_CAP})`
    });
  }
  if (
    typeof field.distractorRationale === 'string' &&
    field.distractorRationale.length > RATIONALE_CHAR_CAP
  ) {
    issues.push({
      file,
      taskId,
      fieldId: field.id,
      category: 'distractor_rationale_too_long',
      severity: 'error',
      detail: `${field.distractorRationale.length} chars (cap ${RATIONALE_CHAR_CAP})`
    });
  }

  // 4. Duplicate options (rare but breaks the cheat-check: if "correct"
  //    string also appears as a distractor, students see two identical
  //    options — they'll mistrust both).
  const options = field.options ?? [];
  const seen = new Set<string>();
  for (const option of options) {
    const normalized = option.trim().toLowerCase();
    if (seen.has(normalized) && normalized.length > 0) {
      issues.push({
        file,
        taskId,
        fieldId: field.id,
        category: 'duplicate_option',
        severity: 'error',
        detail: `option "${option}" repeats`
      });
      break;
    }
    seen.add(normalized);
  }
};

// A task is considered an "unauthored stub" when description.task is empty
// AND its single MCQ field has empty label + empty options + empty
// correctAnswer. This pattern shows up in batch-templated FND files where
// authoring hasn't filled in the question. Collapsing all the per-field
// errors into one warning keeps the validator actionable for finished
// content while still surfacing the unfinished sets in a single line.
const isUnauthoredStub = (task: PracticeTask): boolean => {
  if (trimmedLength(task.description?.task) >= MIN_TASK_CHARS) return false;
  const fields = task.template?.fields ?? [];
  if (fields.length === 0) return false;
  return fields.every(
    (f) =>
      trimmedLength(f.label) === 0 &&
      (f.options ?? []).length === 0 &&
      collectCorrectValues(f).length === 0
  );
};

const validateTask = (
  file: string,
  task: PracticeTask,
  issues: PracticeContentIssue[]
): void => {
  // Stub detection — collapse every per-field error into one warning. The
  // module is unshippable until authored, but it doesn't block CI for the
  // rest of the library.
  if (isUnauthoredStub(task)) {
    issues.push({
      file,
      taskId: task.id,
      fieldId: null,
      category: 'unauthored_task',
      severity: 'warning',
      detail: 'task has empty description.task, label, options, and correctAnswer — needs authoring'
    });
    return;
  }

  // 1. Missing context.
  if (trimmedLength(task.description?.context) < MIN_CONTEXT_CHARS) {
    issues.push({
      file,
      taskId: task.id,
      fieldId: null,
      category: 'missing_context',
      severity: 'error',
      detail: `description.context is ${trimmedLength(task.description?.context)} chars (min ${MIN_CONTEXT_CHARS})`
    });
  }

  // 2. Missing task statement.
  if (trimmedLength(task.description?.task) < MIN_TASK_CHARS) {
    issues.push({
      file,
      taskId: task.id,
      fieldId: null,
      category: 'missing_task',
      severity: 'error',
      detail: `description.task is ${trimmedLength(task.description?.task)} chars (min ${MIN_TASK_CHARS})`
    });
  }

  // 3. Empty template.fields AND not a code task.
  const fields = task.template?.fields ?? [];
  if (fields.length === 0 && !isCodeTask(task)) {
    issues.push({
      file,
      taskId: task.id,
      fieldId: null,
      category: 'no_template_fields',
      severity: 'error',
      detail: `task has no MCQ fields and no code-task scaffold`
    });
  }

  // 4. Missing evidence for types that need it.
  if (requiresEvidence(task) && !task.evidence) {
    issues.push({
      file,
      taskId: task.id,
      fieldId: null,
      category: 'missing_evidence',
      severity: 'error',
      detail: `task type "${task.type}" expects an evidence block but has none`
    });
  }

  // 5. Per-field checks.
  for (const field of fields) {
    validateField(file, task.id, field, issues);
  }
};

/**
 * Scan every practice-set JSON under data/operations/practice-sets/pyspark.
 * Returns structured issues with severity; tests assert no `severity: 'error'`
 * entries. Warnings are surfaced for visibility but do not fail builds.
 */
export const validatePracticeContent = (): PracticeContentIssue[] => {
  const issues: PracticeContentIssue[] = [];

  let files: string[];
  try {
    files = fs.readdirSync(PRACTICE_DIR).filter((name) => name.endsWith('.json'));
  } catch (error) {
    issues.push({
      file: '(directory)',
      taskId: '(n/a)',
      fieldId: null,
      category: 'missing_context',
      severity: 'error',
      detail: `Could not read practice-set directory: ${error instanceof Error ? error.message : error}`
    });
    return issues;
  }

  for (const file of files) {
    let parsed: PracticeSetFile;
    try {
      const raw = fs.readFileSync(nodePath.join(PRACTICE_DIR, file), 'utf8');
      parsed = JSON.parse(raw) as PracticeSetFile;
    } catch (error) {
      issues.push({
        file,
        taskId: '(parse)',
        fieldId: null,
        category: 'missing_context',
        severity: 'error',
        detail: `JSON parse failed: ${error instanceof Error ? error.message : error}`
      });
      continue;
    }

    for (const task of parsed.tasks ?? []) {
      validateTask(file, task, issues);
    }
  }

  return issues;
};

export const formatPracticeIssues = (issues: PracticeContentIssue[]): string => {
  if (issues.length === 0) return 'No practice content issues.';
  return issues
    .map((i) => `[${i.severity}] ${i.file} ${i.taskId}${i.fieldId ? `/${i.fieldId}` : ''} :: ${i.category} — ${i.detail}`)
    .join('\n');
};
