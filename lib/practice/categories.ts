/**
 * Top-level practice categories — Coding / Logic / Math & Statistics /
 * Computer Science. Mirror what the practice hub at /practice surfaces
 * so the /stats Practice Mastery panel can present the same hierarchy.
 *
 * Topics are mapped to a category via TOPIC_TO_CATEGORY below. The
 * default for any topic that's not explicitly mapped is 'coding' since
 * every current track lives under it; non-coding categories (Logic,
 * Math & Stats, CS) only become populated when their content lands.
 */

export type PracticeCategoryId =
  | 'coding'
  | 'logic'
  | 'math-statistics'
  | 'computer-science';

export interface PracticeCategoryMeta {
  id: PracticeCategoryId;
  title: string;
  accentRgb: string;
  href: string;
}

// Ordered alphabetically by title to match the practice hub at /practice
// — Coding, Computer Science, Logic, Math & Statistics. Keeping the two
// sources in sync avoids the hub and the Practice Mastery panel on /stats
// drifting into different orders.
export const PRACTICE_CATEGORIES: PracticeCategoryMeta[] = [
  { id: 'coding',           title: 'Coding',            accentRgb: '153,247,255', href: '/practice/coding' },
  { id: 'computer-science', title: 'Computer Science',  accentRgb: '34,197,94',   href: '/practice/computer-science' },
  { id: 'logic',            title: 'Logic',             accentRgb: '191,129,255', href: '/practice/logic' },
  { id: 'math-statistics',  title: 'Math & Statistics', accentRgb: '255,201,101', href: '/practice/math-statistics' },
];

/**
 * Topic → top-level category. The keys match PRACTICE_TOPIC_TIER_MAP
 * keys; any topic not listed defaults to 'coding'. Every coding-track
 * topic across the catalog is enumerated so future tier-map entries
 * pick up the right category without requiring a code change here.
 */
export const TOPIC_TO_CATEGORY: Record<string, PracticeCategoryId> = {
  // Foundations
  fundamentals: 'coding',
  'select-semantics': 'coding',
  'data-manipulation': 'coding',
  'dataframe-io': 'coding',
  'json-semi-structured': 'coding',
  // Analysis
  aggregations: 'coding',
  'window-functions': 'coding',
  'rolling-timeseries': 'coding',
  joins: 'coding',
  'ctes-subqueries': 'coding',
  'merges-joins': 'coding',
  // PySpark-specific
  'joins-shuffles': 'coding',
  'plan-reading-tuning': 'coding',
  'memory-skew': 'coding',
  'storage-layout': 'coding',
  streaming: 'coding',
  // Performance
  'query-plans-indexes': 'coding',
  'performance-vectorization': 'coding',
  // Engineering / Quality
  'data-modeling': 'coding',
  'data-quality': 'coding',
};

export const getTopicCategory = (topicId: string): PracticeCategoryId =>
  TOPIC_TO_CATEGORY[topicId] ?? 'coding';

export const getPracticeCategoryMeta = (id: string): PracticeCategoryMeta | undefined =>
  PRACTICE_CATEGORIES.find((c) => c.id === id);
