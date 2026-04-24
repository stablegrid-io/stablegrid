'use client';

import { useAuth } from '@/lib/hooks/useAuth';

interface SocialAuthButtonsProps {
  onError?: (message: string) => void;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
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

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
    <path d="M12 1.5a10.5 10.5 0 00-3.32 20.46c.53.1.72-.23.72-.52v-1.83c-2.95.64-3.57-1.43-3.57-1.43-.48-1.2-1.17-1.52-1.17-1.52-.96-.65.07-.64.07-.64 1.07.08 1.63 1.1 1.63 1.1.95 1.64 2.5 1.16 3.11.89.1-.69.37-1.16.67-1.42-2.36-.27-4.83-1.18-4.83-5.28 0-1.16.41-2.1 1.08-2.85-.11-.26-.47-1.34.1-2.79 0 0 .89-.28 2.9 1.09a10.1 10.1 0 015.28 0c2-1.37 2.88-1.1 2.88-1.1.57 1.46.21 2.54.1 2.8.67.75 1.08 1.7 1.08 2.85 0 4.11-2.48 5-4.85 5.27.38.33.71.97.71 1.96v2.9c0 .29.19.63.73.52A10.5 10.5 0 0012 1.5z" />
  </svg>
);

export function SocialAuthButtons({ onError }: SocialAuthButtonsProps) {
  const { signInWithOAuth } = useAuth();

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      await signInWithOAuth(provider);
    } catch (error: any) {
      onError?.(error?.message ?? `Failed to continue with ${provider}.`);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => handleOAuth('google')}
        className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-light-border bg-white px-3 py-2.5 text-sm font-semibold text-text-light-primary transition-all hover:border-light-active hover:bg-light-surface dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:hover:border-dark-active dark:hover:bg-dark-surface"
      >
        <GoogleIcon />
        Google
      </button>
      <button
        type="button"
        onClick={() => handleOAuth('github')}
        className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-light-border bg-white px-3 py-2.5 text-sm font-semibold text-text-light-primary transition-all hover:border-light-active hover:bg-light-surface dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:hover:border-dark-active dark:hover:bg-dark-surface"
      >
        <GithubIcon />
        GitHub
      </button>
    </div>
  );
}
