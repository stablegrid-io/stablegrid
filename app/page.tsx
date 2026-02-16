import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/server';
import type { ReadingSession, Topic, TopicProgress } from '@/types/progress';

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

interface ReadingSessionRow {
  id: string;
  user_id: string;
  topic: Topic;
  chapter_id: string;
  chapter_number: number;
  started_at: string;
  last_active_at: string;
  completed_at: string | null;
  sections_total: number;
  sections_read: number;
  sections_ids_read: string[];
  active_seconds: number;
  is_completed: boolean;
}

interface UserProgressRow {
  xp: number;
  streak: number;
  completed_questions: string[] | null;
}

const mapTopicProgressRow = (row: TopicProgressRow): TopicProgress => ({
  id: row.id,
  userId: row.user_id,
  topic: row.topic,
  theoryChaptersTotal: row.theory_chapters_total ?? 0,
  theoryChaptersCompleted: row.theory_chapters_completed ?? 0,
  theorySectionsTotal: row.theory_sections_total ?? 0,
  theorySectionsRead: row.theory_sections_read ?? 0,
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
});

const mapReadingSessionRow = (row: ReadingSessionRow): ReadingSession => ({
  id: row.id,
  userId: row.user_id,
  topic: row.topic,
  chapterId: row.chapter_id,
  chapterNumber: row.chapter_number,
  startedAt: row.started_at,
  lastActiveAt: row.last_active_at,
  completedAt: row.completed_at,
  sectionsTotal: row.sections_total,
  sectionsRead: row.sections_read,
  sectionsIdsRead: row.sections_ids_read ?? [],
  activeSeconds: row.active_seconds,
  isCompleted: row.is_completed
});

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
    readingHistoryResult,
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
          'id,user_id,topic,chapter_id,chapter_number,started_at,last_active_at,completed_at,sections_total,sections_read,sections_ids_read,active_seconds,is_completed'
        )
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('last_active_at', { ascending: false })
        .limit(3),
      supabase
        .from('reading_sessions')
        .select(
          'id,user_id,topic,chapter_id,chapter_number,started_at,last_active_at,completed_at,sections_total,sections_read,sections_ids_read,active_seconds,is_completed'
        )
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false })
        .limit(60),
      supabase
        .from('user_progress')
        .select('xp, streak, completed_questions')
        .eq('user_id', userId)
        .maybeSingle()
    ]);

  const topicProgressRows = (topicProgressResult.data ?? []) as TopicProgressRow[];
  const recentSessionRows = (recentSessionsResult.data ?? []) as ReadingSessionRow[];
  const readingHistoryRows = (readingHistoryResult.data ?? []) as ReadingSessionRow[];
  const userProgress = (userProgressResult.data ?? null) as UserProgressRow | null;

  const topicProgress = topicProgressRows.map(mapTopicProgressRow);
  const recentSessions = recentSessionRows.map(mapReadingSessionRow);
  const readingHistory = readingHistoryRows.map(mapReadingSessionRow);

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
      topicProgress={topicProgress}
      recentSessions={recentSessions}
      readingHistory={readingHistory}
      stats={{
        totalXp: userProgress?.xp ?? 0,
        currentStreak: userProgress?.streak ?? 0,
        questionsCompleted,
        overallAccuracy
      }}
    />
  );
}
