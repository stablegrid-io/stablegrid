'use client';

import { motion } from 'framer-motion';
import { ENTRY_EASE_OUT } from '@/components/home/entry/motionTokens';
import type { EntryPhase } from '@/components/home/entry/homeEntryMachine';

interface HandWithCardProps {
  phase: EntryPhase;
}

export const HandWithCard = ({ phase }: HandWithCardProps) => {
  const isPlacing = phase === 'card-place';

  return (
    <motion.div
      data-testid="entry-hand-card"
      className="pointer-events-none absolute bottom-[132px] right-[14%] z-30"
      initial={{ x: 170, y: 130, rotate: -12, opacity: 0 }}
      animate={
        isPlacing
          ? { x: 36, y: 56, rotate: -3, opacity: 1 }
          : { x: 82, y: 34, rotate: -7, opacity: 1 }
      }
      exit={{ x: -12, y: 28, rotate: -2, opacity: 0 }}
      transition={{ duration: isPlacing ? 0.38 : 0.52, ease: ENTRY_EASE_OUT }}
      aria-hidden
    >
      <div className="relative">
        <div className="absolute -left-8 -top-11 h-12 w-24 rounded-lg border border-brand-500/35 bg-dark-surface/95 shadow-[0_12px_28px_-18px_rgba(0,0,0,0.85)]">
          <div className="mt-2 px-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-brand-300">
            StableGrid
          </div>
          <div className="mt-1 px-2 text-xs font-medium text-text-dark-primary">Operator Card</div>
        </div>
        <div className="h-14 w-28 rounded-[18px] border border-[#2e2f36] bg-[#1d1f25] shadow-[0_16px_32px_-20px_rgba(0,0,0,0.9)]" />
      </div>
    </motion.div>
  );
};
