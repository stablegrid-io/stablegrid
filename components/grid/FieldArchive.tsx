'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { ComponentSlug } from '@/types/grid';
import { GRID_COMPONENTS } from '@/lib/grid/components';
import { BRIEFINGS } from '@/lib/grid/briefings';
import { Portal } from './Portal';
import {
  CATEGORY_COLOR,
  PANEL_BG,
  PANEL_BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from './tokens';

interface FieldArchiveProps {
  deployedSlugs: readonly ComponentSlug[];
  onOpenBriefing: (slug: ComponentSlug) => void;
  onClose: () => void;
}

export function FieldArchive({ deployedSlugs, onOpenBriefing, onClose }: FieldArchiveProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const deployed = useMemo(() => new Set(deployedSlugs), [deployedSlugs]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rows = useMemo(
    () => [...GRID_COMPONENTS].sort((a, b) => a.displayOrder - b.displayOrder),
    [],
  );
  const readCount = rows.filter((c) => deployed.has(c.slug)).length;

  return (
    <Portal>
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6,8,10,0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'flex-end',
        zIndex: 115,
        animation: 'archive-fade 260ms ease-out',
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px, 100%)',
          background: PANEL_BG,
          borderLeft: `1px solid ${PANEL_BORDER}`,
          display: 'flex',
          flexDirection: 'column',
          animation: 'archive-slide 340ms cubic-bezier(.16,1,.3,1)',
        }}
      >
        <header
          style={{
            padding: '26px 28px 18px',
            borderBottom: `1px solid ${PANEL_BORDER}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div>
            <div
              className="font-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.22em',
                color: TEXT_TERTIARY,
                textTransform: 'uppercase',
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Field Archive
            </div>
            <h2
              id="archive-title"
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.015em',
                color: TEXT_PRIMARY,
                margin: 0,
                fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
              }}
            >
              Briefings on file
            </h2>
            <p
              className="font-mono tabular-nums"
              style={{ fontSize: 11, color: TEXT_TERTIARY, letterSpacing: '0.12em', margin: '6px 0 0' }}
            >
              {readCount} of 10 available to re-read
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close archive"
            style={{
              background: 'transparent',
              border: 'none',
              color: TEXT_TERTIARY,
              fontSize: 20,
              lineHeight: 1,
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = TEXT_PRIMARY; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_TERTIARY; }}
          >
            ×
          </button>
        </header>

        <div style={{ overflowY: 'auto', padding: '10px 16px 28px', flex: 1 }}>
          {rows.map((c) => {
            const isDeployed = deployed.has(c.slug);
            const briefing = BRIEFINGS[c.slug];
            const color = CATEGORY_COLOR[c.category];
            return (
              <button
                key={c.slug}
                type="button"
                disabled={!isDeployed}
                onClick={() => isDeployed && onOpenBriefing(c.slug)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  border: '1px solid transparent',
                  borderRadius: 12,
                  padding: '14px 12px',
                  cursor: isDeployed ? 'pointer' : 'not-allowed',
                  opacity: isDeployed ? 1 : 0.5,
                  transition: 'background 150ms ease, border-color 150ms ease',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                }}
                onMouseEnter={(e) => {
                  if (!isDeployed) return;
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = PANEL_BORDER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <span
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    marginTop: 4,
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: isDeployed ? color : 'rgba(255,255,255,0.12)',
                    boxShadow: isDeployed ? `0 0 8px ${color}80` : undefined,
                  }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.2em',
                      color: TEXT_TERTIARY,
                      textTransform: 'uppercase',
                      marginBottom: 4,
                      fontWeight: 600,
                    }}
                  >
                    {c.category} · {c.districtName}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: TEXT_PRIMARY,
                      letterSpacing: '-0.005em',
                      marginBottom: 4,
                      fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
                    }}
                  >
                    {briefing.title}
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.55, color: TEXT_SECONDARY }}>
                    {isDeployed ? briefing.teaser : <span style={{ fontStyle: 'italic' }}>Locked until deployed.</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <style jsx>{`
        @keyframes archive-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes archive-slide {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          aside { animation: none !important; }
        }
      `}</style>
    </div>
    </Portal>
  );
}
