'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SCAN_LINE_DURATION_MS } from '@/components/home/entry/motionTokens';
import type { EntryMode, EntryPhase } from '@/components/home/entry/homeEntryMachine';

interface ActivationDockProps {
  mode: EntryMode;
  phase: EntryPhase;
  onActivated?: () => void;
}

export const ActivationDock = ({ mode, phase, onActivated }: ActivationDockProps) => {
  const [scanProgress, setScanProgress] = useState(0);
  const hasActivatedRef = useRef(false);

  useEffect(() => {
    if (phase === 'activation' && !hasActivatedRef.current) {
      hasActivatedRef.current = true;
      onActivated?.();
    }
  }, [onActivated, phase]);

  useEffect(() => {
    if (phase !== 'scanning') {
      setScanProgress(0);
      return undefined;
    }

    const duration =
      mode === 'short' ? SCAN_LINE_DURATION_MS.short : SCAN_LINE_DURATION_MS.full;
    const startAt = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const elapsed = now - startAt;
      const next = Math.min(1, elapsed / duration);
      setScanProgress(next);
      if (next < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [mode, phase]);

  const cardPlaced =
    phase === 'card-place' ||
    phase === 'scanning' ||
    phase === 'activation' ||
    phase === 'reveal' ||
    phase === 'ready';
  const scanActive = phase === 'scanning';
  const glowActive = phase === 'activation' || phase === 'reveal';

  return (
    <div
      data-testid="activation-dock"
      className="relative mx-auto w-full max-w-[420px]"
      aria-hidden
    >
      <div className="mx-auto h-3 w-[58%] rounded-full bg-black/35 blur-xl" />
      <motion.div
        className="relative mt-2 overflow-hidden rounded-2xl border border-light-border/70 bg-light-surface/70 px-4 pb-5 pt-4 dark:border-dark-border/80 dark:bg-dark-surface/85"
        animate={{
          scale: glowActive ? 1.01 : 1,
          boxShadow: glowActive
            ? '0 0 0 1px rgba(34,185,153,0.22), 0 18px 46px -26px rgba(34,185,153,0.35)'
            : '0 12px 32px -24px rgba(0,0,0,0.45)'
        }}
        transition={{ duration: 0.34 }}
      >
        <div className="pointer-events-none absolute inset-x-6 top-4 h-1 rounded-full bg-light-border dark:bg-dark-border" />
        <div className="relative mt-4 h-[92px] rounded-xl border border-light-border bg-light-bg/80 dark:border-dark-border dark:bg-dark-bg/80">
          {cardPlaced ? (
            <motion.div
              className="absolute inset-x-8 top-4 h-[56px] rounded-lg border border-brand-500/40 bg-dark-bg/90"
              initial={{ opacity: 0.6, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28 }}
            >
              <div className="mt-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-400">
                Learning ID
              </div>
              <div className="mt-1 px-3 text-sm font-medium text-text-dark-primary">
                Workspace Card
              </div>
              {scanActive ? (
                <div
                  className="pointer-events-none absolute left-0 right-0 h-[2px] bg-brand-400/80"
                  style={{ top: `${12 + scanProgress * 32}px` }}
                />
              ) : null}
            </motion.div>
          ) : null}
          {(scanActive || glowActive) ? (
            <motion.div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(34,185,153,0.22),transparent_62%)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: glowActive ? 1 : 0.68 }}
              transition={{ duration: 0.32 }}
            />
          ) : null}
        </div>
      </motion.div>
    </div>
  );
};
