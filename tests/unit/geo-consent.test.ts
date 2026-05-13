import { describe, expect, it } from 'vitest';
import {
  EU_LIKE_COUNTRY_CODES,
  getGeoRegionFromCountry
} from '@/lib/cookies/geo-consent';
import { computeInitialConsent } from '@/lib/cookies/cookie-consent';
import { COOKIE_CONSENT_VERSION } from '@/lib/cookies/cookie-types';
import type { CookieConsentRecord } from '@/lib/cookies/cookie-types';

describe('getGeoRegionFromCountry', () => {
  it('maps every EU 27 member state to "eu"', () => {
    const eu27 = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
    ];
    for (const code of eu27) {
      expect(getGeoRegionFromCountry(code), code).toBe('eu');
    }
  });

  it('maps EEA non-EU countries to "eu"', () => {
    expect(getGeoRegionFromCountry('NO')).toBe('eu');
    expect(getGeoRegionFromCountry('IS')).toBe('eu');
    expect(getGeoRegionFromCountry('LI')).toBe('eu');
  });

  it('treats UK and Switzerland as EU (UK GDPR / FADP equivalents)', () => {
    expect(getGeoRegionFromCountry('GB')).toBe('eu');
    expect(getGeoRegionFromCountry('CH')).toBe('eu');
  });

  it('maps common non-EU countries to "row"', () => {
    for (const code of ['US', 'CA', 'AU', 'JP', 'BR', 'IN', 'NZ', 'SG', 'MX', 'ZA']) {
      expect(getGeoRegionFromCountry(code), code).toBe('row');
    }
  });

  it('defaults to "eu" for null / undefined / empty (conservative)', () => {
    expect(getGeoRegionFromCountry(null)).toBe('eu');
    expect(getGeoRegionFromCountry(undefined)).toBe('eu');
    expect(getGeoRegionFromCountry('')).toBe('eu');
    expect(getGeoRegionFromCountry('   ')).toBe('eu');
  });

  it('is case insensitive', () => {
    expect(getGeoRegionFromCountry('de')).toBe('eu');
    expect(getGeoRegionFromCountry('us')).toBe('row');
  });

  it('country list covers exactly EU 27 + EEA 3 + UK + CH = 32 entries', () => {
    expect(EU_LIKE_COUNTRY_CODES.size).toBe(32);
  });
});

describe('computeInitialConsent', () => {
  const makeRecord = (analytics: boolean): CookieConsentRecord => ({
    version: COOKIE_CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    source: 'banner_accept_all',
    consent: {
      necessary: true,
      analytics,
      marketing: false,
      preferences: false
    }
  });

  it('stored record always wins regardless of geo', () => {
    expect(computeInitialConsent(makeRecord(true), 'eu').analytics).toBe(true);
    expect(computeInitialConsent(makeRecord(false), 'row').analytics).toBe(false);
  });

  it('no record + EU → analytics false (GDPR opt-in)', () => {
    const consent = computeInitialConsent(null, 'eu');
    expect(consent.analytics).toBe(false);
    expect(consent.marketing).toBe(false);
    expect(consent.preferences).toBe(false);
    expect(consent.necessary).toBe(true);
  });

  it('no record + ROW → analytics true (pre-checked), others still false', () => {
    const consent = computeInitialConsent(null, 'row');
    expect(consent.analytics).toBe(true);
    expect(consent.marketing).toBe(false); // marketing stays opt-in worldwide
    expect(consent.preferences).toBe(false);
    expect(consent.necessary).toBe(true);
  });

  it('no record + null geo → conservative EU defaults', () => {
    expect(computeInitialConsent(null, null).analytics).toBe(false);
    expect(computeInitialConsent(null, undefined).analytics).toBe(false);
  });
});
