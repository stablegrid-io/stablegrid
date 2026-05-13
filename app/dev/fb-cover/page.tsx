import type { Metadata } from 'next';
import { BrandCell } from '@/components/brand/BrandCell';

export const metadata: Metadata = {
  title: 'FB Cover · stablegrid.io',
  robots: { index: false, follow: false }
};

// Facebook cover canvas — 1640 × 624 (2× of 820×312). FB crops to ~820×312 on
// desktop and ~640×360 on mobile, both centered. Safe zone: keep critical
// content within central 1200 × 624. Profile pic overlaps bottom-left on
// desktop, so left ~250px of bottom edge should stay clean.
//
// Export: DevTools (Cmd+Opt+I) → Cmd+Shift+M → 1640 × 624 → Cmd+Shift+P →
// "Capture screenshot". Upload PNG to Facebook page cover.

const COMPONENTS = [
  { src: '/grid/components/primary-substation.jpg', label: 'BACKBONE' },
  { src: '/grid/components/power-transformer.jpg', label: 'BACKBONE' },
  { src: '/grid/components/protective-relay.jpg', label: 'PROTECTION', accent: true }
];

export default function FBCoverPage() {
  return (
    <div className="min-h-screen w-full bg-[#1a1a1a] flex items-center justify-center py-8 px-4">
      {/* 1640 × 624 Facebook cover canvas */}
      <div
        className="relative bg-paper overflow-hidden flex"
        style={{
          width: '1640px',
          height: '624px',
          flexShrink: 0
        }}
      >
        {/* ───── LEFT: brand + headline + cta ───── */}
        <div className="flex flex-col justify-between" style={{ width: '780px', padding: '56px 64px' }}>
          {/* SCADA strip */}
          <div className="shrink-0">
            <div
              className="flex items-center justify-between font-data-mono text-on-surface-variant"
              style={{ fontSize: '13px', letterSpacing: '0.22em' }}
            >
              <span>BUS A-01 · 330 kV</span>
              <span>FREQ 50.02 Hz</span>
            </div>
            <div className="relative mt-2 h-[2px]" aria-hidden>
              <div className="absolute inset-0" style={{ background: 'rgba(232,228,214,0.16)' }} />
              <div className="absolute left-0 top-0 bottom-0" style={{ width: '38%', background: '#e25a1c' }} />
            </div>
          </div>

          {/* Wordmark */}
          <div className="flex items-center gap-4">
            <BrandCell
              marker="self"
              style={{ width: '56px', height: '56px' }}
              className="shrink-0"
            />
            <span
              className="font-h1 lowercase text-on-surface"
              style={{
                fontSize: '72px',
                lineHeight: 0.9,
                letterSpacing: '-0.02em',
                fontWeight: 700
              }}
            >
              stable<span style={{ color: '#ffb59a' }}>grid</span>
              <span className="text-on-surface-variant">.io</span>
            </span>
          </div>

          {/* Headline */}
          <div>
            <div
              className="h-px mb-5"
              style={{ background: '#e25a1c', width: '64px' }}
              aria-hidden
            />
            <h1
              className="font-h1 text-on-surface"
              style={{
                fontSize: '52px',
                lineHeight: 0.98,
                letterSpacing: '-0.02em',
                fontWeight: 700
              }}
            >
              Learn <span style={{ color: '#ffb59a' }}>PySpark</span>
              <br />
              by restoring the grid.
            </h1>
            <div
              className="mt-6 pt-3 border-t border-outline-variant flex items-center font-data-mono uppercase text-on-surface"
              style={{ fontSize: '15px', letterSpacing: '0.22em' }}
            >
              <span>→ stablegrid.io</span>
            </div>
          </div>
        </div>

        {/* ───── RIGHT: component image stack ───── */}
        <div
          className="flex-1 flex flex-col gap-3"
          style={{ padding: '56px 64px 56px 0' }}
        >
          {COMPONENTS.map((c) => (
            <div
              key={c.src}
              className="relative overflow-hidden border border-outline-variant flex-1 min-h-0"
              style={c.accent ? { borderLeft: '4px solid #e25a1c' } : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.src} alt="" className="w-full h-full object-cover" />
              <span
                className="absolute top-3 left-3 px-2.5 py-1 bg-paper font-data-mono uppercase text-on-surface"
                style={{ fontSize: '11px', letterSpacing: '0.18em' }}
              >
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
