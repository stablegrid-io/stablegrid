import type {
  FeedbackAnalyticsSnapshot,
  FeedbackChartDatum,
  FeedbackDateRange,
  FeedbackFilters,
  FeedbackRecord,
  FeedbackSentiment,
  FeedbackSortOption,
  FeedbackStatus,
  FeedbackStatusDatum
} from '@/components/admin/feedback/types';

const DAY_MS = 24 * 60 * 60 * 1000;

const SENTIMENT_COLORS: Record<FeedbackSentiment, string> = {
  Positive: '#8ed8bf',
  Neutral: '#8da8a0',
  Negative: '#f2a7a0'
};

const STATUS_ORDER: FeedbackStatus[] = ['Submitted', 'Reviewed', 'Resolved', 'Ignored'];
const SENTIMENT_ORDER: Record<FeedbackSentiment, number> = {
  Negative: 0,
  Neutral: 1,
  Positive: 2
};

const toDate = (value: string) => new Date(value);

const toUtcStartOfDay = (date: Date) =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const startOfUtcMonth = (date: Date) =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);

const clampPercent = (value: number) => (Number.isFinite(value) ? Math.round(value) : 0);

const formatDayLabel = (timestamp: number) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(timestamp);

const formatMonthLabel = (timestamp: number) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(timestamp);

const getRangeStart = (referenceDate: Date, dateRange: FeedbackDateRange) => {
  const referenceStart = toUtcStartOfDay(referenceDate);

  if (dateRange === '7d') {
    return referenceStart - 6 * DAY_MS;
  }

  if (dateRange === '30d') {
    return referenceStart - 29 * DAY_MS;
  }

  if (dateRange === '90d') {
    return referenceStart - 89 * DAY_MS;
  }

  return Number.NEGATIVE_INFINITY;
};

const buildCountEntries = (
  records: FeedbackRecord[],
  selectValue: (record: FeedbackRecord) => string
) => {
  const counts = new Map<string, number>();

  records.forEach((record) => {
    const value = selectValue(record);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts.entries()).sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
  );
};

const buildKeywordEntries = (records: FeedbackRecord[]) => {
  const counts = new Map<string, number>();

  records.forEach((record) => {
    record.keywords.forEach((keyword) => {
      counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries()).sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
  );
};

const buildTrend = (
  records: FeedbackRecord[],
  dateRange: FeedbackDateRange,
  referenceDate: Date
) => {
  if (dateRange === 'all') {
    const earliestRecord = records.reduce<FeedbackRecord | null>((earliest, record) => {
      if (!earliest) {
        return record;
      }

      return toDate(record.submittedAt).getTime() < toDate(earliest.submittedAt).getTime()
        ? record
        : earliest;
    }, null);
    const rangeStart = startOfUtcMonth(
      toDate(earliestRecord?.submittedAt ?? referenceDate.toISOString())
    );
    const rangeEnd = startOfUtcMonth(referenceDate);
    const counts = new Map<number, number>();

    records.forEach((record) => {
      const timestamp = startOfUtcMonth(toDate(record.submittedAt));
      counts.set(timestamp, (counts.get(timestamp) ?? 0) + 1);
    });

    const buckets: Array<{ label: string; total: number }> = [];
    for (let cursor = rangeStart; cursor <= rangeEnd; ) {
      buckets.push({
        label: formatMonthLabel(cursor),
        total: counts.get(cursor) ?? 0
      });

      const date = new Date(cursor);
      cursor = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
    }

    return buckets;
  }

  if (dateRange === '7d') {
    const rangeStart = getRangeStart(referenceDate, dateRange);
    const counts = new Map<number, number>();

    records.forEach((record) => {
      const timestamp = toUtcStartOfDay(toDate(record.submittedAt));
      counts.set(timestamp, (counts.get(timestamp) ?? 0) + 1);
    });

    return Array.from({ length: 7 }, (_, index) => {
      const timestamp = rangeStart + index * DAY_MS;
      return {
        label: formatDayLabel(timestamp),
        total: counts.get(timestamp) ?? 0
      };
    });
  }

  const rangeStart = getRangeStart(referenceDate, dateRange);
  const bucketCount = dateRange === '30d' ? 5 : 7;
  const spanDays = dateRange === '30d' ? 30 : 90;
  const bucketSizeDays = Math.ceil(spanDays / bucketCount);

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = rangeStart + index * bucketSizeDays * DAY_MS;
    const bucketEnd = bucketStart + bucketSizeDays * DAY_MS;
    const total = records.filter((record) => {
      const timestamp = toDate(record.submittedAt).getTime();
      return timestamp >= bucketStart && timestamp < bucketEnd;
    }).length;

    return {
      label: formatDayLabel(bucketStart),
      total
    };
  });
};

const buildStatusBreakdown = (records: FeedbackRecord[]): FeedbackStatusDatum[] => {
  const total = records.length || 1;
  return STATUS_ORDER.map((status) => {
    const value = records.filter((record) => record.status === status).length;
    return {
      label: status,
      value,
      percent: clampPercent((value / total) * 100)
    };
  });
};

const buildRatingBreakdown = (records: FeedbackRecord[]): FeedbackChartDatum[] =>
  [1, 2, 3, 4, 5].map((rating) => ({
    label: `${rating} star${rating === 1 ? '' : 's'}`,
    value: records.filter((record) => record.rating === rating).length
  }));

const buildSentiments = (records: FeedbackRecord[]) => {
  const total = records.length || 1;
  return (['Positive', 'Neutral', 'Negative'] as const).map((sentiment) => {
    const value = records.filter((record) => record.sentiment === sentiment).length;
    return {
      label: sentiment,
      value,
      color: SENTIMENT_COLORS[sentiment],
      percent: clampPercent((value / total) * 100)
    };
  });
};

const buildCategories = (records: FeedbackRecord[]) =>
  buildCountEntries(records, (record) => record.category)
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));

const buildKeywords = (records: FeedbackRecord[]) =>
  buildKeywordEntries(records)
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));

const getTopCategory = (records: FeedbackRecord[]) =>
  buildCountEntries(records, (record) => record.category)[0];

const getTopKeyword = (records: FeedbackRecord[]) => buildKeywordEntries(records)[0];

const getTopModule = (records: FeedbackRecord[]) => {
  const ratings = new Map<string, { total: number; count: number }>();

  records.forEach((record) => {
    const current = ratings.get(record.module) ?? { total: 0, count: 0 };
    ratings.set(record.module, {
      total: current.total + record.rating,
      count: current.count + 1
    });
  });

  return Array.from(ratings.entries())
    .map(([module, stats]) => ({
      module,
      average: stats.total / stats.count,
      count: stats.count
    }))
    .filter((entry) => entry.count >= 1)
    .sort((left, right) => right.average - left.average || right.count - left.count)[0];
};

const getNegativeSentimentInsight = (records: FeedbackRecord[]) => {
  if (records.length < 4) {
    return null;
  }

  const sorted = [...records].sort(
    (left, right) =>
      toDate(left.submittedAt).getTime() - toDate(right.submittedAt).getTime()
  );
  const midpoint = Math.floor(sorted.length / 2);
  const earlier = sorted.slice(0, midpoint);
  const latest = sorted.slice(midpoint);

  const earlierNegative = earlier.filter(
    (record) => record.sentiment === 'Negative'
  ).length;
  const latestNegative = latest.filter(
    (record) => record.sentiment === 'Negative'
  ).length;
  const earlierRate = earlier.length === 0 ? 0 : (earlierNegative / earlier.length) * 100;
  const latestRate = latest.length === 0 ? 0 : (latestNegative / latest.length) * 100;
  const delta = Math.round(latestRate - earlierRate);

  const negativeKeywords = buildKeywordEntries(
    latest.filter((record) => record.sentiment === 'Negative')
  );
  const leadingKeyword = negativeKeywords[0]?.[0];

  if (delta > 0) {
    return {
      title: 'Negative sentiment is trending upward',
      detail: leadingKeyword
        ? `The latest period is up ${delta} points versus the prior one, with ${leadingKeyword} mentioned most often.`
        : `The latest period is up ${delta} points versus the prior one.`
    };
  }

  if (delta < 0) {
    return {
      title: 'Negative sentiment has softened',
      detail: `The latest period is down ${Math.abs(delta)} points versus the prior one.`
    };
  }

  return {
    title: 'Negative sentiment is holding steady',
    detail:
      'The latest feedback cycle is landing at roughly the same negative share as the prior one.'
  };
};

export const formatFeedbackDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC'
  }).format(toDate(value));

export const formatFeedbackDateShort = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(toDate(value));

export const filterFeedbackRecords = (
  records: FeedbackRecord[],
  filters: FeedbackFilters,
  query: string,
  referenceDate: Date
) => {
  const normalizedQuery = query.trim().toLowerCase();
  const rangeStart = getRangeStart(referenceDate, filters.dateRange);

  return records.filter((record) => {
    const submittedAt = toDate(record.submittedAt).getTime();

    if (submittedAt < rangeStart) {
      return false;
    }

    if (filters.type !== 'All' && record.type !== filters.type) {
      return false;
    }

    if (filters.category !== 'All' && record.category !== filters.category) {
      return false;
    }

    if (filters.status !== 'All' && record.status !== filters.status) {
      return false;
    }

    if (filters.module !== 'All' && record.module !== filters.module) {
      return false;
    }

    if (filters.rating === '5' && record.rating !== 5) {
      return false;
    }

    if (filters.rating === '4plus' && record.rating < 4) {
      return false;
    }

    if (filters.rating === '3minus' && record.rating > 3) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [
      record.userName,
      record.userEmail,
      record.category,
      record.module,
      record.preview,
      record.message,
      record.linkedPage,
      record.keywords.join(' ')
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
  });
};

export const sortFeedbackRecords = (
  records: FeedbackRecord[],
  sort: FeedbackSortOption
) => {
  const sorted = [...records];

  sorted.sort((left, right) => {
    if (sort === 'newest') {
      return toDate(right.submittedAt).getTime() - toDate(left.submittedAt).getTime();
    }

    if (sort === 'oldest') {
      return toDate(left.submittedAt).getTime() - toDate(right.submittedAt).getTime();
    }

    if (sort === 'rating_high') {
      return (
        right.rating - left.rating ||
        SENTIMENT_ORDER[right.sentiment] - SENTIMENT_ORDER[left.sentiment]
      );
    }

    return (
      left.rating - right.rating ||
      SENTIMENT_ORDER[left.sentiment] - SENTIMENT_ORDER[right.sentiment]
    );
  });

  return sorted;
};

export const paginateFeedback = (
  records: FeedbackRecord[],
  page: number,
  rowsPerPage: number
) => records.slice((page - 1) * rowsPerPage, page * rowsPerPage);

export const buildFeedbackAnalytics = (
  records: FeedbackRecord[],
  dateRange: FeedbackDateRange,
  referenceDate: Date
): FeedbackAnalyticsSnapshot => {
  const total = records.length;
  const averageRating =
    total === 0 ? 0 : records.reduce((sum, record) => sum + record.rating, 0) / total;
  const positiveCount = records.filter(
    (record) => record.sentiment === 'Positive'
  ).length;
  const negativeCount = records.filter(
    (record) => record.sentiment === 'Negative'
  ).length;
  const unresolvedCount = records.filter(
    (record) => record.status === 'Submitted' || record.status === 'Reviewed'
  ).length;
  const topCategory = getTopCategory(records);
  const topModule = getTopModule(records);
  const topKeyword = getTopKeyword(records);
  const negativeSentimentInsight = getNegativeSentimentInsight(records);

  const metrics = [
    {
      label: 'Total feedback received',
      value: `${total}`,
      hint:
        dateRange === 'all' ? 'Across the full archive' : 'Inside the active date range'
    },
    {
      label: 'Average rating',
      value: total === 0 ? '--' : `${averageRating.toFixed(1)}/5`,
      hint: total === 0 ? 'No ratings available' : 'Blended user satisfaction'
    },
    {
      label: 'Positive sentiment %',
      value: total === 0 ? '--' : `${clampPercent((positiveCount / total) * 100)}%`,
      hint: 'Signals delight and confidence'
    },
    {
      label: 'Negative sentiment %',
      value: total === 0 ? '--' : `${clampPercent((negativeCount / total) * 100)}%`,
      hint: 'Watch for regressions and friction'
    },
    {
      label: 'Open issues',
      value: `${unresolvedCount}`,
      hint:
        unresolvedCount === 0 ? 'Nothing pending right now' : 'Submitted or under review'
    },
    {
      label: 'Most mentioned category',
      value: topCategory?.[0] ?? '--',
      hint: topCategory
        ? `${topCategory[1]} mentions in the current view`
        : 'No category signal yet'
    }
  ];

  const insights = [
    topCategory
      ? {
          title: `Most feedback is clustered around ${topCategory[0]}`,
          detail: `${topCategory[1]} submissions mention this category, making it the clearest signal in the current view.`
        }
      : {
          title: 'No dominant category yet',
          detail: 'A broader date range will surface stronger theme clustering.'
        },
    negativeSentimentInsight ?? {
      title: 'Sentiment trend needs more signal',
      detail: 'Widen the date range to compare changes over time with more confidence.'
    },
    topModule
      ? {
          title: `${topModule.module} is the strongest-rated area`,
          detail: `It is averaging ${topModule.average.toFixed(1)}/5 across ${topModule.count} pieces of feedback.`
        }
      : {
          title: 'No module has enough signal',
          detail: 'Module-level quality signals will appear once more feedback comes in.'
        },
    topKeyword
      ? {
          title: `${topKeyword[0]} is the most recurring keyword`,
          detail: `It appears in ${topKeyword[1]} submissions and is worth tracking as a durable theme.`
        }
      : {
          title: 'No recurring keyword cluster',
          detail: 'There is not enough repeated language to form a keyword cluster yet.'
        }
  ].slice(0, 4);

  return {
    metrics,
    trend: buildTrend(records, dateRange, referenceDate),
    sentiments: buildSentiments(records),
    ratings: buildRatingBreakdown(records),
    categories: buildCategories(records),
    keywords: buildKeywords(records),
    statuses: buildStatusBreakdown(records),
    insights
  };
};

export const getSentimentBadgeClass = (sentiment: FeedbackRecord['sentiment']) => {
  if (sentiment === 'Positive') {
    return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100';
  }

  if (sentiment === 'Negative') {
    return 'border-rose-400/20 bg-rose-400/10 text-rose-100';
  }

  return 'border-white/12 bg-white/[0.05] text-[#d6e1dc]';
};

export const getStatusBadgeClass = (status: FeedbackRecord['status']) => {
  if (status === 'Resolved') {
    return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100';
  }

  if (status === 'Ignored') {
    return 'border-white/12 bg-white/[0.04] text-[#9fb0a8]';
  }

  if (status === 'Reviewed') {
    return 'border-amber-300/20 bg-amber-300/10 text-amber-100';
  }

  return 'border-brand-400/25 bg-brand-500/10 text-[#d7f6ec]';
};

export const getTypeBadgeClass = (type: FeedbackRecord['type']) => {
  if (type === 'Praise') {
    return 'border-emerald-400/18 bg-emerald-400/8 text-emerald-100';
  }

  if (type === 'Issue') {
    return 'border-rose-400/18 bg-rose-400/8 text-rose-100';
  }

  return 'border-white/12 bg-white/[0.05] text-[#d6e1dc]';
};
