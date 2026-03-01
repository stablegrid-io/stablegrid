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
    accentRgb: '217,70,239',
    eyebrow: 'Platform Track',
    highlights: [
      'Lakehouse and pipeline foundations',
      'Realtime and warehouse workflows',
      'Governance path ready for rebuild'
    ],
    accentTextClass: 'text-fuchsia-600 dark:text-fuchsia-300',
    iconClass: 'text-fuchsia-600 dark:text-fuchsia-400',
    iconWrapClass:
      'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-800 dark:bg-fuchsia-900/20 dark:text-fuchsia-300',
    badgeClass:
      'border-fuchsia-200/80 bg-fuchsia-50/90 text-fuchsia-700 dark:border-fuchsia-800 dark:bg-fuchsia-900/20 dark:text-fuchsia-300',
    progressClass: 'bg-fuchsia-500'
  }
};

export const getTheoryTopicStyle = (topicId: string): TheoryTopicStyle =>
  THEORY_TOPIC_STYLE_MAP[topicId] ?? THEORY_TOPIC_STYLE_MAP.pyspark;
