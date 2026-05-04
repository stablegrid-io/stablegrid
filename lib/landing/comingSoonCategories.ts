/**
 * Per-category data for the "Coming Soon" practice landing pages —
 * /practice/computer-science/landing, /practice/logic/landing,
 * /practice/math-statistics/landing.
 *
 * Each landing page reads one of these entries via `getComingSoonCategory`.
 * Keep the planned topics small and concrete; the goal of the page is to
 * set the vision before the first track ships, not to overpromise.
 */

export type ComingSoonCategoryId =
  | 'computer-science'
  | 'logic'
  | 'math-statistics';

export interface PlannedTopic {
  name: string;
  description: string;
}

export interface ComingSoonCategory {
  id: ComingSoonCategoryId;
  /** Card title — "Computer Science", "Logic", "Math & Statistics" */
  name: string;
  /** Short pill text — "Foundations", "Reasoning", "Quant" */
  category: string;
  /** Eyebrow above the hero — "Practice · Computer Science" */
  eyebrow: string;
  /** Hero headline first line */
  headlineLine1: string;
  /** Hero headline second line, rendered in muted color */
  headlineLine2: string;
  /** Hero subtitle paragraph */
  tagline: string;
  /** Banner image — same files PracticeHub uses */
  image: string;
  /** RGB string for the accent color */
  accentRgb: string;
  /** Compact subtopic chip line (under the title) */
  subtopicLine: string;
  /** "Why this discipline" lead sentence (bold/large) */
  whyLead: string;
  /** Why paragraph (longer body text) */
  whyBody: string;
  /** Planned topics that will land first */
  plannedTopics: PlannedTopic[];
}

const CATEGORIES: Record<ComingSoonCategoryId, ComingSoonCategory> = {
  'computer-science': {
    id: 'computer-science',
    name: 'Computer Science',
    category: 'Foundations',
    eyebrow: 'Practice · Computer Science',
    headlineLine1: 'The layer under the framework.',
    headlineLine2: 'Drilled until it is yours.',
    tagline:
      'Data structures, algorithms, complexity, distributed systems, concurrency, memory, networking. The foundations under every pipeline you ship — coming to the catalogue soon.',
    image: '/brand/practice-cs.png',
    accentRgb: '34,197,94',
    subtopicLine: 'Algorithms · Systems · Data Structures',
    whyLead:
      'When something OOMs at 3am, the engineer who fixes it knows the layer below the framework.',
    whyBody:
      "Every Spark executor, every pandas chunk, every Airflow scheduler is sitting on top of the same primitives — heaps, hash tables, B-trees, lock contention, page faults, network round-trips. You can write production data code without that mental model and it will work, until it does not. Computer Science drills the reflex for the moment it does not — so the right diagnosis is the first one you reach for.",
    plannedTopics: [
      {
        name: 'Data Structures',
        description:
          'Arrays, hash tables, trees, graphs, heaps — when each one is the right tool, and what they cost in memory and time.',
      },
      {
        name: 'Algorithms',
        description:
          'Search, sort, traversal, dynamic programming, greedy patterns. Recognise the shape, pick the strategy, justify the cost.',
      },
      {
        name: 'Complexity',
        description:
          'Big-O for time and space, amortised analysis, when worst-case dominates, when average-case does.',
      },
      {
        name: 'Distributed Systems',
        description:
          'Consistency models, partition tolerance, consensus, the patterns Spark and Kafka stand on top of.',
      },
      {
        name: 'Concurrency',
        description:
          'Threads, locks, async, the race conditions that show up in every production system once.',
      },
      {
        name: 'Memory & Storage',
        description:
          'Cache hierarchies, page tables, columnar layouts. Why one query is 100× faster than the same query rewritten.',
      },
    ],
  },
  logic: {
    id: 'logic',
    name: 'Logic',
    category: 'Reasoning',
    eyebrow: 'Practice · Logic',
    headlineLine1: 'Reason like a query planner.',
    headlineLine2: 'Predicate. Set. Pattern.',
    tagline:
      'Predicate logic, set reasoning, pattern recognition, structural deduction. The thinking muscle behind every join, every filter, every assertion you write — coming to the catalogue soon.',
    image: '/brand/practice-logic.png',
    accentRgb: '191,129,255',
    subtopicLine: 'Predicate · Set · Pattern · Structural',
    whyLead:
      'Every join is a predicate. Every aggregate is a set operation. Logic drills the reflex behind the SQL and Spark you write.',
    whyBody:
      'Engineers who reason cleanly write transforms that hold up under change — they spot the missing edge case, the implicit NULL, the subtle off-by-one — before the data lands in production. Logic is the primitive layer below SQL itself, the layer Catalyst itself reasons in. Drill it until your filters and joins read like proofs.',
    plannedTopics: [
      {
        name: 'Predicate Logic',
        description:
          'Quantifiers, implication, negation. Read a SQL WHERE clause as a predicate and rewrite it without breaking the truth table.',
      },
      {
        name: 'Set Reasoning',
        description:
          'Union, intersection, difference, set comprehensions. The lens behind every GROUP BY and DISTINCT.',
      },
      {
        name: 'Pattern Recognition',
        description:
          'Sequence puzzles, structural pattern matching, the inductive leaps senior engineers make on cold-read code.',
      },
      {
        name: 'Structural Deduction',
        description:
          'Tree and DAG reasoning, dependency tracing, the reasoning that powers every plan-reading drill.',
      },
    ],
  },
  'math-statistics': {
    id: 'math-statistics',
    name: 'Math & Statistics',
    category: 'Quant',
    eyebrow: 'Practice · Math & Statistics',
    headlineLine1: 'The math under the metrics.',
    headlineLine2: 'Drilled until it is second nature.',
    tagline:
      'Descriptive stats, distributions, sampling, regression, time series, big-data math. Statistical reasoning for data engineers — coming to the catalogue soon.',
    image: '/brand/practice-math.png',
    accentRgb: '255,201,101',
    subtopicLine: 'Distributions · Sampling · Regression · Time Series',
    whyLead:
      'When the dashboard says P95 latency is rising, the engineer who can think in distributions ships the right fix.',
    whyBody:
      "Most data work is a thin shell around statistics. Aggregations are estimators, A/B tests are inference, time-series alerts are change-point detection — and the engineers who quietly ship the right thresholds are the ones who can see the math through the metric. Math &amp; Statistics drills the reflex so the math stops being an afterthought.",
    plannedTopics: [
      {
        name: 'Descriptive Stats',
        description:
          'Mean, median, mode, percentiles, variance — when each one lies and which one to ship.',
      },
      {
        name: 'Distributions',
        description:
          'Normal, log-normal, Poisson, power law. Recognise the shape from the histogram before the test fires.',
      },
      {
        name: 'Sampling & Inference',
        description:
          'Confidence intervals, hypothesis tests, multiple-comparison corrections. The math behind A/B testing done right.',
      },
      {
        name: 'Regression',
        description:
          'Linear, logistic, regularised. When a model is the right tool and when it is overkill.',
      },
      {
        name: 'Time Series',
        description:
          'Trend, seasonality, change-point detection, autocorrelation. Reading the signal in production telemetry.',
      },
      {
        name: 'Big-Data Math',
        description:
          'HyperLogLog, Bloom filters, reservoir sampling, sketch algorithms — the math distributed systems run on.',
      },
    ],
  },
};

export function getComingSoonCategory(
  id: ComingSoonCategoryId,
): ComingSoonCategory {
  return CATEGORIES[id];
}
