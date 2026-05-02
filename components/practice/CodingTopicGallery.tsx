'use client';

import { useMemo } from 'react';
import { PracticeTopicSelectorPage } from './PracticeTopicSelectorPage';
import { CODING_TOPICS } from '@/lib/practice/codingTopics';
import {
  getCodingLanguage,
  type CodingLanguageId,
} from '@/lib/practice/codingLanguages';
import { getPracticeTopicLanguages } from '@/lib/practice/topicTierMap';

/**
 * /practice/coding/[language] — show the topic catalogue scoped to a
 * single language. Topics opt in via their `languages` field (set in
 * codingTopics.ts) so each language gallery shows only topics that
 * meaningfully translate to that tool — e.g. PySpark surfaces "Memory
 * & Skew" but not "Fundamentals", because PySpark assumes Python is
 * already known. A topic still appears as "coming soon" when no tier
 * in PRACTICE_TOPIC_TIER_MAP has content for this language yet.
 */
export function CodingTopicGallery({ languageId }: { languageId: CodingLanguageId }) {
  const language = getCodingLanguage(languageId);
  const enriched = useMemo(
    () =>
      CODING_TOPICS.filter(
        (t) => !t.languages || t.languages.includes(languageId),
      ).map((topic) => {
        const langs = getPracticeTopicLanguages(topic.id);
        const hasContentForLanguage = langs.length === 0 || langs.includes(languageId);
        return {
          ...topic,
          // Topic accent inherits the language accent — PySpark cards
          // read orange, Python cyan, SQL purple — so each gallery
          // feels visually anchored to its language tile rather than
          // sharing one neutral cyan across the catalog.
          accentRgb: language?.accentRgb ?? topic.accentRgb,
          comingSoon: topic.comingSoon || !hasContentForLanguage,
        };
      }),
    [language?.accentRgb, languageId],
  );

  return (
    <PracticeTopicSelectorPage
      title={`${language?.title ?? 'Coding'} Practice`}
      subtitle={
        language?.description ??
        'Choose a topic and drill the skills data engineers and analysts use every day.'
      }
      topics={enriched}
      hrefPrefix={`/practice/coding/${languageId}`}
      backHref="/practice/coding"
      backLabel="Coding Practice"
    />
  );
}
