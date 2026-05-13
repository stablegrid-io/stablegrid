import type { Metadata } from 'next';
import { BrandCell } from '@/components/brand/BrandCell';

export const metadata: Metadata = {
  title: 'IG Square Post · stablegrid.io',
  robots: { index: false, follow: false }
};

// Instagram feed-post canvas — 1080 × 1080 (1:1). Two-column editorial: left
// is brand + headline + CTA, right is a single full-bleed grid-game asset.
// No IG safe-zones to dodge on a feed post, so the layout is edge-to-edge.
//
// Export: see tools/capture-ig-post.mjs

export default function IGPostPage() {
  return (
    <div className="min-h-screen w-full bg-[#1a1a1a] flex items-center justify-center py-8 px-4">
      {/* 1080 × 1080 canvas */}
      <div
        className="relative bg-paper overflow-hidden grid"
        style={{
          width: '1080px',
          height: '1080px',
          flexShrink: 0,
          gridTemplateColumns: '1fr 1fr'
        }}
      >
        {/* ───── LEFT — brand + pitch + CTA ───── */}
        <div className="relative flex flex-col px-14 py-14 border-r border-outline-variant">
          {/* SCADA hairline strip */}
          <div className="shrink-0 mb-10">
            <div
              className="flex items-center justify-between font-data-mono text-on-surface-variant mb-3"
              style={{ fontSize: '14px', letterSpacing: '0.22em' }}
            >
              <span>BUS A-01 · 330 kV</span>
              <span>NORMAL</span>
            </div>
            <div className="relative h-[2px]" aria-hidden>
              <div className="absolute inset-0" style={{ background: 'rgba(232,228,214,0.16)' }} />
              <div className="absolute left-0 top-0 bottom-0" style={{ width: '38%', background: '#e25a1c' }} />
            </div>
          </div>

          {/* Wordmark */}
          <div className="flex items-center gap-3 shrink-0 mb-auto">
            <BrandCell
              marker="self"
              style={{ width: '44px', height: '44px' }}
              className="shrink-0"
            />
            <span
              className="font-h1 lowercase text-on-surface"
              style={{
                fontSize: '52px',
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
          <div className="shrink-0">
            <div
              className="h-px w-16 mb-6"
              style={{ background: '#e25a1c' }}
              aria-hidden
            />
            <h1
              className="font-h1 text-on-surface mb-8"
              style={{
                fontSize: '72px',
                lineHeight: 0.96,
                letterSpacing: '-0.02em',
                fontWeight: 700
              }}
            >
              Learn <span style={{ color: '#ffb59a' }}>PySpark</span>
              <br />
              by restoring
              <br />
              the grid.
            </h1>

            <div
              className="pt-5 border-t border-outline-variant flex items-center justify-between font-data-mono uppercase text-on-surface"
              style={{ fontSize: '18px', letterSpacing: '0.18em' }}
            >
              <span className="text-on-surface-variant">FREE · NO CARD</span>
              <span>→ stablegrid.io</span>
            </div>
          </div>
        </div>

        {/* ───── RIGHT — full-bleed component image ───── */}
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/grid/components/primary-substation.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Bottom-left category chip on the image */}
          <span
            className="absolute top-6 left-6 px-3 py-1.5 bg-paper font-data-mono uppercase text-on-surface"
            style={{ fontSize: '16px', letterSpacing: '0.18em' }}
          >
            BACKBONE
          </span>
          {/* Bottom-right caption like the in-game catalog */}
          <div
            className="absolute bottom-6 right-6 px-4 py-3 bg-paper/95 font-data-mono uppercase text-on-surface text-right"
            style={{ fontSize: '14px', letterSpacing: '0.18em', lineHeight: 1.4 }}
          >
            <div>PRIMARY SUBSTATION</div>
            <div className="text-on-surface-variant mt-1" style={{ fontSize: '12px' }}>
              250 kWh · DEPLOYED
            </div>
          </div>
          {/* Spark left-edge accent matching the grid-store catalog selected state */}
          <div
            className="absolute top-0 bottom-0 left-0"
            style={{ width: '4px', background: '#e25a1c' }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
