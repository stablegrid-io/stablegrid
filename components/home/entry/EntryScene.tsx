'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { CSSProperties } from 'react';
import { ActivationDock } from '@/components/home/entry/ActivationDock';
import { HandWithCard } from '@/components/home/entry/HandWithCard';
import { ENTRY_EASE_STANDARD } from '@/components/home/entry/motionTokens';
import type { EntryMode, EntryPhase } from '@/components/home/entry/homeEntryMachine';

interface EntrySceneProps {
  mode: EntryMode;
  phase: EntryPhase;
}

export const EntryScene = ({ mode, phase }: EntrySceneProps) => {
  const showHand = phase === 'hand-enter' || phase === 'card-place';

  return (
    <motion.div
      data-testid="entry-scene"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[2rem] border border-dark-border bg-dark-surface/96"
      style={
        {
          '--entry-grid-line': 'rgba(250, 250, 250, 0.05)',
          '--entry-grid-line-soft': 'rgba(250, 250, 250, 0.02)'
        } as CSSProperties
      }
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'reveal' ? 0.1 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: ENTRY_EASE_STANDARD }}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(var(--entry-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--entry-grid-line) 1px, transparent 1px), radial-gradient(circle at 50% 68%, rgba(34,185,153,0.14), transparent 40%), linear-gradient(180deg, var(--entry-grid-line-soft), transparent 48%)',
          backgroundSize: '52px 52px, 52px 52px, 100% 100%, 100% 100%'
        }}
      />

      <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-dark-border bg-dark-bg/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-400">
        <Sparkles className="h-3.5 w-3.5" />
        Learning Grid
      </div>
      <p className="absolute left-5 top-16 text-xs text-text-dark-secondary">
        Restoring workspace
      </p>

      <div className="absolute inset-x-4 bottom-8">
        <ActivationDock mode={mode} phase={phase} />
      </div>

      <AnimatePresence>
        {showHand ? <HandWithCard key="entry-hand" phase={phase} /> : null}
      </AnimatePresence>
    </motion.div>
  );
};
