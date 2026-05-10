import type {
  AdminFeedbackRecord,
  AdminFeedbackSentiment,
  AdminFeedbackStatus,
  AdminFeedbackType
} from '@/lib/admin/types';

export type FeedbackRecord = AdminFeedbackRecord;
export type FeedbackSentiment = AdminFeedbackSentiment;
export type FeedbackType = AdminFeedbackType;
export type FeedbackStatus = AdminFeedbackStatus;
export type FeedbackCategory = string;
export type FeedbackModule = string;
export type FeedbackDateRange = '7d' | '30d' | '90d' | 'all';
export type FeedbackSourceFilter =
  | 'all'
  | 'module_feedback'
  | 'track_feedback'
  | 'practice_set_feedback';
export type FeedbackRatingFilter = 'all' | '5' | '4plus' | '3minus';
export type FeedbackSortOption = 'newest' | 'oldest' | 'rating_high' | 'rating_low';

export interface FeedbackFilters {
  dateRange: FeedbackDateRange;
  /** Replaces the old "Issue / Feature Request / Praise / Usability"
      filter. Now scopes the table to a single rating source — Theory
      module, Theory track, or Practice set — since /admin/feedback no
      longer surfaces bugs or product-funnel events. */
  source: FeedbackSourceFilter;
  /** Kept for back-compat with stored filter state — no longer rendered. */
  type: 'All' | FeedbackType;
  rating: FeedbackRatingFilter;
  category: 'All' | FeedbackCategory;
  status: 'All' | FeedbackStatus;
  module: 'All' | FeedbackModule;
}

export interface FeedbackMetric {
  label: string;
  value: string;
  hint: string;
}

export interface FeedbackInsight {
  title: string;
  detail: string;
}

export interface FeedbackChartDatum {
  label: string;
  value: number;
}

export interface FeedbackStatusDatum extends FeedbackChartDatum {
  percent: number;
}

export interface FeedbackSentimentDatum extends FeedbackChartDatum {
  color: string;
  percent: number;
}

export interface FeedbackAnalyticsSnapshot {
  metrics: FeedbackMetric[];
  trend: Array<{ label: string; total: number }>;
  sentiments: FeedbackSentimentDatum[];
  ratings: FeedbackChartDatum[];
  categories: FeedbackChartDatum[];
  keywords: FeedbackChartDatum[];
  statuses: FeedbackStatusDatum[];
  insights: FeedbackInsight[];
}

export const FEEDBACK_DATE_RANGE_OPTIONS: Array<{
  value: FeedbackDateRange;
  label: string;
}> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' }
];

export const FEEDBACK_TYPE_OPTIONS: Array<FeedbackFilters['type']> = [
  'All',
  'Issue',
  'Feature Request',
  'Praise',
  'Usability'
];

/** Source filter options for the new Theory/Practice-only admin view. */
export const FEEDBACK_SOURCE_OPTIONS: Array<{
  value: FeedbackSourceFilter;
  label: string;
}> = [
  { value: 'all', label: 'All sources' },
  { value: 'module_feedback', label: 'Theory · module' },
  { value: 'track_feedback', label: 'Theory · track' },
  { value: 'practice_set_feedback', label: 'Practice set' },
];

export const FEEDBACK_RATING_OPTIONS: Array<{
  value: FeedbackRatingFilter;
  label: string;
}> = [
  { value: 'all', label: 'All ratings' },
  { value: '5', label: '5 stars' },
  { value: '4plus', label: '4 stars and up' },
  { value: '3minus', label: '3 stars and below' }
];

export const FEEDBACK_STATUS_OPTIONS: Array<FeedbackFilters['status']> = [
  'All',
  'Submitted',
  'Reviewed',
  'Resolved',
  'Ignored'
];

export const FEEDBACK_SORT_OPTIONS: Array<{ value: FeedbackSortOption; label: string }> =
  [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'rating_high', label: 'Highest rating' },
    { value: 'rating_low', label: 'Lowest rating' }
  ];

export const DEFAULT_FEEDBACK_FILTERS: FeedbackFilters = {
  dateRange: '30d',
  source: 'all',
  type: 'All',
  rating: 'all',
  category: 'All',
  status: 'All',
  module: 'All'
};
