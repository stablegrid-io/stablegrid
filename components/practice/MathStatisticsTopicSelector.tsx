'use client';

import {
  Sigma,
  Activity,
  Dices,
  FlaskConical,
  TrendingUp,
  History,
  Shuffle,
  Fingerprint,
  Scale,
} from 'lucide-react';
import { PracticeTopicSelectorPage, type Topic } from './PracticeTopicSelectorPage';

const ACCENT = '255,201,101';

const TOPICS: Topic[] = [
  {
    id: 'descriptive-statistics',
    title: 'Descriptive Statistics',
    description: 'Mean, median, percentiles, std dev, skew & kurtosis — and when each one tells the truth.',
    icon: Sigma,
    accentRgb: ACCENT,
    category: 'Descriptive',
    comingSoon: true,
  },
  {
    id: 'distributions',
    title: 'Distributions',
    description: 'Normal, log-normal, Poisson, uniform, exponential — recognizing them in real data.',
    icon: Activity,
    accentRgb: ACCENT,
    category: 'Descriptive',
    comingSoon: true,
  },
  {
    id: 'probability',
    title: 'Probability',
    description: 'Conditional probability, Bayes, independence, expected value, common pitfalls.',
    icon: Dices,
    accentRgb: ACCENT,
    category: 'Probability',
    comingSoon: true,
  },
  {
    id: 'hypothesis-testing',
    title: 'Hypothesis Testing & A/B',
    description: 't-tests, chi-square, p-values, confidence intervals, power, multiple testing.',
    icon: FlaskConical,
    accentRgb: ACCENT,
    category: 'Inference',
    comingSoon: true,
  },
  {
    id: 'regression-correlation',
    title: 'Regression & Correlation',
    description: 'Linear & logistic regression, R², residuals, confounders, Simpson’s paradox.',
    icon: TrendingUp,
    accentRgb: ACCENT,
    category: 'Inference',
    comingSoon: true,
  },
  {
    id: 'time-series',
    title: 'Time Series',
    description: 'Trend, seasonality, autocorrelation, stationarity, and forecasting fundamentals.',
    icon: History,
    accentRgb: ACCENT,
    category: 'Temporal',
    comingSoon: true,
  },
  {
    id: 'sampling-bootstrapping',
    title: 'Sampling & Bootstrapping',
    description: 'Random, stratified, cluster sampling; sampling bias; resampling for inference.',
    icon: Shuffle,
    accentRgb: ACCENT,
    category: 'Sampling',
    comingSoon: true,
  },
  {
    id: 'approximate-computation',
    title: 'Approximate Computation',
    description: 'HyperLogLog, Bloom filters, T-digest, reservoir sampling — big-data math at scale.',
    icon: Fingerprint,
    accentRgb: ACCENT,
    category: 'Engineering',
    comingSoon: true,
  },
  {
    id: 'numerical-stability',
    title: 'Numerical Stability',
    description: 'Floating-point traps, Welford’s online algorithms, accumulating without losing precision.',
    icon: Scale,
    accentRgb: ACCENT,
    category: 'Engineering',
    comingSoon: true,
  },
];

export function MathStatisticsTopicSelector() {
  return (
    <PracticeTopicSelectorPage
      title="Math & Statistics"
      subtitle="The math that turns rows into decisions — distributions, inference, regression, and the engineering tricks that scale them."
      topics={TOPICS}
      hrefPrefix="/practice/math-statistics"
    />
  );
}
