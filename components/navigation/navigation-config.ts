'use client';

import {
  type LucideIcon,
  BookOpen,
  ClipboardCheck,
  Home,
  User,
  Zap
} from 'lucide-react';

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  matchPrefixes?: string[];
}

export const navItems: NavItem[] = [
  { href: '/home', icon: Home, label: 'Home', matchPrefixes: ['/home', '/'] },
  {
    href: '/theory',
    icon: BookOpen,
    label: 'Theory',
    matchPrefixes: ['/theory', '/learn']
  },
  {
    href: '/tasks',
    icon: ClipboardCheck,
    label: 'Tasks',
    matchPrefixes: ['/tasks', '/practice', '/missions', '/flashcards']
  },
  { href: '/energy', icon: Zap, label: 'Grid' },
  { href: '/progress', icon: User, label: 'Character' }
];

export const shouldHideNav = (pathname?: string | null, isAuthenticated?: boolean) => {
  if (!pathname) return false;
  if (!isAuthenticated) {
    return true;
  }
  if (
    pathname.startsWith('/practice/') &&
    pathname !== '/practice/setup' &&
    pathname !== '/practice/notebooks'
  ) {
    return true;
  }
  return ['/login', '/signup', '/reset-password', '/update-password'].includes(pathname);
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
