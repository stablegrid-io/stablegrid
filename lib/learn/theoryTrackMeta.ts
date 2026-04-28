import 'server-only';

import { theoryDocs } from '@/data/learn/theory';
import { getTheoryTracks } from '@/data/learn/theory/tracks';
import { sortModulesByOrder } from '@/lib/learn/freezeTheoryDoc';

/** Lightweight track metadata — no lesson content, safe for client bundle */
export interface TrackMetaSummary {
  slug: string;
  label: string;
  moduleCount: number;
  moduleIds: string[];
  modules: { id: string; title: string; number: number }[];
}

export interface TopicTrackMeta {
  topicId: string;
  tracks: TrackMetaSummary[];
}

export type TrackMetaByTopic = Record<string, TrackMetaSummary[]>;

/** Pre-compute track metadata server-side — returns ~1KB instead of 6.2MB */
export function buildTrackMetaByTopic(): TrackMetaByTopic {
  const result: TrackMetaByTopic = {};

  for (const [topicId, doc] of Object.entries(theoryDocs)) {
    if (!doc) continue;
    const tracks = getTheoryTracks(doc);
    result[topicId] = tracks.map((track) => {
      const modules = sortModulesByOrder(track.chapters);
      return {
        slug: track.slug,
        label: track.label,
        moduleCount: modules.length,
        moduleIds: modules.map((m) => m.id),
        modules: modules.map((m) => ({ id: m.id, title: m.title, number: m.number })),
      };
    });
  }

  return result;
}
