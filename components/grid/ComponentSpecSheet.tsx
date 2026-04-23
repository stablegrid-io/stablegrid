'use client';

import { useEffect, useRef, useState } from 'react';
import type { GridComponent } from '@/types/grid';
import type { ComponentSpec } from '@/lib/grid/spec-sheets';
import { Portal } from './Portal';
import {
  CATEGORY_COLOR,
  PANEL_BG,
  PANEL_BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from './tokens';

interface ComponentSpecSheetProps {
  component: GridComponent;
  spec: ComponentSpec;
  onClose: () => void;
}

export function ComponentSpecSheet({ component, spec, onClose }: ComponentSpecSheetProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const color = CATEGORY_COLOR[component.category];
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 320);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <Portal>
      <div
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(6,8,10,0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(16px, 3vw, 40px)',
          zIndex: 120,
          animation: 'specsheet-fade 280ms ease-out',
        }}
      >
        <article
          role="dialog"
          aria-modal="true"
          aria-labelledby="specsheet-title"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            background: PANEL_BG,
            border: `1px solid ${PANEL_BORDER}`,
            borderLeft: `3px solid ${color}`,
            borderRadius: 16,
            width: '100%',
            maxWidth: 860,
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,0,0,0.65)',
            animation: 'specsheet-lift 360ms cubic-bezier(.16,1,.3,1)',
          }}
        >
          {/* Hero image */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 220,
              background: `linear-gradient(135deg, ${color}1f, rgba(10,12,14,0.9) 65%)`,
              borderBottom: `1px solid ${PANEL_BORDER}`,
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {!imageFailed && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`/grid/components/${component.slug}.jpg`}
                alt=""
                onError={() => setImageFailed(true)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'saturate(0.9) contrast(1.05)',
                }}
              />
            )}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to bottom, rgba(10,12,14,0) 40%, rgba(10,12,14,0.8) 100%)',
                pointerEvents: 'none',
              }}
            />
            <span
              className="font-mono"
              style={{
                position: 'absolute',
                top: 16,
                left: 20,
                fontSize: 10,
                letterSpacing: '0.22em',
                padding: '4px 10px',
                borderRadius: 4,
                background: `${color}20`,
                color,
                border: `1px solid ${color}55`,
                textTransform: 'uppercase',
                fontWeight: 600,
                backdropFilter: 'blur(4px)',
              }}
            >
              {component.category}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close spec sheet"
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 36,
                height: 36,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(10,12,14,0.55)',
                border: `1px solid rgba(255,255,255,0.1)`,
                color: TEXT_PRIMARY,
                fontSize: 20,
                lineHeight: 1,
                cursor: 'pointer',
                borderRadius: 8,
                backdropFilter: 'blur(6px)',
                transition: 'background 150ms ease, border-color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(10,12,14,0.8)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(10,12,14,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              minHeight: 0,
              padding: 'clamp(22px, 3vw, 36px)',
            }}
          >
            <header style={{ marginBottom: 24 }}>
              <div
                className="font-mono"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.22em',
                  color: TEXT_TERTIARY,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                {component.districtName}
              </div>
              <h2
                id="specsheet-title"
                style={{
                  fontSize: 'clamp(22px, 3vw, 30px)',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  color: TEXT_PRIMARY,
                  margin: 0,
                  lineHeight: 1.18,
                  fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
                }}
              >
                {component.name}
              </h2>
            </header>

            <Section label="Description" accent={color}>
              <p style={proseStyle}>{spec.description}</p>
            </Section>

            <Section label="Function" accent={color}>
              <p style={proseStyle}>{spec.function}</p>
            </Section>

            <Section label="Parameters" accent={color}>
              <dl
                style={{
                  margin: 0,
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 0,
                  border: `1px solid ${PANEL_BORDER}`,
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                {spec.parameters.map((p, i) => (
                  <div
                    key={p.label}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
                      borderTop: i === 0 ? 'none' : `1px solid ${PANEL_BORDER}`,
                    }}
                  >
                    <dt
                      className="font-mono"
                      style={{
                        padding: '12px 16px',
                        fontSize: 11,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: TEXT_TERTIARY,
                        fontWeight: 600,
                        background: 'rgba(255,255,255,0.015)',
                      }}
                    >
                      {p.label}
                    </dt>
                    <dd
                      className="tabular-nums"
                      style={{
                        margin: 0,
                        padding: '12px 16px',
                        fontSize: 13.5,
                        color: TEXT_PRIMARY,
                        fontWeight: 500,
                      }}
                    >
                      {p.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Section>

            <div
              className="font-mono"
              style={{
                marginTop: 32,
                paddingTop: 18,
                borderTop: `1px solid ${PANEL_BORDER}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 16,
                fontSize: 11,
                letterSpacing: '0.18em',
                color: TEXT_TERTIARY,
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              <span>Deploy cost</span>
              <span className="tabular-nums" style={{ color: TEXT_PRIMARY, fontSize: 14 }}>
                {component.costKwh.toLocaleString()}{' '}
                <span style={{ fontSize: 10, color: TEXT_TERTIARY, marginLeft: 2 }}>kWh</span>
              </span>
            </div>
          </div>
        </article>

        <style jsx>{`
          @keyframes specsheet-fade { from { opacity: 0; } to { opacity: 1; } }
          @keyframes specsheet-lift {
            from { opacity: 0; transform: translateY(14px) scale(0.985); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @media (prefers-reduced-motion: reduce) {
            article, div { animation: none !important; }
          }
        `}</style>
      </div>
    </Portal>
  );
}

const proseStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.65,
  color: TEXT_SECONDARY,
  margin: 0,
  letterSpacing: '-0.003em',
};

function Section({ label, accent, children }: { label: string; accent: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h3
        className="font-mono"
        style={{
          fontSize: 11,
          letterSpacing: '0.22em',
          color: accent,
          margin: '0 0 12px',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </h3>
      {children}
    </section>
  );
}
