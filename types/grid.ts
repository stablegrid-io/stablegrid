export type ComponentCategory =
  | 'backbone'
  | 'protection'
  | 'storage'
  | 'balancing'
  | 'generation'
  | 'command';

export type ComponentSlug =
  | 'primary-substation'
  | 'power-transformer'
  | 'protective-relay'
  | 'circuit-breaker-bank'
  | 'battery-storage-unit'
  | 'capacitor-bank'
  | 'solar-array'
  | 'wind-turbine-cluster'
  | 'smart-inverter'
  | 'control-center';

export type DistrictSlug =
  | 'vejupis'
  | 'saulelydis'
  | 'gintaras'
  | 'ruta'
  | 'akmene'
  | 'azuolas'
  | 'baltija'
  | 'zaibas'
  | 'perkunas'
  | 'ausrine';

export type CurriculumGate = 'any-module-complete' | null;

export interface GridComponent {
  slug: ComponentSlug;
  name: string;
  category: ComponentCategory;
  costKwh: number;
  flavor: string;
  restoresDistrict: DistrictSlug;
  districtName: string;
  gate: CurriculumGate;
  displayOrder: number;
}

export interface UserGridState {
  userId: string;
  itemsOwned: ComponentSlug[];
  districtsRestored: number;
  briefingSeen: boolean;
  firstDeployAt: string | null;
  lastDeployAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShopItemView {
  component: GridComponent;
  affordable: boolean;
  owned: boolean;
  locked: boolean;
  lockReason: string | null;
}

export type QuestStateId =
  | 'briefing'
  | 'first-light'
  | 'backbone-energizing'
  | 'load-balancing'
  | 'renewables-online'
  | 'restored';

export interface QuestView {
  stateId: QuestStateId;
  header: string;
  body: string;
  objective: string | null;
  flavorNudge: string | null;
}

export interface GridStateResponse {
  balance: number;
  state: UserGridState;
  shop: ShopItemView[];
  quest: QuestView;
}

export type PurchaseErrorCode =
  | 'INSUFFICIENT_FUNDS'
  | 'ALREADY_OWNED'
  | 'GATE_NOT_MET'
  | 'UNKNOWN_COMPONENT'
  | 'UNAUTHENTICATED'
  | 'INTERNAL';

export interface PurchaseSuccess {
  ok: true;
  newBalance: number;
  state: UserGridState;
  quest: QuestView;
  deployedSlug: ComponentSlug;
}

export interface PurchaseFailure {
  ok: false;
  error: PurchaseErrorCode;
  message: string;
}

export type PurchaseResponse = PurchaseSuccess | PurchaseFailure;
