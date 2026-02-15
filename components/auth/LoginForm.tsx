'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { AuthSplitShell } from '@/components/auth/AuthSplitShell';

const inputClassName =
  'w-full rounded-lg border border-light-border bg-white px-3.5 py-3 text-sm text-text-light-primary outline-none transition-all placeholder:text-text-light-disabled focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:placeholder:text-text-dark-tertiary';

export function LoginForm() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await signIn(email.trim(), password);
      router.push('/hub');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthSplitShell
      title="Welcome back"
      subtitle="Sign in to continue your learning progress."
    >
      <div className="space-y-5">
        <SocialAuthButtons onError={setError} />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-light-border dark:bg-dark-border" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-light-disabled dark:text-text-dark-tertiary">
            Or continue with email
          </span>
          <div className="h-px flex-1 bg-light-border dark:bg-dark-border" />
        </div>

        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-3.5 py-2.5 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/10 dark:text-error-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={inputClassName}
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
                Password
              </label>
              <Link
                href="/reset-password"
                className="text-xs font-semibold text-brand-600 hover:text-brand-500"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                className={`${inputClassName} pr-11`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-text-light-disabled transition-colors hover:text-text-light-secondary dark:text-text-dark-tertiary dark:hover:text-text-dark-secondary"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!email || !password || isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-light-border disabled:text-text-light-disabled dark:disabled:bg-dark-border dark:disabled:text-text-dark-tertiary"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Logging in...
              </>
            ) : (
              <>
                Log in
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-500">
            Sign up free
          </Link>
        </p>
      </div>
    </AuthSplitShell>
  );
}
