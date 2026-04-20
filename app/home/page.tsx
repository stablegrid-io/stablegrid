import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getCanonicalTheoryStats } from '@/lib/learn/theoryProgress';
import {
  buildTheorySummaryByTopic,
  mapReadingSessionRow,
  type ReadingSessionRowLike
} from '@/lib/learn/readingProgressModels';
import type { Topic, TopicProgress } from '@/types/progress';
import type { ReadingSignal } from '@/components/home/home/WeeklyActivityCard';
import { buildTrackMetaByTopic } from '@/lib/learn/theoryTrackMeta';
import { theoryDocs } from '@/data/learn/theory';

export const metadata: Metadata = {
  title: 'stableGrid.io',
  description: 'Adaptive data engineering learning paths, operations drills, and career progression.'
};

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
  topic_progress: Record<string, unknown> | null;
  last_activity: string | null;
  updated_at: string | null;
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

interface HomeLatestTaskAction {
  title: string;
  summary: string;
  statLine: string;
  actionLabel: string;
  actionHref: string;
  topicId: Topic;
  accentRgb?: string;
  progressPct?: number;
}

const TRACK_TOPICS: Topic[] = ['pyspark', 'fabric'];
const ACTIVATION_TRACK_ACCENT_RGB_BY_TOPIC: Record<Topic, string> = {
  pyspark: '245,158,11',
  fabric: '34,185,153',
  airflow: '139,92,246',
  sql: '66,133,244',
  'python-de': '55,118,171'
};
const DEFAULT_TASKS_ACCENT_RGB = '34,185,153';

const toRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

const toIsoTimestamp = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? value : null;
};

const clampPct = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const pickLatestIsoTimestamp = (...values: Array<string | null | undefined>) => {
  const candidates = values.filter(
    (value): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value))
  );
  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort((left, right) => Date.parse(right) - Date.parse(left))[0];
};

const extractActivityTimestampsFromNestedProgress = (value: unknown) => {
  const visited = new Set<object>();
  const queue: unknown[] = [value];
  const collected: string[] = [];
  const activityKeyPattern =
    /(updated|attempted|activity|completed_at|last_active|lastActive|lastAttempted)/i;

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== 'object') {
      continue;
    }

    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    if (Array.isArray(current)) {
      current.forEach((item) => queue.push(item));
      continue;
    }

    Object.entries(current as Record<string, unknown>).forEach(([key, nestedValue]) => {
      if (typeof nestedValue === 'string') {
        if (activityKeyPattern.test(key) && Number.isFinite(Date.parse(nestedValue))) {
          collected.push(nestedValue);
        }
        return;
      }

      if (nestedValue && typeof nestedValue === 'object') {
        queue.push(nestedValue);
      }
    });
  }

  return collected;
};

const resolveLatestPracticeTopic = (
  topicProgress: Record<string, unknown>
): { topic: Topic; updatedAt: string; attempted: number; completionPct: number | undefined } | null => {
  const candidates = TRACK_TOPICS.map((topic) => {
    const topicStats = toRecord(topicProgress[topic]);
    const updatedAt = toIsoTimestamp(topicStats.lastAttempted);
    const attempted = Math.max(0, Math.floor(Number(topicStats.total ?? 0)));
    const completionPctRaw = Number(topicStats.completionPct);
    const completionPct = Number.isFinite(completionPctRaw)
      ? clampPct(completionPctRaw)
      : undefined;
    if (!updatedAt) {
      return null;
    }
    return {
      topic,
      updatedAt,
      attempted,
      completionPct
    };
  }).filter(
    (
      candidate
    ): candidate is { topic: Topic; updatedAt: string; attempted: number; completionPct: number | undefined } =>
      candidate !== null
  );

  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
  )[0];
};

const buildLatestTaskAction = ({
  userProgress,
  fallbackTopic
}: {
  userProgress: UserProgressRow | null;
  fallbackTopic: Topic;
}): HomeLatestTaskAction => {
  const topicProgress = toRecord(userProgress?.topic_progress);
  const notebooksProgress = toRecord(topicProgress.notebooks);
  const notebookUpdatedAt = toIsoTimestamp(notebooksProgress.updated_at);
  const completedNotebookIds = Array.isArray(notebooksProgress.completed_notebook_ids)
    ? notebooksProgress.completed_notebook_ids.filter(
        (value): value is string => typeof value === 'string'
      )
    : [];
  const notebookCompletedCount = Math.max(
    completedNotebookIds.length,
    Math.floor(Number(notebooksProgress.completed_notebooks_count ?? 0))
  );
  const notebookTotalCount = Math.max(
    0,
    Math.floor(
      Number(
        notebooksProgress.total_notebooks_count ??
          notebooksProgress.notebooks_total ??
          notebooksProgress.total
      )
    )
  );
  const notebooksProgressPct =
    notebookTotalCount > 0
      ? clampPct((Math.min(notebookCompletedCount, notebookTotalCount) / notebookTotalCount) * 100)
      : undefined;
  const latestPracticeTopic = resolveLatestPracticeTopic(topicProgress);

  const notebookCandidate: (HomeLatestTaskAction & { updatedAt: string }) | null =
    notebookUpdatedAt
      ? {
          title: 'Notebooks',
          summary:
            notebookCompletedCount > 0
              ? 'Resume notebook reviews and keep your audit workflow active.'
              : 'Start notebook reviews to build applied troubleshooting reps.',
          statLine:
            notebookCompletedCount > 0
              ? `${notebookCompletedCount} notebook reviews completed`
              : 'No notebook reviews completed yet',
          actionLabel:
            notebookCompletedCount > 0 ? 'Resume notebooks' : 'Open notebooks',
          actionHref: '/practice/notebooks',
          topicId: fallbackTopic,
          accentRgb: DEFAULT_TASKS_ACCENT_RGB,
          progressPct: notebooksProgressPct,
          updatedAt: notebookUpdatedAt
        }
      : null;

  const practiceCandidate: (HomeLatestTaskAction & { updatedAt: string }) | null =
    latestPracticeTopic
      ? {
          title: 'Flashcards',
          summary: 'Resume your latest recall deck and keep retention active.',
          statLine:
            latestPracticeTopic.attempted > 0
              ? `${latestPracticeTopic.attempted} flashcards attempted in this track`
              : 'Latest flashcard track is ready to continue',
          actionLabel: 'Resume flashcards',
          actionHref: `/practice/${latestPracticeTopic.topic}`,
          topicId: latestPracticeTopic.topic,
          accentRgb: ACTIVATION_TRACK_ACCENT_RGB_BY_TOPIC[latestPracticeTopic.topic],
          progressPct: latestPracticeTopic.completionPct,
          updatedAt: latestPracticeTopic.updatedAt
        }
      : null;

  const latestTimedCandidate = [notebookCandidate, practiceCandidate]
    .filter((candidate): candidate is HomeLatestTaskAction & { updatedAt: string } =>
      Boolean(candidate)
    )
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))[0];

  if (latestTimedCandidate) {
    const { updatedAt: _updatedAt, ...taskAction } = latestTimedCandidate;
    return taskAction;
  }

  const completedQuestionsCount = userProgress?.completed_questions?.length ?? 0;
  if (completedQuestionsCount > 0) {
    return {
      title: 'Flashcards',
      summary: 'Resume your latest recall deck and keep retention active.',
      statLine: `${completedQuestionsCount} recall checks completed`,
      actionLabel: 'Resume flashcards',
      actionHref: `/practice/${fallbackTopic}`,
      topicId: fallbackTopic,
      accentRgb: ACTIVATION_TRACK_ACCENT_RGB_BY_TOPIC[fallbackTopic]
    };
  }

  return {
    title: 'Task Deck',
    summary: 'Open notebooks, missions, or flashcards from one command surface.',
    statLine: 'No recent task activity yet',
    actionLabel: 'Open tasks',
    actionHref: '/tasks',
    topicId: fallbackTopic,
    accentRgb: DEFAULT_TASKS_ACCENT_RGB
  };
};

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

function HomeSkeleton() {
  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 rounded-lg bg-white/[0.04]" />
          <div className="h-12 w-80 rounded-lg bg-white/[0.04]" />
          <div className="h-4 w-96 rounded-lg bg-white/[0.03]" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-40 rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userId = user.id;

  // 3 queries instead of 5 — derive recentSessions and readingSignals from allSessions
  const [
    topicProgressResult,
    allReadingSessionsResult,
    userProgressResult,
    gridPurchasesResult
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
        .eq('user_id', userId),
      supabase
        .from('user_progress')
        .select('xp, streak, completed_questions, topic_progress, last_activity, updated_at')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('user_grid_purchases')
        .select('cost_paid')
        .eq('user_id', userId)
    ]);

  const topicProgressRows = (topicProgressResult.data ?? []) as TopicProgressRow[];
  const allReadingSessionRows = (allReadingSessionsResult.data ?? []) as ReadingSessionRowLike[];
  const userProgress = (userProgressResult.data ?? null) as UserProgressRow | null;
  const gridSpentKwh = (gridPurchasesResult.data ?? []).reduce(
    (sum, row: { cost_paid: number | null }) => sum + (row.cost_paid ?? 0),
    0,
  );
  const availableKwh = Math.max(0, (userProgress?.xp ?? 0) - gridSpentKwh);

  // Derive subsets from the single reading_sessions query
  const recentSessionRows = allReadingSessionRows
    .filter((r) => !r.is_completed)
    .sort((a, b) => Date.parse(String(b.last_active_at ?? '')) - Date.parse(String(a.last_active_at ?? '')))
    .slice(0, 3) as ReadingSessionRowLike[];

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const readingSignalRows = allReadingSessionRows
    .filter((r) => String(r.last_active_at ?? '') >= fourteenDaysAgo)
    .sort((a, b) => Date.parse(String(b.last_active_at ?? '')) - Date.parse(String(a.last_active_at ?? '')))
    .slice(0, 120) as ReadingSignalRow[];

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
  const completedSessions = allReadingSessionRows
    .filter((r) => r.is_completed)
    .map(mapReadingSessionRow);
  const allReadingSessions = allReadingSessionRows.map(mapReadingSessionRow);
  const latestTheorySession =
    allReadingSessions.length > 0
      ? [...allReadingSessions].sort(
          (left, right) =>
            Date.parse(right.lastActiveAt) - Date.parse(left.lastActiveAt)
        )[0]
      : null;
  const latestTheoryTopic = latestTheorySession?.topic ?? 'pyspark';
  const latestTaskAction = buildLatestTaskAction({
    userProgress,
    fallbackTopic: latestTheoryTopic
  });
  const nestedTaskActivityTimestamps = extractActivityTimestampsFromNestedProgress(
    userProgress?.topic_progress
  );
  const topicProgressActivityTimestamps = topicProgressRows.flatMap((row) => [
    row.last_activity_at,
    row.updated_at
  ]);
  const lastClockedInAt = pickLatestIsoTimestamp(
    latestTheorySession?.lastActiveAt,
    userProgress?.last_activity,
    userProgress?.updated_at,
    ...nestedTaskActivityTimestamps,
    ...topicProgressActivityTimestamps
  );
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

  // Pre-compute track metadata server-side (~1KB vs 6.2MB of full theory JSON)
  const trackMetaByTopic = buildTrackMetaByTopic();

  // Resolve chapter + lesson titles for the resume card
  let resumeContext: { chapterTitle: string; lessonTitle: string } | null = null;
  if (latestTheorySession) {
    const doc = theoryDocs[latestTheorySession.topic];
    if (doc) {
      const chapters = doc.modules ?? doc.chapters ?? [];
      const chapter = chapters.find((c: { id: string }) => c.id === latestTheorySession.chapterId);
      if (chapter) {
        const lastLessonId = latestTheorySession.sectionsIdsRead?.[latestTheorySession.sectionsIdsRead.length - 1];
        const lesson = lastLessonId
          ? (chapter.sections ?? []).find((s: { id: string }) => s.id === lastLessonId)
          : null;
        resumeContext = {
          chapterTitle: (chapter.title ?? '').replace(/^module\s*\d+\s*:\s*/i, '').trim(),
          lessonTitle: lesson?.title ?? '',
        };
      }
    }
  }

  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeDashboard
        user={user}
        topicProgress={resolvedTopicProgress}
        recentSessions={recentSessions}
        completedSessions={completedSessions}
        latestTheorySession={latestTheorySession}
        resumeContext={resumeContext}
        lastClockedInAt={lastClockedInAt}
        latestTaskAction={latestTaskAction}
        readingSignals={readingSignals}
        trackMetaByTopic={trackMetaByTopic}
        stats={{
          totalXp: availableKwh,
          currentStreak: userProgress?.streak ?? 0,
          questionsCompleted,
          overallAccuracy
        }}
      />
    </Suspense>
  );
}
