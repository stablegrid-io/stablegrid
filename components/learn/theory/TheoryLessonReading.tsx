'use client';

import { useEffect, useRef, useState } from 'react';
import type { TheoryChapter, TheorySection as TheorySectionType } from '@/types/theory';

const SENTENCE_SPLIT_PATTERN = /(?<=[.!?])\s+(?=[A-Z0-9“"'])/;
const SUMMARY_LIMIT = 220;
const STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'analytics',
  'and',
  'before',
  'between',
  'build',
  'core',
  'data',
  'into',
  'lesson',
  'make',
  'model',
  'module',
  'platform',
  'that',
  'their',
  'there',
  'these',
  'this',
  'understanding',
  'using',
  'what',
  'with',
  'your'
]);

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

export const stripLessonPrefix = (value: string) =>
  value.replace(/^lesson\s*\d+\s*:\s*/i, '').trim();

const clipToSentenceBoundary = (value: string, maxLength: number) => {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const clipped = normalized.slice(0, maxLength).trimEnd();
  const boundary = Math.max(
    clipped.lastIndexOf('.'),
    clipped.lastIndexOf('!'),
    clipped.lastIndexOf('?')
  );

  if (boundary > 80) {
    return `${clipped.slice(0, boundary + 1)}`;
  }

  return `${clipped}…`;
};

const splitSentenceChunks = (value: string, sentencesPerChunk = 2) => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return [];
  }

  const sentences = normalized.split(SENTENCE_SPLIT_PATTERN).filter(Boolean);
  if (sentences.length <= sentencesPerChunk || normalized.length < 280) {
    return [normalized];
  }

  const chunks: string[] = [];
  for (let index = 0; index < sentences.length; index += sentencesPerChunk) {
    chunks.push(sentences.slice(index, index + sentencesPerChunk).join(' '));
  }

  return chunks;
};

const getLessonLead = (section: TheorySectionType) => {
  const paragraph = section.blocks.find(
    (block): block is Extract<TheorySectionType['blocks'][number], { type: 'paragraph' }> =>
      block.type === 'paragraph' && block.content.trim().length > 0
  );

  return paragraph ? clipToSentenceBoundary(paragraph.content, SUMMARY_LIMIT) : null;
};

const tokenizeKeywordPhrase = (value: string) =>
  normalizeWhitespace(value)
    .replace(/[^\p{L}\p{N}\s/&-]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

const sanitizeKeywordPhrase = (value: string) => {
  const cleaned = normalizeWhitespace(value.replace(/[.,;:!?]+$/g, ''));
  if (!cleaned) {
    return null;
  }

  const words = tokenizeKeywordPhrase(cleaned);
  if (words.length === 0 || words.length > 5) {
    return null;
  }

  return cleaned;
};

const extractTitleKeywordPhrases = (title: string) => {
  const normalizedTitle = stripLessonPrefix(title);
  const parts = normalizedTitle
    .split(/,|:|\/|\band\b|\bwith\b|&/i)
    .map((part) => sanitizeKeywordPhrase(part))
    .filter((value): value is string => Boolean(value));

  return parts.length >= 2 ? parts : [];
};

const extractKeywordsFromParagraph = (value: string) => {
  const words = tokenizeKeywordPhrase(value);
  const uniqueKeywords: string[] = [];
  const seen = new Set<string>();

  for (const word of words) {
    const normalizedWord = word.toLowerCase();
    const isAcronym = /^[A-Z0-9]{2,}$/.test(word);

    if (
      seen.has(normalizedWord) ||
      STOP_WORDS.has(normalizedWord) ||
      (!isAcronym && normalizedWord.length < 5)
    ) {
      continue;
    }

    seen.add(normalizedWord);
    uniqueKeywords.push(isAcronym ? word : word[0].toUpperCase() + word.slice(1));

    if (uniqueKeywords.length === 3) {
      break;
    }
  }

  return uniqueKeywords;
};

const buildLessonKeywords = (section: TheorySectionType) => {
  const keywords: string[] = [];
  const seen = new Set<string>();

  const pushKeyword = (value: string | null) => {
    if (!value) {
      return;
    }

    const normalizedValue = value.toLowerCase();
    if (seen.has(normalizedValue)) {
      return;
    }

    seen.add(normalizedValue);
    keywords.push(value);
  };

  extractTitleKeywordPhrases(section.title).forEach(pushKeyword);

  for (const block of section.blocks) {
    if (keywords.length >= 3) {
      break;
    }

    if (block.type === 'heading' || block.type === 'subheading') {
      pushKeyword(sanitizeKeywordPhrase(stripLessonPrefix(block.content)));
      continue;
    }

    if (block.type === 'key-concept') {
      pushKeyword(sanitizeKeywordPhrase(stripLessonPrefix(block.term)));
      continue;
    }

    if (block.type === 'callout') {
      pushKeyword(sanitizeKeywordPhrase(stripLessonPrefix(block.title ?? '')));
      continue;
    }
  }

  if (keywords.length < 2) {
    const paragraphKeywords = extractKeywordsFromParagraph(getLessonLead(section) ?? '');
    paragraphKeywords.forEach(pushKeyword);
  }

  return keywords.slice(0, Math.min(3, Math.max(2, keywords.length)));
};

interface TheoryLessonIntroProps {
  chapter: TheoryChapter;
  lesson: TheorySectionType;
  lessonIndex: number;
  lessonTotal: number;
  lessonProgressLabel?: string;
  lessonProgressPercent?: number;
  showCheckpointTag?: boolean;
  completedLessonCount?: number;
  orderedLessonIds?: string[];
  completedLessonIds?: string[];
}

export const TheoryLessonIntro = ({
  chapter,
  lesson,
  lessonIndex,
  lessonTotal,
  lessonProgressLabel,
  lessonProgressPercent = 0,
  showCheckpointTag = false,
  completedLessonCount = 0,
  orderedLessonIds = [],
  completedLessonIds = []
}: TheoryLessonIntroProps) => {
  const estimatedMinutes = lesson.durationMinutes ?? lesson.estimatedMinutes ?? 0;
  const normalizedLessonTitle = stripLessonPrefix(lesson.title);
  const keywordPills = buildLessonKeywords(lesson);

  // Track seconds spent on this lesson for the active segment animation
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const lessonIdRef = useRef(lesson.id);
  const completedSet = new Set(completedLessonIds);
  const hasLessonIds = orderedLessonIds.length > 0;
  const isCurrentLessonCompleted = hasLessonIds
    ? completedSet.has(lesson.id)
    : lessonIndex < completedLessonCount;

  useEffect(() => {
    if (lessonIdRef.current !== lesson.id) {
      lessonIdRef.current = lesson.id;
      setElapsedSeconds(0);
    }
  }, [lesson.id]);

  useEffect(() => {
    if (isCurrentLessonCompleted) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => Math.min(s + 1, 30));
    }, 1000);
    return () => clearInterval(interval);
  }, [isCurrentLessonCompleted, lesson.id]);

  const activeSegmentProgress = isCurrentLessonCompleted ? 100 : Math.round((elapsedSeconds / 30) * 100);

  return (
    <section className="mb-10 border-b pb-8" style={{ borderColor: 'var(--rm-border)' }}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.72rem] font-mono font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--rm-text-secondary)' }}>
        <span>Module {chapter.order ?? chapter.number}</span>
        <span className="opacity-35">•</span>
        <span>Lesson {lessonIndex + 1} of {lessonTotal}</span>
        <span className="opacity-35">•</span>
        <span>{estimatedMinutes} min</span>
        {showCheckpointTag ? (
          <>
            <span className="opacity-35">•</span>
            <span className="text-brand-300">Checkpoint</span>
          </>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        <h1
          className="max-w-[24ch] text-[clamp(1.7rem,3.1vw,3rem)] font-semibold leading-[1.02] tracking-[-0.03em]"
          style={{ textWrap: 'balance', color: 'var(--rm-text-heading)', fontFamily: 'var(--rm-font-heading)' }}
        >
          {normalizedLessonTitle}
        </h1>
      </div>

    </section>
  );
};

export const splitReadableParagraph = (content: string) => splitSentenceChunks(content);
