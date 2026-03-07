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
const TITLE_CONNECTORS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'for',
  'from',
  'in',
  'into',
  'of',
  'on',
  'or',
  'over',
  'the',
  'to',
  'under',
  'via',
  'vs',
  'vs.',
  'with',
  'without'
]);
const TITLE_OVERFLOW_VERBS = new Set([
  'are',
  'can',
  'combine',
  'combines',
  'contains',
  'define',
  'defines',
  'depends',
  'do',
  'does',
  'enable',
  'enables',
  'enters',
  'exists',
  'exposes',
  'follows',
  'generate',
  'generates',
  'get',
  'gets',
  'gives',
  'handles',
  'has',
  'have',
  'includes',
  'integrates',
  'is',
  'lets',
  'lives',
  'make',
  'makes',
  'maps',
  'means',
  'offer',
  'offers',
  'organizes',
  'power',
  'powers',
  'prevent',
  'prevents',
  'provide',
  'provides',
  'reads',
  'reduce',
  'reduces',
  'reached',
  'reaches',
  'runs',
  'scale',
  'scales',
  'start',
  'starts',
  'store',
  'stores',
  'support',
  'supports',
  'track',
  'tracks',
  'understand',
  'use',
  'uses',
  'work',
  'works',
  'write',
  'writes',
  'was',
  'were',
  'will'
]);

const toPositiveInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.trunc(parsed);
  return rounded > 0 ? rounded : null;
};

const normalizeSpaces = (value: string) => value.trim().replace(/\s+/g, ' ');

const stripEdgePunctuation = (token: string) =>
  token.replace(/^[("'[{]+|[)"'\],.:;!?]+$/g, '');

const startsWithUpperOrNumber = (token: string) => /^[A-Z0-9]/.test(token);

const getSentenceVerbIndex = (tokens: string[]) => {
  const probeLength = Math.min(tokens.length, 8);
  for (let index = 1; index < probeLength; index += 1) {
    const cleaned = stripEdgePunctuation(tokens[index]).toLowerCase();
    if (TITLE_OVERFLOW_VERBS.has(cleaned)) {
      return index;
    }
  }
  return null;
};

const findLessonTitleSplitIndex = (titleBody: string) => {
  const questionBoundary = titleBody.match(/^(.{1,140}?\?)\s+/);
  if (questionBoundary) {
    return questionBoundary[1].length;
  }

  const checkpointBoundary = titleBody.match(/^(Module\s+\d+\s+Checkpoint)\s+/i);
  if (checkpointBoundary) {
    return checkpointBoundary[1].length;
  }

  const tokens = [...titleBody.matchAll(/\S+/g)].map((match) => ({
    text: match[0],
    index: match.index ?? 0
  }));
  const candidates: Array<{
    index: number;
    prefixWordCount: number;
    verbIndex: number;
  }> = [];

  for (let splitAt = 1; splitAt < tokens.length; splitAt += 1) {
    const prefixWordCount = splitAt;
    if (prefixWordCount < 2 || prefixWordCount > 16) {
      continue;
    }

    const lastPrefixToken = stripEdgePunctuation(tokens[splitAt - 1].text);
    if (!lastPrefixToken) {
      continue;
    }
    if (TITLE_CONNECTORS.has(lastPrefixToken.toLowerCase())) {
      continue;
    }

    const nextTokens = tokens
      .slice(splitAt, splitAt + 8)
      .map(({ text }) => stripEdgePunctuation(text))
      .filter(Boolean);
    if (nextTokens.length < 2) {
      continue;
    }
    const firstThreeTokens = nextTokens.slice(0, 3);
    if (
      firstThreeTokens.length === 3 &&
      firstThreeTokens.every((token) => startsWithUpperOrNumber(token))
    ) {
      continue;
    }
    if (!startsWithUpperOrNumber(nextTokens[0])) {
      continue;
    }
    const verbIndex = getSentenceVerbIndex(nextTokens);
    if (verbIndex === null) {
      continue;
    }

    candidates.push({
      index: tokens[splitAt].index,
      prefixWordCount,
      verbIndex
    });
  }

  if (candidates.length > 0) {
    candidates.sort((left, right) => {
      if (left.verbIndex !== right.verbIndex) {
        return left.verbIndex - right.verbIndex;
      }
      return right.prefixWordCount - left.prefixWordCount;
    });
    return candidates[0].index;
  }

  if (tokens.length >= 6) {
    const firstToken = stripEdgePunctuation(tokens[0].text).toLowerCase();
    if (firstToken) {
      for (let repeatAt = 2; repeatAt < tokens.length; repeatAt += 1) {
        const repeatedToken = stripEdgePunctuation(tokens[repeatAt].text).toLowerCase();
        if (!repeatedToken || repeatedToken !== firstToken) {
          continue;
        }

        const prefixWordCount = repeatAt;
        if (prefixWordCount < 2 || prefixWordCount > 16) {
          continue;
        }

        const lastPrefixToken = stripEdgePunctuation(tokens[repeatAt - 1].text);
        if (!lastPrefixToken) {
          continue;
        }
        if (TITLE_CONNECTORS.has(lastPrefixToken.toLowerCase())) {
          continue;
        }

        return tokens[repeatAt].index;
      }
    }
  }

  const sentenceBoundary = titleBody.match(/^(.{1,180}?[.!?])\s+/);
  if (sentenceBoundary) {
    const wordCount = sentenceBoundary[1].trim().split(/\s+/).length;
    if (wordCount >= 3) {
      return sentenceBoundary[1].length;
    }
  }

  return null;
};

const splitOverflowFromLessonTitle = (rawTitle: string) => {
  const normalizedTitle = normalizeSpaces(rawTitle);
  const prefixMatch = normalizedTitle.match(LESSON_PREFIX_REGEX);
  if (!prefixMatch) {
    return { title: normalizedTitle, overflow: null as string | null };
  }

  const prefix = `Lesson ${prefixMatch[1]}: `;
  const titleBody = normalizedTitle.slice(prefixMatch[0].length).trim();
  if (!titleBody) {
    return { title: normalizedTitle, overflow: null as string | null };
  }

  const splitIndex = findLessonTitleSplitIndex(titleBody);
  if (splitIndex === null) {
    return { title: normalizedTitle, overflow: null as string | null };
  }

  const titleOnly = titleBody.slice(0, splitIndex).trim();
  const overflow = titleBody.slice(splitIndex).trim();
  if (!titleOnly || !overflow) {
    return { title: normalizedTitle, overflow: null as string | null };
  }

  return {
    title: `${prefix}${titleOnly}`,
    overflow
  };
};

const prependTitleOverflowToBlocks = (
  blocks: TheorySection['blocks'],
  overflow: string | null
) => {
  if (!overflow) {
    return blocks;
  }

  const overflowParagraph: TheorySection['blocks'][number] = {
    type: 'paragraph',
    content: overflow
  };

  if (!Array.isArray(blocks) || blocks.length === 0) {
    return [overflowParagraph];
  }

  const [firstBlock, ...restBlocks] = blocks;
  if (firstBlock.type === 'paragraph') {
    const firstContent = normalizeSpaces(firstBlock.content);
    if (firstContent.toLowerCase().startsWith(overflow.toLowerCase())) {
      return blocks;
    }

    return [
      {
        ...firstBlock,
        content: `${overflow} ${firstBlock.content}`.trim()
      },
      ...restBlocks
    ];
  }

  return [overflowParagraph, ...blocks];
};

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
  const sanitizedLesson = splitOverflowFromLessonTitle(section.title);
  const sanitizedBlocks = prependTitleOverflowToBlocks(
    section.blocks,
    sanitizedLesson.overflow
  );
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
    slugify(stripLessonPrefix(sanitizedLesson.title)) ||
    `lesson-${order}`;

  return {
    ...section,
    title: sanitizedLesson.title,
    blocks: sanitizedBlocks,
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
  const { title: normalizedTitle } = splitOverflowFromLessonTitle(section.title);
  if (LESSON_PREFIX_REGEX.test(normalizedTitle)) {
    return normalizedTitle;
  }
  const order = toPositiveInteger(section.order) ?? fallbackOrder;
  const titleWithoutPrefix =
    stripLessonPrefix(normalizedTitle) || normalizedTitle;
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
