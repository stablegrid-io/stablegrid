import { Star, Code2, Database } from 'lucide-react';
import type { Topic } from '@/components/practice/PracticeTopicSelectorPage';

/**
 * Language picker shown at /practice/coding. Each tile drills down to
 * /practice/coding/[language] which renders the topic gallery scoped to
 * that language.
 *
 * The same `Topic` shape powers PracticeTopicSelectorPage so the cards
 * inherit the existing visual language (icon + accent + category pill +
 * CTA pill) without bespoke styling.
 */
export type CodingLanguageId = 'pyspark' | 'python' | 'sql';

export const CODING_LANGUAGES: Topic[] = [
  {
    id: 'pyspark',
    title: 'PySpark',
    description:
      'Distributed data engineering — DataFrames, aggregations, window functions, and Spark SQL on industrial datasets.',
    icon: Star,
    accentRgb: '255,140,80',
    category: 'Distributed',
    comingSoon: false,
    ctaLabel: 'Choose topic',
  },
  {
    id: 'python',
    title: 'Python',
    description:
      'Pandas, NumPy, and core Python — the data scientist toolkit you reach for before scaling out.',
    icon: Code2,
    accentRgb: '99,201,255',
    category: 'Tabular',
    comingSoon: false,
    ctaLabel: 'Choose topic',
  },
  {
    id: 'sql',
    title: 'SQL',
    description:
      'Set-based thinking — joins, aggregates, CTEs, and window functions in the language every database speaks.',
    icon: Database,
    accentRgb: '180,160,255',
    category: 'Declarative',
    comingSoon: true,
  },
];

export const getCodingLanguage = (id: string) =>
  CODING_LANGUAGES.find((l) => l.id === id);

export const isCodingLanguage = (id: string): id is CodingLanguageId =>
  CODING_LANGUAGES.some((l) => l.id === id);
