import { NextResponse } from 'next/server';
import { toApiErrorResponse } from '@/lib/api/http';
import { createClient } from '@/lib/supabase/server';
import { getPracticeSet } from '@/data/operations/practice-sets';
import {
  PRACTICE_TOPIC_TIER_MAP,
  type PracticeTier,
} from '@/lib/practice/topicTierMap';
import { getCodingTopic } from '@/lib/practice/codingTopics';
import { getCodingLanguage } from '@/lib/practice/codingLanguages';
import {
  PRACTICE_CATEGORIES,
  getTopicCategory,
  type PracticeCategoryId,
} from '@/lib/practice/categories';

// Cross-module practice mastery summary for the /stats dashboard.
//
// GET /api/operations/practice/mastery
//   → { data: CategoryMastery[] }
//
// Three-layer hierarchy: category → language (Coding only) → topic →
// tier breakdown. Categories without practice content yet (Logic, Math &
// Statistics, Computer Science) appear as empty stubs so the user knows
// what's coming.
//
// Server-side aggregation keeps the fragile cross-table joining (tier
// map → practice-set registry → task-attempt log) in one place; the
// client just walks the resulting tree.

type AttemptResult = 'success' | 'failure' | 'self_review';

interface TaskMastery {
  taskId: string;
  title: string;
  bestResult: AttemptResult | null;
  lastAttemptedAt: string | null;
}

interface TierMastery {
  slug: PracticeTier;
  moduleId: string;
  language: string;
  practiceSetTitle: string;
  total: number;
  solved: number;
  failed: number;
  tasks: TaskMastery[];
}

interface TopicMastery {
  topicId: string;
  topicTitle: string;
  totalTasks: number;
  solvedTasks: number;
  tiers: TierMastery[];
}

interface LanguageMastery {
  languageId: string;
  languageTitle: string;
  accentRgb: string;
  href: string;
  totalTasks: number;
  solvedTasks: number;
  topics: TopicMastery[];
}

interface CategoryMastery {
  categoryId: PracticeCategoryId;
  categoryTitle: string;
  accentRgb: string;
  href: string;
  totalTasks: number;
  solvedTasks: number;
  /** Languages present under Coding; for non-coding categories this is empty. */
  languages: LanguageMastery[];
}

interface AttemptRow {
  module_id: string;
  task_id: string;
  result: AttemptResult;
  attempted_at: string;
}

/**
 * Roll-up numbers for the milestone strip on /stats. Computed in the
 * same handler so /stats only needs one practice fetch to drive both
 * the mastery panel and the milestone grid.
 */
interface PracticeSummary {
  distinctTasksSolved: number;
  distinctTasksAttempted: number;
  totalTasksAcrossLibrary: number;
  modulesComplete: number;
  modulesAttempted: number;
  topicsTouched: number;
  recentAttempts: number;
  recentAccuracy: number | null;
  /**
   * Per-tier breakdown of modules where every task is solved. Senior
   * tier promotion requires at least one Mid+ practice module complete,
   * so the dashboard / sidebar / profile tier-hero pages need this
   * split — totals alone aren't enough.
   */
  modulesCompleteByTier: { junior: number; mid: number; senior: number };
  /**
   * Per-day attempt counts over the last 84 days, oldest first. Drives
   * the cross-cutting Consistency heatmap on /stats — combined with
   * reading-session minutes so a single cell reflects total activity.
   */
  dailyActivity: Array<{ date: string; attempts: number }>;
}

const HEATMAP_WINDOW_DAYS = 84;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const isMissingTableError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('practice_task_attempts') &&
    (msg.includes('does not exist') || msg.includes('42p01'))
  );
};

const TIER_ORDER: Record<PracticeTier, number> = { junior: 0, mid: 1, senior: 2 };
const LANGUAGE_ORDER = ['pyspark', 'python', 'sql'];

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Walk the tier map and resolve every (topic, tier) → practice set.
    // The denormalized list is easier to attach attempts to than the
    // nested category/language/topic shape we ultimately return.
    interface UniverseEntry {
      categoryId: PracticeCategoryId;
      languageId: string;
      slug: PracticeTier;
      moduleId: string;
      practiceSetTitle: string;
      topicId: string;
      topicTitle: string;
      tasks: Array<{ id: string; title: string }>;
    }
    const universe: UniverseEntry[] = [];

    for (const [topicId, tierMap] of Object.entries(PRACTICE_TOPIC_TIER_MAP)) {
      const topicMeta = getCodingTopic(topicId);
      if (!topicMeta) continue;
      const categoryId = getTopicCategory(topicId);
      for (const [slug, entry] of Object.entries(tierMap) as Array<[
        PracticeTier,
        { language: string; practiceSetId: string },
      ]>) {
        if (!entry) continue;
        const set = getPracticeSet(entry.language, entry.practiceSetId);
        if (!set) continue;
        universe.push({
          categoryId,
          languageId: entry.language,
          slug,
          moduleId: set.metadata.moduleId,
          practiceSetTitle: set.title,
          topicId,
          topicTitle: topicMeta.title,
          tasks: set.tasks.map((t) => ({ id: t.id, title: t.title })),
        });
      }
    }

    // One Supabase round-trip for every module the universe references.
    const moduleIds = universe.map((u) => u.moduleId);
    const attemptsByModule = new Map<
      string,
      Map<string, { bestResult: AttemptResult; lastAttemptedAt: string }>
    >();
    if (moduleIds.length > 0) {
      const { data, error } = await supabase
        .from('practice_task_attempts')
        .select('module_id, task_id, result, attempted_at')
        .eq('user_id', user.id)
        .in('module_id', moduleIds)
        .order('attempted_at', { ascending: false });
      if (error && !isMissingTableError(new Error(error.message))) {
        throw new Error(error.message);
      }
      for (const row of (data ?? []) as AttemptRow[]) {
        let perTask = attemptsByModule.get(row.module_id);
        if (!perTask) {
          perTask = new Map();
          attemptsByModule.set(row.module_id, perTask);
        }
        const existing = perTask.get(row.task_id);
        if (!existing) {
          perTask.set(row.task_id, {
            bestResult: row.result,
            lastAttemptedAt: row.attempted_at,
          });
          continue;
        }
        // "success" sticks; otherwise the most recent (already first
        // due to the ordered select) wins.
        if (existing.bestResult !== 'success' && row.result === 'success') {
          existing.bestResult = 'success';
        }
      }
    }

    // Group: category → language → topic, with tiers nested inside topic.
    // The keys are stable (category id, language id, topic id) so we can
    // build via Map then convert to ordered arrays at the end.
    const categoryMap = new Map<
      PracticeCategoryId,
      {
        meta: (typeof PRACTICE_CATEGORIES)[number];
        languages: Map<
          string,
          {
            languageMeta: { title: string; accentRgb: string; href: string };
            topics: Map<string, TopicMastery>;
          }
        >;
      }
    >();
    for (const cat of PRACTICE_CATEGORIES) {
      categoryMap.set(cat.id, { meta: cat, languages: new Map() });
    }

    for (const u of universe) {
      const catEntry = categoryMap.get(u.categoryId);
      if (!catEntry) continue;

      const langMeta = getCodingLanguage(u.languageId);
      const langTitle = langMeta?.title ?? u.languageId;
      const langAccent = langMeta?.accentRgb ?? catEntry.meta.accentRgb;
      const langHref = `/practice/coding/${u.languageId}`;

      let langEntry = catEntry.languages.get(u.languageId);
      if (!langEntry) {
        langEntry = {
          languageMeta: { title: langTitle, accentRgb: langAccent, href: langHref },
          topics: new Map(),
        };
        catEntry.languages.set(u.languageId, langEntry);
      }

      let topic = langEntry.topics.get(u.topicId);
      if (!topic) {
        topic = {
          topicId: u.topicId,
          topicTitle: u.topicTitle,
          totalTasks: 0,
          solvedTasks: 0,
          tiers: [],
        };
        langEntry.topics.set(u.topicId, topic);
      }

      const perTask = attemptsByModule.get(u.moduleId) ?? new Map();
      const tasks: TaskMastery[] = u.tasks.map((t) => {
        const a = perTask.get(t.id);
        return {
          taskId: t.id,
          title: t.title,
          bestResult: a?.bestResult ?? null,
          lastAttemptedAt: a?.lastAttemptedAt ?? null,
        };
      });
      const solved = tasks.filter((t) => t.bestResult === 'success').length;
      const failed = tasks.filter((t) => t.bestResult === 'failure').length;
      topic.tiers.push({
        slug: u.slug,
        moduleId: u.moduleId,
        language: u.languageId,
        practiceSetTitle: u.practiceSetTitle,
        total: tasks.length,
        solved,
        failed,
        tasks,
      });
      topic.totalTasks += tasks.length;
      topic.solvedTasks += solved;
    }

    // Convert to ordered arrays + roll-up totals.
    const result: CategoryMastery[] = PRACTICE_CATEGORIES.map((cat) => {
      const entry = categoryMap.get(cat.id);
      if (!entry) {
        return {
          categoryId: cat.id,
          categoryTitle: cat.title,
          accentRgb: cat.accentRgb,
          href: cat.href,
          totalTasks: 0,
          solvedTasks: 0,
          languages: [],
        };
      }
      const languages: LanguageMastery[] = Array.from(entry.languages.entries())
        .sort(([a], [b]) => {
          const ai = LANGUAGE_ORDER.indexOf(a);
          const bi = LANGUAGE_ORDER.indexOf(b);
          if (ai === -1 && bi === -1) return a.localeCompare(b);
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        })
        .map(([languageId, langEntry]) => {
          const topics = Array.from(langEntry.topics.values())
            .map((t) => ({
              ...t,
              tiers: t.tiers.sort(
                (x, y) => TIER_ORDER[x.slug] - TIER_ORDER[y.slug],
              ),
            }))
            .sort((a, b) => a.topicTitle.localeCompare(b.topicTitle));
          const langTotal = topics.reduce((s, t) => s + t.totalTasks, 0);
          const langSolved = topics.reduce((s, t) => s + t.solvedTasks, 0);
          return {
            languageId,
            languageTitle: langEntry.languageMeta.title,
            accentRgb: langEntry.languageMeta.accentRgb,
            href: langEntry.languageMeta.href,
            totalTasks: langTotal,
            solvedTasks: langSolved,
            topics,
          };
        });
      const catTotal = languages.reduce((s, l) => s + l.totalTasks, 0);
      const catSolved = languages.reduce((s, l) => s + l.solvedTasks, 0);
      return {
        categoryId: cat.id,
        categoryTitle: cat.title,
        accentRgb: cat.accentRgb,
        href: cat.href,
        totalTasks: catTotal,
        solvedTasks: catSolved,
        languages,
      };
    });

    // ── Summary roll-ups ─────────────────────────────────────────────────
    let distinctTasksSolved = 0;
    let distinctTasksAttempted = 0;
    let totalTasksAcrossLibrary = 0;
    let modulesComplete = 0;
    let modulesAttempted = 0;
    const modulesCompleteByTier = { junior: 0, mid: 0, senior: 0 };
    const topicsWithSolved = new Set<string>();
    for (const cat of result) {
      for (const lang of cat.languages) {
        for (const topic of lang.topics) {
          totalTasksAcrossLibrary += topic.totalTasks;
          if (topic.solvedTasks > 0) topicsWithSolved.add(topic.topicId);
          for (const tier of topic.tiers) {
            const solvedHere = tier.tasks.filter((t) => t.bestResult === 'success').length;
            const attemptedHere = tier.tasks.filter((t) => t.bestResult !== null).length;
            distinctTasksSolved += solvedHere;
            distinctTasksAttempted += attemptedHere;
            if (attemptedHere > 0) modulesAttempted++;
            if (tier.total > 0 && solvedHere === tier.total) {
              modulesComplete++;
              modulesCompleteByTier[tier.slug]++;
            }
          }
        }
      }
    }

    // One window covers both metrics: 84 days for the Consistency
    // heatmap on /stats, of which the most recent 30 also drive the
    // "Sharpshooter" accuracy milestone. Single Supabase round-trip.
    const heatmapSince = new Date(Date.now() - HEATMAP_WINDOW_DAYS * MS_PER_DAY);
    const accuracySince = new Date(Date.now() - 30 * MS_PER_DAY);
    let recentAttempts = 0;
    let recentSuccess = 0;
    const attemptsByDate = new Map<string, number>();
    try {
      const { data: recentRows, error: recentError } = await supabase
        .from('practice_task_attempts')
        .select('result, attempted_at')
        .eq('user_id', user.id)
        .gte('attempted_at', heatmapSince.toISOString());
      if (recentError && !isMissingTableError(new Error(recentError.message))) {
        throw new Error(recentError.message);
      }
      for (const row of (recentRows ?? []) as Array<{ result: AttemptResult; attempted_at: string }>) {
        const at = new Date(row.attempted_at);
        const date = isoDate(at);
        attemptsByDate.set(date, (attemptsByDate.get(date) ?? 0) + 1);
        if (at >= accuracySince) {
          recentAttempts++;
          if (row.result === 'success') recentSuccess++;
        }
      }
    } catch {
      /* fall through with zero counts */
    }
    const recentAccuracy = recentAttempts > 0 ? recentSuccess / recentAttempts : null;

    // Dense series: every day in the window gets a row, even zeros.
    // Heatmap consumers want a contiguous timeline rather than gaps.
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dailyActivity: Array<{ date: string; attempts: number }> = [];
    for (let i = HEATMAP_WINDOW_DAYS - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * MS_PER_DAY);
      const key = isoDate(d);
      dailyActivity.push({ date: key, attempts: attemptsByDate.get(key) ?? 0 });
    }

    const summary: PracticeSummary = {
      distinctTasksSolved,
      distinctTasksAttempted,
      totalTasksAcrossLibrary,
      modulesComplete,
      modulesAttempted,
      modulesCompleteByTier,
      topicsTouched: topicsWithSolved.size,
      recentAttempts,
      recentAccuracy,
      dailyActivity,
    };

    return NextResponse.json({ data: result, summary });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to load practice mastery.');
  }
}
