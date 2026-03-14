'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Columns3, Download, Plus, RotateCcw, Search } from 'lucide-react';
import {
  ORDER_OPTIONAL_COLUMNS,
  ORDER_STATUS_FILTERS
} from '@/components/admin/orders/constants';
import type {
  OrderOptionalColumnId,
  OrderStatusFilter
} from '@/components/admin/orders/types';
import { ADMIN_DROPDOWN_SURFACE_CLASS } from '@/components/admin/theme';

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
  onResetOptionalColumns
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
}) {
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!columnsOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (!columnsRef.current?.contains(event.target)) {
        setColumnsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setColumnsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [columnsOpen]);

  return (
    <div className="space-y-4 border-b border-white/10 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-3">
          <div
            className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1"
            role="tablist"
            aria-label="Order status filter"
          >
            {ORDER_STATUS_FILTERS.map((option) => {
              const active = statusFilter === option;

              return (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onStatusFilterChange(option)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/35 ${
                    active
                      ? 'bg-[#101716] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                      : 'text-[#9db1a8] hover:text-white'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <label className="relative block w-full max-w-md">
            <span className="sr-only">Search orders</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f857c]" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search orders..."
              className="h-11 w-full rounded-[14px] border border-white/10 bg-white/[0.04] pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-[#6f857c] focus:border-brand-400/35 focus:ring-2 focus:ring-brand-400/15"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onNewOrder}
            className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-brand-300/35 bg-brand-500/90 px-3.5 text-sm font-semibold text-[#06110d] shadow-[0_14px_28px_-20px_rgba(34,185,153,0.52)] transition hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40"
          >
            <Plus className="h-4 w-4" />
            New Order
          </button>

          <div ref={columnsRef} className="relative">
            <button
              type="button"
              onClick={() => setColumnsOpen((current) => !current)}
              className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-white/12 bg-white/[0.04] px-3.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/35"
            >
              <Columns3 className="h-4 w-4 text-[#9cb0a7]" />
              Columns
            </button>

            {columnsOpen ? (
              <div
                className={`absolute right-0 top-[calc(100%+8px)] z-20 w-56 rounded-[14px] p-2 ${ADMIN_DROPDOWN_SURFACE_CLASS}`}
              >
                <div className="mb-1 px-2 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-[#7f948b]">
                  Optional columns
                </div>

                <div className="space-y-1">
                  {ORDER_OPTIONAL_COLUMNS.map((column) => {
                    const checked = visibleOptionalColumns.has(column.id);

                    return (
                      <button
                        key={column.id}
                        type="button"
                        onClick={() => onToggleOptionalColumn(column.id)}
                        className="flex w-full items-center justify-between rounded-[10px] px-2 py-2 text-sm text-[#d5e2dd] transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/30"
                      >
                        <span>{column.label}</span>
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-white/15 bg-white/[0.03]">
                          {checked ? <Check className="h-3 w-3 text-[#9df0d9]" /> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={onResetOptionalColumns}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-white/12 bg-white/[0.03] px-2 py-2 text-xs font-medium text-[#d5e2dd] transition hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/30"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset columns
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onExport}
            disabled={exportDisabled}
            className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-white/12 bg-white/[0.04] px-3.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/35 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Download className="h-4 w-4 text-[#9cb0a7]" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
