'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getPasswordIssues, passwordRules } from '@/lib/utils/password';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Captcha } from '@/components/auth/Captcha';
import { AuthSplitShell } from '@/components/auth/AuthSplitShell';

const inputClassName =
  'w-full rounded-lg border border-light-border bg-white px-3.5 py-3 text-sm text-text-light-primary outline-none transition-all placeholder:text-text-light-disabled focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:placeholder:text-text-dark-tertiary';

export function SignupForm() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordIssues = useMemo(() => getPasswordIssues(password), [password]);
  const passwordScore = passwordRules.length - passwordIssues.length;
  const passwordStrength = useMemo(() => {
    if (!password) return '';
    if (passwordScore <= 2) return 'Weak';
    if (passwordScore === 3) return 'Fair';
    if (passwordScore === 4) return 'Strong';
    return 'Excellent';
  }, [password, passwordScore]);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    passwordIssues.length === 0 &&
    (!siteKey || captchaToken.length > 0);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (passwordIssues.length > 0) {
        throw new Error('Password does not meet all requirements.');
      }

      const data = await signUp(email.trim(), password, name.trim(), captchaToken);
      if (data?.session) {
        router.push('/hub');
        return;
      }

      setSuccess('Account created. Check your inbox to verify your email, then log in.');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthSplitShell
      title="Create your account"
      subtitle="Create an account to save progress and continue across sessions."
    >
      <div className="space-y-5">
        {success ? (
          <div className="rounded-xl border border-success-200 bg-success-50 p-5 dark:border-success-800 dark:bg-success-900/10">
            <p className="text-sm font-medium text-success-700 dark:text-success-300">
              {success}
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-500"
            >
              Continue to login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
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
                  Full name
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  className={inputClassName}
                  required
                />
              </div>

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
                  {passwordStrength && (
                    <span className="text-xs font-medium text-brand-500">
                      {passwordStrength}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a password"
                    className={`${inputClassName} pr-11`}
                    required
                    minLength={8}
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

                <ul className="space-y-1.5 pt-1">
                  {passwordRules.map((rule) => {
                    const isMet = !passwordIssues.includes(rule.label);
                    return (
                      <li
                        key={rule.id}
                        className={`flex items-center gap-2 text-xs ${
                          isMet
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-text-light-tertiary dark:text-text-dark-tertiary'
                        }`}
                      >
                        <span
                          className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                            isMet
                              ? 'border-success-500 bg-success-500 text-white'
                              : 'border-light-border text-transparent dark:border-dark-border'
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {siteKey ? (
                <Captcha
                  siteKey={siteKey}
                  onVerify={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken('')}
                />
              ) : null}

              <p className="text-xs leading-relaxed text-text-light-tertiary dark:text-text-dark-tertiary">
                By creating an account you agree to our Terms and Privacy Policy.
              </p>

              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-light-border disabled:text-text-light-disabled dark:disabled:bg-dark-border dark:disabled:text-text-dark-tertiary"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-500">
            Log in
          </Link>
        </p>
      </div>
    </AuthSplitShell>
  );
}
