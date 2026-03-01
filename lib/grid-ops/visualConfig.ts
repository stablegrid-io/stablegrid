import type {
  GridOpsAssetCategory,
  GridOpsAssetDefinition,
  GridOpsMicroIndicator,
  GridOpsNodeImportance,
  GridOpsVisualCategory,
  GridOpsVisualIcon
} from '@/lib/grid-ops/types';

export const GRID_VISUAL_TOKENS = {
  gridBgDark: '#071A14',
  accentGreen: '#00D084',
  accentBlue: '#2AA9FF',
  accentAmber: '#F5B942',
  accentRed: '#FF4D4F',
  accentPurple: '#9C6BFF',
  muted: '#2E3F3A'
} as const;

export const GRID_MAP_DIMENSIONS = {
  width: 1000,
  height: 420,
  safePadding: 60,
  minNodeDistance: 140
} as const;

const EVEN_LAYOUT_BOUNDS = {
  left: 82,
  right: 932,
  top: 82,
  bottom: 336
} as const;

const EVEN_LAYOUT_COLUMNS = 7;
const EVEN_LAYOUT_ROWS = 5;

const GRID_SLOT_BY_ASSET_ID: Record<string, { col: number; row: number }> = {
  'control-center': { col: 0, row: 4 },
  'solar-forecasting-array': { col: 0, row: 0 },
  'smart-transformer': { col: 2, row: 2 },
  'frequency-controller': { col: 3, row: 0 },
  'ai-grid-optimizer': { col: 4, row: 2 },
  'hvdc-interconnector': { col: 5, row: 2 },
  'grid-flywheel': { col: 5, row: 4 },
  'battery-storage': { col: 6, row: 4 },
  'demand-response-system': { col: 6, row: 0 }
};

const VISUAL_CATEGORY_BY_ASSET_CATEGORY: Record<GridOpsAssetCategory, GridOpsVisualCategory> = {
  monitoring: 'monitoring',
  control: 'control',
  forecasting: 'forecasting',
  flexibility: 'flexibility',
  reinforcement: 'reinforcement'
};

const VISUAL_ICON_BY_ASSET_ID: Record<string, GridOpsVisualIcon> = {
  'control-center': 'radar',
  'smart-transformer': 'transformer',
  'solar-forecasting-array': 'sun',
  'battery-storage': 'battery',
  'frequency-controller': 'frequency',
  'demand-response-system': 'demand',
  'grid-flywheel': 'flywheel',
  'hvdc-interconnector': 'hvdc',
  'ai-grid-optimizer': 'ai'
};

const IMPORTANCE_BY_ASSET_ID: Record<string, GridOpsNodeImportance> = {
  'control-center': 'anchor',
  'smart-transformer': 'primary',
  'solar-forecasting-array': 'primary',
  'battery-storage': 'primary',
  'frequency-controller': 'primary',
  'demand-response-system': 'secondary',
  'grid-flywheel': 'secondary',
  'hvdc-interconnector': 'primary',
  'ai-grid-optimizer': 'secondary'
};

const MICRO_INDICATOR_BY_CATEGORY: Record<GridOpsVisualCategory, GridOpsMicroIndicator> = {
  monitoring: 'sync',
  control: 'waveform',
  forecasting: 'forecast_pct',
  flexibility: 'battery_bar',
  reinforcement: 'flow_route'
};

const DEFAULT_ICON_BY_CATEGORY: Record<GridOpsVisualCategory, GridOpsVisualIcon> = {
  monitoring: 'radar',
  control: 'transformer',
  forecasting: 'sun',
  flexibility: 'battery',
  reinforcement: 'hvdc'
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const snapToGrid = (value: number, step: number) => Math.round(value / step) * step;

const getGridStep = () => ({
  x: GRID_MAP_DIMENSIONS.width / 35,
  y: GRID_MAP_DIMENSIONS.height / 21
});

const getEvenGridCoordinate = ({
  column,
  row
}: {
  column: number;
  row: number;
}) => {
  const clampedCol = clamp(column, 0, EVEN_LAYOUT_COLUMNS - 1);
  const clampedRow = clamp(row, 0, EVEN_LAYOUT_ROWS - 1);

  const xRatio = clampedCol / (EVEN_LAYOUT_COLUMNS - 1);
  const yRatio = clampedRow / (EVEN_LAYOUT_ROWS - 1);

  const rawX = EVEN_LAYOUT_BOUNDS.left + xRatio * (EVEN_LAYOUT_BOUNDS.right - EVEN_LAYOUT_BOUNDS.left);
  const rawY = EVEN_LAYOUT_BOUNDS.top + yRatio * (EVEN_LAYOUT_BOUNDS.bottom - EVEN_LAYOUT_BOUNDS.top);

  const step = getGridStep();

  return {
    x: clamp(
      snapToGrid(rawX, step.x),
      GRID_MAP_DIMENSIONS.safePadding,
      GRID_MAP_DIMENSIONS.width - GRID_MAP_DIMENSIONS.safePadding
    ),
    y: clamp(
      snapToGrid(rawY, step.y),
      GRID_MAP_DIMENSIONS.safePadding,
      GRID_MAP_DIMENSIONS.height - GRID_MAP_DIMENSIONS.safePadding
    )
  };
};

export const resolveNodeMapLayout = (nodeIds: string[]) =>
  nodeIds.reduce<Record<string, { x: number; y: number }>>((result, nodeId, index) => {
    const slot = GRID_SLOT_BY_ASSET_ID[nodeId];

    if (slot) {
      result[nodeId] = getEvenGridCoordinate({ column: slot.col, row: slot.row });
      return result;
    }

    const fallbackColumn = index % EVEN_LAYOUT_COLUMNS;
    const fallbackRow = Math.min(EVEN_LAYOUT_ROWS - 1, Math.floor(index / EVEN_LAYOUT_COLUMNS));
    result[nodeId] = getEvenGridCoordinate({ column: fallbackColumn, row: fallbackRow });
    return result;
  }, {});

export const resolveNodeVisualHints = (asset: GridOpsAssetDefinition) => {
  const visualCategory = VISUAL_CATEGORY_BY_ASSET_CATEGORY[asset.category] ?? 'control';

  return {
    visual_category: visualCategory,
    visual_icon: VISUAL_ICON_BY_ASSET_ID[asset.id] ?? DEFAULT_ICON_BY_CATEGORY[visualCategory],
    importance: IMPORTANCE_BY_ASSET_ID[asset.id] ?? 'secondary',
    micro_indicator: MICRO_INDICATOR_BY_CATEGORY[visualCategory]
  };
};

export const resolveEdgeTier = ({
  fromAsset,
  toAsset
}: {
  fromAsset: GridOpsAssetDefinition | null;
  toAsset: GridOpsAssetDefinition | null;
}): 'backbone' | 'secondary' => {
  if (!fromAsset || !toAsset) {
    return 'secondary';
  }

  const fromHints = resolveNodeVisualHints(fromAsset);
  const toHints = resolveNodeVisualHints(toAsset);

  if (fromHints.importance === 'anchor' || toHints.importance === 'anchor') {
    return 'backbone';
  }

  if (fromAsset.category === 'reinforcement' || toAsset.category === 'reinforcement') {
    return 'backbone';
  }

  if (fromHints.importance === 'primary' && toHints.importance === 'primary') {
    return 'backbone';
  }

  return 'secondary';
};

export const toSceneCoordinates = ({
  mapX,
  mapY,
  width = 16.7,
  height = 8
}: {
  mapX: number;
  mapY: number;
  width?: number;
  height?: number;
}) => {
  const normalizedX = clamp(mapX / GRID_MAP_DIMENSIONS.width, 0, 1);
  const normalizedY = clamp(mapY / GRID_MAP_DIMENSIONS.height, 0, 1);

  const sceneX = normalizedX * width - width / 2;
  const sceneZ = normalizedY * height - height / 2;

  return {
    x: sceneX,
    y: 0,
    z: sceneZ
  };
};
