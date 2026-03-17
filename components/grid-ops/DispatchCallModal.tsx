'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Radio, CheckCircle2, Zap } from 'lucide-react';
import { unitsToKwh } from '@/lib/energy';
import type { GridOpsDispatchCallView } from '@/lib/grid-ops/types';

interface Props {
  call: GridOpsDispatchCallView | null;
  onClose: () => void;
  onComplete: (callId: string) => Promise<void>;
  pendingComplete: boolean;
}

export function DispatchCallModal({ call, onClose, onComplete, pendingComplete }: Props) {
  return (
    <AnimatePresence>
      {call && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={onClose}
            role="presentation"
          />

          {/* Panel */}
          <motion.div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#060e0b] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.95)]"
            initial={{ scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Radio className="h-4 w-4 text-brand-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-300/55">
                    Dispatch Call
                  </p>
                  <p className="text-sm font-bold text-brand-50">{call.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-white/30 transition hover:text-white/60"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Dialogue bubbles */}
            <div className="max-h-[55vh] overflow-y-auto px-5 py-4">
              <div className="space-y-3">
                {call.dialogue.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {/* Dispatcher avatar */}
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-500/40 bg-brand-500/15 text-[11px] font-bold text-brand-400">
                      D
                    </div>
                    {/* Speech bubble */}
                    <div className="flex-1 rounded-xl rounded-tl-sm border border-white/8 bg-white/[0.04] px-3.5 py-2.5">
                      <p className="text-[13px] leading-relaxed text-brand-100/85">{line}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/8 px-5 py-4">
              {call.completed ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-[#22b999]">
                  <CheckCircle2 className="h-4 w-4" />
                  Mission Complete
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void onComplete(call.id)}
                  disabled={pendingComplete}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/15 px-4 py-2.5 text-[13px] font-semibold text-brand-300 transition-all hover:border-brand-400/50 hover:bg-brand-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" />
                  {pendingComplete
                    ? 'Completing…'
                    : `Complete Mission (+${unitsToKwh(call.reward_units).toFixed(2)} kWh)`}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
