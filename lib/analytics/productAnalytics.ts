import type { ProductEventName } from '@/lib/analytics/productEvents';
import { hasCategoryConsent } from '@/lib/cookies/cookie-consent';

const PRODUCT_SESSION_STORAGE_KEY = 'stablegrid-product-session-id';
const PRODUCT_ONCE_STORAGE_PREFIX = 'stablegrid-product-event-once:';
const PRODUCT_SESSION_COOKIE_NAME = 'stablegrid_product_session_id';
const PRODUCT_SESSION_MAX_AGE = 60 * 60 * 24 * 365;

type EventMetadata = Record<string, unknown>;

const canUseWindow = () => typeof window !== 'undefined';
const hasAnalyticsConsent = () => hasCategoryConsent('analytics');

const persistSessionId = (sessionId: string) => {
  if (!canUseWindow() || !hasAnalyticsConsent()) {
    return;
  }

  try {
    window.localStorage.setItem(PRODUCT_SESSION_STORAGE_KEY, sessionId);
  } catch {
    // Ignore storage failures in private browsing or restricted contexts.
  }

  try {
    document.cookie = `${PRODUCT_SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; path=/; max-age=${PRODUCT_SESSION_MAX_AGE}; samesite=lax`;
  } catch {
    // Ignore cookie write failures and continue with in-memory usage.
  }
};

export const getOrCreateProductSessionId = () => {
  if (!canUseWindow() || !hasAnalyticsConsent()) {
    return '';
  }

  try {
    const existingSessionId = window.localStorage.getItem(PRODUCT_SESSION_STORAGE_KEY);
    if (existingSessionId && existingSessionId.trim().length > 0) {
      persistSessionId(existingSessionId);
      return existingSessionId;
    }
  } catch {
    // Ignore read failures and generate a new id below.
  }

  const nextSessionId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `sg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  persistSessionId(nextSessionId);
  return nextSessionId;
};

export const clearProductAnalyticsData = () => {
  if (!canUseWindow()) {
    return;
  }

  try {
    window.localStorage.removeItem(PRODUCT_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }

  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key && key.startsWith(PRODUCT_ONCE_STORAGE_PREFIX)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage cleanup failures.
  }

  try {
    document.cookie = `${PRODUCT_SESSION_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
  } catch {
    // Ignore cookie cleanup failures.
  }
};

export const primeProductAnalyticsSession = () => getOrCreateProductSessionId();

const hasTrackedOnce = (onceKey: string) => {
  if (!canUseWindow()) {
    return false;
  }

  try {
    return window.localStorage.getItem(`${PRODUCT_ONCE_STORAGE_PREFIX}${onceKey}`) === '1';
  } catch {
    return false;
  }
};

const markTrackedOnce = (onceKey: string) => {
  if (!canUseWindow()) {
    return;
  }

  try {
    window.localStorage.setItem(`${PRODUCT_ONCE_STORAGE_PREFIX}${onceKey}`, '1');
  } catch {
    // Ignore storage failures and keep analytics best-effort.
  }
};

export const trackProductEvent = async (
  eventName: ProductEventName,
  metadata: EventMetadata = {},
  options: {
    path?: string;
  } = {}
) => {
  if (!canUseWindow() || !hasAnalyticsConsent()) {
    return;
  }

  const sessionId = getOrCreateProductSessionId();
  const path = options.path ?? window.location.pathname;

  try {
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventName,
        sessionId,
        path,
        metadata
      }),
      keepalive: true
    });
  } catch {
    // Ignore analytics transport failures. Product interactions must continue.
  }
};

export const trackProductEventOnce = async (
  eventName: ProductEventName,
  onceKey: string,
  metadata: EventMetadata = {},
  options: {
    path?: string;
  } = {}
) => {
  if (!hasAnalyticsConsent()) {
    return;
  }

  if (hasTrackedOnce(onceKey)) {
    return;
  }

  markTrackedOnce(onceKey);
  await trackProductEvent(eventName, metadata, options);
};
