/**
 * Capability taxonomy — the answer to "what can I actually do?".
 *
 * Each entry is a single concrete skill (verb-led, ≤ 90 chars). Entries are
 * grouped into seven areas across three tiers (Junior / Mid / Senior). A
 * capability is "unlocked" when *any* of its `chapterIds` is read end-to-end,
 * and "drilled" when *any* of its `practiceModuleIds` is fully solved.
 *
 * Areas were chosen to match how operators describe their day-to-day, not the
 * curriculum's chapter ordering — joins, plans, partitions, memory, streaming,
 * schema/reliability, and ops/tuning. A cell can be `null` when the curriculum
 * doesn't cover that area at that tier (e.g. plans aren't introduced until
 * Mid). The renderer treats null cells as visual gaps, not missing-data.
 */

export type CapabilityTier = 'junior' | 'mid' | 'senior';

export type CapabilityAreaId =
  | 'foundations'
  | 'joins'
  | 'aggregations'
  | 'plans'
  | 'partitions_memory'
  | 'streaming'
  | 'schema_ops';

export interface CapabilityArea {
  id: CapabilityAreaId;
  label: string;
  /** One-line summary shown beside the area row. */
  blurb: string;
}

export interface Capability {
  area: CapabilityAreaId;
  tier: CapabilityTier;
  /** Verb-led skill statement, ≤ 90 chars. */
  statement: string;
  /** Chapter ids that unlock this capability — any one is sufficient. */
  chapterIds: string[];
  /** Practice module ids that "drill" the capability — optional. */
  practiceModuleIds?: string[];
}

export const CAPABILITY_AREAS: CapabilityArea[] = [
  {
    id: 'foundations',
    label: 'Foundations',
    blurb: 'Build, read, and reshape DataFrames.',
  },
  {
    id: 'joins',
    label: 'Joins & Shuffles',
    blurb: 'Combine tables without melting the cluster.',
  },
  {
    id: 'aggregations',
    label: 'Aggregations',
    blurb: 'Summarize, group, and roll up.',
  },
  {
    id: 'plans',
    label: 'Plans & Optimization',
    blurb: 'Read what Spark actually decided to do.',
  },
  {
    id: 'partitions_memory',
    label: 'Partitions & Memory',
    blurb: 'Right-size the shuffle and the heap.',
  },
  {
    id: 'streaming',
    label: 'Streaming',
    blurb: 'Run continuous queries that survive restarts.',
  },
  {
    id: 'schema_ops',
    label: 'Schema & Ops',
    blurb: 'Ship pipelines that don’t page you at 3 AM.',
  },
];

export const CAPABILITIES: Capability[] = [
  // ─ Foundations ─────────────────────────────────────────────────────────
  {
    area: 'foundations',
    tier: 'junior',
    statement: 'Build a DataFrame, filter rows, and add derived columns.',
    chapterIds: ['module-PS3', 'module-PS4', 'module-PS5'],
    practiceModuleIds: ['module-FND-MANIPULATION-JUNIOR'],
  },
  {
    area: 'foundations',
    tier: 'mid',
    statement: 'Use built-in functions and Spark SQL fluently in production code.',
    chapterIds: ['module-PSI5'],
    practiceModuleIds: ['module-FND-MANIPULATION-MID'],
  },
  {
    area: 'foundations',
    tier: 'senior',
    statement: 'Reason about cluster topology and design for fault isolation.',
    chapterIds: ['module-PSS1'],
    practiceModuleIds: ['module-FND-MANIPULATION-SENIOR'],
  },

  // ─ Joins & Shuffles ────────────────────────────────────────────────────
  {
    area: 'joins',
    tier: 'junior',
    statement: 'Pick the right join type and avoid the obvious fan-out.',
    chapterIds: ['module-PS7'],
    practiceModuleIds: ['module-FND-JOINS-JUNIOR'],
  },
  {
    area: 'joins',
    tier: 'mid',
    statement: 'Choose broadcast vs shuffle from the physical plan.',
    chapterIds: ['module-PSI3'],
    practiceModuleIds: ['module-FND-JOINS-MID'],
  },
  {
    area: 'joins',
    tier: 'senior',
    statement: 'Design joins for skewed, multi-billion-row tables.',
    chapterIds: ['module-PSS4'],
    practiceModuleIds: ['module-FND-JOINS-SENIOR'],
  },

  // ─ Aggregations ────────────────────────────────────────────────────────
  {
    area: 'aggregations',
    tier: 'junior',
    statement: 'Group, aggregate, and roll up DataFrames.',
    chapterIds: ['module-PS6'],
    practiceModuleIds: ['module-FND-AGGREGATIONS-JUNIOR'],
  },
  {
    area: 'aggregations',
    tier: 'mid',
    statement: 'Use window functions and time-bucket rollups correctly.',
    chapterIds: ['module-PSI5'],
    practiceModuleIds: ['module-FND-AGGREGATIONS-MID'],
  },
  {
    area: 'aggregations',
    tier: 'senior',
    statement: 'Tune large aggregations for skew and partial pushdown.',
    chapterIds: ['module-PSS3'],
    practiceModuleIds: ['module-FND-AGGREGATIONS-SENIOR'],
  },

  // ─ Plans & Optimization ────────────────────────────────────────────────
  {
    area: 'plans',
    tier: 'junior',
    statement: null as unknown as string,
    chapterIds: [],
  },
  {
    area: 'plans',
    tier: 'mid',
    statement: 'Read .explain() output and identify the physical plan.',
    chapterIds: ['module-PSI1'],
    practiceModuleIds: ['module-FND-PLANS-MID'],
  },
  {
    area: 'plans',
    tier: 'senior',
    statement: 'Tune Catalyst & AQE rules for production workloads.',
    chapterIds: ['module-PSS2', 'module-PSS6'],
    practiceModuleIds: ['module-FND-PLANS-SENIOR'],
  },

  // ─ Partitions & Memory ────────────────────────────────────────────────
  {
    area: 'partitions_memory',
    tier: 'junior',
    statement: null as unknown as string,
    chapterIds: [],
  },
  {
    area: 'partitions_memory',
    tier: 'mid',
    statement: 'Right-size partitions and manage executor memory.',
    chapterIds: ['module-PSI2', 'module-PSI8'],
    practiceModuleIds: ['module-FND-MEMORY-MID'],
  },
  {
    area: 'partitions_memory',
    tier: 'senior',
    statement: 'Design partition + storage strategy at platform scale.',
    chapterIds: ['module-PSS3', 'module-PSS7'],
    practiceModuleIds: ['module-FND-MEMORY-SENIOR', 'module-FND-STORAGE-SENIOR'],
  },

  // ─ Streaming ───────────────────────────────────────────────────────────
  {
    area: 'streaming',
    tier: 'junior',
    statement: null as unknown as string,
    chapterIds: [],
  },
  {
    area: 'streaming',
    tier: 'mid',
    statement: 'Build a Structured Streaming query with checkpoints.',
    chapterIds: ['module-PSI10'],
    practiceModuleIds: ['module-FND-STREAMING-MID'],
  },
  {
    area: 'streaming',
    tier: 'senior',
    statement: 'Run stream-stream joins with watermark contracts.',
    chapterIds: ['module-PSS9'],
    practiceModuleIds: ['module-FND-STREAMING-SENIOR'],
  },

  // ─ Schema & Ops ────────────────────────────────────────────────────────
  {
    area: 'schema_ops',
    tier: 'junior',
    statement: 'Read & write CSV, Parquet, and Delta confidently.',
    chapterIds: ['module-PS8'],
    practiceModuleIds: ['module-FND-STORAGE-JUNIOR'],
  },
  {
    area: 'schema_ops',
    tier: 'mid',
    statement: 'Evolve Delta schemas without breaking downstream readers.',
    chapterIds: ['module-PSI4', 'module-PSI6', 'module-PSI7'],
    practiceModuleIds: ['module-FND-STORAGE-MID'],
  },
  {
    area: 'schema_ops',
    tier: 'senior',
    statement: 'Enforce schema registries, data contracts, and capacity plans.',
    chapterIds: ['module-PSS5', 'module-PSS8', 'module-PSS10'],
  },
];
