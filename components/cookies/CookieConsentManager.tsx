'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Shield, X } from 'lucide-react';
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
          className="fixed bottom-5 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-[22px] border border-white/[0.08] bg-[#0d0f11]/90 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:bottom-6 sm:right-5"
        >
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] border border-white/[0.06] bg-white/[0.04]">
                <Shield className="h-4 w-4 text-white/50" />
              </div>
              <div>
                <h2 className="text-[0.9rem] font-semibold tracking-tight text-white/90">
                  Privacy on stableGrid
                </h2>
                <p className="mt-1 text-[0.8rem] leading-relaxed text-white/45">
                  We use cookies for essential functionality and to improve your experience.{' '}
                  <Link
                    href="/privacy#cookie-policy"
                    className="text-white/55 underline underline-offset-2 transition-colors hover:text-white/75"
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
                className="flex-1 rounded-[14px] bg-white/[0.08] px-4 py-2.5 text-[0.8rem] font-medium text-white/90 transition-all hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={() => commitConsent(buildRejectAllConsentState(), 'banner_reject_all')}
                className="flex-1 rounded-[14px] bg-white/[0.08] px-4 py-2.5 text-[0.8rem] font-medium text-white/90 transition-all hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
              >
                Reject all
              </button>
              <button
                type="button"
                onClick={openPreferences}
                className="rounded-[14px] px-3 py-2.5 text-[0.8rem] font-medium text-white/70 transition-all hover:text-white/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-preferences-title"
            tabIndex={-1}
            className="relative z-10 w-[calc(100vw-1.5rem)] max-w-[34rem] max-h-[85vh] overflow-y-auto rounded-[22px] border border-white/[0.08] bg-[#0d0f11]/95 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl focus-visible:outline-none"
          >
            {/* Header */}
            <header className="flex items-center justify-between px-5 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[14px] border border-white/[0.06] bg-white/[0.04]">
                  <Shield className="h-4.5 w-4.5 text-white/50" />
                </div>
                <div>
                  <h2
                    id="cookie-preferences-title"
                    className="text-[1rem] font-semibold tracking-tight text-white/90"
                  >
                    Privacy settings
                  </h2>
                  <p className="text-[0.72rem] text-white/30">stableGrid.io</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-[14px] text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* Divider */}
            <div className="mx-5 h-px bg-white/[0.06]" />

            {/* Cookie Categories */}
            <div className="px-5 py-1">
              {/* Necessary — always on */}
              <div className="flex items-start gap-4 py-4">
                <div className="pt-0.5">
                  <button
                    type="button"
                    role="switch"
                    aria-checked="true"
                    disabled
                    className="relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-[2px] bg-primary transition"
                  >
                    <span className="inline-block h-[18px] w-[18px] translate-x-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-transform" />
                    <span className="sr-only">Necessary cookies always active</span>
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[0.85rem] font-medium text-white/80">
                      {COOKIE_CATEGORY_COPY.necessary.label}
                    </p>
                    <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[0.65rem] font-medium text-white/25">
                      Required
                    </span>
                  </div>
                  <p className="mt-1 text-[0.78rem] leading-relaxed text-white/35">
                    {COOKIE_CATEGORY_COPY.necessary.description}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.04]" />

              {/* Optional categories */}
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
                        className={`relative inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer items-center rounded-full p-[2px] transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 ${
                          draftConsent[category]
                            ? 'bg-primary'
                            : 'bg-white/[0.08]'
                        }`}
                      >
                        <span
                          className={`block h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-transform duration-200 ease-in-out ${
                            draftConsent[category]
                              ? 'translate-x-4'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.85rem] font-medium text-white/70">
                        {COOKIE_CATEGORY_COPY[category].label}
                      </p>
                      <p className="mt-1 text-[0.78rem] leading-relaxed text-white/35">
                        {COOKIE_CATEGORY_COPY[category].description}
                      </p>
                    </div>
                  </div>
                  {index < OPTIONAL_CATEGORIES.length - 1 ? (
                    <div className="h-px bg-white/[0.04]" />
                  ) : null}
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="mx-5 h-px bg-white/[0.06]" />

            {/* Footer */}
            <footer className="flex items-center justify-between gap-3 px-5 py-4">
              <Link
                href="/privacy#cookie-policy"
                className="text-[0.75rem] text-white/60 underline underline-offset-2 transition-colors hover:text-white/80"
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
                  className="rounded-[14px] px-3.5 py-2.5 text-[0.8rem] font-medium text-white/65 transition-all hover:bg-white/[0.04] hover:text-white/85 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
                >
                  Reject all
                </button>
                <button
                  type="button"
                  onClick={() => commitConsent(draftConsent, 'preferences_save')}
                  className="rounded-[14px] bg-white/[0.08] px-5 py-2.5 text-[0.8rem] font-medium text-white/85 transition-all hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
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
