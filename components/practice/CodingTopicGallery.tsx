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
 * single language. A topic surfaces here when:
 *   - It's mapped to the language in PRACTICE_TOPIC_TIER_MAP, OR
 *   - It has no tier mapping yet (ships everywhere as "coming soon" so
 *     the catalogue feels populated even before content lands).
 */
export function CodingTopicGallery({ languageId }: { languageId: CodingLanguageId }) {
  const language = getCodingLanguage(languageId);
  const enriched = useMemo(
    () =>
      CODING_TOPICS.map((topic) => {
        const langs = getPracticeTopicLanguages(topic.id);
        const hasContentForLanguage = langs.length === 0 || langs.includes(languageId);
        return {
          ...topic,
          comingSoon: topic.comingSoon || !hasContentForLanguage,
        };
      }),
    [languageId],
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
