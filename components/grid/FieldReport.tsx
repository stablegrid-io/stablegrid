'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GridComponent } from '@/types/grid';
import type { ComponentBriefing } from '@/lib/grid/briefings';
import { Portal } from './Portal';
import {
  CATEGORY_COLOR,
  PANEL_BG,
  PANEL_BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from './tokens';

interface FieldReportProps {
  component: GridComponent;
  briefing: ComponentBriefing;
  onClose: () => void;
  /** Shows a NEW DEPLOYMENT stamp. Omit when re-reading from the Field Archive. */
  isNewDeployment?: boolean;
}

type PageKey = 'image' | 'briefing' | 'operating' | 'horizon';

const PAGES: { key: PageKey; label: string }[] = [
  { key: 'image', label: 'Field Image' },
  { key: 'briefing', label: 'Briefing' },
  { key: 'operating', label: 'Operating Principle' },
  { key: 'horizon', label: 'Horizon' },
];

export function FieldReport({
  component,
  briefing,
  onClose,
  isNewDeployment = false,
}: FieldReportProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const articleRef = useRef<HTMLDivElement | null>(null);
  const proseRef = useRef<HTMLDivElement | null>(null);
  const color = CATEGORY_COLOR[component.category];
  const [pageIdx, setPageIdx] = useState(0);
  const page = PAGES[pageIdx];
  const isLast = pageIdx === PAGES.length - 1;
  const isFirst = pageIdx === 0;

  const go = (delta: number) => {
    setPageIdx((p) => Math.max(0, Math.min(PAGES.length - 1, p + delta)));
  };

  // Scroll prose to top whenever the page changes.
  useEffect(() => {
    proseRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [pageIdx]);

  // Reset to first page if the briefing changes (re-opening archive on another slug).
  useEffect(() => {
    setPageIdx(0);
  }, [briefing]);

  useEffect(() => {
    const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 320);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
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
        animation: 'fieldreport-fade 320ms ease-out',
      }}
    >
      <article
        ref={articleRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fieldreport-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: PANEL_BG,
          border: `1px solid ${PANEL_BORDER}`,
          borderLeft: `3px solid ${color}`,
          borderRadius: 16,
          padding: 'clamp(28px, 4vw, 56px)',
          maxWidth: 860,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: `0 24px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.02)`,
          animation: 'fieldreport-lift 460ms cubic-bezier(.16,1,.3,1)',
        }}
      >
        {/* Header */}
        <header
          style={{
            marginBottom: 22,
            paddingBottom: 18,
            borderBottom: `1px solid ${PANEL_BORDER}`,
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <div
            className="font-mono"
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
              fontSize: 11,
              letterSpacing: '0.2em',
              marginBottom: 14,
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            {isNewDeployment && (
              <span
                style={{
                  color,
                  border: `1px solid ${color}`,
                  borderRadius: 4,
                  padding: '3px 9px',
                  letterSpacing: '0.22em',
                }}
              >
                New Deployment
              </span>
            )}
            <span style={{ color: TEXT_TERTIARY }}>
              {component.name} · {component.districtName}
            </span>
          </div>

          <h2
            id="fieldreport-title"
            style={{
              fontSize: 'clamp(24px, 3.4vw, 34px)',
              fontWeight: 600,
              color: TEXT_PRIMARY,
              margin: 0,
              lineHeight: 1.16,
              letterSpacing: '-0.02em',
              fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
              paddingRight: 40,
            }}
          >
            {briefing.title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close field report"
            style={{
              position: 'absolute',
              top: -6,
              right: -10,
              width: 36,
              height: 36,
              background: 'transparent',
              border: 'none',
              color: TEXT_TERTIARY,
              fontSize: 22,
              lineHeight: 1,
              cursor: 'pointer',
              borderRadius: 8,
              transition: 'color 150ms ease, background 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = TEXT_PRIMARY; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_TERTIARY; e.currentTarget.style.background = 'transparent'; }}
          >
            ×
          </button>
        </header>

        {/* Page content */}
        <div
          ref={proseRef}
          key={page.key}
          style={{
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            animation: 'fieldreport-page 280ms ease-out',
            paddingRight: 4,
          }}
        >
          <section>
            {page.key !== 'image' && (
              <h3
                className="font-mono"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.22em',
                  color,
                  margin: '0 0 16px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {page.label}
              </h3>
            )}

            {page.key === 'image' && <HeroImage slug={component.slug} alt={component.name} teaser={briefing.teaser} accent={color} />}
            {page.key === 'briefing' && <Prose text={briefing.briefing} accent={color} />}
            {page.key === 'operating' &&
              briefing.operatingPrinciple.map((p, i) => (
                <Prose key={i} text={p} accent={color} />
              ))}
            {page.key === 'horizon' && <Prose text={briefing.horizon} accent={color} />}
          </section>
        </div>

        {/* Footer: pagination */}
        <footer
          style={{
            marginTop: 22,
            paddingTop: 18,
            borderTop: `1px solid ${PANEL_BORDER}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={isFirst}
            aria-label="Previous section"
            className="font-mono"
            style={{
              background: 'transparent',
              border: `1px solid ${isFirst ? 'transparent' : 'rgba(255,255,255,0.14)'}`,
              color: isFirst ? 'rgba(255,255,255,0.18)' : TEXT_SECONDARY,
              fontSize: 11,
              letterSpacing: '0.18em',
              padding: '10px 16px',
              borderRadius: 8,
              cursor: isFirst ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'border-color 150ms ease, color 150ms ease',
            }}
            onMouseEnter={(e) => { if (!isFirst) { e.currentTarget.style.color = TEXT_PRIMARY; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'; } }}
            onMouseLeave={(e) => { if (!isFirst) { e.currentTarget.style.color = TEXT_SECONDARY; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; } }}
          >
            <ChevronLeft size={14} strokeWidth={2.2} /> Prev
          </button>

          {/* Progress dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} aria-hidden>
            {PAGES.map((p, i) => {
              const active = i === pageIdx;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPageIdx(i)}
                  aria-label={`Jump to ${p.label}`}
                  style={{
                    width: active ? 22 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: active ? color : 'rgba(255,255,255,0.18)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'width 260ms ease, background 260ms ease',
                  }}
                />
              );
            })}
            <span
              className="font-mono tabular-nums"
              style={{ fontSize: 10, letterSpacing: '0.18em', color: TEXT_TERTIARY, marginLeft: 8 }}
            >
              {pageIdx + 1} / {PAGES.length}
            </span>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={() => (isLast ? onClose() : go(1))}
            className="font-mono"
            style={{
              background: isLast ? `${color}14` : 'transparent',
              border: `1px solid ${isLast ? color : 'rgba(255,255,255,0.14)'}`,
              color: isLast ? color : TEXT_SECONDARY,
              fontSize: 11,
              letterSpacing: '0.2em',
              padding: '10px 18px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'border-color 150ms ease, color 150ms ease, background 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (isLast) e.currentTarget.style.background = `${color}22`;
              else { e.currentTarget.style.color = TEXT_PRIMARY; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'; }
            }}
            onMouseLeave={(e) => {
              if (isLast) e.currentTarget.style.background = `${color}14`;
              else { e.currentTarget.style.color = TEXT_SECONDARY; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }
            }}
          >
            {isLast ? 'Return to Terminal' : <>Next <ChevronRight size={14} strokeWidth={2.2} /></>}
          </button>
        </footer>
      </article>

      <style jsx>{`
        @keyframes fieldreport-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fieldreport-lift {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fieldreport-page {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          article, div { animation: none !important; }
        }
      `}</style>
    </div>
    </Portal>
  );
}

function HeroImage({ slug, alt, teaser, accent }: { slug: string; alt: string; teaser: string; accent: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div style={{ margin: '0 0 18px' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(240px, 46vh, 460px)',
          borderRadius: 12,
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${accent}1f, rgba(10,12,14,0.9) 65%)`,
          border: `1px solid ${accent}33`,
        }}
      >
        {!failed && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/grid/components/${slug}.jpg`}
            alt={alt}
            onError={() => setFailed(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        {failed && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accent,
              fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
              fontSize: 12,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 600,
              opacity: 0.5,
            }}
          >
            {alt}
          </div>
        )}
      </div>
      {teaser && (
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: TEXT_SECONDARY,
            margin: '18px 0 0',
            fontStyle: 'italic',
            letterSpacing: '-0.003em',
          }}
        >
          {teaser}
        </p>
      )}
    </div>
  );
}

function Prose({ text, accent }: { text: string; accent: string }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <p
      style={{
        fontSize: 16,
        lineHeight: 1.78,
        color: TEXT_PRIMARY,
        margin: '0 0 18px',
        letterSpacing: '-0.003em',
      }}
    >
      {parts.map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <em key={i} style={{ color: accent, fontStyle: 'italic', fontWeight: 500 }}>
              {part.slice(1, -1)}
            </em>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </p>
  );
}
