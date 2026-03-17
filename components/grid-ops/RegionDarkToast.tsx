'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  regionName: string;
  onDismiss: () => void;
}

export function RegionDarkToast({ regionName, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        className="pointer-events-none fixed bottom-20 right-4 z-50 w-[280px] rounded-2xl border border-rose-500/40 bg-[#1a0a0b]/95 p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        initial={{ opacity: 0, x: 40, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 40, scale: 0.96 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 text-base leading-none">⚡</span>
          <div>
            <p className="text-[0.82rem] font-bold text-rose-300">
              {regionName} — DARK
            </p>
            <p className="mt-0.5 text-[0.74rem] text-[#c08088]">
              Repair the offline asset to restore the region.
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <motion.div
          className="mt-2.5 h-0.5 w-full overflow-hidden rounded-full bg-rose-500/20"
        >
          <motion.div
            className="h-full rounded-full bg-rose-500/60"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 4, ease: 'linear' }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
