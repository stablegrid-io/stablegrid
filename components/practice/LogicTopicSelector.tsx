'use client';

import {
  GitBranch,
  ToggleLeft,
  Combine,
  Regex,
  GitFork,
  Boxes,
} from 'lucide-react';
import { PracticeTopicSelectorPage, type Topic } from './PracticeTopicSelectorPage';

const ACCENT = '191,129,255';

const TOPICS: Topic[] = [
  {
    id: 'conditional-logic',
    title: 'Conditional Logic',
    description: 'CASE/WHEN, IF/ELSE, COALESCE, NULL handling, and reliable fallback values.',
    icon: GitBranch,
    accentRgb: ACCENT,
    category: 'Predicate',
    comingSoon: true,
  },
  {
    id: 'boolean-predicates',
    title: 'Boolean Predicates',
    description: 'Composing AND/OR/NOT, IN/EXISTS, and avoiding NOT EXISTS pitfalls.',
    icon: ToggleLeft,
    accentRgb: ACCENT,
    category: 'Predicate',
    comingSoon: true,
  },
  {
    id: 'set-logic',
    title: 'Set Logic',
    description: 'UNION/INTERSECT/EXCEPT, anti-joins, semi-joins, deduplication semantics.',
    icon: Combine,
    accentRgb: ACCENT,
    category: 'Set Theory',
    comingSoon: true,
  },
  {
    id: 'pattern-matching',
    title: 'Pattern Matching',
    description: 'LIKE, regex, fuzzy matching, and rule-driven classification.',
    icon: Regex,
    accentRgb: ACCENT,
    category: 'Matching',
    comingSoon: true,
  },
  {
    id: 'recursive-hierarchical',
    title: 'Recursive & Hierarchical',
    description: 'Recursive CTEs, parent-child traversal, and graph-like queries.',
    icon: GitFork,
    accentRgb: ACCENT,
    category: 'Structural',
    comingSoon: true,
  },
  {
    id: 'bucketing-categorization',
    title: 'Bucketing & Categorization',
    description: 'Binning, tiering, and decision trees translated to SQL or code.',
    icon: Boxes,
    accentRgb: ACCENT,
    category: 'Structural',
    comingSoon: true,
  },
];

export function LogicTopicSelector() {
  return (
    <PracticeTopicSelectorPage
      title="Logic"
      subtitle="Sharpen the reasoning patterns that power good queries — predicates, sets, recursion, and beyond."
      topics={TOPICS}
      hrefPrefix="/practice/logic"
    />
  );
}
