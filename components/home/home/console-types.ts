import type { Topic } from '@/types/progress';

export type ConsoleStatusState = 'stable' | 'improving' | 'degrading';

export interface ConsoleMetric {
  id: string;
  label: string;
  value: string;
  status: ConsoleStatusState;
  detail: string;
  actionLabel: string;
  actionHref: string;
}

export type GridNodeState =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'completed'
  | 'recommended';

export type GridNodeKind =
  | 'topic'
  | 'theory'
  | 'chapter'
  | 'practice'
  | 'review'
  | 'mission'
  | 'grid';

export interface GridAction {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export interface LearningGridNode {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  detail: string;
  state: GridNodeState;
  kind: GridNodeKind;
  topic?: Topic;
  symbol?: string;
  hint?: string;
  position: {
    x: number;
    y: number;
  };
  mobileOrder: number;
  actions: GridAction[];
}

export interface ConsoleAlert {
  id: string;
  label: string;
  detail: string;
  actionLabel: string;
  href: string;
  tone: 'warning' | 'positive' | 'neutral';
}

export interface ConsoleActivityItem {
  id: string;
  label: string;
  detail: string;
  actionLabel: string;
  href: string;
  kind: 'theory' | 'practice' | 'grid';
}
