import { theoryDocs } from '@/data/learn/theory';

/**
 * Picks a representative code block from a topic's theory content to surface
 * on the topic landing page. Mirrors the AI Gateway aesthetic: real code from
 * a real lesson, with enough surrounding context to explain what the user is
 * looking at.
 *
 * Selection criteria:
 *  1. Walk the first chapters of the junior doc (theoryDocs[topicId])
 *  2. Pick the first `code` block whose content is between ~5 and ~14 lines
 *  3. Capture the chapter + lesson titles and chapter index for context
 *  4. Capture every lesson in the chapter so the right-rail list can render
 */
export interface SampleLesson {
  chapterId: string;
  chapterTitle: string;
  chapterNumber: number; // 1-indexed
  totalChapters: number;
  sectionId: string;
  sectionTitle: string;
  language: string;
  code: string;
  /** Sibling sections in the same chapter — used to render the right rail. */
  chapterSections: Array<{ id: string; title: string }>;
  /** Deep-link to the lesson reader. */
  href: string;
}

interface RawSection {
  id?: string;
  title?: string;
  blocks?: Array<{ type?: string; language?: string; content?: string }>;
}

interface RawChapter {
  id?: string;
  title?: string;
  number?: number;
  sections?: RawSection[];
}

const MIN_LINES = 5;
const MAX_LINES = 14;

export function getSampleLesson(topicId: string): SampleLesson | null {
  const doc = (theoryDocs as Record<string, unknown>)[topicId];
  if (!doc || typeof doc !== 'object') return null;
  const chapters =
    ((doc as { modules?: RawChapter[]; chapters?: RawChapter[] }).modules ??
      (doc as { chapters?: RawChapter[] }).chapters ??
      []) as RawChapter[];
  if (chapters.length === 0) return null;

  for (let chIdx = 0; chIdx < Math.min(chapters.length, 5); chIdx++) {
    const chapter = chapters[chIdx];
    const sections = chapter.sections ?? [];
    for (const section of sections) {
      for (const block of section.blocks ?? []) {
        if (block.type !== 'code') continue;
        const content = block.content ?? '';
        const lineCount = content.split('\n').length;
        if (lineCount < MIN_LINES || lineCount > MAX_LINES) continue;
        if (!chapter.id || !section.id) continue;

        const params = new URLSearchParams();
        params.set('chapter', chapter.id);
        params.set('lesson', section.id);

        return {
          chapterId: chapter.id,
          chapterTitle: chapter.title ?? '',
          chapterNumber: chapter.number ?? chIdx + 1,
          totalChapters: chapters.length,
          sectionId: section.id,
          sectionTitle: section.title ?? '',
          language: block.language ?? 'text',
          code: content,
          chapterSections: sections
            .filter((s): s is RawSection & { id: string } =>
              typeof s.id === 'string',
            )
            .map((s) => ({ id: s.id, title: s.title ?? '' })),
          href: `/theory/junior?${params.toString()}`,
        };
      }
    }
  }

  return null;
}
