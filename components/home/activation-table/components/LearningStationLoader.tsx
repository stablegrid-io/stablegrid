'use client';

import { motion } from 'framer-motion';
import type {
  ActivationMode,
  ActivationPhase
} from '@/components/home/activation-table/state/activationMachine';
import {
  ACTIVATION_EASE_OUT,
  ACTIVATION_EASE_STANDARD,
  ACTIVATION_PROGRESS_DURATION_MS
} from '@/components/home/activation-table/state/activationTimings';

interface LearningStationLoaderProps {
  mode: ActivationMode;
  phase: ActivationPhase;
}

export const LearningStationLoader = ({
  mode,
  phase
}: LearningStationLoaderProps) => {
  const progressDurationMs =
    mode === 'short'
      ? ACTIVATION_PROGRESS_DURATION_MS.short
      : ACTIVATION_PROGRESS_DURATION_MS.full;
  const loading = phase === 'loading';

  return (
    <motion.div
      data-testid="learning-station-loader"
      aria-hidden
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: loading ? 1 : 0, y: loading ? 0 : -6 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: ACTIVATION_EASE_OUT }}
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[2rem] border border-dark-border bg-[#060809]/96"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(250,250,250,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(250,250,250,0.03) 1px, transparent 1px)',
          backgroundSize: '56px 56px'
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_58%,rgba(34,185,153,0.11),transparent_52%)]" />

      <div className="relative mx-auto flex h-full w-full max-w-md flex-col justify-center px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300">
          Learning Station
        </p>
        <p className="mt-2 text-sm text-text-dark-secondary">Restoring your workspace</p>

        <div
          data-testid="learning-station-progress-track"
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"
        >
          <motion.div
            key={`learning-progress-${mode}`}
            data-testid="learning-station-progress-fill"
            className="h-full origin-left rounded-full bg-brand-400"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: progressDurationMs / 1000,
              ease: ACTIVATION_EASE_STANDARD
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};
