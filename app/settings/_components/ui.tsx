'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, XCircle } from 'lucide-react';
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
      className={`overflow-hidden rounded-2xl border bg-light-surface dark:bg-dark-surface ${
        danger
          ? 'border-error-200 dark:border-error-900/40'
          : 'border-light-border dark:border-dark-border'
      }`}
    >
      <header
        className={`flex items-center gap-2 border-b px-5 py-4 ${
          danger
            ? 'border-error-100 bg-error-50/40 dark:border-error-900/30 dark:bg-error-900/10'
            : 'border-light-border dark:border-dark-border'
        }`}
      >
        {icon ? <span className={danger ? 'text-error-500' : 'text-brand-500'}>{icon}</span> : null}
        <div>
          <h2
            className={`text-sm font-semibold ${
              danger
                ? 'text-error-700 dark:text-error-300'
                : 'text-text-light-primary dark:text-text-dark-primary'
            }`}
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              {description}
            </p>
          ) : null}
        </div>
      </header>
      <div className="p-5">{children}</div>
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
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
        {label}
      </span>
      {children}
      {hint ? (
        <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">{hint}</p>
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
      className="input"
    />
  );
}

export function SettingsPasswordInput({
  label,
  value,
  onChange,
  placeholder,
  hint
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <SettingsField label={label} hint={hint}>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="input pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light-tertiary hover:text-text-light-secondary dark:text-text-dark-tertiary dark:hover:text-text-dark-secondary"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </SettingsField>
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
      className={`inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full p-0.5 transition-colors ${
        checked
          ? 'bg-brand-500'
          : 'bg-light-border dark:bg-dark-border'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
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
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-light-border bg-light-surface p-6 shadow-2xl dark:border-dark-border dark:bg-dark-surface">
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
      ? 'border-error-200 bg-error-50 text-error-700 dark:border-error-900/30 dark:bg-error-900/20 dark:text-error-300'
      : toast.type === 'info'
        ? 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900/30 dark:bg-brand-900/20 dark:text-brand-300'
        : 'border-success-200 bg-success-50 text-success-700 dark:border-success-900/30 dark:bg-success-900/20 dark:text-success-300';

  return (
    <div className="fixed right-4 top-20 z-[90]">
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-lg ${colorClass}`}
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

  return new Date(createdAt).toLocaleDateString();
}
