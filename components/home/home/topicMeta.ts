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
    color: '#f59e0b',
    softBg: 'rgba(245, 158, 11, 0.10)',
    softBorder: 'rgba(245, 158, 11, 0.25)',
    fallbackChapters: 20,
    fallbackQuestions: 60
  },
  fabric: {
    id: 'fabric',
    label: 'Microsoft Fabric',
    trackLabel: 'Fabric: End-to-End Platform',
    icon: '🏗️',
    color: '#06b6d4',
    softBg: 'rgba(6, 182, 212, 0.10)',
    softBorder: 'rgba(6, 182, 212, 0.25)',
    fallbackChapters: 1,
    fallbackQuestions: 40
  },
  airflow: {
    id: 'airflow',
    label: 'Apache Airflow',
    trackLabel: 'Apache Airflow: Beginner Track',
    icon: '🌀',
    color: '#e24d42',
    softBg: 'rgba(226, 77, 66, 0.10)',
    softBorder: 'rgba(226, 77, 66, 0.25)',
    fallbackChapters: 10,
    fallbackQuestions: 0
  },
  sql: {
    id: 'sql',
    label: 'SQL',
    trackLabel: 'SQL: Foundations Track',
    icon: '🗄️',
    color: '#4285f4',
    softBg: 'rgba(66, 133, 244, 0.10)',
    softBorder: 'rgba(66, 133, 244, 0.25)',
    fallbackChapters: 10,
    fallbackQuestions: 0
  },
  'python-de': {
    id: 'python-de',
    label: 'Python',
    trackLabel: 'Python: Data Engineering Track',
    icon: '🐍',
    color: '#3776ab',
    softBg: 'rgba(55, 118, 171, 0.10)',
    softBorder: 'rgba(55, 118, 171, 0.25)',
    fallbackChapters: 10,
    fallbackQuestions: 0
  }
};

export const HOME_TOPIC_ORDER: Topic[] = ['pyspark', 'fabric', 'airflow', 'sql', 'python-de'];

export const getHomeTopicMeta = (topic: string): HomeTopicMeta =>
  HOME_TOPICS[(topic as Topic) ?? 'pyspark'] ?? HOME_TOPICS.pyspark;
