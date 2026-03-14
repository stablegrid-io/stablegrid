import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminAnalyticsSection } from '@/components/admin/AdminAnalyticsSection';
import type { AdminAnalyticsSnapshot } from '@/lib/admin/types';

const analyticsSnapshot: AdminAnalyticsSnapshot = {
  generatedAt: '2026-03-14T12:00:00.000Z',
  period: 'monthly',
  periodLabel: 'Last 30 days',
  totalUsers: 1200,
  activeUsers: 648,
  newUsers: 92,
  engagedUsers: 810,
  lessonCompletions: 1432,
  moduleCompletions: 364,
  tasksCompleted: 511,
  taskCompletionRatePct: 62,
  openTasks: 304,
  activeSubscriptions: 286,
  sales: 37,
  metrics: [
    {
      id: 'total_users',
      label: 'Total users',
      value: 1200,
      displayValue: '1,200',
      helper: 'All profiles created in the platform.',
      deltaValue: 8.2,
      deltaLabel: 'vs previous 30 days',
      trendValues: [1014, 1045, 1088, 1114, 1148, 1182, 1200]
    },
    {
      id: 'active_users',
      label: 'Active users',
      value: 648,
      displayValue: '648',
      helper: 'Users with meaningful learning activity in the last 30 days.',
      deltaValue: 5.4,
      deltaLabel: 'vs previous 30 days',
      trendValues: [420, 468, 501, 553, 589, 624, 648]
    },
    {
      id: 'active_subscriptions',
      label: 'Subscriptions',
      value: 286,
      displayValue: '286',
      helper: 'Currently active or trialing paid subscriptions.',
      deltaValue: 4.8,
      deltaLabel: 'vs previous 30 days',
      trendValues: [232, 240, 251, 258, 266, 274, 286]
    },
    {
      id: 'sales',
      label: 'Sales',
      value: 37,
      displayValue: '37',
      helper: 'Paid subscription starts in the last 30 days.',
      deltaValue: 12.1,
      deltaLabel: 'vs previous 30 days',
      trendValues: [18, 19, 24, 26, 29, 33, 37]
    },
    {
      id: 'new_users',
      label: 'New users',
      value: 92,
      displayValue: '92',
      helper: 'Fresh signups in the last 30 days.'
    },
    {
      id: 'engaged_users',
      label: 'Engaged users',
      value: 810,
      displayValue: '810',
      helper: 'Users who have ever generated real learning or progress activity.'
    },
    {
      id: 'lesson_completions',
      label: 'Lesson completions',
      value: 1432,
      displayValue: '1,432',
      helper: 'Completed lesson reads in the last 30 days.',
      deltaValue: 9.6,
      deltaLabel: 'vs previous 30 days',
      trendValues: [182, 194, 207, 216, 238, 256, 139]
    },
    {
      id: 'module_completions',
      label: 'Module completions',
      value: 364,
      displayValue: '364',
      helper: 'Completed modules in the last 30 days.'
    },
    {
      id: 'tasks_completed',
      label: 'Tasks completed',
      value: 511,
      displayValue: '511',
      helper: 'Completed activation tasks in the last 30 days.'
    },
    {
      id: 'task_completion_rate',
      label: 'Task completion rate',
      value: 62,
      displayValue: '62%',
      helper: 'Completed activation tasks as a share of all assigned tasks.'
    },
    {
      id: 'open_tasks',
      label: 'Open tasks',
      value: 304,
      displayValue: '304',
      helper: 'Tasks still sitting in todo or in progress.'
    }
  ],
  trend: [
    {
      bucketStart: '2026-02-10T00:00:00.000Z',
      label: 'Week 1',
      newUsers: 16,
      activeUsers: 420,
      lessonCompletions: 182,
      sales: 4
    },
    {
      bucketStart: '2026-02-17T00:00:00.000Z',
      label: 'Week 2',
      newUsers: 18,
      activeUsers: 468,
      lessonCompletions: 194,
      sales: 5
    },
    {
      bucketStart: '2026-02-24T00:00:00.000Z',
      label: 'Week 3',
      newUsers: 21,
      activeUsers: 553,
      lessonCompletions: 216,
      sales: 6
    }
  ],
  topicStats: [
    {
      topic: 'pyspark',
      label: 'PySpark: The Full Stack',
      activeUsers: 280,
      lessonCompletions: 690,
      moduleCompletions: 190
    }
  ],
  decisionTrees: [
    {
      id: 'paid_vs_free',
      title: 'Paid vs Free',
      description: 'See how monetization segments convert into real learning outcomes.',
      windowLabel: 'Last 30 days',
      rootLabel: 'Total users',
      rootCount: 1200,
      rootHelper: 'Entire user base',
      segments: [
        {
          id: 'paid_users',
          label: 'Paid users',
          count: 286,
          sharePct: 24,
          helper: 'Active or trialing paid subscriptions',
          accent: 'teal',
          outcomes: [
            {
              id: 'theory_completion_rate',
              label: 'Theory completion rate',
              ratePct: 74,
              completedUsers: 211,
              totalUsers: 286,
              helper: '211 of 286 paid users completed theory.'
            },
            {
              id: 'task_completion_rate',
              label: 'Task completion rate',
              ratePct: 69,
              completedUsers: 197,
              totalUsers: 286,
              helper: '197 of 286 paid users completed tasks.'
            }
          ]
        },
        {
          id: 'free_users',
          label: 'Free users',
          count: 914,
          sharePct: 76,
          helper: 'Users without an active paid subscription',
          accent: 'blue',
          outcomes: [
            {
              id: 'theory_completion_rate',
              label: 'Theory completion rate',
              ratePct: 34,
              completedUsers: 311,
              totalUsers: 914,
              helper: '311 of 914 free users completed theory.'
            },
            {
              id: 'task_completion_rate',
              label: 'Task completion rate',
              ratePct: 19,
              completedUsers: 174,
              totalUsers: 914,
              helper: '174 of 914 free users completed tasks.'
            }
          ]
        }
      ]
    },
    {
      id: 'active_vs_inactive',
      title: 'Active vs Inactive',
      description: 'Understand how recent engagement separates the user base.',
      windowLabel: 'Last 30 days',
      rootLabel: 'Total users',
      rootCount: 1200,
      rootHelper: 'Entire user base',
      segments: [
        {
          id: 'active_users',
          label: 'Active users',
          count: 648,
          sharePct: 54,
          helper: 'Users active in the last 30 days',
          accent: 'brand',
          outcomes: [
            {
              id: 'theory_completion_rate',
              label: 'Theory completion rate',
              ratePct: 77,
              completedUsers: 499,
              totalUsers: 648,
              helper: '499 of 648 active users completed theory.'
            },
            {
              id: 'task_completion_rate',
              label: 'Task completion rate',
              ratePct: 58,
              completedUsers: 376,
              totalUsers: 648,
              helper: '376 of 648 active users completed tasks.'
            }
          ]
        },
        {
          id: 'inactive_users',
          label: 'Inactive users',
          count: 552,
          sharePct: 46,
          helper: 'No qualifying activity in the last 30 days',
          accent: 'slate',
          outcomes: [
            {
              id: 'theory_completion_rate',
              label: 'Theory completion rate',
              ratePct: 4,
              completedUsers: 23,
              totalUsers: 552,
              helper: '23 of 552 inactive users completed theory.'
            },
            {
              id: 'task_completion_rate',
              label: 'Task completion rate',
              ratePct: 2,
              completedUsers: 12,
              totalUsers: 552,
              helper: '12 of 552 inactive users completed tasks.'
            }
          ]
        }
      ]
    }
  ]
};

describe('AdminAnalyticsSection', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ data: analyticsSnapshot })
      }))
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders the decision map and switches trees from the selector tabs', async () => {
    render(<AdminAnalyticsSection onMutation={() => {}} />);

    expect(await screen.findByRole('heading', { name: 'Paid vs Free' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Paid vs Free' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByText('Paid users').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Free users').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('tab', { name: 'Active vs Inactive' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Active vs Inactive' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Active vs Inactive' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    expect(screen.getAllByText('Active users').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Inactive users').length).toBeGreaterThan(0);
  });
});
