'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/hooks/useAuth';

export function PasswordResetForm() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      await resetPassword(email);
      setSuccess('Check your email for a password reset link.');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to send reset email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card w-full max-w-md space-y-6 p-8">
      <div className="space-y-2 text-center">
        <p className="data-mono text-xs uppercase tracking-[0.4em] text-brand-500/80">
          Reset Access
        </p>
        <h1 className="text-3xl font-semibold text-text-light-primary dark:text-text-dark-primary">
          Reset your password
        </h1>
        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          We&apos;ll send you a secure link to update your password.
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
            Email
          </label>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>

      <p className="text-center text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
        Remembered your password?{' '}
        <Link href="/login" className="text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
