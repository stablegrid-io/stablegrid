'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fingerprint, Wrench, MessageCircle, LogOut } from 'lucide-react';
import type { AdminRole } from '@/lib/admin/types';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHoverPrefetch } from '@/lib/hooks/useHoverPrefetch';
import { usePrefetchData } from '@/lib/hooks/usePrefetchData';
import { getUserTier } from '@/lib/energy';
import { BrandCell } from '@/components/brand/BrandCell';
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
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  const hideNav = shouldHideNav(pathname, Boolean(user));

  // Hover-prefetch: warms the JS chunk for the destination route on hover.
  // Pair with `prefetchData` so the data the route needs on mount is also
  // warm by the time the click lands.
  const prefetchRoute = useHoverPrefetch();
  const prefetchData = usePrefetchData();
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
    tier === 'senior' ? '#e25a1c' : tier === 'mid' ? '#f16527' : '#a88a80';
  const tierLabel = tier === 'senior' ? 'Senior' : tier === 'mid' ? 'Mid' : 'Junior';

  // Eagerly prefetch the routes the topbar can reach: primary nav targets
  // immediately, secondary (settings, profile, admin if present) at idle so
  // we don't compete with above-the-fold work.
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
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sm:gap-6 lg:gap-8">
        <div className="flex items-center gap-12 min-w-0">
          <Link
            href="/home"
            className="flex items-center gap-2.5 font-h2 text-[20px] font-bold text-on-surface tracking-tight shrink-0 lowercase"
          >
            <BrandCell size={22} marker="self" />
            <span>
              stable<span className="text-primary">grid</span>
              <span className="text-on-surface-variant">.io</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 h-16">
            {filteredItems.map((item) => {
              const isActive = isNavItemActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => {
                    prefetchRoute(item.href);
                    prefetchData(item.href);
                  }}
                  onFocus={() => {
                    prefetchRoute(item.href);
                    prefetchData(item.href);
                  }}
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
          {(() => {
            // Battery readout: `146 / 2000 kWh` against a 2k max capacity.
            // Bar replaced with a fraction so the topbar reads at-a-glance
            // without animating pixels. Pre-hydration both numbers fall
            // back to em-dash to keep the layout stable on first paint.
            const BATTERY_MAX_KWH = 2_000;
            const kwh = progressHydrated && balance !== null ? balance : null;
            const remaining =
              kwh === null ? null : Math.max(0, BATTERY_MAX_KWH - kwh);
            const aria =
              kwh === null
                ? 'Battery loading'
                : kwh >= BATTERY_MAX_KWH
                  ? 'Battery full'
                  : `${remaining?.toLocaleString()} kWh until full battery`;

            return (
              <div
                className="hidden sm:flex items-baseline gap-1.5 px-4"
                title={aria}
                aria-label={aria}
              >
                <span className="font-data-mono text-[14px] text-on-surface tabular-nums">
                  {kwh === null ? '—' : kwh.toLocaleString()}
                </span>
                <span className="font-data-mono text-[11px] text-on-surface-variant tabular-nums">
                  / {BATTERY_MAX_KWH.toLocaleString()}
                </span>
                <span className="font-data-mono text-[11px] text-on-surface-variant uppercase tracking-wider">
                  kWh
                </span>
              </div>
            );
          })()}

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
                  <BrandCell mono className="h-4 w-4" style={{ color: tierAccent }} />
                ) : null}
              </div>
            </button>
            {profileMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full bg-surface border border-on-surface w-[min(calc(100vw-1rem),320px)]"
              >
                {/* Header — avatar + identity */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-surface-dim bg-surface-container-low">
                  <div className="w-12 h-12 shrink-0 overflow-hidden border border-on-surface bg-surface flex items-center justify-center">
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
                      <BrandCell mono className="h-6 w-6" style={{ color: tierAccent }} />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <span className="font-serif text-[15px] text-on-surface truncate">
                      {user?.email ?? 'Operator'}
                    </span>
                    <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant tabular-nums">
                      {progressHydrated ? `${tierLabel} · ${balance ?? 0} kWh` : ''}
                    </span>
                  </div>
                </div>

                {/* Tier progression gauge */}
                {progressHydrated && (
                  <div className="px-4 py-3 border-b border-surface-dim">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-data-mono uppercase text-[9px] tracking-wider text-on-surface-variant">
                        Tier progression
                      </span>
                      <span className="font-data-mono uppercase text-[9px] tracking-wider text-on-surface-variant tabular-nums">
                        {tier === 'senior' ? '3 / 3' : tier === 'mid' ? '2 / 3' : '1 / 3'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {(['junior', 'mid', 'senior'] as const).map((t, i) => {
                        const tierIndex = tier === 'senior' ? 2 : tier === 'mid' ? 1 : 0;
                        const reached = i <= tierIndex;
                        return (
                          <div
                            key={t}
                            className={`h-2 ${
                              reached ? 'bg-on-surface' : 'border border-surface-dim bg-surface'
                            }`}
                            title={t.charAt(0).toUpperCase() + t.slice(1)}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Menu rows */}
                <Link
                  role="menuitem"
                  href="/settings"
                  onMouseEnter={() => {
                    prefetchRoute('/settings');
                    prefetchData('/settings');
                  }}
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-dim hover:bg-surface-container transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Wrench className="h-4 w-4 text-on-surface-variant" strokeWidth={1.5} />
                    <span className="font-ui-label text-[12px] uppercase tracking-wider text-on-surface">
                      Settings
                    </span>
                  </span>
                  <span className="font-data-mono uppercase text-[9px] tracking-wider text-on-surface-variant">
                    Profile · Privacy
                  </span>
                </Link>
                {adminAccess?.enabled && (
                  <Link
                    role="menuitem"
                    href="/admin"
                    onMouseEnter={() => {
                      prefetchRoute('/admin');
                      prefetchData('/admin');
                    }}
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-dim hover:bg-surface-container transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Fingerprint className="h-4 w-4 text-on-surface-variant" strokeWidth={1.5} />
                      <span className="font-ui-label text-[12px] uppercase tracking-wider text-on-surface">
                        Admin
                      </span>
                    </span>
                    <span className="font-data-mono uppercase text-[9px] tracking-wider text-on-surface-variant">
                      Customer ops
                    </span>
                  </Link>
                )}
                <Link
                  role="menuitem"
                  href="/support"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-dim hover:bg-surface-container transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4 text-on-surface-variant" strokeWidth={1.5} />
                    <span className="font-ui-label text-[12px] uppercase tracking-wider text-on-surface">
                      Help
                    </span>
                  </span>
                  <span className="font-data-mono uppercase text-[9px] tracking-wider text-on-surface-variant">
                    Email support
                  </span>
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    setProfileMenuOpen(false);
                    try {
                      await signOut();
                    } catch {
                      /* signOut already routes to /login */
                    }
                  }}
                  className="flex items-center justify-between gap-3 px-4 py-3 w-full hover:bg-surface-container transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <LogOut className="h-4 w-4 text-on-surface-variant" strokeWidth={1.5} />
                    <span className="font-ui-label text-[12px] uppercase tracking-wider text-on-surface">
                      Sign out
                    </span>
                  </span>
                  <span className="font-data-mono uppercase text-[9px] tracking-wider text-on-surface-variant">
                    End session
                  </span>
                </button>

                {/* Colophon strip */}
                <div className="px-4 py-2.5 border-t-2 border-on-surface bg-surface-container-low flex items-center justify-between font-data-mono uppercase text-[9px] tracking-wider text-on-surface-variant">
                  <span>Beta</span>
                  <span>stablegrid.io</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
