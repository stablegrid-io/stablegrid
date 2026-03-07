'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  Flag,
  Home,
  Layers3,
  Lightbulb,
  NotebookPen,
  Zap,
  type LucideIcon
} from 'lucide-react';
import { useTheme } from 'next-themes';
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
  {
    href: '/tasks',
    icon: ClipboardCheck,
    label: 'Tasks',
    matchPrefixes: ['/tasks', '/practice', '/missions', '/flashcards']
  },
  { href: '/energy', icon: Zap, label: 'Grid' },
  { href: '/progress', icon: BarChart3, label: 'HRB' }
];

const taskDropdownItems: Array<{
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
}> = [
  {
    href: '/practice/notebooks',
    icon: NotebookPen,
    label: 'Notebooks',
    description: 'Line-by-line review tasks'
  },
  {
    href: '/missions',
    icon: Flag,
    label: 'Missions',
    description: 'Operational incident drills'
  },
  {
    href: '/flashcards',
    icon: Layers3,
    label: 'Flashcards',
    description: 'Rapid theory recall sprints'
  }
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
  const { resolvedTheme, setTheme } = useTheme();
  const { user } = useAuthStore();
  const hideNav = shouldHideNav(pathname, Boolean(user));
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());
  const tasksMenuRef = useRef<HTMLDivElement>(null);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [themeMounted, setThemeMounted] = useState(false);

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
    const primaryRoutes = ['/learn/theory', '/tasks', '/progress', '/energy'];
    const taskRoutes = taskDropdownItems.map((item) => item.href);
    const secondaryRoutes = ['/settings'];

    const prefetchPrimary = () => {
      primaryRoutes.forEach((route) => {
        prefetchRoute(route);
      });
      taskRoutes.forEach((route) => {
        prefetchRoute(route);
      });
    };

    const prefetchSecondary = () => {
      void import('@/components/layout/UserMenu');
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

  useEffect(() => {
    setTasksOpen(false);
  }, [pathname]);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  useEffect(() => {
    if (!tasksOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (tasksMenuRef.current?.contains(target)) {
        return;
      }
      setTasksOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTasksOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [tasksOpen]);

  if (hideNav) {
    return null;
  }

  const isDarkTheme = resolvedTheme === 'dark';

  return (
    <nav className="sticky top-0 z-50 border-b border-[#183224] bg-[#050805]/95 backdrop-blur-xl">
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(34,185,153,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(34,185,153,0.1) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" />
      <div className="container relative mx-auto px-4">
        <div className="flex h-[74px] items-center justify-between gap-3">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-xl border border-brand-700/45 bg-[#0a120d]/75 px-3 py-2 transition-all hover:border-brand-500/45 hover:bg-[#0f1913]"
          >
            <StableGridIcon size="md" />
            <div className="hidden sm:block">
              <div className="text-base font-semibold text-brand-50">StableGrid.io</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-300/85">
                Control Rail
              </div>
            </div>
          </Link>

          <div className="hidden items-center rounded-2xl border border-[#1b3427] bg-[#0b140f]/85 px-2 py-1 shadow-[inset_0_0_0_1px_rgba(34,185,153,0.1)] lg:flex">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = item.matchPrefixes
                ? item.matchPrefixes.some(
                    (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
                  )
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const itemBaseClass = `group relative inline-flex min-w-[122px] items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2 transition-all focus-visible:ring-2 focus-visible:ring-brand-300/70 focus-visible:ring-offset-0 ${
                isActive
                  ? 'bg-gradient-to-r from-brand-500/20 via-brand-400/10 to-brand-300/15 shadow-[0_0_0_1px_rgba(34,185,153,0.35),0_0_28px_rgba(34,185,153,0.15)]'
                  : 'hover:bg-white/[0.04]'
              }`;
              const iconClass = `relative inline-flex h-7 w-7 items-center justify-center rounded-lg border ${
                isActive
                  ? 'border-brand-300/60 bg-brand-300/10 text-brand-300'
                  : 'border-white/10 bg-white/[0.02] text-[#9db9aa] group-hover:border-brand-300/40 group-hover:text-brand-200'
              }`;
              const labelClass = `text-sm font-medium ${
                isActive ? 'text-[#d8ffee]' : 'text-[#b9d4c6]'
              }`;

              return (
                <div key={item.href} className="flex items-center">
                  {item.href === '/tasks' ? (
                    <div ref={tasksMenuRef} className="relative">
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={tasksOpen}
                        onClick={() => setTasksOpen((current) => !current)}
                        onMouseEnter={() => {
                          prefetchRoute(item.href);
                          taskDropdownItems.forEach((taskItem) => prefetchRoute(taskItem.href));
                        }}
                        className={itemBaseClass}
                      >
                        <span className={iconClass}>
                          <Icon className="h-4 w-4" />
                          {isActive ? (
                            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-300 shadow-[0_0_12px_rgba(34,185,153,0.9)]" />
                          ) : null}
                        </span>
                        <span className={labelClass}>{item.label}</span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-[#9dc8b1] transition-transform ${
                            tasksOpen ? 'rotate-180' : 'rotate-0'
                          }`}
                        />
                        {isActive ? (
                          <span className="absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent" />
                        ) : null}
                      </button>

                      {tasksOpen ? (
                        <div
                          role="menu"
                          className="absolute left-0 top-[calc(100%+10px)] z-50 w-[320px] overflow-hidden rounded-2xl border border-[#224130]/70 bg-[#0a120e]/95 p-2 shadow-[0_24px_44px_-24px_rgba(0,0,0,0.72)] backdrop-blur-xl"
                        >
                          <div className="px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#86cfa9]">
                              Tasks
                            </p>
                            <p className="mt-1 text-xs text-[#8fa99b]">
                              Jump directly into active operations.
                            </p>
                          </div>

                          <div className="mx-2 h-px bg-white/10" />

                          <div className="space-y-0.5 px-1 py-1.5">
                            {taskDropdownItems.map((taskItem) => {
                              const TaskIcon = taskItem.icon;
                              const taskActive =
                                pathname === taskItem.href ||
                                pathname?.startsWith(`${taskItem.href}/`);

                              return (
                                <Link
                                  key={taskItem.href}
                                  href={taskItem.href}
                                  role="menuitem"
                                  onClick={() => setTasksOpen(false)}
                                  onMouseEnter={() => prefetchRoute(taskItem.href)}
                                  onFocus={() => prefetchRoute(taskItem.href)}
                                  className={`group flex items-start gap-3 rounded-lg px-3 py-2 transition ${
                                    taskActive
                                      ? 'bg-brand-400/10'
                                      : 'hover:bg-[#121d18]'
                                  }`}
                                >
                                  <span
                                    className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg ${
                                      taskActive
                                        ? 'bg-brand-300/10 text-brand-200'
                                        : 'bg-white/[0.03] text-[#8fa99b]'
                                    }`}
                                  >
                                  <TaskIcon className="h-4 w-4" />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-medium text-[#def4e8]">
                                      {taskItem.label}
                                    </span>
                                    <span className="block text-xs text-[#7f988a]">
                                      {taskItem.description}
                                    </span>
                                  </span>
                                  <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 text-[#759787] transition group-hover:text-[#a8dbc0]" />
                                </Link>
                              );
                            })}
                          </div>

                          <div className="mt-1 border-t border-[#1c3428] px-2 pt-2">
                            <Link
                              href="/tasks"
                              role="menuitem"
                              onClick={() => setTasksOpen(false)}
                              onMouseEnter={() => prefetchRoute('/tasks')}
                              onFocus={() => prefetchRoute('/tasks')}
                              className="inline-flex w-full items-center justify-between rounded-lg bg-[#0f1814] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#9fd8ba] transition hover:bg-[#15211b] hover:text-[#c7f1dc]"
                            >
                              Open Tasks Hub
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      onMouseEnter={() => prefetchRoute(item.href)}
                      onFocus={() => prefetchRoute(item.href)}
                      className={itemBaseClass}
                    >
                      <span className={iconClass}>
                        <Icon className="h-4 w-4" />
                        {isActive ? (
                          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-300 shadow-[0_0_12px_rgba(34,185,153,0.9)]" />
                        ) : null}
                      </span>
                      <span className={labelClass}>{item.label}</span>
                      {isActive ? (
                        <span className="absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent" />
                      ) : null}
                    </Link>
                  )}
                  {index < navItems.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="mx-1 h-px w-4 bg-gradient-to-r from-brand-300/35 to-transparent"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {themeMounted ? (
              <button
                type="button"
                onClick={() => setTheme(isDarkTheme ? 'light' : 'dark')}
                aria-label={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDarkTheme ? 'Light mode' : 'Dark mode'}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                  isDarkTheme
                    ? 'border-brand-500/40 bg-brand-500/10 text-brand-200 hover:bg-brand-500/16'
                    : 'border-[#b7c4d8] bg-white/85 text-[#2c3b52] hover:bg-white'
                }`}
              >
                <Lightbulb
                  className={`h-4 w-4 ${isDarkTheme ? 'fill-brand-300/20' : 'fill-amber-300/40 text-amber-500'}`}
                />
              </button>
            ) : (
              <div
                aria-hidden
                className="h-10 w-10 rounded-xl border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface"
              />
            )}

            {user ? (
              <UserMenuLazy />
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl border border-brand-300/35 bg-brand-300/10 px-3 py-2 text-sm font-semibold text-brand-200 transition-colors hover:bg-brand-300/20"
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
