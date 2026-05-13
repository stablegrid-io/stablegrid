import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'StableGrid — PySpark, Junior to Senior';

const INK = '#0a0a0a';
const PAPER = '#fdf9f0';
const PEACH = '#ffb59a';
const MUTED = 'rgba(253,249,240,0.6)';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: INK,
          color: PAPER,
          display: 'flex',
          flexDirection: 'column',
          padding: '64px 80px',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 18, letterSpacing: 4, color: MUTED }}>
          <span>STABLEGRID.IO</span>
          <span>FREQ 50.02 Hz</span>
        </div>
        <div style={{ marginTop: 12, height: 3, width: '100%', background: 'rgba(253,249,240,0.16)', display: 'flex' }}>
          <div style={{ width: '38%', height: '100%', background: PEACH }} />
        </div>

        <div style={{ marginTop: 56, display: 'flex', alignItems: 'center', gap: 24 }}>
          <svg width="72" height="72" viewBox="0 0 100 100">
            <rect x="12" y="12" width="22" height="22" fill={PAPER} />
            <rect x="20" y="20" width="6" height="6" fill={INK} />
            <rect x="39" y="12" width="22" height="22" fill={PAPER} />
            <rect x="47" y="20" width="6" height="6" fill={INK} />
            <rect x="66" y="12" width="22" height="22" fill={PAPER} />
            <rect x="74" y="20" width="6" height="6" fill={INK} />
            <rect x="12" y="39" width="22" height="22" fill={PEACH} />
            <rect x="20" y="47" width="6" height="6" fill={INK} />
            <g stroke={PAPER} strokeOpacity={0.35} strokeWidth={2} fill="none">
              <rect x="39" y="39" width="22" height="22" />
              <rect x="66" y="39" width="22" height="22" />
              <rect x="12" y="66" width="22" height="22" />
              <rect x="39" y="66" width="22" height="22" />
              <rect x="66" y="66" width="22" height="22" />
            </g>
          </svg>
          <span style={{ fontSize: 44, letterSpacing: -1, fontWeight: 700 }}>
            stable<span style={{ color: PEACH }}>grid</span>
            <span style={{ color: MUTED }}>.io</span>
          </span>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 4, width: 80, background: PEACH, marginBottom: 24 }} />
          <h1 style={{ fontSize: 96, lineHeight: 1, margin: 0, fontWeight: 700, letterSpacing: -2 }}>
            PySpark, top to bottom.
          </h1>
          <p style={{ fontSize: 30, lineHeight: 1.35, marginTop: 24, color: MUTED, maxWidth: 880 }}>
            Three tiers, thirty chapters, server-graded practice. Junior to Senior.
          </p>
        </div>

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', fontSize: 18, letterSpacing: 4, color: MUTED }}>
          <span>→ STABLEGRID.IO/THEORY</span>
          <span>FREE DURING BETA</span>
        </div>
      </div>
    ),
    size
  );
}
