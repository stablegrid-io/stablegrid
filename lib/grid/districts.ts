import type { ComponentCategory, ComponentSlug, DistrictSlug } from '@/types/grid';

export interface DistrictGeo {
  slug: ComponentSlug;
  district: DistrictSlug;
  name: string;
  label: string;
  category: ComponentCategory;
  /** [lon, lat] — real Lithuanian towns matched to the briefing's invented names. */
  lonLat: [number, number];
}

export const DISTRICTS: readonly DistrictGeo[] = [
  { slug: 'primary-substation',   district: 'vejupis',    name: 'Vėjupis',    label: 'VĖJUPIS',    category: 'backbone',   lonLat: [21.135, 55.711] }, // Klaipėda
  { slug: 'power-transformer',    district: 'saulelydis', name: 'Saulėlydis', label: 'SAULĖLYDIS', category: 'backbone',   lonLat: [21.063, 55.918] }, // Palanga
  { slug: 'protective-relay',     district: 'gintaras',   name: 'Gintaras',   label: 'GINTARAS',   category: 'protection', lonLat: [22.339, 56.312] }, // Mažeikiai
  { slug: 'circuit-breaker-bank', district: 'ruta',       name: 'Rūta',       label: 'RŪTA',       category: 'protection', lonLat: [23.316, 55.930] }, // Šiauliai
  { slug: 'battery-storage-unit', district: 'akmene',     name: 'Akmenė',     label: 'AKMENĖ',     category: 'storage',    lonLat: [22.741, 56.249] }, // Akmenė
  { slug: 'capacitor-bank',       district: 'azuolas',    name: 'Ąžuolas',    label: 'ĄŽUOLAS',    category: 'balancing',  lonLat: [24.357, 55.729] }, // Panevėžys
  { slug: 'solar-array',          district: 'baltija',    name: 'Baltija',    label: 'BALTIJA',    category: 'generation', lonLat: [23.908, 54.897] }, // Kaunas
  { slug: 'wind-turbine-cluster', district: 'zaibas',     name: 'Žaibas',     label: 'ŽAIBAS',     category: 'generation', lonLat: [24.045, 54.396] }, // Alytus
  { slug: 'smart-inverter',       district: 'perkunas',   name: 'Perkūnas',   label: 'PERKŪNAS',   category: 'balancing',  lonLat: [25.591, 55.498] }, // Utena
  { slug: 'control-center',       district: 'ausrine',    name: 'Aušrinė',    label: 'AUŠRINĖ',    category: 'command',    lonLat: [25.287, 54.687] }, // Vilnius
];

export const DISTRICT_BY_SLUG: Readonly<Record<ComponentSlug, DistrictGeo>> = Object.freeze(
  Object.fromEntries(DISTRICTS.map((d) => [d.slug, d])) as Record<ComponentSlug, DistrictGeo>,
);

export const CONNECTIONS: readonly [ComponentSlug, ComponentSlug][] = [
  ['primary-substation', 'power-transformer'],
  ['power-transformer', 'protective-relay'],
  ['protective-relay', 'circuit-breaker-bank'],
  ['circuit-breaker-bank', 'control-center'],
  ['control-center', 'battery-storage-unit'],
  ['battery-storage-unit', 'capacitor-bank'],
  ['control-center', 'solar-array'],
  ['solar-array', 'wind-turbine-cluster'],
  ['wind-turbine-cluster', 'smart-inverter'],
  ['smart-inverter', 'control-center'],
  ['primary-substation', 'control-center'],
];

/** Roughly Lithuania's bounding box, tuned to include all 10 markers with breathing room. */
export const LT_BOUNDS: [[number, number], [number, number]] = [
  [20.6, 54.0],
  [26.0, 56.6],
];

export const LT_CENTER: [number, number] = [23.9, 55.3];
