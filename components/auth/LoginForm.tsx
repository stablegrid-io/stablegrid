'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useTheme } from 'next-themes';
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

export function LoginForm() {
  const { resolvedTheme } = useTheme();
  const { signIn, signInWithOAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [themeMounted, setThemeMounted] = useState(false);
  const isLightMode = themeMounted && resolvedTheme === 'light';
  const gridLineColor = isLightMode ? 'rgba(120,131,142,0.24)' : '#59635f';

  useEffect(() => {
    setThemeMounted(true);
  }, []);

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
    <main
      className={`relative min-h-screen overflow-hidden ${
        isLightMode ? 'bg-[#edf3ef] text-[#13221a]' : 'bg-[#020303] text-[#e6ede9]'
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
            ? 'radial-gradient(circle, rgba(164,174,184,0.34), transparent 72%)'
            : 'radial-gradient(circle, rgba(101,112,106,0.34), transparent 72%)'
        }}
      />
      <section className="relative flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <div
          className={`relative w-full max-w-[456px] rounded-[18px] p-5 backdrop-blur-md sm:p-6 sm:pl-10 sm:pr-7 ${
            isLightMode
              ? 'border border-[#cfddd5] bg-[linear-gradient(180deg,rgba(251,255,252,0.97),rgba(244,250,246,0.96))] shadow-[0_26px_80px_rgba(16,38,28,0.18)]'
              : 'border border-[#2b322f] bg-[linear-gradient(180deg,rgba(5,7,7,0.96),rgba(3,4,4,0.95))] shadow-[0_26px_80px_rgba(0,0,0,0.55)]'
          }`}
        >
          <div className="pointer-events-none absolute bottom-6 left-5 top-20 hidden sm:block">
            <div
              className={`relative h-full w-px ${
                isLightMode
                  ? 'bg-gradient-to-b from-[#8cb8a4] via-[#b8d1c4] to-transparent'
                  : 'bg-gradient-to-b from-[#3e4a45] via-[#2a322f] to-transparent'
              }`}
            >
              <span
                className={`absolute -left-[2px] top-[4%] h-1.5 w-1.5 rounded-full ${
                  isLightMode
                    ? 'bg-[#6f7f8d] shadow-[0_0_8px_rgba(111,127,141,0.25)]'
                    : 'bg-[#9aa7a1] shadow-[0_0_10px_rgba(154,167,161,0.3)]'
                }`}
              />
              <span className={`absolute -left-[2px] top-[44%] h-1.5 w-1.5 rounded-full ${isLightMode ? 'bg-[#7f8f9c]' : 'bg-[#5d6964]'}`} />
              <span className={`absolute -left-[2px] top-[78%] h-1.5 w-1.5 rounded-full ${isLightMode ? 'bg-[#7f8f9c]' : 'bg-[#5d6964]'}`} />
            </div>
          </div>

          <header className="relative mb-7">
            <div className="flex items-start">
              <StableGridWordmark
                size="sm"
                iconClassName={
                  isLightMode
                    ? ''
                    : 'bg-gradient-to-br from-[#171d1b] to-[#0d1110] text-[#79d0ab] shadow-[0_0_0_1px_rgba(121,208,171,0.22),0_10px_22px_-14px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.05)]'
                }
                titleClassName={isLightMode ? 'text-[#13221a]' : 'text-[#edf3ef]'}
              />
            </div>
            <h1 className={`mt-4 font-display text-[1.65rem] font-semibold leading-[1.08] tracking-tight ${isLightMode ? 'text-[#13221a]' : 'text-[#edf3ef]'}`}>
              Welcome back
            </h1>
          </header>

          <div className="mb-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-[11px] px-3 text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a7b0b8]/35 ${
                isLightMode
                  ? 'border border-[#c5d8cf] bg-[#f8fcf9] text-[#13221a] hover:border-[#9fc4b4] hover:bg-[#eef7f2]'
                  : 'border border-[#313835] bg-[#0b0f0f] text-[#e4ece8] hover:border-[#4c655a] hover:bg-[#111615]'
              }`}
            >
              {GOOGLE_ICON}
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('github')}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-[11px] px-3 text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a7b0b8]/35 ${
                isLightMode
                  ? 'border border-[#c5d8cf] bg-[#f8fcf9] text-[#13221a] hover:border-[#9fc4b4] hover:bg-[#eef7f2]'
                  : 'border border-[#313835] bg-[#0b0f0f] text-[#e4ece8] hover:border-[#4c655a] hover:bg-[#111615]'
              }`}
            >
              {GITHUB_ICON}
              GitHub
            </button>
          </div>

          <div className="mb-5 flex items-center gap-2.5">
            <div className={`h-px flex-1 ${isLightMode ? 'bg-[#c9d2db]' : 'bg-[#29312e]'}`} />
            <span className={`text-[11px] font-medium ${isLightMode ? 'text-[#667380]' : 'text-[#8c9892]'}`}>or email</span>
            <div className={`h-px flex-1 ${isLightMode ? 'bg-[#c9d2db]' : 'bg-[#29312e]'}`} />
          </div>

          {error ? (
            <div className={`mb-3 rounded-[10px] px-3.5 py-2.5 text-sm ${
              isLightMode
                ? 'border border-[#e6b8b8] bg-[#fff3f3] text-[#b02a2a]'
                : 'border border-[#5a2a2a] bg-[#1a0e0e] text-[#f2b9b9]'
            }`}>
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className={`mb-1 block text-[11px] font-medium ${isLightMode ? 'text-[#5a6773]' : 'text-[#8f9a95]'}`}
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
                className={`h-11 w-full rounded-[11px] px-3.5 text-sm outline-none transition-all ${
                  isLightMode
                    ? 'border border-[#c6d0d8] bg-[#f9fbfd] text-[#13221a] placeholder:text-[#95a1ac] focus:border-[#7f8b97] focus:ring-2 focus:ring-[#8f99a3]/25'
                    : 'border border-[#2f3633] bg-[#090d0c] text-[#e8f0eb] placeholder:text-[#76827c] focus:border-[#78a58f] focus:ring-2 focus:ring-[#7db39a]/25'
                }`}
                required
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className={`block text-[11px] font-medium ${isLightMode ? 'text-[#5a6773]' : 'text-[#8f9a95]'}`}
                >
                  Password
                </label>
                <Link
                  href="/reset-password"
                  className={`text-xs font-medium underline underline-offset-2 transition-colors ${
                    isLightMode ? 'text-[#5f6e7b] hover:text-[#4d5d6a]' : 'text-[#c3cdc8] hover:text-[#d6dfda]'
                  }`}
                >
                  Forgot?
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
                  className={`h-11 w-full rounded-[11px] px-3.5 pr-11 text-sm outline-none transition-all ${
                    isLightMode
                      ? 'border border-[#c6d0d8] bg-[#f9fbfd] text-[#13221a] placeholder:text-[#95a1ac] focus:border-[#7f8b97] focus:ring-2 focus:ring-[#8f99a3]/25'
                      : 'border border-[#2f3633] bg-[#090d0c] text-[#e8f0eb] placeholder:text-[#76827c] focus:border-[#78a58f] focus:ring-2 focus:ring-[#7db39a]/25'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className={`absolute inset-y-0 right-0 flex w-11 items-center justify-center transition-colors ${
                    isLightMode ? 'text-[#7d9286] hover:text-[#3d5a4d]' : 'text-[#7d9286] hover:text-[#8fd8b6]'
                  }`}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!email || !password || isSubmitting}
              className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-[11px] border px-4 text-sm font-semibold transition-all active:translate-y-[1px] disabled:cursor-not-allowed ${
                isLightMode
                  ? 'border-[#7f8b97] bg-[#7f8b97] text-white shadow-[0_12px_28px_-16px_rgba(127,139,151,0.55)] hover:border-[#6f7b87] hover:bg-[#6f7b87] disabled:border-[#c8d1da] disabled:bg-[#d9e0e6] disabled:text-[#8a96a1]'
                  : 'border-[#98a39d] bg-[#a7b0ab] text-[#0b0f0e] shadow-[0_12px_28px_-16px_rgba(128,146,136,0.75)] hover:border-[#b5bfba] hover:bg-[#b7c1bc] hover:shadow-[0_14px_32px_-16px_rgba(157,177,166,0.64)] disabled:border-[#2a312e] disabled:bg-[#161b19] disabled:text-[#6c7671] disabled:shadow-none'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className={`h-4 w-4 animate-spin rounded-full border-2 ${isLightMode ? 'border-white/35 border-t-white' : 'border-[#07120d]/30 border-t-[#07120d]'}`} />
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

          <p className={`mt-4 text-center text-sm ${isLightMode ? 'text-[#5f786b]' : 'text-[#89a093]'}`}>
            New here?{' '}
            <Link href="/signup" className={`font-semibold hover:underline ${isLightMode ? 'text-[#5f6e7b]' : 'text-[#d0dbd6]'}`}>
              Sign up
            </Link>
          </p>
          <p className={`mt-2 text-center text-xs ${isLightMode ? 'text-[#6f887b]' : 'text-[#798983]'}`}>
            <Link href="/privacy" className={`hover:underline ${isLightMode ? 'hover:text-[#5f6e7b]' : 'hover:text-[#c3cdc8]'}`}>
              Privacy
            </Link>
            {' · '}
            <Link href="/terms" className={`hover:underline ${isLightMode ? 'hover:text-[#5f6e7b]' : 'hover:text-[#c3cdc8]'}`}>
              Terms
            </Link>
            {' · '}
            <Link href="/support" className={`hover:underline ${isLightMode ? 'hover:text-[#5f6e7b]' : 'hover:text-[#c3cdc8]'}`}>
              Support
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
