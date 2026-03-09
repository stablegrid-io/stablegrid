'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';
import { useAuth } from '@/lib/hooks/useAuth';
import { getPasswordIssues, passwordRules } from '@/lib/utils/password';
import { Captcha } from '@/components/auth/Captcha';
import { StableGridWordmark } from '@/components/brand/StableGridLogo';

const GOOGLE_ICON = (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.08 5.08 0 01-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77a6.52 6.52 0 01-3.71 1.06c-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09a6.6 6.6 0 010-4.18V7.07H2.18A11.02 11.02 0 001 12c0 1.78.43 3.45 1.18 4.93z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const GITHUB_ICON = (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
    <path d="M12 1.5a10.5 10.5 0 00-3.32 20.46c.53.1.72-.23.72-.52v-1.83c-2.95.64-3.57-1.43-3.57-1.43-.48-1.2-1.17-1.52-1.17-1.52-.96-.65.07-.64.07-.64 1.07.08 1.63 1.1 1.63 1.1.95 1.64 2.5 1.16 3.11.89.1-.69.37-1.16.67-1.42-2.36-.27-4.83-1.18-4.83-5.28 0-1.16.41-2.1 1.08-2.85-.11-.26-.47-1.34.1-2.79 0 0 .89-.28 2.9 1.09a10.1 10.1 0 015.28 0c2-1.37 2.88-1.1 2.88-1.1.57 1.46.21 2.54.1 2.8.67.75 1.08 1.7 1.08 2.85 0 4.11-2.48 5-4.85 5.27.38.33.71.97.71 1.96v2.9c0 .29.19.63.73.52A10.5 10.5 0 0012 1.5z" />
  </svg>
);

export function SignupForm() {
  const router = useRouter();
  const { signUp, signInWithOAuth } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [themeMounted, setThemeMounted] = useState(false);
  const isLightMode = themeMounted && resolvedTheme === 'light';
  const gridLineColor = isLightMode ? 'rgba(22,132,103,0.2)' : '#22b999';

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  const passwordIssues = useMemo(() => getPasswordIssues(password), [password]);
  const passwordScore = passwordRules.length - passwordIssues.length;
  const passwordStrength = useMemo(() => {
    if (!password) return '';
    if (passwordScore <= 2) return 'Weak';
    if (passwordScore === 3) return 'Fair';
    if (passwordScore === 4) return 'Strong';
    return 'Excellent';
  }, [password, passwordScore]);
  const showPasswordChecklist = password.length > 0;

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

      await trackProductEvent('signup_started', {
        method: 'email'
      });

      const data = await signUp(email.trim(), password, name.trim(), captchaToken);
      if (data?.session) {
        router.push('/onboarding?signup=1&method=email');
        return;
      }

      setSuccess('Account created. Check your email to verify your account, then log in.');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError('');
    try {
      await trackProductEvent('signup_started', {
        method: provider
      });
      await signInWithOAuth(provider);
    } catch (err: any) {
      setError(err?.message ?? `Failed to continue with ${provider}.`);
    }
  };

  return (
    <main
      className={`relative min-h-screen overflow-hidden ${
        isLightMode ? 'bg-[#edf3ef] text-[#13221a]' : 'bg-[#050807] text-[#e8f2ec]'
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${isLightMode ? 'opacity-[0.06]' : 'opacity-[0.04]'}`}
        style={{
          backgroundImage:
            `linear-gradient(${gridLineColor} 1px, transparent 1px), linear-gradient(90deg, ${gridLineColor} 1px, transparent 1px)`,
          backgroundSize: '56px 56px'
        }}
      />
      <div
        className={`pointer-events-none absolute left-1/2 top-[-160px] h-[520px] w-[520px] -translate-x-1/2 rounded-full ${isLightMode ? 'opacity-25' : 'opacity-20'}`}
        style={{
          background: isLightMode
            ? 'radial-gradient(circle, rgba(38,171,136,0.34), transparent 72%)'
            : 'radial-gradient(circle, rgba(34,185,153,0.48), transparent 72%)'
        }}
      />
      <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div
          className={`relative w-full max-w-[480px] rounded-[20px] p-6 backdrop-blur-md sm:py-8 sm:pl-12 sm:pr-8 ${
            isLightMode
              ? 'border border-[#cfddd5] bg-[linear-gradient(180deg,rgba(251,255,252,0.97),rgba(244,250,246,0.96))] shadow-[0_26px_80px_rgba(16,38,28,0.18)]'
              : 'border border-[#1a2b22] bg-[linear-gradient(180deg,rgba(8,13,11,0.95),rgba(6,10,9,0.94))] shadow-[0_26px_80px_rgba(0,0,0,0.55)]'
          }`}
        >
          <div className="pointer-events-none absolute bottom-8 left-6 top-24 hidden sm:block">
            <div
              className={`relative h-full w-px ${
                isLightMode
                  ? 'bg-gradient-to-b from-[#8cb8a4] via-[#b8d1c4] to-transparent'
                  : 'bg-gradient-to-b from-[#2b4539] via-[#1e3128] to-transparent'
              }`}
            >
              <span
                className={`absolute -left-[2px] top-[4%] h-1.5 w-1.5 rounded-full ${
                  isLightMode
                    ? 'bg-[#2f9f79] shadow-[0_0_8px_rgba(47,159,121,0.25)]'
                    : 'bg-[#56ba9b] shadow-[0_0_10px_rgba(86,186,155,0.35)]'
                }`}
              />
              <span className={`absolute -left-[2px] top-[44%] h-1.5 w-1.5 rounded-full ${isLightMode ? 'bg-[#6ea48e]' : 'bg-[#3a6d59]'}`} />
              <span className={`absolute -left-[2px] top-[78%] h-1.5 w-1.5 rounded-full ${isLightMode ? 'bg-[#6ea48e]' : 'bg-[#3a6d59]'}`} />
            </div>
          </div>

          <header className="relative mb-9">
            <div className="flex items-start justify-between gap-4">
              <StableGridWordmark
                size="md"
                titleClassName={isLightMode ? 'text-[#13221a]' : 'text-[#f1f6f3]'}
              />
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                    isLightMode
                      ? 'border border-[#b7ccc2] bg-[#f0f7f3] text-[#5f7a6c]'
                      : 'border border-[#2a4136] bg-[#0c1612] text-[#86a698]'
                  }`}
                >
                  Beta
                </span>
                <button
                  type="button"
                  onClick={() => setTheme(isLightMode ? 'dark' : 'light')}
                  aria-label="Toggle color mode"
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                    isLightMode
                      ? 'border-[#b7ccc2] bg-[#f0f7f3] text-[#4f6a5d] hover:bg-[#e6f1eb]'
                      : 'border-[#2a4136] bg-[#0c1612] text-[#8cab9d] hover:bg-[#11201a]'
                  }`}
                >
                  {isLightMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <p className={`mt-6 text-[11px] font-semibold uppercase tracking-[0.15em] ${isLightMode ? 'text-[#4f8f74]' : 'text-[#7cb99f]'}`}>
              HRB access
            </p>
            <h1 className={`mt-3 font-display text-[2rem] font-bold leading-[1.08] tracking-tight ${isLightMode ? 'text-[#13221a]' : 'text-[#f1f6f3]'}`}>
              Create your HRB account
            </h1>
            <p className={`mt-2 text-sm leading-6 ${isLightMode ? 'text-[#5f786b]' : 'text-[#90a89b]'}`}>
              Track readiness and operator progression in one place.
            </p>
          </header>

          {success ? (
            <div
              className={`rounded-[12px] p-5 ${
                isLightMode
                  ? 'border border-[#bcd5c8] bg-[#f6fcf8]'
                  : 'border border-[#255742] bg-[#0a1612]'
              }`}
            >
              <p className={`text-sm font-medium ${isLightMode ? 'text-[#2a8d6d]' : 'text-[#97dfbf]'}`}>{success}</p>
              <Link
                href="/login"
                className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold hover:underline ${
                  isLightMode ? 'text-[#2a8d6d]' : 'text-[#9be4c4]'
                }`}
              >
                Continue to login
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-7 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-[12px] px-3 text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fd0ab]/25 ${
                    isLightMode
                      ? 'border border-[#c5d8cf] bg-[#f8fcf9] text-[#13221a] hover:border-[#9fc4b4] hover:bg-[#eef7f2]'
                      : 'border border-[#2a4136] bg-[#0b1410] text-[#e6efea] hover:border-[#3e6754] hover:bg-[#101d17]'
                  }`}
                >
                  {GOOGLE_ICON}
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth('github')}
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-[12px] px-3 text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fd0ab]/25 ${
                    isLightMode
                      ? 'border border-[#c5d8cf] bg-[#f8fcf9] text-[#13221a] hover:border-[#9fc4b4] hover:bg-[#eef7f2]'
                      : 'border border-[#2a4136] bg-[#0b1410] text-[#e6efea] hover:border-[#3e6754] hover:bg-[#101d17]'
                  }`}
                >
                  {GITHUB_ICON}
                  GitHub
                </button>
              </div>

              <div className="mb-6 flex items-center gap-3">
                <div className={`h-px flex-1 ${isLightMode ? 'bg-[#c9dbd2]' : 'bg-[#203228]'}`} />
                <span className={`text-[11px] font-medium ${isLightMode ? 'text-[#668274]' : 'text-[#7f988b]'}`}>or use email</span>
                <div className={`h-px flex-1 ${isLightMode ? 'bg-[#c9dbd2]' : 'bg-[#203228]'}`} />
              </div>

              {error ? (
                <div
                  className={`mb-4 rounded-[10px] px-3.5 py-2.5 text-sm ${
                    isLightMode
                      ? 'border border-[#e6b8b8] bg-[#fff3f3] text-[#b02a2a]'
                      : 'border border-[#5a2a2a] bg-[#1a0e0e] text-[#f2b9b9]'
                  }`}
                >
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="signup-name"
                    className={`mb-1.5 block text-xs font-medium ${isLightMode ? 'text-[#567064]' : 'text-[#93a99d]'}`}
                  >
                    Full name
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    className={`h-12 w-full rounded-[12px] px-3.5 text-sm outline-none transition-all ${
                      isLightMode
                        ? 'border border-[#c6d8cf] bg-[#f9fcfa] text-[#13221a] placeholder:text-[#95a89f] focus:border-[#38b38b] focus:ring-2 focus:ring-[#22b999]/20'
                        : 'border border-[#263c31] bg-[#0a120f] text-[#eef6f2] placeholder:text-[#6f8478] focus:border-[#49dab4] focus:ring-2 focus:ring-[#22b999]/22'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-email"
                    className={`mb-1.5 block text-xs font-medium ${isLightMode ? 'text-[#567064]' : 'text-[#93a99d]'}`}
                  >
                    Email
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className={`h-12 w-full rounded-[12px] px-3.5 text-sm outline-none transition-all ${
                      isLightMode
                        ? 'border border-[#c6d8cf] bg-[#f9fcfa] text-[#13221a] placeholder:text-[#95a89f] focus:border-[#38b38b] focus:ring-2 focus:ring-[#22b999]/20'
                        : 'border border-[#263c31] bg-[#0a120f] text-[#eef6f2] placeholder:text-[#6f8478] focus:border-[#49dab4] focus:ring-2 focus:ring-[#22b999]/22'
                    }`}
                    required
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="signup-password"
                      className={`block text-xs font-medium ${isLightMode ? 'text-[#567064]' : 'text-[#93a99d]'}`}
                    >
                      Password
                    </label>
                    {passwordStrength ? (
                      <span className={`text-xs font-semibold ${isLightMode ? 'text-[#2a8d6d]' : 'text-[#7edab4]'}`}>
                        {passwordStrength}
                      </span>
                    ) : null}
                  </div>

                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Create a password"
                      className={`h-12 w-full rounded-[12px] px-3.5 pr-11 text-sm outline-none transition-all ${
                        isLightMode
                          ? 'border border-[#c6d8cf] bg-[#f9fcfa] text-[#13221a] placeholder:text-[#95a89f] focus:border-[#38b38b] focus:ring-2 focus:ring-[#22b999]/20'
                          : 'border border-[#263c31] bg-[#0a120f] text-[#eef6f2] placeholder:text-[#6f8478] focus:border-[#49dab4] focus:ring-2 focus:ring-[#22b999]/22'
                      }`}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className={`absolute inset-y-0 right-0 flex w-11 items-center justify-center transition-colors ${
                        isLightMode ? 'text-[#7d9286] hover:text-[#3d5a4d]' : 'text-[#7d9286] hover:text-[#a8c0b3]'
                      }`}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {showPasswordChecklist ? (
                    <ul className="mt-3 space-y-1.5">
                      {passwordRules.map((rule) => {
                        const isMet = !passwordIssues.includes(rule.label);
                        return (
                          <li
                            key={rule.id}
                            className={`flex items-center gap-2 text-xs ${
                              isMet
                                ? isLightMode
                                  ? 'text-[#2a8d6d]'
                                  : 'text-[#9be4c4]'
                                : isLightMode
                                  ? 'text-[#6f887b]'
                                  : 'text-[#7a8f84]'
                            }`}
                          >
                            <span
                              className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                                isMet
                                  ? isLightMode
                                    ? 'border-[#2f9f79] bg-[#2f9f79] text-white'
                                    : 'border-[#2b7a5a] bg-[#2b7a5a] text-white'
                                  : isLightMode
                                    ? 'border-[#b7ccc2] text-transparent'
                                    : 'border-[#2f4138] text-transparent'
                              }`}
                            >
                              <Check className="h-3 w-3" />
                            </span>
                            {rule.label}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className={`mt-2 text-xs ${isLightMode ? 'text-[#6f887b]' : 'text-[#7a8f84]'}`}>
                      Use at least 8 characters with uppercase, lowercase, number, and symbol.
                    </p>
                  )}
                </div>

                {siteKey ? (
                  <div
                    className={`rounded-[12px] p-3 ${
                      isLightMode
                        ? 'border border-[#c6d8cf] bg-[#f6fbf8]'
                        : 'border border-[#24392e] bg-[#09110e]'
                    }`}
                  >
                    <Captcha
                      siteKey={siteKey}
                      onVerify={(token) => setCaptchaToken(token)}
                      onExpire={() => setCaptchaToken('')}
                    />
                  </div>
                ) : null}

                <p className={`text-xs leading-relaxed ${isLightMode ? 'text-[#6f887b]' : 'text-[#7f9488]'}`}>
                  By creating an account you agree to our{' '}
                  <Link
                    href="/terms"
                    className={`font-medium hover:underline ${isLightMode ? 'text-[#2a8d6d]' : 'text-[#9be4c4]'}`}
                  >
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    className={`font-medium hover:underline ${isLightMode ? 'text-[#2a8d6d]' : 'text-[#9be4c4]'}`}
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>

                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] border px-4 text-sm font-semibold transition-all active:translate-y-[1px] disabled:cursor-not-allowed ${
                    isLightMode
                      ? 'border-[#2fa279] bg-[#2fa279] text-white shadow-[0_12px_28px_-16px_rgba(47,162,121,0.6)] hover:border-[#258f69] hover:bg-[#258f69] disabled:border-[#c8d8d0] disabled:bg-[#d7e3dd] disabled:text-[#8a9b94]'
                      : 'border-[#3aa67f] bg-[#2ba278] text-[#07120d] shadow-[0_12px_28px_-16px_rgba(62,174,131,0.85)] hover:border-[#4fd6a6] hover:bg-[#3ab58a] hover:shadow-[0_14px_32px_-16px_rgba(79,214,166,0.8)] disabled:border-[#2b3d34] disabled:bg-[#1a2420] disabled:text-[#73857d] disabled:shadow-none'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className={`h-4 w-4 animate-spin rounded-full border-2 ${isLightMode ? 'border-white/35 border-t-white' : 'border-[#07120d]/30 border-t-[#07120d]'}`} />
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

          <p className={`mt-5 text-center text-sm ${isLightMode ? 'text-[#5f786b]' : 'text-[#8ca195]'}`}>
            Already have an account?{' '}
            <Link
              href="/login"
              className={`font-semibold hover:underline ${isLightMode ? 'text-[#2a8d6d]' : 'text-[#9be4c4]'}`}
            >
              Log in
            </Link>
          </p>
          <p className={`mt-2 text-center text-xs ${isLightMode ? 'text-[#6f887b]' : 'text-[#74897d]'}`}>
            Need help?{' '}
            <Link
              href="/support"
              className={`font-medium hover:underline ${isLightMode ? 'text-[#2a8d6d]' : 'text-[#8fbba8]'}`}
            >
              Contact support
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
