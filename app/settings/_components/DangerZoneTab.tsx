'use client';

import { useState } from 'react';
import { AlertTriangle, Download, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SettingsCard, SettingsInput, SettingsModal } from './ui';

interface DangerZoneTabProps {
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const REASONS = [
  "I'm not using it anymore",
  "It's too expensive",
  'I found a better tool',
  'Missing features I need',
  'Other'
] as const;

export function DangerZoneTab({ onToast }: DangerZoneTabProps) {
  const router = useRouter();
  const supabase = createClient();

  const [exportLoading, setExportLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const closeModal = () => {
    setDeleteModalOpen(false);
    setDeleteStep(1);
    setReason('');
    setConfirmText('');
    setDeleteLoading(false);
  };

  const handleExport = async () => {
    setExportLoading(true);

    try {
      const response = await fetch('/api/gdpr/export', { method: 'POST' });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Failed to prepare export.');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="?([^\"]+)"?/i);
      const filename = filenameMatch?.[1] ?? 'stablegrid-export.json';

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      onToast('Data export downloaded.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export data.';
      onToast(message, 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'delete my account') {
      return;
    }

    setDeleteLoading(true);

    try {
      await fetch('/api/gdpr/delete-reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      await fetch('/api/stripe/cancel', { method: 'POST' });

      const deleteResponse = await fetch('/api/gdpr/delete-account', {
        method: 'DELETE'
      });

      if (!deleteResponse.ok) {
        const payload = (await deleteResponse.json()) as { error?: string };
        throw new Error(payload.error ?? 'Account deletion failed.');
      }

      await supabase.auth.signOut();
      router.push('/?deleted=1');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to delete account. Contact support.';
      onToast(message, 'error');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <SettingsCard
        title="Export Your Data"
        description="GDPR Article 20 data portability export."
        icon={<Download className="h-4 w-4" />}
      >
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          Download your complete account data as JSON, including reading progress,
          practice history, bookmarks, and account metadata.
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exportLoading}
          className="btn btn-secondary mt-4"
        >
          {exportLoading ? 'Preparing export...' : 'Request data export'}
        </button>
      </SettingsCard>

      <SettingsCard
        title="Delete Account"
        description="GDPR Article 17 right to erasure."
        icon={<Trash2 className="h-4 w-4" />}
        danger
      >
        <div className="flex items-start gap-3 rounded-[14px] border border-error-200 bg-error-50/40 p-3 dark:border-error-900/30 dark:bg-error-900/10">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-error-500" />
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            This permanently deletes your account and all associated data. This action
            cannot be undone.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          className="btn btn-danger mt-4"
        >
          Delete my account
        </button>
      </SettingsCard>

      <SettingsModal open={deleteModalOpen} onClose={closeModal}>
        {deleteStep === 1 ? (
          <div>
            <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              Before you go
            </h3>
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Why are you deleting your account?
            </p>
            <div className="mt-4 space-y-2">
              {REASONS.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-white/[0.06] px-3 py-2 text-sm"
                >
                  <input
                    type="radio"
                    name="delete_reason"
                    value={option}
                    checked={reason === option}
                    onChange={() => setReason(option)}
                    className="accent-brand-500"
                  />
                  {option}
                </label>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteStep(2)}
                disabled={!reason}
                className="btn btn-danger"
              >
                Continue
              </button>
              <button type="button" onClick={closeModal} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              Final confirmation
            </h3>
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Type{' '}
              <code className="rounded bg-surface px-1.5 py-0.5 text-xs">
                delete my account
              </code>{' '}
              to permanently delete your account.
            </p>
            <div className="mt-4">
              <SettingsInput
                value={confirmText}
                onChange={setConfirmText}
                placeholder="delete my account"
              />
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={confirmText !== 'delete my account' || deleteLoading}
                className="btn btn-danger"
              >
                {deleteLoading ? 'Deleting...' : 'Permanently delete account'}
              </button>
              <button type="button" onClick={() => setDeleteStep(1)} className="btn btn-secondary">
                Go back
              </button>
            </div>
          </div>
        )}
      </SettingsModal>
    </div>
  );
}
