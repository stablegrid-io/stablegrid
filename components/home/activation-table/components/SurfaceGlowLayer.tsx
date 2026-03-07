'use client';

import { motion } from 'framer-motion';
import type { ActivationPhase } from '@/components/home/activation-table/state/activationMachine';
import { ACTIVATION_EASE_STANDARD } from '@/components/home/activation-table/state/activationTimings';

interface SurfaceGlowLayerProps {
  phase: ActivationPhase;
}

export const SurfaceGlowLayer = ({ phase }: SurfaceGlowLayerProps) => {
  const wakeProgress = phase !== 'loading';

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      animate={{
        opacity: wakeProgress ? 1 : 0.35
      }}
      transition={{ duration: 0.28, ease: ACTIVATION_EASE_STANDARD }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_62%,rgba(245,158,11,0.14),transparent_42%),radial-gradient(circle_at_72%_36%,rgba(34,185,153,0.12),transparent_30%),radial-gradient(circle_at_22%_42%,rgba(148,163,184,0.1),transparent_36%)]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(250,250,250,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(250,250,250,0.035) 1px, transparent 1px)',
          backgroundSize: '58px 58px'
        }}
      />
    </motion.div>
  );
};
