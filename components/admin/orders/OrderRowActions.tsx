'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { ORDER_ACTIONS } from '@/components/admin/orders/constants';
import { ADMIN_DROPDOWN_SURFACE_CLASS } from '@/components/admin/theme';

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
        className="inline-flex h-8 w-8 items-center justify-center  border border-outline-variant/20 bg-surface-container-low text-[#b9cbc4] transition hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/30"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open ? (
        <div
          className={`absolute right-0 top-[calc(100%+6px)] z-20 w-36  p-1.5 ${ADMIN_DROPDOWN_SURFACE_CLASS}`}
          onClick={(event) => event.stopPropagation()}
        >
          {ORDER_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => {
                onAction(action);
                setOpen(false);
              }}
              className="flex w-full items-center rounded-[9px] px-2.5 py-2 text-left text-sm text-[#d5e2dd] transition hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/30"
            >
              {action}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
