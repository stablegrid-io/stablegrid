import { theoryDocs } from '@/data/learn/theory';
import { getTheoryTracks } from '@/data/learn/theory/tracks';
import { sortModulesByOrder } from '@/lib/learn/freezeTheoryDoc';
import type { CanonicalModuleEntry } from '@/lib/learn/moduleProgress';

export interface CanonicalModuleContextEntry extends CanonicalModuleEntry {
  lessonIds: string[];
  sectionsTotal: number;
}

/**
 * Build the canonical module list for a topic + optional track slug. Pulled
 * out of `/api/learn/module-progress/route.ts` so it can be re-used by
 * server-to-server completion (auto-complete on last practice task success)
 * and any other backend code that needs the same module chain.
 */
export const getCanonicalModuleContext = (
  topic: string,
  trackSlug: string | null
): CanonicalModuleContextEntry[] => {
  const doc = theoryDocs[topic];
  if (!doc) {
    return [];
  }

  const sourceChapters = trackSlug
    ? getTheoryTracks(doc).find((track) => track.slug === trackSlug)?.chapters ?? []
    : sortModulesByOrder(doc.modules ?? doc.chapters);

  return sortModulesByOrder(sourceChapters).map((module) => ({
    id: module.id,
    order: module.order ?? module.number,
    lessonIds: module.sections.map((section) => section.id),
    sectionsTotal: module.sections.length
  }));
};

/**
 * Infer the track slug ('junior' | 'mid' | 'senior') from a module ID for
 * PySpark practice modules. Used by auto-completion when the caller doesn't
 * know which track to scope to.
 *
 *   module-PS3   → 'junior'
 *   module-PSI4  → 'mid'
 *   module-PSS10 → 'senior'
 */
export const inferTrackSlugFromModuleId = (moduleId: string): string | null => {
  const stripped = moduleId.replace(/^module-/, '');
  if (/^PSS\d+$/.test(stripped)) return 'senior';
  if (/^PSI\d+$/.test(stripped)) return 'mid';
  if (/^PS\d+$/.test(stripped)) return 'junior';
  return null;
};
