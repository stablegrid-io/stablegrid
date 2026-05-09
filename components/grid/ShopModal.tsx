'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentCategory, ComponentSlug, GridStateResponse } from '@/types/grid';
import { Portal } from './Portal';
import { ShopCard } from './ShopCard';
import { CATEGORY_LABEL, CATEGORY_ORDER, categoryShapeMarkup } from './shapes';
import { CATEGORY_COLOR } from './tokens';

type Filter = 'all' | ComponentCategory;

interface ShopModalProps {
  data: GridStateResponse;
  purchasingSlug: ComponentSlug | null;
  onDeploy: (slug: string) => void;
  onOpenDetails?: (slug: string) => void;
  onHoverItem: (slug: ComponentSlug | null) => void;
  onClose: () => void;
  /** When true, the modal will not handle Escape — used while a child modal (e.g. FieldReport) is stacked on top. */
  suppressEsc?: boolean;
}

export function ShopModal({
  data,
  purchasingSlug,
  onDeploy,
  onOpenDetails,
  onHoverItem,
  onClose,
  suppressEsc
}: ShopModalProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 320);
    const onKey = (e: KeyboardEvent) => {
      if (suppressEsc) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, suppressEsc]);

  const filteredItems = useMemo(() => {
    const items =
      filter === 'all' ? data.shop : data.shop.filter((i) => i.component.category === filter);
    return items.slice().sort((a, b) => a.component.displayOrder - b.component.displayOrder);
  }, [data.shop, filter]);

  return (
    <Portal>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[115] flex items-stretch justify-center p-3 sm:p-6 bg-on-surface/40 backdrop-blur-sm"
        style={{ animation: 'shopmodal-fade 280ms ease-out' }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shopmodal-title"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[1440px] max-h-full bg-surface border border-on-surface flex flex-col overflow-hidden"
          style={{ animation: 'shopmodal-lift 360ms cubic-bezier(.16,1,.3,1)' }}
        >
          <header className="flex flex-wrap items-center justify-between gap-5 px-6 py-5 border-b border-on-surface flex-shrink-0">
            <div>
              <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant block mb-1">
                Component Catalog
              </span>
              <h2 id="shopmodal-title" className="font-h2 text-on-surface">
                Deploy to restore the grid
              </h2>
            </div>

            <div className="flex items-center gap-5">
              <span className="font-data-mono tabular-nums text-[12px] text-on-surface-variant">
                {data.state.districtsRestored} of 10 deployed ·{' '}
                <span className="text-on-surface">{data.balance.toLocaleString()} kWh</span> reserve
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close catalog"
                className="text-on-surface-variant hover:text-on-surface w-8 h-8 flex items-center justify-center text-[20px] leading-none transition-colors"
              >
                ×
              </button>
            </div>
          </header>

          <div
            role="tablist"
            aria-label="Filter by category"
            className="flex gap-2 px-6 py-3 border-b border-surface-dim overflow-x-auto flex-shrink-0"
          >
            <FilterChip
              label="All"
              count={data.shop.length}
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            />
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

          <div className="overflow-y-auto flex-1 min-h-0 p-5 sm:p-6">
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {filteredItems.map((item) => (
                <ShopCard
                  key={item.component.slug}
                  item={item}
                  onDeploy={onDeploy}
                  onOpenDetails={onOpenDetails}
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
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
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

function FilterChip({ label, count, active, shape, onClick }: FilterChipProps) {
  return (
    <button
      role="tab"
      aria-selected={active}
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 whitespace-nowrap px-3 py-1.5 border font-data-mono uppercase text-[10px] tracking-wider transition-colors ${
        active
          ? 'border-on-surface bg-on-surface text-on-primary'
          : 'border-surface-dim text-on-surface-variant hover:border-on-surface hover:text-on-surface'
      }`}
    >
      {shape && (
        <span
          aria-hidden
          className="inline-flex grid3d-legend-shape"
          style={{ width: 10, height: 10, color: 'currentColor' }}
          dangerouslySetInnerHTML={{ __html: shape }}
        />
      )}
      {label}
      <span className="tabular-nums opacity-60">{count}</span>
    </button>
  );
}
