import { NOTEBOOKS } from '@/data/notebooks';
import { MISSIONS } from '@/data/missions';
import { unitsToKwh } from '@/lib/energy';
import type { UserMissionProgress } from '@/types/missions';
import type {
  CareerCompetencyScore,
  CareerCompetencyTrend,
  CareerLadderStage,
  DevelopmentTask,
  PromotionCriterion,
  ReadingHistoryEntry,
  ReadingSession,
  ShiftLogEntry,
  TopicProgress,
  WorkerCareerSnapshot
} from '@/types/progress';

interface PracticeHistoryItem {
  topic?: string;
  question_id?: string;
  correct?: number;
  total?: number;
  created_at?: string;
}

interface BuildWorkerCareerSnapshotInput {
  topicProgress: TopicProgress[];
  readingSessions: ReadingSession[];
  readingHistory: ReadingHistoryEntry[];
  missionProgress: UserMissionProgress[];
  practiceHistory: PracticeHistoryItem[];
  streakDays: number;
  totalEnergyUnits?: number;
  completedQuestionIds?: string[];
  progressTopicStats?: unknown;
}

interface CareerMetrics {
  chapterTotal: number;
  chapterCompleted: number;
  sectionTotal: number;
  sectionRead: number;
  practiceTotal: number;
  practiceAttempted: number;
  practiceCorrect: number;
  accuracyPct: number;
  missionsCompleted: number;
  activeDaysLast30: number;
  missionEnergyKwh: number;
  kwhEarned: number;
  tracksCompleted: number;
  tracksTotal: number;
  flashcardsCompleted: number;
  notebooksCompleted: number;
  notebooksTotal: number;
}

interface StageRequirements {
  kwhEarned: number;
  tracksCompleted: number;
  flashcardsCompleted: number;
  missionsCompleted: number;
  notebooksCompleted: number;
}

interface StageDefinition {
  id: string;
  role: string;
  summary: string;
  requirements: StageRequirements;
}

const CAREER_STAGES: StageDefinition[] = [
  {
    id: 'trainee-operator',
    role: 'Trainee Operator',
    summary: 'Building baseline control-room fluency.',
    requirements: {
      kwhEarned: 0,
      tracksCompleted: 0,
      flashcardsCompleted: 0,
      missionsCompleted: 0,
      notebooksCompleted: 0
    }
  },
  {
    id: 'junior-operator',
    role: 'Junior Operator',
    summary: 'Handles supervised operational workflows.',
    requirements: {
      kwhEarned: 1.5,
      tracksCompleted: 0,
      flashcardsCompleted: 30,
      missionsCompleted: 1,
      notebooksCompleted: 1
    }
  },
  {
    id: 'shift-operator',
    role: 'Shift Operator',
    summary: 'Runs independent shifts with reliable execution.',
    requirements: {
      kwhEarned: 4,
      tracksCompleted: 1,
      flashcardsCompleted: 80,
      missionsCompleted: 2,
      notebooksCompleted: 2
    }
  },
  {
    id: 'senior-operator',
    role: 'Senior Operator',
    summary: 'Leads incident response and mentors teammates.',
    requirements: {
      kwhEarned: 7.5,
      tracksCompleted: 1,
      flashcardsCompleted: 140,
      missionsCompleted: 3,
      notebooksCompleted: 3
    }
  },
  {
    id: 'lead-operator',
    role: 'Lead Operator',
    summary: 'Owns reliability outcomes and promotion readiness.',
    requirements: {
      kwhEarned: 12,
      tracksCompleted: 2,
      flashcardsCompleted: 220,
      missionsCompleted: 4,
      notebooksCompleted: 3
    }
  }
];

const TOPIC_LABEL: Record<string, string> = {
  pyspark: 'PySpark',
  fabric: 'Microsoft Fabric'
};
const NOTEBOOK_ID_SET = new Set(NOTEBOOKS.map((notebook) => notebook.id));

const clampPct = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value)));

const safeNumber = (value: unknown) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;

const formatKwhValue = (value: number) =>
  `${value.toLocaleString(undefined, {
    minimumFractionDigits: value < 10 ? 1 : 0,
    maximumFractionDigits: 1
  })} kWh`;

const toRequirementProgressPct = (value: number, target: number) => {
  if (target <= 0) return 100;
  return clampPct((value / target) * 100);
};

const uniqueQuestionIds = (questionIds: string[]) =>
  Array.from(new Set(questionIds.map((value) => value.trim()).filter(Boolean)));

const extractNotebookIdsFromQuestions = (questionIds: string[]) => {
  const notebookIds = new Set<string>();

  questionIds.forEach((value) => {
    const normalized = value.trim().toLowerCase();
    const notebookMatch = normalized.match(/nb[-_]?0*\d+/);
    if (notebookMatch) {
      notebookIds.add(notebookMatch[0].replace('_', '-'));
    }
  });

  return notebookIds;
};

const extractNotebookIdsFromProgressStats = (value: unknown) => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return new Set<string>();
  }

  const root = value as Record<string, unknown>;
  const notebooksValue = root.notebooks;
  if (
    typeof notebooksValue !== 'object' ||
    notebooksValue === null ||
    Array.isArray(notebooksValue)
  ) {
    return new Set<string>();
  }

  const notebookStats = notebooksValue as Record<string, unknown>;
  if (!Array.isArray(notebookStats.completed_notebook_ids)) {
    return new Set<string>();
  }

  return new Set(
    notebookStats.completed_notebook_ids
      .filter((item): item is string => typeof item === 'string')
      .filter((item) => NOTEBOOK_ID_SET.has(item))
  );
};

const collectNotebookCounters = (value: unknown, depth = 0): number[] => {
  if (depth > 4 || value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectNotebookCounters(entry, depth + 1));
  }

  if (typeof value !== 'object') {
    return [];
  }

  const counters: number[] = [];
  Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey.includes('notebook') &&
      (normalizedKey.includes('complete') ||
        normalizedKey.includes('review') ||
        normalizedKey.includes('submit'))
    ) {
      const numericValue = safeNumber(entry);
      if (numericValue > 0) {
        counters.push(numericValue);
      }
    }

    counters.push(...collectNotebookCounters(entry, depth + 1));
  });

  return counters;
};

const toDayKey = (value: string | Date | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
    .toISOString()
    .slice(0, 10);
};

const getWindowRange = (daysBackInclusive: number) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today.getTime() - daysBackInclusive * 24 * 60 * 60 * 1000);
  return { start, end: today };
};

const countEntriesInRange = (timestamps: string[], start: Date, end: Date) =>
  timestamps.reduce((sum, timestamp) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return sum;
    if (date >= start && date <= end) return sum + 1;
    return sum;
  }, 0);

const resolveTrend = (currentValue: number, previousValue: number): CareerCompetencyTrend => {
  if (currentValue > previousValue) return 'up';
  if (currentValue < previousValue) return 'down';
  return 'flat';
};

const titleCaseSlug = (value: string) =>
  value
    .split('-')
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');

const extractFirstActivityAt = (
  topicProgress: TopicProgress[],
  readingSessions: ReadingSession[],
  readingHistory: ReadingHistoryEntry[],
  missionProgress: UserMissionProgress[]
) => {
  const candidates: string[] = [];

  topicProgress.forEach((entry) => {
    if (entry.firstActivityAt) candidates.push(entry.firstActivityAt);
  });

  readingSessions.forEach((entry) => {
    candidates.push(entry.startedAt);
  });

  readingHistory.forEach((entry) => {
    candidates.push(entry.readAt);
  });

  missionProgress.forEach((entry) => {
    if (entry.startedAt) candidates.push(entry.startedAt);
    if (entry.completedAt) candidates.push(entry.completedAt);
  });

  if (candidates.length === 0) {
    return null;
  }

  return candidates
    .map((timestamp) => new Date(timestamp))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => left.getTime() - right.getTime())[0]
    ?.toISOString() ?? null;
};

const buildActivityDaySet = (
  readingSessions: ReadingSession[],
  readingHistory: ReadingHistoryEntry[],
  topicProgress: TopicProgress[],
  missionProgress: UserMissionProgress[]
) => {
  const days = new Set<string>();

  readingSessions.forEach((entry) => {
    const day = toDayKey(entry.lastActiveAt ?? entry.startedAt);
    if (day) days.add(day);
  });

  readingHistory.forEach((entry) => {
    const day = toDayKey(entry.readAt);
    if (day) days.add(day);
  });

  topicProgress.forEach((entry) => {
    const day = toDayKey(entry.lastActivityAt);
    if (day) days.add(day);
  });

  missionProgress.forEach((entry) => {
    const completedDay = toDayKey(entry.completedAt);
    if (completedDay) days.add(completedDay);
    const startedDay = toDayKey(entry.startedAt);
    if (startedDay) days.add(startedDay);
  });

  return days;
};

const countActiveDaysInLast = (days: Set<string>, lastDays: number) => {
  let count = 0;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let index = 0; index < lastDays; index += 1) {
    const day = new Date(today.getTime() - index * 24 * 60 * 60 * 1000);
    const key = toDayKey(day);
    if (key && days.has(key)) {
      count += 1;
    }
  }

  return count;
};

const toCriteria = (definition: StageDefinition, metrics: CareerMetrics): PromotionCriterion[] => {
  const trackTarget = Math.max(
    0,
    Math.min(definition.requirements.tracksCompleted, metrics.tracksTotal)
  );
  const notebookTarget = Math.max(
    0,
    Math.min(definition.requirements.notebooksCompleted, metrics.notebooksTotal)
  );

  return [
    {
      id: `${definition.id}-kwh-earned`,
      label: 'Energy output (kWh)',
      met: metrics.kwhEarned >= definition.requirements.kwhEarned,
      progressPct: toRequirementProgressPct(
        metrics.kwhEarned,
        definition.requirements.kwhEarned
      ),
      currentValueLabel: formatKwhValue(metrics.kwhEarned),
      targetValueLabel: formatKwhValue(definition.requirements.kwhEarned),
      route: '/energy'
    },
    {
      id: `${definition.id}-tracks`,
      label: 'Track completion',
      met: metrics.tracksCompleted >= trackTarget,
      progressPct: toRequirementProgressPct(metrics.tracksCompleted, trackTarget),
      currentValueLabel: `${metrics.tracksCompleted}/${metrics.tracksTotal} tracks`,
      targetValueLabel: `${trackTarget} tracks`,
      route: '/learn/theory'
    },
    {
      id: `${definition.id}-flashcards`,
      label: 'Flashcards completed',
      met: metrics.flashcardsCompleted >= definition.requirements.flashcardsCompleted,
      progressPct: toRequirementProgressPct(
        metrics.flashcardsCompleted,
        definition.requirements.flashcardsCompleted
      ),
      currentValueLabel: `${metrics.flashcardsCompleted} cards`,
      targetValueLabel: `${definition.requirements.flashcardsCompleted} cards`,
      route: '/flashcards'
    },
    {
      id: `${definition.id}-missions`,
      label: 'Missions completed',
      met: metrics.missionsCompleted >= definition.requirements.missionsCompleted,
      progressPct: toRequirementProgressPct(
        metrics.missionsCompleted,
        definition.requirements.missionsCompleted
      ),
      currentValueLabel: `${metrics.missionsCompleted} missions`,
      targetValueLabel: `${definition.requirements.missionsCompleted} missions`,
      route: '/missions'
    },
    {
      id: `${definition.id}-notebooks`,
      label: 'Notebook reviews',
      met: metrics.notebooksCompleted >= notebookTarget,
      progressPct: toRequirementProgressPct(metrics.notebooksCompleted, notebookTarget),
      currentValueLabel: `${metrics.notebooksCompleted}/${metrics.notebooksTotal} notebooks`,
      targetValueLabel: `${notebookTarget} notebooks`,
      route: '/practice/notebooks'
    }
  ];
};

const buildCompetencyScores = ({
  metrics,
  readingHistory,
  missionProgress,
  activityDays,
  practiceHistory
}: {
  metrics: CareerMetrics;
  readingHistory: ReadingHistoryEntry[];
  missionProgress: UserMissionProgress[];
  activityDays: Set<string>;
  practiceHistory: PracticeHistoryItem[];
}): CareerCompetencyScore[] => {
  const chapterPct =
    metrics.chapterTotal > 0 ? (metrics.chapterCompleted / metrics.chapterTotal) * 100 : 0;
  const sectionPct =
    metrics.sectionTotal > 0 ? (metrics.sectionRead / metrics.sectionTotal) * 100 : 0;
  const knowledgeScore = clampPct((chapterPct * 0.55) + (sectionPct * 0.45));

  const volumeTarget = Math.max(40, metrics.practiceTotal);
  const incidentScore = clampPct(
    (metrics.accuracyPct * 0.6) + ((metrics.practiceAttempted / Math.max(1, volumeTarget)) * 40)
  );

  const streakPct = clampPct((Math.min(metrics.activeDaysLast30, 21) / 21) * 100);
  const consistencyScore = clampPct(
    (streakPct * 0.4) + (((metrics.activeDaysLast30 / 30) * 100) * 0.6)
  );

  const totalMissionCount = Math.max(1, MISSIONS.length);
  const missionCompletionPct = (metrics.missionsCompleted / totalMissionCount) * 100;
  const missionEnergyPct = (metrics.missionEnergyKwh / 12) * 100;
  const fieldOpsScore = clampPct((missionCompletionPct * 0.7) + (missionEnergyPct * 0.3));

  const current14Window = getWindowRange(13);
  const previous14End = new Date(current14Window.start.getTime() - 24 * 60 * 60 * 1000);
  const previous14Start = new Date(previous14End.getTime() - 13 * 24 * 60 * 60 * 1000);

  const readingTimestamps = readingHistory.map((entry) => entry.readAt);
  const knowledgeTrend = resolveTrend(
    countEntriesInRange(readingTimestamps, current14Window.start, current14Window.end),
    countEntriesInRange(readingTimestamps, previous14Start, previous14End)
  );

  const practiceTimestamps = practiceHistory
    .map((entry) => entry.created_at)
    .filter((entry): entry is string => Boolean(entry));
  const incidentTrend =
    practiceTimestamps.length === 0
      ? 'flat'
      : resolveTrend(
          countEntriesInRange(practiceTimestamps, current14Window.start, current14Window.end),
          countEntriesInRange(practiceTimestamps, previous14Start, previous14End)
        );

  const activeDaysCurrent7 = countActiveDaysInLast(activityDays, 7);
  const activeDaysPrevious7 = (() => {
    let count = 0;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let index = 7; index < 14; index += 1) {
      const day = new Date(today.getTime() - index * 24 * 60 * 60 * 1000);
      const key = toDayKey(day);
      if (key && activityDays.has(key)) count += 1;
    }
    return count;
  })();
  const consistencyTrend = resolveTrend(activeDaysCurrent7, activeDaysPrevious7);

  const missionCompletionTimestamps = missionProgress
    .map((entry) => entry.completedAt)
    .filter((entry): entry is string => Boolean(entry));
  const fieldOpsTrend = resolveTrend(
    countEntriesInRange(missionCompletionTimestamps, current14Window.start, current14Window.end),
    countEntriesInRange(missionCompletionTimestamps, previous14Start, previous14End)
  );

  return [
    {
      id: 'knowledge',
      label: 'Knowledge',
      score: knowledgeScore,
      trend: knowledgeTrend,
      recommendedAction: {
        label: 'Advance theory coverage',
        route: '/learn'
      }
    },
    {
      id: 'incident_response',
      label: 'Incident Response',
      score: incidentScore,
      trend: incidentTrend,
      recommendedAction: {
        label: 'Run practice scenarios',
        route: '/practice'
      }
    },
    {
      id: 'consistency',
      label: 'Consistency',
      score: consistencyScore,
      trend: consistencyTrend,
      recommendedAction: {
        label: 'Maintain daily cadence',
        route: '/learn'
      }
    },
    {
      id: 'field_operations',
      label: 'Field Operations',
      score: fieldOpsScore,
      trend: fieldOpsTrend,
      recommendedAction: {
        label: 'Complete mission drills',
        route: '/missions'
      }
    }
  ];
};

const buildShiftLogEntries = ({
  readingHistory,
  topicProgress,
  missionProgress
}: {
  readingHistory: ReadingHistoryEntry[];
  topicProgress: TopicProgress[];
  missionProgress: UserMissionProgress[];
}): ShiftLogEntry[] => {
  const missionCodename = new Map(MISSIONS.map((mission) => [mission.slug, mission.codename]));

  const learningEntries: ShiftLogEntry[] = readingHistory.map((entry) => ({
    id: `learning-${entry.id}`,
    category: 'learning',
    action: 'Completed lesson',
    detail: `${TOPIC_LABEL[entry.topic] ?? entry.topic} · Module ${entry.chapterNumber} · ${entry.lessonTitle}`,
    occurredAt: entry.readAt,
    route: `/learn/${entry.topic}/theory/all?chapter=${encodeURIComponent(
      entry.chapterId
    )}&lesson=${encodeURIComponent(entry.lessonId)}`
  }));

  const practiceEntries: ShiftLogEntry[] = topicProgress
    .filter((entry) => (entry.practiceQuestionsAttempted ?? 0) > 0 && entry.lastActivityAt)
    .map((entry) => {
      const attempted = safeNumber(entry.practiceQuestionsAttempted);
      const correct = safeNumber(entry.practiceQuestionsCorrect);
      const accuracyPct = attempted > 0 ? clampPct((correct / attempted) * 100) : 0;

      return {
        id: `practice-${entry.topic}-${entry.lastActivityAt}`,
        category: 'practice',
        action: 'Finished practice session',
        detail: `${TOPIC_LABEL[entry.topic] ?? entry.topic} · ${correct}/${attempted} correct (${accuracyPct}% accuracy)`,
        occurredAt: entry.lastActivityAt ?? new Date().toISOString(),
        route: `/practice/${entry.topic}`
      };
    });

  const missionEntries: ShiftLogEntry[] = missionProgress
    .filter((entry) => Boolean(entry.completedAt) || Boolean(entry.startedAt))
    .map((entry) => {
      const completed = Boolean(entry.completedAt);
      const occurredAt = entry.completedAt ?? entry.startedAt ?? new Date().toISOString();
      const codename = missionCodename.get(entry.missionSlug) ?? titleCaseSlug(entry.missionSlug);

      return {
        id: `mission-${entry.missionSlug}-${occurredAt}`,
        category: 'mission',
        action: completed ? 'Resolved mission' : 'Reviewed mission scenario',
        detail: `${codename} · ${completed ? 'Completed' : 'In progress'}`,
        occurredAt,
        route: `/missions/${entry.missionSlug}`
      };
    });

  return [...learningEntries, ...practiceEntries, ...missionEntries]
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, 50);
};

const buildDevelopmentTasks = (criteria: PromotionCriterion[]): DevelopmentTask[] =>
  criteria
    .filter((criterion) => !criterion.met)
    .sort((left, right) => right.progressPct - left.progressPct)
    .slice(0, 3)
    .map((criterion, index) => ({
      id: `task-${index + 1}-${criterion.id}`,
      label: criterion.label,
      etaMinutes:
        criterion.route === '/missions'
          ? 45
          : criterion.route === '/practice/notebooks'
            ? 35
            : criterion.route === '/energy'
              ? 30
              : criterion.route === '/flashcards'
                ? 20
                : 25,
      route: criterion.route,
      sourceCriterionId: criterion.id
    }));

export const buildWorkerCareerSnapshot = ({
  topicProgress,
  readingSessions,
  readingHistory,
  missionProgress,
  practiceHistory,
  streakDays,
  totalEnergyUnits = 0,
  completedQuestionIds = [],
  progressTopicStats = null
}: BuildWorkerCareerSnapshotInput): WorkerCareerSnapshot => {
  const chapterTotal = topicProgress.reduce((sum, entry) => sum + safeNumber(entry.theoryChaptersTotal), 0);
  const chapterCompleted = topicProgress.reduce(
    (sum, entry) => sum + safeNumber(entry.theoryChaptersCompleted),
    0
  );
  const sectionTotal = topicProgress.reduce((sum, entry) => sum + safeNumber(entry.theorySectionsTotal), 0);
  const sectionRead = topicProgress.reduce((sum, entry) => sum + safeNumber(entry.theorySectionsRead), 0);
  const practiceTotal = topicProgress.reduce(
    (sum, entry) => sum + safeNumber(entry.practiceQuestionsTotal),
    0
  );
  const practiceAttempted = topicProgress.reduce(
    (sum, entry) => sum + safeNumber(entry.practiceQuestionsAttempted),
    0
  );
  const practiceCorrect = topicProgress.reduce(
    (sum, entry) => sum + safeNumber(entry.practiceQuestionsCorrect),
    0
  );
  const accuracyPct =
    practiceAttempted > 0 ? clampPct((practiceCorrect / practiceAttempted) * 100) : 0;
  const missionsCompleted = missionProgress.filter((entry) => entry.state === 'completed').length;
  const missionEnergyUnits = missionProgress.reduce((sum, entry) => {
    if (entry.state !== 'completed') return sum;
    return sum + Math.max(0, safeNumber(entry.energyAwardedUnits));
  }, 0);
  const totalEarnedEnergyUnits = Math.max(missionEnergyUnits, safeNumber(totalEnergyUnits));
  const kwhEarned = unitsToKwh(totalEarnedEnergyUnits);
  const missionEnergyKwh = unitsToKwh(missionEnergyUnits);
  const completedQuestionIdsUnique = uniqueQuestionIds(completedQuestionIds);
  const flashcardsCompletedByQuestionIds = completedQuestionIdsUnique.filter((questionId) => {
    const normalized = questionId.toLowerCase();
    return !normalized.startsWith('nb-') && !normalized.startsWith('nb_');
  }).length;
  const flashcardsCompleted = Math.max(flashcardsCompletedByQuestionIds, practiceAttempted);
  const notebookIdsFromQuestions = extractNotebookIdsFromQuestions(completedQuestionIdsUnique);
  const notebookIdsFromProgress = extractNotebookIdsFromProgressStats(progressTopicStats);
  const notebookCounterCandidates = collectNotebookCounters(progressTopicStats);
  const notebookCounterFromProgress = notebookCounterCandidates.length
    ? Math.max(...notebookCounterCandidates.map((value) => Math.floor(safeNumber(value))))
    : 0;
  const notebooksTotal = NOTEBOOKS.length;
  const notebooksCompleted = Math.max(
    0,
    Math.min(
      notebooksTotal,
      Math.max(
        notebookIdsFromQuestions.size,
        notebookIdsFromProgress.size,
        notebookCounterFromProgress
      )
    )
  );
  const tracksTotal = topicProgress.filter(
    (entry) => safeNumber(entry.theoryChaptersTotal) > 0
  ).length;
  const tracksCompleted = topicProgress.filter((entry) => {
    const total = safeNumber(entry.theoryChaptersTotal);
    if (total <= 0) return false;
    return safeNumber(entry.theoryChaptersCompleted) >= total;
  }).length;
  const activityDays = buildActivityDaySet(
    readingSessions,
    readingHistory,
    topicProgress,
    missionProgress
  );
  const activeDaysLast30 = countActiveDaysInLast(activityDays, 30);

  const metrics: CareerMetrics = {
    chapterTotal,
    chapterCompleted,
    sectionTotal,
    sectionRead,
    practiceTotal,
    practiceAttempted,
    practiceCorrect,
    accuracyPct,
    missionsCompleted,
    activeDaysLast30,
    missionEnergyKwh,
    kwhEarned,
    tracksCompleted,
    tracksTotal,
    flashcardsCompleted,
    notebooksCompleted,
    notebooksTotal
  };

  let priorStagesCompleted = true;
  const ladderStages: CareerLadderStage[] = CAREER_STAGES.map((definition, index) => {
    const criteria = toCriteria(definition, metrics);
    const completed = criteria.every((criterion) => criterion.met);
    const unlocked = index === 0 || priorStagesCompleted;
    priorStagesCompleted = priorStagesCompleted && completed;

    return {
      id: definition.id,
      level: index + 1,
      role: definition.role,
      summary: definition.summary,
      unlocked,
      completed,
      criteria
    };
  });

  const highestCompletedIndex = ladderStages.reduce((maxIndex, stage, index) => {
    if (stage.completed) return index;
    return maxIndex;
  }, -1);

  const currentStageIndex = Math.min(
    ladderStages.length - 1,
    Math.max(0, highestCompletedIndex >= 0 ? highestCompletedIndex : 0)
  );
  const currentStage = ladderStages[currentStageIndex];
  const isAtTopStage = currentStageIndex >= ladderStages.length - 1;
  const promotionTargetStageIndex =
    !isAtTopStage && currentStage.completed
      ? currentStageIndex + 1
      : currentStageIndex;
  const promotionTargetStage = ladderStages[promotionTargetStageIndex] ?? currentStage;
  const promotionCriteria = promotionTargetStage.criteria;
  const promotionReadinessPct =
    isAtTopStage && currentStage.completed
      ? 100
      : clampPct(
          promotionCriteria.reduce((sum, criterion) => sum + criterion.progressPct, 0) /
            Math.max(1, promotionCriteria.length)
        );

  const competencyScores = buildCompetencyScores({
    metrics,
    readingHistory,
    missionProgress,
    activityDays,
    practiceHistory
  });

  const shiftLogEntries = buildShiftLogEntries({
    readingHistory,
    topicProgress,
    missionProgress
  });

  const developmentTasks = buildDevelopmentTasks(promotionCriteria);

  return {
    careerLevel: currentStage.level,
    currentRole: currentStage.role,
    nextRole:
      isAtTopStage && currentStage.completed
        ? 'Promotion Board Review'
        : promotionTargetStage.role,
    promotionReadinessPct,
    tenureStartDate: extractFirstActivityAt(
      topicProgress,
      readingSessions,
      readingHistory,
      missionProgress
    ),
    streakDays: Math.max(0, streakDays),
    activeDaysLast30,
    advancementProgress: {
      kwhEarned,
      tracksCompleted,
      tracksTotal,
      flashcardsCompleted,
      missionsCompleted,
      notebooksCompleted
    },
    competencyScores,
    ladderStages,
    promotionCriteria,
    developmentTasks,
    shiftLogEntries
  };
};
