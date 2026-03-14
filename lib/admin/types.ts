import type {
  ActivationBoardCard,
  ActivationBoardData,
  ActivationContentType,
  ActivationItemStatus,
  ActivationScopeType,
  ActivationTaskGroup,
  ActivationTaskStatus,
  ActivationTaskType
} from '@/lib/activation/service';
import type { TheoryDoc, TheorySection } from '@/types/theory';

export const ADMIN_ROLES = ['content_admin', 'super_admin'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_CONTENT_TYPES = [
  'theory_module',
  'flashcard',
  'notebook',
  'mission'
] as const;
export type AdminContentType = (typeof ADMIN_CONTENT_TYPES)[number];

export interface AdminMembership {
  userId: string;
  role: AdminRole;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTrackRecord {
  id: string;
  slug: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContentItemRecord {
  id: string;
  trackId: string | null;
  trackSlug: string | null;
  trackTitle: string | null;
  contentType: AdminContentType;
  sourceRef: string;
  title: string;
  sequenceOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCatalogData {
  tracks: AdminTrackRecord[];
  contentItems: AdminContentItemRecord[];
}

export interface AdminAnalyticsKpi {
  id:
    | 'total_users'
    | 'active_users'
    | 'new_users'
    | 'engaged_users'
    | 'lesson_completions'
    | 'module_completions'
    | 'tasks_completed'
    | 'task_completion_rate'
    | 'open_tasks'
    | 'active_subscriptions'
    | 'sales'
    | 'average_session_duration'
    | 'average_platform_time'
    | 'average_task_time';
  label: string;
  value: number;
  displayValue: string;
  helper: string;
  deltaValue?: number;
  deltaLabel?: string;
  trendValues?: number[];
}

export type AdminAnalyticsPeriod = 'all_time' | 'monthly' | 'weekly' | 'daily';

export interface AdminAnalyticsTrendPoint {
  bucketStart: string;
  label: string;
  newUsers: number;
  activeUsers: number;
  lessonCompletions: number;
  sales: number;
}

export interface AdminAnalyticsTopicStat {
  topic: string;
  label: string;
  activeUsers: number;
  lessonCompletions: number;
  moduleCompletions: number;
}

export type AdminAnalyticsTreeAccent =
  | 'brand'
  | 'teal'
  | 'blue'
  | 'amber'
  | 'violet'
  | 'slate'
  | 'orange'
  | 'rose';

export interface AdminAnalyticsTreeOutcome {
  id: 'theory_completion_rate' | 'task_completion_rate';
  label: string;
  ratePct: number;
  completedUsers: number;
  totalUsers: number;
  helper: string;
}

export interface AdminAnalyticsTreeSegment {
  id: string;
  label: string;
  count: number;
  sharePct: number;
  helper: string;
  accent: AdminAnalyticsTreeAccent;
  outcomes: AdminAnalyticsTreeOutcome[];
}

export interface AdminAnalyticsDecisionTree {
  id:
    | 'paid_vs_free'
    | 'active_vs_inactive'
    | 'new_vs_returning'
    | 'started_vs_not_started'
    | 'theory_vs_tasks';
  title: string;
  description: string;
  windowLabel: string;
  note?: string;
  rootLabel: string;
  rootCount: number;
  rootHelper: string;
  segments: [AdminAnalyticsTreeSegment, AdminAnalyticsTreeSegment];
}

export interface AdminAnalyticsSnapshot {
  generatedAt: string;
  period: AdminAnalyticsPeriod;
  periodLabel: string;
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  engagedUsers: number;
  lessonCompletions: number;
  moduleCompletions: number;
  tasksCompleted: number;
  taskCompletionRatePct: number;
  openTasks: number;
  activeSubscriptions: number;
  sales: number;
  metrics: AdminAnalyticsKpi[];
  trend: AdminAnalyticsTrendPoint[];
  topicStats: AdminAnalyticsTopicStat[];
  decisionTrees: AdminAnalyticsDecisionTree[];
}

export interface AdminFinancialsTrendPoint {
  bucketStart: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface AdminFinancialsKpi {
  id: 'total_orders' | 'avg_order_value' | 'conversion_rate' | 'refund_rate';
  label: string;
  value: number;
  displayValue: string;
  changePct: number;
}

export interface AdminFinancialsSnapshot {
  generatedAt: string;
  periodLabel: string;
  monthlyRevenue: number;
  previousMonthlyRevenue: number;
  heroTrend: AdminFinancialsTrendPoint[];
  dailyRevenue: AdminFinancialsTrendPoint[];
  kpis: AdminFinancialsKpi[];
}

export interface AdminCustomerRecord {
  id: string;
  fullName: string;
  email: string;
  status: 'Active' | 'Inactive';
  joinedAt: string;
  orders: number;
  totalSpent: number;
  initials: string;
}

export type AdminBugSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type AdminBugStatus = 'New' | 'In Review' | 'Resolved';
export type AdminBugStatusDb = 'new' | 'triaged' | 'resolved';

export interface AdminBugReportRecord {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  reporterName: string;
  reporterEmail: string;
  severity: AdminBugSeverity;
  status: AdminBugStatus;
  statusDb: AdminBugStatusDb;
  submittedAt: string;
  module: string;
  browser: string | null;
  device: string | null;
  stepsToReproduce: string | null;
  expectedResult: string | null;
  actualResult: string | null;
  attachmentUrls: string[];
  pageUrl: string | null;
}

export interface AdminUserSearchResult {
  id: string;
  name: string | null;
  email: string | null;
}

export type AdminTheoryDocId = string;

export interface AdminAuditEntry {
  id: string;
  actorUserId: string;
  actorName: string | null;
  actorEmail: string | null;
  targetUserId: string | null;
  targetName: string | null;
  targetEmail: string | null;
  entityType: string;
  entityId: string;
  action: string;
  beforeState: unknown;
  afterState: unknown;
  createdAt: string;
}

export interface AdminActivationBoardResponse {
  user: AdminUserSearchResult | null;
  board: ActivationBoardData;
}

export interface AdminTheoryTopicSummary {
  topic: AdminTheoryDocId;
  title: string;
  version: string | null;
  chapterCount: number;
  lessonCount: number;
}

export interface AdminTheoryDocPayload {
  topic: AdminTheoryDocId;
  doc: TheoryDoc;
  summary: AdminTheoryTopicSummary;
}

export interface AdminTheoryLessonMutationPayload {
  topic: AdminTheoryDocId;
  doc: TheoryDoc;
  chapterId: string;
  lesson: TheorySection;
}

export interface AdminActivationTaskSnapshot {
  id: string;
  userId: string;
  taskType: ActivationTaskType;
  taskGroup: ActivationTaskGroup;
  title: string;
  description: string;
  trackId: string | null;
  trackSlug: string | null;
  trackTitle: string | null;
  scopeType: ActivationScopeType;
  requestedCount: number | null;
  status: ActivationTaskStatus;
  sortOrder: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  linkedItems: Array<{
    id: string;
    contentItemId: string;
    itemStatus: ActivationItemStatus;
    startedAt: string | null;
    completedAt: string | null;
  }>;
}

export interface AdminTaskMutationResponse {
  task: ActivationBoardCard | null;
  board: ActivationBoardData;
}

export interface AdminTaskReorderResponse {
  board: ActivationBoardData;
}

export interface AdminContentItemUpsertInput {
  id?: string;
  trackId: string;
  contentType: ActivationContentType;
  sourceRef: string;
  title: string;
  sequenceOrder: number;
  isActive: boolean;
}

export interface AdminTrackUpdateInput {
  title?: string;
  isActive?: boolean;
}
