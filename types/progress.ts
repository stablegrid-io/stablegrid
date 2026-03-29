export type Topic = 'pyspark' | 'fabric' | 'airflow' | 'sql' | 'python-de';

export interface ReadingSession {
  id: string;
  userId: string;
  topic: Topic;
  chapterId: string;
  chapterNumber: number;
  startedAt: string;
  lastActiveAt: string;
  completedAt: string | null;
  sectionsTotal: number;
  sectionsRead: number;
  sectionsIdsRead: string[];
  activeSeconds: number;
  isCompleted: boolean;
}

export interface ReadingHistoryEntry {
  id: string;
  userId: string;
  topic: Topic;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  lessonId: string;
  lessonOrder: number;
  lessonTitle: string;
  readAt: string;
}

export interface TopicProgress {
  id: string;
  userId: string;
  topic: Topic;
  theoryChaptersTotal: number;
  theoryChaptersCompleted: number;
  theorySectionsTotal: number;
  theorySectionsRead: number;
  theoryTotalMinutesRead: number;
  practiceQuestionsTotal: number;
  practiceQuestionsAttempted: number;
  practiceQuestionsCorrect: number;
  functionsTotal: number;
  functionsViewed: number;
  functionsBookmarked: number;
  overallCompletionPct: number;
  firstActivityAt: string | null;
  lastActivityAt: string | null;
  updatedAt?: string;
}

export interface FunctionView {
  userId: string;
  topic: Topic;
  functionId: string;
  firstViewedAt: string;
  viewCount: number;
  isBookmarked: boolean;
}

export interface ProgressSummary {
  topicProgress: TopicProgress[];
  totalTheoryMinutes: number;
  totalChaptersCompleted: number;
  totalQuestionsCorrect: number;
  totalFunctionsViewed: number;
  overallCompletionPct: number;
  streakDays: number;
  recentSessions: ReadingSession[];
}

export type CareerCompetencyTrend = 'up' | 'flat' | 'down';

export interface CareerRouteAction {
  label: string;
  route: string;
}

export interface CareerCompetencyScore {
  id: 'knowledge' | 'incident_response' | 'consistency' | 'field_operations';
  label: string;
  score: number;
  trend: CareerCompetencyTrend;
  recommendedAction: CareerRouteAction;
}

export interface PromotionCriterion {
  id: string;
  label: string;
  met: boolean;
  progressPct: number;
  currentValueLabel: string;
  targetValueLabel: string;
  route: string;
}

export interface CareerLadderStage {
  id: string;
  level: number;
  role: string;
  summary: string;
  unlocked: boolean;
  completed: boolean;
  criteria: PromotionCriterion[];
}

export interface ShiftLogEntry {
  id: string;
  category: 'learning' | 'practice' | 'mission';
  action: string;
  detail: string;
  occurredAt: string;
  route: string;
}

export interface DevelopmentTask {
  id: string;
  label: string;
  etaMinutes: number;
  route: string;
  sourceCriterionId: string;
}

export interface RoleAdvancementProgress {
  kwhEarned: number;
  tracksCompleted: number;
  tracksTotal: number;
  flashcardsCompleted: number;
  missionsCompleted: number;
  notebooksCompleted: number;
}

export interface WorkerCareerSnapshot {
  careerLevel: number;
  currentRole: string;
  nextRole: string;
  promotionReadinessPct: number;
  tenureStartDate: string | null;
  streakDays: number;
  activeDaysLast30: number;
  advancementProgress: RoleAdvancementProgress;
  competencyScores: CareerCompetencyScore[];
  ladderStages: CareerLadderStage[];
  promotionCriteria: PromotionCriterion[];
  developmentTasks: DevelopmentTask[];
  shiftLogEntries: ShiftLogEntry[];
}
