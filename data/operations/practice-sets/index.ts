import ps1PracticeData from './pyspark/PS1_Practice.json';
import ps2PracticeData from './pyspark/PS2_Practice.json';
import ps3PracticeData from './pyspark/PS3_Practice.json';
import ps4PracticeData from './pyspark/PS4_Practice.json';
import ps5PracticeData from './pyspark/PS5_Practice.json';
import ps6PracticeData from './pyspark/PS6_Practice.json';
import ps7PracticeData from './pyspark/PS7_Practice.json';
import ps8PracticeData from './pyspark/PS8_Practice.json';
import ps9PracticeData from './pyspark/PS9_Practice.json';
import ps10PracticeData from './pyspark/PS10_Practice.json';
import pm1PracticeData from './pyspark/PM1_Practice.json';
import pm2PracticeData from './pyspark/PM2_Practice.json';
import pm3PracticeData from './pyspark/PM3_Practice.json';
import pm4PracticeData from './pyspark/PM4_Practice.json';
import pm5PracticeData from './pyspark/PM5_Practice.json';
import pm6PracticeData from './pyspark/PM6_Practice.json';
import pm7PracticeData from './pyspark/PM7_Practice.json';
import pm8PracticeData from './pyspark/PM8_Practice.json';
import pm9PracticeData from './pyspark/PM9_Practice.json';
import pm10PracticeData from './pyspark/PM10_Practice.json';
import px1PracticeData from './pyspark/PX1_Practice.json';
import px2PracticeData from './pyspark/PX2_Practice.json';
import px3PracticeData from './pyspark/PX3_Practice.json';
import px4PracticeData from './pyspark/PX4_Practice.json';
import px5PracticeData from './pyspark/PX5_Practice.json';
import px6PracticeData from './pyspark/PX6_Practice.json';
import px7PracticeData from './pyspark/PX7_Practice.json';
import px8PracticeData from './pyspark/PX8_Practice.json';
import px9PracticeData from './pyspark/PX9_Practice.json';
import px10PracticeData from './pyspark/PX10_Practice.json';
import f1PracticeData from './fabric/F1_Practice.json';
import f2PracticeData from './fabric/F2_Practice.json';
import f3PracticeData from './fabric/F3_Practice.json';
import f4PracticeData from './fabric/F4_Practice.json';
import f5PracticeData from './fabric/F5_Practice.json';
import f6PracticeData from './fabric/F6_Practice.json';
import f7PracticeData from './fabric/F7_Practice.json';
import f8PracticeData from './fabric/F8_Practice.json';
import f9PracticeData from './fabric/F9_Practice.json';
import f10PracticeData from './fabric/F10_Practice.json';
import fi1PracticeData from './fabric/FI1_Practice.json';
import fi2PracticeData from './fabric/FI2_Practice.json';
import fi3PracticeData from './fabric/FI3_Practice.json';
import fi4PracticeData from './fabric/FI4_Practice.json';
import fi5PracticeData from './fabric/FI5_Practice.json';
import fi6PracticeData from './fabric/FI6_Practice.json';
import fi7PracticeData from './fabric/FI7_Practice.json';
import fi8PracticeData from './fabric/FI8_Practice.json';
import fi9PracticeData from './fabric/FI9_Practice.json';
import fi10PracticeData from './fabric/FI10_Practice.json';
import fs1PracticeData from './fabric/FS1_Practice.json';
import fs2PracticeData from './fabric/FS2_Practice.json';
import fs3PracticeData from './fabric/FS3_Practice.json';
import fs4PracticeData from './fabric/FS4_Practice.json';
import fs5PracticeData from './fabric/FS5_Practice.json';
import fs6PracticeData from './fabric/FS6_Practice.json';
import fs7PracticeData from './fabric/FS7_Practice.json';
import fs8PracticeData from './fabric/FS8_Practice.json';
import fs9PracticeData from './fabric/FS9_Practice.json';
import fs10PracticeData from './fabric/FS10_Practice.json';

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

export interface StarterScaffold {
  language: string;
  content: string;
}

export interface CodeAssertion {
  id: string;
  description: string;
  check: string;
}

export interface ExpectedOutput {
  pattern: string;
  notes?: string;
}

export interface PracticeTaskHint {
  tier: string;
  xp_cost: number;
  unlock_condition?: string;
  text: string;
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
  starterScaffold?: StarterScaffold;
  expectedOutput?: ExpectedOutput;
  assertions?: CodeAssertion[];
  partialCredit?: boolean;
  grading?: Record<string, unknown>;
  synthesisNotes?: Record<string, unknown>;
  hints?: PracticeTaskHint[];
  setupCode?: string;
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

export interface PracticeSetDataset {
  id: string;
  file: string;
  description?: string;
  schema?: Record<string, unknown>;
  usedByTasks?: string[];
}

export interface PracticeSet {
  topic: string;
  title: string;
  description: string;
  version: string;
  metadata: PracticeSetMetadata;
  datasets?: PracticeSetDataset[];
  tasks: PracticeTask[];
}

// ── Registry ───────────────────────────────────────────────────────────────────

const ALL_PRACTICE_SETS: PracticeSet[] = [
  ps1PracticeData as unknown as PracticeSet,
  ps2PracticeData as unknown as PracticeSet,
  ps3PracticeData as unknown as PracticeSet,
  ps4PracticeData as unknown as PracticeSet,
  ps5PracticeData as unknown as PracticeSet,
  ps6PracticeData as unknown as PracticeSet,
  ps7PracticeData as unknown as PracticeSet,
  ps8PracticeData as unknown as PracticeSet,
  ps9PracticeData as unknown as PracticeSet,
  ps10PracticeData as unknown as PracticeSet,
  pm1PracticeData as unknown as PracticeSet,
  pm2PracticeData as unknown as PracticeSet,
  pm3PracticeData as unknown as PracticeSet,
  pm4PracticeData as unknown as PracticeSet,
  pm5PracticeData as unknown as PracticeSet,
  pm6PracticeData as unknown as PracticeSet,
  pm7PracticeData as unknown as PracticeSet,
  pm8PracticeData as unknown as PracticeSet,
  pm9PracticeData as unknown as PracticeSet,
  pm10PracticeData as unknown as PracticeSet,
  px1PracticeData as unknown as PracticeSet,
  px2PracticeData as unknown as PracticeSet,
  px3PracticeData as unknown as PracticeSet,
  px4PracticeData as unknown as PracticeSet,
  px5PracticeData as unknown as PracticeSet,
  px6PracticeData as unknown as PracticeSet,
  px7PracticeData as unknown as PracticeSet,
  px8PracticeData as unknown as PracticeSet,
  px9PracticeData as unknown as PracticeSet,
  px10PracticeData as unknown as PracticeSet,
  f1PracticeData as unknown as PracticeSet,
  f2PracticeData as unknown as PracticeSet,
  f3PracticeData as unknown as PracticeSet,
  f4PracticeData as unknown as PracticeSet,
  f5PracticeData as unknown as PracticeSet,
  f6PracticeData as unknown as PracticeSet,
  f7PracticeData as unknown as PracticeSet,
  f8PracticeData as unknown as PracticeSet,
  f9PracticeData as unknown as PracticeSet,
  f10PracticeData as unknown as PracticeSet,
  fi1PracticeData as unknown as PracticeSet,
  fi2PracticeData as unknown as PracticeSet,
  fi3PracticeData as unknown as PracticeSet,
  fi4PracticeData as unknown as PracticeSet,
  fi5PracticeData as unknown as PracticeSet,
  fi6PracticeData as unknown as PracticeSet,
  fi7PracticeData as unknown as PracticeSet,
  fi8PracticeData as unknown as PracticeSet,
  fi9PracticeData as unknown as PracticeSet,
  fi10PracticeData as unknown as PracticeSet,
  fs1PracticeData as unknown as PracticeSet,
  fs2PracticeData as unknown as PracticeSet,
  fs3PracticeData as unknown as PracticeSet,
  fs4PracticeData as unknown as PracticeSet,
  fs5PracticeData as unknown as PracticeSet,
  fs6PracticeData as unknown as PracticeSet,
  fs7PracticeData as unknown as PracticeSet,
  fs8PracticeData as unknown as PracticeSet,
  fs9PracticeData as unknown as PracticeSet,
  fs10PracticeData as unknown as PracticeSet,
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
