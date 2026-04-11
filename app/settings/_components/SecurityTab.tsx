'use client';

import { useMemo, useState } from 'react';
import { Laptop2, Lock, Smartphone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SettingsCard, SettingsPasswordInput } from './ui';

interface SecurityTabProps {
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function SecurityTab({ onToast }: SecurityTabProps) {
  const supabase = createClient();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordHint = useMemo(() => {
    if (!newPassword) {
      return undefined;
    }
    if (newPassword.length < 8) {
      return 'Minimum 8 characters';
    }
    return undefined;
  }, [newPassword]);

  const confirmHint = useMemo(() => {
    if (!confirmPassword) {
      return undefined;
    }
    if (newPassword !== confirmPassword) {
      return "Passwords don't match";
    }
    return undefined;
  }, [confirmPassword, newPassword]);

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const handlePasswordUpdate = async () => {
    if (!canSubmit || loading) {
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user?.email) {
        throw new Error('No authenticated user found.');
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (verifyError) {
        throw new Error('Current password is incorrect.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onToast('Password updated successfully.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update password.';
      onToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutOthers = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'others' });
    if (error) {
      onToast(error.message, 'error');
      return;
    }

    onToast('Signed out of other sessions.', 'success');
  };

  return (
    <div className="space-y-5">
      <SettingsCard
        title="Change Password"
        description="Re-authentication is required before updating your password."
        icon={<Lock className="h-4 w-4" />}
      >
        <div className="space-y-4">
          <SettingsPasswordInput
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Enter current password"
          />

          <SettingsPasswordInput
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            hint={passwordHint}
            placeholder="Minimum 8 characters"
          />

          <SettingsPasswordInput
            label="Confirm password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            hint={confirmHint}
            placeholder="Repeat new password"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePasswordUpdate}
              disabled={!canSubmit || loading}
              className="btn btn-primary"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Active Sessions"
        description="Review sessions and revoke access from unrecognized devices."
        icon={<Laptop2 className="h-4 w-4" />}
      >
        <div className="rounded-[14px] border border-brand-200 bg-brand-50/40 px-3 py-2 dark:border-brand-900/40 dark:bg-brand-900/10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
              Current browser session
              <span className="ml-2 rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-600 dark:text-brand-300">
                Current
              </span>
            </p>
            <Smartphone className="h-4 w-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
          </div>
          <p className="mt-0.5 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            This device · Now
          </p>
        </div>

        <p className="mt-3 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          Supabase client auth does not expose per-device session listing here.
          You can still force sign-out on all other sessions.
        </p>

        <button
          type="button"
          onClick={handleSignOutOthers}
          className="mt-4 text-sm font-medium text-error-600 hover:text-error-500 dark:text-error-400 dark:hover:text-error-300"
        >
          Sign out of all other sessions
        </button>
      </SettingsCard>
    </div>
  );
}
