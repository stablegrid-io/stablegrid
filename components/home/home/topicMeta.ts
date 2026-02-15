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
    fallbackChapters: 13,
    fallbackQuestions: 45
  },
  sql: {
    id: 'sql',
    label: 'SQL',
    icon: '🗄️',
    color: '#6b7fff',
    softBg: 'rgba(107, 127, 255, 0.10)',
    softBorder: 'rgba(107, 127, 255, 0.25)',
    fallbackChapters: 10,
    fallbackQuestions: 60
  },
  python: {
    id: 'python',
    label: 'Python',
    icon: '🐍',
    color: '#10b981',
    softBg: 'rgba(16, 185, 129, 0.10)',
    softBorder: 'rgba(16, 185, 129, 0.25)',
    fallbackChapters: 9,
    fallbackQuestions: 50
  },
  fabric: {
    id: 'fabric',
    label: 'Microsoft Fabric',
    icon: '🏗️',
    color: '#06b6d4',
    softBg: 'rgba(6, 182, 212, 0.10)',
    softBorder: 'rgba(6, 182, 212, 0.25)',
    fallbackChapters: 5,
    fallbackQuestions: 40
  }
};

export const HOME_TOPIC_ORDER: Topic[] = ['pyspark', 'sql', 'python', 'fabric'];

export const getHomeTopicMeta = (topic: string): HomeTopicMeta =>
  HOME_TOPICS[(topic as Topic) ?? 'sql'] ?? HOME_TOPICS.sql;
