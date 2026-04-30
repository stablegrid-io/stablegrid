/**
 * Mapping of practice TOPIC + TIER → which concrete practice set powers that
 * cell.
 *
 * Topics live on /practice/coding (e.g. Aggregations, Joins, Window Functions).
 * Each topic has up to three tiers (junior, mid, senior). When a tier has no
 * entry here, the tier card on /practice/coding/[topic] renders as
 * "Coming Soon".
 *
 * The link target is built as `/operations/practice/${language}/${tier}/${practiceSetId}`,
 * matching the existing PracticeSetSession route. Task titles + IDs are
 * resolved from the practice set itself via getPracticeSet, so they stay in
 * sync with the source-of-truth JSON without a parallel config to maintain.
 */

export type PracticeTier = 'junior' | 'mid' | 'senior';

export interface PracticeTopicTierEntry {
  language: 'pyspark' | 'python' | 'sql';
  /**
   * The module prefix matching `metadata.moduleId = "module-${practiceSetId}"`
   * in the practice-set JSON. Used for both the runtime route and the
   * getPracticeSet lookup.
   */
  practiceSetId: string;
}

export type PracticeTopicTierMap = Partial<Record<PracticeTier, PracticeTopicTierEntry>>;

export const PRACTICE_TOPIC_TIER_MAP: Record<string, PracticeTopicTierMap> = {
  aggregations: {
    junior: {
      language: 'pyspark',
      practiceSetId: 'PSPJ1',
    },
  },
};

export function getPracticeTopicTiers(topicId: string): PracticeTopicTierMap {
  return PRACTICE_TOPIC_TIER_MAP[topicId] ?? {};
}

export function getPracticeTopicLanguages(
  topicId: string,
): PracticeTopicTierEntry['language'][] {
  const tiers = getPracticeTopicTiers(topicId);
  const seen = new Set<PracticeTopicTierEntry['language']>();
  for (const entry of Object.values(tiers)) {
    if (entry) seen.add(entry.language);
  }
  return Array.from(seen);
}
