'use client';

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
} from 'lucide-react';
import { PracticeTopicSelectorPage, type Topic } from './PracticeTopicSelectorPage';

const ACCENT = '153,247,255';

const TOPICS: Topic[] = [
  {
    id: 'fundamentals',
    title: 'Fundamentals',
    description: 'Types, control flow, functions, and the building blocks every analyst leans on.',
    icon: GraduationCap,
    accentRgb: ACCENT,
    category: 'Foundations',
    comingSoon: true,
  },
  {
    id: 'data-manipulation',
    title: 'Data Manipulation',
    description: 'Filter, sort, reshape, cast, and clean tabular data with confidence.',
    icon: Filter,
    accentRgb: ACCENT,
    category: 'Foundations',
    comingSoon: true,
  },
  {
    id: 'aggregations',
    title: 'Aggregations',
    description: 'Group by, summary statistics, pivots — turn raw rows into answers.',
    icon: BarChart3,
    accentRgb: ACCENT,
    category: 'Analysis',
    comingSoon: true,
  },
  {
    id: 'joins',
    title: 'Joins',
    description: 'Inner, outer, semi, anti — combining datasets without losing rows.',
    icon: Link2,
    accentRgb: ACCENT,
    category: 'Analysis',
    comingSoon: true,
  },
  {
    id: 'window-functions',
    title: 'Window Functions',
    description: 'Ranking, lag/lead, rolling aggregates, and partitioned analytics.',
    icon: LineChart,
    accentRgb: ACCENT,
    category: 'Analysis',
    comingSoon: true,
  },
  {
    id: 'optimization',
    title: 'Optimization',
    description: 'Query plans, indexes, caching, partitioning — make slow code fast.',
    icon: Gauge,
    accentRgb: ACCENT,
    category: 'Performance',
    comingSoon: true,
  },
  {
    id: 'data-modeling',
    title: 'Data Modeling',
    description: 'Schema design, normalization, star and snowflake patterns.',
    icon: Database,
    accentRgb: ACCENT,
    category: 'Engineering',
    comingSoon: true,
  },
  {
    id: 'etl-pipelines',
    title: 'ETL & Pipelines',
    description: 'Extract, transform, load — orchestrate reliable, idempotent pipelines.',
    icon: Workflow,
    accentRgb: ACCENT,
    category: 'Engineering',
    comingSoon: true,
  },
  {
    id: 'data-quality',
    title: 'Data Quality',
    description: 'Validation, deduplication, anomaly detection, and trust by design.',
    icon: ShieldCheck,
    accentRgb: ACCENT,
    category: 'Quality',
    comingSoon: true,
  },
];

export function CodingLanguageSelector() {
  return (
    <PracticeTopicSelectorPage
      title="Coding Practice"
      subtitle="Choose a topic and drill the skills data engineers and analysts use every day."
      topics={TOPICS}
      hrefPrefix="/practice/coding"
    />
  );
}
