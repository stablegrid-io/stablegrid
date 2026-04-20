'use client';

import type { ComponentSlug, PurchaseErrorCode } from '@/types/grid';

export type GridAnalyticsEvent =
  | { type: 'grid_page_viewed'; balanceAtLoad: number; districtsRestored: number }
  | { type: 'grid_briefing_acknowledged' }
  | { type: 'grid_component_deployed'; slug: ComponentSlug; balanceBefore: number; balanceAfter: number }
  | { type: 'grid_purchase_rejected'; slug: ComponentSlug; reason: PurchaseErrorCode }
  | { type: 'grid_restored'; totalKwhSpent: number; durationDays: number };

/**
 * Fire-and-forget POST to /api/grid/events. Backed by product_funnel_events.
 * Never throws — analytics must not break the feature.
 */
export function logGridEvent(event: GridAnalyticsEvent): void {
  try {
    fetch('/api/grid/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true,
    }).catch(() => {
      /* swallow */
    });
  } catch {
    /* swallow */
  }
}
