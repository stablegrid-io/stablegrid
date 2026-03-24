import type { Topic, TopicProgress } from '@/types/progress';
import { theoryDocs } from '@/data/learn/theory';
import { getTheoryTracks } from '@/data/learn/theory/tracks';
import { sortModulesByOrder } from '@/lib/learn/freezeTheoryDoc';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import { HOME_TOPIC_ORDER, getHomeTopicMeta } from '@/components/home/home/topicMeta';

export const CATEGORY_ORDER = [
  'Foundations',
  'Infrastructure',
  'Orchestration',
  'Platforms',
  'Processing',
  'Storage',
] as const;

export type CategoryName = (typeof CATEGORY_ORDER)[number];

export const TOPIC_CATEGORY_MAP: Record<string, CategoryName> = {
  sql: 'Foundations',
  'python-de': 'Foundations',
  'data-modeling': 'Foundations',
  governance: 'Foundations',
  'data-quality': 'Foundations',
  docker: 'Infrastructure',
  'cloud-infra': 'Infrastructure',
  terraform: 'Infrastructure',
  'git-cicd': 'Infrastructure',
  airflow: 'Orchestration',
  kafka: 'Orchestration',
  flink: 'Orchestration',
  fabric: 'Platforms',
  databricks: 'Platforms',
  snowflake: 'Platforms',
  pyspark: 'Processing',
  'spark-streaming': 'Processing',
  dbt: 'Processing',
  iceberg: 'Storage',
};

export const TRACK_COLORS = {
  junior: '153,247,255',
  mid: '255,201,101',
  senior: '255,113,108',
} as const;

export const CATEGORY_COLORS: Record<CategoryName, string> = {
  Foundations: '200,210,220',
  Infrastructure: '100,180,255',
  Orchestration: '255,180,60',
  Platforms: '34,200,150',
  Processing: '170,120,255',
  Storage: '255,130,110',
};

export interface TrackLevel {
  slug: 'junior' | 'mid' | 'senior';
  completedModules: number;
  totalModules: number;
  hasContent: boolean;
}

export interface OrbitalTopic {
  id: string;
  label: string;
  categoryIndex: number;
  topicIndexInCategory: number;
  topicsInCategory: number;
  tracks: TrackLevel[];
  accentRgb: string;
  hasAnyContent: boolean;
  overallPct: number;
}

export function buildOrbitalTopics(topicProgress: TopicProgress[]): OrbitalTopic[] {
  const progressMap = new Map(topicProgress.map((p) => [p.topic, p]));

  // Group topics by category
  const categoryGroups = new Map<CategoryName, string[]>();
  for (const cat of CATEGORY_ORDER) categoryGroups.set(cat, []);

  for (const topicId of HOME_TOPIC_ORDER) {
    const cat = TOPIC_CATEGORY_MAP[topicId];
    if (cat) categoryGroups.get(cat)!.push(topicId);
  }

  const result: OrbitalTopic[] = [];

  for (const [catIndex, cat] of CATEGORY_ORDER.entries()) {
    const topicIds = categoryGroups.get(cat) ?? [];

    topicIds.forEach((topicId, topicIndex) => {
      const progress = progressMap.get(topicId as Topic);
      const meta = getHomeTopicMeta(topicId as Topic);
      const style = getTheoryTopicStyle(topicId);
      const doc = theoryDocs[topicId];
      const docTracks = doc ? getTheoryTracks(doc) : [];

      const theoryTotal = progress?.theoryChaptersTotal && progress.theoryChaptersTotal > 0
        ? progress.theoryChaptersTotal
        : meta.fallbackChapters;
      const theoryCompleted = progress?.theoryChaptersCompleted ?? 0;

      // Build track levels
      const tracks: TrackLevel[] = [];
      let remaining = theoryCompleted;

      if (docTracks.length > 0) {
        for (const track of docTracks) {
          const total = sortModulesByOrder(track.chapters).length;
          const completed = Math.min(total, Math.max(0, remaining));
          remaining = Math.max(0, remaining - total);
          const slug = track.slug === 'junior' ? 'junior' : track.slug === 'mid' ? 'mid' : 'senior';
          tracks.push({ slug: slug as TrackLevel['slug'], completedModules: completed, totalModules: total, hasContent: total > 0 });
        }
      } else if (theoryTotal > 0) {
        tracks.push({ slug: 'junior', completedModules: theoryCompleted, totalModules: theoryTotal, hasContent: true });
      }

      // Pad to 3 levels
      const slugOrder: TrackLevel['slug'][] = ['junior', 'mid', 'senior'];
      for (const slug of slugOrder) {
        if (!tracks.find((t) => t.slug === slug)) {
          tracks.push({ slug, completedModules: 0, totalModules: 0, hasContent: false });
        }
      }
      tracks.sort((a, b) => slugOrder.indexOf(a.slug) - slugOrder.indexOf(b.slug));

      const hasAnyContent = theoryTotal > 0;
      const overallPct = theoryTotal > 0 ? Math.round((theoryCompleted / theoryTotal) * 100) : 0;

      result.push({
        id: topicId,
        label: meta.label,
        categoryIndex: catIndex,
        topicIndexInCategory: topicIndex,
        topicsInCategory: topicIds.length,
        tracks,
        accentRgb: style.accentRgb,
        hasAnyContent,
        overallPct,
      });
    });
  }

  return result;
}
