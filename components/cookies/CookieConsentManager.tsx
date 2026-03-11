'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { syncConsentRecordWithServer, writeServerConsentRecord } from '@/lib/cookies/cookie-consent-sync';
import { COOKIE_CATEGORY_COPY } from '@/lib/cookies/cookie-config';
import {
  COOKIE_PREFERENCES_OPEN_EVENT,
  LANDING_INTRO_COMPLETE_EVENT,
  buildAcceptAllConsentState,
  buildRejectAllConsentState,
  compareConsentRecordFreshness,
  createConsentRecord,
  dispatchConsentUpdated,
  normalizeConsentState,
  readStoredConsentRecord,
  writeStoredConsentRecord
} from '@/lib/cookies/cookie-consent';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { applyConsentGate } from '@/lib/cookies/consent-gate';
import type { CookieConsentSource, CookieConsentState } from '@/lib/cookies/cookie-types';

const OPTIONAL_CATEGORIES: Array<Exclude<keyof CookieConsentState, 'necessary'>> = [
  'analytics',
  'marketing',
  'preferences'
];
const COOKIE_BANNER_SESSION_KEY = 'stablegrid-cookie-banner-seen-session';

export function CookieConsentManager() {
  const pathname = usePathname();
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const consentRef = useRef<CookieConsentState>(buildRejectAllConsentState());
  const [ready, setReady] = useState(false);
  const [hasSavedDecision, setHasSavedDecision] = useState(false);
  const [draftConsent, setDraftConsent] = useState<CookieConsentState>(buildRejectAllConsentState());
  const [modalOpen, setModalOpen] = useState(false);
  const [landingIntroReady, setLandingIntroReady] = useState(pathname !== '/');
  const [bannerSeenThisSession, setBannerSeenThisSession] = useState(false);

  const openPreferences = useCallback(() => {
    setDraftConsent(consentRef.current);
    setModalOpen(true);
  }, []);

  const commitConsent = useCallback(
    (nextConsent: CookieConsentState, source: CookieConsentSource) => {
      const previousConsent = consentRef.current;
      const normalizedConsent = normalizeConsentState(nextConsent);
      const record = createConsentRecord(normalizedConsent, source);

      writeStoredConsentRecord(record);
      dispatchConsentUpdated(record);

      consentRef.current = record.consent;
      setDraftConsent(record.consent);
      setHasSavedDecision(true);
      setModalOpen(false);
      setBannerSeenThisSession(true);

      try {
        window.sessionStorage.setItem(COOKIE_BANNER_SESSION_KEY, '1');
      } catch {
        // Ignore sessionStorage write failures.
      }

      void applyConsentGate(previousConsent, record.consent, { forceCleanup: true });
      if (currentUserId) {
        void writeServerConsentRecord(record);
      }
    },
    [currentUserId]
  );

  useEffect(() => {
    const storedRecord = readStoredConsentRecord();
    const initialConsent = normalizeConsentState(storedRecord?.consent);

    consentRef.current = initialConsent;
    setDraftConsent(initialConsent);
    setHasSavedDecision(Boolean(storedRecord));
    setReady(true);

    void applyConsentGate(undefined, initialConsent, { forceCleanup: true });

    const handleOpenPreferences = () => {
      openPreferences();
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModalOpen(false);
      }
    };

    window.addEventListener(COOKIE_PREFERENCES_OPEN_EVENT, handleOpenPreferences);
    document.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener(COOKIE_PREFERENCES_OPEN_EVENT, handleOpenPreferences);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [openPreferences]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      setBannerSeenThisSession(window.sessionStorage.getItem(COOKIE_BANNER_SESSION_KEY) === '1');
    } catch {
      setBannerSeenThisSession(false);
    }
  }, []);

  useEffect(() => {
    if (!ready || !currentUserId) {
      return;
    }

    let cancelled = false;

    const syncWithServer = async () => {
      const localRecord = readStoredConsentRecord();
      const syncedRecord = await syncConsentRecordWithServer(localRecord);

      if (cancelled || !syncedRecord) {
        return;
      }

      if (!localRecord || compareConsentRecordFreshness(syncedRecord, localRecord) > 0) {
        const previousConsent = consentRef.current;
        const normalizedConsent = normalizeConsentState(syncedRecord.consent);

        writeStoredConsentRecord(syncedRecord);
        dispatchConsentUpdated(syncedRecord);
        consentRef.current = normalizedConsent;
        setDraftConsent(normalizedConsent);
        setHasSavedDecision(true);

        await applyConsentGate(previousConsent, normalizedConsent, { forceCleanup: true });
      }
    };

    void syncWithServer();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, ready]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (pathname !== '/') {
      setLandingIntroReady(true);
      return;
    }

    setLandingIntroReady(false);
    let pollTimeoutId: number | null = null;
    let hardTimeoutId: number | null = null;
    let lockObserver: MutationObserver | null = null;
    let pollAttempts = 0;

    const resolveIntroGate = () => {
      const gridFlowSection = document.getElementById('grid-flow');
      if (!gridFlowSection) {
        pollAttempts += 1;
        if (pollAttempts >= 20) {
          setLandingIntroReady(true);
          return;
        }
        pollTimeoutId = window.setTimeout(resolveIntroGate, 100);
        return;
      }

      const introLocked = gridFlowSection.getAttribute('data-intro-lock') === 'true';
      setLandingIntroReady(!introLocked);

      if (lockObserver) {
        lockObserver.disconnect();
      }
      lockObserver = new MutationObserver(() => {
        const lockedNow = gridFlowSection.getAttribute('data-intro-lock') === 'true';
        if (!lockedNow) {
          setLandingIntroReady(true);
        }
      });
      lockObserver.observe(gridFlowSection, {
        attributes: true,
        attributeFilter: ['data-intro-lock']
      });
    };

    const handleIntroComplete = () => {
      setLandingIntroReady(true);
    };

    hardTimeoutId = window.setTimeout(() => {
      setLandingIntroReady(true);
    }, 8000);

    window.addEventListener(LANDING_INTRO_COMPLETE_EVENT, handleIntroComplete);
    resolveIntroGate();

    return () => {
      window.removeEventListener(LANDING_INTRO_COMPLETE_EVENT, handleIntroComplete);
      if (pollTimeoutId !== null) {
        window.clearTimeout(pollTimeoutId);
      }
      if (hardTimeoutId !== null) {
        window.clearTimeout(hardTimeoutId);
      }
      lockObserver?.disconnect();
    };
  }, [pathname]);

  const shouldUseLandingSessionPrompt = pathname === '/';
  const bannerVisible = shouldUseLandingSessionPrompt
    ? ready && landingIntroReady && !bannerSeenThisSession
    : ready && !hasSavedDecision;

  return (
    <>
      {bannerVisible ? (
        <section
          aria-label="Cookie consent"
          className="fixed bottom-16 right-4 z-50 w-[min(24.5rem,calc(100vw-1.25rem))] rounded-2xl border border-white/10 bg-[#242528]/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-sm"
        >
          <div className="space-y-3.5">
            <h2 className="sr-only">Cookies</h2>
            <p className="text-[1.03rem] font-medium leading-6 text-white/95">
              We use cookies to collect data and improve our services.{' '}
              <Link
                href="/privacy#cookie-policy"
                className="underline underline-offset-2 transition hover:text-white"
              >
                Learn more
              </Link>
            </p>
            <div className="flex items-center gap-3 whitespace-nowrap">
              <button
                type="button"
                onClick={() => commitConsent(buildAcceptAllConsentState(), 'banner_accept_all')}
                className="inline-flex min-w-[6.8rem] justify-center rounded-xl border border-white/20 bg-transparent px-4 py-2 text-[0.97rem] font-medium text-white transition hover:border-white/30 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => commitConsent(buildRejectAllConsentState(), 'banner_reject_all')}
                aria-label="Reject all"
                className="inline-flex min-w-[4.6rem] justify-center rounded-xl border border-transparent px-1 py-2 text-[0.95rem] font-medium text-white/90 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                Opt out
              </button>
              <button
                type="button"
                onClick={openPreferences}
                className="inline-flex min-w-[8.8rem] justify-center rounded-xl border border-transparent px-1 py-2 text-[0.95rem] font-medium text-white/65 transition hover:text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                Privacy settings
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
          <button
            type="button"
            aria-label="Close cookie preferences"
            onClick={() => setModalOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-preferences-title"
            className="relative z-10 w-[calc(100vw-1rem)] max-w-[38rem] max-h-[82vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#151619] shadow-[0_28px_120px_rgba(0,0,0,0.52)]"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2
                id="cookie-preferences-title"
                className="text-[1.4rem] font-semibold tracking-tight text-white sm:text-[1.5rem]"
              >
                Privacy Settings
              </h2>
              <button
                type="button"
                aria-label="Close cookie preferences"
                onClick={() => setModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-white/45 transition hover:border-white/15 hover:text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="divide-y divide-white/10">
              <div className="grid grid-cols-[auto,minmax(0,1fr)] gap-3 px-4 py-4">
                <div className="flex items-start pt-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked="true"
                    disabled
                    className="relative inline-flex h-8 w-14 items-center rounded-full border border-brand-500/45 bg-brand-700/80 p-1"
                  >
                    <span className="inline-block h-6 w-6 translate-x-6 rounded-full bg-zinc-300 shadow-[0_1px_8px_rgba(0,0,0,0.35)]" />
                    <span className="sr-only">Necessary cookies always active</span>
                  </button>
                </div>
                <div className="min-w-0 space-y-1.5">
                  <p className="text-[1.08rem] font-medium leading-none text-white/92 sm:text-[1.15rem]">
                    {COOKIE_CATEGORY_COPY.necessary.label}
                  </p>
                  <p className="max-w-2xl text-[0.9rem] leading-[1.4] text-white/58 sm:text-[0.95rem]">
                    {COOKIE_CATEGORY_COPY.necessary.description}
                  </p>
                  <Link
                    href="/privacy#cookie-policy"
                    className="inline-block text-[0.9rem] font-medium text-white/62 underline underline-offset-4 transition hover:text-white/85 sm:text-[0.95rem]"
                  >
                    Learn more
                  </Link>
                </div>
              </div>

              {OPTIONAL_CATEGORIES.map((category) => (
                <div key={category} className="grid grid-cols-[auto,minmax(0,1fr)] gap-3 px-4 py-4">
                  <div className="flex items-start pt-1">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={draftConsent[category]}
                      aria-label={`Enable ${COOKIE_CATEGORY_COPY[category].label} cookies`}
                      onClick={() => {
                        setDraftConsent((current) =>
                          normalizeConsentState({
                            ...current,
                            [category]: !current[category]
                          })
                        );
                      }}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full border p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                        draftConsent[category]
                          ? 'border-brand-500/45 bg-brand-700/80'
                          : 'border-white/10 bg-[#2b2c31]'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 rounded-full bg-zinc-200 shadow-[0_1px_8px_rgba(0,0,0,0.35)] transition-transform ${
                          draftConsent[category] ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-[1.08rem] font-medium leading-none text-white/84 sm:text-[1.15rem]">
                      {COOKIE_CATEGORY_COPY[category].label}
                    </p>
                    <p className="max-w-2xl text-[0.9rem] leading-[1.4] text-white/58 sm:text-[0.95rem]">
                      {COOKIE_CATEGORY_COPY[category].description}
                    </p>
                    <Link
                      href="/privacy#cookie-policy"
                      className="inline-block text-[0.9rem] font-medium text-white/62 underline underline-offset-4 transition hover:text-white/85 sm:text-[0.95rem]"
                    >
                      Learn more
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setDraftConsent(buildRejectAllConsentState())}
                  className="text-white/55 transition hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  Reject all
                </button>
                <button
                  type="button"
                  onClick={() => setDraftConsent(buildAcceptAllConsentState())}
                  className="text-white/55 transition hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  Accept all
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-white/12 bg-[#2a2b31] px-4 text-sm font-medium text-white/85 transition hover:bg-[#32343a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => commitConsent(draftConsent, 'preferences_save')}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-brand-500/55 bg-brand-700/85 px-5 text-sm font-medium text-white transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  Confirm
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
