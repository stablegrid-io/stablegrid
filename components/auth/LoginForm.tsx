'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

const GOOGLE_ICON = (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.08 5.08 0 01-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77a6.52 6.52 0 01-3.71 1.06c-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
    <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 010-4.18V7.07H2.18A11.02 11.02 0 001 12c0 1.78.43 3.45 1.18 4.93z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const GITHUB_ICON = (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
    <path d="M12 1.5a10.5 10.5 0 00-3.32 20.46c.53.1.72-.23.72-.52v-1.83c-2.95.64-3.57-1.43-3.57-1.43-.48-1.2-1.17-1.52-1.17-1.52-.96-.65.07-.64.07-.64 1.07.08 1.63 1.1 1.63 1.1.95 1.64 2.5 1.16 3.11.89.1-.69.37-1.16.67-1.42-2.36-.27-4.83-1.18-4.83-5.28 0-1.16.41-2.1 1.08-2.85-.11-.26-.47-1.34.1-2.79 0 0 .89-.28 2.9 1.09a10.1 10.1 0 015.28 0c2-1.37 2.88-1.1 2.88-1.1.57 1.46.21 2.54.1 2.8.67.75 1.08 1.7 1.08 2.85 0 4.11-2.48 5-4.85 5.27.38.33.71.97.71 1.96v2.9c0 .29.19.63.73.52A10.5 10.5 0 0012 1.5z" />
  </svg>
);

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
    <main className="relative min-h-screen overflow-hidden bg-surface text-on-surface">
      {/* Grid overlay */}
      <div className="fixed inset-0 grid-overlay pointer-events-none z-0" />
      <div className="fixed inset-0 scanline pointer-events-none z-0 opacity-20" />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-[-160px] h-[520px] w-[520px] -translate-x-1/2 opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(0,242,255,0.2), transparent 72%)' }}
      />

      <section className="relative flex min-h-screen items-center justify-center px-4 py-6 z-10">
        <div className="relative w-full max-w-[440px] glass-panel border border-primary/20 p-8">
          {/* L-bracket corners */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-primary" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-primary" />

          {/* Header */}
          <header className="mb-8">
            <div className="font-black text-primary tracking-widest text-lg mb-3">
              stableGrid
            </div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">
              Access Terminal
            </h1>
          </header>

          {/* OAuth buttons */}
          <div className="mb-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] border border-outline-variant/40 bg-surface-container px-3 text-xs text-on-surface transition-all hover:border-primary/40 hover:bg-surface-container-high"
            >
              {GOOGLE_ICON}
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('github')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] border border-outline-variant/40 bg-surface-container px-3 text-xs text-on-surface transition-all hover:border-primary/40 hover:bg-surface-container-high"
            >
              {GITHUB_ICON}
              GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-outline-variant/30" />
            <span className="text-[9px] text-on-surface-variant uppercase tracking-widest">or credentials</span>
            <div className="h-px flex-1 bg-outline-variant/30" />
          </div>

          {/* Error */}
          {error ? (
            <div className="mb-3 border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">
              {error}
            </div>
          ) : null}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-[9px] text-on-surface-variant uppercase tracking-[0.2em]">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@stablegrid.io"
                className="h-10 w-full rounded-[14px] bg-surface-container-low border border-outline-variant/30 px-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="login-password" className="text-[9px] text-on-surface-variant uppercase tracking-[0.2em]">
                  Password
                </label>
                <Link href="/reset-password" className="text-[9px] text-primary/60 hover:text-primary uppercase tracking-wider transition-colors">
                  Reset?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 w-full rounded-[14px] bg-surface-container-low border border-outline-variant/30 px-3 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!email || !password || isSubmitting}
              className="w-full h-10 rounded-[14px] bg-primary text-on-primary font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(153,247,255,0.4)] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin border-2 border-on-primary/30 border-t-on-primary" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  AUTHENTICATE
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-[10px] text-on-surface-variant">
            New operator?{' '}
            <Link href="/signup" className="text-primary font-bold hover:underline uppercase">
              Register
            </Link>
          </p>
          <p className="mt-2 text-center text-[9px] text-on-surface-variant/50">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            {' · '}
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            {' · '}
            <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
