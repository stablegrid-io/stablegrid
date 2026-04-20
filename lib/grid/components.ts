import type { GridComponent } from '@/types/grid';

export const GRID_COMPONENTS: readonly GridComponent[] = [
  { slug: 'primary-substation',   name: 'Primary Substation',   category: 'backbone',   costKwh: 250,  flavor: 'Steps transmission voltage down for district distribution.', restoresDistrict: 'vejupis',    districtName: 'Vėjupis',    gate: null,                    displayOrder: 1 },
  { slug: 'power-transformer',    name: 'Power Transformer',    category: 'backbone',   costKwh: 375,  flavor: 'Matches line voltage to local load requirements.',           restoresDistrict: 'saulelydis', districtName: 'Saulėlydis', gate: null,                    displayOrder: 2 },
  { slug: 'protective-relay',     name: 'Protective Relay',     category: 'protection', costKwh: 800,  flavor: 'Trips faulted lines before damage cascades.',                restoresDistrict: 'gintaras',   districtName: 'Gintaras',   gate: null,                    displayOrder: 3 },
  { slug: 'circuit-breaker-bank', name: 'Circuit Breaker Bank', category: 'protection', costKwh: 900,  flavor: 'Isolates faults at millisecond resolution.',                 restoresDistrict: 'ruta',       districtName: 'Rūta',       gate: null,                    displayOrder: 4 },
  { slug: 'battery-storage-unit', name: 'Battery Storage Unit', category: 'storage',    costKwh: 1100, flavor: 'Absorbs surplus, discharges on demand.',                     restoresDistrict: 'akmene',     districtName: 'Akmenė',     gate: null,                    displayOrder: 5 },
  { slug: 'capacitor-bank',       name: 'Capacitor Bank',       category: 'balancing',  costKwh: 1300, flavor: 'Supplies reactive power. Stabilizes voltage on long runs.',  restoresDistrict: 'azuolas',    districtName: 'Ąžuolas',    gate: null,                    displayOrder: 6 },
  { slug: 'solar-array',          name: 'Solar Array',          category: 'generation', costKwh: 1600, flavor: 'Distributed PV feeding directly into local distribution.',   restoresDistrict: 'baltija',    districtName: 'Baltija',    gate: 'any-module-complete',   displayOrder: 7 },
  { slug: 'wind-turbine-cluster', name: 'Wind Turbine Cluster', category: 'generation', costKwh: 1900, flavor: 'High-capacity generation for the northern corridor.',        restoresDistrict: 'zaibas',     districtName: 'Žaibas',     gate: 'any-module-complete',   displayOrder: 8 },
  { slug: 'smart-inverter',       name: 'Smart Inverter',       category: 'balancing',  costKwh: 2250, flavor: 'Grid-forming inverter. Holds frequency when spinning mass is low.', restoresDistrict: 'perkunas', districtName: 'Perkūnas', gate: null,                  displayOrder: 9 },
  { slug: 'control-center',       name: 'Control Center',       category: 'command',    costKwh: 3000, flavor: 'SCADA dispatch. Coordinates every component on the map.',    restoresDistrict: 'ausrine',    districtName: 'Aušrinė',    gate: null,                    displayOrder: 10 },
] as const;

export const GRID_COMPONENTS_BY_SLUG: Readonly<Record<string, GridComponent>> = Object.freeze(
  Object.fromEntries(GRID_COMPONENTS.map((c) => [c.slug, c])),
);

export const TOTAL_GRID_COST_KWH = GRID_COMPONENTS.reduce((s, c) => s + c.costKwh, 0);
