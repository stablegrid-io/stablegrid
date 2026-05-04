import {
  GraduationCap,
  Filter,
  BarChart3,
  Link2,
  LineChart,
  Database,
  ShieldCheck,
  Network,
  FileSearch,
  Cpu,
  Layers,
  Radio,
  Merge,
  Clock,
  Zap,
  FileSpreadsheet,
  Code,
  Indent,
  Activity,
  Braces,
} from 'lucide-react';
import type { Topic } from '@/components/practice/PracticeTopicSelectorPage';

/**
 * Single source of truth for the Coding Practice topic catalog.
 *
 * Topics carry a `languages` field that scopes which language gallery
 * surfaces them. Generic topics (Aggregations) live across all three.
 * PySpark-specific topics (Plan Reading, Memory & Skew, Storage Layout,
 * Streaming, Joins & Shuffles) only surface on PySpark since they don't
 * translate to Pandas or vanilla SQL. Python-flavored topics (Merges &
 * Joins, Rolling & Time-Series, Performance & Vectorization, DataFrame
 * I/O) are pandas-idiomatic reframings of generic concepts. SQL-flavored
 * topics (SELECT Semantics, CTEs & Subqueries, Query Plans & Indexes,
 * JSON & Semi-Structured) are SQL-honest reframings — generic
 * "Optimization" / "Fundamentals" cards drop in favor of these.
 */

const ACCENT = '153,247,255';

export const CODING_TOPICS: Topic[] = [
  /* ── Foundations ─────────────────────────────────────────────────────── */
  {
    id: 'fundamentals',
    title: 'Fundamentals',
    description: 'Types, control flow, functions, and the building blocks every analyst leans on.',
    icon: GraduationCap,
    accentRgb: ACCENT,
    category: 'Foundations',
    comingSoon: true,
    languages: ['python'],
  },
  {
    id: 'select-semantics',
    title: 'SELECT Semantics',
    description: 'Evaluation order, three-valued logic and NULL handling, type coercion, set vs bag — what SELECT actually means.',
    icon: Code,
    accentRgb: ACCENT,
    category: 'Foundations',
    comingSoon: true,
    languages: ['sql'],
  },
  {
    id: 'data-manipulation',
    title: 'Data Manipulation',
    description: 'Filter, sort, reshape, cast, and clean tabular data with confidence.',
    icon: Filter,
    accentRgb: ACCENT,
    category: 'Foundations',
    comingSoon: false,
    languages: ['python'],
  },
  {
    id: 'dataframe-io',
    title: 'DataFrame I/O',
    description: 'read_csv quirks, parquet/JSON variations, encoding traps, chunked reads, schema inference.',
    icon: FileSpreadsheet,
    accentRgb: ACCENT,
    category: 'Foundations',
    comingSoon: true,
    languages: ['python'],
  },
  {
    id: 'json-semi-structured',
    title: 'JSON & Semi-Structured',
    description: 'JSON_VALUE / JSON_QUERY, lateral flattens, nested keys, schema-on-read in Snowflake / BigQuery / Postgres.',
    icon: Braces,
    accentRgb: ACCENT,
    category: 'Foundations',
    comingSoon: true,
    languages: ['sql'],
  },

  /* ── Analysis ───────────────────────────────────────────────────────── */
  {
    id: 'aggregations',
    title: 'Aggregations',
    description: 'Group by, summary statistics, pivots — turn raw rows into answers.',
    icon: BarChart3,
    accentRgb: ACCENT,
    category: 'Analysis',
    comingSoon: false,
    languages: ['pyspark', 'python', 'sql'],
  },
  {
    id: 'window-functions',
    title: 'Window Functions',
    description: 'Ranking, lag/lead, rolling aggregates, and partitioned analytics.',
    icon: LineChart,
    accentRgb: ACCENT,
    category: 'Analysis',
    comingSoon: true,
    languages: ['pyspark', 'sql'],
  },
  {
    id: 'rolling-timeseries',
    title: 'Rolling & Time-Series',
    description: '.rolling, .resample, .shift, datetime indexing, timezone handling — pandas time-series in practice.',
    icon: Clock,
    accentRgb: ACCENT,
    category: 'Analysis',
    comingSoon: true,
    languages: ['python'],
  },
  {
    id: 'joins',
    title: 'Joins',
    description: 'Inner, outer, semi, anti — combining datasets without losing rows.',
    icon: Link2,
    accentRgb: ACCENT,
    category: 'Analysis',
    comingSoon: true,
    languages: ['sql'],
  },
  {
    id: 'ctes-subqueries',
    title: 'CTEs & Subqueries',
    description: 'WITH clauses, recursive CTEs, lateral subqueries, materialization hints — SQL composition the right way.',
    icon: Indent,
    accentRgb: ACCENT,
    category: 'Analysis',
    comingSoon: true,
    languages: ['sql'],
  },
  {
    id: 'merges-joins',
    title: 'Merges & Joins',
    description: 'pandas merge, join, concat — inner/left/right semantics, indicator joins, MultiIndex pitfalls.',
    icon: Merge,
    accentRgb: ACCENT,
    category: 'Analysis',
    comingSoon: true,
    languages: ['python'],
  },
  {
    id: 'joins-shuffles',
    title: 'Joins & Shuffles',
    description: 'Broadcast vs SortMergeJoin, skew handling, shuffle counting — joins as PySpark actually runs them.',
    icon: Network,
    accentRgb: ACCENT,
    category: 'Analysis',
    comingSoon: false,
    languages: ['pyspark'],
  },

  /* ── Performance ────────────────────────────────────────────────────── */
  {
    id: 'query-plans-indexes',
    title: 'Query Plans & Indexes',
    description: 'EXPLAIN ANALYZE, B-tree vs hash vs GIN/GIST, materialized views, partitioning, join order, statistics.',
    icon: Activity,
    accentRgb: ACCENT,
    category: 'Performance',
    comingSoon: true,
    languages: ['sql'],
  },
  {
    id: 'performance-vectorization',
    title: 'Performance & Vectorization',
    description: 'apply vs vectorized, dtype memory footprint, copy-vs-view traps, when to switch to Polars / PyArrow / Dask.',
    icon: Zap,
    accentRgb: ACCENT,
    category: 'Performance',
    comingSoon: true,
    languages: ['python'],
  },
  {
    id: 'plan-reading-tuning',
    title: 'Plan Reading & Tuning',
    description: 'Read df.explain() output, recognize Catalyst rule firing, interpret AQE annotations at runtime.',
    icon: FileSearch,
    accentRgb: ACCENT,
    category: 'Performance',
    comingSoon: false,
    languages: ['pyspark'],
  },
  {
    id: 'memory-skew',
    title: 'Memory & Skew',
    description: 'Executor sizing, OOM patterns, fetch-failure cascades, and skewed-key strategies.',
    icon: Cpu,
    accentRgb: ACCENT,
    category: 'Performance',
    comingSoon: false,
    languages: ['pyspark'],
  },

  /* ── Storage / Streaming (PySpark-specific) ─────────────────────────── */
  {
    id: 'storage-layout',
    title: 'Storage Layout',
    description: 'Partitioning, bucketing, Z-order, and Parquet/Delta layouts that make reads cheap.',
    icon: Layers,
    accentRgb: ACCENT,
    category: 'Storage',
    comingSoon: true,
    languages: ['pyspark'],
  },
  {
    id: 'streaming',
    title: 'Streaming',
    description: 'Structured Streaming, watermarks, exactly-once sinks, state cleanup at scale.',
    icon: Radio,
    accentRgb: ACCENT,
    category: 'Streaming',
    comingSoon: true,
    languages: ['pyspark'],
  },

  /* ── Engineering / Quality (cross-language) ─────────────────────────── */
  {
    id: 'data-modeling',
    title: 'Data Modeling',
    description: 'Schema design, normalization, star and snowflake patterns.',
    icon: Database,
    accentRgb: ACCENT,
    category: 'Engineering',
    comingSoon: true,
    languages: ['sql'],
  },
  {
    id: 'data-quality',
    title: 'Data Quality',
    description: 'Validation, deduplication, anomaly detection, and trust by design.',
    icon: ShieldCheck,
    accentRgb: ACCENT,
    category: 'Quality',
    comingSoon: true,
    languages: ['python', 'sql'],
  },
];

export function getCodingTopic(id: string): Topic | undefined {
  return CODING_TOPICS.find((t) => t.id === id);
}
