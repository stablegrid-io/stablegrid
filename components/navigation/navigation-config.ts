'use client';

import {
  type LucideIcon,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Flag,
  Home,
  Layers3,
  NotebookPen,
  Zap
} from 'lucide-react';

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  matchPrefixes?: string[];
}

export interface TaskDropdownItem {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

export const navItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Home' },
  {
    href: '/learn/theory',
    icon: BookOpen,
    label: 'Theory',
    matchPrefixes: ['/learn']
  },
  {
    href: '/tasks',
    icon: ClipboardCheck,
    label: 'Tasks',
    matchPrefixes: ['/tasks', '/practice', '/missions', '/flashcards']
  },
  { href: '/energy', icon: Zap, label: 'Grid' },
  { href: '/progress', icon: BarChart3, label: 'HRB' }
];

export const taskDropdownItems: TaskDropdownItem[] = [
  {
    href: '/practice/notebooks',
    icon: NotebookPen,
    label: 'Notebooks',
    description: 'Line-by-line review tasks'
  },
  {
    href: '/missions',
    icon: Flag,
    label: 'Missions',
    description: 'Operational incident drills'
  },
  {
    href: '/flashcards',
    icon: Layers3,
    label: 'Flashcards',
    description: 'Rapid theory recall sprints'
  }
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

export const isNavItemActive = (pathname: string | null, item: NavItem) =>
  item.matchPrefixes
    ? item.matchPrefixes.some(
        (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
      )
    : pathname === item.href || pathname?.startsWith(`${item.href}/`);
