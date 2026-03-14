'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Columns3, RotateCcw } from 'lucide-react';
import { CUSTOMER_COLUMNS } from '@/components/admin/customers/constants';
import type { CustomerColumnId } from '@/components/admin/customers/types';

export function CustomersColumnsDropdown({
  visibleColumns,
  onToggle,
  onReset
}: {
  visibleColumns: Set<CustomerColumnId>;
  onToggle: (columnId: CustomerColumnId) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-white/12 bg-white/[0.04] px-3.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/35"
      >
        <Columns3 className="h-4 w-4 text-[#9cb0a7]" />
        Columns
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-56 rounded-[14px] border border-white/14 bg-[linear-gradient(180deg,rgba(16,22,22,0.96),rgba(8,12,12,0.96))] p-2 shadow-[0_24px_42px_-24px_rgba(0,0,0,0.95)] backdrop-blur-xl">
          <div className="mb-1 px-2 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-[#7f948b]">
            Visible columns
          </div>
          <div className="space-y-1">
            {CUSTOMER_COLUMNS.filter((column) => column.toggleable !== false).map((column) => {
              const checked = visibleColumns.has(column.id);

              return (
                <button
                  key={column.id}
                  type="button"
                  onClick={() => onToggle(column.id)}
                  aria-label={`Toggle ${column.label} column`}
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
            onClick={onReset}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-white/12 bg-white/[0.03] px-2 py-2 text-xs font-medium text-[#d5e2dd] transition hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/30"
          >
            <RotateCcw className="h-3 w-3" />
            Reset columns
          </button>
        </div>
      ) : null}
    </div>
  );
}
