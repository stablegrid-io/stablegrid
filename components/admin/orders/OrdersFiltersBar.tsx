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
import {
  ADMIN_DROPDOWN_SURFACE_CLASS,
  ADMIN_GHOST_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/components/admin/theme';

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
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
          strokeWidth={1.75}
        />
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search orders"
          aria-label="Search orders"
          className="h-9 w-full pl-9 pr-3 text-[13px] font-normal text-on-surface outline-none transition-colors placeholder:text-on-surface-variant border border-surface-dim bg-surface-container-low focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Result count */}
      <div className="hidden sm:flex items-baseline gap-1 shrink-0 px-1">
        <span className="font-data-mono text-[15px] tabular-nums text-on-surface leading-none">
          {resultCount}
        </span>
        <span className="font-data-mono text-[9px] tracking-[0.2em] uppercase text-on-surface-variant font-semibold">
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
              className={`inline-flex h-9 items-center px-3 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus:ring-primary/30 ${
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-surface-dim bg-surface text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="font-data-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold whitespace-nowrap">
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
          className={`${ADMIN_GHOST_BUTTON_CLASS} h-9 gap-1.5`}
        >
          <Columns3 className="h-3.5 w-3.5 text-on-surface-variant" strokeWidth={2} />
          <span className="font-data-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold text-on-surface">
            Columns
          </span>
        </button>

        {columnsOpen ? (
          <div
            role="menu"
            className={`absolute right-0 top-[calc(100%+8px)] z-30 w-56 p-1 ${ADMIN_DROPDOWN_SURFACE_CLASS}`}
          >
            <div className="px-3 py-2 font-data-mono text-[9px] tracking-[0.18em] uppercase font-semibold text-on-surface-variant">
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
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 transition-colors ${
                      checked
                        ? 'border border-primary bg-primary/10 text-primary'
                        : 'text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="font-data-mono text-[11px] tracking-[0.12em] uppercase font-semibold">
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
              className="mt-1 inline-flex w-full items-center justify-center gap-2 border border-surface-dim px-2 py-2 text-on-surface transition-colors hover:bg-surface-container-low"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="font-data-mono text-[10px] tracking-[0.14em] uppercase font-semibold">
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
        className={`${ADMIN_GHOST_BUTTON_CLASS} h-9 gap-1.5 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Download className="h-3.5 w-3.5 text-on-surface-variant" strokeWidth={2} />
        <span className="font-data-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold text-on-surface">
          Export
        </span>
      </button>

      {/* Primary action — New Order */}
      <button
        type="button"
        onClick={onNewOrder}
        className={`${ADMIN_PRIMARY_BUTTON_CLASS} h-9 inline-flex shrink-0 items-center gap-1.5 px-3`}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        <span className="font-data-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold">
          New Order
        </span>
      </button>
    </div>
  );
}
