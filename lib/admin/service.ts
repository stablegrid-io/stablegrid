import 'server-only';
import type {
  ActivationContentType,
  ActivationItemStatus,
  ActivationTaskStatus
} from '@/lib/activation/service';
import {
  ADMIN_CONTENT_TYPES,
  type AdminAnalyticsPeriod,
  type AdminAnalyticsDecisionTree,
  type AdminAnalyticsKpi,
  type AdminAnalyticsSnapshot,
  type AdminAnalyticsTreeAccent,
  type AdminAnalyticsTreeOutcome,
  type AdminAnalyticsTreeSegment,
  type AdminAnalyticsTopicStat,
  type AdminAnalyticsTrendPoint,
  type AdminFinancialsKpi,
  type AdminFinancialsSnapshot,
  type AdminFinancialsTrendPoint,
  type AdminCustomerRecord,
  type AdminBugReportRecord,
  type AdminFeedbackRecord,
  type AdminFeedbackSentiment,
  type AdminFeedbackSourceType,
  type AdminFeedbackStatus,
  type AdminFeedbackType,
  type AdminBugSeverity,
  type AdminBugStatus,
  type AdminBugStatusDb,
  type AdminAuditEntry,
  type AdminCatalogData,
  type AdminContentItemRecord,
  type AdminContentItemUpsertInput,
  type AdminTrackRecord,
  type AdminTrackUpdateInput,
  type AdminUserSearchResult,
  type AdminActivationTaskSnapshot
} from '@/lib/admin/types';

type SupabaseClient = any;

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

interface TrackRow {
  id: string;
  slug: string;
  title: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ContentItemRow {
  id: string;
  track_id: string | null;
  content_type: ActivationContentType;
  source_ref: string;
  title: string;
  sequence_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tracks: {
    slug: string;
    title: string;
  } | null;
}

interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  created_at?: string;
}

interface UserActivityRow {
  user_id: string;
  timestamp: string;
}

interface TopicActivityRow extends UserActivityRow {
  topic: string;
}

interface ModuleProgressAnalyticsRow {
  user_id: string;
  topic: string;
  updated_at: string;
  is_completed: boolean;
  completed_at: string | null;
}

interface ReadingLessonHistoryAnalyticsRow {
  user_id: string;
  topic: string;
  read_at: string;
}

interface SubscriptionAnalyticsRow {
  user_id: string;
  plan: string;
  status: string;
  stripe_sub_id: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskAnalyticsRow {
  user_id: string;
  status: ActivationTaskStatus;
  started_at: string | null;
  completed_at: string | null;
}

interface BugReportRow {
  id: string;
  user_id: string;
  email: string;
  title: string;
  details: string;
  page_url: string | null;
  user_agent: string | null;
  status: AdminBugStatusDb;
  created_at: string;
  updated_at: string;
}

interface ProductFunnelEventRow {
  id: string;
  session_id: string;
  user_id: string | null;
  event_name: string;
  path: string | null;
  metadata: JsonValue;
  occurred_at: string;
  created_at: string;
}

interface FeedbackTriageRow {
  source_type: AdminFeedbackSourceType;
  source_id: string;
  status: 'submitted' | 'reviewed' | 'resolved' | 'ignored';
  admin_notes: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminAuditRow {
  id: string;
  actor_user_id: string;
  target_user_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  before_state: JsonValue;
  after_state: JsonValue;
  created_at: string;
}

interface ActivationTaskAuditRow {
  id: string;
  user_id: string;
  task_type: 'theory' | 'task';
  task_group: 'theory' | 'flashcards' | 'notebooks' | 'missions';
  title: string;
  description: string;
  track_id: string | null;
  scope_type: 'count' | 'all_remaining';
  requested_count: number | null;
  status: ActivationTaskStatus;
  sort_order: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  tracks: {
    slug: string;
    title: string;
  } | null;
  user_activation_task_items: Array<{
    id: string;
    content_item_id: string;
    item_status: ActivationItemStatus;
    started_at: string | null;
    completed_at: string | null;
  }>;
}

const TRACK_SLUGS = new Set(['pyspark', 'fabric', 'airflow']);
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);
const PRO_MONTHLY_PRICE_EUR = 12;
const FINANCIALS_WINDOW_DAYS = 30;
const FINANCIALS_HERO_POINTS = 12;
const REFUND_SUBSCRIPTION_STATUSES = new Set([
  'canceled',
  'cancelled',
  'unpaid',
  'incomplete_expired'
]);
const BUG_STATUS_DB_VALUES: AdminBugStatusDb[] = ['new', 'triaged', 'resolved'];
const FEEDBACK_SOURCE_TYPES: AdminFeedbackSourceType[] = [
  'bug_report',
  'lightbulb_feedback'
];
const FEEDBACK_TRIAGE_DB_VALUES = [
  'submitted',
  'reviewed',
  'resolved',
  'ignored'
] as const;
const LIGHTBULB_EVENT_NAME = 'lightbulb_feedback_submitted';
const BUG_STATUS_LABEL_BY_DB: Record<AdminBugStatusDb, AdminBugStatus> = {
  new: 'New',
  triaged: 'In Review',
  resolved: 'Resolved'
};
const FEEDBACK_STATUS_LABEL_BY_DB: Record<
  (typeof FEEDBACK_TRIAGE_DB_VALUES)[number],
  AdminFeedbackStatus
> = {
  submitted: 'Submitted',
  reviewed: 'Reviewed',
  resolved: 'Resolved',
  ignored: 'Ignored'
};
const FEEDBACK_STATUS_DB_BY_LABEL: Record<
  AdminFeedbackStatus,
  (typeof FEEDBACK_TRIAGE_DB_VALUES)[number]
> = {
  Submitted: 'submitted',
  Reviewed: 'reviewed',
  Resolved: 'resolved',
  Ignored: 'ignored'
};
const BUG_SEVERITY_BY_CATEGORY_LABEL: Record<string, AdminBugSeverity> = {
  'UI / visual glitch': 'Low',
  'Navigation / redirect issue': 'Medium',
  'Data / progress issue': 'High',
  'Performance / slow behavior': 'Medium',
  'Auth / account issue': 'High',
  'Billing / subscription issue': 'High',
  'Crash / error message': 'Critical',
  Other: 'Medium'
};
const BUG_MODULE_BY_AREA_LABEL: Record<string, string> = {
  'Home / Dashboard': 'Dashboard',
  'Learn / Theory': 'Theory',
  Tasks: 'Tasks',
  Missions: 'Missions',
  'Practice / Notebooks': 'Notebooks',
  'Grid Ops / Energy': 'Grid',
  'Settings / Billing': 'Settings',
  'Login / Signup': 'Auth',
  Other: 'Other'
};
const MAX_SESSION_DURATION_SECONDS = 4 * 60 * 60;
const MAX_TASK_DURATION_SECONDS = 6 * 60 * 60;

const ANALYTICS_PERIODS: Record<
  AdminAnalyticsPeriod,
  {
    label: string;
    rangeDays: number | null;
    comparisonDays: number;
    trendBucketDays: number;
    trendBucketCount: number;
    summaryLabel: string;
    comparisonLabel: string;
  }
> = {
  all_time: {
    label: 'All time',
    rangeDays: null,
    comparisonDays: 30,
    trendBucketDays: 30,
    trendBucketCount: 6,
    summaryLabel: 'all time',
    comparisonLabel: 'vs previous 30 days'
  },
  monthly: {
    label: 'Monthly',
    rangeDays: 30,
    comparisonDays: 30,
    trendBucketDays: 7,
    trendBucketCount: 6,
    summaryLabel: 'last 30 days',
    comparisonLabel: 'vs previous 30 days'
  },
  weekly: {
    label: 'Weekly',
    rangeDays: 7,
    comparisonDays: 7,
    trendBucketDays: 1,
    trendBucketCount: 7,
    summaryLabel: 'last 7 days',
    comparisonLabel: 'vs previous 7 days'
  },
  daily: {
    label: 'Daily',
    rangeDays: 1,
    comparisonDays: 1,
    trendBucketDays: 1,
    trendBucketCount: 7,
    summaryLabel: 'today',
    comparisonLabel: 'vs yesterday'
  }
};

export class AdminServiceError extends Error {
  status: number;
  details?: Record<string, unknown>;

  constructor(message: string, status = 400, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const assertSuccess = (error: { message?: string } | null) => {
  if (error) {
    throw new Error(error.message ?? 'Unexpected Supabase error.');
  }
};

const isMissingRelationError = (error: { message?: string } | null) => {
  const message = error?.message?.toLowerCase() ?? '';

  return (
    message.includes('could not find the table') ||
    message.includes('schema cache') ||
    (message.includes('relation') && message.includes('does not exist'))
  );
};

const isAdminContentType = (value: unknown): value is ActivationContentType =>
  typeof value === 'string' &&
  ADMIN_CONTENT_TYPES.includes(value as ActivationContentType);

const normalizeRequiredText = (value: string | undefined, fieldLabel: string) => {
  const normalized = value?.trim();
  if (!normalized) {
    throw new AdminServiceError(`${fieldLabel} is required.`, 422);
  }

  return normalized;
};

const normalizeSequenceOrder = (value: number) => {
  if (!Number.isInteger(value) || value < 1) {
    throw new AdminServiceError('Sequence order must be a positive integer.', 422);
  }

  return value;
};

// Strip characters that are special in LIKE patterns and PostgREST filter grammar
const escapeLikeQuery = (value: string) => value.replace(/[%_,().\\*?[\]{}|^$]/g, '').trim();

const TOPIC_LABELS: Record<string, string> = {
  pyspark: 'PySpark: The Full Stack',
  'pyspark-data-engineering-track': 'PySpark: Data Engineering Track',
  fabric: 'Fabric: End-to-End Platform',
  'fabric-data-engineering-track': 'Fabric: Data Engineering Track',
  'fabric-business-intelligence-track': 'Fabric: Business Intelligence Track',
  airflow: 'Apache Airflow: Beginner Track'
};

const formatWeekLabel = (value: Date) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(value);

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value)}%`;

const formatWholeNumber = (value: number) => new Intl.NumberFormat('en').format(value);
const formatEuro = (value: number) =>
  new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
const formatEuroDetailed = (value: number) =>
  new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);

const formatDurationShort = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0m';
  }

  const wholeSeconds = Math.round(seconds);
  const days = Math.floor(wholeSeconds / 86_400);
  const hours = Math.floor((wholeSeconds % 86_400) / 3_600);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = wholeSeconds % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  if (wholeSeconds >= 3_600) {
    const totalHours = Math.floor(wholeSeconds / 3_600);
    const hourMinutes = Math.floor((wholeSeconds % 3_600) / 60);
    return hourMinutes > 0 ? `${totalHours}h ${hourMinutes}m` : `${totalHours}h`;
  }

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
};

const analyticsPeriodLabel = (value: string) =>
  value === 'today' ? 'Today' : value.charAt(0).toUpperCase() + value.slice(1);

const daysAgoIso = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const startOfUtcDay = (value: string | Date) => {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const buildTrendBuckets = (
  period: AdminAnalyticsPeriod
): Array<AdminAnalyticsTrendPoint & { bucketEnd: string }> => {
  const config = ANALYTICS_PERIODS[period];
  const currentDayStart = startOfUtcDay(new Date());

  return Array.from({ length: config.trendBucketCount }, (_, index) => {
    const bucketStart = new Date(currentDayStart);
    bucketStart.setUTCDate(
      currentDayStart.getUTCDate() -
        (config.trendBucketCount - 1 - index) * config.trendBucketDays
    );

    const bucketEnd = new Date(bucketStart);
    bucketEnd.setUTCDate(bucketStart.getUTCDate() + config.trendBucketDays);

    return {
      bucketStart: bucketStart.toISOString(),
      bucketEnd: bucketEnd.toISOString(),
      label:
        config.trendBucketDays === 1
          ? new Intl.DateTimeFormat('en', { weekday: 'short' }).format(bucketStart)
          : formatWeekLabel(bucketStart),
      newUsers: 0,
      activeUsers: 0,
      lessonCompletions: 0,
      sales: 0
    };
  });
};

const resolveAnalyticsPeriod = (period?: string | null): AdminAnalyticsPeriod => {
  if (!period) {
    return 'monthly';
  }

  return period in ANALYTICS_PERIODS ? (period as AdminAnalyticsPeriod) : 'monthly';
};

const isPaidSubscription = (
  row: Pick<SubscriptionAnalyticsRow, 'plan' | 'stripe_sub_id'>
) =>
  row.plan !== 'free' &&
  typeof row.stripe_sub_id === 'string' &&
  row.stripe_sub_id.length > 0;

const isActivePaidSubscription = (
  row: Pick<SubscriptionAnalyticsRow, 'plan' | 'stripe_sub_id' | 'status'>
) => isPaidSubscription(row) && ACTIVE_SUBSCRIPTION_STATUSES.has(row.status);

const buildInitials = (fullName: string) =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const isBugReportDbStatus = (value: unknown): value is AdminBugStatusDb =>
  typeof value === 'string' && BUG_STATUS_DB_VALUES.includes(value as AdminBugStatusDb);

const parseBugDetailsWithContext = (details: string) => {
  const marker = '\n[Structured context]\n';
  const markerIndex = details.indexOf(marker);

  if (markerIndex < 0) {
    return {
      description: details.trim(),
      categoryLabel: null as string | null,
      areaLabel: null as string | null
    };
  }

  const description = details.slice(0, markerIndex).trim();
  const contextLines = details
    .slice(markerIndex + marker.length)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let categoryLabel: string | null = null;
  let areaLabel: string | null = null;

  contextLines.forEach((line) => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex <= 0) {
      return;
    }

    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    if (key === 'category') {
      categoryLabel = value;
      return;
    }

    if (key === 'area') {
      areaLabel = value;
    }
  });

  return {
    description,
    categoryLabel,
    areaLabel
  };
};

const inferBugModuleFromPageUrl = (pageUrl: string | null) => {
  if (!pageUrl) {
    return 'Other';
  }

  const normalized = pageUrl.toLowerCase();
  if (normalized.includes('/learn/')) return 'Theory';
  if (normalized.includes('/assignments') || normalized.includes('/practice')) return 'Tasks';
  if (normalized.includes('/missions')) return 'Missions';
  if (normalized.includes('/energy') || normalized.includes('grid')) return 'Grid';
  if (normalized.includes('/settings')) return 'Settings';
  if (normalized.includes('/login') || normalized.includes('/signup')) return 'Auth';
  if (normalized === '/' || normalized.includes('/home')) return 'Dashboard';

  return 'Other';
};

const inferBrowserFromUserAgent = (userAgent: string | null) => {
  if (!userAgent) {
    return null;
  }

  const value = userAgent.toLowerCase();
  if (value.includes('edg/')) return 'Edge';
  if (value.includes('opr/') || value.includes('opera')) return 'Opera';
  if (value.includes('chrome/') && !value.includes('edg/')) return 'Chrome';
  if (value.includes('safari/') && !value.includes('chrome/')) return 'Safari';
  if (value.includes('firefox/')) return 'Firefox';

  return 'Unknown';
};

const inferDeviceFromUserAgent = (userAgent: string | null) => {
  if (!userAgent) {
    return null;
  }

  const value = userAgent.toLowerCase();
  if (value.includes('ipad') || value.includes('tablet')) return 'Tablet';
  if (value.includes('iphone') || value.includes('android') || value.includes('mobile')) {
    return 'Mobile';
  }

  return 'Desktop';
};

const buildShortDescription = (value: string) => {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 120) {
    return cleaned;
  }

  return `${cleaned.slice(0, 117)}...`;
};

const toReporterName = (profile: ProfileRow | undefined, email: string) => {
  if (profile?.name && profile.name.trim().length > 0) {
    return profile.name.trim();
  }

  const emailLocal = email.split('@')[0]?.trim();
  if (emailLocal) {
    return emailLocal;
  }

  return 'Unknown reporter';
};

const mapBugReportRow = (
  row: BugReportRow,
  profileById: Map<string, ProfileRow>
): AdminBugReportRecord => {
  const parsed = parseBugDetailsWithContext(row.details);
  const categoryLabel = parsed.categoryLabel ?? 'Other';
  const areaLabel = parsed.areaLabel ?? null;
  const module = areaLabel
    ? BUG_MODULE_BY_AREA_LABEL[areaLabel] ?? areaLabel
    : inferBugModuleFromPageUrl(row.page_url);
  const profile = profileById.get(row.user_id);
  const reporterEmail = row.email || profile?.email || '';
  const reporterName = toReporterName(profile, reporterEmail);
  const statusDb = isBugReportDbStatus(row.status) ? row.status : 'new';

  return {
    id: row.id,
    title: row.title,
    description: parsed.description || row.details,
    shortDescription: buildShortDescription(parsed.description || row.details),
    reporterName,
    reporterEmail,
    severity: BUG_SEVERITY_BY_CATEGORY_LABEL[categoryLabel] ?? 'Medium',
    status: BUG_STATUS_LABEL_BY_DB[statusDb],
    statusDb,
    submittedAt: row.created_at,
    module,
    browser: inferBrowserFromUserAgent(row.user_agent),
    device: inferDeviceFromUserAgent(row.user_agent),
    stepsToReproduce: null,
    expectedResult: null,
    actualResult: null,
    attachmentUrls: [],
    pageUrl: row.page_url
  };
};

const isFeedbackSourceType = (value: unknown): value is AdminFeedbackSourceType =>
  typeof value === 'string' &&
  FEEDBACK_SOURCE_TYPES.includes(value as AdminFeedbackSourceType);

const isFeedbackTriageStatus = (
  value: unknown
): value is (typeof FEEDBACK_TRIAGE_DB_VALUES)[number] =>
  typeof value === 'string' &&
  FEEDBACK_TRIAGE_DB_VALUES.includes(value as (typeof FEEDBACK_TRIAGE_DB_VALUES)[number]);

const toFeedbackRecordId = (sourceType: AdminFeedbackSourceType, sourceId: string) =>
  `${sourceType}:${sourceId}`;

const toFeedbackTriageKey = (sourceType: AdminFeedbackSourceType, sourceId: string) =>
  `${sourceType}:${sourceId}`;

const toFeedbackStatusFromBugStatus = (
  statusDb: AdminBugStatusDb
): Exclude<AdminFeedbackStatus, 'Ignored'> => {
  if (statusDb === 'triaged') {
    return 'Reviewed';
  }

  if (statusDb === 'resolved') {
    return 'Resolved';
  }

  return 'Submitted';
};

const toBugStatusFromFeedbackStatus = (
  status: AdminFeedbackStatus
): AdminBugStatusDb | null => {
  if (status === 'Submitted') {
    return 'new';
  }

  if (status === 'Reviewed') {
    return 'triaged';
  }

  if (status === 'Resolved') {
    return 'resolved';
  }

  return null;
};

const getFeedbackNotes = (triageRow: FeedbackTriageRow | null | undefined) =>
  triageRow?.admin_notes?.trim() ?? '';

const createAnonymousFeedbackIdentity = (sessionId: string) => {
  const sessionLabel = sessionId.slice(0, 8);

  return {
    userName: 'Anonymous session',
    userEmail: `session:${sessionLabel}`
  };
};

const resolveFeedbackIdentity = ({
  email,
  profile,
  sessionId
}: {
  email?: string | null;
  profile?: ProfileRow;
  sessionId?: string;
}) => {
  const normalizedEmail = email?.trim() || profile?.email?.trim() || '';

  if (normalizedEmail) {
    return {
      userName: toReporterName(profile, normalizedEmail),
      userEmail: normalizedEmail
    };
  }

  if (sessionId) {
    return createAnonymousFeedbackIdentity(sessionId);
  }

  return {
    userName: profile?.name?.trim() || 'Unknown user',
    userEmail: 'Unknown'
  };
};

const normalizeFeedbackModuleFromPath = (path: string | null) => {
  if (!path) {
    return 'Other';
  }

  const normalized = path.toLowerCase();

  if (normalized.includes('/theory') || normalized.includes('/learn/')) {
    return 'Theory';
  }

  if (normalized.includes('/missions')) {
    return 'Missions';
  }

  if (normalized.includes('/practice/notebooks')) {
    return 'Notebooks';
  }

  if (normalized.includes('/practice') || normalized.includes('/assignments')) {
    return 'Task Pages';
  }

  if (normalized.includes('/grid-ops') || normalized.includes('/energy')) {
    return 'Grid Ops';
  }

  if (
    normalized.includes('/pricing') ||
    normalized.includes('/billing') ||
    normalized.includes('/settings')
  ) {
    return 'Billing';
  }

  if (normalized.includes('/login') || normalized.includes('/signup')) {
    return 'Onboarding';
  }

  if (normalized === '/' || normalized.includes('/home')) {
    return 'Dashboard';
  }

  return 'Other';
};

const normalizeFeedbackCategoryFromBugLabel = (categoryLabel: string | null) => {
  const normalized = categoryLabel?.toLowerCase() ?? '';

  if (normalized.includes('performance')) return 'Performance';
  if (normalized.includes('navigation')) return 'Navigation';
  if (normalized.includes('billing')) return 'Billing';
  if (normalized.includes('auth')) return 'Auth / Account';
  if (normalized.includes('data')) return 'Data / Progress';
  if (normalized.includes('crash')) return 'Crash / Error';
  if (normalized.includes('ui')) return 'UI / Visual';

  return categoryLabel?.trim() || 'General';
};

const normalizeLightbulbCategory = ({
  contextType,
  module
}: {
  contextType: string | null;
  module: string;
}) => {
  if (module === 'Theory') return 'Theory Experience';
  if (module === 'Onboarding') return 'Onboarding';
  if (module === 'Missions') return 'Missions';
  if (module === 'Notebooks') return 'Notebooks';
  if (module === 'Grid Ops') return 'Grid Ops';
  if (module === 'Billing') return 'Billing';
  if (module === 'Dashboard') return 'Navigation';
  if (module === 'Task Pages') return 'Task Flow';

  if (contextType === 'mission') return 'Missions';
  if (contextType === 'notebook') return 'Notebooks';
  if (contextType === 'module') return 'Theory Experience';

  return 'General';
};

const normalizeKeyword = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const FEEDBACK_KEYWORD_STOP_WORDS = new Set([
  'about',
  'after',
  'before',
  'could',
  'every',
  'feels',
  'finally',
  'have',
  'into',
  'just',
  'make',
  'more',
  'page',
  'pages',
  'should',
  'that',
  'their',
  'there',
  'these',
  'this',
  'when',
  'with'
]);

const extractKeywordsFromText = (text: string, fallbackKeywords: string[] = []) => {
  const frequency = new Map<string, number>();
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !FEEDBACK_KEYWORD_STOP_WORDS.has(token));

  tokens.forEach((token) => {
    frequency.set(token, (frequency.get(token) ?? 0) + 1);
  });

  const ranked = Array.from(frequency.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([token]) => token);

  const merged = [...fallbackKeywords, ...ranked]
    .map((keyword) => normalizeKeyword(keyword))
    .filter((keyword) => keyword.length > 0);

  return Array.from(new Set(merged)).slice(0, 8);
};

const LIGHTBULB_FEEDBACK_VALUE_TO_LABEL = {
  dim: 'Needs work',
  steady: 'Clear enough',
  bright: 'Very clear'
} as const;

type LightbulbFeedbackValue = keyof typeof LIGHTBULB_FEEDBACK_VALUE_TO_LABEL;

const isLightbulbFeedbackValue = (value: unknown): value is LightbulbFeedbackValue =>
  typeof value === 'string' && value in LIGHTBULB_FEEDBACK_VALUE_TO_LABEL;

const LIGHTBULB_FEEDBACK_TYPE_BY_VALUE: Record<
  LightbulbFeedbackValue,
  AdminFeedbackType
> = {
  dim: 'Issue',
  steady: 'Usability',
  bright: 'Praise'
};

const LIGHTBULB_FEEDBACK_SENTIMENT_BY_VALUE: Record<
  LightbulbFeedbackValue,
  AdminFeedbackSentiment
> = {
  dim: 'Negative',
  steady: 'Neutral',
  bright: 'Positive'
};

const LIGHTBULB_FEEDBACK_RATING_BY_VALUE: Record<
  LightbulbFeedbackValue,
  1 | 2 | 3 | 4 | 5
> = {
  dim: 2,
  steady: 3,
  bright: 5
};

const asMetadataRecord = (value: JsonValue): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const parseLightbulbMetadata = (metadata: JsonValue) => {
  const record = asMetadataRecord(metadata);
  const contextType = typeof record.contextType === 'string' ? record.contextType : null;
  const contextId = typeof record.contextId === 'string' ? record.contextId : null;
  const value = isLightbulbFeedbackValue(record.value) ? record.value : 'steady';

  return {
    contextType,
    contextId,
    value
  };
};

const buildLightbulbPreview = ({
  category,
  module,
  value
}: {
  category: string;
  module: string;
  value: LightbulbFeedbackValue;
}) => {
  const valueLabel = LIGHTBULB_FEEDBACK_VALUE_TO_LABEL[value];

  if (value === 'bright') {
    return `${valueLabel} response for ${category.toLowerCase()} in ${module.toLowerCase()}.`;
  }

  if (value === 'dim') {
    return `${valueLabel} signal for ${category.toLowerCase()} in ${module.toLowerCase()}.`;
  }

  return `${valueLabel} response for ${module.toLowerCase()} flow.`;
};

const buildLightbulbMessage = ({
  category,
  contextId,
  contextType,
  linkedPage,
  module,
  value
}: {
  category: string;
  contextId: string | null;
  contextType: string | null;
  linkedPage: string;
  module: string;
  value: LightbulbFeedbackValue;
}) => {
  const valueLabel = LIGHTBULB_FEEDBACK_VALUE_TO_LABEL[value];
  const contextTypeLabel = contextType ?? 'general';
  const contextIdLabel = contextId ?? 'not supplied';

  return `This is a one-click lightbulb response marked as "${valueLabel}" for the ${category.toLowerCase()} experience in ${module}. Context type: ${contextTypeLabel}. Context id: ${contextIdLabel}. Linked page: ${linkedPage}.`;
};

const resolveBugFeedbackStatus = ({
  row,
  triageRow
}: {
  row: BugReportRow;
  triageRow: FeedbackTriageRow | null | undefined;
}): AdminFeedbackStatus =>
  triageRow?.status === 'ignored'
    ? 'Ignored'
    : toFeedbackStatusFromBugStatus(isBugReportDbStatus(row.status) ? row.status : 'new');

const mapBugReportRowToAdminFeedback = ({
  row,
  profileById,
  triageRow
}: {
  row: BugReportRow;
  profileById: Map<string, ProfileRow>;
  triageRow?: FeedbackTriageRow | null;
}): AdminFeedbackRecord => {
  const parsed = parseBugDetailsWithContext(row.details);
  const module = parsed.areaLabel
    ? BUG_MODULE_BY_AREA_LABEL[parsed.areaLabel] ?? parsed.areaLabel
    : inferBugModuleFromPageUrl(row.page_url);
  const category = normalizeFeedbackCategoryFromBugLabel(parsed.categoryLabel);
  const severity =
    BUG_SEVERITY_BY_CATEGORY_LABEL[parsed.categoryLabel ?? 'Other'] ?? 'Medium';
  const ratingBySeverity: Record<AdminBugSeverity, 1 | 2 | 3 | 4 | 5> = {
    Critical: 1,
    High: 2,
    Medium: 2,
    Low: 3
  };
  const profile = profileById.get(row.user_id);
  const identity = resolveFeedbackIdentity({
    email: row.email,
    profile
  });
  const description = parsed.description || row.details;
  const linkedPage = row.page_url?.trim() || 'Unknown';

  return {
    id: toFeedbackRecordId('bug_report', row.id),
    sourceId: row.id,
    sourceType: 'bug_report',
    userName: identity.userName,
    userEmail: identity.userEmail,
    submittedAt: row.created_at,
    type: 'Issue',
    rating: ratingBySeverity[severity],
    sentiment: 'Negative',
    category,
    status: resolveBugFeedbackStatus({ row, triageRow }),
    module,
    linkedPage,
    preview: buildShortDescription(row.title),
    message: description,
    internalNotes: getFeedbackNotes(triageRow),
    keywords: extractKeywordsFromText(`${row.title} ${description}`, [
      category,
      module,
      'bug report'
    ])
  };
};

const mapProductFunnelEventToAdminFeedback = ({
  row,
  profileById,
  triageRow
}: {
  row: ProductFunnelEventRow;
  profileById: Map<string, ProfileRow>;
  triageRow?: FeedbackTriageRow | null;
}): AdminFeedbackRecord => {
  const metadata = parseLightbulbMetadata(row.metadata);
  const profile = row.user_id ? profileById.get(row.user_id) : undefined;
  const identity = resolveFeedbackIdentity({
    profile,
    sessionId: row.session_id
  });
  const linkedPage = row.path?.trim() || 'Unknown';
  const module = normalizeFeedbackModuleFromPath(row.path);
  const category = normalizeLightbulbCategory({
    contextType: metadata.contextType,
    module
  });

  return {
    id: toFeedbackRecordId('lightbulb_feedback', row.id),
    sourceId: row.id,
    sourceType: 'lightbulb_feedback',
    userName: identity.userName,
    userEmail: identity.userEmail,
    submittedAt: row.occurred_at,
    type: LIGHTBULB_FEEDBACK_TYPE_BY_VALUE[metadata.value],
    rating: LIGHTBULB_FEEDBACK_RATING_BY_VALUE[metadata.value],
    sentiment: LIGHTBULB_FEEDBACK_SENTIMENT_BY_VALUE[metadata.value],
    category,
    status: triageRow ? FEEDBACK_STATUS_LABEL_BY_DB[triageRow.status] : 'Submitted',
    module,
    linkedPage,
    preview: buildLightbulbPreview({
      category,
      module,
      value: metadata.value
    }),
    message: buildLightbulbMessage({
      category,
      contextId: metadata.contextId,
      contextType: metadata.contextType,
      linkedPage,
      module,
      value: metadata.value
    }),
    internalNotes: getFeedbackNotes(triageRow),
    keywords: extractKeywordsFromText(
      [category, module, metadata.contextType, metadata.contextId]
        .filter(Boolean)
        .join(' '),
      [
        category,
        module,
        metadata.contextType ?? 'general',
        LIGHTBULB_FEEDBACK_VALUE_TO_LABEL[metadata.value]
      ]
    )
  };
};

const loadFeedbackTriageMap = async ({
  supabase,
  sourceIds,
  sourceType
}: {
  supabase: SupabaseClient;
  sourceIds: string[];
  sourceType: AdminFeedbackSourceType;
}) => {
  const triageMap = new Map<string, FeedbackTriageRow>();

  if (sourceIds.length === 0) {
    return triageMap;
  }

  const triageResult = await readOptionalRows<FeedbackTriageRow>(
    supabase
      .from('admin_feedback_triage')
      .select('source_type,source_id,status,admin_notes,updated_by,created_at,updated_at')
      .eq('source_type', sourceType)
      .in('source_id', sourceIds)
  );

  if (!triageResult.available) {
    return triageMap;
  }

  triageResult.rows.forEach((row) => {
    if (!isFeedbackSourceType(row.source_type) || !isFeedbackTriageStatus(row.status)) {
      return;
    }

    triageMap.set(toFeedbackTriageKey(row.source_type, row.source_id), row);
  });

  return triageMap;
};

const getFeedbackTriageRow = async ({
  supabase,
  sourceId,
  sourceType
}: {
  supabase: SupabaseClient;
  sourceId: string;
  sourceType: AdminFeedbackSourceType;
}) => {
  const triageResult = await readOptionalMaybeSingle<FeedbackTriageRow>(
    supabase
      .from('admin_feedback_triage')
      .select('source_type,source_id,status,admin_notes,updated_by,created_at,updated_at')
      .eq('source_type', sourceType)
      .eq('source_id', sourceId)
      .maybeSingle()
  );

  if (!triageResult.available || !triageResult.row) {
    return null;
  }

  if (
    !isFeedbackSourceType(triageResult.row.source_type) ||
    !isFeedbackTriageStatus(triageResult.row.status)
  ) {
    return null;
  }

  return triageResult.row;
};

const upsertFeedbackTriage = async ({
  adminNotes,
  actorUserId,
  sourceId,
  sourceType,
  status,
  supabase
}: {
  adminNotes: string;
  actorUserId: string;
  sourceId: string;
  sourceType: AdminFeedbackSourceType;
  status: AdminFeedbackStatus;
  supabase: SupabaseClient;
}) => {
  const { data, error } = await supabase
    .from('admin_feedback_triage')
    .upsert(
      {
        source_type: sourceType,
        source_id: sourceId,
        status: FEEDBACK_STATUS_DB_BY_LABEL[status],
        admin_notes: adminNotes,
        updated_by: actorUserId
      },
      {
        onConflict: 'source_type,source_id'
      }
    )
    .select('source_type,source_id,status,admin_notes,updated_by,created_at,updated_at')
    .single();
  assertSuccess(error);

  const row = data as FeedbackTriageRow | null;
  if (
    !row ||
    !isFeedbackSourceType(row.source_type) ||
    !isFeedbackTriageStatus(row.status)
  ) {
    throw new AdminServiceError('Feedback triage state is invalid.', 500);
  }

  return row;
};

const toTopicLabel = (topic: string) =>
  TOPIC_LABELS[topic] ??
  topic.replace(/[-_]/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());

const mergeDistinctUserIds = (...sources: Array<Array<{ user_id: string }>>) =>
  new Set(
    sources.flatMap((rows) =>
      rows
        .map((row) => row.user_id)
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
    )
  );

const pushTimestampedActivity = (
  target: UserActivityRow[],
  rows: Array<Record<string, unknown>>,
  key: string
) => {
  rows.forEach((row) => {
    const userId = typeof row.user_id === 'string' ? row.user_id : null;
    const timestampValue = row[key];
    const timestamp = typeof timestampValue === 'string' ? timestampValue : null;

    if (!userId || !timestamp) {
      return;
    }

    target.push({
      user_id: userId,
      timestamp: timestamp as string
    });
  });
};

const pushTopicTimestampedActivity = (
  target: TopicActivityRow[],
  rows: Array<Record<string, unknown>>,
  key: string
) => {
  rows.forEach((row) => {
    const userId = typeof row.user_id === 'string' ? row.user_id : null;
    const topic = typeof row.topic === 'string' ? row.topic : null;
    const timestampValue = row[key];
    const timestamp = typeof timestampValue === 'string' ? timestampValue : null;

    if (!userId || !topic || !timestamp) {
      return;
    }

    target.push({
      user_id: userId,
      topic: topic as string,
      timestamp: timestamp as string
    });
  });
};

const readOptionalRows = async <T>(
  query: Promise<{ data: T[] | null; error: { message?: string } | null }>
) => {
  const result = await query;

  if (isMissingRelationError(result.error)) {
    return {
      available: false,
      rows: [] as T[]
    };
  }

  assertSuccess(result.error);

  return {
    available: true,
    rows: (result.data ?? []) as T[]
  };
};

const readOptionalMaybeSingle = async <T>(
  query: Promise<{ data: T | null; error: { message?: string } | null }>
) => {
  const result = await query;

  if (isMissingRelationError(result.error)) {
    return {
      available: false,
      row: null as T | null
    };
  }

  assertSuccess(result.error);

  return {
    available: true,
    row: (result.data ?? null) as T | null
  };
};

const buildUserIdSet = <T extends { user_id: string }>(
  rows: T[],
  predicate?: (row: T) => boolean
) =>
  new Set(
    rows
      .filter((row) => (predicate ? predicate(row) : true))
      .map((row) => row.user_id)
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
  );

const differenceUserSet = (allUsers: Set<string>, excludedUsers: Set<string>) =>
  new Set(Array.from(allUsers).filter((userId) => !excludedUsers.has(userId)));

const countUsersInBoth = (left: Set<string>, right: Set<string>) => {
  let count = 0;
  left.forEach((userId) => {
    if (right.has(userId)) {
      count += 1;
    }
  });
  return count;
};

const buildTreeOutcome = ({
  id,
  label,
  segmentUsers,
  completedUsers
}: {
  id: AdminAnalyticsTreeOutcome['id'];
  label: string;
  segmentUsers: Set<string>;
  completedUsers: Set<string>;
}): AdminAnalyticsTreeOutcome => {
  const totalUsers = segmentUsers.size;
  const completedCount = countUsersInBoth(segmentUsers, completedUsers);
  const ratePct = totalUsers > 0 ? Math.round((completedCount / totalUsers) * 100) : 0;

  return {
    id,
    label,
    ratePct,
    completedUsers: completedCount,
    totalUsers,
    helper: `${formatWholeNumber(completedCount)} of ${formatWholeNumber(totalUsers)} users`
  };
};

const buildTreeSegment = ({
  id,
  label,
  helper,
  accent,
  users,
  totalUsers,
  theoryCompletedUsers,
  taskCompletedUsers
}: {
  id: string;
  label: string;
  helper: string;
  accent: AdminAnalyticsTreeAccent;
  users: Set<string>;
  totalUsers: number;
  theoryCompletedUsers: Set<string>;
  taskCompletedUsers: Set<string>;
}): AdminAnalyticsTreeSegment => ({
  id,
  label,
  count: users.size,
  sharePct: totalUsers > 0 ? Math.round((users.size / totalUsers) * 100) : 0,
  helper,
  accent,
  outcomes: [
    buildTreeOutcome({
      id: 'theory_completion_rate',
      label: 'Theory completion',
      segmentUsers: users,
      completedUsers: theoryCompletedUsers
    }),
    buildTreeOutcome({
      id: 'task_completion_rate',
      label: 'Task completion',
      segmentUsers: users,
      completedUsers: taskCompletedUsers
    })
  ]
});

const mapTrackRow = (row: TrackRow): AdminTrackRecord => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapContentItemRow = (row: ContentItemRow): AdminContentItemRecord => ({
  id: row.id,
  trackId: row.track_id,
  trackSlug: row.tracks?.slug ?? null,
  trackTitle: row.tracks?.title ?? null,
  contentType: row.content_type,
  sourceRef: row.source_ref,
  title: row.title,
  sequenceOrder: row.sequence_order,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const toAuditJson = (value: unknown): JsonValue | null => {
  if (value == null) {
    return null;
  }

  try {
    return JSON.parse(JSON.stringify(value)) as JsonValue;
  } catch {
    return { unserializable: true };
  }
};

const mapActivationTaskAuditRow = (
  row: ActivationTaskAuditRow
): AdminActivationTaskSnapshot => ({
  id: row.id,
  userId: row.user_id,
  taskType: row.task_type,
  taskGroup: row.task_group,
  title: row.title,
  description: row.description,
  trackId: row.track_id,
  trackSlug: row.tracks?.slug ?? null,
  trackTitle: row.tracks?.title ?? null,
  scopeType: row.scope_type,
  requestedCount: row.requested_count,
  status: row.status,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  startedAt: row.started_at,
  completedAt: row.completed_at,
  linkedItems: (row.user_activation_task_items ?? []).map((item) => ({
    id: item.id,
    contentItemId: item.content_item_id,
    itemStatus: item.item_status,
    startedAt: item.started_at,
    completedAt: item.completed_at
  }))
});

const getTrackById = async (supabase: SupabaseClient, trackId: string) => {
  const { data, error } = await supabase
    .from('tracks')
    .select('id,slug,title,is_active,created_at,updated_at')
    .eq('id', trackId)
    .maybeSingle();
  assertSuccess(error);
  return (data ?? null) as TrackRow | null;
};

const validateTrackForContentType = async (
  supabase: SupabaseClient,
  trackId: string,
  contentType: ActivationContentType
) => {
  const track = await getTrackById(supabase, trackId);
  if (!track) {
    throw new AdminServiceError('Track not found.', 404);
  }

  if (contentType === 'mission') {
    if (track.slug !== 'global') {
      throw new AdminServiceError('Mission content must use the Global track.', 422);
    }
    return track;
  }

  if (!TRACK_SLUGS.has(track.slug)) {
    throw new AdminServiceError(
      'Theory, flashcard, and notebook content must use an active learning track.',
      422
    );
  }

  return track;
};

const ensureContentUniqueness = async ({
  supabase,
  contentType,
  trackId,
  sourceRef,
  excludeId
}: {
  supabase: SupabaseClient;
  contentType: ActivationContentType;
  trackId: string;
  sourceRef: string;
  excludeId?: string;
}) => {
  const { data, error } = await supabase
    .from('content_items')
    .select('id')
    .eq('content_type', contentType)
    .eq('track_id', trackId)
    .eq('source_ref', sourceRef);
  assertSuccess(error);

  const duplicate = ((data ?? []) as Array<{ id: string }>).find(
    (item) => item.id !== excludeId
  );

  if (duplicate) {
    throw new AdminServiceError(
      'A content item with this type, track, and source ref already exists.',
      409
    );
  }
};

const ensureSequenceOrderAvailable = async ({
  supabase,
  contentType,
  trackId,
  sequenceOrder,
  excludeId
}: {
  supabase: SupabaseClient;
  contentType: ActivationContentType;
  trackId: string;
  sequenceOrder: number;
  excludeId?: string;
}) => {
  const { data, error } = await supabase
    .from('content_items')
    .select('id')
    .eq('content_type', contentType)
    .eq('track_id', trackId)
    .eq('sequence_order', sequenceOrder);
  assertSuccess(error);

  const collision = ((data ?? []) as Array<{ id: string }>).find(
    (item) => item.id !== excludeId
  );

  if (collision) {
    throw new AdminServiceError(
      'Sequence order is already taken for this track and content type.',
      409
    );
  }
};

const getContentItemById = async (supabase: SupabaseClient, contentItemId: string) => {
  const { data, error } = await supabase
    .from('content_items')
    .select(
      'id,track_id,content_type,source_ref,title,sequence_order,is_active,created_at,updated_at,tracks:track_id(slug,title)'
    )
    .eq('id', contentItemId)
    .maybeSingle();
  assertSuccess(error);
  return (data ?? null) as ContentItemRow | null;
};

export const listAdminCatalog = async (
  supabase: SupabaseClient
): Promise<AdminCatalogData> => {
  const [tracksResult, contentItemsResult] = await Promise.all([
    supabase
      .from('tracks')
      .select('id,slug,title,is_active,created_at,updated_at')
      .order('slug', { ascending: true }),
    supabase
      .from('content_items')
      .select(
        'id,track_id,content_type,source_ref,title,sequence_order,is_active,created_at,updated_at,tracks:track_id(slug,title)'
      )
      .order('sequence_order', { ascending: true })
  ]);

  assertSuccess(tracksResult.error);
  assertSuccess(contentItemsResult.error);

  const tracks = ((tracksResult.data ?? []) as TrackRow[]).map(mapTrackRow);
  const contentItems = ((contentItemsResult.data ?? []) as ContentItemRow[])
    .map(mapContentItemRow)
    .sort((left, right) => {
      const trackCompare = (left.trackSlug ?? '').localeCompare(right.trackSlug ?? '');
      if (trackCompare !== 0) return trackCompare;
      const typeCompare = left.contentType.localeCompare(right.contentType);
      if (typeCompare !== 0) return typeCompare;
      if (left.sequenceOrder !== right.sequenceOrder) {
        return left.sequenceOrder - right.sequenceOrder;
      }
      return left.title.localeCompare(right.title);
    });

  return { tracks, contentItems };
};

export const updateAdminTrack = async ({
  supabase,
  trackId,
  input
}: {
  supabase: SupabaseClient;
  trackId: string;
  input: AdminTrackUpdateInput;
}) => {
  const existing = await getTrackById(supabase, trackId);
  if (!existing) {
    throw new AdminServiceError('Track not found.', 404);
  }

  const updates: Record<string, unknown> = {};
  if (typeof input.title === 'string') {
    updates.title = normalizeRequiredText(input.title, 'Track title');
  }
  if (typeof input.isActive === 'boolean') {
    updates.is_active = input.isActive;
  }

  if (Object.keys(updates).length === 0) {
    throw new AdminServiceError('No track fields were provided.', 422);
  }

  const { error } = await supabase.from('tracks').update(updates).eq('id', trackId);
  assertSuccess(error);

  const updated = await getTrackById(supabase, trackId);
  if (!updated) {
    throw new AdminServiceError('Track not found after update.', 500);
  }

  return {
    before: mapTrackRow(existing),
    after: mapTrackRow(updated)
  };
};

export const upsertAdminContentItem = async ({
  supabase,
  input
}: {
  supabase: SupabaseClient;
  input: AdminContentItemUpsertInput;
}) => {
  if (!isAdminContentType(input.contentType)) {
    throw new AdminServiceError('Content type is invalid.', 422);
  }

  const sourceRef = normalizeRequiredText(input.sourceRef, 'Source ref');
  const title = normalizeRequiredText(input.title, 'Title');
  const sequenceOrder = normalizeSequenceOrder(input.sequenceOrder);
  await validateTrackForContentType(supabase, input.trackId, input.contentType);

  let existing: ContentItemRow | null = null;
  if (input.id) {
    existing = await getContentItemById(supabase, input.id);
    if (!existing) {
      throw new AdminServiceError('Content item not found.', 404);
    }
  }

  await Promise.all([
    ensureContentUniqueness({
      supabase,
      contentType: input.contentType,
      trackId: input.trackId,
      sourceRef,
      excludeId: input.id
    }),
    ensureSequenceOrderAvailable({
      supabase,
      contentType: input.contentType,
      trackId: input.trackId,
      sequenceOrder,
      excludeId: input.id
    })
  ]);

  if (input.id) {
    const { error } = await supabase
      .from('content_items')
      .update({
        track_id: input.trackId,
        content_type: input.contentType,
        source_ref: sourceRef,
        title,
        sequence_order: sequenceOrder,
        is_active: input.isActive
      })
      .eq('id', input.id);
    assertSuccess(error);
  } else {
    const { error } = await supabase.from('content_items').insert({
      track_id: input.trackId,
      content_type: input.contentType,
      source_ref: sourceRef,
      title,
      sequence_order: sequenceOrder,
      is_active: input.isActive
    });
    assertSuccess(error);
  }

  const persisted = input.id
    ? await getContentItemById(supabase, input.id)
    : await (async () => {
        const { data, error } = await supabase
          .from('content_items')
          .select('id')
          .eq('content_type', input.contentType)
          .eq('track_id', input.trackId)
          .eq('source_ref', sourceRef)
          .maybeSingle();
        assertSuccess(error);
        return data?.id ? getContentItemById(supabase, data.id) : null;
      })();

  if (!persisted) {
    throw new AdminServiceError('Content item not found after save.', 500);
  }

  return {
    before: existing ? mapContentItemRow(existing) : null,
    after: mapContentItemRow(persisted)
  };
};

export const reorderAdminContentItems = async ({
  supabase,
  trackId,
  contentType,
  orderedItemIds
}: {
  supabase: SupabaseClient;
  trackId: string;
  contentType: ActivationContentType;
  orderedItemIds: string[];
}) => {
  if (!isAdminContentType(contentType)) {
    throw new AdminServiceError('Content type is invalid.', 422);
  }

  if (orderedItemIds.length === 0) {
    throw new AdminServiceError('Ordered item ids are required.', 422);
  }

  const uniqueIds = new Set(orderedItemIds);
  if (uniqueIds.size !== orderedItemIds.length) {
    throw new AdminServiceError(
      'Duplicate item ids are not allowed in reorder requests.',
      400
    );
  }

  const { data, error } = await supabase
    .from('content_items')
    .select(
      'id,track_id,content_type,source_ref,title,sequence_order,is_active,created_at,updated_at,tracks:track_id(slug,title)'
    )
    .eq('track_id', trackId)
    .eq('content_type', contentType)
    .order('sequence_order', { ascending: true });
  assertSuccess(error);

  const existingItems = (data ?? []) as ContentItemRow[];
  const existingIdSet = new Set(existingItems.map((item) => item.id));
  if (
    existingItems.length !== orderedItemIds.length ||
    orderedItemIds.some((itemId) => !existingIdSet.has(itemId))
  ) {
    throw new AdminServiceError(
      'Content order is out of date. Refresh and try again.',
      409
    );
  }

  const before = existingItems.map(mapContentItemRow);

  const updateResults = await Promise.all(
    orderedItemIds.map((itemId, index) =>
      supabase
        .from('content_items')
        .update({ sequence_order: index + 1 })
        .eq('id', itemId)
        .eq('track_id', trackId)
        .eq('content_type', contentType)
    )
  );

  updateResults.forEach((result: { error: { message?: string } | null }) => {
    assertSuccess(result.error);
  });

  const { data: updatedData, error: updatedError } = await supabase
    .from('content_items')
    .select(
      'id,track_id,content_type,source_ref,title,sequence_order,is_active,created_at,updated_at,tracks:track_id(slug,title)'
    )
    .eq('track_id', trackId)
    .eq('content_type', contentType)
    .order('sequence_order', { ascending: true });
  assertSuccess(updatedError);

  return {
    before,
    after: ((updatedData ?? []) as ContentItemRow[]).map(mapContentItemRow)
  };
};

export const listAdminAnalytics = async (
  supabase: SupabaseClient,
  options?: { period?: AdminAnalyticsPeriod }
): Promise<AdminAnalyticsSnapshot> => {
  const generatedAt = new Date().toISOString();
  const period = resolveAnalyticsPeriod(options?.period);
  const config = ANALYTICS_PERIODS[period];
  const currentDayStartIso = startOfUtcDay(new Date()).toISOString();
  const comparisonDayStart = new Date(startOfUtcDay(new Date()));
  comparisonDayStart.setUTCDate(comparisonDayStart.getUTCDate() - 1);
  const previousDayStart = new Date(startOfUtcDay(new Date()));
  previousDayStart.setUTCDate(previousDayStart.getUTCDate() - 2);
  const currentWindowStart =
    period === 'daily'
      ? currentDayStartIso
      : config.rangeDays == null
        ? null
        : daysAgoIso(config.rangeDays);
  const comparisonWindowStart =
    period === 'daily'
      ? comparisonDayStart.toISOString()
      : daysAgoIso(config.comparisonDays);
  const previousWindowStart =
    period === 'daily'
      ? previousDayStart.toISOString()
      : daysAgoIso(config.comparisonDays * 2);
  const trend = buildTrendBuckets(period);
  const lookbackStart =
    period === 'all_time'
      ? null
      : [trend[0]?.bucketStart, currentWindowStart, previousWindowStart]
          .filter((value): value is string => Boolean(value))
          .sort()[0] ?? null;

  const [
    totalUsersResult,
    profilesResult,
    userProgressResult,
    readingSessionsResult,
    topicProgressResult,
    engagedUserProgressResult,
    engagedReadingSessionsResult,
    engagedTopicProgressResult,
    moduleProgressResult,
    readingLessonHistoryResult,
    engagedModuleProgressResult,
    engagedReadingLessonHistoryResult,
    totalTasksResult,
    completedTasksResult,
    openTasksResult,
    tasksCompletedCurrentResult,
    taskRowsResult,
    subscriptionsResult
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id,created_at'),
    period === 'all_time'
      ? supabase.from('user_progress').select('user_id,last_activity')
      : supabase
          .from('user_progress')
          .select('user_id,last_activity')
          .gte('last_activity', lookbackStart ?? generatedAt),
    period === 'all_time'
      ? supabase
          .from('reading_sessions')
          .select('user_id,topic,last_active_at,is_completed,completed_at,active_seconds')
      : supabase
          .from('reading_sessions')
          .select('user_id,topic,last_active_at,is_completed,completed_at,active_seconds')
          .gte('last_active_at', lookbackStart ?? generatedAt),
    period === 'all_time'
      ? supabase.from('topic_progress').select('user_id,topic,last_activity_at')
      : supabase
          .from('topic_progress')
          .select('user_id,topic,last_activity_at')
          .gte('last_activity_at', lookbackStart ?? generatedAt),
    supabase.from('user_progress').select('user_id').not('last_activity', 'is', null),
    supabase.from('reading_sessions').select('user_id'),
    supabase.from('topic_progress').select('user_id').not('last_activity_at', 'is', null),
    readOptionalRows<ModuleProgressAnalyticsRow>(
      period === 'all_time'
        ? supabase
            .from('module_progress')
            .select('user_id,topic,updated_at,is_completed,completed_at')
        : supabase
            .from('module_progress')
            .select('user_id,topic,updated_at,is_completed,completed_at')
            .gte('updated_at', lookbackStart ?? generatedAt)
    ),
    readOptionalRows<ReadingLessonHistoryAnalyticsRow>(
      period === 'all_time'
        ? supabase.from('reading_lesson_history').select('user_id,topic,read_at')
        : supabase
            .from('reading_lesson_history')
            .select('user_id,topic,read_at')
            .gte('read_at', lookbackStart ?? generatedAt)
    ),
    readOptionalRows<{ user_id: string }>(
      supabase.from('module_progress').select('user_id')
    ),
    readOptionalRows<{ user_id: string }>(
      supabase.from('reading_lesson_history').select('user_id')
    ),
    supabase.from('user_activation_tasks').select('id', { count: 'exact', head: true }),
    supabase
      .from('user_activation_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase
      .from('user_activation_tasks')
      .select('id', { count: 'exact', head: true })
      .in('status', ['todo', 'in_progress']),
    currentWindowStart
      ? supabase
          .from('user_activation_tasks')
          .select('id', { count: 'exact', head: true })
          .gte('completed_at', currentWindowStart)
          .not('completed_at', 'is', null)
      : supabase
          .from('user_activation_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed'),
    supabase
      .from('user_activation_tasks')
      .select('user_id,status,started_at,completed_at'),
    supabase
      .from('subscriptions')
      .select('user_id,plan,status,stripe_sub_id,created_at,updated_at')
  ]);

  assertSuccess(totalUsersResult.error);
  assertSuccess(profilesResult.error);
  assertSuccess(userProgressResult.error);
  assertSuccess(readingSessionsResult.error);
  assertSuccess(topicProgressResult.error);
  assertSuccess(engagedUserProgressResult.error);
  assertSuccess(engagedReadingSessionsResult.error);
  assertSuccess(engagedTopicProgressResult.error);
  assertSuccess(totalTasksResult.error);
  assertSuccess(completedTasksResult.error);
  assertSuccess(openTasksResult.error);
  assertSuccess(tasksCompletedCurrentResult.error);
  assertSuccess(taskRowsResult.error);
  assertSuccess(subscriptionsResult.error);

  const profilesRows = (profilesResult.data ?? []) as ProfileRow[];
  const readingSessionsRows = (readingSessionsResult.data ?? []) as Array<
    Record<string, unknown>
  >;
  const topicProgressRows = (topicProgressResult.data ?? []) as Array<
    Record<string, unknown>
  >;
  const lessonHistoryRows = readingLessonHistoryResult.rows;
  const taskRows = (taskRowsResult.data ?? []) as TaskAnalyticsRow[];
  const subscriptionRows = (subscriptionsResult.data ?? []) as SubscriptionAnalyticsRow[];

  const totalUsers = totalUsersResult.count ?? 0;
  const totalTasks = totalTasksResult.count ?? 0;
  const completedTasks = completedTasksResult.count ?? 0;
  const openTasks = openTasksResult.count ?? 0;
  const taskCompletionRatePct =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const recentActivityRows: UserActivityRow[] = [];
  pushTimestampedActivity(
    recentActivityRows,
    (userProgressResult.data ?? []) as Array<Record<string, unknown>>,
    'last_activity'
  );
  pushTimestampedActivity(recentActivityRows, readingSessionsRows, 'last_active_at');
  pushTimestampedActivity(recentActivityRows, topicProgressRows, 'last_activity_at');
  pushTimestampedActivity(
    recentActivityRows,
    moduleProgressResult.rows as Array<Record<string, unknown>>,
    'updated_at'
  );
  pushTimestampedActivity(
    recentActivityRows,
    lessonHistoryRows as Array<Record<string, unknown>>,
    'read_at'
  );

  const engagedUsers = mergeDistinctUserIds(
    (engagedUserProgressResult.data ?? []) as Array<{ user_id: string }>,
    (engagedReadingSessionsResult.data ?? []) as Array<{ user_id: string }>,
    (engagedTopicProgressResult.data ?? []) as Array<{ user_id: string }>,
    engagedModuleProgressResult.rows,
    engagedReadingLessonHistoryResult.rows
  ).size;

  const moduleCompletionRows = moduleProgressResult.available
    ? moduleProgressResult.rows.filter(
        (entry) => entry.is_completed && typeof entry.completed_at === 'string'
      )
    : readingSessionsRows
        .filter(
          (row) =>
            row.is_completed === true &&
            typeof row.completed_at === 'string' &&
            typeof row.topic === 'string'
        )
        .map((row) => ({
          user_id: row.user_id as string,
          topic: row.topic as string,
          updated_at: row.completed_at as string,
          is_completed: true,
          completed_at: row.completed_at as string
        }));

  const isWithinRange = (value: string, start: string | null, end?: string) => {
    if (start && value < start) {
      return false;
    }

    if (end && value >= end) {
      return false;
    }

    return true;
  };

  const countDistinctUsersInRange = (
    rows: UserActivityRow[],
    start: string | null,
    end?: string
  ) =>
    new Set(
      rows
        .filter((row) => isWithinRange(row.timestamp, start, end))
        .map((row) => row.user_id)
    ).size;

  const countProfilesInRange = (rows: ProfileRow[], start: string | null, end?: string) =>
    rows.filter(
      (row) =>
        typeof row.created_at === 'string' && isWithinRange(row.created_at, start, end)
    ).length;

  const countRowsInRange = <T extends Record<string, unknown>>(
    rows: T[],
    key: keyof T,
    start: string | null,
    end?: string
  ) =>
    rows.filter(
      (row) =>
        typeof row[key] === 'string' && isWithinRange(row[key] as string, start, end)
    ).length;

  const countSalesInRange = (
    rows: SubscriptionAnalyticsRow[],
    start: string | null,
    end?: string
  ) =>
    rows.filter(
      (row) => isPaidSubscription(row) && isWithinRange(row.created_at, start, end)
    ).length;

  const parseSessionSeconds = (row: Record<string, unknown>) => {
    const rawActiveSeconds = row.active_seconds;
    const activeSeconds =
      typeof rawActiveSeconds === 'number'
        ? rawActiveSeconds
        : typeof rawActiveSeconds === 'string'
          ? Number(rawActiveSeconds)
          : Number.NaN;

    if (!Number.isFinite(activeSeconds) || activeSeconds <= 0) {
      return null;
    }

    return Math.min(Math.round(activeSeconds), MAX_SESSION_DURATION_SECONDS);
  };

  const parseTaskDurationSeconds = (row: TaskAnalyticsRow) => {
    const startedAt = typeof row.started_at === 'string' ? row.started_at : null;
    const completedAt = typeof row.completed_at === 'string' ? row.completed_at : null;

    if (!startedAt || !completedAt) {
      return null;
    }

    const durationSeconds = Math.round(
      (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000
    );

    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      return null;
    }

    return Math.min(durationSeconds, MAX_TASK_DURATION_SECONDS);
  };

  const averageSessionDurationInRange = (
    rows: Array<Record<string, unknown>>,
    start: string | null,
    end?: string
  ) => {
    let totalSeconds = 0;
    let sessionCount = 0;

    rows.forEach((row) => {
      const lastActiveAt =
        typeof row.last_active_at === 'string' ? row.last_active_at : null;
      const activeSeconds = parseSessionSeconds(row);

      if (!lastActiveAt || activeSeconds == null) {
        return;
      }

      if (!isWithinRange(lastActiveAt, start, end)) {
        return;
      }

      totalSeconds += activeSeconds;
      sessionCount += 1;
    });

    if (sessionCount === 0) {
      return 0;
    }

    return Math.round(totalSeconds / sessionCount);
  };

  const taskDurationStatsInRange = (
    rows: TaskAnalyticsRow[],
    start: string | null,
    end?: string
  ) => {
    let totalSeconds = 0;
    let taskCount = 0;

    rows.forEach((row) => {
      const completedAt = typeof row.completed_at === 'string' ? row.completed_at : null;
      const durationSeconds = parseTaskDurationSeconds(row);

      if (!completedAt || durationSeconds == null) {
        return;
      }

      if (!isWithinRange(completedAt, start, end)) {
        return;
      }

      totalSeconds += durationSeconds;
      taskCount += 1;
    });

    return {
      averageSeconds: taskCount === 0 ? 0 : Math.round(totalSeconds / taskCount),
      taskCount
    };
  };

  const platformTimeStatsInRange = (
    sessionRows: Array<Record<string, unknown>>,
    rows: TaskAnalyticsRow[],
    start: string | null,
    end?: string
  ) => {
    const secondsByUser = new Map<string, number>();

    sessionRows.forEach((row) => {
      const userId = typeof row.user_id === 'string' ? row.user_id : null;
      const lastActiveAt =
        typeof row.last_active_at === 'string' ? row.last_active_at : null;
      const activeSeconds = parseSessionSeconds(row);

      if (!userId || !lastActiveAt || activeSeconds == null) {
        return;
      }

      if (!isWithinRange(lastActiveAt, start, end)) {
        return;
      }

      secondsByUser.set(userId, (secondsByUser.get(userId) ?? 0) + activeSeconds);
    });

    rows.forEach((row) => {
      const userId = typeof row.user_id === 'string' ? row.user_id : null;
      const completedAt = typeof row.completed_at === 'string' ? row.completed_at : null;
      const durationSeconds = parseTaskDurationSeconds(row);

      if (!userId || !completedAt || durationSeconds == null) {
        return;
      }

      if (!isWithinRange(completedAt, start, end)) {
        return;
      }

      secondsByUser.set(userId, (secondsByUser.get(userId) ?? 0) + durationSeconds);
    });

    const userCount = secondsByUser.size;
    if (userCount === 0) {
      return {
        averageSeconds: 0,
        userCount
      };
    }

    const totalSeconds = Array.from(secondsByUser.values()).reduce(
      (sum, value) => sum + value,
      0
    );
    return {
      averageSeconds: Math.round(totalSeconds / userCount),
      userCount
    };
  };

  const activeUsers =
    currentWindowStart == null
      ? engagedUsers
      : countDistinctUsersInRange(recentActivityRows, currentWindowStart);
  const newUsers =
    currentWindowStart == null
      ? totalUsers
      : countProfilesInRange(profilesRows, currentWindowStart);
  const lessonCompletions =
    currentWindowStart == null
      ? lessonHistoryRows.length
      : countRowsInRange(lessonHistoryRows, 'read_at', currentWindowStart);
  const moduleCompletions =
    currentWindowStart == null
      ? moduleCompletionRows.length
      : countRowsInRange(moduleCompletionRows, 'completed_at', currentWindowStart);
  const tasksCompleted =
    currentWindowStart == null ? completedTasks : tasksCompletedCurrentResult.count ?? 0;
  const activeSubscriptions = subscriptionRows.filter((row) =>
    isActivePaidSubscription(row)
  ).length;
  const sales =
    currentWindowStart == null
      ? subscriptionRows.filter((row) => isPaidSubscription(row)).length
      : countSalesInRange(subscriptionRows, currentWindowStart);
  const averageSessionDurationSeconds = averageSessionDurationInRange(
    readingSessionsRows,
    currentWindowStart
  );
  const taskStatsInPeriod = taskDurationStatsInRange(taskRows, currentWindowStart);
  const fallbackTaskStats = taskDurationStatsInRange(taskRows, null);
  const hasTaskSamplesInPeriod = taskStatsInPeriod.taskCount > 0;
  const averageTaskTimeSeconds = hasTaskSamplesInPeriod
    ? taskStatsInPeriod.averageSeconds
    : fallbackTaskStats.averageSeconds;
  const platformTimeStatsInPeriod = platformTimeStatsInRange(
    readingSessionsRows,
    taskRows,
    currentWindowStart
  );
  const fallbackPlatformTimeStats = platformTimeStatsInRange(
    readingSessionsRows,
    taskRows,
    null
  );
  const hasPlatformSamplesInPeriod = platformTimeStatsInPeriod.userCount > 0;
  const averagePlatformTimeSeconds = hasPlatformSamplesInPeriod
    ? platformTimeStatsInPeriod.averageSeconds
    : fallbackPlatformTimeStats.averageSeconds;

  const deltaCurrentStart = currentWindowStart ?? comparisonWindowStart;
  const previousUsers = countProfilesInRange(
    profilesRows,
    previousWindowStart,
    deltaCurrentStart
  );
  const previousActiveUsers = countDistinctUsersInRange(
    recentActivityRows,
    previousWindowStart,
    deltaCurrentStart
  );
  const previousSales = countSalesInRange(
    subscriptionRows,
    previousWindowStart,
    deltaCurrentStart
  );
  const previousLessonCompletions = countRowsInRange(
    lessonHistoryRows,
    'read_at',
    previousWindowStart,
    deltaCurrentStart
  );
  const previousAverageSessionDurationSeconds = averageSessionDurationInRange(
    readingSessionsRows,
    previousWindowStart,
    deltaCurrentStart
  );
  const previousTaskStats = taskDurationStatsInRange(
    taskRows,
    previousWindowStart,
    deltaCurrentStart
  );
  const previousAverageTaskTimeSeconds =
    previousTaskStats.taskCount > 0
      ? previousTaskStats.averageSeconds
      : averageTaskTimeSeconds;
  const previousPlatformStats = platformTimeStatsInRange(
    readingSessionsRows,
    taskRows,
    previousWindowStart,
    deltaCurrentStart
  );
  const previousAveragePlatformTimeSeconds =
    previousPlatformStats.userCount > 0
      ? previousPlatformStats.averageSeconds
      : averagePlatformTimeSeconds;

  const allUserIds = new Set(
    profilesRows
      .map((profile) => profile.id)
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
  );
  const activeUserIds = buildUserIdSet(recentActivityRows, (row) =>
    isWithinRange(row.timestamp, currentWindowStart)
  );
  const theoryCompletedUserIds = buildUserIdSet(
    moduleCompletionRows,
    (row) =>
      typeof row.completed_at === 'string' &&
      isWithinRange(row.completed_at, currentWindowStart)
  );
  const taskCompletedUserIds = buildUserIdSet(
    taskRows,
    (row) =>
      row.status === 'completed' &&
      typeof row.completed_at === 'string' &&
      isWithinRange(row.completed_at, currentWindowStart)
  );
  const paidUserIds = buildUserIdSet(subscriptionRows, (row) =>
    isActivePaidSubscription(row)
  );
  const freeUserIds = differenceUserSet(allUserIds, paidUserIds);
  const inactiveUserIds = differenceUserSet(allUserIds, activeUserIds);
  const newUsersWindowStart = currentWindowStart ?? comparisonWindowStart;
  const newUserIds = new Set(
    profilesRows
      .filter(
        (profile) =>
          typeof profile.created_at === 'string' &&
          isWithinRange(profile.created_at, newUsersWindowStart)
      )
      .map((profile) => profile.id)
  );
  const returningUserIds = differenceUserSet(allUserIds, newUserIds);
  const startedModuleUserIds = moduleProgressResult.available
    ? buildUserIdSet(moduleProgressResult.rows, (row) =>
        isWithinRange(row.updated_at, currentWindowStart)
      )
    : buildUserIdSet(
        readingSessionsRows
          .filter(
            (row): row is Record<string, string | boolean | null> =>
              typeof row.user_id === 'string' && typeof row.last_active_at === 'string'
          )
          .map((row) => ({
            user_id: row.user_id as string,
            timestamp: row.last_active_at as string
          })),
        (row) => isWithinRange(row.timestamp, currentWindowStart)
      );
  const notStartedModuleUserIds = differenceUserSet(allUserIds, startedModuleUserIds);

  const toDeltaPct = (current: number, previous: number) => {
    if (previous === 0) {
      return current === 0 ? 0 : 100;
    }

    return ((current - previous) / previous) * 100;
  };

  const recentTopicActivityRows: TopicActivityRow[] = [];
  pushTopicTimestampedActivity(
    recentTopicActivityRows,
    readingSessionsRows,
    'last_active_at'
  );
  pushTopicTimestampedActivity(
    recentTopicActivityRows,
    topicProgressRows,
    'last_activity_at'
  );
  pushTopicTimestampedActivity(
    recentTopicActivityRows,
    moduleProgressResult.rows as Array<Record<string, unknown>>,
    'updated_at'
  );
  pushTopicTimestampedActivity(
    recentTopicActivityRows,
    lessonHistoryRows as Array<Record<string, unknown>>,
    'read_at'
  );

  const topicStatsMap = new Map<
    string,
    {
      label: string;
      activeUsers: Set<string>;
      lessonCompletions: number;
      moduleCompletions: number;
    }
  >();

  recentTopicActivityRows
    .filter((entry) => isWithinRange(entry.timestamp, currentWindowStart))
    .forEach((entry) => {
      const current = topicStatsMap.get(entry.topic) ?? {
        label: toTopicLabel(entry.topic),
        activeUsers: new Set<string>(),
        lessonCompletions: 0,
        moduleCompletions: 0
      };

      current.activeUsers.add(entry.user_id);
      topicStatsMap.set(entry.topic, current);
    });

  lessonHistoryRows
    .filter((entry) => isWithinRange(entry.read_at, currentWindowStart))
    .forEach((entry) => {
      const current = topicStatsMap.get(entry.topic) ?? {
        label: toTopicLabel(entry.topic),
        activeUsers: new Set<string>(),
        lessonCompletions: 0,
        moduleCompletions: 0
      };

      current.lessonCompletions += 1;
      topicStatsMap.set(entry.topic, current);
    });

  moduleCompletionRows
    .filter(
      (entry) =>
        typeof entry.completed_at === 'string' &&
        isWithinRange(entry.completed_at, currentWindowStart)
    )
    .forEach((entry) => {
      const current = topicStatsMap.get(entry.topic) ?? {
        label: toTopicLabel(entry.topic),
        activeUsers: new Set<string>(),
        lessonCompletions: 0,
        moduleCompletions: 0
      };

      current.moduleCompletions += 1;
      topicStatsMap.set(entry.topic, current);
    });

  const topicStats: AdminAnalyticsTopicStat[] = Array.from(topicStatsMap.entries())
    .map(([topic, stat]) => ({
      topic,
      label: stat.label,
      activeUsers: stat.activeUsers.size,
      lessonCompletions: stat.lessonCompletions,
      moduleCompletions: stat.moduleCompletions
    }))
    .sort((left, right) => {
      if (right.activeUsers !== left.activeUsers) {
        return right.activeUsers - left.activeUsers;
      }

      if (right.lessonCompletions !== left.lessonCompletions) {
        return right.lessonCompletions - left.lessonCompletions;
      }

      if (right.moduleCompletions !== left.moduleCompletions) {
        return right.moduleCompletions - left.moduleCompletions;
      }

      return left.label.localeCompare(right.label);
    });

  const decisionTrees: AdminAnalyticsDecisionTree[] = [
    {
      id: 'paid_vs_free',
      title: 'Paid vs Free',
      description: 'See how monetization segments convert into real learning outcomes.',
      windowLabel:
        period === 'all_time'
          ? 'Lifetime outcomes'
          : analyticsPeriodLabel(config.summaryLabel),
      rootLabel: 'Total users',
      rootCount: totalUsers,
      rootHelper: 'Entire user base',
      segments: [
        buildTreeSegment({
          id: 'paid_users',
          label: 'Paid users',
          helper: 'Active or trialing paid subscriptions',
          accent: 'teal',
          users: paidUserIds,
          totalUsers,
          theoryCompletedUsers: theoryCompletedUserIds,
          taskCompletedUsers: taskCompletedUserIds
        }),
        buildTreeSegment({
          id: 'free_users',
          label: 'Free users',
          helper: 'Users without an active paid subscription',
          accent: 'blue',
          users: freeUserIds,
          totalUsers,
          theoryCompletedUsers: theoryCompletedUserIds,
          taskCompletedUsers: taskCompletedUserIds
        })
      ]
    },
    {
      id: 'active_vs_inactive',
      title: 'Active vs Inactive',
      description: 'Understand how recent engagement separates the user base.',
      windowLabel:
        period === 'all_time'
          ? 'Lifetime activity'
          : analyticsPeriodLabel(config.summaryLabel),
      rootLabel: 'Total users',
      rootCount: totalUsers,
      rootHelper: 'Entire user base',
      segments: [
        buildTreeSegment({
          id: 'active_users',
          label: 'Active users',
          helper: `Users active in ${config.summaryLabel}`,
          accent: 'brand',
          users: activeUserIds,
          totalUsers,
          theoryCompletedUsers: theoryCompletedUserIds,
          taskCompletedUsers: taskCompletedUserIds
        }),
        buildTreeSegment({
          id: 'inactive_users',
          label: 'Inactive users',
          helper: `No qualifying activity in ${config.summaryLabel}`,
          accent: 'slate',
          users: inactiveUserIds,
          totalUsers,
          theoryCompletedUsers: theoryCompletedUserIds,
          taskCompletedUsers: taskCompletedUserIds
        })
      ]
    },
    {
      id: 'new_vs_returning',
      title: 'New vs Returning',
      description: 'Compare recently acquired users against the rest of the base.',
      windowLabel:
        period === 'all_time'
          ? 'Recent acquisition view (last 30 days)'
          : analyticsPeriodLabel(config.summaryLabel),
      rootLabel: 'Total users',
      rootCount: totalUsers,
      rootHelper: 'Entire user base',
      segments: [
        buildTreeSegment({
          id: 'new_users',
          label: 'New users',
          helper:
            period === 'all_time'
              ? 'Joined in the last 30 days'
              : `Joined in ${config.summaryLabel}`,
          accent: 'amber',
          users: newUserIds,
          totalUsers,
          theoryCompletedUsers: theoryCompletedUserIds,
          taskCompletedUsers: taskCompletedUserIds
        }),
        buildTreeSegment({
          id: 'returning_users',
          label: 'Returning users',
          helper:
            period === 'all_time'
              ? 'Joined before the last 30 days'
              : 'Created before the selected period',
          accent: 'violet',
          users: returningUserIds,
          totalUsers,
          theoryCompletedUsers: theoryCompletedUserIds,
          taskCompletedUsers: taskCompletedUserIds
        })
      ]
    },
    {
      id: 'started_vs_not_started',
      title: 'Started a Module vs Did Not Start',
      description:
        'See how starting the learning journey changes downstream performance.',
      windowLabel:
        period === 'all_time'
          ? 'Lifetime start signals'
          : analyticsPeriodLabel(config.summaryLabel),
      rootLabel: 'Total users',
      rootCount: totalUsers,
      rootHelper: 'Entire user base',
      segments: [
        buildTreeSegment({
          id: 'started_module',
          label: 'Started a module',
          helper: `Touched theory or module progress in ${config.summaryLabel}`,
          accent: 'blue',
          users: startedModuleUserIds,
          totalUsers,
          theoryCompletedUsers: theoryCompletedUserIds,
          taskCompletedUsers: taskCompletedUserIds
        }),
        buildTreeSegment({
          id: 'did_not_start',
          label: 'Did not start',
          helper: 'No module start signal in the selected window',
          accent: 'slate',
          users: notStartedModuleUserIds,
          totalUsers,
          theoryCompletedUsers: theoryCompletedUserIds,
          taskCompletedUsers: taskCompletedUserIds
        })
      ]
    },
    {
      id: 'theory_vs_tasks',
      title: 'Theory Completers vs Task Completers',
      description: 'Compare the two key outcome cohorts side by side.',
      windowLabel:
        period === 'all_time'
          ? 'Lifetime completion cohorts'
          : analyticsPeriodLabel(config.summaryLabel),
      note: 'These cohorts can overlap. A user can appear in both branches.',
      rootLabel: 'Total users',
      rootCount: totalUsers,
      rootHelper: 'Entire user base',
      segments: [
        buildTreeSegment({
          id: 'theory_completers',
          label: 'Completed theory',
          helper: `Users with a module completion in ${config.summaryLabel}`,
          accent: 'orange',
          users: theoryCompletedUserIds,
          totalUsers,
          theoryCompletedUsers: theoryCompletedUserIds,
          taskCompletedUsers: taskCompletedUserIds
        }),
        buildTreeSegment({
          id: 'task_completers',
          label: 'Completed tasks',
          helper: `Users with a completed task in ${config.summaryLabel}`,
          accent: 'rose',
          users: taskCompletedUserIds,
          totalUsers,
          theoryCompletedUsers: theoryCompletedUserIds,
          taskCompletedUsers: taskCompletedUserIds
        })
      ]
    }
  ];

  const trendByBucket = new Map(trend.map((entry) => [entry.bucketStart, entry]));
  const activeUsersByBucket = new Map<string, Set<string>>();

  profilesRows.forEach((profile) => {
    if (!profile.created_at) {
      return;
    }

    const bucket = trend.find(
      (entry) =>
        profile.created_at! >= entry.bucketStart && profile.created_at! < entry.bucketEnd
    );
    if (bucket) {
      bucket.newUsers += 1;
    }
  });

  recentActivityRows.forEach((row) => {
    const bucket = trend.find(
      (entry) => row.timestamp >= entry.bucketStart && row.timestamp < entry.bucketEnd
    );
    if (!bucket) {
      return;
    }

    const users = activeUsersByBucket.get(bucket.bucketStart) ?? new Set<string>();
    users.add(row.user_id);
    activeUsersByBucket.set(bucket.bucketStart, users);
  });

  lessonHistoryRows.forEach((entry) => {
    const bucket = trend.find(
      (point) => entry.read_at >= point.bucketStart && entry.read_at < point.bucketEnd
    );
    if (bucket) {
      bucket.lessonCompletions += 1;
    }
  });

  subscriptionRows
    .filter((row) => isPaidSubscription(row))
    .forEach((row) => {
      const bucket = trend.find(
        (point) => row.created_at >= point.bucketStart && row.created_at < point.bucketEnd
      );
      if (bucket) {
        bucket.sales += 1;
      }
    });

  trend.forEach((entry) => {
    entry.activeUsers = activeUsersByBucket.get(entry.bucketStart)?.size ?? 0;
  });

  const sessionDurationByBucket = new Map<
    string,
    { totalSeconds: number; count: number }
  >();
  readingSessionsRows.forEach((row) => {
    const lastActiveAt =
      typeof row.last_active_at === 'string' ? row.last_active_at : null;
    const activeSeconds = parseSessionSeconds(row);

    if (!lastActiveAt || activeSeconds == null) {
      return;
    }

    const bucket = trend.find(
      (point) => lastActiveAt >= point.bucketStart && lastActiveAt < point.bucketEnd
    );

    if (!bucket) {
      return;
    }

    const current = sessionDurationByBucket.get(bucket.bucketStart) ?? {
      totalSeconds: 0,
      count: 0
    };
    current.totalSeconds += activeSeconds;
    current.count += 1;
    sessionDurationByBucket.set(bucket.bucketStart, current);
  });

  const sessionDurationTrendSeconds = trend.map((point) => {
    const aggregate = sessionDurationByBucket.get(point.bucketStart);

    if (!aggregate || aggregate.count === 0) {
      return 0;
    }

    return Math.round(aggregate.totalSeconds / aggregate.count);
  });

  const taskDurationByBucket = new Map<string, { totalSeconds: number; count: number }>();
  taskRows.forEach((row) => {
    const completedAt = typeof row.completed_at === 'string' ? row.completed_at : null;
    const durationSeconds = parseTaskDurationSeconds(row);

    if (!completedAt || durationSeconds == null) {
      return;
    }

    const bucket = trend.find(
      (point) => completedAt >= point.bucketStart && completedAt < point.bucketEnd
    );
    if (!bucket) {
      return;
    }

    const current = taskDurationByBucket.get(bucket.bucketStart) ?? {
      totalSeconds: 0,
      count: 0
    };
    current.totalSeconds += durationSeconds;
    current.count += 1;
    taskDurationByBucket.set(bucket.bucketStart, current);
  });

  const taskDurationTrendSeconds = trend.map((point) => {
    const aggregate = taskDurationByBucket.get(point.bucketStart);
    if (!aggregate || aggregate.count === 0) {
      return 0;
    }

    return Math.round(aggregate.totalSeconds / aggregate.count);
  });

  const platformTimeTrendSeconds = trend.map(
    (point) =>
      platformTimeStatsInRange(
        readingSessionsRows,
        taskRows,
        point.bucketStart,
        point.bucketEnd
      ).averageSeconds
  );

  const totalUsersBase =
    totalUsers - trend.reduce((sum, point) => sum + point.newUsers, 0);
  let runningUsersTotal = totalUsersBase;
  const totalUserTrend = trend.map((point) => {
    runningUsersTotal += point.newUsers;
    return runningUsersTotal;
  });

  const paidSalesTotal =
    subscriptionRows.filter((row) => isPaidSubscription(row)).length -
    trend.reduce((sum, point) => sum + point.sales, 0);
  let runningSalesTotal = paidSalesTotal;
  const paidSalesTrend = trend.map((point) => {
    runningSalesTotal += point.sales;
    return runningSalesTotal;
  });

  const usersInSelectedWindow =
    currentWindowStart == null
      ? countProfilesInRange(profilesRows, comparisonWindowStart)
      : newUsers;
  const totalUsersMetricValue =
    period === 'all_time' ? totalUsers : usersInSelectedWindow;
  const totalUsersMetricLabel = period === 'all_time' ? 'Total users' : 'Users in period';
  const totalUsersMetricHelper =
    period === 'all_time'
      ? 'All profiles created in the platform.'
      : `Profiles created in ${config.summaryLabel}.`;
  const totalUsersMetricTrend =
    period === 'all_time' ? totalUserTrend : trend.map((point) => point.newUsers);

  const metrics: AdminAnalyticsKpi[] = [
    {
      id: 'total_users',
      label: totalUsersMetricLabel,
      value: totalUsersMetricValue,
      displayValue: formatWholeNumber(totalUsersMetricValue),
      helper: totalUsersMetricHelper,
      deltaValue: toDeltaPct(usersInSelectedWindow, previousUsers),
      deltaLabel: config.comparisonLabel,
      trendValues: totalUsersMetricTrend
    },
    {
      id: 'active_users',
      label: period === 'all_time' ? 'Engaged users' : 'Active users',
      value: activeUsers,
      displayValue: formatWholeNumber(activeUsers),
      helper:
        period === 'all_time'
          ? 'Users who have ever generated real learning or progress activity.'
          : `Users with meaningful learning activity in ${config.summaryLabel}.`,
      deltaValue: toDeltaPct(activeUsers, previousActiveUsers),
      deltaLabel: config.comparisonLabel,
      trendValues: trend.map((point) => point.activeUsers)
    },
    {
      id: 'active_subscriptions',
      label: 'Subscriptions',
      value: activeSubscriptions,
      displayValue: formatWholeNumber(activeSubscriptions),
      helper: 'Currently active or trialing paid subscriptions.',
      deltaValue: toDeltaPct(sales, previousSales),
      deltaLabel: config.comparisonLabel,
      trendValues: paidSalesTrend
    },
    {
      id: 'sales',
      label: 'Sales',
      value: sales * PRO_MONTHLY_PRICE_EUR,
      displayValue: formatEuro(sales * PRO_MONTHLY_PRICE_EUR),
      helper:
        period === 'all_time'
          ? 'Estimated subscription revenue recorded to date.'
          : `Estimated subscription revenue in ${config.summaryLabel}.`,
      deltaValue: toDeltaPct(sales, previousSales),
      deltaLabel: config.comparisonLabel,
      trendValues: trend.map((point) => point.sales * PRO_MONTHLY_PRICE_EUR)
    },
    {
      id: 'average_session_duration',
      label: 'Avg session duration',
      value: averageSessionDurationSeconds,
      displayValue: formatDurationShort(averageSessionDurationSeconds),
      helper:
        period === 'all_time'
          ? 'Average reading session length across all tracked sessions.'
          : `Average reading session length in ${config.summaryLabel}.`,
      deltaValue: toDeltaPct(
        averageSessionDurationSeconds,
        previousAverageSessionDurationSeconds
      ),
      deltaLabel: config.comparisonLabel,
      trendValues: sessionDurationTrendSeconds
    },
    {
      id: 'average_platform_time',
      label: 'Avg time in stableGrid',
      value: averagePlatformTimeSeconds,
      displayValue: formatDurationShort(averagePlatformTimeSeconds),
      helper: hasPlatformSamplesInPeriod
        ? `Estimated active time per user in ${config.summaryLabel} (sessions + tasks).`
        : 'No activity in selected period; showing latest baseline active time per user.',
      deltaValue: toDeltaPct(
        averagePlatformTimeSeconds,
        previousAveragePlatformTimeSeconds
      ),
      deltaLabel: config.comparisonLabel,
      trendValues: platformTimeTrendSeconds
    },
    {
      id: 'average_task_time',
      label: 'Avg task time',
      value: averageTaskTimeSeconds,
      displayValue: formatDurationShort(averageTaskTimeSeconds),
      helper: hasTaskSamplesInPeriod
        ? period === 'all_time'
          ? 'Average time spent to complete a task.'
          : `Average time spent to complete tasks in ${config.summaryLabel}.`
        : 'No completed tasks in selected period; showing latest baseline average task time.',
      deltaValue: toDeltaPct(averageTaskTimeSeconds, previousAverageTaskTimeSeconds),
      deltaLabel: config.comparisonLabel,
      trendValues: taskDurationTrendSeconds
    },
    {
      id: 'new_users',
      label: period === 'all_time' ? 'Users acquired' : 'New users',
      value: newUsers,
      displayValue: formatWholeNumber(newUsers),
      helper:
        period === 'all_time'
          ? 'All users acquired to date.'
          : `Fresh signups in ${config.summaryLabel}.`
    },
    {
      id: 'engaged_users',
      label: 'Engaged users',
      value: engagedUsers,
      displayValue: formatWholeNumber(engagedUsers),
      helper: 'Users who have ever generated real learning or progress activity.'
    },
    {
      id: 'lesson_completions',
      label: 'Lesson completions',
      value: lessonCompletions,
      displayValue: formatWholeNumber(lessonCompletions),
      helper: `Completed lesson reads in ${config.summaryLabel}.`,
      deltaValue: toDeltaPct(lessonCompletions, previousLessonCompletions),
      deltaLabel: config.comparisonLabel,
      trendValues: trend.map((point) => point.lessonCompletions)
    },
    {
      id: 'module_completions',
      label: 'Module completions',
      value: moduleCompletions,
      displayValue: formatWholeNumber(moduleCompletions),
      helper: `Completed modules in ${config.summaryLabel}.`
    },
    {
      id: 'tasks_completed',
      label: 'Tasks completed',
      value: tasksCompleted,
      displayValue: formatWholeNumber(tasksCompleted),
      helper:
        period === 'all_time'
          ? 'All completed activation tasks.'
          : `Completed activation tasks in ${config.summaryLabel}.`
    },
    {
      id: 'task_completion_rate',
      label: 'Task completion rate',
      value: taskCompletionRatePct,
      displayValue: formatPercent(taskCompletionRatePct),
      helper: 'Completed activation tasks as a share of all assigned tasks.'
    },
    {
      id: 'open_tasks',
      label: 'Open tasks',
      value: openTasks,
      displayValue: formatWholeNumber(openTasks),
      helper: 'Tasks still sitting in todo or in progress.'
    }
  ];

  return {
    generatedAt,
    period,
    periodLabel: config.label,
    totalUsers,
    activeUsers,
    newUsers,
    engagedUsers,
    lessonCompletions,
    moduleCompletions,
    tasksCompleted,
    taskCompletionRatePct,
    openTasks,
    activeSubscriptions,
    sales,
    metrics,
    trend: trend.map(({ bucketEnd: _bucketEnd, ...entry }) => entry),
    topicStats,
    decisionTrees
  };
};

export const listAdminFinancials = async (
  supabase: SupabaseClient
): Promise<AdminFinancialsSnapshot> => {
  const generatedAt = new Date();
  const currentWindowStartDate = startOfUtcDay(generatedAt);
  currentWindowStartDate.setUTCDate(
    currentWindowStartDate.getUTCDate() - (FINANCIALS_WINDOW_DAYS - 1)
  );
  const previousWindowStartDate = new Date(currentWindowStartDate);
  previousWindowStartDate.setUTCDate(
    previousWindowStartDate.getUTCDate() - FINANCIALS_WINDOW_DAYS
  );
  const currentWindowStartIso = currentWindowStartDate.toISOString();
  const previousWindowStartIso = previousWindowStartDate.toISOString();
  const currentWindowEndIso = generatedAt.toISOString();

  const [subscriptionsResult, profilesResult] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('user_id,plan,status,stripe_sub_id,created_at,updated_at')
      .gte('created_at', previousWindowStartIso)
      .lte('created_at', currentWindowEndIso),
    supabase
      .from('profiles')
      .select('id,created_at')
      .gte('created_at', previousWindowStartIso)
  ]);

  assertSuccess(subscriptionsResult.error);
  assertSuccess(profilesResult.error);

  const subscriptions = (
    (subscriptionsResult.data ?? []) as SubscriptionAnalyticsRow[]
  ).filter((row) => isPaidSubscription(row));
  const profiles = (profilesResult.data ?? []) as ProfileRow[];

  const isWithinRange = (value: string, start: string, end: string) =>
    value >= start && value < end;
  const currentWindowEndDate = new Date(currentWindowStartDate);
  currentWindowEndDate.setUTCDate(
    currentWindowEndDate.getUTCDate() + FINANCIALS_WINDOW_DAYS
  );
  const currentWindowEndNormalizedIso = currentWindowEndDate.toISOString();
  const previousWindowEndIso = currentWindowStartIso;

  const currentOrders = subscriptions.filter((row) =>
    isWithinRange(row.created_at, currentWindowStartIso, currentWindowEndNormalizedIso)
  );
  const previousOrders = subscriptions.filter((row) =>
    isWithinRange(row.created_at, previousWindowStartIso, previousWindowEndIso)
  );

  const currentRevenue = currentOrders.length * PRO_MONTHLY_PRICE_EUR;
  const previousRevenue = previousOrders.length * PRO_MONTHLY_PRICE_EUR;
  const currentNewUsers = profiles.filter(
    (row) =>
      typeof row.created_at === 'string' &&
      isWithinRange(row.created_at, currentWindowStartIso, currentWindowEndNormalizedIso)
  ).length;
  const previousNewUsers = profiles.filter(
    (row) =>
      typeof row.created_at === 'string' &&
      isWithinRange(row.created_at, previousWindowStartIso, previousWindowEndIso)
  ).length;

  const currentRefundOrders = currentOrders.filter((row) =>
    REFUND_SUBSCRIPTION_STATUSES.has(row.status)
  ).length;
  const previousRefundOrders = previousOrders.filter((row) =>
    REFUND_SUBSCRIPTION_STATUSES.has(row.status)
  ).length;

  const toRate = (numerator: number, denominator: number) =>
    denominator > 0 ? (numerator / denominator) * 100 : 0;
  const toChangePct = (current: number, previous: number) => {
    if (previous <= 0) {
      return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
  };
  const formatRate = (value: number) => `${value.toFixed(1)}%`;

  const currentAvgOrderValue =
    currentOrders.length > 0 ? currentRevenue / currentOrders.length : 0;
  const previousAvgOrderValue =
    previousOrders.length > 0 ? previousRevenue / previousOrders.length : 0;
  const currentConversionRate = toRate(currentOrders.length, currentNewUsers);
  const previousConversionRate = toRate(previousOrders.length, previousNewUsers);
  const currentRefundRate = toRate(currentRefundOrders, currentOrders.length);
  const previousRefundRate = toRate(previousRefundOrders, previousOrders.length);

  const dayBuckets: Array<AdminFinancialsTrendPoint & { bucketEnd: string }> = Array.from(
    { length: FINANCIALS_WINDOW_DAYS },
    (_, index) => {
      const bucketStartDate = new Date(currentWindowStartDate);
      bucketStartDate.setUTCDate(currentWindowStartDate.getUTCDate() + index);
      const bucketEndDate = new Date(bucketStartDate);
      bucketEndDate.setUTCDate(bucketStartDate.getUTCDate() + 1);

      return {
        bucketStart: bucketStartDate.toISOString(),
        label: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
          bucketStartDate
        ),
        revenue: 0,
        orders: 0,
        bucketEnd: bucketEndDate.toISOString()
      } as AdminFinancialsTrendPoint & { bucketEnd: string };
    }
  );

  currentOrders.forEach((order) => {
    const bucket = dayBuckets.find(
      (point) =>
        order.created_at >= point.bucketStart && order.created_at < point.bucketEnd
    );

    if (!bucket) {
      return;
    }

    bucket.orders += 1;
    bucket.revenue += PRO_MONTHLY_PRICE_EUR;
  });

  const kpis: AdminFinancialsKpi[] = [
    {
      id: 'total_orders',
      label: 'Total Orders',
      value: currentOrders.length,
      displayValue: formatWholeNumber(currentOrders.length),
      changePct: toChangePct(currentOrders.length, previousOrders.length)
    },
    {
      id: 'avg_order_value',
      label: 'Avg Order Value',
      value: currentAvgOrderValue,
      displayValue: formatEuroDetailed(currentAvgOrderValue),
      changePct: toChangePct(currentAvgOrderValue, previousAvgOrderValue)
    },
    {
      id: 'conversion_rate',
      label: 'Conversion Rate',
      value: currentConversionRate,
      displayValue: formatRate(currentConversionRate),
      changePct: toChangePct(currentConversionRate, previousConversionRate)
    },
    {
      id: 'refund_rate',
      label: 'Refund Rate',
      value: currentRefundRate,
      displayValue: formatRate(currentRefundRate),
      changePct: toChangePct(currentRefundRate, previousRefundRate)
    }
  ];

  return {
    generatedAt: generatedAt.toISOString(),
    periodLabel: 'Last 30 days',
    monthlyRevenue: currentRevenue,
    previousMonthlyRevenue: previousRevenue,
    heroTrend: dayBuckets
      .slice(-FINANCIALS_HERO_POINTS)
      .map(({ bucketEnd: _bucketEnd, ...point }) => point),
    dailyRevenue: dayBuckets.map(({ bucketEnd: _bucketEnd, ...point }) => point),
    kpis
  };
};

export const listAdminCustomers = async (
  supabase: SupabaseClient
): Promise<AdminCustomerRecord[]> => {
  const [profilesResult, subscriptionsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,name,email,created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('subscriptions')
      .select('user_id,plan,status,stripe_sub_id,created_at,updated_at')
  ]);

  assertSuccess(profilesResult.error);
  assertSuccess(subscriptionsResult.error);

  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionAnalyticsRow[];
  const paidSubscriptionsByUser = new Map<string, SubscriptionAnalyticsRow[]>();

  subscriptions.forEach((subscription) => {
    if (!isPaidSubscription(subscription)) {
      return;
    }

    const current = paidSubscriptionsByUser.get(subscription.user_id) ?? [];
    current.push(subscription);
    paidSubscriptionsByUser.set(subscription.user_id, current);
  });

  return profiles.map((profile) => {
    const email = profile.email?.trim() ?? '';
    const fallbackName = email ? email.split('@')[0] : `User ${profile.id.slice(0, 8)}`;
    const fullName = profile.name?.trim() || fallbackName;
    const paidSubscriptions = paidSubscriptionsByUser.get(profile.id) ?? [];
    const status: AdminCustomerRecord['status'] = paidSubscriptions.some((row) =>
      isActivePaidSubscription(row)
    )
      ? 'Active'
      : 'Inactive';
    const orders = paidSubscriptions.length;
    const totalSpent = orders * PRO_MONTHLY_PRICE_EUR;

    return {
      id: profile.id,
      fullName,
      email,
      status,
      joinedAt: profile.created_at ?? new Date(0).toISOString(),
      orders,
      totalSpent,
      initials: buildInitials(fullName)
    };
  });
};

const loadProfilesMap = async (supabase: SupabaseClient, userIds: string[]) => {
  const profileMap = new Map<string, ProfileRow>();
  if (userIds.length === 0) {
    return profileMap;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,email')
    .in('id', userIds);
  assertSuccess(error);

  ((data ?? []) as ProfileRow[]).forEach((profile) => {
    profileMap.set(profile.id, profile);
  });

  return profileMap;
};

export const listAdminBugReports = async (
  supabase: SupabaseClient
): Promise<AdminBugReportRecord[]> => {
  const bugReportsResult = await readOptionalRows<BugReportRow>(
    supabase
      .from('bug_reports')
      .select(
        'id,user_id,email,title,details,page_url,user_agent,status,created_at,updated_at'
      )
      .order('created_at', { ascending: false })
  );

  if (!bugReportsResult.available) {
    return [];
  }

  const rows = bugReportsResult.rows.filter((row) => isBugReportDbStatus(row.status));
  const profileMap = await loadProfilesMap(
    supabase,
    Array.from(new Set(rows.map((row) => row.user_id)))
  );

  return rows.map((row) => mapBugReportRow(row, profileMap));
};

export const updateAdminBugReportStatus = async ({
  supabase,
  reportId,
  status
}: {
  supabase: SupabaseClient;
  reportId: string;
  status: AdminBugStatusDb;
}): Promise<{
  before: AdminBugReportRecord;
  after: AdminBugReportRecord;
}> => {
  if (!isBugReportDbStatus(status)) {
    throw new AdminServiceError('Bug status is invalid.', 422);
  }

  const { data: beforeRaw, error: beforeError } = await supabase
    .from('bug_reports')
    .select(
      'id,user_id,email,title,details,page_url,user_agent,status,created_at,updated_at'
    )
    .eq('id', reportId)
    .maybeSingle();
  assertSuccess(beforeError);

  const beforeRow = beforeRaw as BugReportRow | null;
  if (!beforeRow || !isBugReportDbStatus(beforeRow.status)) {
    throw new AdminServiceError('Bug report not found.', 404);
  }

  const { data: afterRaw, error: afterError } = await supabase
    .from('bug_reports')
    .update({
      status
    })
    .eq('id', reportId)
    .select(
      'id,user_id,email,title,details,page_url,user_agent,status,created_at,updated_at'
    )
    .single();
  assertSuccess(afterError);

  const afterRow = afterRaw as BugReportRow;
  if (!isBugReportDbStatus(afterRow.status)) {
    throw new AdminServiceError('Bug status is invalid.', 500);
  }

  const profileMap = await loadProfilesMap(supabase, [beforeRow.user_id]);

  return {
    before: mapBugReportRow(beforeRow, profileMap),
    after: mapBugReportRow(afterRow, profileMap)
  };
};

export const listAdminFeedbackRecords = async (
  supabase: SupabaseClient
): Promise<AdminFeedbackRecord[]> => {
  const [bugReportsResult, lightbulbEventsResult] = await Promise.all([
    readOptionalRows<BugReportRow>(
      supabase
        .from('bug_reports')
        .select(
          'id,user_id,email,title,details,page_url,user_agent,status,created_at,updated_at'
        )
        .order('created_at', { ascending: false })
    ),
    readOptionalRows<ProductFunnelEventRow>(
      supabase
        .from('product_funnel_events')
        .select('id,session_id,user_id,event_name,path,metadata,occurred_at,created_at')
        .eq('event_name', LIGHTBULB_EVENT_NAME)
        .order('occurred_at', { ascending: false })
    )
  ]);

  const bugRows = bugReportsResult.rows.filter((row) => isBugReportDbStatus(row.status));
  const lightbulbRows = lightbulbEventsResult.rows.filter(
    (row) => row.event_name === LIGHTBULB_EVENT_NAME
  );

  const profileMap = await loadProfilesMap(
    supabase,
    Array.from(
      new Set(
        [
          ...bugRows.map((row) => row.user_id),
          ...lightbulbRows.map((row) => row.user_id)
        ].filter(
          (value): value is string => typeof value === 'string' && value.length > 0
        )
      )
    )
  );

  const [bugTriageMap, lightbulbTriageMap] = await Promise.all([
    loadFeedbackTriageMap({
      supabase,
      sourceIds: bugRows.map((row) => row.id),
      sourceType: 'bug_report'
    }),
    loadFeedbackTriageMap({
      supabase,
      sourceIds: lightbulbRows.map((row) => row.id),
      sourceType: 'lightbulb_feedback'
    })
  ]);

  return [
    ...bugRows.map((row) =>
      mapBugReportRowToAdminFeedback({
        row,
        profileById: profileMap,
        triageRow: bugTriageMap.get(toFeedbackTriageKey('bug_report', row.id)) ?? null
      })
    ),
    ...lightbulbRows.map((row) =>
      mapProductFunnelEventToAdminFeedback({
        row,
        profileById: profileMap,
        triageRow:
          lightbulbTriageMap.get(toFeedbackTriageKey('lightbulb_feedback', row.id)) ??
          null
      })
    )
  ].sort(
    (left, right) =>
      new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()
  );
};

export const getAdminFeedbackRecord = async ({
  sourceId,
  sourceType,
  supabase
}: {
  sourceId: string;
  sourceType: AdminFeedbackSourceType;
  supabase: SupabaseClient;
}): Promise<AdminFeedbackRecord | null> => {
  if (sourceType === 'bug_report') {
    const bugResult = await readOptionalMaybeSingle<BugReportRow>(
      supabase
        .from('bug_reports')
        .select(
          'id,user_id,email,title,details,page_url,user_agent,status,created_at,updated_at'
        )
        .eq('id', sourceId)
        .maybeSingle()
    );

    const row = bugResult.row;
    if (!row || !isBugReportDbStatus(row.status)) {
      return null;
    }

    const profileMap = await loadProfilesMap(supabase, [row.user_id]);
    const triageRow = await getFeedbackTriageRow({
      supabase,
      sourceId,
      sourceType
    });

    return mapBugReportRowToAdminFeedback({
      row,
      profileById: profileMap,
      triageRow
    });
  }

  const eventResult = await readOptionalMaybeSingle<ProductFunnelEventRow>(
    supabase
      .from('product_funnel_events')
      .select('id,session_id,user_id,event_name,path,metadata,occurred_at,created_at')
      .eq('id', sourceId)
      .eq('event_name', LIGHTBULB_EVENT_NAME)
      .maybeSingle()
  );

  const row = eventResult.row;
  if (!row || row.event_name !== LIGHTBULB_EVENT_NAME) {
    return null;
  }

  const profileMap = await loadProfilesMap(supabase, row.user_id ? [row.user_id] : []);
  const triageRow = await getFeedbackTriageRow({
    supabase,
    sourceId,
    sourceType
  });

  return mapProductFunnelEventToAdminFeedback({
    row,
    profileById: profileMap,
    triageRow
  });
};

export const updateAdminFeedbackRecord = async ({
  actorUserId,
  adminNotes,
  sourceId,
  sourceType,
  status,
  supabase
}: {
  actorUserId: string;
  adminNotes: string;
  sourceId: string;
  sourceType: AdminFeedbackSourceType;
  status: AdminFeedbackStatus;
  supabase: SupabaseClient;
}): Promise<{
  before: AdminFeedbackRecord;
  after: AdminFeedbackRecord;
}> => {
  const normalizedNotes = adminNotes.trim();
  if (normalizedNotes.length > 4000) {
    throw new AdminServiceError('Admin notes are too long.', 422);
  }

  const before = await getAdminFeedbackRecord({
    supabase,
    sourceId,
    sourceType
  });

  if (!before) {
    throw new AdminServiceError('Feedback record not found.', 404);
  }

  if (sourceType === 'bug_report') {
    const nextBugStatus = toBugStatusFromFeedbackStatus(status);

    if (nextBugStatus) {
      const { error } = await supabase
        .from('bug_reports')
        .update({
          status: nextBugStatus
        })
        .eq('id', sourceId);
      assertSuccess(error);
    }
  } else {
    const event = await readOptionalMaybeSingle<ProductFunnelEventRow>(
      supabase
        .from('product_funnel_events')
        .select('id')
        .eq('id', sourceId)
        .eq('event_name', LIGHTBULB_EVENT_NAME)
        .maybeSingle()
    );

    if (!event.row) {
      throw new AdminServiceError('Feedback record not found.', 404);
    }
  }

  await upsertFeedbackTriage({
    supabase,
    adminNotes: normalizedNotes,
    actorUserId,
    sourceId,
    sourceType,
    status
  });

  const after = await getAdminFeedbackRecord({
    supabase,
    sourceId,
    sourceType
  });

  if (!after) {
    throw new AdminServiceError('Feedback record not found after update.', 500);
  }

  return {
    before,
    after
  };
};

export const searchAdminUsers = async (
  supabase: SupabaseClient,
  rawQuery: string
): Promise<AdminUserSearchResult[]> => {
  const query = escapeLikeQuery(rawQuery);
  if (query.length < 2) {
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,email')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .order('updated_at', { ascending: false })
    .limit(12);
  assertSuccess(error);

  return ((data ?? []) as ProfileRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email
  }));
};

export const getAdminUserProfile = async (
  supabase: SupabaseClient,
  userId: string
): Promise<AdminUserSearchResult | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,email')
    .eq('id', userId)
    .maybeSingle();
  assertSuccess(error);

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email
  };
};

export const getAdminActivationTaskSnapshot = async ({
  supabase,
  userId,
  taskId
}: {
  supabase: SupabaseClient;
  userId: string;
  taskId: string;
}): Promise<AdminActivationTaskSnapshot | null> => {
  const { data, error } = await supabase
    .from('user_activation_tasks')
    .select(
      'id,user_id,task_type,task_group,title,description,track_id,scope_type,requested_count,status,sort_order,created_at,started_at,completed_at,tracks:track_id(slug,title),user_activation_task_items(id,content_item_id,item_status,started_at,completed_at)'
    )
    .eq('id', taskId)
    .eq('user_id', userId)
    .maybeSingle();
  assertSuccess(error);

  if (!data) {
    return null;
  }

  return mapActivationTaskAuditRow(data as ActivationTaskAuditRow);
};

export const logAdminAudit = async ({
  supabase,
  actorUserId,
  targetUserId,
  entityType,
  entityId,
  action,
  beforeState,
  afterState
}: {
  supabase: SupabaseClient;
  actorUserId: string;
  targetUserId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  beforeState?: unknown;
  afterState?: unknown;
}) => {
  const { error } = await supabase.from('admin_audit_logs').insert({
    actor_user_id: actorUserId,
    target_user_id: targetUserId ?? null,
    entity_type: entityType,
    entity_id: entityId,
    action,
    before_state: toAuditJson(beforeState),
    after_state: toAuditJson(afterState)
  });
  assertSuccess(error);
};

export const listAdminAuditLogs = async (
  supabase: SupabaseClient,
  limit = 50
): Promise<AdminAuditEntry[]> => {
  const { data, error } = await supabase
    .from('admin_audit_logs')
    .select(
      'id,actor_user_id,target_user_id,entity_type,entity_id,action,before_state,after_state,created_at'
    )
    .order('created_at', { ascending: false })
    .limit(limit);
  assertSuccess(error);

  const rows = (data ?? []) as AdminAuditRow[];
  const userIds = Array.from(
    new Set(
      rows.flatMap((row) =>
        [row.actor_user_id, row.target_user_id].filter(
          (value): value is string => typeof value === 'string' && value.length > 0
        )
      )
    )
  );

  const profilesById = new Map<string, ProfileRow>();
  if (userIds.length > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id,name,email')
      .in('id', userIds);
    assertSuccess(profileError);

    ((profileData ?? []) as ProfileRow[]).forEach((profile) => {
      profilesById.set(profile.id, profile);
    });
  }

  return rows.map((row) => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    actorName: profilesById.get(row.actor_user_id)?.name ?? null,
    actorEmail: profilesById.get(row.actor_user_id)?.email ?? null,
    targetUserId: row.target_user_id,
    targetName: row.target_user_id
      ? profilesById.get(row.target_user_id)?.name ?? null
      : null,
    targetEmail: row.target_user_id
      ? profilesById.get(row.target_user_id)?.email ?? null
      : null,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    beforeState: row.before_state,
    afterState: row.after_state,
    createdAt: row.created_at
  }));
};
