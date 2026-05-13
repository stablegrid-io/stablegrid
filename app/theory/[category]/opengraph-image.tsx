import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'StableGrid — PySpark course';

type Category = 'junior' | 'mid' | 'senior' | 'all';

const PALETTE: Record<Category, { accent: string; eyebrow: string; title: string; subtitle: string }> = {
  junior: {
    accent: '#00e2ee',
    eyebrow: 'TRACK · 01',
    title: 'Junior PySpark',
    subtitle: 'DataFrames, joins, SQL — ten chapters that get you shipping.'
  },
  mid: {
    accent: '#fbbf24',
    eyebrow: 'TRACK · 02',
    title: 'Mid PySpark',
    subtitle: 'Catalyst, partitioning, Delta Lake, structured streaming.'
  },
  senior: {
    accent: '#FF6A2C',
    eyebrow: 'TRACK · 03',
    title: 'Senior PySpark',
    subtitle: 'Internals, multi-tenant ops, governance, scale.'
  },
  all: {
    accent: '#ffb59a',
    eyebrow: 'COURSE · ALL',
    title: 'PySpark, top to bottom',
    subtitle: 'Thirty chapters across three tiers. Free during beta.'
  }
};

const INK = '#0a0a0a';
const PAPER = '#fdf9f0';
const MUTED = 'rgba(253,249,240,0.6)';

export default function Image({ params }: { params: { category: string } }) {
  const slug = (params.category ?? 'all').toLowerCase();
  const key: Category = (['junior', 'mid', 'senior', 'all'] as const).includes(slug as Category)
    ? (slug as Category)
    : 'all';
  const p = PALETTE[key];

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
        {/* SCADA hairline */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 18, letterSpacing: 4, color: MUTED }}>
          <span>STABLEGRID.IO</span>
          <span>FREQ 50.02 Hz</span>
        </div>
        <div style={{ marginTop: 12, height: 3, width: '100%', background: 'rgba(253,249,240,0.16)', display: 'flex' }}>
          <div style={{ width: '38%', height: '100%', background: p.accent }} />
        </div>

        {/* Brand mark + eyebrow */}
        <div style={{ marginTop: 56, display: 'flex', alignItems: 'center', gap: 24 }}>
          <svg width="72" height="72" viewBox="0 0 100 100">
            <rect x="12" y="12" width="22" height="22" fill={PAPER} />
            <rect x="20" y="20" width="6" height="6" fill={INK} />
            <rect x="39" y="12" width="22" height="22" fill={PAPER} />
            <rect x="47" y="20" width="6" height="6" fill={INK} />
            <rect x="66" y="12" width="22" height="22" fill={PAPER} />
            <rect x="74" y="20" width="6" height="6" fill={INK} />
            <rect x="12" y="39" width="22" height="22" fill={p.accent} />
            <rect x="20" y="47" width="6" height="6" fill={INK} />
            <g stroke={PAPER} strokeOpacity={0.35} strokeWidth={2} fill="none">
              <rect x="39" y="39" width="22" height="22" />
              <rect x="66" y="39" width="22" height="22" />
              <rect x="12" y="66" width="22" height="22" />
              <rect x="39" y="66" width="22" height="22" />
              <rect x="66" y="66" width="22" height="22" />
            </g>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 18, letterSpacing: 4, color: p.accent }}>{p.eyebrow}</span>
            <span style={{ fontSize: 22, color: MUTED, marginTop: 4 }}>stablegrid.io</span>
          </div>
        </div>

        {/* Hero title */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 4, width: 80, background: p.accent, marginBottom: 24 }} />
          <h1 style={{ fontSize: 96, lineHeight: 1, margin: 0, fontWeight: 700, letterSpacing: -2 }}>
            {p.title}
          </h1>
          <p style={{ fontSize: 30, lineHeight: 1.35, marginTop: 24, color: MUTED, maxWidth: 880 }}>
            {p.subtitle}
          </p>
        </div>

        {/* Footer chip */}
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', fontSize: 18, letterSpacing: 4, color: MUTED }}>
          <span>→ STABLEGRID.IO/THEORY/{key.toUpperCase()}</span>
          <span>FREE DURING BETA</span>
        </div>
      </div>
    ),
    size
  );
}
