'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';

const GOOGLE_ICON = (
  <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.08 5.08 0 01-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77a6.52 6.52 0 01-3.71 1.06c-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
    <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 010-4.18V7.07H2.18A11.02 11.02 0 001 12c0 1.78.43 3.45 1.18 4.93z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const GITHUB_ICON = (
  <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="currentColor">
    <path d="M12 1.5a10.5 10.5 0 00-3.32 20.46c.53.1.72-.23.72-.52v-1.83c-2.95.64-3.57-1.43-3.57-1.43-.48-1.2-1.17-1.52-1.17-1.52-.96-.65.07-.64.07-.64 1.07.08 1.63 1.1 1.63 1.1.95 1.64 2.5 1.16 3.11.89.1-.69.37-1.16.67-1.42-2.36-.27-4.83-1.18-4.83-5.28 0-1.16.41-2.1 1.08-2.85-.11-.26-.47-1.34.1-2.79 0 0 .89-.28 2.9 1.09a10.1 10.1 0 015.28 0c2-1.37 2.88-1.1 2.88-1.1.57 1.46.21 2.54.1 2.8.67.75 1.08 1.7 1.08 2.85 0 4.11-2.48 5-4.85 5.27.38.33.71.97.71 1.96v2.9c0 .29.19.63.73.52A10.5 10.5 0 0012 1.5z" />
  </svg>
);

export function LoginForm() {
  const { signInWithOAuth } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<'google' | 'github' | null>(null);

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError('');
    setLoading(provider);
    try {
      await signInWithOAuth(provider);
    } catch {
      setError('Authentication failed. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <style>{`
        @keyframes loginBgFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes loginCardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.985); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .login-bg        { opacity: 0; animation: loginBgFade .8s cubic-bezier(.16,1,.3,1) 0ms forwards; }
        .login-card      { opacity: 0; animation: loginCardIn .75s cubic-bezier(.16,1,.3,1) 120ms forwards; will-change: transform, opacity, filter; }
        .login-stagger-1 { opacity: 0; animation: loginFadeUp .55s cubic-bezier(.16,1,.3,1) 360ms forwards; }
        .login-stagger-2 { opacity: 0; animation: loginFadeUp .55s cubic-bezier(.16,1,.3,1) 460ms forwards; }
        .login-stagger-3 { opacity: 0; animation: loginFadeUp .55s cubic-bezier(.16,1,.3,1) 520ms forwards; }
        .login-stagger-4 { opacity: 0; animation: loginFadeUp .55s cubic-bezier(.16,1,.3,1) 640ms forwards; }
        @media (prefers-reduced-motion: reduce) {
          .login-bg, .login-card, .login-stagger-1, .login-stagger-2, .login-stagger-3, .login-stagger-4 {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `}</style>

      {/* Background image (matches landing hero) */}
      <div className="login-bg fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/landing-hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(10,12,14,0.55) 0%, rgba(10,12,14,0.7) 100%)',
          }}
        />
      </div>

      <section className="relative flex min-h-screen items-center justify-center px-4 py-6 z-10">
        <div
          className="login-card relative w-full max-w-[400px] rounded-[22px] bg-[#181c20] p-8"
          style={{
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >

          {/* Header */}
          <header className="login-stagger-1 mb-10 text-center">
            <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-3">
              Get started
            </h1>
          </header>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-[14px] border border-error/30 bg-error/10 px-4 py-2.5 text-[13px] text-error">
              {error}
            </div>
          )}

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {([
              { provider: 'google' as const, label: 'Google', icon: GOOGLE_ICON, stagger: 'login-stagger-2' },
              { provider: 'github' as const, label: 'GitHub', icon: GITHUB_ICON, stagger: 'login-stagger-3' },
            ]).map((item) => (
              <button
                key={item.provider}
                type="button"
                onClick={() => handleOAuth(item.provider)}
                disabled={loading !== null}
                className={`${item.stagger} flex flex-col items-center justify-center gap-3 py-6 rounded-[14px] border border-white/[0.08] bg-white/[0.03] text-[13px] font-medium text-on-surface/70 transition-all hover:bg-white/[0.06] hover:border-white/[0.12] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === item.provider ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-on-surface/20 border-t-on-surface" />
                ) : (
                  item.icon
                )}
                {item.label}
              </button>
            ))}
          </div>

          {/* Footer */}
          <p className="login-stagger-4 text-center text-[11px] text-on-surface-variant/30">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-on-surface/85 underline underline-offset-2 decoration-on-surface/30 hover:text-on-surface hover:decoration-on-surface/60 transition-colors">Terms</a>
            {' '}and{' '}
            <a href="/privacy" className="text-on-surface/85 underline underline-offset-2 decoration-on-surface/30 hover:text-on-surface hover:decoration-on-surface/60 transition-colors">Privacy Policy</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
