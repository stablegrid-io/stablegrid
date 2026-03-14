import 'server-only';
import { readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { ContentBlock, TheoryDoc } from '@/types/theory';
import { validateTheoryDoc } from '@/lib/validators/theoryContentValidator';
import { AdminServiceError } from '@/lib/admin/service';
import type {
  AdminTheoryDocPayload,
  AdminTheoryDocId,
  AdminTheoryLessonMutationPayload,
  AdminTheoryTopicSummary
} from '@/lib/admin/types';

const THEORY_DOCS_DIR = path.join(process.cwd(), 'data', 'learn', 'theory', 'published');
const THEORY_DOC_ORDER = ['pyspark', 'pyspark-data-engineering-track', 'fabric'];

const getTheoryDocPath = (docId: AdminTheoryDocId) =>
  path.join(THEORY_DOCS_DIR, `${docId}.json`);

const readTheoryDoc = async (docId: AdminTheoryDocId): Promise<TheoryDoc> => {
  const raw = await readFile(getTheoryDocPath(docId), 'utf8');
  return JSON.parse(raw) as TheoryDoc;
};

const writeTheoryDoc = async (docId: AdminTheoryDocId, doc: TheoryDoc) => {
  await writeFile(getTheoryDocPath(docId), `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
};

const getSortOrder = (docId: string) => {
  const index = THEORY_DOC_ORDER.indexOf(docId);
  return index === -1 ? THEORY_DOC_ORDER.length : index;
};

const listPublishedTheoryDocIds = async (): Promise<AdminTheoryDocId[]> => {
  const files = await readdir(THEORY_DOCS_DIR);

  return files
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''))
    .sort((left, right) => {
      const orderDiff = getSortOrder(left) - getSortOrder(right);
      if (orderDiff !== 0) {
        return orderDiff;
      }

      return left.localeCompare(right);
    });
};

const assertTheoryDocId = async (value: string): Promise<AdminTheoryDocId> => {
  const availableDocIds = await listPublishedTheoryDocIds();

  if (!availableDocIds.includes(value)) {
    throw new AdminServiceError('Theory track is invalid.', 422);
  }

  return value;
};

const buildTheorySummary = (topic: AdminTheoryDocId, doc: TheoryDoc): AdminTheoryTopicSummary => ({
  topic,
  title: doc.title,
  version: typeof doc.version === 'string' ? doc.version : null,
  chapterCount: doc.chapters.length,
  lessonCount: doc.chapters.reduce((sum, chapter) => sum + chapter.sections.length, 0)
});

export const listTheoryDocSummaries = async (): Promise<AdminTheoryTopicSummary[]> => {
  const docIds = await listPublishedTheoryDocIds();
  const docs = await Promise.all(docIds.map(async (docId) => buildTheorySummary(docId, await readTheoryDoc(docId))));

  return docs;
};

export const getTheoryDocForAdmin = async (topicValue: string): Promise<AdminTheoryDocPayload> => {
  const topic = await assertTheoryDocId(topicValue);
  const doc = await readTheoryDoc(topic);

  return {
    topic,
    doc,
    summary: buildTheorySummary(topic, doc)
  };
};

export const updateTheoryLessonInPublishedDoc = async ({
  topic: topicValue,
  chapterId,
  lessonId,
  title,
  estimatedMinutes,
  blocks
}: {
  topic: string;
  chapterId: string;
  lessonId: string;
  title: string;
  estimatedMinutes: number;
  blocks: ContentBlock[];
}): Promise<{
  before: { title: string; estimatedMinutes: number; blocks: ContentBlock[] };
  after: AdminTheoryLessonMutationPayload;
}> => {
  const topic = await assertTheoryDocId(topicValue);
  const normalizedTitle = title.trim();
  if (!normalizedTitle) {
    throw new AdminServiceError('Lesson title is required.', 422);
  }

  if (!Number.isInteger(estimatedMinutes) || estimatedMinutes <= 0) {
    throw new AdminServiceError('Estimated minutes must be a positive integer.', 422);
  }

  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new AdminServiceError('Lesson blocks are required.', 422);
  }

  const doc = await readTheoryDoc(topic);
  const chapter = doc.chapters.find((entry) => entry.id === chapterId);
  if (!chapter) {
    throw new AdminServiceError('Theory module not found.', 404);
  }

  const lesson = chapter.sections.find((entry) => entry.id === lessonId);
  if (!lesson) {
    throw new AdminServiceError('Theory lesson not found.', 404);
  }

  const before = {
    title: lesson.title,
    estimatedMinutes: lesson.estimatedMinutes,
    blocks: lesson.blocks
  };

  lesson.title = normalizedTitle;
  lesson.estimatedMinutes = estimatedMinutes;
  lesson.blocks = blocks;
  chapter.totalMinutes = chapter.sections.reduce(
    (sum, section) => sum + (Number(section.estimatedMinutes) || 0),
    0
  );

  const validation = validateTheoryDoc(doc);
  if (!validation.isValid) {
    throw new AdminServiceError('Theory lesson update failed validation.', 422, {
      validationErrors: validation.errors
    });
  }

  await writeTheoryDoc(topic, doc);

  return {
    before,
    after: {
      topic,
      doc,
      chapterId: chapter.id,
      lesson
    }
  };
};
