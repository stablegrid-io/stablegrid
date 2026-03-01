import { theoryDocs } from '@/data/learn/theory';
import { sortModulesByOrder } from '@/lib/learn/freezeTheoryDoc';
import type { Topic } from '@/types/progress';

interface TheoryProgressModule {
  id: string;
  order: number;
  sectionCount: number;
}

export interface TheoryProgressSessionRow {
  chapter_id: string | null;
  is_completed?: boolean | null;
  active_seconds?: number | null;
  sections_read?: number | null;
  last_active_at?: string | null;
  completed_at?: string | null;
}

export const getCanonicalTheoryModules = (topic: Topic): TheoryProgressModule[] => {
  const doc = theoryDocs[topic];
  if (!doc) {
    return [];
  }

  return sortModulesByOrder(doc.modules ?? doc.chapters).map((module) => ({
    id: module.id,
    order: module.order ?? module.number,
    sectionCount: module.sections.length
  }));
};

export const getCanonicalTheoryStats = (topic: Topic) => {
  const modules = getCanonicalTheoryModules(topic);
  const chapterIds = modules.map((module) => module.id);

  return {
    modules,
    chapterIds,
    chapterIdSet: new Set(chapterIds),
    chapterTotal: modules.length,
    sectionTotal: modules.reduce((sum, module) => sum + module.sectionCount, 0)
  };
};

const toTimestamp = (value: string | null | undefined) => {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const clampCount = (value: number | null | undefined, max: number) => {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(max, Math.round(numericValue)));
};

const clampSeconds = (value: number | null | undefined) => {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.round(numericValue));
};

const pickPreferredRow = (
  current: TheoryProgressSessionRow,
  next: TheoryProgressSessionRow,
  sectionCount: number
) => {
  const currentTimestamp = Math.max(
    toTimestamp(current.last_active_at),
    toTimestamp(current.completed_at)
  );
  const nextTimestamp = Math.max(
    toTimestamp(next.last_active_at),
    toTimestamp(next.completed_at)
  );

  if (nextTimestamp !== currentTimestamp) {
    return nextTimestamp > currentTimestamp ? next : current;
  }

  const currentSectionsRead = current.is_completed
    ? sectionCount
    : clampCount(current.sections_read, sectionCount);
  const nextSectionsRead = next.is_completed
    ? sectionCount
    : clampCount(next.sections_read, sectionCount);
  if (nextSectionsRead !== currentSectionsRead) {
    return nextSectionsRead > currentSectionsRead ? next : current;
  }

  const currentActiveSeconds = clampSeconds(current.active_seconds);
  const nextActiveSeconds = clampSeconds(next.active_seconds);
  return nextActiveSeconds >= currentActiveSeconds ? next : current;
};

export const summarizeTheoryProgressFromSessions = (
  topic: Topic,
  rows: TheoryProgressSessionRow[]
) => {
  const canonicalStats = getCanonicalTheoryStats(topic);
  const moduleById = new Map(
    canonicalStats.modules.map((module) => [module.id, module])
  );
  const sessionByChapterId = new Map<string, TheoryProgressSessionRow>();

  rows.forEach((row) => {
    if (typeof row.chapter_id !== 'string') {
      return;
    }

    const module = moduleById.get(row.chapter_id);
    if (!module) {
      return;
    }

    const existing = sessionByChapterId.get(module.id);
    if (!existing) {
      sessionByChapterId.set(module.id, row);
      return;
    }

    sessionByChapterId.set(
      module.id,
      pickPreferredRow(existing, row, module.sectionCount)
    );
  });

  let chapterCompleted = 0;
  let sectionRead = 0;
  let totalSeconds = 0;
  const completedChapterIds = new Set<string>();

  canonicalStats.modules.forEach((module) => {
    const row = sessionByChapterId.get(module.id);
    if (!row) {
      return;
    }

    const isCompleted = Boolean(row.is_completed);
    if (isCompleted) {
      chapterCompleted += 1;
      completedChapterIds.add(module.id);
    }

    sectionRead += isCompleted
      ? module.sectionCount
      : clampCount(row.sections_read, module.sectionCount);
    totalSeconds += clampSeconds(row.active_seconds);
  });

  return {
    chapterTotal: canonicalStats.chapterTotal,
    sectionTotal: canonicalStats.sectionTotal,
    chapterCompleted,
    sectionRead,
    totalSeconds,
    completedChapterIds
  };
};
