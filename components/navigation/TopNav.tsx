'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  Database,
  Home,
  ShieldAlert,
  Swords,
  WalletCards
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UserMenu } from '@/components/layout/UserMenu';
import { useAuthStore } from '@/lib/stores/useAuthStore';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/learn', icon: BookOpen, label: 'Learn' },
  {
    href: '/hub',
    icon: Swords,
    label: 'Practice',
    matchPrefixes: ['/hub', '/missions', '/practice'],
    children: [
      { href: '/hub', icon: WalletCards, label: 'Flashcards' },
      { href: '/missions', icon: ShieldAlert, label: 'Missions' }
    ]
  },
  { href: '/progress', icon: BarChart3, label: 'Progress' }
];

const shouldHideNav = (pathname?: string | null, isAuthenticated?: boolean) => {
  if (!pathname) return false;
  if (pathname.startsWith('/practice/') && pathname !== '/practice/setup') {
    return true;
  }
  if (pathname === '/') {
    return !isAuthenticated;
  }
  return ['/login', '/signup', '/reset-password', '/update-password'].includes(pathname);
};

export const TopNav = () => {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (shouldHideNav(pathname, Boolean(user))) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-light-border bg-light-bg/80 backdrop-blur-lg dark:border-dark-border dark:bg-dark-bg/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-base font-semibold">Gridlock</div>
              <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                Data Practice
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.matchPrefixes
                ? item.matchPrefixes.some(
                    (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
                  )
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);

              if (item.children) {
                return (
                  <div key={item.href} className="group relative">
                    <Link
                      href={item.href}
                      className="relative inline-flex items-center gap-2 overflow-hidden rounded-lg px-4 py-2 transition-colors hover:bg-light-hover dark:hover:bg-dark-hover"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="topNavIndicator"
                          className="absolute inset-0 rounded-lg border border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                      <Icon
                        className={`relative h-4 w-4 ${
                          isActive
                            ? 'text-brand-500'
                            : 'text-text-light-secondary dark:text-text-dark-secondary'
                        }`}
                      />
                      <span
                        className={`relative text-sm font-medium ${
                          isActive
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-text-light-primary dark:text-text-dark-primary'
                        }`}
                      >
                        {item.label}
                      </span>
                      <ChevronDown
                        className={`relative h-3.5 w-3.5 transition ${
                          isActive
                            ? 'text-brand-500'
                            : 'text-text-light-tertiary dark:text-text-dark-tertiary'
                        } group-hover:rotate-180 group-focus-within:rotate-180`}
                      />
                    </Link>

                    <div className="pointer-events-none invisible absolute left-0 top-full z-50 w-48 pt-1 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
                      <div className="rounded-xl border border-light-border bg-light-surface p-1.5 shadow-lg dark:border-dark-border dark:bg-dark-surface">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive =
                            pathname === child.href || pathname?.startsWith(`${child.href}/`);

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                                childActive
                                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300'
                                  : 'text-text-light-secondary hover:bg-light-hover hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-text-dark-primary'
                              }`}
                            >
                              <ChildIcon className="h-4 w-4" />
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative inline-flex items-center gap-2 overflow-hidden rounded-lg px-4 py-2 transition-colors hover:bg-light-hover dark:hover:bg-dark-hover"
                >
                  {isActive && (
                    <motion.div
                      layoutId="topNavIndicator"
                      className="absolute inset-0 rounded-lg border border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={`relative h-4 w-4 ${
                      isActive
                        ? 'text-brand-500'
                        : 'text-text-light-secondary dark:text-text-dark-secondary'
                    }`}
                  />
                  <span
                    className={`relative text-sm font-medium ${
                      isActive
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-text-light-primary dark:text-text-dark-primary'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <UserMenu />
            ) : (
              <Link href="/login" className="btn btn-secondary">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
