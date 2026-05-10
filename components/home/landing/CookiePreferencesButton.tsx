'use client';

import { openCookiePreferencesDialog } from '@/lib/cookies/cookie-consent';

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={openCookiePreferencesDialog}
      className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant hover:text-on-surface transition-colors underline underline-offset-2"
    >
      Cookie settings
    </button>
  );
}
