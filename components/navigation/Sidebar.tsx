'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Settings, HelpCircle } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { AdminRole } from '@/lib/admin/types';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { StableGridIcon } from '@/components/brand/StableGridLogo';
import {
  isNavItemActive,
  isCompactDesktopNavPath,
  navItems,
  shouldHideNav
} from './navigation-config';

type WindowWithIdle = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

interface AdminAccessData {
  enabled: boolean;
  role: AdminRole;
}

interface ProfileAvatarResponse {
  data?: { avatarUrl?: string | null };
}

const PROFILE_AVATAR_UPDATED_EVENT = 'stablegrid:profile-avatar-updated';

const toAvatarUrl = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const toNickname = (user: SupabaseUser | null) => {
  if (!user) return 'Operator';
  const metadata = user.user_metadata ?? {};
  for (const candidate of [metadata.nickname, metadata.display_name, metadata.name, metadata.full_name]) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) return candidate.trim();
  }
  if (typeof user.email === 'string' && user.email.includes('@')) {
    const localPart = user.email.split('@')[0]?.trim();
    if (localPart) return localPart;
  }
  return 'Operator';
};

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const hideNav = shouldHideNav(pathname, Boolean(user));
  const isCompact = isCompactDesktopNavPath(pathname);
  const nickname = toNickname(user);

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
  const [profileName, setProfileName] = useState<string | null>(null);
  const resolvedAvatarUrl = profileAvatarUrl ?? profileAvatarFallback;
  const displayName = profileName ?? nickname;

  const prefetchRoute = useCallback(
    (route: string) => {
      if (prefetchedRoutesRef.current.has(route)) return;
      prefetchedRoutesRef.current.add(route);
      router.prefetch(route);
    },
    [router]
  );

  // Prefetch routes
  useEffect(() => {
    const primaryRoutes = ['/home', '/theory'];
    const secondaryRoutes = ['/settings', '/profile'];
    const prefetchPrimary = () => primaryRoutes.forEach(prefetchRoute);
    const prefetchSecondary = () => secondaryRoutes.forEach(prefetchRoute);

    const immediateId = setTimeout(prefetchPrimary, 0);
    const win = window as WindowWithIdle;

    if (typeof win.requestIdleCallback === 'function') {
      const idleId = win.requestIdleCallback(prefetchSecondary, { timeout: 1200 });
      return () => { clearTimeout(immediateId); win.cancelIdleCallback?.(idleId); };
    }
    const timeoutId = setTimeout(prefetchSecondary, 400);
    return () => { clearTimeout(immediateId); clearTimeout(timeoutId); };
  }, [prefetchRoute]);

  // Admin access
  useEffect(() => { setAdminAccess(null); setHasResolvedAdminAccess(false); }, [user?.id]);

  useEffect(() => {
    if (!user?.id || hasResolvedAdminAccess) return;
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/admin/access', { signal: ac.signal });
        if (ac.signal.aborted) return;
        if (!res.ok) { setAdminAccess(null); setHasResolvedAdminAccess(true); return; }
        const payload = (await res.json()) as { data?: AdminAccessData };
        if (ac.signal.aborted) return;
        setAdminAccess(payload?.data?.enabled ? payload.data : null);
      } catch {
        if (!ac.signal.aborted) setAdminAccess(null);
      } finally {
        if (!ac.signal.aborted) setHasResolvedAdminAccess(true);
      }
    })();
    return () => ac.abort();
  }, [hasResolvedAdminAccess, user?.id]);

  // Avatar + profile name loading
  useEffect(() => {
    if (!user?.id) { setProfileAvatarUrl(null); setProfileName(null); return; }
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/profile/avatar', { signal: ac.signal });
        if (ac.signal.aborted || !res.ok) return;
        const payload = (await res.json()) as ProfileAvatarResponse;
        if (!ac.signal.aborted) {
          setProfileAvatarUrl(toAvatarUrl(payload?.data?.avatarUrl));
          const fullName = (payload?.data as Record<string, unknown>)?.fullName;
          if (typeof fullName === 'string' && fullName.trim().length > 0) {
            setProfileName(fullName.trim());
          }
        }
      } catch { /* ignore */ }
    })();
    return () => ac.abort();
  }, [user?.id]);

  // Avatar update events
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ avatarUrl?: string | null }>;
      setProfileAvatarUrl(toAvatarUrl(ce.detail?.avatarUrl));
    };
    window.addEventListener(PROFILE_AVATAR_UPDATED_EVENT, handler);
    return () => window.removeEventListener(PROFILE_AVATAR_UPDATED_EVENT, handler);
  }, []);

  if (hideNav) return null;

  const filteredItems = navItems.filter((item) => !item.disabled);

  return (
    <aside
      data-compact={isCompact ? 'true' : undefined}
      className={`fixed left-0 top-0 h-full bg-[#0c0e10]/80 backdrop-blur-2xl border-r border-white/[0.06] flex-col pt-14 pb-5 z-40 hidden lg:flex transition-[width] duration-200 ${
        isCompact ? 'w-16' : 'w-48'
      }`}
    >
      {/* User section */}
      <div className={`${isCompact ? 'px-3 py-4 flex justify-center' : 'px-4 py-5'}`}>
        {isCompact ? (
          <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0">
            {resolvedAvatarUrl ? (
              <Image src={resolvedAvatarUrl} alt="Avatar" width={36} height={36} unoptimized className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/[0.06] flex items-center justify-center">
                <StableGridIcon size="sm" className="w-full h-full border-0" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0">
              {resolvedAvatarUrl ? (
                <Image src={resolvedAvatarUrl} alt="Avatar" width={40} height={40} unoptimized className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/[0.06] flex items-center justify-center">
                  <StableGridIcon size="sm" className="w-full h-full border-0" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-on-surface truncate">
                {displayName}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item);

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => prefetchRoute(item.href)}
              title={isCompact ? item.label : undefined}
              className={`group relative flex items-center ${isCompact ? 'justify-center px-0 py-2.5 rounded-lg' : 'gap-3 px-3 py-2 rounded-lg'} text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white/[0.08] text-on-surface'
                  : 'text-on-surface-variant/60 hover:text-on-surface-variant hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`flex-shrink-0 ${isCompact ? 'h-5 w-5' : 'h-[18px] w-[18px]'}`} />
              {!isCompact && <span>{item.label}</span>}
              {isCompact && (
                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-lg bg-surface-container/95 backdrop-blur-lg border border-white/[0.06] px-2.5 py-1.5 text-[11px] font-medium text-on-surface opacity-0 shadow-lg group-hover:opacity-100 transition-opacity z-50">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className={`pt-3 border-t border-white/[0.06] space-y-0.5 ${isCompact ? 'px-2' : 'px-2'}`}>
        {adminAccess?.enabled && (
          <Link
            href="/admin"
            onMouseEnter={() => prefetchRoute('/admin')}
            title={isCompact ? 'Admin' : undefined}
            className={`group relative flex items-center ${isCompact ? 'justify-center py-2 rounded-lg' : 'gap-3 px-3 py-2 rounded-lg'} text-on-surface-variant/40 hover:text-on-surface-variant hover:bg-white/[0.04] text-[13px] font-medium transition-all duration-150`}
          >
            <Shield className="h-[18px] w-[18px]" />
            {!isCompact && <span>Admin</span>}
          </Link>
        )}
        <Link
          href="/settings"
          onMouseEnter={() => prefetchRoute('/settings')}
          title={isCompact ? 'Settings' : undefined}
          className={`group relative flex items-center ${isCompact ? 'justify-center py-2 rounded-lg' : 'gap-3 px-3 py-2 rounded-lg'} text-on-surface-variant/40 hover:text-on-surface-variant hover:bg-white/[0.04] text-[13px] font-medium transition-all duration-150`}
        >
          <Settings className="h-[18px] w-[18px]" />
          {!isCompact && <span>Settings</span>}
        </Link>
        <Link
          href="/support"
          title={isCompact ? 'Support' : undefined}
          className={`group relative flex items-center ${isCompact ? 'justify-center py-2 rounded-lg' : 'gap-3 px-3 py-2 rounded-lg'} text-on-surface-variant/40 hover:text-on-surface-variant hover:bg-white/[0.04] text-[13px] font-medium transition-all duration-150`}
        >
          <HelpCircle className="h-[18px] w-[18px]" />
          {!isCompact && <span>Support</span>}
        </Link>
      </div>
    </aside>
  );
};
