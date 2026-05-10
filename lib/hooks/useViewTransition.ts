'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Wraps `router.push` in `document.startViewTransition` so the route swap
 * cross-fades instead of cutting. Falls through to a plain `router.push`
 * when the View Transitions API isn't available (Firefox at the moment)
 * and when the user has `prefers-reduced-motion` set, so the helper is
 * always safe to call.
 *
 * Opt-in per call site — we intentionally don't patch every <Link> globally,
 * because not every route transition benefits from a cross-fade and some
 * (e.g. opening a focus-mode session) rely on layout shifts that the
 * transition would visually pollute.
 *
 *   const transitionTo = useViewTransition();
 *   <button onClick={() => transitionTo('/theory')}>Open theory</button>
 */
export function useViewTransition() {
  const router = useRouter();

  return useCallback(
    (href: string) => {
      const reduceMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Feature detection — `startViewTransition` is on Document in Chrome /
      // Edge / Safari TP. Firefox lacks it as of late 2025; fall through.
      const docWithVT = document as Document & {
        startViewTransition?: (cb: () => void) => unknown;
      };

      if (!reduceMotion && typeof docWithVT.startViewTransition === 'function') {
        docWithVT.startViewTransition(() => {
          router.push(href);
        });
        return;
      }

      router.push(href);
    },
    [router],
  );
}
