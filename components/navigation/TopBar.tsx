'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Fingerprint, Wrench, MessageCircle } from 'lucide-react';
import type { AdminRole } from '@/lib/admin/types';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { getUserTier } from '@/lib/energy';
import { StableGridMark } from '@/components/brand/StableGridLogo';
import { isNavItemActive, navItems, shouldHideNav } from './navigation-config';

type WindowWithIdle = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

interface AdminAccessData {
  enabled: boolean;
  role: AdminRole;
}

export const TopBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const hideNav = shouldHideNav(pathname, Boolean(user));

  const prefetchedRoutesRef = useRef<Set<string>>(new Set());
  const [adminAccess, setAdminAccess] = useState<AdminAccessData | null>(null);
  const [hasResolvedAdminAccess, setHasResolvedAdminAccess] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const xp = useProgressStore((state) => state.xp);
  const completedTracks = useProgressStore((state) => state.completedTracks);
  const practiceTasksSolved = useProgressStore((state) => state.practiceTasksSolved);
  const practiceModulesCompleteByTier = useProgressStore(
    (state) => state.practiceModulesCompleteByTier,
  );
  const [progressHydrated, setProgressHydrated] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  const avatarCacheKey = user?.id ? `stablegrid:cached-avatar:${user.id}` : null;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    if (!avatarCacheKey) return null;
    try {
      return window.localStorage.getItem(avatarCacheKey);
    } catch {
      return null;
    }
  });

  useEffect(() => { setProgressHydrated(true); }, []);

  useEffect(() => {
    if (!user?.id || !avatarCacheKey) {
      setAvatarUrl(null);
      return;
    }
    try {
      const cached = window.localStorage.getItem(avatarCacheKey);
      if (cached !== avatarUrl) setAvatarUrl(cached);
    } catch { /* ignore */ }

    let cancelled = false;
    const refetch = async () => {
      try {
        const r = await fetch('/api/profile/avatar', { cache: 'no-store' });
        if (!r.ok || cancelled) return;
        const json = (await r.json()) as { data?: { avatarUrl?: string | null } };
        if (cancelled) return;
        const next = json?.data?.avatarUrl ?? null;
        setAvatarUrl(next);
        try {
          if (next) window.localStorage.setItem(avatarCacheKey, next);
          else window.localStorage.removeItem(avatarCacheKey);
        } catch { /* ignore */ }
      } catch { /* keep cached */ }
    };
    refetch();
    const onUpdated = (e: Event) => {
      const next = (e as CustomEvent<{ avatarUrl: string | null }>).detail?.avatarUrl ?? null;
      setAvatarUrl(next);
      try {
        if (next) window.localStorage.setItem(avatarCacheKey, next);
        else window.localStorage.removeItem(avatarCacheKey);
      } catch { /* ignore */ }
    };
    window.addEventListener('stablegrid:profile-avatar-updated', onUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener('stablegrid:profile-avatar-updated', onUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, avatarCacheKey]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const refetch = async () => {
      try {
        const r = await fetch('/api/user/balance', { cache: 'no-store' });
        if (!r.ok || cancelled) return;
        const json = await r.json();
        if (typeof json?.balance === 'number') setBalance(json.balance);
      } catch { /* keep prior */ }
    };
    refetch();
    window.addEventListener('focus', refetch);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', refetch);
    };
  }, [user?.id]);

  const tier = getUserTier({
    kwh: xp,
    completedTracks,
    practiceTasksSolved,
    practiceModulesCompleteByTier,
  });
  const tierAccent =
    tier === 'senior' ? '#a33800' : tier === 'mid' ? '#cb4a07' : '#594139';
  const tierLabel = tier === 'senior' ? 'Senior' : tier === 'mid' ? 'Mid' : 'Junior';

  const prefetchRoute = useCallback(
    (route: string) => {
      if (prefetchedRoutesRef.current.has(route)) return;
      prefetchedRoutesRef.current.add(route);
      router.prefetch(route);
    },
    [router]
  );

  useEffect(() => {
    const primaryRoutes = ['/home', '/learn'];
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

  useEffect(() => {
    if (!profileMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [profileMenuOpen]);

  useEffect(() => { setProfileMenuOpen(false); }, [pathname]);

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
    <header className="fixed top-0 right-0 left-0 z-50 h-16 bg-surface border-b border-surface-dim">
      <div className="h-full px-8 flex items-center justify-between gap-8">
        <div className="flex items-center gap-12 min-w-0">
          <Link
            href="/home"
            className="font-h2 text-[20px] font-bold text-on-surface tracking-tight shrink-0 lowercase"
          >
            stablegrid
          </Link>
          <nav className="hidden md:flex items-center gap-8 h-16">
            {filteredItems.map((item) => {
              const isActive = isNavItemActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => prefetchRoute(item.href)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`font-ui-label text-[14px] uppercase tracking-wider h-16 flex items-center transition-colors ${
                    isActive
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center h-16 shrink-0">
          <div className="hidden sm:flex items-baseline gap-2 px-4 h-16 leading-none">
            <span className="font-data-mono text-[15px] text-primary tabular-nums">
              {progressHydrated && balance !== null ? balance.toLocaleString() : '—'}
            </span>
            <span className="font-data-mono text-[13px] text-primary uppercase tracking-wider">
              kWh
            </span>
          </div>

          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              aria-label="Profile menu"
              className="flex items-center justify-center w-12 h-16 hover:bg-surface-container transition-colors"
            >
              <div className="w-8 h-8 overflow-hidden border border-on-surface bg-surface-dim flex items-center justify-center">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                    onError={() => setAvatarUrl(null)}
                  />
                ) : progressHydrated ? (
                  <StableGridMark className="h-4 w-4" style={{ color: tierAccent }} />
                ) : null}
              </div>
            </button>
            {profileMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full bg-surface border border-on-surface min-w-[220px]"
              >
                <Link
                  role="menuitem"
                  href="/profile"
                  onMouseEnter={() => prefetchRoute('/profile')}
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 border-b border-surface-dim hover:bg-surface-container"
                >
                  <span className="font-ui-label text-[12px] uppercase tracking-wider text-on-surface">
                    Profile
                  </span>
                  <span className="font-data-mono text-[11px] text-on-surface-variant">
                    {progressHydrated ? tierLabel : ''}
                  </span>
                </Link>
                <Link
                  role="menuitem"
                  href="/settings"
                  onMouseEnter={() => prefetchRoute('/settings')}
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 border-b border-surface-dim hover:bg-surface-container"
                >
                  <Wrench className="h-4 w-4 text-on-surface-variant" strokeWidth={1.5} />
                  <span className="font-ui-label text-[12px] uppercase tracking-wider text-on-surface">
                    Settings
                  </span>
                </Link>
                {adminAccess?.enabled && (
                  <Link
                    role="menuitem"
                    href="/admin"
                    onMouseEnter={() => prefetchRoute('/admin')}
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 border-b border-surface-dim hover:bg-surface-container"
                  >
                    <Fingerprint className="h-4 w-4 text-on-surface-variant" strokeWidth={1.5} />
                    <span className="font-ui-label text-[12px] uppercase tracking-wider text-on-surface">
                      Admin
                    </span>
                  </Link>
                )}
                <Link
                  role="menuitem"
                  href="/support"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container"
                >
                  <MessageCircle className="h-4 w-4 text-on-surface-variant" strokeWidth={1.5} />
                  <span className="font-ui-label text-[12px] uppercase tracking-wider text-on-surface">
                    Help
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
