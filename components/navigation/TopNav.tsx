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
  NotebookPen,
  Zap,
  type LucideIcon
} from 'lucide-react';
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
  if (!isAuthenticated) {
    return true;
  }
  if (
    pathname.startsWith('/practice/') &&
    pathname !== '/practice/setup' &&
    pathname !== '/practice/notebooks'
  ) {
    return true;
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
  const tasksMenuRef = useRef<HTMLDivElement>(null);
  const [tasksOpen, setTasksOpen] = useState(false);

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

  return (
    <nav className="sticky top-0 z-50 border-b border-[#2f3834] bg-[#020303]/95 backdrop-blur-xl">
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(97,111,104,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(97,111,104,0.08) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#8ea29a]/65 to-transparent" />
      <div className="container relative mx-auto px-4">
        <div className="flex h-[74px] items-center justify-between gap-3">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-xl border border-[#2f3834] bg-[#0b0f0f]/80 px-3 py-2 transition-all hover:border-[#4e655c] hover:bg-[#111615]"
          >
            <StableGridIcon size="md" />
            <div className="hidden sm:block">
              <div className="text-base font-semibold text-[#edf3ef]">stableGrid.io</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8ebca8]">
                Control Rail
              </div>
            </div>
          </Link>

          <div className="hidden items-center rounded-2xl border border-[#2f3834] bg-[#0a0e0d]/88 px-2 py-1 shadow-[inset_0_0_0_1px_rgba(154,167,161,0.08)] lg:flex">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = item.matchPrefixes
                ? item.matchPrefixes.some(
                    (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
                  )
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const itemBaseClass = `group relative inline-flex min-w-[122px] items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2 transition-all focus-visible:ring-2 focus-visible:ring-brand-300/70 focus-visible:ring-offset-0 ${
                isActive
                  ? 'bg-gradient-to-r from-[#2c3b34]/70 via-[#1f2925]/75 to-[#24332c]/72 shadow-[0_0_0_1px_rgba(116,164,139,0.45),0_0_26px_rgba(85,132,110,0.22)]'
                  : 'hover:bg-white/[0.04]'
              }`;
              const iconClass = `relative inline-flex h-7 w-7 items-center justify-center rounded-lg border ${
                isActive
                  ? 'border-[#79c2a2]/70 bg-[#1d2f28]/85 text-[#8fd7b5]'
                  : 'border-[#3a4440] bg-white/[0.02] text-[#9ba8a1] group-hover:border-[#6f8f82] group-hover:text-[#bfddd0]'
              }`;
              const labelClass = `text-sm font-medium ${
                isActive ? 'text-[#deefe7]' : 'text-[#bac9c1]'
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
                          className={`h-3.5 w-3.5 text-[#98b3a6] transition-transform ${
                            tasksOpen ? 'rotate-180' : 'rotate-0'
                          }`}
                        />
                        {isActive ? (
                          <span className="absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-[#90c9ad] to-transparent" />
                        ) : null}
                      </button>

                      {tasksOpen ? (
                        <div
                          role="menu"
                          className="absolute left-0 top-[calc(100%+10px)] z-50 w-[320px] overflow-hidden rounded-2xl border border-[#2f3834] bg-[#0a0e0d]/96 p-2 shadow-[0_24px_44px_-24px_rgba(0,0,0,0.72)] backdrop-blur-xl"
                        >
                          <div className="px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8fc2ab]">
                              Tasks
                            </p>
                            <p className="mt-1 text-xs text-[#88958e]">
                              Jump directly into active operations.
                            </p>
                          </div>

                          <div className="mx-2 h-px bg-[#2e3734]" />

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
                                      ? 'bg-[#1e2824]'
                                      : 'hover:bg-[#121714]'
                                  }`}
                                >
                                  <span
                                    className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg ${
                                      taskActive
                                        ? 'bg-[#22342c] text-[#a6dac2]'
                                        : 'bg-white/[0.03] text-[#8c9892]'
                                    }`}
                                  >
                                  <TaskIcon className="h-4 w-4" />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-medium text-[#e2ece7]">
                                      {taskItem.label}
                                    </span>
                                    <span className="block text-xs text-[#7f8d86]">
                                      {taskItem.description}
                                    </span>
                                  </span>
                                  <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 text-[#7e8f87] transition group-hover:text-[#bed5ca]" />
                                </Link>
                              );
                            })}
                          </div>

                          <div className="mt-1 border-t border-[#2d3532] px-2 pt-2">
                            <Link
                              href="/tasks"
                              role="menuitem"
                              onClick={() => setTasksOpen(false)}
                              onMouseEnter={() => prefetchRoute('/tasks')}
                              onFocus={() => prefetchRoute('/tasks')}
                              className="inline-flex w-full items-center justify-between rounded-lg bg-[#111715] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#a3cfba] transition hover:bg-[#18201d] hover:text-[#d6ebe1]"
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
                          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#8fd7b5] shadow-[0_0_12px_rgba(115,181,148,0.82)]" />
                        ) : null}
                      </span>
                      <span className={labelClass}>{item.label}</span>
                      {isActive ? (
                        <span className="absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-[#90c9ad] to-transparent" />
                      ) : null}
                    </Link>
                  )}
                  {index < navItems.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="mx-1 h-px w-4 bg-gradient-to-r from-[#698278]/45 to-transparent"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <UserMenuLazy />
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl border border-[#4a5d56] bg-[#131917] px-3 py-2 text-sm font-semibold text-[#d8e3de] transition-colors hover:bg-[#19211e]"
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
