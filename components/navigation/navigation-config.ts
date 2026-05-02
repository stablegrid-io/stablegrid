

import {
  type LucideIcon,
  Home,
  BookOpen,
  Target,
  TrendingUp
} from 'lucide-react';
import { SubstationIcon } from './icons/SubstationIcon';
import { GridLogoIcon } from './icons/GridLogoIcon';

export interface NavItem {
  href: string;
  icon: LucideIcon | typeof SubstationIcon | typeof GridLogoIcon;
  label: string;
  matchPrefixes?: string[];
  disabled?: boolean;
}

export const navItems: NavItem[] = [
  { href: '/home', icon: Home, label: 'Home', matchPrefixes: ['/home', '/'] },
  {
    href: '/learn',
    icon: BookOpen,
    label: 'Theory',
    matchPrefixes: ['/theory', '/learn']
  },
  // {
  //   href: '/cheat-sheets',
  //   icon: Braces,
  //   label: 'Cheat Sheets',
  //   matchPrefixes: ['/cheat-sheets']
  // },
  {
    href: '/practice',
    icon: Target,
    label: 'Practice',
    matchPrefixes: ['/practice']
  },
  {
    href: '/grid',
    icon: GridLogoIcon,
    label: 'Grid',
    matchPrefixes: ['/grid']
  },
  {
    href: '/stats',
    icon: TrendingUp,
    label: 'Stats',
    matchPrefixes: ['/stats']
  },
];

/**
 * Pages that render their own full-bleed background imagery (hero photos, etc.)
 * should opt out of the global grid/scanline overlays so the image isn't crosshatched.
 * Nav still shows on these pages (unless also covered by `shouldHideNav`).
 */
export const hasCustomBackground = (pathname?: string | null) => {
  if (!pathname) return false;
  return pathname === '/home';
};

export const shouldHideNav = (pathname?: string | null, isAuthenticated?: boolean) => {
  if (!pathname) return false;
  // Hide nav on the landing-style marketing pages and auth pages (own header included).
  if (pathname === '/' || pathname === '/topics') return true;
  if (pathname.startsWith('/topics/')) return true;
  if (pathname.startsWith('/beta-card')) return true;
  const authPages = ['/login', '/signup'];
  if (authPages.includes(pathname)) return true;
  // Hide nav on public pages when not authenticated
  const publicPages = ['/privacy', '/terms', '/support'];
  if (!isAuthenticated && publicPages.includes(pathname)) return true;
  return false;
};

export const isTheoryLessonPath = (pathname?: string | null) =>
  Boolean(pathname && /^\/learn\/[^/]+\/theory\/[^/]+(?:\/)?$/.test(pathname));

/**
 * Public / marketing surfaces that should render the shared landing footer.
 * Excluded intentionally:
 *  - `/`              (LandingPage renders LandingFooter inline)
 *  - `/privacy`       (page renders its own inline copyright footer)
 */
const LANDING_FOOTER_PATHS = new Set<string>([
  '/topics',
  '/terms',
  '/support'
]);

export const shouldShowLandingFooter = (pathname?: string | null) => {
  if (!pathname) return false;
  if (LANDING_FOOTER_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/topics/')) return true;
  return false;
};

export const isPracticeSessionPath = (pathname?: string | null, search?: string | null) => {
  if (!pathname) return false;
  if (/^\/operations\/practice\/[^/]+\/[^/]+\/[^/]+(?:\/session)?(?:\/)?$/.test(pathname)) return true;
  if (/^\/learn\/[^/]+\/theory\/[^/]+(?:\/)?$/.test(pathname) && search && /[?&]practice=/.test(search)) return true;
  return false;
};

const COMPACT_NAV_PREFIXES = ['/admin', '/cheat-sheets', '/learn', '/practice', '/grid', '/stats'];

export const isCompactDesktopNavPath = (pathname?: string | null) => {
  if (!pathname) return false;
  if (pathname === '/theory') return true;
  if (isTheoryLessonPath(pathname) || isPracticeSessionPath(pathname)) return true;
  return COMPACT_NAV_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
};

export const isNavItemActive = (pathname: string | null, item: NavItem) =>
  Boolean(
    item.matchPrefixes
      ? item.matchPrefixes.some(
          (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
        )
      : pathname === item.href || pathname?.startsWith(`${item.href}/`)
  );
