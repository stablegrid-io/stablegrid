'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { StableGridWordmark } from '@/components/brand/StableGridLogo';
import { useAuth } from '@/lib/hooks/useAuth';

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

const LEFT_FEATURES = [
  {
    label: 'PySpark & Microsoft Fabric',
    description:
      'Deep curriculum for distributed compute, Lakehouse patterns, and performance.'
  },
  {
    label: 'Function reference',
    description: 'Searchable API guidance with examples and common failure modes.'
  },
  {
    label: 'Practice sets',
    description: 'Difficulty-tiered questions with accuracy and speed tracking.'
  },
  {
    label: 'Classified missions',
    description:
      'Incident-driven debugging: shuffles, skew, broken pipelines, failed SLAs.'
  }
];

export function LoginForm() {
  const { signIn, signInWithOAuth } = useAuth();

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
      // Force a fresh request so auth-aware server routes do not reuse stale prefetched data.
      window.location.assign('/onboarding');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError('');
    try {
      await signInWithOAuth(provider);
    } catch (err: any) {
      setError(err?.message ?? `Failed to continue with ${provider}.`);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="grid min-h-screen lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden border-r border-[#1a2a22] bg-[#0a0a0a] px-10 py-11 lg:flex lg:flex-col lg:justify-between xl:px-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />
          <div
            className="pointer-events-none absolute -left-16 top-20 h-72 w-72 rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, #4ade80, transparent 70%)' }}
          />

          <div className="relative z-10">
            <StableGridWordmark
              size="lg"
              titleClassName="text-[#f0f0f0]"
              subtitle="Data Engineering Platform"
              subtitleClassName="text-[#6f8d79]"
            />
          </div>

          <div className="relative z-10">
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4ade80]">
              StableGrid Operations
            </p>
            <h1 className="font-display text-[42px] font-bold leading-[1.06] tracking-tight text-[#f0f0f0]">
              Build data engineering that holds under load.
              <br />
              <span className="text-[#4ade80]">Stabilize the grid.</span>
            </h1>
            <p className="mt-5 max-w-[390px] text-sm leading-7 text-[#7d8f84]">
              Practice the modern stack through production-grade scenarios.
              Earn deployment kWh from correct solutions and allocate it to infrastructure upgrades as you progress.
            </p>

            <div className="mt-9">
              {LEFT_FEATURES.map((feature, index) => (
                <div
                  key={feature.label}
                  className={`flex gap-3.5 py-3 ${
                    index < LEFT_FEATURES.length - 1 ? 'border-b border-[#16261f]' : ''
                  }`}
                >
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#4ade80]" />
                  <div>
                    <p className="text-sm font-semibold text-[#d9eee0]">{feature.label}</p>
                    <p className="mt-0.5 text-xs text-[#5f7a6a]">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 border-t border-[#16261f] pt-4 text-xs text-[#5f7a6a]">
            Free tier available · SQL + Python included · No card required
          </p>
        </aside>

        <section className="flex items-center justify-center bg-[#f8fbf9] px-5 py-10 sm:px-8 lg:px-14">
          <div className="w-full max-w-md">
            <header className="mb-8">
              <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#6e8d7a]">
                StableGrid.io Access
              </p>
              <h2 className="font-display text-4xl font-bold tracking-tight text-[#121212]">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-[#6b736d]">
                Sign in to continue your learning progress.
              </p>
            </header>

            <div className="mb-6 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#d4ddd7] bg-white px-3 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:border-[#b7d8c4] hover:bg-[#f2fbf5]"
              >
                {GOOGLE_ICON}
                Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('github')}
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#d4ddd7] bg-white px-3 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:border-[#b7d8c4] hover:bg-[#f2fbf5]"
              >
                {GITHUB_ICON}
                GitHub
              </button>
            </div>

            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#dbe9e0]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ab5a4]">
                Or continue with email
              </span>
              <div className="h-px flex-1 bg-[#dbe9e0]" />
            </div>

            {error ? (
              <div className="mb-4 rounded-[10px] border border-[#f4c7c7] bg-[#fff5f5] px-3.5 py-2.5 text-sm text-[#b42318]">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-[#8f8f8f]"
                >
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-[10px] border border-[#d4ddd7] bg-white px-3.5 py-2.5 text-sm text-[#111111] outline-none transition-all placeholder:text-[#acacac] focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20"
                  required
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#8f8f8f]"
                  >
                    Password
                  </label>
                  <Link
                    href="/reset-password"
                    className="text-xs font-semibold text-[#111111] underline underline-offset-2 transition-colors hover:text-[#1f7a4f]"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                    className="w-full rounded-[10px] border border-[#d4ddd7] bg-white px-3.5 py-2.5 pr-11 text-sm text-[#111111] outline-none transition-all placeholder:text-[#acacac] focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#b8b8b8] transition-colors hover:text-[#1f7a4f]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!email || !password || isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#101a14] bg-gradient-to-r from-[#101312] to-[#163124] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:border-[#2c7f57] hover:from-[#0f1713] hover:to-[#1f4a34] disabled:cursor-not-allowed disabled:border-[#d4ddd7] disabled:bg-[#dfdfdf] disabled:text-[#acacac]"
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

            <p className="mt-5 text-center text-sm text-[#9a9a9a]">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-[#1f7a4f] hover:underline">
                Sign up free
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
