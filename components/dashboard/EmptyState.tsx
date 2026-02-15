'use client';

import { useRouter } from 'next/navigation';
import { Target } from 'lucide-react';

export const EmptyState = () => {
  const router = useRouter();

  return (
    <div className="card p-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/20">
        <Target className="h-8 w-8 text-brand-500" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">Start Your Journey</h3>
      <p className="mx-auto mb-6 max-w-md text-text-light-secondary dark:text-text-dark-secondary">
        Complete your first practice session to see your progress and insights here.
      </p>
      <button
        onClick={() => router.push('/practice/setup')}
        className="btn btn-primary"
        type="button"
      >
        Start Practicing
      </button>
    </div>
  );
};
