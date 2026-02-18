'use client';

import Link from 'next/link';
import { UserMenu } from '@/components/layout/UserMenu';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { StableGridIcon } from '@/components/brand/StableGridLogo';
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
          <StableGridIcon size="md" />
          <div>
            <div className="text-base font-semibold">StableGrid.io</div>
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
