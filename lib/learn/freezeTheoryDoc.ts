import type {
  FrozenTheoryChapter,
  FrozenTheoryDoc,
  FrozenTheorySection,
  TheoryChapter,
  TheoryContentStatus,
  TheoryDoc,
  TheoryLearningStatus,
  TheorySection
} from '@/types/theory';

const LESSON_PREFIX_REGEX = /^lesson\s*(\d+)\s*:/i;
const TRAILING_NUMBER_REGEX = /(\d+)(?!.*\d)/;

const toPositiveInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.trunc(parsed);
  return rounded > 0 ? rounded : null;
};

const normalizeSpaces = (value: string) => value.trim().replace(/\s+/g, ' ');

const slugify = (value: string) =>
  normalizeSpaces(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildUniqueSlug = (base: string, used: Set<string>) => {
  const safeBase = base || 'item';
  if (!used.has(safeBase)) {
    used.add(safeBase);
    return safeBase;
  }

  let suffix = 2;
  let candidate = `${safeBase}-${suffix}`;
  while (used.has(candidate)) {
    suffix += 1;
    candidate = `${safeBase}-${suffix}`;
  }
  used.add(candidate);
  return candidate;
};

const normalizeContentStatus = (
  status: TheoryContentStatus | undefined
): TheoryContentStatus => status ?? 'published';

const normalizeLearningStatus = (
  status: TheoryLearningStatus | undefined
): TheoryLearningStatus => status ?? 'available';

const inferOrderFromTitle = (title: string): number | null => {
  const match = title.match(LESSON_PREFIX_REGEX);
  if (!match) return null;
  return toPositiveInteger(match[1]);
};

const inferOrderFromId = (id: string): number | null => {
  const match = id.match(TRAILING_NUMBER_REGEX);
  if (!match) return null;
  return toPositiveInteger(match[1]);
};

const getChapterOrderCandidate = (
  chapter: TheoryChapter,
  fallbackIndex: number
) =>
  toPositiveInteger(chapter.order) ??
  toPositiveInteger(chapter.number) ??
  fallbackIndex + 1;

const getSectionOrderCandidate = (
  section: TheorySection,
  fallbackIndex: number
) =>
  toPositiveInteger(section.order) ??
  inferOrderFromTitle(section.title) ??
  inferOrderFromId(section.id) ??
  fallbackIndex + 1;

const toUniqueOrder = (candidate: number, usedOrders: Set<number>) => {
  let next = Math.max(1, candidate);
  while (usedOrders.has(next)) {
    next += 1;
  }
  usedOrders.add(next);
  return next;
};

const stripLessonPrefix = (title: string) =>
  title.replace(LESSON_PREFIX_REGEX, '').trim();

const normalizeSection = (
  section: TheorySection,
  fallbackIndex: number,
  usedOrders: Set<number>,
  usedSlugs: Set<string>
): FrozenTheorySection => {
  const order = toUniqueOrder(
    getSectionOrderCandidate(section, fallbackIndex),
    usedOrders
  );
  const durationMinutes =
    toPositiveInteger(section.durationMinutes) ??
    toPositiveInteger(section.estimatedMinutes) ??
    1;
  const slugBase =
    slugify(section.slug ?? '') ||
    slugify(section.id) ||
    slugify(stripLessonPrefix(section.title)) ||
    `lesson-${order}`;

  return {
    ...section,
    slug: buildUniqueSlug(slugBase, usedSlugs),
    order,
    status: normalizeContentStatus(section.status),
    learningStatus: normalizeLearningStatus(section.learningStatus),
    durationMinutes,
    estimatedMinutes: durationMinutes
  };
};

const normalizeChapter = (
  chapter: TheoryChapter,
  fallbackIndex: number,
  usedOrders: Set<number>,
  usedSlugs: Set<string>
): FrozenTheoryChapter => {
  const order = toUniqueOrder(
    getChapterOrderCandidate(chapter, fallbackIndex),
    usedOrders
  );
  const sectionCandidates = [...chapter.sections].map((section, index) => ({
    section,
    fallbackIndex: index
  }));
  sectionCandidates.sort((left, right) => {
    const leftOrder = getSectionOrderCandidate(left.section, left.fallbackIndex);
    const rightOrder = getSectionOrderCandidate(right.section, right.fallbackIndex);
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return left.fallbackIndex - right.fallbackIndex;
  });

  const usedSectionOrders = new Set<number>();
  const usedSectionSlugs = new Set<string>();
  const sections = sectionCandidates.map(({ section, fallbackIndex }) =>
    normalizeSection(
      section,
      fallbackIndex,
      usedSectionOrders,
      usedSectionSlugs
    )
  );

  const inferredDuration = sections.reduce(
    (sum, section) => sum + section.durationMinutes,
    0
  );
  const durationMinutes =
    toPositiveInteger(chapter.durationMinutes) ??
    toPositiveInteger(chapter.totalMinutes) ??
    inferredDuration;
  const slugBase =
    slugify(chapter.slug ?? '') ||
    slugify(chapter.id) ||
    slugify(chapter.title) ||
    `module-${order}`;

  return {
    ...chapter,
    slug: buildUniqueSlug(slugBase, usedSlugs),
    order,
    number: order,
    status: normalizeContentStatus(chapter.status),
    learningStatus: normalizeLearningStatus(chapter.learningStatus),
    durationMinutes,
    totalMinutes: durationMinutes,
    sections
  };
};

export const freezeTheoryDoc = (doc: TheoryDoc): FrozenTheoryDoc => {
  const sourceModules =
    Array.isArray(doc.modules) && doc.modules.length > 0
      ? doc.modules
      : doc.chapters;
  const moduleCandidates = [...sourceModules].map((chapter, index) => ({
    chapter,
    fallbackIndex: index
  }));
  moduleCandidates.sort((left, right) => {
    const leftOrder = getChapterOrderCandidate(left.chapter, left.fallbackIndex);
    const rightOrder = getChapterOrderCandidate(right.chapter, right.fallbackIndex);
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return left.fallbackIndex - right.fallbackIndex;
  });

  const usedModuleOrders = new Set<number>();
  const usedModuleSlugs = new Set<string>();
  const modules = moduleCandidates.map(({ chapter, fallbackIndex }) =>
    normalizeChapter(chapter, fallbackIndex, usedModuleOrders, usedModuleSlugs)
  );

  const id = normalizeSpaces(doc.id ?? doc.topic);
  const slug =
    slugify(doc.slug ?? '') ||
    slugify(doc.topic) ||
    slugify(doc.title) ||
    'course';

  return {
    ...doc,
    id,
    slug,
    status: normalizeContentStatus(doc.status),
    chapters: modules,
    modules
  };
};

export const getDisplayLessonTitle = (
  section: Pick<TheorySection, 'title' | 'order'>,
  fallbackOrder: number
) => {
  const rawTitle = normalizeSpaces(section.title);
  if (LESSON_PREFIX_REGEX.test(rawTitle)) {
    return rawTitle;
  }
  const order = toPositiveInteger(section.order) ?? fallbackOrder;
  const titleWithoutPrefix = stripLessonPrefix(rawTitle) || rawTitle;
  return `Lesson ${order}: ${titleWithoutPrefix}`;
};

export const sortModulesByOrder = <
  T extends { order?: number; number?: number }
>(
  modules: T[]
) =>
  [...modules].sort((left, right) => {
    const leftOrder =
      toPositiveInteger(left.order) ?? toPositiveInteger(left.number) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder =
      toPositiveInteger(right.order) ?? toPositiveInteger(right.number) ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return 0;
  });

export const sortLessonsByOrder = <T extends { order?: number }>(
  lessons: T[]
) =>
  [...lessons].sort((left, right) => {
    const leftOrder = toPositiveInteger(left.order) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = toPositiveInteger(right.order) ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return 0;
  });
