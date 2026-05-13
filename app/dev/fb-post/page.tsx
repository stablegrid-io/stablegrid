import type { Metadata } from 'next';
import { BrandCell } from '@/components/brand/BrandCell';

export const metadata: Metadata = {
  title: 'FB Feed Post · stablegrid.io',
  robots: { index: false, follow: false }
};

// Facebook feed-post canvas — 1200 × 630 (1.91:1). Same editorial language as
// the IG square post, rebalanced for landscape: text rail on the left
// (~520px), full-bleed substation hero on the right.
//
// Export: see tools/capture-fb-post.mjs

export default function FBFeedPostPage() {
  return (
    <div className="min-h-screen w-full bg-[#1a1a1a] flex items-center justify-center py-8 px-4">
      {/* 1200 × 630 canvas */}
      <div
        className="relative bg-paper overflow-hidden flex"
        style={{
          width: '1200px',
          height: '630px',
          flexShrink: 0
        }}
      >
        {/* ───── LEFT — brand + pitch + CTA ───── */}
        <div
          className="relative flex flex-col border-r border-outline-variant"
          style={{ width: '520px', padding: '40px 44px' }}
        >
          {/* SCADA hairline strip */}
          <div className="shrink-0">
            <div
              className="flex items-center justify-between font-data-mono text-on-surface-variant mb-2"
              style={{ fontSize: '11px', letterSpacing: '0.22em' }}
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
          <div className="flex items-center gap-3 shrink-0 mt-7 mb-auto">
            <BrandCell
              marker="self"
              style={{ width: '32px', height: '32px' }}
              className="shrink-0"
            />
            <span
              className="font-h1 lowercase text-on-surface"
              style={{
                fontSize: '36px',
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
              className="h-px w-12 mb-4"
              style={{ background: '#e25a1c' }}
              aria-hidden
            />
            <h1
              className="font-h1 text-on-surface mb-6"
              style={{
                fontSize: '54px',
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
              className="pt-4 border-t border-outline-variant flex items-center justify-between font-data-mono uppercase text-on-surface"
              style={{ fontSize: '13px', letterSpacing: '0.18em' }}
            >
              <span className="text-on-surface-variant">FREE · NO CARD</span>
              <span>→ stablegrid.io</span>
            </div>
          </div>
        </div>

        {/* ───── RIGHT — full-bleed component image ───── */}
        <div className="relative overflow-hidden flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/grid/components/primary-substation.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Top-left category chip on the image */}
          <span
            className="absolute top-5 left-5 px-3 py-1.5 bg-paper font-data-mono uppercase text-on-surface"
            style={{ fontSize: '12px', letterSpacing: '0.18em' }}
          >
            BACKBONE
          </span>
          {/* Bottom-right caption like the in-game catalog */}
          <div
            className="absolute bottom-5 right-5 px-3 py-2 bg-paper/95 font-data-mono uppercase text-on-surface text-right"
            style={{ fontSize: '11px', letterSpacing: '0.18em', lineHeight: 1.4 }}
          >
            <div>PRIMARY SUBSTATION</div>
            <div className="text-on-surface-variant mt-0.5" style={{ fontSize: '10px' }}>
              250 kWh · DEPLOYED
            </div>
          </div>
          {/* Spark left-edge accent matching the grid-store catalog selected state */}
          <div
            className="absolute top-0 bottom-0 left-0"
            style={{ width: '3px', background: '#e25a1c' }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
