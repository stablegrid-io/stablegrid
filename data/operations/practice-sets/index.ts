import ps1PracticeData from './pyspark/PS1_Practice.json';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TemplateField {
  id: string;
  label: string;
  type: 'single_select' | 'short_text' | 'multi_select' | 'numeric';
  options?: string[];
  correctAnswer?: string | number;
  correct?: string;
  acceptSynonyms?: string[];
  alsoAccept?: string;
  tolerance?: number;
  rationale?: string;
  distractorRationale?: string;
  conceptsTested?: string[];
}

export interface PracticeTaskDescription {
  context: string;
  task: string;
  validationHint?: string;
}

export interface PracticeTaskEvidence {
  type: string;
  language?: string;
  content: string;
}

export interface PracticeTask {
  id: string;
  title: string;
  type: string;
  estimatedMinutes: number;
  description: PracticeTaskDescription;
  evidence?: PracticeTaskEvidence;
  template?: {
    fields: TemplateField[];
  };
  scaffold?: string;
  grading?: Record<string, unknown>;
  synthesisNotes?: Record<string, unknown>;
}

export interface PracticeSetMetadata {
  moduleId: string;
  trackLevel: string;
  estimatedDurationMinutes: number;
  maximumDurationMinutes: number;
  taskCount: number;
  scenarioCompany: string;
  modulePhase: string;
  taskTypeMix: Record<string, number>;
}

export interface PracticeSet {
  topic: string;
  title: string;
  description: string;
  version: string;
  metadata: PracticeSetMetadata;
  tasks: PracticeTask[];
}

// ── Registry ───────────────────────────────────────────────────────────────────

const ALL_PRACTICE_SETS: PracticeSet[] = [
  ps1PracticeData as unknown as PracticeSet,
];

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Returns all practice sets for a given topic (e.g. "pyspark").
 */
export function getPracticeSets(topic: string): PracticeSet[] {
  return ALL_PRACTICE_SETS.filter(
    (ps) => ps.topic.toLowerCase() === topic.toLowerCase(),
  );
}

/**
 * Returns a single practice set matching the topic and module prefix
 * (e.g. topic="pyspark", modulePrefix="PS1").
 */
export function getPracticeSet(
  topic: string,
  modulePrefix: string,
): PracticeSet | undefined {
  return ALL_PRACTICE_SETS.find(
    (ps) =>
      ps.topic.toLowerCase() === topic.toLowerCase() &&
      ps.metadata.moduleId.toLowerCase() === `module-${modulePrefix}`.toLowerCase(),
  );
}
