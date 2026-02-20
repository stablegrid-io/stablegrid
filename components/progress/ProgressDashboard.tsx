'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Code2,
  Flame,
  GripVertical,
  LayoutGrid,
  ListChecks,
  Pencil,
  Plus,
  RefreshCcw,
  Target,
  Trophy,
  User,
  Users,
  X,
  Zap
} from 'lucide-react';
import { Responsive } from 'react-grid-layout';
import type { ReadingSession, Topic, TopicProgress } from '@/types/progress';
import type { UserMissionProgress } from '@/types/missions';
import { createClient } from '@/lib/supabase/client';
import { unitsToKwh } from '@/lib/energy';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import questionsIndex from '@/data/questions/index.json';

interface ProgressDashboardProps {
  userId: string;
  userEmail: string;
  topicProgress: TopicProgress[];
  readingSessions: ReadingSession[];
  missionProgress: UserMissionProgress[];
  practiceHistory: Array<{
    topic?: string;
    question_id?: string;
    correct?: number;
    total?: number;
    created_at?: string;
  }>;
  initialDashboardLayout?: unknown;
}

type BreakpointKey = 'lg' | 'md' | 'sm';

type WidgetSize = 'small' | 'medium' | 'large' | 'wide' | 'tall';

interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
}

type GridLayouts = Record<BreakpointKey, GridLayoutItem[]>;

const BREAKPOINTS: Record<BreakpointKey, number> = {
  lg: 1024,
  md: 768,
  sm: 0
};

const COLS: Record<BreakpointKey, number> = {
  lg: 12,
  md: 8,
  sm: 4
};

const SIZE_PRESETS: Record<WidgetSize, { w: number; h: number; label: string }> = {
  small: { w: 3, h: 2, label: 'Small · 3×2' },
  medium: { w: 6, h: 3, label: 'Medium · 6×3' },
  large: { w: 6, h: 4, label: 'Large · 6×4' },
  wide: { w: 12, h: 3, label: 'Wide · 12×3' },
  tall: { w: 3, h: 4, label: 'Tall · 3×4' }
};

const TOPIC_META: Record<Topic, { label: string }> = {
  pyspark: { label: 'PySpark' },
  fabric: { label: 'Fabric' }
};

const TOPIC_ORDER: Topic[] = ['pyspark', 'fabric'];
const TOPIC_COLORS = ['#10b981', '#34d399', '#2dd4bf', '#6ee7b7'];
const DRAWER_WIDTH_PX = 340;

const WIDGET_IDS = [
  'total_kwh',
  'kwh_this_week',
  'kwh_this_month',
  'kwh_trend',
  'kwh_by_topic',
  'total_sessions',
  'sessions_this_week',
  'avg_session_time',
  'session_history',
  'activity_heatmap',
  'time_spent',
  'best_session',
  'overall_accuracy',
  'accuracy_trend',
  'accuracy_by_topic',
  'accuracy_by_diff',
  'weak_areas',
  'strong_areas',
  'current_streak',
  'longest_streak',
  'streak_calendar',
  'daily_goal',
  'weekly_goal',
  'chapters_done',
  'lessons_done',
  'topic_progress',
  'missions_done',
  'flashcards_reviewed',
  'notebooks_created',
  'completion_rate',
  'global_rank',
  'top_learners',
  'percentile'
] as const;

type WidgetId = (typeof WIDGET_IDS)[number];

type WidgetCategory =
  | 'Energy & Points'
  | 'Practice & Sessions'
  | 'Accuracy & Performance'
  | 'Streaks & Consistency'
  | 'Completion & Progress'
  | 'Leaderboard & Social';

interface WidgetCatalogEntry {
  id: WidgetId;
  title: string;
  description: string;
  category: WidgetCategory;
  defaultSize: WidgetSize;
  icon: React.ComponentType<{ className?: string }>;
}

const WIDGET_CATALOG: WidgetCatalogEntry[] = [
  {
    id: 'total_kwh',
    title: 'Total kWh',
    description: 'Cumulative energy earned across all activity.',
    category: 'Energy & Points',
    defaultSize: 'small',
    icon: Zap
  },
  {
    id: 'kwh_this_week',
    title: 'This Week',
    description: 'Current week kWh and delta vs prior week.',
    category: 'Energy & Points',
    defaultSize: 'small',
    icon: Calendar
  },
  {
    id: 'kwh_this_month',
    title: 'This Month',
    description: 'Month-to-date earned kWh.',
    category: 'Energy & Points',
    defaultSize: 'small',
    icon: Calendar
  },
  {
    id: 'kwh_trend',
    title: 'Energy Trend',
    description: 'Daily kWh line chart over time.',
    category: 'Energy & Points',
    defaultSize: 'large',
    icon: Activity
  },
  {
    id: 'kwh_by_topic',
    title: 'Energy by Topic',
    description: 'Distribution of kWh split by topic.',
    category: 'Energy & Points',
    defaultSize: 'medium',
    icon: Target
  },
  {
    id: 'total_sessions',
    title: 'Total Sessions',
    description: 'Completed learning sessions count.',
    category: 'Practice & Sessions',
    defaultSize: 'small',
    icon: ListChecks
  },
  {
    id: 'sessions_this_week',
    title: 'Sessions This Week',
    description: 'Sessions completed in the last 7 days.',
    category: 'Practice & Sessions',
    defaultSize: 'small',
    icon: Calendar
  },
  {
    id: 'avg_session_time',
    title: 'Avg Session Time',
    description: 'Average session duration (mm:ss).',
    category: 'Practice & Sessions',
    defaultSize: 'small',
    icon: Clock3
  },
  {
    id: 'session_history',
    title: 'Session History',
    description: 'Recent session timeline with score and topic.',
    category: 'Practice & Sessions',
    defaultSize: 'large',
    icon: ListChecks
  },
  {
    id: 'activity_heatmap',
    title: 'Activity Heatmap',
    description: '6-month daily activity heatmap.',
    category: 'Practice & Sessions',
    defaultSize: 'wide',
    icon: Activity
  },
  {
    id: 'time_spent',
    title: 'Time Invested',
    description: 'Hours invested per week.',
    category: 'Practice & Sessions',
    defaultSize: 'medium',
    icon: Clock3
  },
  {
    id: 'best_session',
    title: 'Best Session',
    description: 'Highest-scoring session snapshot.',
    category: 'Practice & Sessions',
    defaultSize: 'small',
    icon: Trophy
  },
  {
    id: 'overall_accuracy',
    title: 'Overall Accuracy',
    description: 'Correctness percentage across attempts.',
    category: 'Accuracy & Performance',
    defaultSize: 'small',
    icon: Target
  },
  {
    id: 'accuracy_trend',
    title: 'Accuracy Trend',
    description: 'Accuracy movement across recent sessions.',
    category: 'Accuracy & Performance',
    defaultSize: 'large',
    icon: Activity
  },
  {
    id: 'accuracy_by_topic',
    title: 'Accuracy by Topic',
    description: 'Grouped topic-level accuracy bars.',
    category: 'Accuracy & Performance',
    defaultSize: 'medium',
    icon: BarChartPlaceholderIcon
  },
  {
    id: 'accuracy_by_diff',
    title: 'By Difficulty',
    description: 'Accuracy split by easy/medium/hard.',
    category: 'Accuracy & Performance',
    defaultSize: 'medium',
    icon: BarChartPlaceholderIcon
  },
  {
    id: 'weak_areas',
    title: 'Weak Areas',
    description: 'Lowest-performing topics to review.',
    category: 'Accuracy & Performance',
    defaultSize: 'medium',
    icon: ArrowDown
  },
  {
    id: 'strong_areas',
    title: 'Strongest Topics',
    description: 'Highest-performing topics.',
    category: 'Accuracy & Performance',
    defaultSize: 'medium',
    icon: ArrowUp
  },
  {
    id: 'current_streak',
    title: 'Current Streak',
    description: 'Consecutive days with activity.',
    category: 'Streaks & Consistency',
    defaultSize: 'small',
    icon: Flame
  },
  {
    id: 'longest_streak',
    title: 'Longest Streak',
    description: 'All-time longest activity streak.',
    category: 'Streaks & Consistency',
    defaultSize: 'small',
    icon: Trophy
  },
  {
    id: 'streak_calendar',
    title: 'Streak Calendar',
    description: 'Current month practice calendar.',
    category: 'Streaks & Consistency',
    defaultSize: 'wide',
    icon: Calendar
  },
  {
    id: 'daily_goal',
    title: 'Daily Goal',
    description: 'Daily practice goal progress ring.',
    category: 'Streaks & Consistency',
    defaultSize: 'small',
    icon: Target
  },
  {
    id: 'weekly_goal',
    title: 'Weekly Goal',
    description: 'Weekly target progress and day bars.',
    category: 'Streaks & Consistency',
    defaultSize: 'medium',
    icon: Calendar
  },
  {
    id: 'chapters_done',
    title: 'Chapters Complete',
    description: 'Finished chapters across all topics.',
    category: 'Completion & Progress',
    defaultSize: 'small',
    icon: BookOpen
  },
  {
    id: 'lessons_done',
    title: 'Lessons Complete',
    description: 'Read sections progress.',
    category: 'Completion & Progress',
    defaultSize: 'small',
    icon: Check
  },
  {
    id: 'topic_progress',
    title: 'Topic Progress',
    description: 'Per-topic completion bars.',
    category: 'Completion & Progress',
    defaultSize: 'medium',
    icon: LayoutGrid
  },
  {
    id: 'missions_done',
    title: 'Missions Complete',
    description: 'Completed missions count.',
    category: 'Completion & Progress',
    defaultSize: 'small',
    icon: Trophy
  },
  {
    id: 'flashcards_reviewed',
    title: 'Cards Reviewed',
    description: 'Total reviewed flashcards.',
    category: 'Completion & Progress',
    defaultSize: 'small',
    icon: Check
  },
  {
    id: 'notebooks_created',
    title: 'Notebooks',
    description: 'Notebooks completed in practice.',
    category: 'Completion & Progress',
    defaultSize: 'small',
    icon: BookOpen
  },
  {
    id: 'completion_rate',
    title: 'Completion Radar',
    description: 'Completion distribution by topic.',
    category: 'Completion & Progress',
    defaultSize: 'medium',
    icon: Target
  },
  {
    id: 'global_rank',
    title: 'Global Rank',
    description: 'Leaderboard rank estimate.',
    category: 'Leaderboard & Social',
    defaultSize: 'small',
    icon: Trophy
  },
  {
    id: 'top_learners',
    title: 'Top Learners',
    description: 'Top leaderboard standings.',
    category: 'Leaderboard & Social',
    defaultSize: 'tall',
    icon: Users
  },
  {
    id: 'percentile',
    title: 'Percentile',
    description: 'Relative percentile against learners.',
    category: 'Leaderboard & Social',
    defaultSize: 'small',
    icon: User
  }
];

const WIDGET_BY_ID = new Map<WidgetId, WidgetCatalogEntry>(
  WIDGET_CATALOG.map((widget) => [widget.id, widget])
);

const CATEGORY_ORDER: WidgetCategory[] = [
  'Energy & Points',
  'Practice & Sessions',
  'Accuracy & Performance',
  'Streaks & Consistency',
  'Completion & Progress',
  'Leaderboard & Social'
];

const DEFAULT_LAYOUT_LG: GridLayoutItem[] = [
  { i: 'current_streak', x: 0, y: 0, w: 3, h: 2 },
  { i: 'total_kwh', x: 3, y: 0, w: 3, h: 2 },
  { i: 'overall_accuracy', x: 6, y: 0, w: 3, h: 2 },
  { i: 'sessions_this_week', x: 9, y: 0, w: 3, h: 2 },
  { i: 'accuracy_trend', x: 0, y: 2, w: 6, h: 4 },
  { i: 'topic_progress', x: 6, y: 2, w: 6, h: 3 },
  { i: 'activity_heatmap', x: 0, y: 6, w: 12, h: 3 }
];

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(input: Date) {
  return new Date(input.getFullYear(), input.getMonth(), input.getDate());
}

function toDateKey(value: number | string | Date | null | undefined) {
  if (value == null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return startOfDay(date).toISOString().slice(0, 10);
}

function formatMinutesToClock(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '00:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatRelativeDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const days = Math.floor(diff / DAY_MS);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatDayCount(value: number) {
  return `${value} ${value === 1 ? 'day' : 'days'}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getWidgetBaseSize(id: WidgetId) {
  const widget = WIDGET_BY_ID.get(id);
  if (!widget) {
    return SIZE_PRESETS.small;
  }
  return SIZE_PRESETS[widget.defaultSize];
}

function getWidgetSizeForBreakpoint(id: WidgetId, breakpoint: BreakpointKey) {
  const base = getWidgetBaseSize(id);
  if (breakpoint === 'sm') {
    return {
      w: COLS.sm,
      h: base.h
    };
  }
  return {
    w: Math.min(base.w, COLS[breakpoint]),
    h: base.h
  };
}

function packLayoutForCols(baseLayout: GridLayoutItem[], cols: number): GridLayoutItem[] {
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  return baseLayout.map((item) => {
    const w = Math.min(item.w, cols);
    const h = Math.max(2, item.h);

    if (cursorX + w > cols) {
      cursorX = 0;
      cursorY += rowHeight;
      rowHeight = 0;
    }

    const next: GridLayoutItem = {
      i: item.i,
      x: cursorX,
      y: cursorY,
      w,
      h,
      minW: Math.min(2, w),
      minH: 2
    };

    cursorX += w;
    rowHeight = Math.max(rowHeight, h);

    return next;
  });
}

function buildDefaultLayouts(): GridLayouts {
  const base = DEFAULT_LAYOUT_LG.map((item) => ({
    ...item,
    minW: 2,
    minH: 2
  }));

  return {
    lg: base,
    md: packLayoutForCols(base, COLS.md).map((item) => ({
      ...item,
      w: Math.min(item.w, COLS.md)
    })),
    sm: base.map((item, index) => ({
      i: item.i,
      x: 0,
      y: index * item.h,
      w: COLS.sm,
      h: item.h,
      minW: COLS.sm,
      maxW: COLS.sm,
      minH: 2
    }))
  };
}

const EMPTY_LAYOUTS: GridLayouts = { lg: [], md: [], sm: [] };

function normalizeLoadedLayouts(raw: unknown): GridLayouts {
  const defaults = buildDefaultLayouts();
  // New user — no saved layout yet: start with a blank canvas.
  if (raw === null || raw === undefined) {
    return EMPTY_LAYOUTS;
  }
  if (typeof raw !== 'object') {
    return defaults;
  }

  const normalized: GridLayouts = {
    lg: [],
    md: [],
    sm: []
  };

  (['lg', 'md', 'sm'] as BreakpointKey[]).forEach((key) => {
    const value = (raw as Record<string, unknown>)[key];
    if (!Array.isArray(value)) {
      normalized[key] = defaults[key];
      return;
    }

    const next: GridLayoutItem[] = [];
    value.forEach((entry) => {
      if (!entry || typeof entry !== 'object') return;
      const item = entry as Record<string, unknown>;
      const id = item.i;
      if (typeof id !== 'string' || !WIDGET_BY_ID.has(id as WidgetId)) return;

      const parsedW = Number(item.w);
      const parsedH = Number(item.h);
      const parsedX = Number(item.x);
      const parsedY = Number(item.y);
      const size = getWidgetSizeForBreakpoint(id as WidgetId, key);
      const maxCols = COLS[key];

      const w = Number.isFinite(parsedW) ? clamp(Math.round(parsedW), 1, maxCols) : size.w;
      const h = Number.isFinite(parsedH) ? clamp(Math.round(parsedH), 2, 8) : size.h;
      const x = Number.isFinite(parsedX)
        ? clamp(Math.round(parsedX), 0, Math.max(0, maxCols - w))
        : 0;
      const y = Number.isFinite(parsedY) ? Math.max(0, Math.round(parsedY)) : 0;

      next.push({
        i: id,
        x,
        y,
        w,
        h,
        minW: key === 'sm' ? COLS.sm : 2,
        maxW: key === 'sm' ? COLS.sm : undefined,
        minH: 2
      });
    });

    // Preserve an intentionally empty dashboard layout (all widgets removed).
    // Fallback to defaults only when input had items but none were valid.
    normalized[key] = next.length > 0 || value.length === 0 ? next : defaults[key];
  });

  return normalized;
}

function reorderMobileLayout(layout: GridLayoutItem[], fromIndex: number, toIndex: number): GridLayoutItem[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
    return layout;
  }

  const ordered = [...layout].sort((a, b) => a.y - b.y || a.x - b.x);
  if (fromIndex >= ordered.length || toIndex >= ordered.length) {
    return ordered;
  }

  const [moved] = ordered.splice(fromIndex, 1);
  ordered.splice(toIndex, 0, moved);

  let cursorY = 0;
  return ordered.map((item) => {
    const next: GridLayoutItem = {
      ...item,
      x: 0,
      y: cursorY,
      w: COLS.sm,
      minW: COLS.sm,
      maxW: COLS.sm
    };
    cursorY += next.h;
    return next;
  });
}

function getNearestSnapSize(id: WidgetId, w: number, h: number, breakpoint: BreakpointKey) {
  if (breakpoint === 'sm') {
    return { w: COLS.sm, h: clamp(Math.round(h), 2, 8) };
  }

  const candidateSizes = Object.values(SIZE_PRESETS).map((preset) => ({
    w: Math.min(preset.w, COLS[breakpoint]),
    h: preset.h
  }));

  const current = getWidgetSizeForBreakpoint(id, breakpoint);
  candidateSizes.push(current);

  const nearest = candidateSizes.reduce((closest, candidate) => {
    const candidateDistance = Math.abs(candidate.w - w) + Math.abs(candidate.h - h);
    const closestDistance = Math.abs(closest.w - w) + Math.abs(closest.h - h);
    return candidateDistance < closestDistance ? candidate : closest;
  }, current);

  return nearest;
}

function useViewportWidth() {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return width;
}

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    const updateWidth = () => {
      setWidth(Math.round(element.getBoundingClientRect().width));
    };

    updateWidth();
    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { ref, width };
}

interface PracticeAttempt {
  topic: Topic;
  questionId: string | null;
  correct: number;
  total: number;
  createdAt: string;
}

interface DashboardMetrics {
  totalKwh: number;
  kwhThisWeek: number;
  kwhThisMonth: number;
  kwhLastWeek: number;
  kwhTrend: Array<{ day: string; kwh: number }>;
  kwhByTopic: Array<{ topic: string; kwh: number }>;
  totalSessions: number;
  sessionsThisWeek: number;
  avgSessionSeconds: number;
  bestSession: {
    topic: Topic;
    score: number;
    date: string;
  } | null;
  sessionHistory: ReadingSession[];
  activityHeatmap: Array<{ day: string; count: number }>;
  timeSpent: Array<{ week: string; hours: number }>;
  overallAccuracy: number;
  accuracyTrend: Array<{ label: string; accuracy: number }>;
  accuracyByTopic: Array<{ topic: string; accuracy: number; attempted: number }>;
  accuracyByDifficulty: Array<{ difficulty: string; accuracy: number; attempted: number }>;
  weakAreas: Array<{ name: string; value: number }>;
  strongAreas: Array<{ name: string; value: number }>;
  currentStreak: number;
  longestStreak: number;
  streakCalendar: Array<{ day: string; practiced: boolean }>;
  dailyGoalPct: number;
  dailyGoalCurrent: number;
  dailyGoalTarget: number;
  weeklyGoalPct: number;
  weeklyGoalCurrent: number;
  weeklyGoalTarget: number;
  weeklyGoalBars: Array<{ day: string; sessions: number }>;
  chaptersDone: number;
  chaptersTotal: number;
  lessonsDone: number;
  lessonsTotal: number;
  topicCompletion: Array<{ topic: string; pct: number; done: number; total: number }>;
  missionsDone: number;
  missionsTotal: number;
  flashcardsReviewed: number;
  notebooksCount: number;
  globalRank: number;
  percentile: number;
  topLearners: Array<{ name: string; kwh: number; isCurrentUser?: boolean }>;
}

function BarChartPlaceholderIcon({ className }: { className?: string }) {
  return <LayoutGrid className={className} />;
}

function useDashboardMetrics({
  userEmail,
  topicProgress,
  readingSessions,
  missionProgress,
  practiceHistory
}: {
  userEmail: string;
  topicProgress: TopicProgress[];
  readingSessions: ReadingSession[];
  missionProgress: UserMissionProgress[];
  practiceHistory: ProgressDashboardProps['practiceHistory'];
}) {
  const xp = useProgressStore((state) => state.xp);
  const streak = useProgressStore((state) => state.streak);
  const questionHistory = useProgressStore((state) => state.questionHistory);
  const completedQuestions = useProgressStore((state) => state.completedQuestions);
  const energyEvents = useProgressStore((state) => state.energyEvents);

  const resolvedPracticeHistory = useMemo(() => {
    if (practiceHistory.length > 0) {
      return practiceHistory;
    }

    return questionHistory.map((entry) => ({
      topic: entry.topic,
      question_id: entry.questionId,
      correct: entry.correct ? 1 : 0,
      total: 1,
      created_at: new Date(entry.timestamp).toISOString()
    }));
  }, [practiceHistory, questionHistory]);

  const difficultyByQuestionId = useMemo(() => {
    const map = new Map<string, 'easy' | 'medium' | 'hard'>();
    const source = questionsIndex as {
      questions?: Record<string, Array<{ id?: string; difficulty?: string }>>;
    };

    const buckets = source.questions ?? {};
    Object.values(buckets).forEach((questionList) => {
      questionList.forEach((question) => {
        if (!question.id) return;
        const difficulty = (question.difficulty ?? 'medium').toLowerCase();
        if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') {
          map.set(question.id, difficulty);
          return;
        }
        map.set(question.id, 'medium');
      });
    });

    return map;
  }, []);

  const attempts = useMemo<PracticeAttempt[]>(() => {
    return resolvedPracticeHistory
      .map((item) => {
        const topic = item.topic as Topic | undefined;
        if (!topic || !TOPIC_META[topic]) return null;
        const total = Number(item.total ?? 1);
        const correct = Number(item.correct ?? 0);
        if (!Number.isFinite(total) || total <= 0) return null;
        const createdAt = item.created_at;
        if (!createdAt) return null;
        return {
          topic,
          questionId: typeof item.question_id === 'string' ? item.question_id : null,
          correct: clamp(correct, 0, total),
          total,
          createdAt
        };
      })
      .filter((item): item is PracticeAttempt => Boolean(item));
  }, [resolvedPracticeHistory]);

  return useMemo<DashboardMetrics>(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = new Date(todayStart.getTime() - 6 * DAY_MS);
    const lastWeekStart = new Date(weekStart.getTime() - 7 * DAY_MS);
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    const totalKwh = unitsToKwh(xp);

    const positiveEvents = energyEvents.filter((event) => event.units > 0);

    const eventKwhByDay = new Map<string, number>();
    const eventKwhByTopic = new Map<Topic, number>(TOPIC_ORDER.map((topic) => [topic, 0]));

    positiveEvents.forEach((event) => {
      const key = toDateKey(event.timestamp);
      if (!key) return;
      const kwh = unitsToKwh(event.units);
      eventKwhByDay.set(key, (eventKwhByDay.get(key) ?? 0) + kwh);
      const topic = event.topic as Topic | undefined;
      if (topic && eventKwhByTopic.has(topic)) {
        eventKwhByTopic.set(topic, (eventKwhByTopic.get(topic) ?? 0) + kwh);
      }
    });

    if (positiveEvents.length === 0) {
      const attemptKwhByTopic = new Map<Topic, number>(TOPIC_ORDER.map((topic) => [topic, 0]));
      questionHistory.forEach((entry) => {
        if (!entry.correct) return;
        const key = toDateKey(entry.timestamp);
        if (!key) return;
        const kwh = unitsToKwh(entry.xp);
        eventKwhByDay.set(key, (eventKwhByDay.get(key) ?? 0) + kwh);
        attemptKwhByTopic.set(
          entry.topic,
          (attemptKwhByTopic.get(entry.topic) ?? 0) + kwh
        );
      });

      attemptKwhByTopic.forEach((value, topic) => {
        eventKwhByTopic.set(topic, value);
      });
    }

    let kwhThisWeek = 0;
    let kwhLastWeek = 0;
    let kwhThisMonth = 0;

    eventKwhByDay.forEach((kwh, key) => {
      const date = new Date(key);
      if (date >= weekStart && date <= todayStart) {
        kwhThisWeek += kwh;
      }
      if (date >= lastWeekStart && date < weekStart) {
        kwhLastWeek += kwh;
      }
      if (date >= monthStart && date <= todayStart) {
        kwhThisMonth += kwh;
      }
    });

    const kwhTrend = Array.from({ length: 90 }).map((_, offset) => {
      const day = new Date(todayStart.getTime() - (89 - offset) * DAY_MS);
      const key = day.toISOString().slice(0, 10);
      return {
        day: `${day.getMonth() + 1}/${day.getDate()}`,
        kwh: Number((eventKwhByDay.get(key) ?? 0).toFixed(2))
      };
    });

    const kwhByTopic = TOPIC_ORDER.map((topic) => ({
      topic: TOPIC_META[topic].label,
      kwh: Number((eventKwhByTopic.get(topic) ?? 0).toFixed(2))
    }));

    const sortedSessions = [...readingSessions].sort((a, b) => {
      const left = new Date(a.lastActiveAt ?? a.startedAt).getTime();
      const right = new Date(b.lastActiveAt ?? b.startedAt).getTime();
      return right - left;
    });

    const totalSessions = sortedSessions.length;
    const sessionsThisWeek = sortedSessions.filter((session) => {
      const date = new Date(session.lastActiveAt ?? session.startedAt);
      return date >= weekStart;
    }).length;

    const avgSessionSeconds =
      totalSessions > 0
        ? sortedSessions.reduce((sum, session) => sum + (session.activeSeconds ?? 0), 0) /
          totalSessions
        : 0;

    const bestSession = sortedSessions
      .filter((session) => session.sectionsTotal > 0)
      .map((session) => ({
        topic: session.topic,
        score: Math.round((session.sectionsRead / session.sectionsTotal) * 100),
        date: session.lastActiveAt ?? session.startedAt
      }))
      .sort((a, b) => b.score - a.score)[0] ?? null;

    const activityByDay = new Map<string, number>();

    sortedSessions.forEach((session) => {
      const key = toDateKey(session.lastActiveAt ?? session.startedAt);
      if (!key) return;
      activityByDay.set(key, (activityByDay.get(key) ?? 0) + 1);
    });

    attempts.forEach((attempt) => {
      const key = toDateKey(attempt.createdAt);
      if (!key) return;
      activityByDay.set(key, (activityByDay.get(key) ?? 0) + 1);
    });

    const activityHeatmap = Array.from({ length: 180 }).map((_, offset) => {
      const day = new Date(todayStart.getTime() - (179 - offset) * DAY_MS);
      const key = day.toISOString().slice(0, 10);
      return {
        day: key,
        count: activityByDay.get(key) ?? 0
      };
    });

    const timeSpent = Array.from({ length: 8 }).map((_, index) => {
      const rangeEnd = new Date(todayStart.getTime() - (7 - index) * 7 * DAY_MS);
      const rangeStart = new Date(rangeEnd.getTime() - 6 * DAY_MS);

      const seconds = sortedSessions.reduce((sum, session) => {
        const date = new Date(session.lastActiveAt ?? session.startedAt);
        if (date < rangeStart || date > rangeEnd) return sum;
        return sum + (session.activeSeconds ?? 0);
      }, 0);

      return {
        week: `${rangeStart.getMonth() + 1}/${rangeStart.getDate()}`,
        hours: Number((seconds / 3600).toFixed(1))
      };
    });

    const questionsCorrect = attempts.reduce((sum, attempt) => sum + attempt.correct, 0);
    const questionsAttempted = attempts.reduce((sum, attempt) => sum + attempt.total, 0);
    const overallAccuracy =
      questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 0;

    const recentAttempts = [...attempts]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .slice(-30);

    const accuracyTrend = recentAttempts.map((attempt, index) => ({
      label: `S${index + 1}`,
      accuracy: Math.round((attempt.correct / attempt.total) * 100)
    }));

    const topicAttemptMap = new Map<Topic, { correct: number; total: number }>(
      TOPIC_ORDER.map((topic) => [topic, { correct: 0, total: 0 }])
    );

    attempts.forEach((attempt) => {
      const target = topicAttemptMap.get(attempt.topic);
      if (!target) return;
      target.correct += attempt.correct;
      target.total += attempt.total;
    });

    const accuracyByTopic = TOPIC_ORDER.map((topic) => {
      const bucket = topicAttemptMap.get(topic) ?? { correct: 0, total: 0 };
      const accuracy = bucket.total > 0 ? Math.round((bucket.correct / bucket.total) * 100) : 0;
      return {
        topic: TOPIC_META[topic].label,
        accuracy,
        attempted: bucket.total
      };
    });

    const difficultyBuckets: Record<'easy' | 'medium' | 'hard', { correct: number; total: number }> = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 }
    };

    attempts.forEach((attempt) => {
      const difficulty: 'easy' | 'medium' | 'hard' = attempt.questionId
        ? difficultyByQuestionId.get(attempt.questionId) ?? 'medium'
        : 'medium';
      difficultyBuckets[difficulty].correct += attempt.correct;
      difficultyBuckets[difficulty].total += attempt.total;
    });

    const accuracyByDifficulty = (['easy', 'medium', 'hard'] as const).map((difficulty) => {
      const bucket = difficultyBuckets[difficulty];
      const accuracy = bucket.total > 0 ? Math.round((bucket.correct / bucket.total) * 100) : 0;
      return {
        difficulty: difficulty[0].toUpperCase() + difficulty.slice(1),
        accuracy,
        attempted: bucket.total
      };
    });

    const rankedTopics = [...accuracyByTopic].sort((a, b) => a.accuracy - b.accuracy);
    const weakAreas = rankedTopics.slice(0, 3).map((item) => ({ name: item.topic, value: item.accuracy }));
    const strongAreas = [...rankedTopics]
      .reverse()
      .slice(0, 3)
      .map((item) => ({ name: item.topic, value: item.accuracy }));

    const practicedDaySet = new Set(
      activityHeatmap.filter((entry) => entry.count > 0).map((entry) => entry.day)
    );

    const sortedDayKeys = Array.from(practicedDaySet).sort();
    let currentRun = 0;
    let maxRun = 0;

    sortedDayKeys.forEach((dayKey, index) => {
      if (index === 0) {
        currentRun = 1;
        maxRun = 1;
        return;
      }
      const prev = new Date(sortedDayKeys[index - 1]);
      const curr = new Date(dayKey);
      const diff = Math.round((curr.getTime() - prev.getTime()) / DAY_MS);
      if (diff === 1) {
        currentRun += 1;
      } else {
        currentRun = 1;
      }
      maxRun = Math.max(maxRun, currentRun);
    });

    const todayKey = todayStart.toISOString().slice(0, 10);
    const yesterdayKey = new Date(todayStart.getTime() - DAY_MS).toISOString().slice(0, 10);

    let derivedCurrentStreak = 0;
    if (practicedDaySet.has(todayKey) || practicedDaySet.has(yesterdayKey)) {
      let cursor = practicedDaySet.has(todayKey) ? todayStart : new Date(todayStart.getTime() - DAY_MS);
      while (practicedDaySet.has(cursor.toISOString().slice(0, 10))) {
        derivedCurrentStreak += 1;
        cursor = new Date(cursor.getTime() - DAY_MS);
      }
    }

    const currentStreak = Math.max(streak, derivedCurrentStreak);
    const longestStreak = Math.max(maxRun, currentStreak);

    const monthStartDate = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const nextMonthStart = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 1);
    const totalMonthDays = Math.round((nextMonthStart.getTime() - monthStartDate.getTime()) / DAY_MS);

    const streakCalendar = Array.from({ length: totalMonthDays }).map((_, idx) => {
      const day = new Date(monthStartDate.getTime() + idx * DAY_MS);
      const key = day.toISOString().slice(0, 10);
      return {
        day: key,
        practiced: practicedDaySet.has(key)
      };
    });

    const todaySessions = sortedSessions.filter((session) => {
      const key = toDateKey(session.lastActiveAt ?? session.startedAt);
      return key === todayKey;
    }).length;

    const dailyGoalTarget = 3;
    const dailyGoalCurrent = todaySessions;
    const dailyGoalPct = Math.round((dailyGoalCurrent / dailyGoalTarget) * 100);

    const weeklyGoalTarget = 10;
    const weeklyGoalCurrent = sessionsThisWeek;
    const weeklyGoalPct = Math.round((weeklyGoalCurrent / weeklyGoalTarget) * 100);

    const weeklyGoalBars = Array.from({ length: 7 }).map((_, idx) => {
      const day = new Date(weekStart.getTime() + idx * DAY_MS);
      const key = day.toISOString().slice(0, 10);
      const sessions = sortedSessions.filter((session) => {
        const sessionKey = toDateKey(session.lastActiveAt ?? session.startedAt);
        return sessionKey === key;
      }).length;

      return {
        day: `${day.getMonth() + 1}/${day.getDate()}`,
        sessions
      };
    });

    const chaptersDone = topicProgress.reduce(
      (sum, item) => sum + (item.theoryChaptersCompleted ?? 0),
      0
    );
    const chaptersTotal = topicProgress.reduce(
      (sum, item) => sum + (item.theoryChaptersTotal ?? 0),
      0
    );

    const lessonsDone = topicProgress.reduce(
      (sum, item) => sum + (item.theorySectionsRead ?? 0),
      0
    );
    const lessonsTotal = topicProgress.reduce(
      (sum, item) => sum + (item.theorySectionsTotal ?? 0),
      0
    );

    const topicCompletion = TOPIC_ORDER.map((topic) => {
      const entry = topicProgress.find((item) => item.topic === topic);
      const total = entry?.theorySectionsTotal ?? 0;
      const done = entry?.theorySectionsRead ?? 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        topic: TOPIC_META[topic].label,
        pct,
        done,
        total
      };
    });

    const missionsDone = missionProgress.filter((item) => item.state === 'completed').length;
    const missionsTotal = missionProgress.length;

    const flashcardsReviewed = completedQuestions.length;

    let notebooksCount = 0;
    if (typeof window !== 'undefined') {
      const localValue = window.localStorage.getItem('stablegrid-notebooks-completed');
      if (localValue) {
        try {
          const parsed = JSON.parse(localValue);
          if (Array.isArray(parsed)) {
            notebooksCount = parsed.length;
          }
        } catch {
          notebooksCount = 0;
        }
      }
    }

    const globalRank = Math.max(1, 5000 - Math.round(totalKwh * 12));
    const percentile = clamp(Math.round(100 - globalRank / 50), 1, 99);

    const userName = userEmail.split('@')[0] || 'You';
    const topLearners = [
      { name: 'Ada Voltage', kwh: totalKwh + 42 },
      { name: 'Iber Grid Ops', kwh: totalKwh + 23 },
      { name: userName, kwh: totalKwh, isCurrentUser: true },
      { name: 'CatalystNode', kwh: Math.max(0, totalKwh - 6) },
      { name: 'FrequencyFox', kwh: Math.max(0, totalKwh - 12) },
      { name: 'SunWind Labs', kwh: Math.max(0, totalKwh - 19) },
      { name: 'Spark Relay', kwh: Math.max(0, totalKwh - 28) },
      { name: 'Tensor Grid', kwh: Math.max(0, totalKwh - 35) },
      { name: 'North Substation', kwh: Math.max(0, totalKwh - 40) },
      { name: 'Delta Dispatch', kwh: Math.max(0, totalKwh - 48) }
    ];

    return {
      totalKwh,
      kwhThisWeek,
      kwhThisMonth,
      kwhLastWeek,
      kwhTrend,
      kwhByTopic,
      totalSessions,
      sessionsThisWeek,
      avgSessionSeconds,
      bestSession,
      sessionHistory: sortedSessions.slice(0, 20),
      activityHeatmap,
      timeSpent,
      overallAccuracy,
      accuracyTrend,
      accuracyByTopic,
      accuracyByDifficulty,
      weakAreas,
      strongAreas,
      currentStreak,
      longestStreak,
      streakCalendar,
      dailyGoalPct,
      dailyGoalCurrent,
      dailyGoalTarget,
      weeklyGoalPct,
      weeklyGoalCurrent,
      weeklyGoalTarget,
      weeklyGoalBars,
      chaptersDone,
      chaptersTotal,
      lessonsDone,
      lessonsTotal,
      topicCompletion,
      missionsDone,
      missionsTotal,
      flashcardsReviewed,
      notebooksCount,
      globalRank,
      percentile,
      topLearners
    };
  }, [
    attempts,
    completedQuestions,
    difficultyByQuestionId,
    energyEvents,
    missionProgress,
    questionHistory,
    readingSessions,
    streak,
    topicProgress,
    userEmail,
    xp
  ]);
}

function useWidgetData(widgetId: WidgetId, metrics: DashboardMetrics) {
  return useMemo(() => {
    switch (widgetId) {
      case 'total_kwh':
        return {
          value: `${metrics.totalKwh.toFixed(2)} kWh`,
          sub: `${metrics.kwhThisWeek.toFixed(2)} this week`
        };
      case 'kwh_this_week': {
        const delta = metrics.kwhThisWeek - metrics.kwhLastWeek;
        const direction = delta >= 0 ? '+' : '';
        return {
          value: `${metrics.kwhThisWeek.toFixed(2)} kWh`,
          sub: `${direction}${delta.toFixed(2)} vs last week`
        };
      }
      case 'kwh_this_month':
        return {
          value: `${metrics.kwhThisMonth.toFixed(2)} kWh`,
          sub: 'month to date'
        };
      case 'kwh_trend':
        return metrics.kwhTrend;
      case 'kwh_by_topic':
        return metrics.kwhByTopic;
      case 'total_sessions':
        return {
          value: metrics.totalSessions.toString(),
          sub: 'all tracked sessions'
        };
      case 'sessions_this_week':
        return {
          value: metrics.sessionsThisWeek.toString(),
          sub: 'last 7 days'
        };
      case 'avg_session_time':
        return {
          value: formatMinutesToClock(metrics.avgSessionSeconds),
          sub: 'average duration'
        };
      case 'session_history':
        return metrics.sessionHistory;
      case 'activity_heatmap':
        return metrics.activityHeatmap;
      case 'time_spent':
        return metrics.timeSpent;
      case 'best_session':
        return metrics.bestSession;
      case 'overall_accuracy':
        return metrics.overallAccuracy;
      case 'accuracy_trend':
        return metrics.accuracyTrend;
      case 'accuracy_by_topic':
        return metrics.accuracyByTopic;
      case 'accuracy_by_diff':
        return metrics.accuracyByDifficulty;
      case 'weak_areas':
        return metrics.weakAreas;
      case 'strong_areas':
        return metrics.strongAreas;
      case 'current_streak':
        return metrics.currentStreak;
      case 'longest_streak':
        return metrics.longestStreak;
      case 'streak_calendar':
        return metrics.streakCalendar;
      case 'daily_goal':
        return {
          pct: clamp(metrics.dailyGoalPct, 0, 100),
          current: metrics.dailyGoalCurrent,
          target: metrics.dailyGoalTarget
        };
      case 'weekly_goal':
        return {
          pct: clamp(metrics.weeklyGoalPct, 0, 100),
          current: metrics.weeklyGoalCurrent,
          target: metrics.weeklyGoalTarget,
          bars: metrics.weeklyGoalBars
        };
      case 'chapters_done':
        return {
          value: `${metrics.chaptersDone}/${metrics.chaptersTotal}`,
          sub: 'chapters complete'
        };
      case 'lessons_done':
        return {
          value: `${metrics.lessonsDone}/${metrics.lessonsTotal}`,
          sub: 'lessons complete'
        };
      case 'topic_progress':
        return metrics.topicCompletion;
      case 'missions_done':
        return {
          value: `${metrics.missionsDone}/${metrics.missionsTotal}`,
          sub: 'missions complete'
        };
      case 'flashcards_reviewed':
        return {
          value: metrics.flashcardsReviewed.toString(),
          sub: 'reviewed cards'
        };
      case 'notebooks_created':
        return {
          value: metrics.notebooksCount.toString(),
          sub: 'completed notebooks'
        };
      case 'completion_rate':
        return metrics.topicCompletion;
      case 'global_rank':
        return {
          value: `#${metrics.globalRank}`,
          sub: 'estimated rank'
        };
      case 'percentile':
        return {
          value: `Top ${metrics.percentile}%`,
          sub: 'among active learners'
        };
      case 'top_learners':
        return metrics.topLearners;
      default:
        return null;
    }
  }, [widgetId, metrics]);
}

const LazyWidgetContent = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.15,
        rootMargin: '80px'
      }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className="h-full">
      {visible ? (
        children
      ) : (
        <div className="h-full animate-pulse rounded-lg bg-emerald-400/5" />
      )}
    </div>
  );
};

const WidgetBody = memo(function WidgetBody({
  widgetId,
  data
}: {
  widgetId: WidgetId;
  data: ReturnType<typeof useWidgetData>;
}) {
  const metricCard = (value: string, sub: string) => {
    // Split value into number + unit for typographic hierarchy
    const match = value.match(/^([0-9.,]+)\s*(.*)$/);
    const numPart = match ? match[1] : value;
    const unitPart = match ? match[2] : '';
    return (
      <div className="flex h-full flex-col justify-center gap-1">
        <p className="flex items-baseline gap-1.5 leading-none">
          <span className="text-4xl font-black tracking-tight text-text-light-primary dark:text-text-dark-primary">
            {numPart}
          </span>
          {unitPart ? (
            <span className="text-sm font-medium text-text-light-tertiary dark:text-text-dark-tertiary">
              {unitPart}
            </span>
          ) : null}
        </p>
        <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">{sub}</p>
      </div>
    );
  };

  if (widgetId === 'total_kwh' || widgetId === 'kwh_this_week' || widgetId === 'kwh_this_month') {
    const metric = data as { value: string; sub: string };
    return metricCard(metric.value, metric.sub);
  }

  if (widgetId === 'total_sessions' || widgetId === 'sessions_this_week' || widgetId === 'avg_session_time') {
    const metric = data as { value: string; sub: string };
    return metricCard(metric.value, metric.sub);
  }

  if (
    widgetId === 'chapters_done' ||
    widgetId === 'lessons_done' ||
    widgetId === 'missions_done' ||
    widgetId === 'flashcards_reviewed' ||
    widgetId === 'notebooks_created' ||
    widgetId === 'global_rank' ||
    widgetId === 'percentile'
  ) {
    const metric = data as { value: string; sub: string };
    return metricCard(metric.value, metric.sub);
  }

  if (widgetId === 'kwh_trend') {
    const points = data as Array<{ day: string; kwh: number }>;
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
          <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={34} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#020617',
              borderColor: 'rgba(16,185,129,0.35)',
              borderRadius: 10,
              color: '#e2e8f0'
            }}
          />
          <Line type="monotone" dataKey="kwh" stroke="#10b981" strokeWidth={2.4} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (widgetId === 'kwh_by_topic') {
    const points = data as Array<{ topic: string; kwh: number }>;
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={points}
            dataKey="kwh"
            nameKey="topic"
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={72}
            paddingAngle={3}
          >
            {points.map((entry, index) => (
              <Cell key={entry.topic} fill={TOPIC_COLORS[index % TOPIC_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#020617',
              borderColor: 'rgba(16,185,129,0.35)',
              borderRadius: 10,
              color: '#e2e8f0'
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (widgetId === 'session_history') {
    const sessions = data as ReadingSession[];
    return (
      <div className="h-full overflow-auto pr-1 scrollbar-slim">
        <div className="space-y-2">
          {sessions.map((session) => {
            const percent =
              session.sectionsTotal > 0
                ? Math.round((session.sectionsRead / session.sectionsTotal) * 100)
                : 0;
            return (
              <div
                key={session.id}
                className="rounded-lg border border-light-border/70 bg-light-bg/70 px-3 py-2 dark:border-dark-border/70 dark:bg-dark-bg/50"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
                    {TOPIC_META[session.topic].label} · Ch {session.chapterNumber}
                  </p>
                  <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                    {percent}%
                  </p>
                </div>
                <p className="mt-1 text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
                  {formatRelativeDate(session.lastActiveAt)} · {Math.round((session.activeSeconds ?? 0) / 60)}m
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (widgetId === 'activity_heatmap') {
    const heatmap = data as Array<{ day: string; count: number }>;
    const max = Math.max(...heatmap.map((entry) => entry.count), 1);

    return (
      <div className="flex h-full flex-col">
        <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-1">
          {heatmap.slice(-180).map((entry) => {
            const level = Math.round((entry.count / max) * 4);
            const classes = [
              'bg-slate-200 dark:bg-slate-800',
              'bg-emerald-200 dark:bg-emerald-900/45',
              'bg-emerald-300 dark:bg-emerald-800/60',
              'bg-emerald-400 dark:bg-emerald-700/70',
              'bg-emerald-500 dark:bg-emerald-600'
            ];
            return (
              <div
                key={entry.day}
                className={`h-2.5 rounded-sm ${classes[clamp(level, 0, 4)]}`}
                title={`${entry.day}: ${entry.count} activities`}
              />
            );
          })}
        </div>
        <div className="mt-auto flex items-center justify-between pt-2 text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
          <span>Last 6 months</span>
          <span>More activity = brighter</span>
        </div>
      </div>
    );
  }

  if (widgetId === 'time_spent') {
    const points = data as Array<{ week: string; hours: number }>;
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
          <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#020617',
              borderColor: 'rgba(16,185,129,0.35)',
              borderRadius: 10,
              color: '#e2e8f0'
            }}
          />
          <Bar dataKey="hours" fill="#10b981" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (widgetId === 'best_session') {
    const best = data as DashboardMetrics['bestSession'];
    if (!best) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          Complete a session to see your best run.
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col justify-center">
        <p className="text-3xl font-semibold text-emerald-500">{best.score}%</p>
        <p className="mt-1 text-sm text-text-light-primary dark:text-text-dark-primary">
          {TOPIC_META[best.topic].label}
        </p>
        <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          {formatRelativeDate(best.date)}
        </p>
      </div>
    );
  }

  if (widgetId === 'overall_accuracy') {
    const accuracy = data as number;
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - clamp(accuracy, 0, 100) / 100);
    // Derive attempted/correct from metrics passed via data being accuracy number
    // Show a supportive breakdown in the card footer
    const accuracyColor = accuracy >= 80 ? '#10b981' : accuracy >= 50 ? '#f59e0b' : '#ef4444';

    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={radius} stroke="rgba(148,163,184,0.15)" strokeWidth="10" fill="none" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke={accuracyColor}
              strokeWidth="10"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black tracking-tight text-text-light-primary dark:text-text-dark-primary">
              {accuracy}%
            </span>
            <span className="text-[10px] uppercase tracking-widest text-text-light-tertiary dark:text-text-dark-tertiary">
              accuracy
            </span>
          </div>
        </div>
        <p className="text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
          {accuracy >= 80 ? 'Excellent performance' : accuracy >= 50 ? 'Keep practising' : 'Start practising to improve'}
        </p>
      </div>
    );
  }

  if (widgetId === 'accuracy_trend') {
    const points = data as Array<{ label: string; accuracy: number }>;
    if (points.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-light-border/80 bg-light-bg/40 px-4 text-center dark:border-dark-border/80 dark:bg-dark-bg/40">
          <Activity className="h-6 w-6 text-emerald-500/80" />
          <p className="mt-2 text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
            No accuracy trend yet
          </p>
          <p className="mt-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            Complete practice sessions to see your accuracy trend.
          </p>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={20} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={30} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#020617',
              borderColor: 'rgba(16,185,129,0.35)',
              borderRadius: 10,
              color: '#e2e8f0'
            }}
          />
          <Line type="monotone" dataKey="accuracy" stroke="#34d399" strokeWidth={2.4} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (widgetId === 'accuracy_by_topic') {
    const points = data as DashboardMetrics['accuracyByTopic'];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
          <XAxis dataKey="topic" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={30} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#020617',
              borderColor: 'rgba(16,185,129,0.35)',
              borderRadius: 10,
              color: '#e2e8f0'
            }}
          />
          <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
            {points.map((entry, index) => (
              <Cell key={entry.topic} fill={TOPIC_COLORS[index % TOPIC_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (widgetId === 'accuracy_by_diff') {
    const points = data as DashboardMetrics['accuracyByDifficulty'];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
          <XAxis dataKey="difficulty" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={30} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#020617',
              borderColor: 'rgba(16,185,129,0.35)',
              borderRadius: 10,
              color: '#e2e8f0'
            }}
          />
          <Bar dataKey="accuracy" fill="#10b981" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (widgetId === 'weak_areas' || widgetId === 'strong_areas') {
    const rows = data as Array<{ name: string; value: number }>;
    return (
      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.name}
            className="rounded-lg border border-light-border/70 bg-light-bg/70 px-3 py-2 dark:border-dark-border/70 dark:bg-dark-bg/50"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">{row.name}</p>
              <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">{row.value}%</p>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (widgetId === 'current_streak' || widgetId === 'longest_streak') {
    const streakValue = data as number;
    return (
      <div className="flex h-full flex-col justify-center gap-1">
        <div className="flex items-center gap-2">
          <Flame className="h-6 w-6 shrink-0 text-emerald-500" />
          <p className="flex items-baseline gap-1.5 leading-none">
            <span className="text-4xl font-black tracking-tight text-emerald-500">
              {streakValue}
            </span>
            <span className="text-sm font-medium text-text-light-tertiary dark:text-text-dark-tertiary">
              days
            </span>
          </p>
        </div>
        <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          {widgetId === 'current_streak' ? 'current streak' : 'longest streak'}
        </p>
      </div>
    );
  }

  if (widgetId === 'streak_calendar') {
    const days = data as DashboardMetrics['streakCalendar'];
    const startWeekday = new Date(days[0]?.day ?? Date.now()).getDay();
    const leading = Array.from({ length: startWeekday });

    return (
      <div className="grid h-full grid-cols-7 gap-1 text-[10px]">
        {leading.map((_, index) => (
          <div key={`pad-${index}`} />
        ))}
        {days.map((day) => (
          <div
            key={day.day}
            className={`flex items-center justify-center rounded-md border ${
              day.practiced
                ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                : 'border-light-border/60 bg-light-bg/40 text-text-light-tertiary dark:border-dark-border/70 dark:bg-dark-bg/40 dark:text-text-dark-tertiary'
            }`}
            title={day.day}
          >
            {new Date(day.day).getDate()}
          </div>
        ))}
      </div>
    );
  }

  if (widgetId === 'daily_goal') {
    const goal = data as { pct: number; current: number; target: number };
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - goal.pct / 100);

    return (
      <div className="flex h-full items-center justify-center">
        <div className="relative h-20 w-20">
          <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
            <circle cx="44" cy="44" r={radius} stroke="rgba(148,163,184,0.24)" strokeWidth="7" fill="none" />
            <circle
              cx="44"
              cy="44"
              r={radius}
              stroke="#10b981"
              strokeWidth="7"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">{goal.pct}%</span>
            <span className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary">
              {goal.current}/{goal.target}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (widgetId === 'weekly_goal') {
    const goal = data as {
      pct: number;
      current: number;
      target: number;
      bars: DashboardMetrics['weeklyGoalBars'];
    };

    return (
      <div className="flex h-full flex-col justify-between">
        <div>
          <p className="text-2xl font-semibold text-emerald-500">{goal.pct}%</p>
          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            {goal.current}/{goal.target} sessions this week
          </p>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1.5">
          {goal.bars.map((bar) => (
            <div key={bar.day} className="text-center">
              <div className="h-12 overflow-hidden rounded bg-light-border dark:bg-dark-border">
                <div
                  className="mt-auto h-full w-full rounded bg-emerald-500"
                  style={{
                    transform: `translateY(${100 - Math.min(100, bar.sessions * 33)}%)`
                  }}
                />
              </div>
              <p className="mt-1 text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary">{bar.day}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (widgetId === 'topic_progress') {
    const rows = data as DashboardMetrics['topicCompletion'];
    return (
      <div className="space-y-3 pr-3">
        {rows.map((row) => (
          <div key={row.topic}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-text-light-secondary dark:text-text-dark-secondary">{row.topic}</span>
              <span className="text-text-light-tertiary dark:text-text-dark-tertiary">
                {row.pct}% ({row.done}/{row.total})
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${row.pct}%`,
                  backgroundColor: '#10b981'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (widgetId === 'completion_rate') {
    const rows = data as DashboardMetrics['topicCompletion'];
    const chartData = rows.map((row) => ({
      topic: row.topic,
      completion: row.pct
    }));

    return (
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
          <PolarGrid stroke="rgba(148,163,184,0.22)" />
          <PolarAngleAxis dataKey="topic" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} />
          <Radar dataKey="completion" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#020617',
              borderColor: 'rgba(16,185,129,0.35)',
              borderRadius: 10,
              color: '#e2e8f0'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  if (widgetId === 'top_learners') {
    const rows = data as DashboardMetrics['topLearners'];
    return (
      <div className="h-full overflow-auto pr-1 scrollbar-slim">
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div
              key={row.name}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                row.isCurrentUser
                  ? 'border-emerald-500/45 bg-emerald-500/12'
                  : 'border-light-border/70 bg-light-bg/60 dark:border-dark-border/70 dark:bg-dark-bg/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400">
                  {index + 1}
                </span>
                <p className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">{row.name}</p>
              </div>
              <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">{row.kwh.toFixed(1)} kWh</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
      Widget data unavailable.
    </div>
  );
});

const WidgetSurface = memo(function WidgetSurface({
  widgetId,
  isEditMode,
  canMoveUp,
  canMoveDown,
  onRemove,
  onMoveUp,
  onMoveDown,
  metrics,
  isMobileList
}: {
  widgetId: WidgetId;
  isEditMode: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onRemove: (id: WidgetId) => void;
  onMoveUp?: (id: WidgetId) => void;
  onMoveDown?: (id: WidgetId) => void;
  metrics: DashboardMetrics;
  isMobileList?: boolean;
}) {
  const widget = WIDGET_BY_ID.get(widgetId);
  const data = useWidgetData(widgetId, metrics);

  if (!widget) {
    return null;
  }

  const Icon = widget.icon;

  return (
    <article
      className={`h-full rounded-[14px] border p-4 transition-colors ${
        isEditMode
          ? 'border-dashed border-emerald-500/30 bg-emerald-500/[0.05] hover:border-emerald-500/50'
          : 'border-neutral-200/80 bg-white/95 shadow-[0_2px_8px_rgba(15,23,42,0.14)] dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
      }`}
      style={{
        boxShadow: isEditMode
          ? 'inset 0 0 0 1px rgba(16,185,129,0.08)'
          : undefined,
        backgroundImage: isEditMode
          ? undefined
          : 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0))'
      }}
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div
          className={`flex items-start gap-2 ${
            isEditMode && !isMobileList ? 'widget-drag-handle cursor-move' : ''
          }`}
        >
          {isEditMode ? (
            <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500/80" />
          ) : null}
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-emerald-500/70" />
            <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              {widget.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isMobileList && isEditMode && onMoveUp && onMoveDown ? (
            <>
              <button
                type="button"
                className="rounded-md p-1 text-text-light-tertiary transition-colors hover:bg-light-hover hover:text-text-light-primary dark:text-text-dark-tertiary dark:hover:bg-dark-hover dark:hover:text-text-dark-primary"
                onClick={() => onMoveUp(widgetId)}
                disabled={!canMoveUp}
                title="Move up"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="rounded-md p-1 text-text-light-tertiary transition-colors hover:bg-light-hover hover:text-text-light-primary dark:text-text-dark-tertiary dark:hover:bg-dark-hover dark:hover:text-text-dark-primary"
                onClick={() => onMoveDown(widgetId)}
                disabled={!canMoveDown}
                title="Move down"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </>
          ) : null}
          {isEditMode ? (
            <button
              type="button"
              onClick={() => onRemove(widgetId)}
              className="rounded-md p-1 text-text-light-tertiary transition-colors hover:bg-error-50 hover:text-error-600 dark:text-text-dark-tertiary dark:hover:bg-error-900/20 dark:hover:text-error-400"
              title="Remove widget"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </header>

      <div className="h-[calc(100%-2.5rem)]">
        <LazyWidgetContent>
          <WidgetBody widgetId={widgetId} data={data} />
        </LazyWidgetContent>
      </div>
    </article>
  );
});

export const ProgressDashboard = ({
  userId,
  userEmail,
  topicProgress,
  readingSessions,
  missionProgress,
  practiceHistory,
  initialDashboardLayout
}: ProgressDashboardProps) => {
  const viewportWidth = useViewportWidth();
  const { ref: gridContainerRef, width: gridContainerWidth } = useElementWidth<HTMLDivElement>();
  const activeGridWidth = gridContainerWidth ?? viewportWidth ?? BREAKPOINTS.lg;
  const isMobile = (viewportWidth ?? 9999) < BREAKPOINTS.md;

  const metrics = useDashboardMetrics({
    userEmail,
    topicProgress,
    readingSessions,
    missionProgress,
    practiceHistory
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeBreakpoint, setActiveBreakpoint] = useState<BreakpointKey>('lg');
  const [dashboardName, setDashboardName] = useState(() => {
    if (typeof window === 'undefined') return 'Progress Dashboard';
    return localStorage.getItem(`dashboard-name-${userId}`) ?? 'Progress Dashboard';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(dashboardName);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveToastOpen, setSaveToastOpen] = useState(false);
  const [layouts, setLayouts] = useState<GridLayouts>(() =>
    normalizeLoadedLayouts(initialDashboardLayout)
  );
  const [categoryOpen, setCategoryOpen] = useState<Record<WidgetCategory, boolean>>({
    'Energy & Points': true,
    'Practice & Sessions': true,
    'Accuracy & Performance': true,
    'Streaks & Consistency': true,
    'Completion & Progress': true,
    'Leaderboard & Social': true
  });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHydrateRef = useRef(false);
  const layoutsRef = useRef(layouts);

  useEffect(() => {
    if (didHydrateRef.current) return;
    didHydrateRef.current = true;
    setLayouts(normalizeLoadedLayouts(initialDashboardLayout));
  }, [initialDashboardLayout]);

  useEffect(() => {
    layoutsRef.current = layouts;
  }, [layouts]);

  useEffect(() => {
    return () => {
      if (saveToastTimeoutRef.current) {
        clearTimeout(saveToastTimeoutRef.current);
      }
    };
  }, []);

  const activeWidgetIds = useMemo(() => {
    const ids = new Set<WidgetId>();
    (['lg', 'md', 'sm'] as BreakpointKey[]).forEach((bp) => {
      layouts[bp].forEach((item) => {
        if (WIDGET_BY_ID.has(item.i as WidgetId)) {
          ids.add(item.i as WidgetId);
        }
      });
    });
    return ids;
  }, [layouts]);

  const mobileOrderedWidgets = useMemo(() => {
    return [...layouts.sm]
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map((item) => item.i as WidgetId)
      .filter((id) => WIDGET_BY_ID.has(id));
  }, [layouts.sm]);

  const handleLayoutChange = useCallback((_current: unknown, all: unknown) => {
    setLayouts((previous) => {
      const merged = {
        lg:
          all && typeof all === 'object' && Array.isArray((all as Record<string, unknown>).lg)
            ? (all as Record<string, unknown>).lg
            : previous.lg,
        md:
          all && typeof all === 'object' && Array.isArray((all as Record<string, unknown>).md)
            ? (all as Record<string, unknown>).md
            : previous.md,
        sm:
          all && typeof all === 'object' && Array.isArray((all as Record<string, unknown>).sm)
            ? (all as Record<string, unknown>).sm
            : previous.sm
      };

      return normalizeLoadedLayouts(merged);
    });
  }, []);

  const handleResizeStop = useCallback(
    (_layout: unknown, _oldItem: unknown, newItem: unknown) => {
      if (!newItem || typeof newItem !== 'object') return;

      const nextItem = newItem as Record<string, unknown>;
      const id = nextItem.i;
      if (typeof id !== 'string' || !WIDGET_BY_ID.has(id as WidgetId)) return;

      const parsedW = Number(nextItem.w);
      const parsedH = Number(nextItem.h);
      if (!Number.isFinite(parsedW) || !Number.isFinite(parsedH)) return;

      const snapped = getNearestSnapSize(
        id as WidgetId,
        Math.round(parsedW),
        Math.round(parsedH),
        activeBreakpoint
      );

      setLayouts((previous) => ({
        ...previous,
        [activeBreakpoint]: previous[activeBreakpoint].map((entry) =>
          entry.i === id
            ? {
                ...entry,
                w: snapped.w,
                h: snapped.h
              }
            : entry
        )
      }));
    },
    [activeBreakpoint]
  );

  const addWidget = useCallback((id: WidgetId) => {
    setLayouts((previous) => {
      const next: GridLayouts = {
        lg: [...previous.lg],
        md: [...previous.md],
        sm: [...previous.sm]
      };

      (['lg', 'md', 'sm'] as BreakpointKey[]).forEach((bp) => {
        if (next[bp].some((item) => item.i === id)) return;
        const size = getWidgetSizeForBreakpoint(id, bp);
        next[bp].push({
          i: id,
          x: 0,
          y: Infinity,
          w: size.w,
          h: size.h,
          minW: bp === 'sm' ? COLS.sm : 2,
          maxW: bp === 'sm' ? COLS.sm : undefined,
          minH: 2
        });
      });

      return next;
    });
  }, []);

  const removeWidget = useCallback((id: WidgetId) => {
    setLayouts((previous) => ({
      lg: previous.lg.filter((item) => item.i !== id),
      md: previous.md.filter((item) => item.i !== id),
      sm: previous.sm.filter((item) => item.i !== id)
    }));
  }, []);

  const moveMobileWidget = useCallback((id: WidgetId, direction: 'up' | 'down') => {
    setLayouts((previous) => {
      const ordered = [...previous.sm].sort((a, b) => a.y - b.y || a.x - b.x);
      const index = ordered.findIndex((item) => item.i === id);
      if (index < 0) return previous;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= ordered.length) return previous;

      return {
        ...previous,
        sm: reorderMobileLayout(previous.sm, index, targetIndex)
      };
    });
  }, []);

  const resetToDefault = useCallback(() => {
    if (!window.confirm('Reset dashboard layout to default?')) {
      return;
    }
    setLayouts(buildDefaultLayouts());
  }, []);

  const persistLayouts = useCallback(
    async (nextLayouts: GridLayouts) => {
      if (!userId) return;
      const supabase = createClient();
      const { error } = await supabase.from('dashboard_layouts').upsert(
        {
          user_id: userId,
          layout: nextLayouts
        },
        {
          onConflict: 'user_id'
        }
      );

      if (error) {
        setSaveState('error');
        setSaveToastOpen(true);
        if (saveToastTimeoutRef.current) {
          clearTimeout(saveToastTimeoutRef.current);
        }
        saveToastTimeoutRef.current = setTimeout(() => {
          setSaveToastOpen(false);
        }, 5000);
        return;
      }

      if (saveToastTimeoutRef.current) {
        clearTimeout(saveToastTimeoutRef.current);
      }
      setSaveToastOpen(false);
      setSaveState('saved');
      setTimeout(() => {
        setSaveState((current) => (current === 'saved' ? 'idle' : current));
      }, 1200);
    },
    [userId]
  );

  const retrySave = useCallback(() => {
    setSaveState('saving');
    void persistLayouts(layoutsRef.current);
  }, [persistLayouts]);

  const commitName = useCallback(() => {
    const trimmed = nameInput.trim() || 'Progress Dashboard';
    setDashboardName(trimmed);
    setNameInput(trimmed);
    setIsEditingName(false);
    localStorage.setItem(`dashboard-name-${userId}`, trimmed);
  }, [nameInput, userId]);

  useEffect(() => {
    if (!didHydrateRef.current) return;
    if (!userId) return;

    setSaveState('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const nextLayouts = layouts;
    saveTimeoutRef.current = setTimeout(() => {
      void persistLayouts(nextLayouts);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [layouts, userId, persistLayouts]);

  const groupedWidgets = useMemo(() => {
    const grouped = new Map<WidgetCategory, WidgetCatalogEntry[]>();

    CATEGORY_ORDER.forEach((category) => {
      grouped.set(category, []);
    });

    WIDGET_CATALOG.forEach((widget) => {
      const bucket = grouped.get(widget.category);
      if (!bucket) return;
      bucket.push(widget);
    });

    return grouped;
  }, []);

  const dashboardSummary = `${formatDayCount(metrics.currentStreak)} streak · ${metrics.totalKwh.toFixed(2)} kWh earned · ${metrics.overallAccuracy}% accuracy`;
  const desktopDrawerOpen = isEditMode && drawerOpen && !isMobile;

  useEffect(() => {
    if (!isEditMode) return;
    const timeoutId = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 320);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [drawerOpen, isEditMode, isMobile]);

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 dark:bg-neutral-950 lg:pb-8">
      <div
        className="mx-auto w-full max-w-[1140px] px-6 py-7 lg:px-8"
        style={
          desktopDrawerOpen
            ? {
                marginRight: DRAWER_WIDTH_PX,
                transition: 'margin-right 300ms ease'
              }
            : undefined
        }
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={isEditMode ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => {
                const next = !isEditMode;
                setIsEditMode(next);
                setDrawerOpen(next);
              }}
            >
              <Pencil className="h-4 w-4" />
              {isEditMode ? 'Done' : 'Customize'}
            </button>

            {isEditMode ? (
              <>
                <button type="button" className="btn btn-secondary" onClick={resetToDefault}>
                  <RefreshCcw className="h-4 w-4" />
                  Reset
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDrawerOpen((open) => !open)}
                >
                  <Plus className="h-4 w-4" />
                  Add Widgets
                </button>
              </>
            ) : null}
          </div>

          <div className="text-right">
            {isEditingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={nameInput}
                maxLength={48}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitName();
                  if (e.key === 'Escape') {
                    setNameInput(dashboardName);
                    setIsEditingName(false);
                  }
                }}
                className="w-64 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xl font-bold text-neutral-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-emerald-400"
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="group flex items-center gap-2 text-right"
                onClick={() => {
                  setNameInput(dashboardName);
                  setIsEditingName(true);
                  setTimeout(() => nameInputRef.current?.select(), 0);
                }}
              >
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {dashboardName}
                </h1>
                <Pencil className="h-3.5 w-3.5 text-neutral-400 opacity-0 transition group-hover:opacity-100 dark:text-neutral-500" />
              </button>
            )}
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {dashboardSummary}
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-end text-xs text-neutral-500 dark:text-neutral-400">
          <p
            className={`font-medium ${
              saveState === 'saving'
                ? 'text-amber-500'
                : saveState === 'saved'
                  ? 'text-emerald-500'
                  : saveState === 'error'
                    ? 'text-amber-500'
                    : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {saveState === 'saving'
              ? 'Saving layout...'
              : saveState === 'saved'
                ? 'Layout saved'
                : saveState === 'error'
                  ? 'Autosave paused'
                  : 'Auto-save on'}
          </p>
        </div>

        <div className="relative">
          <div
            ref={gridContainerRef}
            className={`overflow-hidden rounded-xl border border-neutral-200/70 p-2 dark:border-neutral-800/70 ${
              isEditMode ? 'progress-dashboard-editing' : 'bg-transparent'
            }`}
          >
            {activeWidgetIds.size === 0 && !isEditMode ? (
              <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                  <LayoutGrid className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
                </div>
                <div className="max-w-sm">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Your dashboard is empty
                  </h2>
                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    Start tracking your progress by adding widgets. Choose metrics, charts, and streaks that matter most to you.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setIsEditMode(true);
                    setDrawerOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add your first widget
                </button>
              </div>
            ) : isMobile ? (
              <div className="space-y-3">
                {mobileOrderedWidgets.map((widgetId, index) => (
                  <div key={widgetId} className="min-h-[230px]">
                    <WidgetSurface
                      widgetId={widgetId}
                      isEditMode={isEditMode}
                      onRemove={removeWidget}
                      onMoveUp={(id) => moveMobileWidget(id, 'up')}
                      onMoveDown={(id) => moveMobileWidget(id, 'down')}
                      canMoveUp={index > 0}
                      canMoveDown={index < mobileOrderedWidgets.length - 1}
                      metrics={metrics}
                      isMobileList
                    />
                  </div>
                ))}
              </div>
            ) : (
                <Responsive
                  className="layout"
                  width={activeGridWidth}
                  rowHeight={80}
                  margin={[12, 12]}
                  containerPadding={[16, 12]}
                  breakpoints={BREAKPOINTS}
                  cols={COLS}
                  layouts={layouts}
                onLayoutChange={handleLayoutChange}
                onBreakpointChange={(breakpoint: string) =>
                  setActiveBreakpoint((breakpoint as BreakpointKey) ?? 'lg')
                }
                onResizeStop={handleResizeStop}
                dragConfig={{
                  enabled: isEditMode,
                  bounded: false,
                  handle: '.widget-drag-handle',
                  threshold: 3
                }}
                resizeConfig={{
                  enabled: isEditMode,
                  handles: ['se']
                }}
              >
                {Array.from(activeWidgetIds).map((widgetId) => (
                  <div key={widgetId}>
                    <WidgetSurface
                      widgetId={widgetId}
                      isEditMode={isEditMode}
                      onRemove={removeWidget}
                      metrics={metrics}
                    />
                  </div>
                ))}
              </Responsive>
            )}
          </div>

          {isEditMode && drawerOpen && isMobile ? (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/50"
              aria-label="Close widget drawer backdrop"
              onClick={() => setDrawerOpen(false)}
            />
          ) : null}

          {isEditMode ? (
            <aside
              className={`fixed inset-y-0 left-0 z-50 border-r border-neutral-200 bg-white p-4 shadow-2xl transition-transform duration-300 ease-in-out dark:border-neutral-800 dark:bg-neutral-950 ${
                isMobile ? 'w-full' : 'w-[340px] max-w-[92vw]'
              } ${drawerOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Add Widgets</h2>
                <button
                  type="button"
                  className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                  onClick={() => setDrawerOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="h-[calc(100%-2.25rem)] overflow-auto pr-1 scrollbar-slim">
                {CATEGORY_ORDER.map((category) => {
                  const isOpen = categoryOpen[category];
                  const widgets = groupedWidgets.get(category) ?? [];

                  return (
                    <section key={category} className="mb-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between text-left"
                        onClick={() =>
                          setCategoryOpen((prev) => ({
                            ...prev,
                            [category]: !prev[category]
                          }))
                        }
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
                          {category}
                        </p>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-neutral-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-neutral-500" />
                        )}
                      </button>

                      {isOpen ? (
                        <div className="mt-2 space-y-2">
                          {widgets.map((widget) => {
                            const Icon = widget.icon;
                            const isAdded = activeWidgetIds.has(widget.id);
                            return (
                              <div
                                key={widget.id}
                                className="rounded-md border border-neutral-200 p-2 dark:border-neutral-800"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex min-w-0 gap-2">
                                    <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                                    <div>
                                      <p className="text-xs font-medium text-neutral-900 dark:text-white">
                                        {widget.title}
                                      </p>
                                      <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                                        {widget.description}
                                      </p>
                                      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500">
                                        {SIZE_PRESETS[widget.defaultSize].label}
                                      </p>
                                    </div>
                                  </div>
                                  {isAdded ? (
                                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                                      Added
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      className="rounded-md border border-neutral-300 px-2 py-1 text-[10px] font-medium text-neutral-600 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                                      onClick={() => addWidget(widget.id)}
                                    >
                                      Add
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            </aside>
          ) : null}
        </div>

        {saveToastOpen ? (
          <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-red-300/50 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-red-500/40 dark:bg-neutral-900/95">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">Save failed</p>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                  We could not persist your dashboard layout.
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                onClick={() => setSaveToastOpen(false)}
                aria-label="Dismiss save error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-emerald-600"
                onClick={retrySave}
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
