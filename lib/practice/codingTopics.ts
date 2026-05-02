import {
  GraduationCap,
  Filter,
  BarChart3,
  Link2,
  LineChart,
  Gauge,
  Database,
  Workflow,
  ShieldCheck,
  Network,
  FileSearch,
  Cpu,
  Layers,
  Radio,
} from 'lucide-react';
import type { Topic } from '@/components/practice/PracticeTopicSelectorPage';

/**
 * Single source of truth for the Coding Practice topic catalog.
 *
 * Topics carry a `languages` field that scopes which language gallery
 * surfaces them. Generic topics (Window Functions, Aggregations) live
 * across PySpark / Python / SQL. PySpark-specific topics — Plan Reading,
 * Memory & Skew, Storage Layout, Streaming — only appear on the PySpark
 * gallery, since none of them translate cleanly to Pandas or vanilla
 * SQL. Likewise Foundations / Data Manipulation are scoped to the tools
 * where they actually teach something new (PySpark assumes Python is
 * already known, so it doesn't surface Foundations).
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
    languages: ['python', 'sql'],
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
    languages: ['pyspark', 'python', 'sql'],
  },
  {
    id: 'joins',
    title: 'Joins',
    description: 'Inner, outer, semi, anti — combining datasets without losing rows.',
    icon: Link2,
    accentRgb: ACCENT,
    category: 'Analysis',
    comingSoon: true,
    languages: ['python', 'sql'],
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
    id: 'optimization',
    title: 'Optimization',
    description: 'Query plans, indexes, caching, partitioning — make slow code fast.',
    icon: Gauge,
    accentRgb: ACCENT,
    category: 'Performance',
    comingSoon: true,
    languages: ['python', 'sql'],
  },
  {
    id: 'plan-reading-tuning',
    title: 'Plan Reading & Tuning',
    description: 'Read df.explain() output, recognize Catalyst rule firing, interpret AQE annotations at runtime.',
    icon: FileSearch,
    accentRgb: ACCENT,
    category: 'Performance',
    comingSoon: true,
    languages: ['pyspark'],
  },
  {
    id: 'memory-skew',
    title: 'Memory & Skew',
    description: 'Executor sizing, OOM patterns, fetch-failure cascades, and skewed-key strategies.',
    icon: Cpu,
    accentRgb: ACCENT,
    category: 'Performance',
    comingSoon: true,
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

  /* ── Engineering / Quality (Python / SQL) ───────────────────────────── */
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
    id: 'etl-pipelines',
    title: 'ETL & Pipelines',
    description: 'Extract, transform, load — orchestrate reliable, idempotent pipelines.',
    icon: Workflow,
    accentRgb: ACCENT,
    category: 'Engineering',
    comingSoon: true,
    languages: ['python'],
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
