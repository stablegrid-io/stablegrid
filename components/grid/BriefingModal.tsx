'use client';

import { useEffect, useRef } from 'react';
import { Portal } from './Portal';

interface BriefingModalProps {
  onAcknowledge: () => void;
}

export function BriefingModal({ onAcknowledge }: BriefingModalProps) {
  const ackRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    ackRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onAcknowledge();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onAcknowledge]);

  return (
    <Portal>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onAcknowledge();
        }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-on-surface/40 backdrop-blur-sm"
        style={{ animation: 'gridFade 200ms ease-out' }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="briefing-title"
          className="bg-surface border border-on-surface max-w-[620px] w-full max-h-[90vh] overflow-y-auto px-10 py-9"
          style={{ animation: 'gridLift 260ms cubic-bezier(.16,1,.3,1)' }}
        >
          <header className="mb-6">
            <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant block mb-3">
              Operator Briefing
            </span>
            <h2
              id="briefing-title"
              className="font-h2 text-on-surface"
            >
              Saulėgrid, April 2026
            </h2>
          </header>

          <div className="font-body text-on-surface-variant leading-relaxed space-y-4">
            <p>
              A regional utility cooperative serving 1.2 million meters across ten districts in the
              Baltic corridor. For years the grid ran on inherited infrastructure — aging substations,
              a single transmission spine, battery reserves sized for a quieter decade. Demand climbed.
              Renewables came online faster than the balancing hardware could keep up. The margin
              between stable and unstable narrowed month by month.
            </p>
            <p>
              On April 14th at 02:00, a frequency excursion on the northern interconnect propagated
              south before protective relays could isolate it. A substation tripped. The load it
              carried rerouted onto neighbors already near capacity. They tripped in sequence. By
              02:47, all ten districts were dark in a rolling cascade — the kind of failure grid
              operators spend careers trying to prevent.
            </p>
            <p>
              The grid is down. The control room is running on backup. And you — the operator with the
              only intact dispatch terminal — have been handed a battery bank with{' '}
              <strong className="text-primary font-semibold">reserve capacity</strong> and a schematic
              of ten empty component slots across the Saulėgrid service territory.
            </p>
          </div>

          <p className="font-serif text-[18px] text-on-surface mt-6 pt-5 border-t border-surface-dim">
            Restore the grid. One district at a time.
          </p>

          <footer className="mt-8 flex justify-end">
            <button
              ref={ackRef}
              type="button"
              onClick={onAcknowledge}
              className="font-data-mono uppercase text-[11px] tracking-wider text-on-primary px-7 py-3 border border-on-surface bg-on-surface hover:bg-on-surface/90 transition-colors"
            >
              Acknowledge
            </button>
          </footer>
        </div>

        <style jsx>{`
          @keyframes gridFade { from { opacity: 0; } to { opacity: 1; } }
          @keyframes gridLift {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </Portal>
  );
}
