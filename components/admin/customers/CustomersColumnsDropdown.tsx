'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Columns3, RotateCcw } from 'lucide-react';
import { CUSTOMER_COLUMNS } from '@/components/admin/customers/constants';
import type { CustomerColumnId } from '@/components/admin/customers/types';
import { ADMIN_DROPDOWN_SURFACE_CLASS } from '@/components/admin/theme';

const ACCENT = '153,247,255';

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
        className="inline-flex h-9 items-center gap-1.5 px-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.35)]"
        style={{
          borderRadius: 10,
          background: open ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${open ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        }}
      >
        <Columns3 className="h-3.5 w-3.5 text-white/55" strokeWidth={2} />
        <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold text-white/78">
          Columns
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className={`absolute right-0 top-[calc(100%+8px)] z-30 w-56 p-1 ${ADMIN_DROPDOWN_SURFACE_CLASS}`}
        >
          <div className="px-3 py-2 font-mono text-[9px] tracking-[0.18em] uppercase font-semibold text-white/55">
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
              },
            )}
          </div>
          <button
            type="button"
            onClick={onReset}
            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-2 py-2 text-white/70 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.3)]"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase font-semibold">
              Reset columns
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
