import type { Topic } from '@/types/progress';

export interface HomeTopicMeta {
  id: Topic;
  label: string;
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
    icon: '⚡',
    color: '#f59e0b',
    softBg: 'rgba(245, 158, 11, 0.10)',
    softBorder: 'rgba(245, 158, 11, 0.25)',
    fallbackChapters: 20,
    fallbackQuestions: 60
  },
  fabric: {
    id: 'fabric',
    label: 'Microsoft Fabric',
    icon: '🏗️',
    color: '#06b6d4',
    softBg: 'rgba(6, 182, 212, 0.10)',
    softBorder: 'rgba(6, 182, 212, 0.25)',
    fallbackChapters: 1,
    fallbackQuestions: 40
  }
};

export const HOME_TOPIC_ORDER: Topic[] = ['pyspark', 'fabric'];

export const getHomeTopicMeta = (topic: string): HomeTopicMeta =>
  HOME_TOPICS[(topic as Topic) ?? 'pyspark'] ?? HOME_TOPICS.pyspark;
