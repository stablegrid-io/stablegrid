'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { ORDER_ACTIONS } from '@/components/admin/orders/constants';
import {
  ADMIN_DROPDOWN_SURFACE_CLASS,
  ADMIN_GHOST_BUTTON_CLASS,
} from '@/components/admin/theme';

export function OrderRowActions({
  orderNumber,
  onAction
}: {
  orderNumber: string;
  onAction: (action: (typeof ORDER_ACTIONS)[number]) => void;
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
    <div ref={rootRef} className="relative flex justify-end">
      <button
        type="button"
        aria-label={`Order actions for ${orderNumber}`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className={`${ADMIN_GHOST_BUTTON_CLASS} h-8 w-8 justify-center px-0`}
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
      </button>

      {open ? (
        <div
          role="menu"
          className={`absolute right-0 top-[calc(100%+6px)] z-30 w-44 p-1 ${ADMIN_DROPDOWN_SURFACE_CLASS}`}
          onClick={(event) => event.stopPropagation()}
        >
          {ORDER_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              role="menuitem"
              onClick={() => {
                onAction(action);
                setOpen(false);
              }}
              className="flex w-full items-center px-3 py-2 text-left transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus:ring-primary/30"
            >
              <span className="font-data-mono text-[11px] tracking-[0.12em] uppercase font-semibold text-on-surface">
                {action}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
