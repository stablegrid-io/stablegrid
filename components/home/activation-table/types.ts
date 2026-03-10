export interface ActivationActionLink {
  label: string;
  href: string;
}

export type ActivationCategoryKind = 'theory' | 'tasks' | 'grid';

export interface ActivationProgressData {
  valuePct: number;
  label?: string;
  valueLabel?: string;
}

export interface ActivationCategoryCardData {
  kind: ActivationCategoryKind;
  label: string;
  title: string;
  summary: string;
  statLine?: string;
  accentRgb?: string;
  progress?: ActivationProgressData;
  primaryAction?: ActivationActionLink;
}

export interface ActivationGreetingData {
  title: string;
  subtitle: string;
  lastClockedIn?: string;
}

// Legacy card interfaces kept for compatibility while the new category surface is active.
export interface ProgressStripData {
  headline: string;
  items: string[];
}

export interface CurrentModuleCardData {
  title: string;
  stateLabel: string;
  descriptor: string;
  progressLine: string;
  cta: ActivationActionLink;
}

export interface NextRecommendedCardData {
  title: string;
  reason: string;
  effort?: string;
  cta: ActivationActionLink;
}

export interface PendingTaskCardData {
  title: string;
  status: string;
  note: string;
  cta: ActivationActionLink;
}

export interface ReviewNotesCardData {
  title: string;
  descriptor: string;
  note: string;
  cta: ActivationActionLink;
}

export interface HomeActivationTableData {
  greeting: ActivationGreetingData;
  categories: ActivationCategoryCardData[];
}
