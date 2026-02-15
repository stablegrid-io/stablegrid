import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

const AUTH_ROUTES = ['/login', '/signup', '/reset-password', '/update-password'];
const PROTECTED_ROUTES = ['/hub', '/missions', '/practice', '/workspace'];

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/hub', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/hub/:path*',
    '/missions/:path*',
    '/practice/:path*',
    '/workspace/:path*',
    '/login',
    '/signup',
    '/reset-password',
    '/update-password'
  ]
};
