'use client';

import { useCallback, useState } from 'react';

export interface ToastData {
  msg: string;
  color: string;
}

export function GameToast({ msg, color }: ToastData) {
  return (
    <div
      className="pointer-events-none fixed left-1/2 top-[70px] z-[200] -translate-x-1/2 whitespace-nowrap font-mono text-[11px] font-bold uppercase tracking-[0.2em]"
      style={{
        padding: '10px 24px',
        background: '#0a1420',
        border: `2px solid ${color}`,
        color,
        animation: 'toastIn 0.3s ease',
      }}
    >
      {msg}
    </div>
  );
}

export function useGameToast(duration = 2200) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const show = useCallback(
    (msg: string, color: string) => {
      setToast({ msg, color });
      setTimeout(() => setToast(null), duration);
    },
    [duration]
  );
  return { toast, show };
}
