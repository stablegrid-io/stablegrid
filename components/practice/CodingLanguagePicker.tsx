'use client';

import { PracticeTopicSelectorPage } from './PracticeTopicSelectorPage';
import { CODING_LANGUAGES } from '@/lib/practice/codingLanguages';

/**
 * /practice/coding — pick a language. Three cards (PySpark / Python /
 * SQL) using the same Topic-card shell as the rest of the /practice
 * surface, so the visual hierarchy stays consistent.
 *
 * Each card hrefs into /practice/coding/[language], where the existing
 * topic gallery renders scoped to that language.
 */
export function CodingLanguagePicker() {
  return (
    <PracticeTopicSelectorPage
      title="Coding Practice"
      subtitle="Pick a language to start drilling. PySpark is live; Python and SQL are landing soon."
      topics={CODING_LANGUAGES}
      hrefPrefix="/practice/coding"
      hideFilters
    />
  );
}
