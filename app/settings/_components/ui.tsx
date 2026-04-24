'use client';

import type { ReactNode } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { ToastPayload } from './types';

export function SettingsCard({
  title,
  description,
  icon,
  children,
  danger = false
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[22px] border ${
        danger
          ? 'border-error/20'
          : 'border-outline-variant/20'
      }`}
    >
      <header
        className={`flex items-center gap-2 border-b px-5 py-4 ${
          danger
            ? 'border-error/10 bg-error/5'
            : 'border-outline-variant/10 bg-surface-container-low'
        }`}
      >
        {icon ? <span className={danger ? 'text-error' : 'text-primary'}>{icon}</span> : null}
        <div>
          <h2
            className={`text-sm font-mono font-bold uppercase tracking-wider ${
              danger ? 'text-error' : 'text-on-surface'
            }`}
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-[10px] text-on-surface-variant">{description}</p>
          ) : null}
        </div>
      </header>
      <div className="p-5 bg-surface">{children}</div>
    </section>
  );
}

export function SettingsField({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-on-surface-variant">
        {label}
      </span>
      {children}
      {hint ? (
        <p className="text-[9px] text-on-surface-variant">{hint}</p>
      ) : null}
    </label>
  );
}

export function SettingsInput({
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-[14px] bg-surface-container-low border border-outline-variant/30 px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
    />
  );
}

export function SettingsToggle({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[22px] w-[38px] flex-shrink-0 items-center rounded-full p-[2px] transition-colors duration-200 ease-in-out ${
        checked
          ? 'bg-primary'
          : 'bg-white/[0.08]'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`block h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function SettingsModal({
  open,
  onClose,
  children
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-[22px] border border-outline-variant/30 bg-surface p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

export function SettingsToast({ toast }: { toast: ToastPayload | null }) {
  if (!toast) {
    return null;
  }

  const colorClass =
    toast.type === 'error'
      ? 'border-error/30 bg-error/10 text-error'
      : toast.type === 'info'
        ? 'border-primary/30 bg-primary/10 text-primary'
        : 'border-primary/30 bg-primary/10 text-primary';

  return (
    <div className="fixed right-4 top-20 z-[90]">
      <div
        className={`flex items-center gap-2 rounded-[14px] border px-3 py-2 text-xs shadow-lg ${colorClass}`}
      >
        {toast.type === 'error' ? (
          <XCircle className="h-4 w-4" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

export function formatMemberSince(createdAt: string | null): string {
  if (!createdAt) {
    return '—';
  }

  return new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
