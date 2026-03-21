import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCanonicalTheoryStats } from '@/lib/learn/theoryProgress';
import { buildWorkerCareerSnapshot } from '@/lib/progressCareer';
import type { MissionState, UserMissionProgress } from '@/types/missions';
import type { Topic, TopicProgress as TopicProgressModel } from '@/types/progress';

interface TopicProgressRow {
  id: string;
  user_id: string;
  topic: Topic;
  theory_chapters_total: number | null;
  theory_chapters_completed: number | null;
  theory_sections_total: number | null;
  theory_sections_read: number | null;
  theory_total_minutes_read: number | null;
  practice_questions_total: number | null;
  practice_questions_attempted: number | null;
  practice_questions_correct: number | null;
  functions_total: number | null;
  functions_viewed: number | null;
  functions_bookmarked: number | null;
  overall_completion_pct: number | null;
  first_activity_at: string | null;
  last_activity_at: string | null;
  updated_at: string | null;
}

interface UserMissionRow {
  mission_slug: string;
  state: MissionState;
  unlocked: boolean;
  started_at: string | null;
  completed_at: string | null;
  xp_awarded: number | null;
}

interface UserProgressRow {
  streak: number | null;
  xp: number | null;
  completed_questions: string[] | null;
  topic_progress: Record<string, unknown> | null;
}

const LEARN_TOPICS: Topic[] = ['pyspark', 'fabric', 'airflow'];

const TOPIC_DEFAULTS: Record<Topic, { practiceTotal: number; functionsTotal: number }> = {
  pyspark: {
    practiceTotal: 45,
    functionsTotal: 91
  },
  fabric: {
    practiceTotal: 40,
    functionsTotal: 40
  },
  airflow: {
    practiceTotal: 0,
    functionsTotal: 0
  }
};

const toNumber = (value: unknown, fallback = 0) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }
  return numericValue;
};

const getTopicDefaults = (topic: Topic) => {
  const theoryStats = getCanonicalTheoryStats(topic);
  const practiceDefaults = TOPIC_DEFAULTS[topic];

  return {
    theoryChaptersTotal: theoryStats.chapterTotal,
    theorySectionsTotal: theoryStats.sectionTotal,
    practiceTotal: practiceDefaults.practiceTotal,
    functionsTotal: practiceDefaults.functionsTotal
  };
};

const toTopicProgressModel = (row: TopicProgressRow): TopicProgressModel => {
  const defaults = getTopicDefaults(row.topic);
  const theoryChaptersCompleted = Math.max(
    0,
    Math.min(defaults.theoryChaptersTotal, toNumber(row.theory_chapters_completed))
  );
  const theorySectionsRead = Math.max(
    0,
    Math.min(defaults.theorySectionsTotal, toNumber(row.theory_sections_read))
  );

  return {
    id: row.id,
    userId: row.user_id,
    topic: row.topic,
    theoryChaptersTotal: defaults.theoryChaptersTotal,
    theoryChaptersCompleted,
    theorySectionsTotal: defaults.theorySectionsTotal,
    theorySectionsRead,
    theoryTotalMinutesRead: Math.max(0, Math.round(toNumber(row.theory_total_minutes_read))),
    practiceQuestionsTotal: Math.max(
      defaults.practiceTotal,
      Math.round(toNumber(row.practice_questions_total))
    ),
    practiceQuestionsAttempted: Math.max(
      0,
      Math.round(toNumber(row.practice_questions_attempted))
    ),
    practiceQuestionsCorrect: Math.max(
      0,
      Math.round(toNumber(row.practice_questions_correct))
    ),
    functionsTotal: Math.max(defaults.functionsTotal, Math.round(toNumber(row.functions_total))),
    functionsViewed: Math.max(0, Math.round(toNumber(row.functions_viewed))),
    functionsBookmarked: Math.max(0, Math.round(toNumber(row.functions_bookmarked))),
    overallCompletionPct: Math.max(0, Math.round(toNumber(row.overall_completion_pct))),
    firstActivityAt: row.first_activity_at,
    lastActivityAt: row.last_activity_at,
    updatedAt: row.updated_at ?? undefined
  };
};

const createEmptyTopicProgress = (
  userId: string,
  topic: Topic
): TopicProgressModel => {
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
    lastActivityAt: null,
    updatedAt: undefined
  };
};

const toMissionProgressModel = (row: UserMissionRow): UserMissionProgress => ({
  missionSlug: row.mission_slug,
  state: row.state,
  unlocked: row.unlocked,
  startedAt: row.started_at,
  completedAt: row.completed_at,
  energyAwardedUnits: Math.max(0, Math.round(toNumber(row.xp_awarded)))
});

const getNextShiftStep = (
  developmentTask:
    | {
        route: string;
        label: string;
      }
    | undefined,
  unmetCriterion:
    | {
        route: string;
        label: string;
      }
    | undefined
) => {
  if (developmentTask) {
    return {
      route: developmentTask.route,
      hint: developmentTask.label,
      nextGateLabel: developmentTask.label
    };
  }

  if (unmetCriterion) {
    return {
      route: unmetCriterion.route,
      hint: unmetCriterion.label,
      nextGateLabel: unmetCriterion.label
    };
  }

  return {
    route: '/progress',
    hint: 'Ready for promotion review',
    nextGateLabel: 'All promotion criteria met'
  };
};

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [topicProgressResult, missionsResult, userProgressResult] = await Promise.all([
    supabase
      .from('topic_progress')
      .select(
        'id,user_id,topic,theory_chapters_total,theory_chapters_completed,theory_sections_total,theory_sections_read,theory_total_minutes_read,practice_questions_total,practice_questions_attempted,practice_questions_correct,functions_total,functions_viewed,functions_bookmarked,overall_completion_pct,first_activity_at,last_activity_at,updated_at'
      )
      .eq('user_id', user.id)
      .order('topic'),
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

  if (topicProgressResult.error) {
    return NextResponse.json({ error: topicProgressResult.error.message }, { status: 500 });
  }
  if (missionsResult.error) {
    return NextResponse.json({ error: missionsResult.error.message }, { status: 500 });
  }
  if (userProgressResult.error) {
    return NextResponse.json({ error: userProgressResult.error.message }, { status: 500 });
  }

  const topicRows = (topicProgressResult.data ?? []) as TopicProgressRow[];
  const missionRows = (missionsResult.data ?? []) as UserMissionRow[];
  const userProgress = (userProgressResult.data ?? null) as UserProgressRow | null;

  const mappedTopicProgress = topicRows.map(toTopicProgressModel);
  const topicProgressByTopic = new Map(
    mappedTopicProgress.map((entry) => [entry.topic, entry])
  );
  const topicProgress = LEARN_TOPICS.map((topic) => {
    return topicProgressByTopic.get(topic) ?? createEmptyTopicProgress(user.id, topic);
  });
  const missionProgress = missionRows.map(toMissionProgressModel);

  const workerCareerSnapshot = buildWorkerCareerSnapshot({
    topicProgress,
    readingSessions: [],
    readingHistory: [],
    missionProgress,
    practiceHistory: [],
    streakDays: Math.max(0, Math.round(toNumber(userProgress?.streak))),
    totalEnergyUnits: Math.max(0, Math.round(toNumber(userProgress?.xp))),
    completedQuestionIds: Array.isArray(userProgress?.completed_questions)
      ? userProgress.completed_questions
      : [],
    progressTopicStats: userProgress?.topic_progress ?? null
  });

  const criteriaMet = workerCareerSnapshot.promotionCriteria.filter(
    (criterion) => criterion.met
  ).length;
  const nextUnmetCriterion = workerCareerSnapshot.promotionCriteria.find(
    (criterion) => !criterion.met
  );
  const nextStep = getNextShiftStep(
    workerCareerSnapshot.developmentTasks[0],
    nextUnmetCriterion
  );

  return NextResponse.json({
    data: {
      careerLevel: workerCareerSnapshot.careerLevel,
      currentRole: workerCareerSnapshot.currentRole,
      nextRole: workerCareerSnapshot.nextRole,
      promotionReadinessPct: workerCareerSnapshot.promotionReadinessPct,
      tenureStartDate: workerCareerSnapshot.tenureStartDate,
      activeDaysLast30: workerCareerSnapshot.activeDaysLast30,
      criteriaMet,
      criteriaTotal: workerCareerSnapshot.promotionCriteria.length,
      nextActionRoute: nextStep.route,
      nextActionHint: nextStep.hint,
      nextGateLabel: nextStep.nextGateLabel
    }
  });
}
