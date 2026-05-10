'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  hasCategoryConsent,
} from '@/lib/cookies/cookie-consent';

/**
 * Per-route navigation timing. Logs how long it took between a pathname
 * change and the next paint. This is the "click-to-paint" number that
 * tells us whether Phase 2's prefetch + data-warming work is paying off
 * for real users — synthetic Lighthouse won't show it.
 *
 * Uses requestAnimationFrame after the pathname change to approximate
 * "first frame with new content," which is the closest we can get without
 * a custom transition observer.
 *
 * Consent-gated like WebVitalsReporter.
 */
export function NavigationTimer() {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);
  const navigationStartRef = useRef<number | null>(null);
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
    if (previousPathnameRef.current === null) {
      // First render — there was no prior route to time against.
      previousPathnameRef.current = pathname;
      return;
    }
    if (previousPathnameRef.current === pathname) return;

    const fromPath = previousPathnameRef.current;
    const toPath = pathname;
    previousPathnameRef.current = pathname;

    const start = navigationStartRef.current ?? performance.now();
    navigationStartRef.current = null;

    // After the layout effect commits and React paints, RAF gives us the
    // first frame the user sees with the new route's content.
    const raf = requestAnimationFrame(() => {
      const duration = performance.now() - start;
      const body = JSON.stringify({
        name: 'NAV',
        value: duration,
        id: `${fromPath}->${toPath}`,
        pathname: toPath,
      });
      try {
        if (typeof navigator.sendBeacon === 'function') {
          navigator.sendBeacon('/api/vitals', body);
          return;
        }
      } catch {
        /* fall through */
      }
      void fetch('/api/vitals', {
        method: 'POST',
        body,
        keepalive: true,
        headers: { 'content-type': 'application/json' },
      }).catch(() => {
        /* swallow */
      });
    });

    return () => cancelAnimationFrame(raf);
  }, [pathname, consented]);

  // We can't observe `routeChangeStart` directly in the App Router (it's
  // gone). The next best thing: capture the moment any link is clicked or
  // a popstate fires, treating that as the navigation start. Fires once,
  // global; the timing effect above reads navigationStartRef on commit.
  useEffect(() => {
    if (!consented) return;
    const markStart = () => {
      navigationStartRef.current = performance.now();
    };
    document.addEventListener('click', markStart, { capture: true });
    window.addEventListener('popstate', markStart);
    return () => {
      document.removeEventListener('click', markStart, { capture: true });
      window.removeEventListener('popstate', markStart);
    };
  }, [consented]);

  return null;
}
