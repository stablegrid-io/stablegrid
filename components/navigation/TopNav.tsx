'use client';

import { useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Home,
  Zap,
  type LucideIcon
} from 'lucide-react';
import { LearnSearchPanel } from '@/components/home/home/LearnSearchPanel';
import { StableGridIcon } from '@/components/brand/StableGridLogo';
import { useAuthStore } from '@/lib/stores/useAuthStore';

const UserMenuLazy = dynamic(
  () => import('@/components/layout/UserMenu').then((module) => module.UserMenu),
  {
    ssr: false,
    loading: () => (
      <div className="h-9 w-9 rounded-full border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface" />
    )
  }
);

const navItems: Array<{
  href: string;
  icon: LucideIcon;
  label: string;
  matchPrefixes?: string[];
}> = [
  { href: '/', icon: Home, label: 'Home' },
  {
    href: '/learn/theory',
    icon: BookOpen,
    label: 'Theory',
    matchPrefixes: ['/learn']
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

type WindowWithIdle = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export const TopNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const hideNav = shouldHideNav(pathname, Boolean(user));
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());

  const prefetchRoute = useCallback(
    (route: string) => {
      if (prefetchedRoutesRef.current.has(route)) {
        return;
      }
      prefetchedRoutesRef.current.add(route);
      router.prefetch(route);
    },
    [router]
  );

  useEffect(() => {
    const primaryRoutes = ['/learn/theory', '/progress', '/energy'];
    const secondaryRoutes = ['/settings'];

    const prefetchPrimary = () => {
      primaryRoutes.forEach((route) => {
        prefetchRoute(route);
      });
    };

    const prefetchSecondary = () => {
      void import('@/components/layout/UserMenu');
      void import('@/components/home/home/LearnSearchPanel');
      secondaryRoutes.forEach((route) => {
        prefetchRoute(route);
      });
    };

    const win = window as WindowWithIdle;
    const immediateId = setTimeout(prefetchPrimary, 0);

    if (typeof win.requestIdleCallback === 'function') {
      const idleId = win.requestIdleCallback(prefetchSecondary, { timeout: 1200 });
      return () => {
        clearTimeout(immediateId);
        win.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = setTimeout(prefetchSecondary, 400);
    return () => {
      clearTimeout(immediateId);
      clearTimeout(timeoutId);
    };
  }, [prefetchRoute]);

  if (hideNav) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-[#183224] bg-[#050805]/95 backdrop-blur-xl">
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(74,222,128,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(74,222,128,0.1) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
      <div className="container relative mx-auto px-4">
        <div className="flex h-[74px] items-center justify-between gap-3">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-xl border border-[#1d3729] bg-[#0a120d]/75 px-3 py-2 transition-all hover:border-[#2d6e4a] hover:bg-[#0f1913]"
          >
            <StableGridIcon size="md" />
            <div className="hidden sm:block">
              <div className="text-base font-semibold text-[#dff9eb]">StableGrid.io</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7ea994]">
                Control Rail
              </div>
            </div>
          </Link>

          <div className="hidden items-center rounded-2xl border border-[#1b3427] bg-[#0b140f]/85 px-2 py-1 shadow-[inset_0_0_0_1px_rgba(74,222,128,0.08)] lg:flex">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = item.matchPrefixes
                ? item.matchPrefixes.some(
                    (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
                  )
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <div key={item.href} className="flex items-center">
                  <Link
                    href={item.href}
                    onMouseEnter={() => prefetchRoute(item.href)}
                    onFocus={() => prefetchRoute(item.href)}
                    className={`group relative inline-flex min-w-[122px] items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2 transition-all focus-visible:ring-2 focus-visible:ring-emerald-300/70 focus-visible:ring-offset-0 ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-cyan-300/15 shadow-[0_0_0_1px_rgba(74,222,128,0.35),0_0_28px_rgba(74,222,128,0.15)]'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <span
                      className={`relative inline-flex h-7 w-7 items-center justify-center rounded-lg border ${
                        isActive
                          ? 'border-emerald-300/60 bg-emerald-300/10 text-emerald-300'
                          : 'border-white/10 bg-white/[0.02] text-[#9db9aa] group-hover:border-emerald-300/40 group-hover:text-emerald-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {isActive ? (
                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(74,222,128,0.9)]" />
                      ) : null}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        isActive ? 'text-[#d8ffee]' : 'text-[#b9d4c6]'
                      }`}
                    >
                      {item.label}
                    </span>
                    {isActive ? (
                      <span className="absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
                    ) : null}
                  </Link>
                  {index < navItems.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="mx-1 h-px w-4 bg-gradient-to-r from-emerald-300/35 to-transparent"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-[#1d3729] bg-[#0b120d]/75 px-2.5 py-1 text-[11px] text-[#8fb4a2] xl:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(74,222,128,0.75)]" />
              Grid stable
            </div>
            <div className="hidden xl:block xl:w-[156px]">
              <LearnSearchPanel triggerVariant="nav" />
            </div>
            {user ? (
              <UserMenuLazy />
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl border border-emerald-300/35 bg-emerald-300/10 px-3 py-2 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-300/20"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
