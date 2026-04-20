import type { ComponentCategory } from '@/types/grid';

/**
 * Per-category SVG markup, 32×32 viewBox. Stroke uses `currentColor`; the
 * inner `.grid3d-shape-fill` polygon is hidden by default and opacity-1 when
 * the parent container has `is-deployed` (marker) or via the legend override.
 */
export function categoryShapeMarkup(category: ComponentCategory): string {
  switch (category) {
    case 'backbone':
      return `
        <svg class="grid3d-shape" viewBox="0 0 32 32" aria-hidden="true">
          <polygon points="8,4 24,4 30,16 24,28 8,28 2,16"
            fill="rgba(12,14,16,0.82)" stroke="currentColor" stroke-width="1.8"
            stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
          <polygon class="grid3d-shape-fill" points="10,7 22,7 27,16 22,25 10,25 5,16"
            fill="currentColor"/>
        </svg>`;
    case 'protection':
      return `
        <svg class="grid3d-shape" viewBox="0 0 32 32" aria-hidden="true">
          <polygon points="16,2 30,16 16,30 2,16"
            fill="rgba(12,14,16,0.82)" stroke="currentColor" stroke-width="1.8"
            stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
          <polygon class="grid3d-shape-fill" points="16,6 26,16 16,26 6,16" fill="currentColor"/>
        </svg>`;
    case 'storage':
      return `
        <svg class="grid3d-shape" viewBox="0 0 32 32" aria-hidden="true">
          <rect x="3" y="9" width="24" height="14" rx="3.5"
            fill="rgba(12,14,16,0.82)" stroke="currentColor" stroke-width="1.8"
            vector-effect="non-scaling-stroke"/>
          <rect x="27" y="13" width="2.5" height="6" fill="currentColor"/>
          <rect class="grid3d-shape-fill" x="6" y="12" width="18" height="8" rx="2" fill="currentColor"/>
        </svg>`;
    case 'balancing':
      return `
        <svg class="grid3d-shape" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="13" fill="rgba(12,14,16,0.82)"
            stroke="currentColor" stroke-width="1.8" vector-effect="non-scaling-stroke"/>
          <circle class="grid3d-shape-fill" cx="16" cy="16" r="9" fill="currentColor"/>
        </svg>`;
    case 'generation':
      return `
        <svg class="grid3d-shape" viewBox="0 0 32 32" aria-hidden="true">
          <polygon points="16,3 30,28 2,28"
            fill="rgba(12,14,16,0.82)" stroke="currentColor" stroke-width="1.8"
            stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
          <polygon class="grid3d-shape-fill" points="16,8 26,25 6,25" fill="currentColor"/>
        </svg>`;
    case 'command':
      return `
        <svg class="grid3d-shape" viewBox="0 0 32 32" aria-hidden="true">
          <polygon points="10,2 22,2 30,10 30,22 22,30 10,30 2,22 2,10"
            fill="rgba(12,14,16,0.88)" stroke="currentColor" stroke-width="1.8"
            stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
          <circle class="grid3d-shape-fill" cx="16" cy="16" r="4.5" fill="currentColor"/>
          <path d="M16 7.5 V12 M16 20 V24.5 M7.5 16 H12 M20 16 H24.5"
            stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
            vector-effect="non-scaling-stroke"/>
        </svg>`;
  }
}

export const CATEGORY_LABEL: Record<ComponentCategory, string> = {
  backbone: 'Backbone',
  protection: 'Protection',
  storage: 'Storage',
  balancing: 'Balancing',
  generation: 'Generation',
  command: 'Command',
};

export const CATEGORY_ORDER: readonly ComponentCategory[] = [
  'backbone',
  'protection',
  'storage',
  'balancing',
  'generation',
  'command',
];
