import {
  COOKIE_CONSENT_COOKIE_MAX_AGE,
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_SOURCES,
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_VERSION,
  DEFAULT_COOKIE_CONSENT,
  type CookieCategory,
  type CookieConsentRecord,
  type CookieConsentSource,
  type CookieConsentState
} from '@/lib/cookies/cookie-types';

export const COOKIE_CONSENT_UPDATED_EVENT = 'consent:updated';
export const COOKIE_PREFERENCES_OPEN_EVENT = 'consent:open-preferences';
export const LANDING_INTRO_COMPLETE_EVENT = 'landing:intro-complete';

declare global {
  interface WindowEventMap {
    'consent:updated': CustomEvent<CookieConsentRecord>;
    'consent:open-preferences': Event;
    'landing:intro-complete': Event;
  }
}

const canUseDom = () => typeof window !== 'undefined' && typeof document !== 'undefined';

const parseJson = (rawValue: string): unknown | null => {
  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

const readCookieValue = (cookieName: string) => {
  if (!canUseDom()) {
    return null;
  }

  const prefix = `${cookieName}=`;
  const entry = document.cookie
    .split(';')
    .map((cookiePart) => cookiePart.trim())
    .find((cookiePart) => cookiePart.startsWith(prefix));

  if (!entry) {
    return null;
  }

  const encodedValue = entry.slice(prefix.length);
  try {
    return decodeURIComponent(encodedValue);
  } catch {
    return null;
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const COOKIE_CONSENT_SOURCE_SET = new Set<string>(COOKIE_CONSENT_SOURCES);

const parseConsentSource = (value: unknown): CookieConsentSource | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim();
  if (!COOKIE_CONSENT_SOURCE_SET.has(normalizedValue)) {
    return null;
  }

  return normalizedValue as CookieConsentSource;
};

export const normalizeConsentState = (
  input: Partial<CookieConsentState> | undefined | null
): CookieConsentState => ({
  necessary: true,
  analytics: Boolean(input?.analytics),
  marketing: Boolean(input?.marketing),
  preferences: Boolean(input?.preferences)
});

export const parseConsentRecord = (value: unknown): CookieConsentRecord | null => {
  if (!isObject(value)) {
    return null;
  }

  const rawTimestamp = value.timestamp;
  if (typeof rawTimestamp !== 'string' || Number.isNaN(Date.parse(rawTimestamp))) {
    return null;
  }

  const source = parseConsentSource(value.source);
  if (!source) {
    return null;
  }

  return {
    version:
      typeof value.version === 'number' && Number.isFinite(value.version)
        ? value.version
        : COOKIE_CONSENT_VERSION,
    timestamp: rawTimestamp,
    source,
    consent: normalizeConsentState(
      isObject(value.consent) ? (value.consent as Partial<CookieConsentState>) : undefined
    )
  };
};

const getConsentTimestamp = (record: CookieConsentRecord) => {
  const parsedTimestamp = Date.parse(record.timestamp);
  if (Number.isNaN(parsedTimestamp)) {
    return 0;
  }

  return parsedTimestamp;
};

// Positive value means left is newer/preferred, negative means right wins.
export const compareConsentRecordFreshness = (
  left: CookieConsentRecord,
  right: CookieConsentRecord
) => {
  if (left.version !== right.version) {
    return left.version - right.version;
  }

  return getConsentTimestamp(left) - getConsentTimestamp(right);
};

// A record is current when its version matches (or exceeds) the policy
// version compiled into the app. Bumping COOKIE_CONSENT_VERSION invalidates
// every previously stored decision so users are re-prompted.
export const isCurrentVersionRecord = (record: CookieConsentRecord) =>
  record.version >= COOKIE_CONSENT_VERSION;

export const pickPreferredConsentRecord = (
  ...records: Array<CookieConsentRecord | null | undefined>
) => {
  let preferredRecord: CookieConsentRecord | null = null;

  for (const record of records) {
    if (!record) {
      continue;
    }

    if (!preferredRecord || compareConsentRecordFreshness(record, preferredRecord) > 0) {
      preferredRecord = record;
    }
  }

  return preferredRecord;
};

// `Secure` is rejected by browsers on plain http://localhost; only set it
// when the document is actually served over https so dev still works.
const consentCookieSecureAttr = () =>
  canUseDom() && window.location.protocol === 'https:' ? '; secure' : '';

const writeConsentCookie = (record: CookieConsentRecord) => {
  if (!canUseDom()) {
    return;
  }

  try {
    const encodedRecord = encodeURIComponent(JSON.stringify(record));
    document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${encodedRecord}; path=/; max-age=${COOKIE_CONSENT_COOKIE_MAX_AGE}; samesite=lax${consentCookieSecureAttr()}`;
  } catch {
    // Ignore cookie write failures and continue with local storage.
  }
};

// Wipe both persistence layers — used when we detect a stale record from a
// previous policy version and want to force a fresh prompt.
const clearStoredConsentRecord = () => {
  if (!canUseDom()) {
    return;
  }

  try {
    window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
  } catch {
    // Ignore localStorage failures.
  }

  try {
    document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=; path=/; max-age=0; samesite=lax${consentCookieSecureAttr()}`;
  } catch {
    // Ignore cookie cleanup failures.
  }
};

const readConsentCookieRecord = () => {
  const cookieValue = readCookieValue(COOKIE_CONSENT_COOKIE_NAME);
  if (!cookieValue) {
    return null;
  }

  return parseConsentRecord(parseJson(cookieValue));
};

export const readStoredConsentRecord = () => {
  if (!canUseDom()) {
    return null;
  }

  let localStorageRecord: CookieConsentRecord | null = null;

  try {
    const rawLocalStorageRecord = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (rawLocalStorageRecord) {
      localStorageRecord = parseConsentRecord(parseJson(rawLocalStorageRecord));
    }
  } catch {
    // Ignore localStorage read failures and continue with cookie fallback.
  }

  if (localStorageRecord) {
    if (!isCurrentVersionRecord(localStorageRecord)) {
      // Policy version moved on — discard the old decision so the banner
      // re-prompts. Server sync (in CookieConsentManager) handles re-writing
      // an authoritative record once the user picks again.
      clearStoredConsentRecord();
      return null;
    }
    writeConsentCookie(localStorageRecord);
    return localStorageRecord;
  }

  const cookieRecord = readConsentCookieRecord();
  if (!cookieRecord) {
    return null;
  }

  if (!isCurrentVersionRecord(cookieRecord)) {
    clearStoredConsentRecord();
    return null;
  }

  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(cookieRecord));
  } catch {
    // Ignore storage write failures and continue with cookie-only persistence.
  }

  return cookieRecord;
};

export const writeStoredConsentRecord = (record: CookieConsentRecord) => {
  if (!canUseDom()) {
    return;
  }

  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore localStorage failures and continue with cookie persistence.
  }

  writeConsentCookie(record);
};

export const createConsentRecord = (
  consent: Partial<CookieConsentState>,
  source: CookieConsentSource
): CookieConsentRecord => ({
  version: COOKIE_CONSENT_VERSION,
  timestamp: new Date().toISOString(),
  source,
  consent: normalizeConsentState(consent)
});

export const hasCategoryConsent = (category: CookieCategory) => {
  if (category === 'necessary') {
    return true;
  }

  const record = readStoredConsentRecord();
  if (!record) {
    return false;
  }

  return Boolean(record.consent[category]);
};

export const dispatchConsentUpdated = (record: CookieConsentRecord) => {
  if (!canUseDom()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, {
      detail: record
    })
  );
};

export const openCookiePreferencesDialog = () => {
  if (!canUseDom()) {
    return;
  }

  window.dispatchEvent(new Event(COOKIE_PREFERENCES_OPEN_EVENT));
};

export const buildAcceptAllConsentState = (): CookieConsentState => ({
  necessary: true,
  analytics: true,
  marketing: true,
  preferences: true
});

export const buildRejectAllConsentState = (): CookieConsentState => ({
  ...DEFAULT_COOKIE_CONSENT
});
