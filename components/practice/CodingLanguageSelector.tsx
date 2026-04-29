'use client';

import { PracticeTopicSelectorPage } from './PracticeTopicSelectorPage';
import { CODING_TOPICS } from '@/lib/practice/codingTopics';

export function CodingLanguageSelector() {
  return (
    <PracticeTopicSelectorPage
      title="Coding Practice"
      subtitle="Choose a topic and drill the skills data engineers and analysts use every day."
      topics={CODING_TOPICS}
      hrefPrefix="/practice/coding"
    />
  );
}
