// Single-topic catalog. Retained as a list (rather than a singleton constant)
// so existing iteration code in the landing page and SEO surfaces continues to
// work without per-callsite refactors.

export interface LandingTopic {
  /** URL slug — kept for backwards-compat, but no /topics/[slug] route exists. */
  slug: string;
  /** Topic id used to look up theoryDocs (and lib/learn keys). */
  topicId: string;
  name: string;
  icon: string;
  category: string;
  catRgb: string;
  description: string;
  levels: {
    junior: string;
    mid: string;
    senior: string;
  };
  progressPct: number;
  whyItMatters: string;
  realWorldUsers: readonly string[];
  outcome: string;
}

export const LANDING_TOPICS: readonly LandingTopic[] = [
  {
    slug: 'pyspark',
    topicId: 'pyspark',
    name: 'PySpark',
    icon: '/brand/pyspark-track-star.svg',
    category: 'Processing',
    catRgb: '170,120,255',
    description:
      'Distributed data engineering with Spark — partitions, the Catalyst optimizer, and lakehouse patterns that actually scale.',
    levels: {
      junior: 'DataFrames, transformations, joins, basics',
      mid: 'Window functions, partitioning, UDFs, broadcast',
      senior: 'Catalyst, AQE, skew handling, production tuning',
    },
    progressPct: 0,
    whyItMatters:
      'When the data outgrows a laptop, the answer is Spark. Netflix processes viewing telemetry, Uber computes trip economics, Shopify rolls up merchant analytics — all on PySpark. Understanding partitions, the Catalyst optimizer, AQE, and skew handling is what separates engineers who can run distributed jobs from engineers who can architect them. As data volumes climb and ML training pipelines scale, distributed-data fluency commands top compensation.',
    realWorldUsers: ['Netflix', 'Uber', 'Shopify', 'LinkedIn'],
    outcome:
      'Build, tune, and debug distributed Spark pipelines that scale to petabytes.',
  },
];

export const getLandingTopicBySlug = (slug: string): LandingTopic | null =>
  LANDING_TOPICS.find((t) => t.slug === slug) ?? null;
