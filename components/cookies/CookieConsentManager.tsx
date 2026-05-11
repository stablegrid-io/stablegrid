'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Cookie, X } from 'lucide-react';
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

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CookieConsentManager() {
  const pathname = usePathname();
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const consentRef = useRef<CookieConsentState>(buildRejectAllConsentState());
  const dialogRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [hasSavedDecision, setHasSavedDecision] = useState(false);
  const [draftConsent, setDraftConsent] = useState<CookieConsentState>(buildRejectAllConsentState());
  const [modalOpen, setModalOpen] = useState(false);
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

  // Focus management for modal: save prior focus on open, trap focus inside,
  // restore focus to the opener on close.
  useEffect(() => {
    if (!modalOpen) {
      const previouslyFocused = previousFocusRef.current;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
      previousFocusRef.current = null;
      return;
    }

    previousFocusRef.current = (document.activeElement as HTMLElement | null) ?? null;

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const getFocusable = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1
      );

    const focusable = getFocusable();
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      dialog.focus();
    }

    const handleTrapKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }
      const items = getFocusable();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTrapKeydown);
    return () => {
      document.removeEventListener('keydown', handleTrapKeydown);
    };
  }, [modalOpen]);

  const shouldUseLandingSessionPrompt = pathname === '/';
  const bannerVisible = shouldUseLandingSessionPrompt
    ? ready && !bannerSeenThisSession
    : ready && !hasSavedDecision;

  return (
    <>
      {/* ── Cookie Banner ── */}
      {bannerVisible ? (
        <section
          aria-label="Cookie consent"
          className="fixed bottom-5 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] sm:bottom-6 sm:right-5 bg-surface border border-on-surface"
        >
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-on-surface bg-surface-container-low">
                <Cookie className="h-4 w-4 text-primary" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant mb-1">
                  Privacy on stablegrid
                </h2>
                <p className="font-body text-[13px] leading-relaxed text-on-surface-variant">
                  We use cookies for essential functionality and to improve your experience.{' '}
                  <Link
                    href="/privacy#cookie-policy"
                    className="text-on-surface underline underline-offset-2 transition-colors hover:text-primary"
                  >
                    Privacy policy
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => commitConsent(buildAcceptAllConsentState(), 'banner_accept_all')}
                className="flex-1 font-data-mono uppercase text-[11px] tracking-wider px-4 py-2.5 border border-on-surface text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={() => commitConsent(buildRejectAllConsentState(), 'banner_reject_all')}
                className="flex-1 font-data-mono uppercase text-[11px] tracking-wider px-4 py-2.5 border border-on-surface text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Reject all
              </button>
              <button
                type="button"
                onClick={openPreferences}
                className="font-data-mono uppercase text-[11px] tracking-wider px-3 py-2.5 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Manage
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Privacy Settings Modal ── */}
      {modalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
          <button
            type="button"
            aria-label="Close cookie preferences"
            onClick={() => setModalOpen(false)}
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
          />

          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-preferences-title"
            tabIndex={-1}
            className="relative z-10 w-[calc(100vw-1.5rem)] max-w-[34rem] max-h-[85vh] overflow-y-auto border border-on-surface bg-surface focus-visible:outline-none"
          >
            <header className="flex items-center justify-between px-5 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center border border-on-surface bg-surface-container-low">
                  <Cookie className="h-4 w-4 text-primary" strokeWidth={1.75} />
                </div>
                <div>
                  <h2
                    id="cookie-preferences-title"
                    className="font-h3 text-on-surface"
                  >
                    Privacy settings
                  </h2>
                  <p className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant mt-1">
                    stablegrid.io
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </header>

            <div className="mx-5 h-px bg-surface-dim" />

            <div className="px-5 py-1">
              {/* Necessary — always on */}
              <div className="flex items-start gap-4 py-4">
                <div className="pt-0.5">
                  <button
                    type="button"
                    role="switch"
                    aria-checked="true"
                    disabled
                    className="relative inline-flex h-[22px] w-[38px] shrink-0 items-center bg-on-surface p-[2px]"
                  >
                    <span className="inline-block h-[16px] w-[16px] translate-x-4 bg-surface" />
                    <span className="sr-only">Necessary cookies always active</span>
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-serif text-[16px] text-on-surface">
                      {COOKIE_CATEGORY_COPY.necessary.label}
                    </p>
                    <span className="font-data-mono uppercase text-[9px] tracking-wider px-1.5 py-0.5 border border-surface-dim text-on-surface-variant">
                      Required
                    </span>
                  </div>
                  <p className="font-body text-[13px] leading-relaxed text-on-surface-variant mt-1">
                    {COOKIE_CATEGORY_COPY.necessary.description}
                  </p>
                </div>
              </div>

              <div className="h-px bg-surface-dim" />

              {OPTIONAL_CATEGORIES.map((category, index) => (
                <div key={category}>
                  <div className="flex items-start gap-4 py-4">
                    <div className="pt-0.5">
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
                        className={`relative inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer items-center p-[2px] transition-colors duration-200 ease-in-out border ${
                          draftConsent[category]
                            ? 'border-on-surface bg-on-surface'
                            : 'border-on-surface bg-surface'
                        }`}
                      >
                        <span
                          className={`block h-[14px] w-[14px] transition-transform duration-200 ease-in-out ${
                            draftConsent[category]
                              ? 'translate-x-4 bg-surface'
                              : 'translate-x-0 bg-on-surface'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-[16px] text-on-surface">
                        {COOKIE_CATEGORY_COPY[category].label}
                      </p>
                      <p className="font-body text-[13px] leading-relaxed text-on-surface-variant mt-1">
                        {COOKIE_CATEGORY_COPY[category].description}
                      </p>
                    </div>
                  </div>
                  {index < OPTIONAL_CATEGORIES.length - 1 ? (
                    <div className="h-px bg-surface-dim" />
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mx-5 h-px bg-surface-dim" />

            <footer className="flex items-center justify-between gap-3 px-5 py-4">
              <Link
                href="/privacy#cookie-policy"
                className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant underline underline-offset-2 transition-colors hover:text-on-surface"
              >
                Cookie policy
              </Link>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraftConsent(buildRejectAllConsentState());
                    commitConsent(buildRejectAllConsentState(), 'preferences_reject_all');
                  }}
                  className="font-data-mono uppercase text-[11px] tracking-wider px-3.5 py-2.5 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Reject all
                </button>
                <button
                  type="button"
                  onClick={() => commitConsent(draftConsent, 'preferences_save')}
                  className="font-data-mono uppercase text-[11px] tracking-wider px-5 py-2.5 border border-on-surface bg-on-surface text-on-primary hover:bg-on-surface/90 transition-colors"
                >
                  Save preferences
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
