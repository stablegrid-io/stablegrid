

import {
  type LucideIcon,
  BarChart3,
  BookOpen,
  Home
} from 'lucide-react';

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  matchPrefixes?: string[];
  disabled?: boolean;
}

export const navItems: NavItem[] = [
  { href: '/home', icon: Home, label: 'Home', matchPrefixes: ['/home', '/'] },
  {
    href: '/learn',
    icon: BookOpen,
    label: 'Learn',
    matchPrefixes: ['/theory', '/learn']
  },
  {
    href: '/progress',
    icon: BarChart3,
    label: 'Progress',
    matchPrefixes: ['/progress']
  },
];

export const shouldHideNav = (pathname?: string | null, _isAuthenticated?: boolean) => {
  if (!pathname) return false;
  // Hide nav on the landing page and auth pages
  if (pathname === '/') return true;
  const authPages = ['/login', '/signup', '/reset-password', '/update-password'];
  if (authPages.includes(pathname)) return true;
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
  Boolean(pathname?.startsWith('/admin')) || isTheoryLessonPath(pathname) || isPracticeSessionPath(pathname);

export const isNavItemActive = (pathname: string | null, item: NavItem) =>
  Boolean(
    item.matchPrefixes
      ? item.matchPrefixes.some(
          (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
        )
      : pathname === item.href || pathname?.startsWith(`${item.href}/`)
  );
