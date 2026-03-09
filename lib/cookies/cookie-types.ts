export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_STORAGE_KEY = 'stablegrid-cookie-consent';
export const COOKIE_CONSENT_COOKIE_NAME = 'stablegrid_cookie_consent';
export const COOKIE_CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

export type CookieCategory = 'necessary' | 'analytics' | 'marketing' | 'preferences';

export interface CookieConsentState {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export const DEFAULT_COOKIE_CONSENT: CookieConsentState = Object.freeze({
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false
});

export const COOKIE_CONSENT_SOURCES = [
  'banner_accept_all',
  'banner_reject_all',
  'preferences_save',
  'preferences_accept_all',
  'preferences_reject_all'
] as const;

export type CookieConsentSource = (typeof COOKIE_CONSENT_SOURCES)[number];

export interface CookieConsentRecord {
  version: number;
  timestamp: string;
  source: CookieConsentSource;
  consent: CookieConsentState;
}
