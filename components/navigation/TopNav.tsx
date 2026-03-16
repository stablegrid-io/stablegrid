'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUpRight, Shield, User } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { StableGridIcon } from '@/components/brand/StableGridLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { AdminRole } from '@/lib/admin/types';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useGridOpsStore } from '@/lib/stores/useGridOpsStore';
import {
  isNavItemActive,
  isCompactDesktopNavPath,
  navItems,
  shouldHideNav
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
      ? 'border-white/12 bg-white/[0.1] text-[#eef6f1] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_14px_24px_-22px_rgba(0,0,0,0.9)]'
      : 'border-transparent bg-white/[0.03] text-[#aeb9b3] hover:border-white/8 hover:bg-white/[0.07] hover:text-[#edf3ef]'
  }`;

const desktopLabelPillClass =
  'pointer-events-none absolute left-[calc(100%+0.8rem)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#111513]/92 px-3 py-1 text-[11px] font-medium tracking-[0.01em] text-[#eef4f0] opacity-0 shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 lg:block';

interface AdminAccessData {
  enabled: boolean;
  role: AdminRole;
}

interface ProfileAvatarResponse {
  data?: {
    avatarUrl?: string | null;
  };
}

const PROFILE_AVATAR_UPDATED_EVENT = 'stablegrid:profile-avatar-updated';

const toAvatarUrl = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const toNickname = (user: SupabaseUser | null) => {
  if (!user) {
    return 'Profile';
  }

  const metadata = user.user_metadata ?? {};
  const metadataCandidates = [
    metadata.nickname,
    metadata.display_name,
    metadata.name,
    metadata.full_name
  ];

  for (const candidate of metadataCandidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  if (typeof user.email === 'string' && user.email.includes('@')) {
    const localPart = user.email.split('@')[0]?.trim();
    if (localPart) {
      return localPart;
    }
  }

  return 'Profile';
};

export const TopNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const activeIncidentCount = useGridOpsStore((s) => s.activeIncidentCount);
  const hideNav = shouldHideNav(pathname, Boolean(user));
  const isLessonMode = isCompactDesktopNavPath(pathname);
  const profileNickname = toNickname(user);
  const desktopRailItems = [
    ...navItems,
    {
      href: '/profile',
      icon: User,
      label: profileNickname,
      matchPrefixes: ['/profile']
    }
  ];
  const profileAvatarUrlRaw = user?.user_metadata?.avatar_url;
  const profileAvatarFallback =
    typeof profileAvatarUrlRaw === 'string' &&
    profileAvatarUrlRaw.trim().length > 0 &&
    !profileAvatarUrlRaw.startsWith('data:')
      ? profileAvatarUrlRaw
      : null;
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());
  const [adminAccess, setAdminAccess] = useState<AdminAccessData | null>(null);
  const [hasResolvedAdminAccess, setHasResolvedAdminAccess] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const resolvedProfileAvatarUrl = profileAvatarUrl ?? profileAvatarFallback;

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
    setAdminAccess(null);
    setHasResolvedAdminAccess(false);
  }, [user?.id]);

  useEffect(() => {
    const primaryRoutes = ['/home', '/theory', '/tasks', '/progress', '/energy'];
    const secondaryRoutes = ['/settings', '/profile'];

    const prefetchPrimary = () => {
      primaryRoutes.forEach((route) => {
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
    if (!user?.id || hasResolvedAdminAccess) {
      return;
    }

    const abortController = new AbortController();

    const loadAdminAccess = async () => {
      try {
        const response = await fetch('/api/admin/access', {
          method: 'GET',
          signal: abortController.signal
        });

        if (abortController.signal.aborted) {
          return;
        }

        if (!response.ok) {
          setAdminAccess(null);
          setHasResolvedAdminAccess(true);
          return;
        }

        const payload = (await response.json()) as {
          data?: AdminAccessData;
        };

        if (abortController.signal.aborted) {
          return;
        }

        setAdminAccess(payload?.data?.enabled ? payload.data : null);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        console.error('Failed to check admin access from nav rail:', error);
        setAdminAccess(null);
      } finally {
        if (!abortController.signal.aborted) {
          setHasResolvedAdminAccess(true);
        }
      }
    };

    void loadAdminAccess();

    return () => {
      abortController.abort();
    };
  }, [hasResolvedAdminAccess, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setProfileAvatarUrl(null);
      return;
    }

    const abortController = new AbortController();

    const loadProfileAvatar = async () => {
      try {
        const response = await fetch('/api/profile/avatar', {
          method: 'GET',
          signal: abortController.signal
        });

        if (abortController.signal.aborted || !response.ok) {
          return;
        }

        const payload = (await response.json()) as ProfileAvatarResponse;
        if (abortController.signal.aborted) {
          return;
        }

        setProfileAvatarUrl(toAvatarUrl(payload?.data?.avatarUrl));
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        console.error('Failed to load profile avatar from nav rail:', error);
      }
    };

    void loadProfileAvatar();

    return () => {
      abortController.abort();
    };
  }, [user?.id]);

  useEffect(() => {
    const handleProfileAvatarUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ avatarUrl?: string | null }>;
      setProfileAvatarUrl(toAvatarUrl(customEvent.detail?.avatarUrl));
    };

    window.addEventListener(PROFILE_AVATAR_UPDATED_EVENT, handleProfileAvatarUpdated);

    return () => {
      window.removeEventListener(PROFILE_AVATAR_UPDATED_EVENT, handleProfileAvatarUpdated);
    };
  }, []);

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
            href="/home"
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[#edf3ef] shadow-[0_12px_28px_-20px_rgba(0,0,0,0.75)] transition hover:bg-white/[0.06]"
          >
            <StableGridIcon
              size="md"
              className="shadow-[0_10px_22px_-14px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)]"
            />
            <div>
              <div className="text-sm font-semibold tracking-[-0.01em]">stableGrid.io</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#91a69c]">
                Control Rail
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserMenuLazy />
          </div>
        </div>
        {adminAccess?.enabled ? (
          <div className="relative border-t border-white/8 px-4 pb-3 pt-2">
            <Link
              href="/admin"
              onMouseEnter={() => prefetchRoute('/admin')}
              onFocus={() => prefetchRoute('/admin')}
              className="group relative flex items-center justify-between overflow-hidden rounded-[20px] border border-[#72dbc2]/20 bg-[linear-gradient(135deg,rgba(18,61,53,0.72),rgba(11,18,17,0.96))] px-3.5 py-3 text-[#edf7f2] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_40px_-28px_rgba(0,0,0,0.95)] transition hover:border-[#8be7d1]/28 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_22px_48px_-30px_rgba(0,0,0,0.98)]"
            >
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(99,255,212,0.14),transparent_34%),radial-gradient(circle_at_right,rgba(255,255,255,0.08),transparent_30%)] opacity-90 transition group-hover:opacity-100" />
              <span className="relative flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[16px] border border-white/12 bg-white/[0.08] text-[#baf6e6]">
                  <Shield className="h-4.5 w-4.5" />
                </span>
                <span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9fd8c8]">
                    Internal
                  </span>
                  <span className="mt-1 block text-sm font-semibold tracking-[-0.01em] text-white">
                    Admin Console
                  </span>
                </span>
              </span>
              <ArrowUpRight className="relative h-4.5 w-4.5 text-[#d7efe7] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        ) : null}
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

          <div
            data-testid="desktop-nav-actions"
            className="mt-1 flex flex-1 flex-col justify-center gap-2"
          >
            {desktopRailItems.map((item) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(pathname, item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => prefetchRoute(item.href)}
                  onFocus={() => prefetchRoute(item.href)}
                  className={desktopRailItemClass(isActive, isLessonMode)}
                >
                  <span className="relative inline-flex items-center justify-center">
                    {item.href === '/settings' && resolvedProfileAvatarUrl ? (
                      <span
                        className={`inline-flex overflow-hidden rounded-full border border-white/20 bg-white/[0.08] ${
                          isLessonMode ? 'h-8 w-8' : 'h-11 w-11'
                        }`}
                      >
                        <Image
                          src={resolvedProfileAvatarUrl}
                          alt="Profile avatar"
                          width={isLessonMode ? 32 : 44}
                          height={isLessonMode ? 32 : 44}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      </span>
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                    {/* Incident badge on the Grid nav item */}
                    {item.href === '/energy' && activeIncidentCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-rose-500 px-[3px] text-[9px] font-bold leading-none text-white shadow-[0_0_6px_rgba(244,63,94,0.6)]">
                        {activeIncidentCount > 9 ? '9+' : activeIncidentCount}
                      </span>
                    )}
                  </span>
                  {isLessonMode ? (
                    <span className={desktopLabelPillClass}>{item.label}</span>
                  ) : (
                    <span className="mt-1 max-w-full truncate text-[11px] font-medium tracking-[0.01em] text-current">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-auto flex w-full flex-col items-center gap-3 pt-4">
            <ThemeToggle />
            {adminAccess?.enabled ? (
              isLessonMode ? (
                <Link
                  href="/admin"
                  onMouseEnter={() => prefetchRoute('/admin')}
                  onFocus={() => prefetchRoute('/admin')}
                  className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[22px] border border-[#6ce0c6]/20 bg-[linear-gradient(180deg,rgba(17,58,50,0.84),rgba(8,15,14,0.96))] text-[#eef8f3] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_28px_-22px_rgba(0,0,0,0.98)] transition hover:border-[#87ead4]/32"
                >
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(112,255,220,0.18),transparent_46%)]" />
                  <Shield className="relative h-5 w-5" />
                  <span className={desktopLabelPillClass}>Admin Console</span>
                </Link>
              ) : (
                <Link
                  href="/admin"
                  onMouseEnter={() => prefetchRoute('/admin')}
                  onFocus={() => prefetchRoute('/admin')}
                  className="group relative w-full overflow-hidden rounded-[24px] border border-[#6ce0c6]/20 bg-[linear-gradient(155deg,rgba(18,61,53,0.82),rgba(10,15,14,0.98))] px-2.5 py-3 text-[#eef8f3] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_50px_-34px_rgba(0,0,0,0.98)] transition hover:border-[#88ead5]/28 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_28px_55px_-36px_rgba(0,0,0,0.98)]"
                >
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(94,255,218,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]" />
                  <span className="relative flex flex-col items-center gap-2 text-center">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/12 bg-white/[0.08] text-[#baf6e6] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <Shield className="h-4.5 w-4.5" />
                    </span>
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.24em] text-[#9fd8c8]">
                      Internal
                    </span>
                    <span className="block leading-none">
                      <span className="block text-[12px] font-semibold tracking-[-0.015em] text-white">
                        Admin
                      </span>
                      <span className="mt-1 block text-[10px] font-medium tracking-[0.08em] text-[#c2e8dd]">
                        Console
                      </span>
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#d7efe7] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              )
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
};
