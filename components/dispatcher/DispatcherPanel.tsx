'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Radio, X } from 'lucide-react';

const STORAGE_KEY = 'dispatcher_intro_v1';

export function DispatcherPanel() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        setVisible(true);
      }
    } catch {
      // localStorage may be unavailable in some environments
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-4 left-4 z-40 w-[280px]"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.6 }}
        >
          <div className="overflow-hidden rounded-2xl border border-brand-500/25 bg-[#060e0b]/95 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-500/40 bg-brand-500/15 text-[11px] font-bold text-brand-400">
                  D
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-300/60">
                    Dispatcher
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22b999]" />
                    <span className="text-[10px] text-brand-200/50">Control — Live</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-lg p-1 text-white/25 transition hover:text-white/55"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Message */}
            <div className="px-4 py-3.5">
              <p className="text-[12.5px] leading-relaxed text-brand-100/80">
                This is Control. Your grid is live.
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-brand-100/80">
                I&apos;ll brief you on incidents and missions as they arise. Keep the stability high —
                the region is counting on you.
              </p>
            </div>

            {/* Action */}
            <div className="border-t border-white/8 px-4 py-3">
              <button
                type="button"
                onClick={handleDismiss}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-500/25 bg-brand-500/12 py-2 text-[12px] font-semibold text-brand-300 transition hover:border-brand-400/40 hover:bg-brand-500/20"
              >
                <Radio className="h-3.5 w-3.5" />
                Got it, Control
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
