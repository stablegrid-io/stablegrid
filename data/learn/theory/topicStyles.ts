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
  }
};

export const getTheoryTopicStyle = (topicId: string): TheoryTopicStyle =>
  THEORY_TOPIC_STYLE_MAP[topicId] ?? THEORY_TOPIC_STYLE_MAP.pyspark;
