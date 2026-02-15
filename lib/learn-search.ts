import { cheatSheets } from '@/data/learn';
import { theoryDocs } from '@/data/learn/theory';
import pysparkQuestions from '@/data/questions/pyspark.json';
import pythonQuestions from '@/data/questions/python.json';
import sqlQuestions from '@/data/questions/sql.json';
import type { HomeSearchItem } from '@/types/home-search';
import type { Topic } from '@/types/progress';

interface QuestionSearchRow {
  id: string;
  topic: string;
  difficulty?: string;
  type?: string;
  question: string;
  tags?: string[];
}

interface QuestionSearchPayload {
  questions?: QuestionSearchRow[];
}

const LEARN_TOPICS: Topic[] = ['pyspark', 'sql', 'python', 'fabric'];

const QUESTION_BANKS: Array<{ topic: Topic; payload: QuestionSearchPayload }> = [
  {
    topic: 'pyspark',
    payload: pysparkQuestions as QuestionSearchPayload
  },
  {
    topic: 'sql',
    payload: sqlQuestions as QuestionSearchPayload
  },
  {
    topic: 'python',
    payload: pythonQuestions as QuestionSearchPayload
  }
];

const getTopicLabel = (topic: Topic) => {
  const sheet = cheatSheets[topic];
  if (sheet) {
    return sheet.title.replace(' Reference', '');
  }

  return topic.charAt(0).toUpperCase() + topic.slice(1);
};

const buildLearnSearchItems = (): HomeSearchItem[] => {
  const chapterItems: HomeSearchItem[] = LEARN_TOPICS.flatMap((topic) => {
    const doc = theoryDocs[topic];
    if (!doc) return [];

    const topicLabel = getTopicLabel(topic);
    return doc.chapters.map((chapter) => ({
      id: `chapter-${topic}-${chapter.id}`,
      type: 'chapter',
      topic,
      title: chapter.title,
      subtitle: `${topicLabel} · Chapter ${chapter.number}`,
      href: `/learn/${topic}/theory/all?chapter=${chapter.id}`,
      keywords: [
        chapter.id,
        chapter.title,
        chapter.description,
        ...chapter.sections.map((section) => section.title)
      ]
    }));
  });

  const functionItems: HomeSearchItem[] = LEARN_TOPICS.flatMap((topic) => {
    const sheet = cheatSheets[topic];
    if (!sheet) return [];

    const topicLabel = getTopicLabel(topic);
    return sheet.functions.map((entry) => ({
      id: `function-${topic}-${entry.id}`,
      type: 'function',
      topic,
      title: entry.name,
      subtitle: `${topicLabel} · ${entry.category}`,
      href: `/learn/${topic}/functions?function=${entry.id}`,
      keywords: [
        entry.name,
        entry.category,
        entry.shortDescription,
        entry.difficulty,
        ...entry.tags
      ]
    }));
  });

  const questionItems: HomeSearchItem[] = QUESTION_BANKS.flatMap(({ topic, payload }) => {
    const topicLabel = getTopicLabel(topic);
    const questions = payload.questions ?? [];

    return questions.map((question) => ({
      id: `question-${topic}-${question.id}`,
      type: 'question',
      topic,
      title: question.question,
      subtitle: `${topicLabel} · ${(question.difficulty ?? 'mixed').toUpperCase()}`,
      href: `/practice/${topic}`,
      keywords: [
        question.topic,
        question.type ?? '',
        question.difficulty ?? '',
        ...(question.tags ?? [])
      ].filter((entry) => entry.length > 0)
    }));
  });

  return [...chapterItems, ...functionItems, ...questionItems];
};

export const learnSearchItems = buildLearnSearchItems();

