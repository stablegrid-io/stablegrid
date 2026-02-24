'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  type LucideIcon,
  BarChart3,
  BookOpen,
  Home,
  Swords,
  Zap
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/useAuthStore';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  matchPrefixes?: string[];
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/learn', icon: BookOpen, label: 'Learn' },
  {
    href: '/flashcards',
    icon: Swords,
    label: 'Practice',
    matchPrefixes: ['/flashcards', '/hub', '/missions', '/practice']
  },
  { href: '/energy', icon: Zap, label: 'Grid' },
  { href: '/progress', icon: BarChart3, label: 'Progress' }
];

const shouldHideNav = (pathname?: string | null, isAuthenticated?: boolean) => {
  if (!pathname) return false;
  if (
    pathname.startsWith('/practice/') &&
    pathname !== '/practice/setup' &&
    pathname !== '/practice/notebooks'
  ) {
    return true;
  }
  if (pathname === '/') {
    return !isAuthenticated;
  }
  return ['/login', '/signup', '/reset-password', '/update-password'].includes(pathname);
};

export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();

  if (shouldHideNav(pathname, Boolean(user))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-light-border bg-light-bg/80 backdrop-blur-lg dark:border-dark-border dark:bg-dark-bg/80 lg:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.matchPrefixes
            ? item.matchPrefixes.some(
                (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
              )
            : pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="relative flex h-full flex-1 flex-col items-center justify-center gap-1"
              type="button"
            >
              {isActive && (
                <div className="absolute left-1/2 top-0 h-1 w-12 -translate-x-1/2 rounded-full bg-emerald-500" />
              )}

              <div className="relative">
                <Icon
                  className={`h-6 w-6 transition-colors ${
                    isActive
                      ? 'text-emerald-500'
                      : 'text-text-light-tertiary dark:text-text-dark-tertiary'
                  }`}
                />
                {item.badge ? (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error-500 text-[10px] font-medium text-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </div>

              <span
                className={`text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-emerald-500'
                    : 'text-text-light-tertiary dark:text-text-dark-tertiary'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="h-safe-bottom bg-light-bg dark:bg-dark-bg" />
    </nav>
  );
};
