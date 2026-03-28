'use client';

import {
  type LucideIcon,
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
    href: '/learn/theory',
    icon: BookOpen,
    label: 'Theory',
    matchPrefixes: ['/theory', '/learn']
  }
];

export const shouldHideNav = (pathname?: string | null, _isAuthenticated?: boolean) => {
  if (!pathname) return false;
  const authPages = ['/login', '/signup', '/reset-password', '/update-password'];
  if (authPages.includes(pathname)) return true;
  return false;
};

export const isTheoryLessonPath = (pathname?: string | null) =>
  Boolean(pathname && /^\/learn\/[^/]+\/theory\/[^/]+(?:\/)?$/.test(pathname));

export const isCompactDesktopNavPath = (pathname?: string | null) =>
  Boolean(pathname?.startsWith('/admin')) || isTheoryLessonPath(pathname);

export const isNavItemActive = (pathname: string | null, item: NavItem) =>
  Boolean(
    item.matchPrefixes
      ? item.matchPrefixes.some(
          (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
        )
      : pathname === item.href || pathname?.startsWith(`${item.href}/`)
  );
