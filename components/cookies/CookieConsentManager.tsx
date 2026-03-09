'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { syncConsentRecordWithServer, writeServerConsentRecord } from '@/lib/cookies/cookie-consent-sync';
import { COOKIE_CATEGORY_COPY } from '@/lib/cookies/cookie-config';
import {
  COOKIE_PREFERENCES_OPEN_EVENT,
  buildAcceptAllConsentState,
  buildRejectAllConsentState,
  compareConsentRecordFreshness,
  createConsentRecord,
  dispatchConsentUpdated,
  normalizeConsentState,
  openCookiePreferencesDialog,
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

export function CookieConsentManager() {
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const consentRef = useRef<CookieConsentState>(buildRejectAllConsentState());
  const [ready, setReady] = useState(false);
  const [hasSavedDecision, setHasSavedDecision] = useState(false);
  const [draftConsent, setDraftConsent] = useState<CookieConsentState>(buildRejectAllConsentState());
  const [modalOpen, setModalOpen] = useState(false);

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

  const bannerVisible = ready && !hasSavedDecision;

  return (
    <>
      <div className="fixed bottom-20 right-4 z-40 lg:bottom-4">
        <button
          type="button"
          onClick={openCookiePreferencesDialog}
          className="inline-flex items-center rounded-full border border-light-border bg-light-surface px-3 py-1.5 text-xs font-medium text-text-light-secondary shadow-sm transition hover:bg-light-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-secondary dark:hover:bg-dark-bg"
        >
          Cookie settings
        </button>
      </div>

      {bannerVisible ? (
        <section
          aria-label="Cookie consent"
          className="fixed inset-x-4 bottom-20 z-50 rounded-2xl border border-light-border bg-light-surface p-4 shadow-2xl dark:border-dark-border dark:bg-dark-surface lg:bottom-4 lg:left-auto lg:right-4 lg:w-[min(42rem,calc(100vw-2rem))] lg:max-w-none"
        >
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
              Cookies
            </h2>
            <p className="text-sm leading-6 text-text-light-secondary dark:text-text-dark-secondary">
              We use necessary cookies to make this site work. With your permission, we&apos;d
              also like to use analytics, preferences, and marketing cookies. You can accept,
              reject, or choose by category.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => commitConsent(buildAcceptAllConsentState(), 'banner_accept_all')}
                className="inline-flex min-w-[128px] justify-center rounded-lg border border-light-border bg-light-bg px-3 py-2 text-sm font-medium text-text-light-primary transition hover:bg-light-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:hover:bg-dark-surface"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={() => commitConsent(buildRejectAllConsentState(), 'banner_reject_all')}
                className="inline-flex min-w-[128px] justify-center rounded-lg border border-light-border bg-light-bg px-3 py-2 text-sm font-medium text-text-light-primary transition hover:bg-light-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:hover:bg-dark-surface"
              >
                Reject all
              </button>
              <button
                type="button"
                onClick={openPreferences}
                className="inline-flex min-w-[160px] justify-center rounded-lg border border-brand-500/45 bg-brand-500/10 px-3 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-200"
              >
                Manage preferences
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            aria-label="Close cookie preferences"
            onClick={() => setModalOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-preferences-title"
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-light-border/90 bg-light-surface p-5 shadow-[0_30px_90px_rgba(0,0,0,0.36)] animate-slide-up sm:p-6 dark:border-white/10 dark:bg-[linear-gradient(165deg,#111417,#0b0d10_58%,#090b0d)]"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_top,rgba(34,185,153,0.24),transparent_72%)]"
            />

            <div className="relative space-y-5">
              <header className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700/80 dark:text-brand-200/80">
                  Privacy controls
                </p>
                <h2
                  id="cookie-preferences-title"
                  className="text-3xl font-semibold leading-tight tracking-tight text-text-light-primary dark:text-text-dark-primary"
                >
                  Cookie preferences
                </h2>
                <p className="max-w-[56ch] text-sm leading-6 text-text-light-secondary dark:text-text-dark-secondary">
                  Choose which optional cookies can run. Necessary cookies always stay on.
                </p>
              </header>

              <div className="space-y-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-light-border/95 bg-light-bg px-4 py-3.5 shadow-sm dark:border-white/10 dark:bg-black/45">
                  <div className="min-w-0">
                    <p className="text-base font-semibold leading-6 text-text-light-primary dark:text-text-dark-primary">
                      {COOKIE_CATEGORY_COPY.necessary.label}
                    </p>
                    <p className="mt-0.5 text-sm leading-5 text-text-light-secondary dark:text-text-dark-secondary">
                      {COOKIE_CATEGORY_COPY.necessary.description}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-brand-500/40 bg-brand-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700 dark:text-brand-200">
                    Always active
                  </span>
                </div>

                {OPTIONAL_CATEGORIES.map((category) => (
                  <label
                    key={category}
                    className="group grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-light-border/95 bg-light-bg px-4 py-3.5 shadow-sm transition hover:-translate-y-px hover:border-brand-500/45 hover:bg-light-surface dark:border-white/10 dark:bg-black/45 dark:hover:border-brand-400/55 dark:hover:bg-black/65"
                  >
                    <div className="min-w-0">
                      <p className="text-base font-semibold leading-6 text-text-light-primary dark:text-text-dark-primary">
                        {COOKIE_CATEGORY_COPY[category].label}
                      </p>
                      <p className="mt-0.5 text-sm leading-5 text-text-light-secondary dark:text-text-dark-secondary">
                        {COOKIE_CATEGORY_COPY[category].description}
                      </p>
                    </div>
                    <span className="relative flex h-10 w-10 items-center justify-center">
                      <input
                        type="checkbox"
                        aria-label={`Enable ${COOKIE_CATEGORY_COPY[category].label} cookies`}
                        className="peer absolute inset-0 cursor-pointer opacity-0"
                        checked={draftConsent[category]}
                        onChange={(event) => {
                          setDraftConsent((current) =>
                            normalizeConsentState({
                              ...current,
                              [category]: event.target.checked
                            })
                          );
                        }}
                      />
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-light-border bg-white/90 shadow-sm transition peer-checked:border-brand-500 peer-checked:bg-gradient-to-b peer-checked:from-brand-500 peer-checked:to-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-light-surface dark:border-white/35 dark:bg-white/5 dark:peer-checked:border-brand-500 dark:peer-focus-visible:ring-offset-[#0f1114]"
                      >
                        <Check className="h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <div>
                <Link
                  href="/privacy#cookie-policy"
                  className="text-sm font-semibold text-brand-700 underline-offset-4 transition hover:underline dark:text-brand-200"
                >
                  Cookie Policy / Privacy Policy
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => commitConsent(draftConsent, 'preferences_save')}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-500/55 bg-gradient-to-b from-brand-500/20 to-brand-500/8 px-4 text-sm font-semibold tracking-wide text-brand-700 transition hover:from-brand-500/30 hover:to-brand-500/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-200"
                >
                  Save choices
                </button>
                <button
                  type="button"
                  onClick={() => commitConsent(buildRejectAllConsentState(), 'preferences_reject_all')}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-light-border bg-light-bg px-4 text-sm font-semibold tracking-wide text-text-light-primary transition hover:bg-light-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/15 dark:bg-black/35 dark:text-text-dark-primary dark:hover:bg-black/55"
                >
                  Reject all
                </button>
                <button
                  type="button"
                  onClick={() => commitConsent(buildAcceptAllConsentState(), 'preferences_accept_all')}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-light-border bg-light-bg px-4 text-sm font-semibold tracking-wide text-text-light-primary transition hover:bg-light-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/15 dark:bg-black/35 dark:text-text-dark-primary dark:hover:bg-black/55"
                >
                  Accept all
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
