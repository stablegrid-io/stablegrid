'use client';

import { useEffect, useState } from 'react';
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  hasCategoryConsent,
} from '@/lib/cookies/cookie-consent';

/**
 * Reports Core Web Vitals (CLS, LCP, INP, TTFB, FCP) to /api/vitals.
 *
 * Mirrors the consent pattern used by VercelAnalyticsGate — registration
 * only happens after the visitor grants analytics consent, and toggles off
 * at runtime when consent is withdrawn (the listener is removed; readings
 * already in flight will still post but no new ones are scheduled).
 *
 * Uses navigator.sendBeacon when available so reports survive page hide /
 * tab close, falling back to fetch with keepalive otherwise.
 */
export function WebVitalsReporter() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const update = () => setConsented(hasCategoryConsent('analytics'));
    update();
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, update);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, update);
    };
  }, []);

  useEffect(() => {
    if (!consented) return;
    let cancelled = false;

    // web-vitals dispatches typed Metric objects (CLSMetric, LCPMetric, …).
    // We only need a tiny subset for the wire payload, so accept the union
    // shape rather than a generic Record (which TS won't widen Metric to).
    interface VitalShape {
      name: string;
      value: number;
      id?: string;
      rating?: 'good' | 'needs-improvement' | 'poor';
      navigationType?: string;
    }

    const send = (metric: VitalShape) => {
      if (cancelled) return;
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        rating: metric.rating,
        navigationType: metric.navigationType,
        pathname: window.location.pathname,
      });
      const url = '/api/vitals';
      try {
        if (typeof navigator.sendBeacon === 'function') {
          // sendBeacon prefers text/plain or Blob; JSON-as-text works fine
          // and avoids a CORS preflight.
          navigator.sendBeacon(url, body);
          return;
        }
      } catch {
        // Some browsers throw if the body is too large or the page is
        // navigating away — fall through to fetch.
      }
      void fetch(url, {
        method: 'POST',
        body,
        keepalive: true,
        headers: { 'content-type': 'application/json' },
      }).catch(() => {
        /* swallow — perf reporting is best-effort */
      });
    };

    // Dynamic import keeps web-vitals out of the synchronous bundle for
    // visitors who haven't consented (or are still pre-consent).
    void import('web-vitals').then(({ onCLS, onLCP, onINP, onTTFB, onFCP }) => {
      if (cancelled) return;
      onCLS(send);
      onLCP(send);
      onINP(send);
      onTTFB(send);
      onFCP(send);
    });

    return () => {
      cancelled = true;
    };
  }, [consented]);

  return null;
}
