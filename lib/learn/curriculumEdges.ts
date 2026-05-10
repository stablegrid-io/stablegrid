/**
 * Curriculum graph edges — `chapter id → ids of lower-tier chapters this one
 * extends`. Authoring convention:
 *
 *   - Mid chapters list a Junior parent.
 *   - Senior chapters list a Mid parent.
 *
 * Edges live here (not in the published chapter JSONs) so the curriculum
 * graph stays hand-curated even as theory content is regenerated, and so
 * the renderer can fall back gracefully when an edge is missing.
 *
 * Add edges incrementally — chapters without an entry render as standalone
 * nodes in the Capability map, which is fine.
 */
export const CHAPTER_EXTENDS: Record<string, string[]> = {
  // ── Mid (PSI*) extending Junior (PS*) ───────────────────────────────────
  // Joins at mid drill into the shuffle/perf side of the junior join lesson.
  'module-PSI3': ['module-PS7'],
  // SQL/aggregate maturity at mid traces back to the junior aggregations chapter.
  // (Add more PSI→PS edges here as you author them — PSI1, PSI2, PSI8 etc.)

  // ── Senior (PSS*) extending Mid (PSI*) ───────────────────────────────────
  'module-PSS2': ['module-PSI1'], // Catalyst/AQE internals → Execution Plans
  'module-PSS3': ['module-PSI2'], // Partition strategy at scale → Partitioning Strategy
  'module-PSS4': ['module-PSI3'], // Advanced Join Architecture → Join perf & shuffle
  'module-PSS6': ['module-PSI1'], // Spark Internals (engine) → Execution Plans
  'module-PSS9': ['module-PSI10'], // Advanced Streaming → Streaming Foundations
};

/** Public lookup. Empty array when the chapter has no authored parents. */
export function getChapterExtends(chapterId: string): string[] {
  return CHAPTER_EXTENDS[chapterId] ?? [];
}
