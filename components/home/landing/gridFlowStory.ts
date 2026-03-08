'use client';

export type GridFlowChapterVariant = 'intro' | 'story' | 'final';
export type GridFlowChapterAlign = 'left' | 'right' | 'center';
export type GridFlowFocusZone = 'overview' | 'entry' | 'switch' | 'core' | 'output';

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

export interface GridFlowChapter {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  variant: GridFlowChapterVariant;
  align: GridFlowChapterAlign;
  ctaSource?: 'grid_flow_primary' | 'grid_flow_final';
  scene: GridFlowSceneState;
}

export const GRID_FLOW_CHAPTERS: GridFlowChapter[] = [
  {
    id: 'intro',
    eyebrow: 'PySpark missions for Microsoft Fabric',
    title: 'Learn PySpark in Microsoft Fabric.',
    body: 'Theory, missions, grid examples, and HRB in one guided flow.',
    variant: 'intro',
    align: 'left',
    ctaSource: 'grid_flow_primary',
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
    body: 'Example: a Fabric track with short PySpark chapters and checkpoints.',
    variant: 'story',
    align: 'left',
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
    body: 'Example: trace one route change and resolve it with PySpark.',
    variant: 'story',
    align: 'right',
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
    id: 'grid-example',
    eyebrow: 'Grid example',
    title: 'See one live grid case.',
    body: 'A 330kV switching example makes the notebook feel operational.',
    variant: 'story',
    align: 'left',
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
    id: 'hrb-example',
    eyebrow: 'HRB example',
    title: 'Review the HRB layer.',
    body: 'Track progress, checkpoints, and the next move after each run.',
    variant: 'story',
    align: 'right',
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
    title: 'Start with theory. Move into missions.',
    body: 'Open the track, run the examples, then continue into Grid and HRB.',
    variant: 'final',
    align: 'center',
    ctaSource: 'grid_flow_final',
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
