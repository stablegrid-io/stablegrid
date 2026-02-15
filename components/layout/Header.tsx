'use client';

import Link from 'next/link';
import { Database } from 'lucide-react';
import { UserMenu } from '@/components/layout/UserMenu';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuthStore } from '@/lib/stores/useAuthStore';

export function Header() {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 border-b border-light-border bg-light-bg/80 backdrop-blur-sm dark:border-dark-border dark:bg-dark-bg/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <Database className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-base font-semibold">Gridlock</div>
            <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              Data Analytics Practice
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <UserMenu />
          ) : (
            <Link href="/login" className="btn btn-secondary">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
