import { COOKIE_SERVICE_REGISTRY } from '@/lib/cookies/cookie-config';
import { normalizeConsentState } from '@/lib/cookies/cookie-consent';
import type { CookieConsentState } from '@/lib/cookies/cookie-types';

const loadedOptionalServiceIds = new Set<string>();

interface ApplyConsentGateOptions {
  forceCleanup?: boolean;
}

const runLoader = async (serviceId: string, load: () => void | Promise<void>) => {
  try {
    await Promise.resolve(load());
    loadedOptionalServiceIds.add(serviceId);
  } catch (error) {
    console.warn(`[cookie-consent] Failed to load service "${serviceId}".`, error);
  }
};

const runCleanup = async (serviceId: string, cleanup: () => void | Promise<void>) => {
  try {
    await Promise.resolve(cleanup());
  } catch (error) {
    console.warn(`[cookie-consent] Failed to clean up service "${serviceId}".`, error);
  } finally {
    loadedOptionalServiceIds.delete(serviceId);
  }
};

export const applyConsentGate = async (
  previousConsent: CookieConsentState | null | undefined,
  nextConsent: CookieConsentState,
  options: ApplyConsentGateOptions = {}
) => {
  const forceCleanup = options.forceCleanup ?? false;
  const normalizedNextConsent = normalizeConsentState(nextConsent);
  const normalizedPreviousConsent = previousConsent
    ? normalizeConsentState(previousConsent)
    : null;

  for (const service of COOKIE_SERVICE_REGISTRY) {
    if (!service.requiresConsent) {
      continue;
    }

    const currentlyAllowed = Boolean(normalizedNextConsent[service.category]);
    const previouslyAllowed = normalizedPreviousConsent
      ? Boolean(normalizedPreviousConsent[service.category])
      : false;
    const wasLoaded = loadedOptionalServiceIds.has(service.id);

    if (currentlyAllowed && (!previouslyAllowed || !wasLoaded)) {
      // Keep all optional loaders behind this gate so nothing runs before consent.
      await runLoader(service.id, service.loader);
      continue;
    }

    if (!currentlyAllowed && service.cleanup && (wasLoaded || previouslyAllowed || forceCleanup)) {
      await runCleanup(service.id, service.cleanup);
    }
  }
};
