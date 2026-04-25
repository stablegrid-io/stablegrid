import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCanonicalTheoryStats } from '@/lib/learn/theoryProgress';
import {
  buildTheorySummaryByTopic,
  mapReadingSessionRow,
  type ReadingSessionRowLike
} from '@/lib/learn/readingProgressModels';
import type { Topic, TopicProgress } from '@/types/progress';
import { buildTrackMetaByTopic } from '@/lib/learn/theoryTrackMeta';
import { ProgressDashboard } from '@/components/progress/ProgressDashboard';

export const metadata: Metadata = {
  title: 'Stats',
  description: 'Your learning stats — XP, streak, time read, and topic progress.'
};

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
  topic_progress: Record<string, unknown> | null;
  last_activity: string | null;
  updated_at: string | null;
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

export default async function ProgressPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userId = user.id;

  const [topicProgressResult, allReadingSessionsResult, userProgressResult, moduleProgressResult] =
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
          'id,user_id,topic,chapter_id,chapter_number,started_at,last_active_at,completed_at,sections_total,sections_read,sections_ids_read,completed_lesson_ids,lesson_seconds_by_id,active_seconds,is_completed,session_method'
        )
        .eq('user_id', userId),
      supabase
        .from('user_progress')
        .select('xp, streak, completed_questions, topic_progress, last_activity, updated_at')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('module_progress')
        .select('topic, module_id, is_completed')
        .eq('user_id', userId)
    ]);

  const topicProgressRows = (topicProgressResult.data ?? []) as TopicProgressRow[];
  const allReadingSessionRows = (allReadingSessionsResult.data ?? []) as ReadingSessionRowLike[];
  const userProgress = (userProgressResult.data ?? null) as UserProgressRow | null;
  const moduleProgressRows = (moduleProgressResult.data ?? []) as Array<{
    topic: Topic;
    module_id: string | null;
    is_completed: boolean | null;
  }>;

  // Authoritative completed module IDs per topic (module_progress takes precedence
  // over reading_sessions — matches /learn track gallery behavior).
  const completedModulesByTopic: Record<string, string[]> = {};
  moduleProgressRows.forEach((row) => {
    if (!row.is_completed || typeof row.module_id !== 'string') return;
    const list = completedModulesByTopic[row.topic] ?? [];
    if (!list.includes(row.module_id)) list.push(row.module_id);
    completedModulesByTopic[row.topic] = list;
  });

  // Correct topic_progress with actual reading session data (source of truth for time/lessons),
  // but use module_progress as source of truth for chapter completion counts.
  const theorySummaryByTopic = buildTheorySummaryByTopic(allReadingSessionRows);
  const topicProgress = topicProgressRows.map((row) => {
    const base = mapTopicProgressRow(row);
    const summary = theorySummaryByTopic.get(row.topic);
    const moduleCompleted = completedModulesByTopic[row.topic]?.length ?? 0;
    const chaptersCompleted = Math.max(
      moduleCompleted,
      summary?.chapterCompleted ?? base.theoryChaptersCompleted
    );
    if (!summary) {
      return { ...base, theoryChaptersCompleted: chaptersCompleted };
    }
    return {
      ...base,
      theoryChaptersCompleted: chaptersCompleted,
      theorySectionsRead: summary.sectionRead,
      theoryTotalMinutesRead: Math.round(summary.totalSeconds / 60),
    };
  });

  const allSessions = allReadingSessionRows.map(mapReadingSessionRow);

  const questionsCompleted =
    userProgress?.completed_questions?.length ?? 0;

  const trackMetaByTopic = buildTrackMetaByTopic();

  return (
    <ProgressDashboard
      user={user}
      topicProgress={topicProgress}
      allSessions={allSessions}
      trackMetaByTopic={trackMetaByTopic}
      completedModulesByTopic={completedModulesByTopic}
      stats={{
        totalXp: userProgress?.xp ?? 0,
        currentStreak: userProgress?.streak ?? 0,
        questionsCompleted
      }}
    />
  );
}
