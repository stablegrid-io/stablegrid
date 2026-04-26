'use client';

import { useEffect, useRef } from 'react';
import { Portal } from './Portal';
import {
  BRAND_CYAN,
  PANEL_BG,
  PANEL_BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from './tokens';

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
      onClick={(e) => { if (e.target === e.currentTarget) onAcknowledge(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,10,12,0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 100,
        animation: 'gridFade 200ms ease-out',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="briefing-title"
        style={{
          background: PANEL_BG,
          border: `1px solid ${PANEL_BORDER}`,
          borderRadius: 16,
          padding: '36px 40px',
          maxWidth: 620,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'gridLift 260ms cubic-bezier(.16,1,.3,1)',
        }}
      >
        <header>
          <span
            className="font-mono"
            style={{
              display: 'inline-block',
              fontSize: 10,
              letterSpacing: '0.2em',
              color: BRAND_CYAN,
              padding: '4px 10px',
              border: `1px solid ${BRAND_CYAN}66`,
              borderRadius: 4,
              marginBottom: 18,
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Operator Briefing
          </span>
          <h2
            id="briefing-title"
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: TEXT_PRIMARY,
              margin: '0 0 22px',
              letterSpacing: '-0.015em',
              fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
            }}
          >
            Saulėgrid, April 2026
          </h2>
        </header>

        <div style={{ color: TEXT_SECONDARY, lineHeight: 1.7, fontSize: 14 }}>
          <p style={{ margin: '0 0 14px' }}>
            A regional utility cooperative serving 1.2 million meters across ten districts in the Baltic corridor.
            For years the grid ran on inherited infrastructure — aging substations, a single transmission spine,
            battery reserves sized for a quieter decade. Demand climbed. Renewables came online faster than the
            balancing hardware could keep up. The margin between stable and unstable narrowed month by month.
          </p>
          <p style={{ margin: '0 0 14px' }}>
            On April 14th at 02:00, a frequency excursion on the northern interconnect propagated south before
            protective relays could isolate it. A substation tripped. The load it carried rerouted onto neighbors
            already near capacity. They tripped in sequence. By 02:47, all ten districts were dark in a rolling
            cascade — the kind of failure grid operators spend careers trying to prevent.
          </p>
          <p style={{ margin: 0 }}>
            The grid is down. The control room is running on backup. And you — the operator with the only intact
            dispatch terminal — have been handed a battery bank with{' '}
            <strong style={{ color: BRAND_CYAN, fontWeight: 600 }}>reserve capacity</strong> and a schematic of
            ten empty component slots across the Saulėgrid service territory.
          </p>

          <p
            style={{
              color: TEXT_PRIMARY,
              fontSize: 15,
              fontWeight: 500,
              paddingTop: 14,
              borderTop: `1px solid ${PANEL_BORDER}`,
              marginTop: 22,
              marginBottom: 0,
            }}
          >
            Restore the grid. One district at a time.
          </p>
        </div>

        <footer style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            ref={ackRef}
            type="button"
            onClick={onAcknowledge}
            className="font-mono transition-colors"
            style={{
              background: 'transparent',
              border: `1px solid ${BRAND_CYAN}`,
              color: BRAND_CYAN,
              fontSize: 11,
              letterSpacing: '0.2em',
              padding: '11px 30px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${BRAND_CYAN}14`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            ACKNOWLEDGE
          </button>
        </footer>
      </div>

      <style jsx>{`
        @keyframes gridFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gridLift {
          from { opacity: 0; transform: translateY(8px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
    </Portal>
  );
}
