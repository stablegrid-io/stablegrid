'use client';

import { useMemo } from 'react';
import { PracticeTopicSelectorPage } from './PracticeTopicSelectorPage';
import { CODING_TOPICS } from '@/lib/practice/codingTopics';
import {
  getCodingLanguage,
  type CodingLanguageId,
} from '@/lib/practice/codingLanguages';
import { getPracticeTopicLanguages } from '@/lib/practice/topicTierMap';
import { usePracticeMasteryByTopic } from '@/lib/hooks/usePracticeMasteryByTopic';

// Per-language brand mark shown in the page header before the title.
// Same SVGs used by the language picker on /practice/coding.
const LANGUAGE_LOGO: Record<CodingLanguageId, string> = {
  pyspark: '/brand/pyspark-track-star.svg',
  python: '/brand/python-logo.svg',
  sql: '/brand/sql-logo.svg',
};

/**
 * /practice/coding/[language] — show the topic catalogue scoped to a
 * single language. Topics opt in via their `languages` field (set in
 * codingTopics.ts) so each language gallery shows only topics that
 * meaningfully translate to that tool — e.g. PySpark surfaces "Memory
 * & Skew" but not "Fundamentals", because PySpark assumes Python is
 * already known. A topic still appears as "coming soon" when no tier
 * in PRACTICE_TOPIC_TIER_MAP has content for this language yet.
 */
export function CodingTopicGallery({
  languageId,
  embed = false,
}: {
  languageId: CodingLanguageId;
  /**
   * When true, render only the topic cards (no page header, no back link,
   * no filter toolbar) AND skip the per-user mastery fetch — the public
   * marketing landing should always render the static catalogue view, not
   * the visitor's personal progress (their cookies still attach to the
   * fetch otherwise, leaking user state onto a marketing page).
   */
  embed?: boolean;
}) {
  const language = getCodingLanguage(languageId);
  const fetchedMastery = usePracticeMasteryByTopic(languageId);
  const masteryByTopic = embed ? {} : fetchedMastery;
  const enriched = useMemo(
    () =>
      CODING_TOPICS.filter(
        (t) => !t.languages || t.languages.includes(languageId),
      ).map((topic) => {
        const langs = getPracticeTopicLanguages(topic.id);
        const hasContentForLanguage = langs.length === 0 || langs.includes(languageId);
        const isComingSoon = topic.comingSoon || !hasContentForLanguage;
        const mastery = masteryByTopic[topic.id];
        return {
          ...topic,
          // Topic accent inherits the language accent — PySpark cards
          // read orange, Python cyan, SQL purple — so each gallery
          // feels visually anchored to its language tile rather than
          // sharing one neutral cyan across the catalog.
          accentRgb: language?.accentRgb ?? topic.accentRgb,
          comingSoon: isComingSoon,
          // Only attach progressPct on topics that actually have content
          // for this language and whose mastery row is known. Coming-soon
          // rows stay `undefined` so the bar suppresses cleanly there.
          // In embed (public landing) mode the bar is suppressed
          // unconditionally — see the gate above.
          progressPct:
            !isComingSoon && mastery !== undefined ? mastery.pct : undefined,
        };
      }),
    [language?.accentRgb, languageId, masteryByTopic],
  );

  return (
    <PracticeTopicSelectorPage
      title={`${language?.title ?? 'Coding'} Practice`}
      subtitle={
        language?.description ??
        'Choose a topic and drill the skills data engineers and analysts use every day.'
      }
      logoSrc={LANGUAGE_LOGO[languageId]}
      topics={enriched}
      hrefPrefix={`/practice/coding/${languageId}`}
      backHref="/practice/coding"
      backLabel="Coding Practice"
      embed={embed}
    />
  );
}
