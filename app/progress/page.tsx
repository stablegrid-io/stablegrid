import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCanonicalTheoryStats } from '@/lib/learn/theoryProgress';
import { buildWorkerCareerSnapshot } from '@/lib/progressCareer';
import {
  buildTheorySummaryByTopic,
  mapReadingHistoryRow,
  mapReadingSessionRow,
  type ReadingHistoryRowLike,
  type ReadingSessionRowLike
} from '@/lib/learn/readingProgressModels';
import { ProgressDashboard } from '@/components/progress/ProgressDashboard';
import type {
  Topic,
  TopicProgress as TopicProgressModel
} from '@/types/progress';
import type { MissionState, UserMissionProgress } from '@/types/missions';

interface TopicProgressRow {
  id: string;
  user_id: string;
  topic: Topic;
  theory_chapters_total: number;
  theory_chapters_completed: number;
  theory_sections_total: number;
  theory_sections_read: number;
  theory_total_minutes_read: number;
  practice_questions_total: number;
  practice_questions_attempted: number;
  practice_questions_correct: number;
  functions_total: number;
  functions_viewed: number;
  functions_bookmarked: number;
  overall_completion_pct: number;
  first_activity_at: string | null;
  last_activity_at: string | null;
  updated_at: string;
}

interface UserMissionRow {
  mission_slug: string;
  state: MissionState;
  unlocked: boolean;
  started_at: string | null;
  completed_at: string | null;
  xp_awarded: number;
}

interface UserProgressRow {
  streak: number | null;
  xp: number | null;
  completed_questions: string[] | null;
  topic_progress: Record<string, unknown> | null;
}

interface TheorySummarySnapshot {
  chapterCompleted: number;
  sectionRead: number;
  totalSeconds: number;
}

const learnTopics: Topic[] = ['pyspark', 'fabric'];

const TOPIC_DEFAULTS: Record<
  Topic,
  {
    practiceTotal: number;
    functionsTotal: number;
  }
> = {
  pyspark: {
    practiceTotal: 45,
    functionsTotal: 91
  },
  fabric: {
    practiceTotal: 40,
    functionsTotal: 40
  }
};

const ZERO_TOPIC_DEFAULT = {
  practiceTotal: 0,
  functionsTotal: 0
};

const getTopicDefaults = (topic: Topic | string) => {
  const theoryStats =
    topic === 'pyspark' || topic === 'fabric'
      ? getCanonicalTheoryStats(topic)
      : { chapterTotal: 0, sectionTotal: 0 };
  const defaults = TOPIC_DEFAULTS[topic as Topic] ?? ZERO_TOPIC_DEFAULT;

  return {
    theoryChaptersTotal: theoryStats.chapterTotal,
    theorySectionsTotal: theoryStats.sectionTotal,
    practiceTotal: defaults.practiceTotal,
    functionsTotal: defaults.functionsTotal
  };
};

const toTopicProgressModel = (row: TopicProgressRow): TopicProgressModel => {
  const defaults = getTopicDefaults(row.topic);
  const theoryChaptersCompleted = Math.min(
    defaults.theoryChaptersTotal,
    Math.max(0, row.theory_chapters_completed ?? 0)
  );
  const theorySectionsRead = Math.min(
    defaults.theorySectionsTotal,
    Math.max(0, row.theory_sections_read ?? 0)
  );
  return {
    id: row.id,
    userId: row.user_id,
    topic: row.topic,
    theoryChaptersTotal: defaults.theoryChaptersTotal,
    theoryChaptersCompleted,
    theorySectionsTotal: defaults.theorySectionsTotal,
    theorySectionsRead,
    theoryTotalMinutesRead: row.theory_total_minutes_read,
    practiceQuestionsTotal: row.practice_questions_total || defaults.practiceTotal,
    practiceQuestionsAttempted: row.practice_questions_attempted,
    practiceQuestionsCorrect: row.practice_questions_correct,
    functionsTotal: row.functions_total || defaults.functionsTotal,
    functionsViewed: row.functions_viewed,
    functionsBookmarked: row.functions_bookmarked,
    overallCompletionPct: row.overall_completion_pct,
    firstActivityAt: row.first_activity_at,
    lastActivityAt: row.last_activity_at,
    updatedAt: row.updated_at
  };
};

const createEmptyTopicProgress = (userId: string, topic: Topic): TopicProgressModel => {
  const defaults = getTopicDefaults(topic);

  return {
    id: `${userId}-${topic}`,
    userId,
    topic,
    theoryChaptersTotal: defaults.theoryChaptersTotal,
    theoryChaptersCompleted: 0,
    theorySectionsTotal: defaults.theorySectionsTotal,
    theorySectionsRead: 0,
    theoryTotalMinutesRead: 0,
    practiceQuestionsTotal: defaults.practiceTotal,
    practiceQuestionsAttempted: 0,
    practiceQuestionsCorrect: 0,
    functionsTotal: defaults.functionsTotal,
    functionsViewed: 0,
    functionsBookmarked: 0,
    overallCompletionPct: 0,
    firstActivityAt: null,
    lastActivityAt: null
  };
};

const createTopicProgressFromSummary = (
  userId: string,
  topic: Topic,
  summary: TheorySummarySnapshot
): TopicProgressModel => {
  const defaults = getTopicDefaults(topic);

  return {
    id: `${userId}-${topic}`,
    userId,
    topic,
    theoryChaptersTotal: defaults.theoryChaptersTotal,
    theoryChaptersCompleted: summary.chapterCompleted,
    theorySectionsTotal: defaults.theorySectionsTotal,
    theorySectionsRead: summary.sectionRead,
    theoryTotalMinutesRead: Math.round(summary.totalSeconds / 60),
    practiceQuestionsTotal: defaults.practiceTotal,
    practiceQuestionsAttempted: 0,
    practiceQuestionsCorrect: 0,
    functionsTotal: defaults.functionsTotal,
    functionsViewed: 0,
    functionsBookmarked: 0,
    overallCompletionPct: 0,
    firstActivityAt: null,
    lastActivityAt: null
  };
};

const toUserMissionProgressModel = (row: UserMissionRow): UserMissionProgress => ({
  missionSlug: row.mission_slug,
  state: row.state,
  unlocked: row.unlocked,
  startedAt: row.started_at,
  completedAt: row.completed_at,
  energyAwardedUnits: row.xp_awarded
});

export default async function ProgressPage() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  const [
    topicProgressResult,
    readingSessionsResult,
    readingHistoryResult,
    userMissionsResult,
    userProgressResult
  ] = await Promise.all([
    supabase
      .from('topic_progress')
      .select(
        'id,user_id,topic,theory_chapters_total,theory_chapters_completed,theory_sections_total,theory_sections_read,theory_total_minutes_read,practice_questions_total,practice_questions_attempted,practice_questions_correct,functions_total,functions_viewed,functions_bookmarked,overall_completion_pct,first_activity_at,last_activity_at,updated_at'
      )
      .eq('user_id', user.id)
      .order('topic'),
    supabase
      .from('reading_sessions')
      .select(
        'id,user_id,topic,chapter_id,chapter_number,started_at,last_active_at,completed_at,sections_total,sections_read,sections_ids_read,completed_lesson_ids,lesson_seconds_by_id,active_seconds,is_completed'
      )
      .eq('user_id', user.id)
      .order('started_at', { ascending: false }),
    supabase
      .from('reading_lesson_history')
      .select(
        'id,user_id,topic,chapter_id,chapter_number,lesson_id,lesson_order,read_at'
      )
      .eq('user_id', user.id)
      .order('read_at', { ascending: false })
      .limit(50),
    supabase
      .from('user_missions')
      .select('mission_slug,state,unlocked,started_at,completed_at,xp_awarded')
      .eq('user_id', user.id),
    supabase
      .from('user_progress')
      .select('streak,xp,completed_questions,topic_progress')
      .eq('user_id', user.id)
      .maybeSingle()
  ]);

  const topicRows = (topicProgressResult.data ?? []) as TopicProgressRow[];
  const readingRows = (readingSessionsResult.data ?? []) as ReadingSessionRowLike[];
  const readingHistoryRows = (readingHistoryResult.data ?? []) as ReadingHistoryRowLike[];
  const userMissionRows = (userMissionsResult.data ?? []) as UserMissionRow[];
  const userProgressRow = (userProgressResult.data ?? null) as UserProgressRow | null;

  const theorySummaryByTopic = buildTheorySummaryByTopic(readingRows);
  const mappedTopicProgress = topicRows.map((row) => {
    const baseProgress = toTopicProgressModel(row);
    const theorySummary = theorySummaryByTopic.get(row.topic);

    if (!theorySummary) {
      return baseProgress;
    }

    return {
      ...baseProgress,
      theoryChaptersCompleted: theorySummary.chapterCompleted,
      theorySectionsRead: theorySummary.sectionRead,
      theoryTotalMinutesRead: Math.round(theorySummary.totalSeconds / 60)
    };
  });
  const byTopic = new Map(mappedTopicProgress.map((row) => [row.topic, row]));
  theorySummaryByTopic.forEach((summary, topic) => {
    if (!byTopic.has(topic)) {
      byTopic.set(topic, createTopicProgressFromSummary(user.id, topic, summary));
    }
  });
  const topicProgress: TopicProgressModel[] = learnTopics.map((topic) => {
    return byTopic.get(topic) ?? createEmptyTopicProgress(user.id, topic);
  });

  const readingSessions = readingRows.map(mapReadingSessionRow);
  const readingHistory = readingHistoryRows.map(mapReadingHistoryRow);
  const missionProgress = userMissionRows.map(toUserMissionProgressModel);
  const practiceHistory: Array<{
    topic?: string;
    question_id?: string;
    correct?: number;
    total?: number;
    created_at?: string;
  }> = [];
  const workerCareerSnapshot = buildWorkerCareerSnapshot({
    topicProgress,
    readingSessions,
    readingHistory,
    missionProgress,
    practiceHistory,
    streakDays: Number(userProgressRow?.streak ?? 0),
    totalEnergyUnits: Number(userProgressRow?.xp ?? 0),
    completedQuestionIds: Array.isArray(userProgressRow?.completed_questions)
      ? userProgressRow.completed_questions
      : [],
    progressTopicStats: userProgressRow?.topic_progress ?? null
  });

  return (
    <ProgressDashboard
      userId={user.id}
      userEmail={user.email ?? ''}
      workerCareerSnapshot={workerCareerSnapshot}
      readingSessions={readingSessions}
    />
  );
}
