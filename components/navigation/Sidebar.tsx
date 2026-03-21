'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Settings, HelpCircle } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { AdminRole } from '@/lib/admin/types';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useGridOpsStore } from '@/lib/stores/useGridOpsStore';
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
  const activeIncidentCount = useGridOpsStore((s) => s.activeIncidentCount);
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
  const resolvedAvatarUrl = profileAvatarUrl ?? profileAvatarFallback;

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
    const primaryRoutes = ['/home', '/theory', '/assignments', '/progress', '/energy'];
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

  // Avatar loading
  useEffect(() => {
    if (!user?.id) { setProfileAvatarUrl(null); return; }
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/profile/avatar', { signal: ac.signal });
        if (ac.signal.aborted || !res.ok) return;
        const payload = (await res.json()) as ProfileAvatarResponse;
        if (!ac.signal.aborted) setProfileAvatarUrl(toAvatarUrl(payload?.data?.avatarUrl));
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
      className={`fixed left-0 top-0 h-full bg-[#0c0e10] border-r border-[#99f7ff]/10 flex-col pt-14 pb-6 z-40 hidden lg:flex transition-[width] duration-200 ${
        isCompact ? 'w-16' : 'w-64'
      }`}
    >
      {/* User section */}
      <div className={`border-b border-[#99f7ff]/10 ${isCompact ? 'px-3 py-4 flex justify-center' : 'px-5 py-5'}`}>
        {isCompact ? (
          <div className="w-9 h-9 border border-primary/30 p-0.5 flex-shrink-0">
            {resolvedAvatarUrl ? (
              <Image src={resolvedAvatarUrl} alt="Avatar" width={32} height={32} unoptimized className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-container flex items-center justify-center">
                <StableGridIcon size="sm" className="w-full h-full border-0" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            {/* Larger avatar */}
            <div className="w-16 h-16 border border-primary/30 p-0.5 mb-3">
              {resolvedAvatarUrl ? (
                <Image src={resolvedAvatarUrl} alt="Avatar" width={60} height={60} unoptimized className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-container flex items-center justify-center">
                  <StableGridIcon size="sm" className="w-full h-full border-0" />
                </div>
              )}
            </div>
            {/* Name */}
            <div className="font-mono text-xs font-bold uppercase text-[#00F2FF]">
              {nickname}
            </div>
            {/* Level badge */}
            <div className="mt-1.5 inline-flex items-center gap-1.5 border border-primary/20 bg-primary/5 px-2 py-0.5">
              <span className="w-1 h-1 bg-primary" />
              <span className="font-mono text-[8px] text-primary/70 tracking-widest uppercase">ONLINE</span>
            </div>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item);

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => prefetchRoute(item.href)}
              title={isCompact ? item.label : undefined}
              className={`group relative flex items-center ${isCompact ? 'justify-center px-0 py-3 mx-2' : 'gap-4 px-6 py-3'} font-mono text-xs uppercase tracking-widest transition-colors duration-100 ${
                isActive
                  ? 'bg-[#99f7ff]/10 text-[#99f7ff] border-l-4 border-[#00F2FF] font-bold'
                  : 'text-slate-500 hover:text-[#99f7ff]/70 hover:bg-[#00F2FF]/5'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCompact && <span>{item.label}</span>}
              {!isCompact && item.href === '/energy' && activeIncidentCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center bg-error px-1 text-[9px] font-bold text-on-error">
                  {activeIncidentCount > 9 ? '9+' : activeIncidentCount}
                </span>
              )}
              {isCompact && item.href === '/energy' && activeIncidentCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center bg-error px-0.5 text-[8px] font-bold text-on-error">
                  {activeIncidentCount > 9 ? '9+' : activeIncidentCount}
                </span>
              )}
              {/* Tooltip for compact mode */}
              {isCompact && (
                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap border border-outline-variant/30 bg-surface-container px-2 py-1 font-mono text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className={`pt-4 border-t border-[#99f7ff]/10 space-y-2 ${isCompact ? 'px-2' : 'px-6'}`}>
        {adminAccess?.enabled && (
          <Link
            href="/admin"
            onMouseEnter={() => prefetchRoute('/admin')}
            title={isCompact ? 'Admin' : undefined}
            className={`group relative flex items-center ${isCompact ? 'justify-center py-2' : 'gap-4 py-2'} text-[#99f7ff]/40 hover:text-[#99f7ff] font-mono text-[10px] uppercase tracking-widest transition-colors`}
          >
            <Shield className="h-4 w-4" />
            {!isCompact && <span>Admin</span>}
          </Link>
        )}
        <Link
          href="/settings"
          onMouseEnter={() => prefetchRoute('/settings')}
          title={isCompact ? 'Settings' : undefined}
          className={`group relative flex items-center ${isCompact ? 'justify-center py-2' : 'gap-4 py-2'} text-[#99f7ff]/40 hover:text-[#99f7ff] font-mono text-[10px] uppercase tracking-widest transition-colors`}
        >
          <Settings className="h-4 w-4" />
          {!isCompact && <span>Settings</span>}
        </Link>
        <Link
          href="/support"
          title={isCompact ? 'Support' : undefined}
          className={`group relative flex items-center ${isCompact ? 'justify-center py-2' : 'gap-4 py-2'} text-[#99f7ff]/40 hover:text-[#99f7ff] font-mono text-[10px] uppercase tracking-widest transition-colors`}
        >
          <HelpCircle className="h-4 w-4" />
          {!isCompact && <span>Support</span>}
        </Link>
      </div>
    </aside>
  );
};
