'use client';

import { openCookiePreferencesDialog } from '@/lib/cookies/cookie-consent';

interface CookiePreferencesButtonProps {
  /**
   * `dark` (default) renders cream-on-dark for the body of the site;
   * `light` renders ink-on-paper for the white landing footer.
   */
  tone?: 'dark' | 'light';
}

export function CookiePreferencesButton({ tone = 'dark' }: CookiePreferencesButtonProps = {}) {
  const cls =
    tone === 'light'
      ? 'font-data-mono uppercase text-[11px] tracking-wider text-ink-light/70 hover:text-ink-light transition-colors underline underline-offset-2'
      : 'font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant hover:text-on-surface transition-colors underline underline-offset-2';
  return (
    <button type="button" onClick={openCookiePreferencesDialog} className={cls}>
      Cookie settings
    </button>
  );
}
