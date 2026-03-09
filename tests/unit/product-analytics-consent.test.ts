import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearProductAnalyticsData,
  getOrCreateProductSessionId,
  trackProductEvent
} from '@/lib/analytics/productAnalytics';
import {
  buildAcceptAllConsentState,
  createConsentRecord,
  writeStoredConsentRecord
} from '@/lib/cookies/cookie-consent';

const expireCookie = (name: string) => {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
};

describe('product analytics consent gate', () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearProductAnalyticsData();
    expireCookie('stablegrid_cookie_consent');
    expireCookie('stablegrid_product_session_id');
  });

  it('does not initialize analytics session before consent', () => {
    expect(getOrCreateProductSessionId()).toBe('');
    expect(document.cookie.includes('stablegrid_product_session_id=')).toBe(false);
  });

  it('initializes analytics session after opt-in', () => {
    writeStoredConsentRecord(
      createConsentRecord(buildAcceptAllConsentState(), 'preferences_accept_all')
    );

    const sessionId = getOrCreateProductSessionId();
    expect(sessionId).not.toBe('');
    expect(document.cookie.includes('stablegrid_product_session_id=')).toBe(true);
  });

  it('does not send analytics events without analytics consent', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true } as Response);

    await trackProductEvent('landing_cta', { source: 'unit-test' });

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
