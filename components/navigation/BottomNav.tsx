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
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-surface-container-high border-t border-white/10 flex justify-around items-center lg:hidden">
      {navItems.filter((item) => !item.disabled).map((item) => {
        const Icon = item.icon;
        const isActive = isNavItemActive(pathname, item);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
          >
            <Icon
              className={`h-5 w-5 transition-colors ${
                isActive ? 'text-primary' : 'text-slate-500'
              }`}
            />
            <span
              className={`font-mono text-[9px] uppercase tracking-wider transition-colors ${
                isActive ? 'text-primary' : 'text-slate-500'
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}

      <div className="h-safe-bottom bg-surface-container-high" />
    </nav>
  );
};
