'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/hooks/useAuth';
import { getPasswordIssues, passwordRules } from '@/lib/utils/password';

export function UpdatePasswordForm() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordIssues = getPasswordIssues(password);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (passwordIssues.length > 0) {
        throw new Error('Password does not meet the required strength.');
      }
      await updatePassword(password);
      setSuccess('Password updated. Redirecting to login...');
      setTimeout(() => router.push('/login'), 1200);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card w-full max-w-md space-y-6 p-8">
      <div className="space-y-2 text-center">
        <p className="data-mono text-xs uppercase tracking-[0.4em] text-brand-500/80">
          Secure Access
        </p>
        <h1 className="text-3xl font-semibold text-text-light-primary dark:text-text-dark-primary">
          Set a new password
        </h1>
        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          Choose a strong password to protect your progress.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600 dark:border-error-800 dark:bg-error-900/10 dark:text-error-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-700 dark:border-success-800 dark:bg-success-900/10 dark:text-success-300">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-text-light-tertiary dark:text-text-dark-tertiary">
            New password
          </label>
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
          />
          <ul className="space-y-1 text-xs text-text-light-muted dark:text-text-dark-muted">
            {passwordRules.map((rule) => {
              const isMet = !passwordIssues.includes(rule.label);
              return (
                <li
                  key={rule.id}
                  className={
                    isMet
                      ? 'text-success-600 dark:text-success-400'
                      : 'text-text-light-muted dark:text-text-dark-muted'
                  }
                >
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update password'}
        </Button>
      </form>
    </div>
  );
}
