'use client';

import { AlertCircle, TrendingDown, TrendingUp, Zap } from 'lucide-react';

interface Insights {
  weakTopic?: string;
  weakAccuracy?: number;
  strongTopic?: string;
  strongAccuracy?: number;
  needsMorePractice: boolean;
  streakAtRisk: boolean;
}

interface InsightsPanelProps {
  insights: Insights;
}

export const InsightsPanel = ({ insights }: InsightsPanelProps) => {
  const hasInsights =
    insights.weakTopic ||
    insights.strongTopic ||
    insights.needsMorePractice ||
    insights.streakAtRisk;

  if (!hasInsights) {
    return null;
  }

  return (
    <div className="card p-6">
      <h3 className="mb-4 text-lg font-semibold">Insights & Recommendations</h3>
      <div className="space-y-3">
        {insights.weakTopic && (
          <div className="flex items-start gap-3 rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/10">
            <TrendingDown className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning-600 dark:text-warning-400" />
            <div>
              <div className="mb-1 font-medium text-warning-900 dark:text-warning-100">
                Focus on {insights.weakTopic.toUpperCase()}
              </div>
              <div className="text-sm text-warning-700 dark:text-warning-300">
                Your accuracy is {insights.weakAccuracy}%. Practice more to improve.
              </div>
            </div>
          </div>
        )}

        {insights.strongTopic && (
          <div className="flex items-start gap-3 rounded-lg border border-success-200 bg-success-50 p-4 dark:border-success-800 dark:bg-success-900/10">
            <TrendingUp className="mt-0.5 h-5 w-5 flex-shrink-0 text-success-600 dark:text-success-400" />
            <div>
              <div className="mb-1 font-medium text-success-900 dark:text-success-100">
                Excelling at {insights.strongTopic.toUpperCase()}
              </div>
              <div className="text-sm text-success-700 dark:text-success-300">
                Great work! {insights.strongAccuracy}% accuracy.
              </div>
            </div>
          </div>
        )}

        {insights.needsMorePractice && (
          <div className="flex items-start gap-3 rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/10">
            <Zap className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600 dark:text-brand-400" />
            <div>
              <div className="mb-1 font-medium text-brand-900 dark:text-brand-100">
                Keep Building Momentum
              </div>
              <div className="text-sm text-brand-700 dark:text-brand-300">
                Practice 50+ questions to establish strong foundations.
              </div>
            </div>
          </div>
        )}

        {insights.streakAtRisk && (
          <div className="flex items-start gap-3 rounded-lg border border-error-200 bg-error-50 p-4 dark:border-error-800 dark:bg-error-900/10">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-error-600 dark:text-error-400" />
            <div>
              <div className="mb-1 font-medium text-error-900 dark:text-error-100">
                Don&apos;t Break Your Streak
              </div>
              <div className="text-sm text-error-700 dark:text-error-300">
                Practice at least one question today to keep your streak alive.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
