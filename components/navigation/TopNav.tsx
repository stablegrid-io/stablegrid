'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { StableGridIcon } from '@/components/brand/StableGridLogo';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  isNavItemActive,
  isTheoryLessonPath,
  navItems,
  shouldHideNav,
  taskDropdownItems
} from './navigation-config';

const UserMenuLazy = dynamic<{
  align?: 'start' | 'end';
  placement?: 'bottom' | 'right';
  appearance?: 'default' | 'rail';
}>(
  () => import('@/components/layout/UserMenu').then((module) => module.UserMenu),
  {
    ssr: false,
    loading: () => (
      <div className="h-11 w-11 rounded-full border border-white/12 bg-white/5 shadow-[0_10px_22px_rgba(0,0,0,0.18)]" />
    )
  }
);

type WindowWithIdle = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const desktopRailItemClass = (isActive: boolean, isLessonMode: boolean) =>
  `group relative flex items-center justify-center overflow-hidden rounded-[22px] border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7d4c7]/55 ${
    isLessonMode ? 'h-12 w-12' : 'min-h-[4.75rem] w-full flex-col gap-1.5 px-2.5 py-3'
  } ${
    isActive
      ? 'border-white/16 bg-[linear-gradient(180deg,rgba(56,78,69,0.7),rgba(28,39,34,0.9))] text-[#eef6f1] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_18px_28px_-22px_rgba(150,205,178,0.85)]'
      : 'border-transparent bg-white/[0.03] text-[#aeb9b3] hover:border-white/10 hover:bg-white/[0.07] hover:text-[#edf3ef]'
  }`;

const desktopLabelPillClass =
  'pointer-events-none absolute left-[calc(100%+0.8rem)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#111513]/92 px-3 py-1 text-[11px] font-medium tracking-[0.01em] text-[#eef4f0] opacity-0 shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 lg:block';

export const TopNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const hideNav = shouldHideNav(pathname, Boolean(user));
  const isLessonMode = isTheoryLessonPath(pathname);
  const homeNavItem = navItems.find((item) => item.href === '/') ?? navItems[0];
  const desktopRailItems = navItems.filter((item) => item.href !== '/');
  const isHomeActive = isNavItemActive(pathname, homeNavItem);
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
    <>
      <nav className="sticky top-0 z-50 border-b border-[#28302d] bg-[#050706]/88 backdrop-blur-2xl lg:hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
        <div className="relative mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[#edf3ef] shadow-[0_12px_28px_-20px_rgba(0,0,0,0.75)] transition hover:bg-white/[0.06]"
          >
            <StableGridIcon size="md" />
            <div>
              <div className="text-sm font-semibold tracking-[-0.01em]">stableGrid.io</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#91a69c]">
                Control Rail
              </div>
            </div>
          </Link>

          <UserMenuLazy />
        </div>
      </nav>

      <aside
        data-testid="desktop-nav-rail"
        data-nav-mode={isLessonMode ? 'lesson' : 'default'}
        className="fixed inset-y-0 left-0 z-50 hidden px-4 py-4 lg:flex"
      >
        <div
          className={`relative flex h-full flex-col rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,14,13,0.9),rgba(7,9,8,0.94))] p-3 shadow-[0_24px_80px_-44px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl ${
            isLessonMode ? 'w-[4.9rem]' : 'w-[7.75rem]'
          }`}
        >
          <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%)]" />
          <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/28 to-transparent" />

          <Link
            href="/"
            onMouseEnter={() => prefetchRoute('/')}
            onFocus={() => prefetchRoute('/')}
            className={`group relative flex items-center overflow-hidden rounded-[24px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7d4c7]/55 ${
              isLessonMode ? 'justify-center px-0 py-3' : 'flex-col gap-2 px-3 py-4'
            } ${
              isHomeActive
                ? 'border border-white/10 bg-white/[0.03] text-[#eef4f0] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_24px_-24px_rgba(0,0,0,0.98)]'
                : 'border border-transparent bg-transparent text-[#f2f7f4] hover:border-white/8 hover:bg-white/[0.03]'
            }`}
          >
            <span
              className={`inline-flex items-center justify-center rounded-full transition ${
                isLessonMode
                  ? 'h-12 w-12 bg-[linear-gradient(180deg,rgba(18,28,44,0.82),rgba(11,18,32,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : isHomeActive
                    ? 'h-14 w-14 bg-[linear-gradient(180deg,rgba(18,28,44,0.62),rgba(10,16,28,0.84))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'h-14 w-14 bg-[linear-gradient(180deg,rgba(16,21,29,0.42),rgba(10,13,18,0.68))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] group-hover:bg-[linear-gradient(180deg,rgba(18,26,38,0.56),rgba(11,16,24,0.76))]'
              }`}
            >
              <StableGridIcon size="md" />
            </span>
            {isLessonMode ? (
              <span className={desktopLabelPillClass}>Home</span>
            ) : (
              <div className="text-center">
                <div className="text-[12.5px] font-semibold tracking-[-0.015em] text-[#eef4f0]">
                  stableGrid
                </div>
                <div
                  data-testid="desktop-nav-brand-divider"
                  aria-hidden="true"
                  className="mx-auto mt-3 h-px w-14 rounded-full bg-white/22"
                />
              </div>
            )}
          </Link>

          {!isLessonMode ? (
            <div
              data-testid="desktop-nav-divider"
              aria-hidden="true"
              className="mx-3 mt-3 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent"
            />
          ) : null}

          <div
            data-testid="desktop-nav-actions"
            className="mt-4 flex flex-1 flex-col justify-center gap-2"
          >
            {desktopRailItems.map((item) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(pathname, item);
              const isTasksItem = item.href === '/tasks';

              if (isTasksItem) {
                return (
                  <div key={item.href} ref={tasksMenuRef} className="relative">
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={tasksOpen}
                      onClick={() => setTasksOpen((current) => !current)}
                      onMouseEnter={() => {
                        prefetchRoute(item.href);
                        taskDropdownItems.forEach((taskItem) => prefetchRoute(taskItem.href));
                      }}
                      onFocus={() => {
                        prefetchRoute(item.href);
                        taskDropdownItems.forEach((taskItem) => prefetchRoute(taskItem.href));
                      }}
                      className={desktopRailItemClass(isActive || tasksOpen, isLessonMode)}
                    >
                      <span className="relative inline-flex items-center justify-center">
                        <Icon className={`${isLessonMode ? 'h-5 w-5' : 'h-5 w-5'}`} />
                        {isActive ? (
                          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#b6e7ce] shadow-[0_0_18px_rgba(182,231,206,0.88)]" />
                        ) : null}
                      </span>
                      {isLessonMode ? (
                        <>
                          <ChevronDown
                            className={`absolute bottom-1.5 right-1.5 h-3 w-3 text-[#a4b8af] transition-transform ${
                              tasksOpen ? 'rotate-180' : 'rotate-0'
                            }`}
                          />
                          <span className={desktopLabelPillClass}>Tasks</span>
                        </>
                      ) : (
                        <span className="mt-1 flex items-center gap-1 text-[11px] font-medium tracking-[0.01em] text-current">
                          Tasks
                          <ChevronDown
                            className={`h-3 w-3 text-[#9fb2aa] transition-transform ${
                              tasksOpen ? 'rotate-180' : 'rotate-0'
                            }`}
                          />
                        </span>
                      )}
                    </button>

                    {tasksOpen ? (
                      <div
                        role="menu"
                        className="absolute left-[calc(100%+0.95rem)] top-0 z-50 w-[20rem] overflow-hidden rounded-[26px] border border-white/10 bg-[#111513]/95 p-2.5 shadow-[0_28px_90px_-40px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
                      >
                        <div className="px-3 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9db9ab]">
                            Tasks
                          </p>
                          <p className="mt-1.5 text-sm leading-5 text-[#aab6b0]">
                            Pick the working surface you want without leaving the rail.
                          </p>
                        </div>

                        <div className="mx-2 h-px bg-white/8" />

                        <div className="mt-1 space-y-1 px-1">
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
                                className={`group flex items-start gap-3 rounded-[20px] px-3 py-3 transition ${
                                  taskActive ? 'bg-white/[0.07]' : 'hover:bg-white/[0.05]'
                                }`}
                              >
                                <span
                                  className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl border ${
                                    taskActive
                                      ? 'border-white/14 bg-[#243129] text-[#dff1e8]'
                                      : 'border-white/8 bg-white/[0.03] text-[#a2b0aa]'
                                  }`}
                                >
                                  <TaskIcon className="h-4 w-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-medium text-[#edf3ef]">
                                    {taskItem.label}
                                  </span>
                                  <span className="mt-0.5 block text-xs leading-5 text-[#95a39d]">
                                    {taskItem.description}
                                  </span>
                                </span>
                                <ArrowUpRight className="mt-1 h-3.5 w-3.5 text-[#7e8d86] transition group-hover:text-[#d8e7df]" />
                              </Link>
                            );
                          })}
                        </div>

                        <div className="mt-2 border-t border-white/8 px-2 pt-2">
                          <Link
                            href="/tasks"
                            role="menuitem"
                            onClick={() => setTasksOpen(false)}
                            onMouseEnter={() => prefetchRoute('/tasks')}
                            onFocus={() => prefetchRoute('/tasks')}
                            className="inline-flex w-full items-center justify-between rounded-[18px] border border-white/8 bg-white/[0.04] px-3.5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#dfece5] transition hover:bg-white/[0.07]"
                          >
                            Open Tasks Hub
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
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
                  className={desktopRailItemClass(isActive, isLessonMode)}
                >
                  <span className="relative inline-flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                    {isActive ? (
                      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#b6e7ce] shadow-[0_0_18px_rgba(182,231,206,0.88)]" />
                    ) : null}
                  </span>
                  {isLessonMode ? (
                    <span className={desktopLabelPillClass}>{item.label}</span>
                  ) : (
                    <span className="mt-1 text-[11px] font-medium tracking-[0.01em] text-current">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-auto flex flex-col items-center pt-4">
            <UserMenuLazy align="start" placement="right" appearance="rail" />
          </div>
        </div>
      </aside>
    </>
  );
};
