'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LogOut, Moon, Settings, Sun, Trophy, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProgressStore } from '@/lib/stores/useProgressStore';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { xp, streak } = useProgressStore();
  const { resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) {
    return null;
  }

  const email = user.email ?? '';
  const initials = email
    ? email
        .split('@')[0]
        .slice(0, 2)
        .toUpperCase()
    : 'GL';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-lg border border-light-border bg-light-surface px-4 py-2 text-text-light-secondary shadow-sm transition hover:bg-light-hover dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-secondary dark:hover:bg-dark-hover"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-900/20 dark:text-brand-300">
          {initials}
        </div>
        <div className="hidden text-left md:block">
          <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
            {email}
          </div>
          <div className="flex items-center gap-3 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-warning-500" />
              {xp} XP
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-success-500" />
              {streak} streak
            </span>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-64 rounded-lg border border-light-border bg-light-surface p-4 shadow-lg dark:border-dark-border dark:bg-dark-surface">
          <div className="space-y-1 border-b border-light-border pb-3 dark:border-dark-border">
            <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
              {email}
            </div>
            {user.created_at && (
              <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="space-y-2 py-3 text-sm">
            <div className="flex items-center justify-between text-text-light-tertiary dark:text-text-dark-tertiary">
              <span>Total XP</span>
              <span className="font-semibold text-success-600 dark:text-success-400">
                {xp}
              </span>
            </div>
            <div className="flex items-center justify-between text-text-light-tertiary dark:text-text-dark-tertiary">
              <span>Current streak</span>
              <span className="font-semibold text-warning-600 dark:text-warning-400">
                {streak}
              </span>
            </div>
          </div>

          <div className="border-t border-light-border pt-2 dark:border-dark-border">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-light-secondary transition-colors hover:bg-light-hover hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-text-dark-primary"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            {mounted && (
              <button
                type="button"
                onClick={() =>
                  setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
                }
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-light-secondary transition-colors hover:bg-light-hover hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-text-dark-primary"
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              signOut();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
