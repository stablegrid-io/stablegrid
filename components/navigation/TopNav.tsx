'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  Home,
  NotebookPen,
  ShieldAlert,
  Swords,
  WalletCards,
  type LucideIcon
} from 'lucide-react';
import { LearnSearchPanel } from '@/components/home/home/LearnSearchPanel';
import { StableGridIcon } from '@/components/brand/StableGridLogo';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  PracticeNavDropdown,
  type PracticeNavChild
} from '@/components/navigation/PracticeNavDropdown';

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
  children?: PracticeNavChild[];
}> = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/learn', icon: BookOpen, label: 'Learn' },
  {
    href: '/flashcards',
    icon: Swords,
    label: 'Practice',
    matchPrefixes: ['/flashcards', '/hub', '/missions', '/practice'],
    children: [
      { href: '/flashcards', icon: WalletCards, label: 'Flashcards' },
      { href: '/practice/notebooks', icon: NotebookPen, label: 'Notebooks' },
      { href: '/missions', icon: ShieldAlert, label: 'Missions' }
    ]
  },
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
  const [learnMenuOpen, setLearnMenuOpen] = useState(false);
  const [practiceMenuOpen, setPracticeMenuOpen] = useState(false);
  const learnMenuRef = useRef<HTMLDivElement | null>(null);
  const practiceMenuRef = useRef<HTMLDivElement | null>(null);
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());

  const isLearnActive =
    pathname === '/learn' || pathname?.startsWith('/learn/');

  const learnDropdownItems: PracticeNavChild[] = [
    {
      href: '/learn/theory',
      icon: BookOpen,
      label: 'Theory'
    },
    {
      href: '/learn/functions',
      icon: WalletCards,
      label: 'Functions'
    }
  ];

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

  const prefetchPracticeRoutes = useCallback(() => {
    prefetchRoute('/flashcards');
    prefetchRoute('/practice/notebooks');
    prefetchRoute('/missions');
  }, [prefetchRoute]);

  const prefetchLearnRoutes = useCallback(() => {
    prefetchRoute('/learn');
    prefetchRoute('/learn/theory');
    prefetchRoute('/learn/functions');
  }, [prefetchRoute]);

  useEffect(() => {
    if (!learnMenuOpen && !practiceMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInLearn = learnMenuRef.current?.contains(target);
      const clickedInPractice = practiceMenuRef.current?.contains(target);
      if (!clickedInLearn && !clickedInPractice) {
        setLearnMenuOpen(false);
        setPracticeMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLearnMenuOpen(false);
        setPracticeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [learnMenuOpen, practiceMenuOpen]);

  useEffect(() => {
    setLearnMenuOpen(false);
    setPracticeMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const primaryRoutes = ['/learn', '/flashcards', '/progress'];
    const secondaryRoutes = ['/practice/notebooks', '/missions', '/energy'];

    const prefetchPrimary = () => {
      primaryRoutes.forEach((route) => {
        prefetchRoute(route);
      });
    };

    const prefetchSecondary = () => {
      void import('@/components/layout/UserMenu');
      void import('@/components/hub/FlashcardsPage');
      void import('@/components/practice/NotebooksPracticePage');
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
    <nav className="sticky top-0 z-50 border-b border-light-border bg-light-bg/80 backdrop-blur-lg dark:border-dark-border dark:bg-dark-bg/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <StableGridIcon size="md" />
            <div className="hidden sm:block">
              <div className="text-base font-semibold">StableGrid.io</div>
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

              if (item.href === '/learn') {
                return (
                  <div key={item.href} ref={learnMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setPracticeMenuOpen(false);
                        setLearnMenuOpen((open) => !open);
                      }}
                      onMouseEnter={prefetchLearnRoutes}
                      onFocus={prefetchLearnRoutes}
                      className="relative inline-flex items-center gap-2 overflow-hidden rounded-lg px-4 py-2 transition-colors hover:bg-light-hover dark:hover:bg-dark-hover"
                    >
                      {(isLearnActive || learnMenuOpen) && (
                        <div className="absolute inset-0 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20" />
                      )}
                      <Icon
                        className={`relative h-4 w-4 ${
                          isLearnActive || learnMenuOpen
                            ? 'text-emerald-500'
                            : 'text-text-light-secondary dark:text-text-dark-secondary'
                        }`}
                      />
                      <span
                        className={`relative text-sm font-medium ${
                          isLearnActive || learnMenuOpen
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-text-light-primary dark:text-text-dark-primary'
                        }`}
                      >
                        {item.label}
                      </span>
                      <ChevronDown
                        className={`relative h-3.5 w-3.5 transition-transform ${
                          isLearnActive || learnMenuOpen
                            ? 'text-emerald-500'
                            : 'text-text-light-tertiary dark:text-text-dark-tertiary'
                        } ${learnMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {learnMenuOpen ? (
                      <div className="absolute left-0 top-full z-50 w-48 pt-1">
                        <PracticeNavDropdown
                          items={learnDropdownItems}
                          pathname={pathname}
                          onSelect={() => setLearnMenuOpen(false)}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              }

              if (item.children) {
                return (
                  <div key={item.href} ref={practiceMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setLearnMenuOpen(false);
                        setPracticeMenuOpen((open) => !open);
                      }}
                      onMouseEnter={prefetchPracticeRoutes}
                      onFocus={prefetchPracticeRoutes}
                      className="relative inline-flex items-center gap-2 overflow-hidden rounded-lg px-4 py-2 transition-colors hover:bg-light-hover dark:hover:bg-dark-hover"
                    >
                      {(isActive || practiceMenuOpen) && (
                        <div className="absolute inset-0 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20" />
                      )}
                      <Icon
                        className={`relative h-4 w-4 ${
                          isActive || practiceMenuOpen
                            ? 'text-emerald-500'
                            : 'text-text-light-secondary dark:text-text-dark-secondary'
                        }`}
                      />
                      <span
                        className={`relative text-sm font-medium ${
                          isActive || practiceMenuOpen
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-text-light-primary dark:text-text-dark-primary'
                        }`}
                      >
                        {item.label}
                      </span>
                      <ChevronDown
                        className={`relative h-3.5 w-3.5 transition ${
                          isActive || practiceMenuOpen
                            ? 'text-emerald-500'
                            : 'text-text-light-tertiary dark:text-text-dark-tertiary'
                        } ${practiceMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {practiceMenuOpen ? (
                      <div className="absolute left-0 top-full z-50 w-48 pt-1">
                        <PracticeNavDropdown
                          items={item.children}
                          pathname={pathname}
                          onSelect={() => setPracticeMenuOpen(false)}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => prefetchRoute(item.href)}
                  onFocus={() => prefetchRoute(item.href)}
                  className="relative inline-flex items-center gap-2 overflow-hidden rounded-lg px-4 py-2 transition-colors hover:bg-light-hover dark:hover:bg-dark-hover"
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20" />
                  )}
                  <Icon
                    className={`relative h-4 w-4 ${
                      isActive
                        ? 'text-emerald-500'
                        : 'text-text-light-secondary dark:text-text-dark-secondary'
                    }`}
                  />
                  <span
                    className={`relative text-sm font-medium ${
                      isActive
                        ? 'text-emerald-600 dark:text-emerald-400'
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
            <div className="hidden xl:block xl:w-[150px]">
              <LearnSearchPanel triggerVariant="nav" />
            </div>
            {user ? (
              <UserMenuLazy />
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
