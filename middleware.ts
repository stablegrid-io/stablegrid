import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

const AUTH_ROUTES = ['/login', '/signup', '/reset-password', '/update-password'];
const PROTECTED_ROUTES = ['/hub', '/missions', '/practice', '/workspace', '/onboarding'];

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/learn/theory', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/hub/:path*',
    '/missions/:path*',
    '/practice/:path*',
    '/workspace/:path*',
    '/onboarding/:path*',
    '/onboarding',
    '/login',
    '/signup',
    '/reset-password',
    '/update-password'
  ]
};
