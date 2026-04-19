

import {
  type LucideIcon,
  Radar,
  Atom,
  Braces,
  TrendingUp
} from 'lucide-react';

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  matchPrefixes?: string[];
  disabled?: boolean;
}

export const navItems: NavItem[] = [
  { href: '/home', icon: Radar, label: 'Home', matchPrefixes: ['/home', '/'] },
  {
    href: '/learn',
    icon: Atom,
    label: 'Learn',
    matchPrefixes: ['/theory', '/learn']
  },
  {
    href: '/cheat-sheets',
    icon: Braces,
    label: 'Cheat Sheets',
    matchPrefixes: ['/cheat-sheets']
  },
  {
    href: '/progress',
    icon: TrendingUp,
    label: 'Progress',
    matchPrefixes: ['/progress']
  },
];

export const shouldHideNav = (pathname?: string | null, isAuthenticated?: boolean) => {
  if (!pathname) return false;
  // Hide nav on the landing page and auth pages
  if (pathname === '/') return true;
  const authPages = ['/login', '/signup', '/reset-password', '/update-password'];
  if (authPages.includes(pathname)) return true;
  // Hide nav on public pages when not authenticated
  const publicPages = ['/privacy', '/terms', '/support', '/support/report-bug'];
  if (!isAuthenticated && publicPages.includes(pathname)) return true;
  return false;
};

export const isTheoryLessonPath = (pathname?: string | null) =>
  Boolean(pathname && /^\/learn\/[^/]+\/theory\/[^/]+(?:\/)?$/.test(pathname));

export const isPracticeSessionPath = (pathname?: string | null, search?: string | null) => {
  if (!pathname) return false;
  if (/^\/operations\/practice\/[^/]+\/[^/]+\/[^/]+(?:\/session)?(?:\/)?$/.test(pathname)) return true;
  if (/^\/learn\/[^/]+\/theory\/[^/]+(?:\/)?$/.test(pathname) && search && /[?&]practice=/.test(search)) return true;
  return false;
};

export const isCompactDesktopNavPath = (pathname?: string | null) =>
  Boolean(pathname?.startsWith('/admin')) || Boolean(pathname?.startsWith('/cheat-sheets')) || isTheoryLessonPath(pathname) || isPracticeSessionPath(pathname);

export const isNavItemActive = (pathname: string | null, item: NavItem) =>
  Boolean(
    item.matchPrefixes
      ? item.matchPrefixes.some(
          (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
        )
      : pathname === item.href || pathname?.startsWith(`${item.href}/`)
  );
