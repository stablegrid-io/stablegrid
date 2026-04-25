import type { ComponentSlug, QuestView } from '@/types/grid';

export function computeQuestView(itemsOwned: readonly ComponentSlug[]): QuestView {
  const n = itemsOwned.length;
  const flavorNudge = computeFlavorNudge(itemsOwned);

  if (n === 0) {
    return {
      stateId: 'briefing',
      header: 'QUEST // GRID BLACKOUT',
      body: 'Cascading failure at 02:47. Ten districts offline. Reserve capacity available. One schematic.',
      objective: 'Energize the backbone. Start with a Primary Substation — nothing downstream comes online without it.',
      flavorNudge,
    };
  }
  if (n === 1) {
    return {
      stateId: 'first-light',
      header: 'QUEST // FIRST LIGHT',
      body: '1 of 10 districts restored. Transmission path initialized.',
      objective: 'Extend the spine. A second backbone component before protection and load.',
      flavorNudge,
    };
  }
  if (n <= 3) {
    return {
      stateId: 'backbone-energizing',
      header: 'QUEST // BACKBONE ENERGIZING',
      body: `${n} of 10 districts restored. Transmission path holding.`,
      objective: 'Harden the grid. Protective relays isolate faults before they cascade.',
      flavorNudge,
    };
  }
  if (n <= 6) {
    return {
      stateId: 'load-balancing',
      header: 'QUEST // LOAD BALANCING',
      body: `${n} of 10 districts restored. Frequency within tolerance.`,
      objective: 'Add storage and reactive support. The grid needs buffers before peak load returns.',
      flavorNudge,
    };
  }
  if (n <= 9) {
    return {
      stateId: 'renewables-online',
      header: 'QUEST // RENEWABLES ONLINE',
      body: `${n} of 10 districts restored. Grid holding 50 Hz. Distributed generation reconnecting.`,
      objective: "Close the loop. A Control Center coordinates what you've built.",
      flavorNudge,
    };
  }
  return {
    stateId: 'restored',
    header: 'QUEST // GRID RESTORED',
    body: 'All ten districts online. Cascade conditions cleared. Saulégrid stable.',
    objective: null,
    flavorNudge,
  };
}

function computeFlavorNudge(items: readonly ComponentSlug[]): string | null {
  const has = (slug: ComponentSlug) => items.includes(slug);
  const n = items.length;

  if (has('control-center') && n - 1 < 3) {
    return 'Dispatch online with nothing to dispatch. Bold move.';
  }
  const bothGeneration = has('solar-array') && has('wind-turbine-cluster');
  const anyProtection = has('protective-relay') || has('circuit-breaker-bank');
  if (bothGeneration && !anyProtection) {
    return 'Generation without protection. Hope the weather holds.';
  }
  if (n >= 5 && !has('battery-storage-unit')) {
    return 'Frequency will hold — until the sun sets. Consider storage.';
  }
  return null;
}
