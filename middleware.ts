import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

// ── MAINTENANCE MODE ──────────────────────────────────────────────────────────
// Set to true to redirect all traffic to the maintenance page.
// Set to false to restore normal operation.
const MAINTENANCE_MODE = false;

const AUTH_ROUTES = ['/login', '/signup', '/reset-password', '/update-password'];
// /theory and /learn are intentionally public — topic landings + track-level
// pages are SEO surface. Deep reading sessions (?chapter, ?practice, ?capstone)
// are still gated below via isLearnSession.
const PROTECTED_ROUTES = ['/home', '/hub', '/missions', '/practice', '/workspace', '/onboarding', '/operations', '/settings', '/stats'];
const ADMIN_ROUTES = ['/admin'];
const LEARN_SESSION_PARAMS = ['chapter', 'practice', 'capstone'] as const;

/* ── Admin membership cache (5-minute TTL) ── */
const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000;
const adminCache = new Map<string, { isAdmin: boolean; expiresAt: number }>();

const hasAdminMembership = async (userId: string) => {
  const cached = adminCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.isAdmin;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role environment variables.');
  }

  const membershipUrl = new URL('/rest/v1/admin_memberships', supabaseUrl);
  membershipUrl.searchParams.set('select', 'user_id');
  membershipUrl.searchParams.set('user_id', `eq.${userId}`);
  membershipUrl.searchParams.set('limit', '1');

  const response = await fetch(membershipUrl.toString(), {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: 'application/json'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to verify admin membership (${response.status}).`);
  }

  const data = (await response.json()) as Array<{ user_id: string }>;
  const isAdmin = Array.isArray(data) && data.length > 0;

  adminCache.set(userId, { isAdmin, expiresAt: Date.now() + ADMIN_CACHE_TTL_MS });

  // Evict stale entries to prevent unbounded growth
  if (adminCache.size > 200) {
    const now = Date.now();
    for (const [key, entry] of adminCache) {
      if (now >= entry.expiresAt) adminCache.delete(key);
    }
  }

  return isAdmin;
};

/* ── Onboarding-completed cache (5-minute TTL) ── */
// Without this gate a user who closes the tab mid-onboarding never sees the
// flow again — the OAuth callback only fires once and subsequent visits land
// directly on /home. We re-check on every protected route until the flag
// flips, then cache the positive result so onboarded users don't pay the
// round-trip on every navigation.
const ONBOARDING_CACHE_TTL_MS = 5 * 60 * 1000;
const onboardingCache = new Map<string, { completed: boolean; expiresAt: number }>();

const hasCompletedOnboarding = async (userId: string) => {
  const cached = onboardingCache.get(userId);
  if (cached && cached.completed && Date.now() < cached.expiresAt) {
    return true;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role environment variables.');
  }

  const profileUrl = new URL('/rest/v1/profiles', supabaseUrl);
  profileUrl.searchParams.set('select', 'onboarding_completed');
  profileUrl.searchParams.set('id', `eq.${userId}`);
  profileUrl.searchParams.set('limit', '1');

  const response = await fetch(profileUrl.toString(), {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: 'application/json'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    // Fail open — never block on a transient profile-read failure.
    return true;
  }

  const data = (await response.json()) as Array<{ onboarding_completed: boolean | null }>;
  const completed = Array.isArray(data) && data.length > 0
    ? Boolean(data[0]?.onboarding_completed)
    : false;

  onboardingCache.set(userId, { completed, expiresAt: Date.now() + ONBOARDING_CACHE_TTL_MS });

  if (onboardingCache.size > 200) {
    const now = Date.now();
    for (const [key, entry] of onboardingCache) {
      if (now >= entry.expiresAt) onboardingCache.delete(key);
    }
  }

  return completed;
};

export async function middleware(request: NextRequest) {
  // Canonical-host redirect: send any *.vercel.app traffic to the apex domain.
  // Keeps the .vercel.app preview URL out of search results and locks the
  // canonical surface to stablegrid.io. Path + query string are preserved.
  const host = request.headers.get('host') ?? '';
  if (host.endsWith('.vercel.app')) {
    const canonical = new URL(request.nextUrl.toString());
    canonical.host = 'stablegrid.io';
    canonical.protocol = 'https:';
    canonical.port = '';
    return NextResponse.redirect(canonical, 308);
  }

  // Maintenance mode: redirect everything except / and static assets
  if (MAINTENANCE_MODE) {
    const { pathname } = request.nextUrl;
    if (pathname !== '/' && !pathname.startsWith('/_next') && !pathname.startsWith('/icon') && !pathname.startsWith('/favicon')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  const { supabase, response } = createMiddlewareClient(request);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname, searchParams } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const isLearnSession =
    pathname.startsWith('/learn/') &&
    LEARN_SESSION_PARAMS.some((param) => searchParams.has(param));

  if (!user && (isProtectedRoute || isAdminRoute || isLearnSession)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && isAdminRoute) {
    const isAdmin = await hasAdminMembership(user.id);

    if (!isAdmin) {
      return new NextResponse('Forbidden', {
        status: 403,
        headers: {
          'content-type': 'text/plain; charset=utf-8'
        }
      });
    }
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Authenticated users visiting the landing page get redirected to dashboard
  if (user && pathname === '/') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Onboarding gate: any protected page (other than /onboarding itself or
  // admin) must wait until profiles.onboarding_completed is true. Admin
  // membership implies an internal user who already has activity; don't
  // block them on a missing flag.
  if (
    user &&
    (isProtectedRoute || isLearnSession) &&
    !pathname.startsWith('/onboarding') &&
    !isAdminRoute
  ) {
    const completed = await hasCompletedOnboarding(user.id);
    if (!completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|transmission_line|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'
  ]
};
