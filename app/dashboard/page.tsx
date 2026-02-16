'use client';

import Link from 'next/link';
import { useState } from 'react';
import { format } from 'date-fns';
import { Play, Target, Trophy, TrendingUp, Zap } from 'lucide-react';
import {
  type DashboardPeriod,
  useDashboardData
} from '@/lib/hooks/useDashboardData';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { SessionSummary } from '@/components/dashboard/SessionSummary';
import { TopicBreakdown } from '@/components/dashboard/TopicBreakdown';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { formatUnitsAsKwh } from '@/lib/energy';

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 'all', label: 'All Period' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' }
];

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('all');
  const {
    stats,
    topics,
    activityData,
    hasLifetimeProgress
  } = useDashboardData(period);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 pb-16 pt-8 dark:bg-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
              Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex flex-wrap gap-1 rounded-lg border border-light-border bg-light-surface p-1 dark:border-dark-border dark:bg-dark-surface">
              {periodOptions.map((option) => {
                const active = period === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setPeriod(option.value)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-brand-500 text-white'
                        : 'text-text-light-secondary hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:text-text-dark-primary'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <Link href="/flashcards" className="btn btn-primary text-sm">
              <Play className="h-3.5 w-3.5" />
              Start Practice
            </Link>
          </div>
        </header>

        {!hasLifetimeProgress ? (
          <EmptyState />
        ) : (
          <>
            {stats.totalXP === 0 && stats.totalQuestions < 5 && (
              <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
                <Zap className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-500" />
                <div>
                  <p className="text-sm font-medium text-brand-900 dark:text-brand-100">
                    Your journey starts here
                  </p>
                    <p className="mt-0.5 text-xs text-brand-700 dark:text-brand-300">
                    Complete your first practice session to start generating energy and tracking
                    progress.
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label={period === 'all' ? 'Energy Balance' : 'Energy In Period'}
                value={formatUnitsAsKwh(stats.totalXP)}
                icon={Zap}
                accentColor="brand"
                description="kWh generated across all sessions"
              />
              <StatCard
                label="Current Streak"
                value={`${stats.currentStreak} days`}
                icon={Trophy}
                accentColor="warning"
                description="Consecutive correct answers"
              />
              <StatCard
                label="Questions Completed"
                value={stats.totalQuestions}
                icon={Target}
                accentColor="success"
                description="Unique questions solved"
              />
              <StatCard
                label="Overall Accuracy"
                value={`${stats.overallAccuracy}%`}
                icon={TrendingUp}
                accentColor="violet"
                description="Correct answers ratio"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <ActivityChart activityData={activityData} />
              </div>
              <div className="lg:col-span-2">
                <SessionSummary stats={stats} activityData={activityData} period={period} />
              </div>
            </div>

            <TopicBreakdown topics={topics} />
          </>
        )}
      </div>
    </main>
  );
}
