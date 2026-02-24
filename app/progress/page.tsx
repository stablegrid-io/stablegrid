import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProgressDashboard } from '@/components/progress/ProgressDashboard';
import type {
  ReadingSession,
  Topic,
  TopicProgress as TopicProgressModel
} from '@/types/progress';
import type { MissionState, UserMissionProgress } from '@/types/missions';

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

const learnTopics: Topic[] = ['pyspark', 'fabric'];

const TOPIC_DEFAULTS: Record<
  Topic,
  {
    theoryChaptersTotal: number;
    theorySectionsTotal: number;
    practiceTotal: number;
    functionsTotal: number;
  }
> = {
  pyspark: {
    theoryChaptersTotal: 13,
    theorySectionsTotal: 39,
    practiceTotal: 45,
    functionsTotal: 91
  },
  fabric: {
    theoryChaptersTotal: 5,
    theorySectionsTotal: 15,
    practiceTotal: 40,
    functionsTotal: 40
  }
};

const ZERO_TOPIC_DEFAULT = {
  theoryChaptersTotal: 0,
  theorySectionsTotal: 0,
  practiceTotal: 0,
  functionsTotal: 0
};

const getTopicDefaults = (topic: Topic | string) => {
  return TOPIC_DEFAULTS[topic as Topic] ?? ZERO_TOPIC_DEFAULT;
};

const toReadingSessionModel = (row: ReadingSessionRow): ReadingSession => ({
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

const toTopicProgressModel = (row: TopicProgressRow): TopicProgressModel => {
  const defaults = getTopicDefaults(row.topic);
  return {
    id: row.id,
    userId: row.user_id,
    topic: row.topic,
    theoryChaptersTotal: row.theory_chapters_total || defaults.theoryChaptersTotal,
    theoryChaptersCompleted: row.theory_chapters_completed,
    theorySectionsTotal: row.theory_sections_total || defaults.theorySectionsTotal,
    theorySectionsRead: row.theory_sections_read,
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

  const [topicProgressResult, readingSessionsResult, userMissionsResult] = await Promise.all([
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
        'id,user_id,topic,chapter_id,chapter_number,started_at,last_active_at,completed_at,sections_total,sections_read,sections_ids_read,active_seconds,is_completed'
      )
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(50),
    supabase
      .from('user_missions')
      .select('mission_slug,state,unlocked,started_at,completed_at,xp_awarded')
      .eq('user_id', user.id)
  ]);

  const topicRows = (topicProgressResult.data ?? []) as TopicProgressRow[];
  const readingRows = (readingSessionsResult.data ?? []) as ReadingSessionRow[];
  const userMissionRows = (userMissionsResult.data ?? []) as UserMissionRow[];

  const mappedTopicProgress = topicRows.map(toTopicProgressModel);
  const byTopic = new Map(mappedTopicProgress.map((row) => [row.topic, row]));
  const topicProgress: TopicProgressModel[] = learnTopics.map((topic) => {
    return byTopic.get(topic) ?? createEmptyTopicProgress(user.id, topic);
  });

  const readingSessions = readingRows.map(toReadingSessionModel);
  const missionProgress = userMissionRows.map(toUserMissionProgressModel);

  return (
    <ProgressDashboard
      userId={user.id}
      userEmail={user.email ?? ''}
      topicProgress={topicProgress}
      readingSessions={readingSessions}
      practiceHistory={[]}
      missionProgress={missionProgress}
    />
  );
}
