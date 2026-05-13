import type { Metadata } from 'next';
import { BrandCell } from '@/components/brand/BrandCell';

export const metadata: Metadata = {
  title: 'IG Story · stablegrid.io',
  robots: { index: false, follow: false }
};

// Instagram Story canvas — 1080 × 1920 (9:16). Flex column so content never
// collides regardless of how text wraps. Copy is intentionally minimal:
// what you see in 1.5 seconds is wordmark → game asset → one-line pitch.
//
// Export: DevTools (Cmd+Opt+I) → Cmd+Shift+M → 1080 × 1920 → Cmd+Shift+P →
// "Capture screenshot". Upload PNG to Instagram.

const COMPONENTS = [
  { src: '/grid/components/primary-substation.jpg', label: 'BACKBONE' },
  { src: '/grid/components/power-transformer.jpg', label: 'BACKBONE' },
  { src: '/grid/components/protective-relay.jpg', label: 'PROTECTION', accent: true }
];

export default function IGStoryPage() {
  return (
    <div className="min-h-screen w-full bg-[#1a1a1a] flex items-center justify-center py-8 px-4">
      {/* 1080 × 1920 IG Story canvas */}
      <div
        className="relative bg-paper overflow-hidden flex flex-col"
        style={{
          width: '1080px',
          height: '1920px',
          flexShrink: 0
        }}
      >
        {/* ───── Top SCADA hairline strip ───── */}
        <div className="px-16 pt-14 pb-10 shrink-0">
          <div className="flex items-center justify-between font-data-mono text-on-surface-variant" style={{ fontSize: '20px', letterSpacing: '0.22em' }}>
            <span>BUS A-01 · 330 kV</span>
            <span>FREQ 50.02 Hz</span>
          </div>
          <div className="relative mt-3 h-[3px]" aria-hidden>
            <div className="absolute inset-0" style={{ background: 'rgba(232,228,214,0.16)' }} />
            <div className="absolute left-0 top-0 bottom-0" style={{ width: '38%', background: '#e25a1c' }} />
          </div>
        </div>

        {/* ───── Wordmark ───── */}
        <header className="px-16 pb-12 shrink-0 flex items-center justify-center gap-6">
          <BrandCell
            marker="self"
            style={{ width: '96px', height: '96px' }}
            className="shrink-0"
          />
          <span
            className="font-h1 lowercase text-on-surface"
            style={{
              fontSize: '120px',
              lineHeight: 0.9,
              letterSpacing: '-0.02em',
              fontWeight: 700
            }}
          >
            stable<span style={{ color: '#ffb59a' }}>grid</span>
            <span className="text-on-surface-variant">.io</span>
          </span>
        </header>

        {/* ───── Component image stack (the visual hook) ───── */}
        <section className="px-12 flex-1 flex flex-col gap-4 min-h-0">
          {COMPONENTS.map((c) => (
            <div
              key={c.src}
              className="relative overflow-hidden border border-outline-variant flex-1 min-h-0"
              style={c.accent ? { borderLeft: '4px solid #e25a1c' } : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.src} alt="" className="w-full h-full object-cover" />
              <span
                className="absolute top-4 left-4 px-3 py-1.5 bg-paper font-data-mono uppercase text-on-surface"
                style={{ fontSize: '18px', letterSpacing: '0.18em' }}
              >
                {c.label}
              </span>
            </div>
          ))}
        </section>

        {/* ───── Single-line pitch + CTA ───── */}
        <footer className="px-16 pt-14 pb-16 shrink-0">
          <div
            className="h-px w-24 mb-8"
            style={{ background: '#e25a1c' }}
            aria-hidden
          />
          <h1
            className="font-h1 text-on-surface"
            style={{
              fontSize: '92px',
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
            className="mt-10 pt-6 border-t border-outline-variant flex items-center justify-end font-data-mono uppercase text-on-surface"
            style={{ fontSize: '30px', letterSpacing: '0.18em' }}
          >
            <span>→ stablegrid.io</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
