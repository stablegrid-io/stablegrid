import { GRID_OPS_ASSETS } from '@/lib/grid-ops/config';
import type { GridOpsVisualIcon } from '@/lib/grid-ops/types';

export type GridSceneAssetKey =
  | 'control-center'
  | 'smart-transformer'
  | 'solar-forecasting-array'
  | 'battery-storage'
  | 'frequency-controller'
  | 'demand-response-system'
  | 'grid-flywheel'
  | 'hvdc-interconnector'
  | 'ai-grid-optimizer';

export interface GridSceneAssetDescriptor {
  key: GridSceneAssetKey;
  url: string;
  scale: number;
  yaw: number;
  yOffset: number;
  emissiveColor: string;
  fallbackIcon: GridOpsVisualIcon;
}

export const GRID_SCENE_ASSET_REGISTRY: Record<GridSceneAssetKey, GridSceneAssetDescriptor> = {
  'control-center': {
    key: 'control-center',
    url: '/grid-assets/models/control-center.glb?v=map-natural-2',
    scale: 1.06,
    yaw: 0.4,
    yOffset: 0.06,
    emissiveColor: '#00D084',
    fallbackIcon: 'radar'
  },
  'smart-transformer': {
    key: 'smart-transformer',
    url: '/grid-assets/models/smart-transformer.glb',
    scale: 0.49,
    yaw: 0.28,
    yOffset: 0.16,
    emissiveColor: '#2AA9FF',
    fallbackIcon: 'transformer'
  },
  'solar-forecasting-array': {
    key: 'solar-forecasting-array',
    url: '/grid-assets/models/solar-forecasting-array.glb',
    scale: 1.02,
    yaw: 0.2,
    yOffset: 0.05,
    emissiveColor: '#F5B942',
    fallbackIcon: 'sun'
  },
  'battery-storage': {
    key: 'battery-storage',
    url: '/grid-assets/models/battery-storage.glb',
    scale: 1.35,
    yaw: 0.18,
    yOffset: 0.04,
    emissiveColor: '#F5B942',
    fallbackIcon: 'battery'
  },
  'frequency-controller': {
    key: 'frequency-controller',
    url: '/grid-assets/models/frequency-controller.glb',
    scale: 0.46,
    yaw: 0.32,
    yOffset: 0.18,
    emissiveColor: '#2AA9FF',
    fallbackIcon: 'frequency'
  },
  'demand-response-system': {
    key: 'demand-response-system',
    url: '/grid-assets/models/demand-response-system.glb',
    scale: 0.5,
    yaw: 0.12,
    yOffset: 0.16,
    emissiveColor: '#9C6BFF',
    fallbackIcon: 'demand'
  },
  'grid-flywheel': {
    key: 'grid-flywheel',
    url: '/grid-assets/models/grid-flywheel.glb',
    scale: 0.5,
    yaw: 0.24,
    yOffset: 0.16,
    emissiveColor: '#2AA9FF',
    fallbackIcon: 'flywheel'
  },
  'hvdc-interconnector': {
    key: 'hvdc-interconnector',
    url: '/grid-assets/models/hvdc-interconnector.glb',
    scale: 0.5,
    yaw: 0.2,
    yOffset: 0.16,
    emissiveColor: '#8fa8a0',
    fallbackIcon: 'hvdc'
  },
  'ai-grid-optimizer': {
    key: 'ai-grid-optimizer',
    url: '/grid-assets/models/ai-grid-optimizer.glb',
    scale: 0.52,
    yaw: 0.26,
    yOffset: 0.18,
    emissiveColor: '#2AA9FF',
    fallbackIcon: 'ai'
  }
};

export const GRID_SCENE_MODEL_URLS = Array.from(
  new Set(Object.values(GRID_SCENE_ASSET_REGISTRY).map((descriptor) => descriptor.url))
);

export const resolveSceneAssetDescriptor = (assetId: string): GridSceneAssetDescriptor | null =>
  GRID_SCENE_ASSET_REGISTRY[assetId as GridSceneAssetKey] ?? null;

export const hasSceneAssetDescriptor = (assetId: string) => Boolean(resolveSceneAssetDescriptor(assetId));

export const GRID_SCENE_REQUIRED_ASSET_KEYS = GRID_OPS_ASSETS.map((asset) => asset.id);
