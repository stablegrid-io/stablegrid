'use client';

import { useEffect } from 'react';
import { useReadingModeStore } from '@/lib/stores/useReadingModeStore';

/**
 * Mirrors the persisted reading mode onto `<html data-reading-mode="…">` so
 * the entire document inherits `--rm-*` tokens through the cascade — no need
 * for every component to set the attribute on its own subtree. Per-component
 * `data-reading-mode` wrappers continue to work (they just shadow the
 * inherited value with the same value) but are no longer the sole authority.
 *
 * Two correctness details fixed by this hook:
 *
 * 1. **Switching flicker.** When the attribute changes, every CSS variable
 *    inside the document re-resolves in one paint, but elements with
 *    `transition-colors` / `transition-background-color` interpolate between
 *    the old and new palette for 150–300 ms. Side-by-side panels finishing at
 *    different times read as "lag and partial conversion." The hook sets a
 *    short-lived `data-rm-switching="true"` flag on <html>; a global rule in
 *    globals.css suppresses every `transition`/`animation` inside the
 *    document during that one frame, so the swap snaps cleanly.
 *
 * 2. **Components rendered outside any wrapper.** Portals, fixed-position
 *    overlays, etc. used to fall back to the initial dark palette because no
 *    ancestor carried `data-reading-mode`. With the attribute on <html>, they
 *    inherit through the cascade automatically.
 */
export function useReadingModeRoot() {
  const mode = useReadingModeStore((s) => s.mode);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (root.getAttribute('data-reading-mode') === mode) return;

    root.setAttribute('data-rm-switching', 'true');
    root.setAttribute('data-reading-mode', mode);

    // Two rAFs guarantees the browser has painted at least once with the new
    // tokens AND with transitions disabled before we lift the flag — a single
    // rAF can fire mid-paint and leave a half-applied frame on slow renders.
    let frame2 = 0;
    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        root.removeAttribute('data-rm-switching');
      });
    });

    return () => {
      cancelAnimationFrame(frame1);
      if (frame2) cancelAnimationFrame(frame2);
    };
  }, [mode]);
}
