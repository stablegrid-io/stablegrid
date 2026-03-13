'use client';

export type GridFlowChapterVariant = 'intro' | 'story' | 'final';
export type GridFlowChapterAlign = 'left' | 'right' | 'center';
export type GridFlowFocusZone = 'overview' | 'entry' | 'switch' | 'core' | 'output';
export type GridFlowSnapshotTone = 'mint' | 'amber' | 'sky';

export interface GridFlowSceneState {
  stageBeat: number;
  diagramOffsetX: number;
  diagramOffsetY: number;
  diagramScale: number;
  pathReveal: number;
  energyStrength: number;
  activeCalloutId: string | null;
  focusZone: GridFlowFocusZone;
}

export interface GridFlowStepSnapshot {
  laneSnapshot?: {
    modules: readonly {
      id: string;
      label: string;
      title: string;
      meta: string;
      checkpoint: string;
      side: 'left' | 'right';
      state: 'completed' | 'current';
    }[];
  };
  missionListing?: {
    missionId: string;
    title: string;
    difficulty: string;
    description: string;
    urgency: string;
    stats: readonly string[];
    statusLabel: string;
    statusValue: string;
    statusDescription: string;
    primaryAction: string;
  };
  label: string;
  title: string;
  status: string;
  meta: string;
  highlights: readonly string[];
  mediaModel?: 'control-center';
  progressionSnapshot?: {
    readinessPercent: number;
    promotionTarget: string;
    guidance: string;
    ctaLabel: string;
    footnote: string;
  };
  missionBriefing?: {
    region: string;
    trigger: string;
    objective: string;
    constraints: readonly string[];
    deliverables: readonly string[];
  };
  codeSnippet?: readonly string[];
  codeLabel?: string;
  codeTone?: 'default' | 'alert';
  actionLabel: string;
  tone: GridFlowSnapshotTone;
}

export interface GridFlowChapter {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  variant: GridFlowChapterVariant;
  align: GridFlowChapterAlign;
  ctaSource?: 'grid_flow_primary' | 'grid_flow_final';
  ctaLabel?: string;
  ctaHint?: string;
  snapshot?: GridFlowStepSnapshot;
  scene: GridFlowSceneState;
}

export const GRID_FLOW_CHAPTERS: GridFlowChapter[] = [
  {
    id: 'intro',
    eyebrow: 'Big data learning platform',
    title: 'Learn to handle big data with ease.',
    body: 'Start with theory, then apply it with flashcards, missions, notebooks, and the Grid game.',
    variant: 'intro',
    align: 'left',
    ctaSource: 'grid_flow_primary',
    ctaLabel: 'Start free',
    scene: {
      stageBeat: 0.18,
      diagramOffsetX: -18,
      diagramOffsetY: 16,
      diagramScale: 0.92,
      pathReveal: 0.08,
      energyStrength: 0.12,
      activeCalloutId: null,
      focusZone: 'overview'
    }
  },
  {
    id: 'theory',
    eyebrow: 'Theory courses',
    title: 'Learn core big-data theory.',
    body: 'Start with guided theory courses in PySpark and Microsoft Fabric.',
    variant: 'story',
    align: 'left',
    snapshot: {
      label: 'Module 07',
      title: 'Data cleaning and transformation patterns at scale',
      status: 'Checkpoint pending',
      meta: '4/12 lessons • 150 min',
      highlights: [],
      laneSnapshot: {
        modules: [
          {
            id: 'module-05',
            label: 'Module 05',
            title: 'Distributed Joins and Partition Strategy',
            meta: '11/11 lessons • 120 min',
            checkpoint: 'Checkpoint passed',
            side: 'right',
            state: 'completed'
          },
          {
            id: 'module-06',
            label: 'Module 06',
            title: 'Microsoft Fabric Foundations',
            meta: '12/12 lessons • 120 min',
            checkpoint: 'Checkpoint passed',
            side: 'left',
            state: 'completed'
          },
          {
            id: 'module-07',
            label: 'Module 07',
            title: 'PySpark Data Cleaning at Scale',
            meta: '5/12 lessons • 150 min',
            checkpoint: 'Checkpoint pending',
            side: 'right',
            state: 'current'
          }
        ]
      },
      actionLabel: 'Continue course',
      tone: 'mint'
    },
    scene: {
      stageBeat: 0.96,
      diagramOffsetX: -54,
      diagramOffsetY: 6,
      diagramScale: 1.18,
      pathReveal: 0.26,
      energyStrength: 0.3,
      activeCalloutId: 'callout-entry',
      focusZone: 'entry'
    }
  },
  {
    id: 'missions',
    eyebrow: 'Practice tasks',
    title: 'Practice with guided tasks.',
    body: 'Every module reinforced through practice.',
    variant: 'story',
    align: 'left',
    snapshot: {
      label: 'Mission 02',
      title: '',
      status: 'Mission active',
      meta: '',
      highlights: [],
      missionListing: {
        missionId: 'Mission 01',
        title: 'Pipeline Surge Response',
        difficulty: 'Hard',
        description:
          'A traffic spike floods ingestion with duplicate events. You identify skew, rebalance partitions, and restore real-time data reliability.',
        urgency: 'High-impact data incident. 60 minutes to stabilize.',
        stats: ['60 min', 'Streaming', 'PySpark'],
        statusLabel: 'Mission status',
        statusValue: 'Ready',
        statusDescription:
          'Mission ready. Review the brief and solve the scenario using course concepts.',
        primaryAction: 'Start mission'
      },
      actionLabel: 'Start task',
      tone: 'amber'
    },
    scene: {
      stageBeat: 1.82,
      diagramOffsetX: -8,
      diagramOffsetY: -2,
      diagramScale: 1.24,
      pathReveal: 0.54,
      energyStrength: 0.52,
      activeCalloutId: 'callout-switch',
      focusZone: 'switch'
    }
  },
  {
    id: 'grid-case',
    eyebrow: 'Grid game experience',
    title: 'Apply your skills in the Grid game.',
    body: 'Earn kWh, then deploy energy assets to stabilize the grid.',
    variant: 'story',
    align: 'left',
    snapshot: {
      label: 'Challenge 03',
      title: 'North corridor pressure wave',
      status: 'Challenge live',
      meta: 'Threat level elevated • 6 live nodes',
      mediaModel: 'control-center',
      highlights: [
        'Detect risk signals before they cascade.',
        'Keep stability above 92% for one full cycle.'
      ],
      actionLabel: 'Play grid scenario',
      tone: 'sky'
    },
    scene: {
      stageBeat: 2.76,
      diagramOffsetX: 28,
      diagramOffsetY: -18,
      diagramScale: 1.3,
      pathReveal: 0.8,
      energyStrength: 0.78,
      activeCalloutId: 'callout-core',
      focusZone: 'core'
    }
  },
  {
    id: 'hrb-layer',
    eyebrow: 'Progress tracking',
    title: 'Track skills across courses and tasks.',
    body: 'See theory completion, task progress, and your next recommended step in one place.',
    variant: 'story',
    align: 'right',
    snapshot: {
      label: 'HRB Layer',
      title: 'Checkpoint and readiness ledger',
      status: 'Promotion gate ready',
      meta: '3 checkpoints • 92% confidence',
      highlights: [],
      progressionSnapshot: {
        readinessPercent: 42,
        promotionTarget: 'Big Data Practitioner',
        guidance: 'Focus on remaining theory and tasks to complete your path.',
        ctaLabel: 'Advance learning level',
        footnote: 'Review recommended next tasks'
      },
      actionLabel: 'Review progress',
      tone: 'mint'
    },
    scene: {
      stageBeat: 3.62,
      diagramOffsetX: 62,
      diagramOffsetY: -8,
      diagramScale: 1.22,
      pathReveal: 1,
      energyStrength: 0.96,
      activeCalloutId: 'callout-output',
      focusZone: 'output'
    }
  },
  {
    id: 'cta',
    eyebrow: '',
    title: 'Ready to make big data feel simpler?',
    body: '',
    variant: 'final',
    align: 'center',
    ctaSource: 'grid_flow_final',
    ctaLabel: 'Start free',
    scene: {
      stageBeat: 4.12,
      diagramOffsetX: 6,
      diagramOffsetY: 2,
      diagramScale: 1.02,
      pathReveal: 1,
      energyStrength: 0.88,
      activeCalloutId: null,
      focusZone: 'overview'
    }
  }
] as const;
