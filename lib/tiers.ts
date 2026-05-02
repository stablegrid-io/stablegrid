/**
 * User tier progression — the "character tier" shown in the sidebar, profile,
 * and onboarding.
 *
 * Tiers are earned by completing several dimensions of work, not just by
 * stacking kWh. The criteria are deliberately strict: hitting Mid takes weeks
 * of focused work across more than one discipline; hitting Senior takes
 * months and substantive completion of a full topic.
 *
 * The rules live here as a single source of truth. Clients pass a
 * TierContext describing everything they've earned so far; pure functions
 * compute the current tier and progress toward the next one.
 */

export type UserTier = 'junior' | 'mid' | 'senior';
export type TrackLevel = UserTier;

/* ── Topic → category ─────────────────────────────────────────────────────── */

/**
 * Every theory topic belongs to exactly one category. The category system
 * exists so tier progression can require breadth ("finish three Junior tracks
 * from two different categories") rather than letting users level up by
 * grinding the same topic three times.
 *
 * Keep this stable — changing a topic's category changes past users' progress
 * retroactively.
 */
export const TOPIC_CATEGORIES: Record<string, TopicCategory> = {
  sql: 'fundamentals',
  'python-de': 'fundamentals',
  python: 'fundamentals',
  pyspark: 'distributed',
  'spark-streaming': 'distributed',
  flink: 'distributed',
  kafka: 'distributed',
  fabric: 'analytics',
  databricks: 'analytics',
  snowflake: 'analytics',
  airflow: 'orchestration',
  dbt: 'orchestration',
  docker: 'infrastructure',
  terraform: 'infrastructure',
  'cloud-infra': 'infrastructure',
  'git-cicd': 'infrastructure',
  'data-modeling': 'architecture',
  'data-quality': 'architecture',
  governance: 'architecture',
  iceberg: 'architecture'
};

export type TopicCategory =
  | 'fundamentals'
  | 'distributed'
  | 'analytics'
  | 'orchestration'
  | 'infrastructure'
  | 'architecture';

export const CATEGORY_LABELS: Record<TopicCategory, string> = {
  fundamentals: 'Fundamentals',
  distributed: 'Distributed Processing',
  analytics: 'Analytics Platforms',
  orchestration: 'Orchestration',
  infrastructure: 'Infrastructure',
  architecture: 'Data Architecture'
};

export const getTopicCategory = (topic: string): TopicCategory | null =>
  TOPIC_CATEGORIES[topic] ?? null;

/* ── Track IDs ────────────────────────────────────────────────────────────── */

/**
 * A "track" is one tier-worth of a topic — e.g., Junior PySpark is ten
 * modules with ids module-PS1..PS10. Track identifiers we use across the
 * system are of the form `${topic}-${trackLevel}` — strings so they persist
 * cleanly through the store, the API, and localStorage.
 */
export type TrackId = `${string}-${TrackLevel}`;

export const makeTrackId = (topic: string, trackLevel: TrackLevel): TrackId =>
  `${topic}-${trackLevel}` as TrackId;

export const parseTrackId = (
  trackId: string
): { topic: string; trackLevel: TrackLevel } | null => {
  const match = /^(.+)-(junior|mid|senior)$/.exec(trackId);
  if (!match) return null;
  return { topic: match[1], trackLevel: match[2] as TrackLevel };
};

/**
 * Module ids follow the pattern `module-<TOPIC_PREFIX><TIER_SUFFIX><N>` —
 * e.g. `module-PS1` (pyspark junior), `module-PSI3` (pyspark mid),
 * `module-PSS7` (pyspark senior). The suffix is empty for Junior, "I" for
 * Mid, "S" for Senior. This map makes that mapping explicit so we don't
 * parse it heuristically.
 */
interface TopicModuleConfig {
  junior: string; // prefix for junior modules, e.g. 'PS'
  mid: string;    // prefix for mid modules, e.g. 'PSI'
  senior: string; // prefix for senior modules, e.g. 'PSS'
}

export const TOPIC_MODULE_PREFIXES: Record<string, TopicModuleConfig> = {
  pyspark:     { junior: 'PS',  mid: 'PSI',  senior: 'PSS'  },
  fabric:      { junior: 'F',   mid: 'FI',   senior: 'FS'   },
  airflow:     { junior: 'AF',  mid: 'AFI',  senior: 'AFS'  },
  sql:         { junior: 'SQ',  mid: 'SQI',  senior: 'SQS'  },
  'python-de': { junior: 'PY',  mid: 'PYI',  senior: 'PYS'  }
};

/** Modules per track. Uniform for now; move into TOPIC_MODULE_PREFIXES if this changes. */
export const MODULES_PER_TRACK = 10;

/**
 * Inverse lookup: given a module id like `module-PSI3`, return the track it
 * belongs to. Tier detection is longest-prefix-first: senior ("PSS") is
 * tested before mid ("PSI") is tested before junior ("PS"), otherwise "PS"
 * would swallow "PSS".
 */
export const parseModuleId = (
  moduleId: string
): { topic: string; trackLevel: TrackLevel } | null => {
  const match = /^module-([A-Z]+)(\d+)$/.exec(moduleId);
  if (!match) return null;
  const prefix = match[1];

  type Match = { topic: string; trackLevel: TrackLevel; prefix: string };
  const matches: Match[] = [];
  for (const [topic, cfg] of Object.entries(TOPIC_MODULE_PREFIXES)) {
    if (prefix === cfg.senior) matches.push({ topic, trackLevel: 'senior', prefix: cfg.senior });
    else if (prefix === cfg.mid) matches.push({ topic, trackLevel: 'mid', prefix: cfg.mid });
    else if (prefix === cfg.junior) matches.push({ topic, trackLevel: 'junior', prefix: cfg.junior });
  }
  if (matches.length === 0) return null;

  // Prefer the longest prefix match so "PSS" wins over "PS".
  matches.sort((a, b) => b.prefix.length - a.prefix.length);
  const best = matches[0];
  return { topic: best.topic, trackLevel: best.trackLevel };
};

/**
 * Given a list of completed module ids, return the set of track ids where
 * every module for that (topic, trackLevel) is present. A "partial" track
 * doesn't count.
 */
export const deriveCompletedTracks = (completedModuleIds: string[]): TrackId[] => {
  const counts = new Map<TrackId, number>();
  for (const id of completedModuleIds) {
    const parsed = parseModuleId(id);
    if (!parsed) continue;
    const key = makeTrackId(parsed.topic, parsed.trackLevel);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const result: TrackId[] = [];
  for (const [trackId, n] of counts) {
    if (n >= MODULES_PER_TRACK) result.push(trackId);
  }
  return result;
};

/* ── Tier requirements ────────────────────────────────────────────────────── */

export interface TierCriteria {
  /** Number of theory tracks completed at the given level. */
  tracks: { level: TrackLevel; count: number };
  /** Minimum number of distinct topic categories represented among those tracks. */
  categories: number;
  /** Optional: number of full topics completed (Junior + Mid + Senior all done). */
  fullTopics?: number;
  /** Practice tasks solved (distinct, success result) across the curriculum. */
  practiceTasks: number;
  /** Optional: at least one practice module complete at this tier or higher. */
  practiceModuleAtTier?: TrackLevel;
}

/**
 * Promotion requirements. With practice now a substantive part of the
 * curriculum, every tier requires BOTH theory completion AND a practice
 * floor — pure-reading and pure-grinding paths are no longer sufficient.
 *
 * Junior → Mid: a competent generalist. Has read across two disciplines
 *   AND solved enough practice tasks to show the reading translated into
 *   action.
 * Mid → Senior: a depth practitioner. Has gone end-to-end in at least
 *   one topic, completed real Mid-level practice (one full Mid practice
 *   module, e.g. JAI), and accumulated practice volume across the board.
 *
 * The kWh threshold from the old design is gone: balance is hard-capped
 * at BATTERY_CAPACITY_KWH (5 000), so 10 000 / 30 000 lifetime gates
 * were unreachable. The actual signals (theory tracks, practice tasks)
 * already imply substantial kWh earnings, so the gate was redundant.
 */
export const TIER_REQUIREMENTS: Record<'mid' | 'senior', TierCriteria> = {
  mid: {
    tracks: { level: 'junior', count: 3 },
    categories: 2,
    practiceTasks: 20
  },
  senior: {
    tracks: { level: 'mid', count: 3 },
    categories: 2,
    fullTopics: 1,
    practiceTasks: 75,
    practiceModuleAtTier: 'mid'
  }
};

/* ── Tier context + resolution ────────────────────────────────────────────── */

export interface TierContext {
  /**
   * @deprecated kWh is no longer a tier criterion (the cap at 5 000
   * made the old 10 000 / 30 000 thresholds unreachable). Kept on the
   * shape so legacy callers compile; ignored by tier resolution.
   */
  kwh: number;
  /** Full list of completed track ids, e.g. ['pyspark-junior', 'sql-junior']. */
  completedTracks: readonly TrackId[];
  /** Distinct practice tasks the user has solved (best-result === 'success'). */
  practiceTasksSolved: number;
  /** Practice modules where every task is solved, broken down by tier. */
  practiceModulesCompleteByTier: { junior: number; mid: number; senior: number };
}

/**
 * Default empty practice context — used by callers that haven't loaded
 * practice stats yet (Sidebar at first paint, server-side renders). Tier
 * resolution treats missing practice as zero, which means a user with
 * meaningful practice progress will briefly display lower until the
 * first /api/.../mastery fetch resolves. Acceptable since the canonical
 * tier display lives on /stats where the fetch happens up-front.
 */
export const EMPTY_PRACTICE_STATS = {
  practiceTasksSolved: 0,
  practiceModulesCompleteByTier: { junior: 0, mid: 0, senior: 0 },
} as const;

const asTrackArray = (tracks: readonly TrackId[] | readonly string[]): TrackId[] =>
  // parseTrackId already enforces the template-literal shape; cast is safe.
  tracks.filter((t) => parseTrackId(t) !== null) as TrackId[];

const countCompletedAtLevel = (
  tracks: readonly TrackId[],
  level: TrackLevel
): { count: number; categories: Set<TopicCategory> } => {
  const categories = new Set<TopicCategory>();
  let count = 0;
  for (const tid of tracks) {
    const parsed = parseTrackId(tid);
    if (!parsed || parsed.trackLevel !== level) continue;
    count += 1;
    const cat = getTopicCategory(parsed.topic);
    if (cat) categories.add(cat);
  }
  return { count, categories };
};

const countFullTopics = (tracks: readonly TrackId[]): number => {
  const byTopic = new Map<string, Set<TrackLevel>>();
  for (const tid of tracks) {
    const parsed = parseTrackId(tid);
    if (!parsed) continue;
    const set = byTopic.get(parsed.topic) ?? new Set<TrackLevel>();
    set.add(parsed.trackLevel);
    byTopic.set(parsed.topic, set);
  }
  let full = 0;
  for (const set of byTopic.values()) {
    if (set.has('junior') && set.has('mid') && set.has('senior')) full += 1;
  }
  return full;
};

/** Does the user satisfy every criterion for the given tier? */
const meetsTier = (ctx: TierContext, target: 'mid' | 'senior'): boolean => {
  const req = TIER_REQUIREMENTS[target];
  const tracks = asTrackArray(ctx.completedTracks);
  const { count, categories } = countCompletedAtLevel(tracks, req.tracks.level);
  if (count < req.tracks.count) return false;
  if (categories.size < req.categories) return false;
  if (req.fullTopics && countFullTopics(tracks) < req.fullTopics) return false;
  if ((ctx.practiceTasksSolved ?? 0) < req.practiceTasks) return false;
  if (req.practiceModuleAtTier) {
    // Mid+ practice modules complete satisfy a senior gate; senior alone
    // satisfies senior. Junior-only doesn't.
    const order: TrackLevel[] = ['junior', 'mid', 'senior'];
    const minIdx = order.indexOf(req.practiceModuleAtTier);
    const completedAtOrAbove = order
      .slice(minIdx)
      .reduce(
        (s, t) => s + (ctx.practiceModulesCompleteByTier?.[t] ?? 0),
        0,
      );
    if (completedAtOrAbove < 1) return false;
  }
  return true;
};

/** Resolve the user's current tier given their full progression context. */
export const getUserTier = (ctx: TierContext): UserTier => {
  if (meetsTier(ctx, 'senior')) return 'senior';
  if (meetsTier(ctx, 'mid')) return 'mid';
  return 'junior';
};

/* ── Progress reporting ───────────────────────────────────────────────────── */

export interface CriterionProgress {
  /** Stable id so callers can key DOM lists and animations. */
  id: string;
  /** One-line description of the requirement. */
  label: string;
  /** Current progress value (e.g. 4,200 kWh earned). */
  current: number;
  /** Target value (e.g. 10,000 kWh required). */
  target: number;
  /** Rendered progress value as a string, e.g. "4,200 / 10,000 kWh". */
  display: string;
  /** True when current >= target. */
  met: boolean;
  /** Optional auxiliary text rendered underneath the progress bar. */
  detail?: string;
}

export interface TierProgressReport {
  target: 'mid' | 'senior';
  /** True when every criterion is satisfied and the tier will be awarded. */
  metAll: boolean;
  criteria: CriterionProgress[];
}

/**
 * Describe progress toward a specific tier. Used by the Profile settings
 * card and the dashboard tier hero to render a checklist of gates rather
 * than a single number.
 */
export const getTierProgressReport = (
  ctx: TierContext,
  target: 'mid' | 'senior'
): TierProgressReport => {
  const req = TIER_REQUIREMENTS[target];
  const tracks = asTrackArray(ctx.completedTracks);
  const { count: levelCount, categories: levelCategories } = countCompletedAtLevel(
    tracks,
    req.tracks.level
  );

  const tracksCriterion: CriterionProgress = {
    id: 'tracks',
    label: `Finish ${req.tracks.count} ${req.tracks.level[0].toUpperCase()}${req.tracks.level.slice(1)} tracks`,
    current: levelCount,
    target: req.tracks.count,
    display: `${Math.min(levelCount, req.tracks.count)} / ${req.tracks.count} tracks`,
    met: levelCount >= req.tracks.count
  };

  const categoriesCriterion: CriterionProgress = {
    id: 'categories',
    label: `Across ${req.categories} different categories`,
    current: Math.min(levelCategories.size, req.categories),
    target: req.categories,
    display: `${Math.min(levelCategories.size, req.categories)} / ${req.categories} categories`,
    met: levelCategories.size >= req.categories,
    detail:
      levelCategories.size > 0
        ? Array.from(levelCategories).map((c) => CATEGORY_LABELS[c]).join(' · ')
        : undefined
  };

  const practiceSolved = ctx.practiceTasksSolved ?? 0;
  const practiceCriterion: CriterionProgress = {
    id: 'practiceTasks',
    label: `Solve ${req.practiceTasks} practice tasks`,
    current: Math.min(practiceSolved, req.practiceTasks),
    target: req.practiceTasks,
    display: `${Math.min(practiceSolved, req.practiceTasks)} / ${req.practiceTasks} tasks`,
    met: practiceSolved >= req.practiceTasks
  };

  const criteria: CriterionProgress[] = [tracksCriterion, categoriesCriterion, practiceCriterion];

  if (req.fullTopics) {
    const full = countFullTopics(tracks);
    criteria.push({
      id: 'fullTopics',
      label: `Master ${req.fullTopics} topic end-to-end (Junior + Mid + Senior)`,
      current: Math.min(full, req.fullTopics),
      target: req.fullTopics,
      display: `${Math.min(full, req.fullTopics)} / ${req.fullTopics} topics`,
      met: full >= req.fullTopics
    });
  }

  if (req.practiceModuleAtTier) {
    const order: TrackLevel[] = ['junior', 'mid', 'senior'];
    const minIdx = order.indexOf(req.practiceModuleAtTier);
    const completedAtOrAbove = order
      .slice(minIdx)
      .reduce((s, t) => s + (ctx.practiceModulesCompleteByTier?.[t] ?? 0), 0);
    const tierLabel =
      req.practiceModuleAtTier[0].toUpperCase() + req.practiceModuleAtTier.slice(1);
    criteria.push({
      id: 'practiceModule',
      label: `Complete a ${tierLabel}-level practice track`,
      current: Math.min(completedAtOrAbove, 1),
      target: 1,
      display: `${Math.min(completedAtOrAbove, 1)} / 1 module`,
      met: completedAtOrAbove >= 1
    });
  }

  return {
    target,
    metAll: criteria.every((c) => c.met),
    criteria
  };
};

/* ── Profile image lookup (re-exported for convenience) ───────────────────── */

export const getTierProfileImage = (tier: UserTier): string =>
  `/brand/profile-${tier}.png`;
