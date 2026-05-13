import type { Topic } from '@/types/progress';

export interface HomeTopicMeta {
  id: Topic;
  label: string;
  trackLabel: string;
  icon: string;
  color: string;
  softBg: string;
  softBorder: string;
  fallbackChapters: number;
  fallbackQuestions: number;
}

export const HOME_TOPICS: Record<Topic, HomeTopicMeta> = {
  pyspark: {
    id: 'pyspark',
    label: 'PySpark',
    trackLabel: 'PySpark: The Full Stack',
    icon: '⚡',
    color: '#e25a1c',
    softBg: 'rgba(226, 90, 28, 0.14)',
    softBorder: 'rgba(226, 90, 28, 0.32)',
    fallbackChapters: 20,
    fallbackQuestions: 60
  }
};

export const HOME_TOPIC_ORDER: Topic[] = ['pyspark'];

export const getHomeTopicMeta = (topic: string): HomeTopicMeta =>
  HOME_TOPICS[(topic as Topic) ?? 'pyspark'] ?? HOME_TOPICS.pyspark;
