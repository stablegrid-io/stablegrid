'use client';

import { useMemo } from 'react';
import { PracticeTopicSelectorPage } from './PracticeTopicSelectorPage';
import { CODING_TOPICS } from '@/lib/practice/codingTopics';
import { getPracticeTopicLanguages } from '@/lib/practice/topicTierMap';

const LANGUAGE_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'pyspark', label: 'PySpark' },
  { id: 'python', label: 'Python' },
  { id: 'sql', label: 'SQL' },
];

export function CodingLanguageSelector() {
  const enrichedTopics = useMemo(
    () =>
      CODING_TOPICS.map((topic) => {
        const langs = getPracticeTopicLanguages(topic.id);
        // Default every coding topic to PySpark until other-language sets land
        // in the tier map. Once a topic gets Python/SQL content there, the
        // tier map is the source of truth and overrides this fallback.
        return { ...topic, languages: langs.length > 0 ? langs : ['pyspark'] };
      }),
    [],
  );

  return (
    <PracticeTopicSelectorPage
      title="Coding Practice"
      subtitle="Choose a topic and drill the skills data engineers and analysts use every day."
      topics={enrichedTopics}
      hrefPrefix="/practice/coding"
      languageOptions={LANGUAGE_OPTIONS}
    />
  );
}
