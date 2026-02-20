export type Topic = 'pyspark' | 'fabric';

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
