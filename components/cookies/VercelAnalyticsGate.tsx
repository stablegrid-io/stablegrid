'use client';

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/next';
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  hasCategoryConsent,
} from '@/lib/cookies/cookie-consent';

/**
 * Mounts <Analytics /> only when the visitor has granted analytics consent.
 * Listens for the global `consent:updated` event so opt-in / opt-out at runtime
 * (banner, preferences modal, server-sync) toggles tracking without a refresh.
 */
export function VercelAnalyticsGate() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const update = () => setConsented(hasCategoryConsent('analytics'));
    update();
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, update);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, update);
    };
  }, []);

  if (!consented) return null;
  return <Analytics />;
}
