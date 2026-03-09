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
    eyebrow: 'PySpark missions for Microsoft Fabric',
    title: 'Train your PySpark, stabilize the Grid',
    body: 'For people who work with big data.',
    variant: 'intro',
    align: 'left',
    ctaSource: 'grid_flow_primary',
    ctaLabel: 'Learn PySpark for real',
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
    eyebrow: 'Theory',
    title: 'Start with one clear track.',
    body: 'A Fabric track with short PySpark chapters and checkpoints.',
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
            title: 'Advanced Joins & The Art of Distributed Relationships',
            meta: '11/11 lessons • 120 min',
            checkpoint: 'Checkpoint passed',
            side: 'right',
            state: 'completed'
          },
          {
            id: 'module-06',
            label: 'Module 06',
            title: 'Spark SQL',
            meta: '12/12 lessons • 120 min',
            checkpoint: 'Checkpoint passed',
            side: 'left',
            state: 'completed'
          },
          {
            id: 'module-07',
            label: 'Module 07',
            title: 'Data Cleaning & Transformation Patterns at Scale',
            meta: '5/12 lessons • 150 min',
            checkpoint: 'Checkpoint pending',
            side: 'right',
            state: 'current'
          }
        ]
      },
      actionLabel: 'Continue module',
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
    eyebrow: 'Missions',
    title: 'Then run one mission.',
    body: 'Trace one route change and resolve it with PySpark.',
    variant: 'story',
    align: 'right',
    snapshot: {
      label: 'Mission 02',
      title: '',
      status: 'Mission active',
      meta: '',
      highlights: [],
      missionListing: {
        missionId: 'Mission 01',
        title: 'Blackout Berlin',
        difficulty: 'Hard',
        description:
          'A rogue transformer floods the platform with ghost events. You identify the hot partition, apply salting, and stabilize real-time visibility before the second cascade.',
        urgency: '340,000 households. 6 hours to prevent the second wave.',
        stats: ['90 min', 'Berlin', '1.4 kWh'],
        statusLabel: 'Mission status',
        statusValue: 'Ready',
        statusDescription:
          'Mission ready. Open the briefing to review the stakes, timeline, and reward.',
        primaryAction: 'Open briefing'
      },
      actionLabel: 'Open mission brief',
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
    eyebrow: 'Grid case',
    title: 'Run one live grid challenge.',
    body: 'Make rapid dispatch decisions, earn score, and stabilize the corridor before risk cascades.',
    variant: 'story',
    align: 'left',
    snapshot: {
      label: 'Challenge 03',
      title: 'North corridor pressure wave',
      status: 'Challenge live',
      meta: 'Threat level elevated • 6 live nodes',
      mediaModel: 'control-center',
      highlights: [
        'Balance feeder load before overflow trigger.',
        'Keep stability above 92% for one full cycle.'
      ],
      actionLabel: 'Lock corridor stability',
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
    eyebrow: 'HRB layer',
    title: 'Review the HRB layer.',
    body: 'Track progress, checkpoints, and the next move after each run.',
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
        promotionTarget: 'Junior Operator',
        guidance: 'Keep focus on the unmet criteria below.',
        ctaLabel: 'Advance to next role',
        footnote: 'Review development plan'
      },
      actionLabel: 'Review shift log',
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
    eyebrow: 'PySpark-guided theory beta',
    title: 'Gamified experience to study PySpark and much more.',
    body: '',
    variant: 'final',
    align: 'center',
    ctaSource: 'grid_flow_final',
    ctaLabel: 'So, are you ready to dive in?',
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
