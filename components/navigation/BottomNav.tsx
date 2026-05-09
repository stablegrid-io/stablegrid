'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { isNavItemActive, navItems, shouldHideNav } from './navigation-config';

export const BottomNav = () => {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (shouldHideNav(pathname, Boolean(user))) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-on-surface flex justify-around items-center lg:hidden"
      style={{
        height: 'calc(4rem + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {navItems.filter((item) => !item.disabled).map((item) => {
        const Icon = item.icon;
        const isActive = isNavItemActive(pathname, item);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
              isActive
                ? 'text-primary border-t-2 border-primary -mt-px'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={1.5} />
            <span className="font-ui-label text-[10px] uppercase tracking-wider">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
