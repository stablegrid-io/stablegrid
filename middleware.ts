import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

// ── MAINTENANCE MODE ──────────────────────────────────────────────────────────
// Set to true to redirect all traffic to the maintenance page.
// Set to false to restore normal operation.
const MAINTENANCE_MODE = false;

const AUTH_ROUTES = ['/login', '/signup', '/reset-password', '/update-password'];
const PROTECTED_ROUTES = ['/home', '/hub', '/missions', '/practice', '/workspace', '/onboarding', '/operations', '/theory', '/learn', '/settings', '/stats'];
const ADMIN_ROUTES = ['/admin'];

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

export async function middleware(request: NextRequest) {
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

  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  if (!user && (isProtectedRoute || isAdminRoute)) {
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

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|transmission_line|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'
  ]
};
