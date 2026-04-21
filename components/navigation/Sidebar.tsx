'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Fingerprint, Wrench, MessageCircle } from 'lucide-react';
import type { AdminRole } from '@/lib/admin/types';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { getUserTier, getTierProfileImage } from '@/lib/energy';
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

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const hideNav = shouldHideNav(pathname, Boolean(user));
  const isCompact = isCompactDesktopNavPath(pathname);

  const prefetchedRoutesRef = useRef<Set<string>>(new Set());
  const [adminAccess, setAdminAccess] = useState<AdminAccessData | null>(null);
  const [hasResolvedAdminAccess, setHasResolvedAdminAccess] = useState(false);
  const xp = useProgressStore((state) => state.xp);
  const tier = getUserTier(xp);
  const resolvedAvatarUrl = getTierProfileImage(tier);
  const tierRgb =
    tier === 'senior' ? '255,113,108' : tier === 'mid' ? '255,201,101' : '153,247,255';
  const tierAccent =
    tier === 'senior' ? '#ff716c' : tier === 'mid' ? '#ffc965' : '#99f7ff';
  const tierLabel = tier === 'senior' ? 'Senior' : tier === 'mid' ? 'Mid' : 'Junior';

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
      <div className={`${isCompact ? 'px-3 py-2 flex justify-center' : 'px-4 py-2'}`}>
        {isCompact ? (
          <div
            className="relative w-10 h-10 shrink-0 overflow-hidden rounded-full ring-2"
            style={{ ['--tw-ring-color' as string]: `rgba(${tierRgb},0.4)` }}
          >
            <Image src={resolvedAvatarUrl} alt={`${tier} avatar`} fill unoptimized className="object-cover" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div
              className="relative w-12 h-12 shrink-0 overflow-hidden rounded-full ring-2"
              style={{ ['--tw-ring-color' as string]: `rgba(${tierRgb},0.4)` }}
            >
              <Image src={resolvedAvatarUrl} alt={`${tier} avatar`} fill unoptimized className="object-cover" />
            </div>
            <div
              className="min-w-0 flex flex-col leading-tight"
              style={{ fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif' }}
            >
              <div
                className="text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: tierAccent }}
              >
                {tierLabel}
              </div>
              <div className="mt-1.5">
                <div className="text-[8.5px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant/35">
                  Total earned
                </div>
                <div className="text-[12px] font-semibold text-white tabular-nums leading-tight">
                  {xp.toLocaleString()} <span className="font-medium text-white/50">kWh</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className={`${isCompact ? 'mx-1' : 'mx-1'} mt-4 h-px bg-white/[0.06]`} />

      {/* Nav links */}
      <nav className="flex-1 pt-6 pb-3 px-2 space-y-0.5">
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
            <Fingerprint className="h-[18px] w-[18px]" />
            {!isCompact && <span>Admin</span>}
          </Link>
        )}
        <Link
          href="/settings"
          onMouseEnter={() => prefetchRoute('/settings')}
          title={isCompact ? 'Settings' : undefined}
          className={`group relative flex items-center ${isCompact ? 'justify-center py-2 rounded-lg' : 'gap-3 px-3 py-2 rounded-lg'} text-on-surface-variant/40 hover:text-on-surface-variant hover:bg-white/[0.04] text-[13px] font-medium transition-all duration-150`}
        >
          <Wrench className="h-[18px] w-[18px]" />
          {!isCompact && <span>Settings</span>}
        </Link>
        <Link
          href="/support"
          title={isCompact ? 'Support' : undefined}
          className={`group relative flex items-center ${isCompact ? 'justify-center py-2 rounded-lg' : 'gap-3 px-3 py-2 rounded-lg'} text-on-surface-variant/40 hover:text-on-surface-variant hover:bg-white/[0.04] text-[13px] font-medium transition-all duration-150`}
        >
          <MessageCircle className="h-[18px] w-[18px]" />
          {!isCompact && <span>Support</span>}
        </Link>
      </div>
    </aside>
  );
};
