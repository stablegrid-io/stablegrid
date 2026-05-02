'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Columns3, Download, Plus, RotateCcw, Search } from 'lucide-react';
import {
  ORDER_OPTIONAL_COLUMNS,
  ORDER_STATUS_FILTERS,
} from '@/components/admin/orders/constants';
import type {
  OrderOptionalColumnId,
  OrderStatusFilter,
} from '@/components/admin/orders/types';
import { ADMIN_DROPDOWN_SURFACE_CLASS } from '@/components/admin/theme';

const ACCENT = '153,247,255';

const toolbarButtonStyle = (open?: boolean): React.CSSProperties => ({
  borderRadius: 10,
  background: open ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
  border: `1px solid ${open ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
});

export function OrdersFiltersBar({
  statusFilter,
  onStatusFilterChange,
  query,
  onQueryChange,
  onNewOrder,
  onExport,
  exportDisabled,
  visibleOptionalColumns,
  onToggleOptionalColumn,
  onResetOptionalColumns,
  resultCount,
}: {
  statusFilter: OrderStatusFilter;
  onStatusFilterChange: (value: OrderStatusFilter) => void;
  query: string;
  onQueryChange: (value: string) => void;
  onNewOrder: () => void;
  onExport: () => void;
  exportDisabled: boolean;
  visibleOptionalColumns: Set<OrderOptionalColumnId>;
  onToggleOptionalColumn: (columnId: OrderOptionalColumnId) => void;
  onResetOptionalColumns: () => void;
  resultCount: number;
}) {
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!columnsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!columnsRef.current?.contains(event.target)) setColumnsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setColumnsOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [columnsOpen]);

  return (
    <div className="flex flex-wrap items-center gap-2 px-2.5 py-2.5">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px]">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50"
          strokeWidth={1.75}
        />
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search orders"
          aria-label="Search orders"
          className="h-9 w-full pl-9 pr-3 text-[13px] font-normal text-white outline-none transition-all placeholder:text-white/50"
          style={{
            borderRadius: 10,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.borderColor = `rgba(${ACCENT},0.4)`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        />
      </div>

      {/* Result count */}
      <div className="hidden sm:flex items-baseline gap-1 shrink-0 px-1">
        <span className="font-mono text-[15px] tabular-nums text-white/95 leading-none">
          {resultCount}
        </span>
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/55 font-semibold">
          {resultCount === 1 ? 'order' : 'orders'}
        </span>
      </div>

      {/* Status pills */}
      <div className="inline-flex items-center gap-1 shrink-0" role="tablist">
        {ORDER_STATUS_FILTERS.map((option) => {
          const active = statusFilter === option;
          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onStatusFilterChange(option)}
              className="h-9 px-3 transition-all"
              style={{
                borderRadius: 10,
                background: active ? `rgba(${ACCENT},0.14)` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? `rgba(${ACCENT},0.4)` : 'rgba(255,255,255,0.1)'}`,
                color: active ? `rgb(${ACCENT})` : 'rgba(255,255,255,0.78)',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            >
              <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold whitespace-nowrap">
                {option}
              </span>
            </button>
          );
        })}
      </div>

      {/* Columns dropdown */}
      <div ref={columnsRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setColumnsOpen((current) => !current)}
          aria-expanded={columnsOpen}
          aria-haspopup="menu"
          className="inline-flex h-9 items-center gap-1.5 px-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.35)]"
          style={toolbarButtonStyle(columnsOpen)}
          onMouseEnter={(e) => {
            if (!columnsOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
          }}
          onMouseLeave={(e) => {
            if (!columnsOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          }}
        >
          <Columns3 className="h-3.5 w-3.5 text-white/55" strokeWidth={2} />
          <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold text-white/78">
            Columns
          </span>
        </button>

        {columnsOpen ? (
          <div
            role="menu"
            className={`absolute right-0 top-[calc(100%+8px)] z-30 w-56 p-1 ${ADMIN_DROPDOWN_SURFACE_CLASS}`}
          >
            <div className="px-3 py-2 font-mono text-[9px] tracking-[0.18em] uppercase font-semibold text-white/55">
              Optional columns
            </div>
            <div className="space-y-0.5">
              {ORDER_OPTIONAL_COLUMNS.map((column) => {
                const checked = visibleOptionalColumns.has(column.id);
                return (
                  <button
                    key={column.id}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={checked}
                    onClick={() => onToggleOptionalColumn(column.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 transition-all"
                    style={{
                      color: checked ? `rgb(${ACCENT})` : 'rgba(255,255,255,0.78)',
                      background: checked ? `rgba(${ACCENT},0.14)` : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!checked) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      if (!checked) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span className="font-mono text-[11px] tracking-[0.12em] uppercase font-semibold">
                      {column.label}
                    </span>
                    {checked ? (
                      <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                    ) : (
                      <span className="inline-block h-3.5 w-3.5 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={onResetOptionalColumns}
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-2 py-2 text-white/70 transition hover:bg-white/[0.06]"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="font-mono text-[10px] tracking-[0.14em] uppercase font-semibold">
                Reset
              </span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Export */}
      <button
        type="button"
        onClick={onExport}
        disabled={exportDisabled}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 px-3 transition-all disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.35)]"
        style={toolbarButtonStyle()}
        onMouseEnter={(e) => {
          if (!exportDisabled) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        }}
      >
        <Download className="h-3.5 w-3.5 text-white/55" strokeWidth={2} />
        <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold text-white/78">
          Export
        </span>
      </button>

      {/* Primary action — New Order (cyan accent fill) */}
      <button
        type="button"
        onClick={onNewOrder}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 px-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.35)]"
        style={{
          borderRadius: 10,
          background: `rgba(${ACCENT},0.14)`,
          border: `1px solid rgba(${ACCENT},0.4)`,
          color: `rgb(${ACCENT})`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `rgba(${ACCENT},0.2)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `rgba(${ACCENT},0.14)`;
        }}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold">
          New Order
        </span>
      </button>
    </div>
  );
}
