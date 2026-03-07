import type {
  ConsoleMetric,
  LearningGridNode
} from '@/components/home/home/console-types';

export interface ResumeHeroData {
  moduleTitle: string;
  chapterProgress: string;
  statusLine: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
}

export interface SecondaryActionItem {
  id: string;
  title: string;
  detail: string;
  href: string;
}

export interface LearningRouteMapData {
  metrics: ConsoleMetric[];
  nodes: LearningGridNode[];
  links: Array<{ from: string; to: string }>;
  recommendedNodeId: string;
}
