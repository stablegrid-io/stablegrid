import type { Metadata } from 'next';
import Link from 'next/link';
import { SLIDES } from './_slides';

export const metadata: Metadata = {
  title: 'Beta cards',
  robots: { index: false, follow: false },
};

const PREVIEW_SCALE = 0.32;

export default function BetaCardsIndexPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F1115',
        color: '#E8E8E8',
        padding: '64px 40px 120px',
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <header style={{ marginBottom: 48 }}>
          <div
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 12,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            stablegrid.io · internal
          </div>
          <h1
            style={{
              fontWeight: 700,
              fontSize: 40,
              letterSpacing: '-0.025em',
              marginTop: 8,
            }}
          >
            Beta launch cards
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 16,
              lineHeight: 1.55,
              maxWidth: 720,
              marginTop: 12,
            }}
          >
            Click a card to open it at full size, then export as PNG. Run{' '}
            <code
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                backgroundColor: 'rgba(255,255,255,0.07)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              node tools/render-beta-cards.mjs
            </code>{' '}
            (with{' '}
            <code
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                backgroundColor: 'rgba(255,255,255,0.07)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              npm run dev
            </code>{' '}
            running) to batch-export all of them as PNG to{' '}
            <code
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                backgroundColor: 'rgba(255,255,255,0.07)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              ./beta-cards-out/
            </code>
            .
          </p>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 32,
          }}
        >
          {SLIDES.map(({ id, label, width, height, Component }) => (
            <Link
              key={id}
              href={`/beta-card/${id}`}
              style={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  width: width * PREVIEW_SCALE,
                  height: height * PREVIEW_SCALE,
                  overflow: 'hidden',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                }}
              >
                <div
                  style={{
                    transform: `scale(${PREVIEW_SCALE})`,
                    transformOrigin: 'top left',
                    width,
                    height,
                  }}
                >
                  <Component />
                </div>
              </div>
              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                <span style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {label}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {width}×{height}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
