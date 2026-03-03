import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/server';
import { getCanonicalTheoryStats } from '@/lib/learn/theoryProgress';
import {
  buildTheorySummaryByTopic,
  mapReadingSessionRow,
  type ReadingSessionRowLike
} from '@/lib/learn/readingProgressModels';
import type { Topic, TopicProgress } from '@/types/progress';
import type { ReadingSignal } from '@/components/home/home/WeeklyActivityCard';

const LandingPage = dynamic(() =>
  import('@/components/home/LandingPage').then((module) => module.LandingPage)
);

const HomeDashboard = dynamic(() =>
  import('@/components/home/HomeDashboard').then((module) => module.HomeDashboard)
);

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
  updated_at?: string;
}

interface UserProgressRow {
  xp: number;
  streak: number;
  completed_questions: string[] | null;
}

interface ReadingSignalRow {
  last_active_at: string;
  completed_at: string | null;
  is_completed: boolean;
}

interface TheorySummarySnapshot {
  chapterCompleted: number;
  sectionRead: number;
  totalSeconds: number;
}

const mapTopicProgressRow = (row: TopicProgressRow): TopicProgress => {
  const theoryStats = getCanonicalTheoryStats(row.topic);
  const theoryChaptersCompleted = Math.min(
    theoryStats.chapterTotal,
    Math.max(0, row.theory_chapters_completed ?? 0)
  );
  const theorySectionsRead = Math.min(
    theoryStats.sectionTotal,
    Math.max(0, row.theory_sections_read ?? 0)
  );

  return {
    id: row.id,
    userId: row.user_id,
    topic: row.topic,
    theoryChaptersTotal: theoryStats.chapterTotal,
    theoryChaptersCompleted,
    theorySectionsTotal: theoryStats.sectionTotal,
    theorySectionsRead,
    theoryTotalMinutesRead: row.theory_total_minutes_read ?? 0,
    practiceQuestionsTotal: row.practice_questions_total ?? 0,
    practiceQuestionsAttempted: row.practice_questions_attempted ?? 0,
    practiceQuestionsCorrect: row.practice_questions_correct ?? 0,
    functionsTotal: row.functions_total ?? 0,
    functionsViewed: row.functions_viewed ?? 0,
    functionsBookmarked: row.functions_bookmarked ?? 0,
    overallCompletionPct: Number(row.overall_completion_pct ?? 0),
    firstActivityAt: row.first_activity_at,
    lastActivityAt: row.last_activity_at,
    updatedAt: row.updated_at
  };
};

const createTopicProgressFromSummary = (
  userId: string,
  topic: Topic,
  summary: TheorySummarySnapshot
): TopicProgress => {
  const theoryStats = getCanonicalTheoryStats(topic);

  return {
    id: `${userId}-${topic}`,
    userId,
    topic,
    theoryChaptersTotal: theoryStats.chapterTotal,
    theoryChaptersCompleted: summary.chapterCompleted,
    theorySectionsTotal: theoryStats.sectionTotal,
    theorySectionsRead: summary.sectionRead,
    theoryTotalMinutesRead: Math.round(summary.totalSeconds / 60),
    practiceQuestionsTotal: 0,
    practiceQuestionsAttempted: 0,
    practiceQuestionsCorrect: 0,
    functionsTotal: 0,
    functionsViewed: 0,
    functionsBookmarked: 0,
    overallCompletionPct: 0,
    firstActivityAt: null,
    lastActivityAt: null,
    updatedAt: undefined
  };
};

export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage />;
  }

  const userId = user.id;

  const [
    topicProgressResult,
    recentSessionsResult,
    allReadingSessionsResult,
    readingSignalsResult,
    userProgressResult
  ] =
    await Promise.all([
      supabase
        .from('topic_progress')
        .select(
          'id,user_id,topic,theory_chapters_total,theory_chapters_completed,theory_sections_total,theory_sections_read,theory_total_minutes_read,practice_questions_total,practice_questions_attempted,practice_questions_correct,functions_total,functions_viewed,functions_bookmarked,overall_completion_pct,first_activity_at,last_activity_at,updated_at'
        )
        .eq('user_id', userId),
      supabase
        .from('reading_sessions')
        .select(
          'id,user_id,topic,chapter_id,chapter_number,started_at,last_active_at,completed_at,sections_total,sections_read,sections_ids_read,completed_lesson_ids,lesson_seconds_by_id,active_seconds,is_completed'
        )
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('last_active_at', { ascending: false })
        .limit(3),
      supabase
        .from('reading_sessions')
        .select(
          'id,user_id,topic,chapter_id,chapter_number,started_at,last_active_at,completed_at,sections_total,sections_read,sections_ids_read,completed_lesson_ids,lesson_seconds_by_id,active_seconds,is_completed'
        )
        .eq('user_id', userId),
      supabase
        .from('reading_sessions')
        .select(
          'last_active_at,completed_at,is_completed'
        )
        .eq('user_id', userId)
        .gte(
          'last_active_at',
          new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order('last_active_at', { ascending: false })
        .limit(120),
      supabase
        .from('user_progress')
        .select('xp, streak, completed_questions')
        .eq('user_id', userId)
        .maybeSingle()
    ]);

  const topicProgressRows = (topicProgressResult.data ?? []) as TopicProgressRow[];
  const recentSessionRows = (recentSessionsResult.data ?? []) as ReadingSessionRowLike[];
  const allReadingSessionRows = (allReadingSessionsResult.data ?? []) as ReadingSessionRowLike[];
  const readingSignalRows = (readingSignalsResult.data ?? []) as ReadingSignalRow[];
  const userProgress = (userProgressResult.data ?? null) as UserProgressRow | null;

  const theorySummaryByTopic = buildTheorySummaryByTopic(allReadingSessionRows);
  const topicProgress = topicProgressRows.map((row) => {
    const baseProgress = mapTopicProgressRow(row);
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
  const topicProgressByTopic = new Map(topicProgress.map((row) => [row.topic, row]));
  theorySummaryByTopic.forEach((summary, topic) => {
    if (!topicProgressByTopic.has(topic)) {
      topicProgressByTopic.set(
        topic,
        createTopicProgressFromSummary(userId, topic, summary)
      );
    }
  });
  const resolvedTopicProgress = Array.from(topicProgressByTopic.values());
  const recentSessions = recentSessionRows.map(mapReadingSessionRow);
  const readingSignals: ReadingSignal[] = readingSignalRows.map((row) => ({
    lastActiveAt: row.last_active_at,
    completedAt: row.completed_at,
    isCompleted: row.is_completed
  }));

  const totalAttempted = topicProgress.reduce(
    (sum, item) => sum + item.practiceQuestionsAttempted,
    0
  );
  const totalCorrect = topicProgress.reduce(
    (sum, item) => sum + item.practiceQuestionsCorrect,
    0
  );

  const questionsCompleted =
    userProgress?.completed_questions?.length ?? totalAttempted;
  const overallAccuracy =
    totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  return (
    <HomeDashboard
      user={user}
      topicProgress={resolvedTopicProgress}
      recentSessions={recentSessions}
      readingSignals={readingSignals}
      stats={{
        totalXp: userProgress?.xp ?? 0,
        currentStreak: userProgress?.streak ?? 0,
        questionsCompleted,
        overallAccuracy
      }}
    />
  );
}
