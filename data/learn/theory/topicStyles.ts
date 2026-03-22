export interface TheoryTopicStyle {
  accentRgb: string;
  eyebrow: string;
  highlights: string[];
  accentTextClass: string;
  iconClass: string;
  iconWrapClass: string;
  badgeClass: string;
  progressClass: string;
}

export const THEORY_TOPIC_STYLE_MAP: Record<string, TheoryTopicStyle> = {
  pyspark: {
    accentRgb: '245,158,11',
    eyebrow: 'Flagship Track',
    highlights: [
      'Shuffles, skew, and partition strategy',
      'Streaming incidents and recovery',
      'Delta, quality, and governance'
    ],
    accentTextClass: 'text-warning-600 dark:text-warning-300',
    iconClass: 'text-warning-600 dark:text-warning-400',
    iconWrapClass:
      'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-800 dark:bg-warning-900/20 dark:text-warning-300',
    badgeClass:
      'border-warning-200/80 bg-warning-50/90 text-warning-700 dark:border-warning-800 dark:bg-warning-900/20 dark:text-warning-300',
    progressClass: 'bg-warning-500'
  },
  fabric: {
    accentRgb: '34,185,153',
    eyebrow: 'Platform Track',
    highlights: [
      'Lakehouse and pipeline foundations',
      'Realtime and warehouse workflows',
      'Governance path ready for rebuild'
    ],
    accentTextClass: 'text-brand-600 dark:text-brand-300',
    iconClass: 'text-brand-600 dark:text-brand-400',
    iconWrapClass:
      'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300',
    badgeClass:
      'border-brand-200/80 bg-brand-50/90 text-brand-700 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300',
    progressClass: 'bg-brand-500'
  },
  airflow: {
    accentRgb: '226,77,66',
    eyebrow: 'Beginner Track',
    highlights: [
      'DAGs, tasks, and operator mental models',
      'Scheduling, sensors, and dependency control',
      'Testing, monitoring, and orchestration capstone'
    ],
    accentTextClass: 'text-rose-600 dark:text-rose-300',
    iconClass: 'text-rose-600 dark:text-rose-400',
    iconWrapClass:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300',
    badgeClass:
      'border-rose-200/80 bg-rose-50/90 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300',
    progressClass: 'bg-rose-500'
  }
};

// Placeholder styles for new topics — all use the same structure
const placeholderStyle = (rgb: string, eyebrow: string): TheoryTopicStyle => ({
  accentRgb: rgb,
  eyebrow,
  highlights: [],
  accentTextClass: 'text-on-surface-variant',
  iconClass: 'text-on-surface-variant',
  iconWrapClass: 'border-outline-variant bg-surface-container',
  badgeClass: 'border-outline-variant bg-surface-container text-on-surface-variant',
  progressClass: 'bg-primary'
});

const newTopics: Record<string, TheoryTopicStyle> = {
  kafka:            placeholderStyle('0,150,136',   'Streaming'),
  sql:              placeholderStyle('66,133,244',   'Foundations'),
  docker:           placeholderStyle('36,150,237',   'Infrastructure'),
  dbt:              placeholderStyle('255,105,51',    'Analytics Engineering'),
  databricks:       placeholderStyle('255,59,48',     'Platform'),
  'data-modeling':  placeholderStyle('156,39,176',    'Architecture'),
  'python-de':      placeholderStyle('55,118,171',    'Foundations'),
  'cloud-infra':    placeholderStyle('255,152,0',     'Infrastructure'),
  'data-quality':   placeholderStyle('76,175,80',     'Engineering'),
  iceberg:          placeholderStyle('0,188,212',     'Table Format'),
  'git-cicd':       placeholderStyle('240,80,50',     'DevOps'),
  flink:            placeholderStyle('226,69,115',    'Streaming'),
  snowflake:        placeholderStyle('41,128,185',    'Warehouse'),
  terraform:        placeholderStyle('98,75,192',     'Infrastructure'),
  'spark-streaming': placeholderStyle('230,126,34',   'Streaming'),
  governance:       placeholderStyle('96,125,139',    'Management'),
};

Object.assign(THEORY_TOPIC_STYLE_MAP, newTopics);

export const getTheoryTopicStyle = (topicId: string): TheoryTopicStyle =>
  THEORY_TOPIC_STYLE_MAP[topicId] ?? THEORY_TOPIC_STYLE_MAP.pyspark;
