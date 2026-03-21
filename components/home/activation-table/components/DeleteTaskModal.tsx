'use client';

import { useEffect } from 'react';

interface DeleteTaskModalProps {
  task: { id: string; title: string } | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteTaskModal({ task, isPending, onClose, onConfirm }: DeleteTaskModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || isPending) return;
      onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPending, onClose]);

  if (!task) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#05070c]/84 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        className="w-full max-w-md rounded-[20px] border border-[#2b322f] bg-[linear-gradient(180deg,rgba(5,7,7,0.98),rgba(3,4,4,0.97))] p-5 shadow-[0_30px_90px_-44px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9db2a7]">
          Delete
        </p>
        <h3 id="delete-modal-title" className="mt-2 text-lg font-semibold text-[#edf3ef]">
          Delete task?
        </h3>
        <p className="mt-2 text-sm text-[#9ba7a2]">
          This will remove{' '}
          <span className="font-medium text-[#dce8e3]">{task.title}</span>{' '}
          from your Activation Table.
        </p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-[11px] border border-[#2f3633] bg-[#0b0f0f] px-3.5 py-2 text-xs font-medium text-[#a8b6b0] transition-colors hover:border-[#4c655a] hover:bg-[#111615] hover:text-[#e4ece8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-[11px] border border-[#a98b8b] bg-[#bca3a3] px-3.5 py-2 text-xs font-semibold text-[#1a1111] transition-all hover:border-[#c0a0a0] hover:bg-[#c9afaf] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Deleting...' : 'Confirm delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
