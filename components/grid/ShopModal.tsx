'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentCategory, ComponentSlug, GridStateResponse } from '@/types/grid';
import { Portal } from './Portal';
import { ShopCard } from './ShopCard';
import { CATEGORY_LABEL, CATEGORY_ORDER, categoryShapeMarkup } from './shapes';
import {
  BRAND_CYAN,
  CATEGORY_COLOR,
  PANEL_BG,
  PANEL_BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from './tokens';

type Filter = 'all' | ComponentCategory;

interface ShopModalProps {
  data: GridStateResponse;
  purchasingSlug: ComponentSlug | null;
  onDeploy: (slug: string) => void;
  onHoverItem: (slug: ComponentSlug | null) => void;
  onClose: () => void;
}

export function ShopModal({ data, purchasingSlug, onDeploy, onHoverItem, onClose }: ShopModalProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 320);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const filteredItems = useMemo(() => {
    const items = filter === 'all' ? data.shop : data.shop.filter((i) => i.component.category === filter);
    return items.slice().sort((a, b) => a.component.displayOrder - b.component.displayOrder);
  }, [data.shop, filter]);

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
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: 'clamp(12px, 2.5vw, 32px)',
        zIndex: 115,
        animation: 'shopmodal-fade 280ms ease-out',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shopmodal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 1180,
          maxHeight: '100%',
          background: PANEL_BG,
          border: `1px solid ${PANEL_BORDER}`,
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          animation: 'shopmodal-lift 360ms cubic-bezier(.16,1,.3,1)',
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: '22px 26px',
            borderBottom: `1px solid ${PANEL_BORDER}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
            flexShrink: 0,
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
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              Component Catalog
            </div>
            <h2
              id="shopmodal-title"
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.015em',
                color: TEXT_PRIMARY,
                margin: 0,
                fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
              }}
            >
              Deploy to restore the grid
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div className="font-mono tabular-nums" style={{ fontSize: 11, color: TEXT_TERTIARY, letterSpacing: '0.1em' }}>
              {data.state.districtsRestored} of 10 deployed ·{' '}
              <span style={{ color: BRAND_CYAN, fontWeight: 600 }}>{data.balance.toLocaleString()} kWh</span> reserve
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close catalog"
              style={{
                background: 'transparent',
                border: 'none',
                color: TEXT_TERTIARY,
                fontSize: 22,
                lineHeight: 1,
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: 8,
                transition: 'color 150ms ease, background 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = TEXT_PRIMARY; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_TERTIARY; e.currentTarget.style.background = 'transparent'; }}
            >
              ×
            </button>
          </div>
        </header>

        {/* Category filter strip */}
        <div
          role="tablist"
          aria-label="Filter by category"
          style={{
            display: 'flex',
            gap: 8,
            padding: '14px 26px',
            borderBottom: `1px solid ${PANEL_BORDER}`,
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          <FilterChip label="All" count={data.shop.length} active={filter === 'all'} onClick={() => setFilter('all')} />
          {CATEGORY_ORDER.map((cat) => {
            const n = data.shop.filter((i) => i.component.category === cat).length;
            if (n === 0) return null;
            return (
              <FilterChip
                key={cat}
                label={CATEGORY_LABEL[cat]}
                count={n}
                active={filter === cat}
                accent={CATEGORY_COLOR[cat]}
                shape={categoryShapeMarkup(cat)}
                onClick={() => setFilter(cat)}
              />
            );
          })}
        </div>

        {/* Cards grid */}
        <div
          style={{
            padding: 'clamp(18px, 2.5vw, 26px)',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 18,
            }}
          >
            {filteredItems.map((item) => (
              <ShopCard
                key={item.component.slug}
                item={item}
                onDeploy={onDeploy}
                isPurchasing={purchasingSlug === item.component.slug}
                onHoverChange={(hovering) =>
                  onHoverItem(hovering ? (item.component.slug as ComponentSlug) : null)
                }
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shopmodal-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shopmodal-lift {
          from { opacity: 0; transform: translateY(16px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          div { animation: none !important; }
        }
      `}</style>
    </div>
    </Portal>
  );
}

interface FilterChipProps {
  label: string;
  count: number;
  active: boolean;
  accent?: string;
  shape?: string;
  onClick: () => void;
}

function FilterChip({ label, count, active, accent, shape, onClick }: FilterChipProps) {
  const color = accent ?? BRAND_CYAN;
  return (
    <button
      role="tab"
      aria-selected={active}
      type="button"
      onClick={onClick}
      className="font-mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 999,
        border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
        background: active ? `${color}14` : 'transparent',
        color: active ? color : TEXT_SECONDARY,
        fontSize: 10,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background 150ms ease, border-color 150ms ease, color 150ms ease',
      }}
      onMouseEnter={(e) => {
        if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.24)'; e.currentTarget.style.color = TEXT_PRIMARY; }
      }}
      onMouseLeave={(e) => {
        if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = TEXT_SECONDARY; }
      }}
    >
      {shape && (
        <span
          aria-hidden
          className="grid3d-legend-shape"
          style={{ width: 11, height: 11, color, display: 'inline-flex', filter: `drop-shadow(0 0 3px ${color}80)` }}
          dangerouslySetInnerHTML={{ __html: shape }}
        />
      )}
      {label}
      <span className="tabular-nums" style={{ opacity: 0.6, fontWeight: 500 }}>{count}</span>
    </button>
  );
}
