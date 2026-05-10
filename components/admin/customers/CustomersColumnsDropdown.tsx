'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Columns3, RotateCcw } from 'lucide-react';
import { CUSTOMER_COLUMNS } from '@/components/admin/customers/constants';
import type { CustomerColumnId } from '@/components/admin/customers/types';
import {
  ADMIN_DROPDOWN_SURFACE_CLASS,
  ADMIN_GHOST_BUTTON_CLASS,
} from '@/components/admin/theme';

export function CustomersColumnsDropdown({
  visibleColumns,
  onToggle,
  onReset,
}: {
  visibleColumns: Set<CustomerColumnId>;
  onToggle: (columnId: CustomerColumnId) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`${ADMIN_GHOST_BUTTON_CLASS} h-9 gap-1.5 ${
          open ? 'bg-surface-container' : ''
        }`}
      >
        <Columns3 className="h-3.5 w-3.5 text-on-surface-variant" strokeWidth={2} />
        <span className="font-data-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold text-on-surface">
          Columns
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className={`absolute right-0 top-[calc(100%+8px)] z-30 w-56 p-1 ${ADMIN_DROPDOWN_SURFACE_CLASS}`}
        >
          <div className="px-3 py-2 font-data-mono text-[9px] tracking-[0.18em] uppercase font-semibold text-on-surface-variant">
            Visible columns
          </div>
          <div className="space-y-0.5">
            {CUSTOMER_COLUMNS.filter((column) => column.toggleable !== false).map(
              (column) => {
                const checked = visibleColumns.has(column.id);
                return (
                  <button
                    key={column.id}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={checked}
                    onClick={() => onToggle(column.id)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-surface-container-low ${
                      checked ? 'text-primary' : 'text-on-surface'
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
              },
            )}
          </div>
          <button
            type="button"
            onClick={onReset}
            className="mt-1 inline-flex w-full items-center justify-center gap-2 border border-surface-dim bg-surface px-2 py-2 text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="font-data-mono text-[10px] tracking-[0.14em] uppercase font-semibold">
              Reset columns
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
